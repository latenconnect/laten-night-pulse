import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationPayload {
  type: "dj_booking" | "bartender_booking";
  professionalUserId: string;
  professionalName: string;
  bookerName: string;
  eventDate: string;
  eventType: string;
  eventLocation?: string;
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

    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's JWT to verify they're logged in
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
      console.log("OneSignal credentials not configured - notifications disabled");
      return new Response(
        JSON.stringify({ success: false, message: "Push notifications not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: BookingNotificationPayload = await req.json();

    const { type, professionalUserId, professionalName, bookerName, eventDate, eventType, eventLocation } = payload;

    console.log("Booking notification request:", { type, professionalUserId, professionalName, eventDate });

    // Get push tokens for the professional
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, platform, user_id")
      .eq("user_id", professionalUserId)
      .eq("is_active", true);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No active tokens found for professional:", professionalUserId);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active tokens found for professional" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${tokens.length} active tokens for professional`);

    // Build notification content
    const title = type === "dj_booking" ? "New DJ Booking Request! 🎵" : "New Bartender Booking Request! 🍸";
    const body = `${bookerName} wants to book you for ${eventType} on ${eventDate}${eventLocation ? ` at ${eventLocation}` : ""}`;

    const notificationData = {
      type: "booking_request",
      bookingType: type,
      eventDate,
      eventType,
    };

    // Send via OneSignal REST API
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

    console.log("Sending booking notification to OneSignal with", playerIds.length, "player IDs");

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
        message: `Booking notification sent successfully`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-booking-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
