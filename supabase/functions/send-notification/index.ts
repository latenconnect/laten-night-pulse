import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const NotificationInputSchema = z.object({
  type: z.enum(["event_reminder", "rsvp_update", "new_event"]),
  userIds: z.array(z.string().uuid()).max(1000).optional(),
  eventId: z.string().uuid().optional(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: z.record(z.string(), z.string()).optional(),
});

type NotificationPayload = z.infer<typeof NotificationInputSchema>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const rawBody = await req.json();
    
    // Validate input
    const parseResult = NotificationInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.warn("Invalid input:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input parameters",
          details: parseResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotificationPayload = parseResult.data;

    const { type, userIds, eventId, title, body, data } = payload;

    console.log("Notification request:", { type, userIds, eventId, title });

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

    const notificationData: Record<string, string> = {
      type,
      ...(eventId && { eventId }),
      ...data,
    };

    const playerIds = tokens.map(t => t.token);

    const oneSignalPayload = {
      app_id: oneSignalAppId,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: body },
      data: notificationData,
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
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
