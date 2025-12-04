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
    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

    if (!fcmServerKey) {
      console.log("FCM_SERVER_KEY not configured - notifications disabled");
      return new Response(
        JSON.stringify({ success: false, message: "Push notifications not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: NotificationPayload = await req.json();

    const { type, userIds, eventId, title, body, data } = payload;

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
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active tokens found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notifications via FCM
    const notificationPromises = tokens.map(async (tokenData) => {
      const fcmPayload = {
        to: tokenData.token,
        notification: {
          title,
          body,
          sound: "default",
          badge: 1,
        },
        data: {
          type,
          eventId: eventId || "",
          ...data,
        },
        // iOS specific
        content_available: true,
        // Android specific
        priority: "high",
      };

      try {
        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${fcmServerKey}`,
          },
          body: JSON.stringify(fcmPayload),
        });

        const result = await response.json();
        
        // Handle invalid tokens
        if (result.failure && result.results?.[0]?.error === "NotRegistered") {
          // Mark token as inactive
          await supabase
            .from("push_tokens")
            .update({ is_active: false })
            .eq("token", tokenData.token);
          
          return { success: false, reason: "token_invalid" };
        }

        return { success: result.success === 1, result };
      } catch (error) {
        console.error("FCM send error:", error);
        return { success: false, error };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: tokens.length,
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
