import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
    const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

    // Verify the caller
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role for batch operations
    const { data: isAdmin } = await userSupabase.rpc("has_role", { 
      _user_id: user.id, 
      _role: "admin" 
    });

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body - can be called with specific userId or batch mode
    const { userId, batchMode = false } = await req.json().catch(() => ({}));

    // Only admins can trigger batch mode or send to other users
    if (batchMode || (userId && userId !== user.id)) {
      if (!isAdmin) {
        console.warn(`Non-admin user ${user.id} attempted batch/other-user operation`);
        return new Response(
          JSON.stringify({ error: "Admin access required for batch operations" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Tonight's Picks triggered:", { userId, batchMode, caller: user.id });

    // Get users who want tonight's picks (check if 6PM in their timezone - simplified to UTC for now)
    let usersQuery = supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("tonights_picks_enabled", true);

    if (userId) {
      usersQuery = usersQuery.eq("user_id", userId);
    }

    const { data: prefUsers, error: prefError } = await usersQuery;

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      throw prefError;
    }

    // If no preferences found but userId provided, create default and continue
    let targetUserIds = prefUsers?.map(p => p.user_id) || [];
    
    if (userId && targetUserIds.length === 0) {
      // User hasn't set preferences, use default (enabled)
      targetUserIds = [userId];
    }

    if (targetUserIds.length === 0) {
      console.log("No users with tonight's picks enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No users to notify", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which users already received tonight's picks today
    const today = new Date().toISOString().split('T')[0];
    const { data: alreadySent } = await supabase
      .from("scheduled_notifications")
      .select("user_id")
      .eq("notification_type", "tonights_picks")
      .gte("sent_at", `${today}T00:00:00Z`);

    const alreadySentIds = new Set(alreadySent?.map(n => n.user_id) || []);
    const usersToNotify = targetUserIds.filter(id => !alreadySentIds.has(id));

    if (usersToNotify.length === 0) {
      console.log("All users already notified today");
      return new Response(
        JSON.stringify({ success: true, message: "All users already notified today", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tonight's events (events starting between now and midnight)
    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(23, 59, 59, 999);

    const { data: tonightsEvents, error: eventsError } = await supabase
      .from("events")
      .select(`
        id,
        name,
        type,
        city,
        location_name,
        start_time,
        price,
        cover_image,
        host_id
      `)
      .eq("is_active", true)
      .gte("start_time", now.toISOString())
      .lte("start_time", tonight.toISOString())
      .order("start_time", { ascending: true })
      .limit(10);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    if (!tonightsEvents || tonightsEvents.length === 0) {
      console.log("No events tonight");
      return new Response(
        JSON.stringify({ success: true, message: "No events tonight", sent: 0, events: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${tonightsEvents.length} events tonight`);

    // For each user, get personalized picks based on their preferences
    const results: { userId: string; sent: boolean; eventCount: number }[] = [];

    for (const targetUserId of usersToNotify) {
      // Get user's city preference
      const { data: profile } = await supabase
        .from("profiles")
        .select("city")
        .eq("id", targetUserId)
        .single();

      // Get user's event type preferences
      const { data: userPrefs } = await supabase
        .from("user_preferences")
        .select("pref_club, pref_house_party, pref_university, pref_festival, pref_public")
        .eq("user_id", targetUserId)
        .single();

      // Score and sort events for this user
      const scoredEvents = tonightsEvents.map(event => {
        let score = 50; // Base score

        // City match
        if (profile?.city && event.city?.toLowerCase() === profile.city.toLowerCase()) {
          score += 30;
        }

        // Event type preference
        if (userPrefs) {
          const typeKey = `pref_${event.type}` as keyof typeof userPrefs;
          const typePref = userPrefs[typeKey];
          if (typeof typePref === 'number') {
            score += typePref * 0.3;
          }
        }

        return { ...event, score };
      }).sort((a, b) => b.score - a.score).slice(0, 3);

      // Build notification message
      const eventNames = scoredEvents.map(e => e.name).slice(0, 2).join(", ");
      const moreCount = scoredEvents.length > 2 ? ` +${scoredEvents.length - 2} more` : "";

      // Record that we sent this notification
      await supabase.from("scheduled_notifications").insert({
        user_id: targetUserId,
        notification_type: "tonights_picks",
        event_ids: scoredEvents.map(e => e.id),
        metadata: { event_count: scoredEvents.length }
      });

      // Send push notification if OneSignal is configured
      if (oneSignalAppId && oneSignalApiKey) {
        const { data: tokens } = await supabase
          .from("push_tokens")
          .select("token")
          .eq("user_id", targetUserId)
          .eq("is_active", true);

        if (tokens && tokens.length > 0) {
          const playerIds = tokens.map(t => t.token);

          await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${oneSignalApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              app_id: oneSignalAppId,
              include_player_ids: playerIds,
              headings: { en: "🎉 Tonight's Picks" },
              contents: { en: `${eventNames}${moreCount} - See what's happening tonight!` },
              data: {
                type: "tonights_picks",
                eventIds: scoredEvents.map(e => e.id),
              },
              ios_badgeType: "Increase",
              ios_badgeCount: 1,
            }),
          });
        }
      }

      results.push({
        userId: targetUserId,
        sent: true,
        eventCount: scoredEvents.length
      });
    }

    console.log(`Sent tonight's picks to ${results.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.length,
        events: tonightsEvents.slice(0, 5),
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in tonights-picks:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
