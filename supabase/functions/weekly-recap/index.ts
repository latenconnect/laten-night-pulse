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

    // Parse request - can be for specific user or batch
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

    console.log("Weekly recap triggered:", { userId, batchMode });

    // Calculate week boundaries (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - diffToMonday - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);
    
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    const weekStartStr = lastWeekStart.toISOString().split('T')[0];
    const weekEndStr = lastWeekEnd.toISOString().split('T')[0];

    console.log(`Generating recap for week: ${weekStartStr} to ${weekEndStr}`);

    // Get users to generate recaps for
    let targetUserIds: string[] = [];
    
    if (userId) {
      targetUserIds = [userId];
    } else if (batchMode) {
      // Get all users who have RSVPed in the last week
      const { data: activeUsers } = await supabase
        .from('event_rsvps')
        .select('user_id')
        .gte('created_at', lastWeekStart.toISOString())
        .lte('created_at', lastWeekEnd.toISOString());
      
      targetUserIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users to process", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which users already have recaps for this week
    const { data: existingRecaps } = await supabase
      .from('weekly_recaps')
      .select('user_id')
      .eq('week_start', weekStartStr);

    const existingUserIds = new Set(existingRecaps?.map(r => r.user_id) || []);
    const usersToProcess = targetUserIds.filter(id => !existingUserIds.has(id));

    const results: { userId: string; success: boolean }[] = [];

    for (const targetUserId of usersToProcess) {
      try {
        // Get RSVPs for the week
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select(`
            event_id,
            events (
              id,
              type,
              location_name
            )
          `)
          .eq('user_id', targetUserId)
          .gte('created_at', lastWeekStart.toISOString())
          .lte('created_at', lastWeekEnd.toISOString());

        const totalRsvps = rsvps?.length || 0;
        const eventsAttended = totalRsvps; // Simplified: count RSVPs as attended

        // Calculate top event type
        const typeCounts: Record<string, number> = {};
        rsvps?.forEach(r => {
          const event = r.events as { type?: string } | null;
          if (event?.type) {
            typeCounts[event.type] = (typeCounts[event.type] || 0) + 1;
          }
        });
        const topEventType = Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        // Get current streak
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('current_streak')
          .eq('user_id', targetUserId)
          .single();

        const streakAtWeekEnd = streakData?.current_streak || 0;

        // Count friends met (users who RSVPed to same events)
        const eventIds = rsvps?.map(r => r.event_id) || [];
        let friendsMet = 0;
        
        if (eventIds.length > 0) {
          // Get user's connections
          const { data: connections } = await supabase
            .from('user_connections')
            .select('following_id')
            .eq('follower_id', targetUserId)
            .eq('status', 'active');

          const friendIds = connections?.map(c => c.following_id) || [];

          if (friendIds.length > 0) {
            const { data: friendRsvps } = await supabase
              .from('event_rsvps')
              .select('user_id')
              .in('event_id', eventIds)
              .in('user_id', friendIds);

            friendsMet = new Set(friendRsvps?.map(r => r.user_id)).size;
          }
        }

        // Insert recap
        await supabase.from('weekly_recaps').insert({
          user_id: targetUserId,
          week_start: weekStartStr,
          week_end: weekEndStr,
          events_attended: eventsAttended,
          total_rsvps: totalRsvps,
          top_event_type: topEventType,
          friends_met: friendsMet,
          streak_at_week_end: streakAtWeekEnd,
          highlights: []
        });

        results.push({ userId: targetUserId, success: true });
      } catch (error) {
        console.error(`Error processing user ${targetUserId}:`, error);
        results.push({ userId: targetUserId, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: successCount,
        week: { start: weekStartStr, end: weekEndStr }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in weekly-recap:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
