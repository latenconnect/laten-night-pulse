import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[BOOST-NOTIFICATION] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // --- AUTH: require a valid JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");
    const oneSignalApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!oneSignalAppId || !oneSignalApiKey) {
      throw new Error("OneSignal credentials not configured");
    }

    const { eventId, eventName, eventCity, hostName, startTime } = await req.json();

    if (!eventId || !eventName || !eventCity) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- AUTHZ: verify caller owns the event being boosted ---
    const { data: eventRow, error: evErr } = await supabaseClient
      .from("events")
      .select("id, host_id, city, hosts:host_id ( user_id )")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr || !eventRow) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // event.hosts may be returned as object or array depending on PostgREST inference
    const hostUserId = Array.isArray((eventRow as any).hosts)
      ? (eventRow as any).hosts[0]?.user_id
      : (eventRow as any).hosts?.user_id;

    // Allow event host or admin
    let isAdmin = false;
    const { data: adminCheck } = await supabaseClient.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    isAdmin = !!adminCheck;

    if (hostUserId !== callerId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Sending notification for boosted event", { eventId, eventName, eventCity });

    // Get all push tokens for users in the same city
    const { data: cityUsers, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('city', eventCity);

    if (usersError) {
      logStep("Error fetching city users", { error: usersError.message });
      throw usersError;
    }

    if (!cityUsers || cityUsers.length === 0) {
      logStep("No users in city", { city: eventCity });
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = cityUsers.map(u => u.id);
    logStep("Found users in city", { count: userIds.length });

    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (tokensError) {
      logStep("Error fetching tokens", { error: tokensError.message });
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      logStep("No active push tokens found");
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const playerIds = tokens.map(t => t.token);
    logStep("Sending to push tokens", { count: playerIds.length });

    const eventDate = startTime ? new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) : '';

    const notificationPayload = {
      app_id: oneSignalAppId,
      include_player_ids: playerIds,
      headings: { en: `🚀 Hot Event in ${eventCity}!` },
      contents: {
        en: `${eventName}${hostName ? ` by ${hostName}` : ''}${eventDate ? ` - ${eventDate}` : ''}`
      },
      data: {
        type: 'boosted_event',
        eventId,
      },
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
    };

    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const oneSignalResult = await oneSignalResponse.json();
    logStep("OneSignal response", { status: oneSignalResponse.status, result: oneSignalResult });

    if (!oneSignalResponse.ok) {
      throw new Error(`OneSignal error: ${JSON.stringify(oneSignalResult)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      sent: playerIds.length,
      recipients: oneSignalResult.recipients || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
