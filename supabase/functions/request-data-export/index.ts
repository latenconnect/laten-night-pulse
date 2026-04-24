// GDPR Right to Data Portability — generates a JSON export of the
// authenticated user's data and stores it in the user-exports storage bucket.
// Returns a signed URL valid for 7 days.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXPORT_BUCKET = "user-exports";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limit: only one pending export at a time
    const { data: pending } = await admin
      .from("data_export_requests")
      .select("id, status, requested_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "You already have a pending export request",
          request_id: pending.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create the request row
    const { data: requestRow, error: reqErr } = await admin
      .from("data_export_requests")
      .insert({ user_id: userId, status: "pending" })
      .select("id")
      .single();
    if (reqErr) throw reqErr;
    const requestId = requestRow.id;

    // Aggregate the user's data
    const tablesToExport: Array<{ name: string; query: () => Promise<unknown> }> = [
      {
        name: "profile",
        query: async () =>
          (await admin.from("profiles").select("*").eq("id", userId).maybeSingle()).data,
      },
      {
        name: "events_created",
        query: async () =>
          (
            await admin
              .from("events")
              .select("*")
              .in(
                "host_id",
                (
                  await admin.from("hosts").select("id").eq("user_id", userId)
                ).data?.map((h: { id: string }) => h.id) ?? [],
              )
          ).data,
      },
      {
        name: "event_rsvps",
        query: async () =>
          (await admin.from("event_rsvps").select("*").eq("user_id", userId)).data,
      },
      {
        name: "saved_events",
        query: async () =>
          (await admin.from("saved_events").select("*").eq("user_id", userId)).data,
      },
      {
        name: "user_connections",
        query: async () =>
          (
            await admin
              .from("user_connections")
              .select("*")
              .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
          ).data,
      },
      {
        name: "stories",
        query: async () =>
          (await admin.from("stories").select("*").eq("user_id", userId)).data,
      },
      {
        name: "user_xp",
        query: async () =>
          (await admin.from("user_xp").select("*").eq("user_id", userId).maybeSingle()).data,
      },
      {
        name: "user_reputation",
        query: async () =>
          (await admin.from("user_reputation").select("*").eq("user_id", userId).maybeSingle()).data,
      },
      {
        name: "user_consents",
        query: async () =>
          (await admin.from("user_consents").select("*").eq("user_id", userId)).data,
      },
      {
        name: "content_reports_submitted",
        query: async () =>
          (await admin.from("content_reports").select("*").eq("reporter_id", userId)).data,
      },
      {
        name: "user_blocks",
        query: async () =>
          (await admin.from("user_blocks").select("*").eq("blocker_id", userId)).data,
      },
      {
        name: "dm_conversations",
        query: async () =>
          (
            await admin
              .from("dm_conversations")
              .select("*")
              .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
          ).data,
      },
    ];

    const exportPayload: Record<string, unknown> = {
      _meta: {
        user_id: userId,
        email: userData.user.email,
        exported_at: new Date().toISOString(),
        notice:
          "Direct messages are end-to-end encrypted. Plaintext is only available with your locally-stored private key.",
        retention_policy:
          "Account deletion completes within 30 days. Backups may retain data up to 90 days.",
      },
    };

    for (const t of tablesToExport) {
      try {
        exportPayload[t.name] = await t.query();
      } catch (err) {
        exportPayload[t.name] = { _error: String(err) };
      }
    }

    // Ensure bucket exists (idempotent)
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.find((b) => b.name === EXPORT_BUCKET)) {
      await admin.storage.createBucket(EXPORT_BUCKET, { public: false });
    }

    const fileName = `${userId}/export-${requestId}.json`;
    const json = JSON.stringify(exportPayload, null, 2);
    const { error: uploadErr } = await admin.storage
      .from(EXPORT_BUCKET)
      .upload(fileName, new Blob([json], { type: "application/json" }), {
        upsert: true,
        contentType: "application/json",
      });
    if (uploadErr) throw uploadErr;

    const { data: signed, error: signErr } = await admin.storage
      .from(EXPORT_BUCKET)
      .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);
    if (signErr) throw signErr;

    const expiresAt = new Date(
      Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
    ).toISOString();

    await admin
      .from("data_export_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        download_url: signed.signedUrl,
        expires_at: expiresAt,
      })
      .eq("id", requestId);

    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        download_url: signed.signedUrl,
        expires_at: expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("Data export error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
