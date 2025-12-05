import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: "event_reminder" | "rsvp_update" | "new_event";
  userIds?: string[];
  eventId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is authenticated and has admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's JWT to verify permissions
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: hasAdminRole } = await createClient(supabaseUrl, supabaseServiceKey)
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin user verified:", user.id);
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
    const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!oneSignalAppId || !oneSignalApiKey) {
      console.log("OneSignal credentials not configured - notifications disabled");
      return new Response(
        JSON.stringify({ success: false, message: "Push notifications not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotificationPayload = await req.json();

    const { type, userIds, eventId, title, body, data } = payload;

    console.log("Notification request:", { type, userIds, eventId, title });

    // Get push tokens for the specified users
    let query = supabase
      .from("push_tokens")
      .select("token, platform, user_id")
      .eq("is_active", true);

    if (userIds && userIds.length > 0) {
      query = query.in("user_id", userIds);
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No active tokens found for users:", userIds);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active tokens found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${tokens.length} active tokens`);

    // Prepare notification data
    const notificationData: Record<string, string> = {
      type,
      ...(eventId && { eventId }),
      ...data,
    };

    // Send via OneSignal REST API using player IDs (tokens)
    const playerIds = tokens.map(t => t.token);

    const oneSignalPayload = {
      app_id: oneSignalAppId,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: body },
      data: notificationData,
      // iOS specific
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      // Android specific
      android_channel_id: "default",
      priority: 10,
    };

    console.log("Sending to OneSignal with", playerIds.length, "player IDs");

    const oneSignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${oneSignalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const oneSignalResult = await oneSignalResponse.json();
    console.log("OneSignal response:", JSON.stringify(oneSignalResult));

    if (!oneSignalResponse.ok) {
      // Handle invalid player IDs by marking them inactive
      if (oneSignalResult.errors?.invalid_player_ids) {
        const invalidIds = oneSignalResult.errors.invalid_player_ids;
        console.log("Marking invalid tokens as inactive:", invalidIds.length);
        
        await supabase
          .from("push_tokens")
          .update({ is_active: false })
          .in("token", invalidIds);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "OneSignal API error", 
          details: oneSignalResult 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const successCount = oneSignalResult.recipients || playerIds.length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: tokens.length,
        notificationId: oneSignalResult.id,
        message: `Sent ${successCount} of ${tokens.length} notifications`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
