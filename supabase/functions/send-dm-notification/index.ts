import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DMNotificationPayload {
  recipientId: string;
  senderName: string;
  messagePreview?: string;
  messageType: "text" | "image" | "file";
  conversationId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
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
      console.log("Invalid authentication:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
    const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!oneSignalAppId || !oneSignalApiKey) {
      console.log("OneSignal credentials not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Push notifications not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: DMNotificationPayload = await req.json();

    const { recipientId, senderName, messagePreview, messageType, conversationId } = payload;

    console.log("DM notification request:", { recipientId, senderName, messageType });

    // Don't send notification to yourself
    if (recipientId === user.id) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "Cannot notify yourself" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get push tokens for recipient
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", recipientId)
      .eq("is_active", true);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No active tokens for recipient:", recipientId);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active tokens" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${tokens.length} tokens for recipient`);

    // Build notification content
    const title = `${senderName}`;
    let body = "Sent you a message";
    
    if (messageType === "image") {
      body = "📷 Sent a photo";
    } else if (messageType === "file") {
      body = "📎 Sent a file";
    } else if (messagePreview) {
      // Truncate preview for privacy
      body = messagePreview.length > 50 ? messagePreview.substring(0, 50) + "..." : messagePreview;
    }

    const playerIds = tokens.map(t => t.token);

    const oneSignalPayload = {
      app_id: oneSignalAppId,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: body },
      data: {
        type: "direct_message",
        conversationId,
        senderId: user.id,
        senderName,
      },
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      android_channel_id: "messages",
      priority: 10,
    };

    console.log("Sending DM notification to OneSignal");

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
        JSON.stringify({ success: false, error: "OneSignal API error", details: oneSignalResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: oneSignalResult.recipients || playerIds.length,
        notificationId: oneSignalResult.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-dm-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});