// DMCA claim submission. Stores claim in dmca_claims table.
// Auth optional (anonymous claims allowed per DMCA process).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DmcaClaimBody {
  claimant_name: string;
  claimant_email: string;
  claimant_address?: string;
  copyrighted_work_description: string;
  infringing_content_url: string;
  infringing_content_id?: string;
  infringing_content_type?: string;
  good_faith_statement: boolean;
  accuracy_statement: boolean;
  electronic_signature: string;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as DmcaClaimBody;

    // Validation
    const errors: string[] = [];
    if (!body.claimant_name || body.claimant_name.trim().length < 2)
      errors.push("Name is required");
    if (!body.claimant_email || !isEmail(body.claimant_email))
      errors.push("Valid email required");
    if (
      !body.copyrighted_work_description ||
      body.copyrighted_work_description.trim().length < 10
    )
      errors.push("Description of copyrighted work is required (min 10 chars)");
    if (
      !body.infringing_content_url ||
      body.infringing_content_url.trim().length < 5
    )
      errors.push("URL/ID of infringing content is required");
    if (!body.good_faith_statement)
      errors.push("Good faith statement must be confirmed");
    if (!body.accuracy_statement)
      errors.push("Accuracy statement must be confirmed");
    if (!body.electronic_signature || body.electronic_signature.trim().length < 2)
      errors.push("Electronic signature required");

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join("; ") }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Best-effort capture of submitting user
    let claimantUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData } = await userClient.auth.getUser();
      claimantUserId = userData.user?.id ?? null;
    }

    const { data, error } = await supabase
      .from("dmca_claims")
      .insert({
        claimant_user_id: claimantUserId,
        claimant_name: body.claimant_name.trim(),
        claimant_email: body.claimant_email.trim().toLowerCase(),
        claimant_address: body.claimant_address?.trim() || null,
        copyrighted_work_description: body.copyrighted_work_description.trim(),
        infringing_content_url: body.infringing_content_url.trim(),
        infringing_content_id: body.infringing_content_id || null,
        infringing_content_type: body.infringing_content_type || null,
        good_faith_statement: body.good_faith_statement,
        accuracy_statement: body.accuracy_statement,
        electronic_signature: body.electronic_signature.trim(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        claim_id: data.id,
        message:
          "Your DMCA claim has been received. Our team will review it within 5 business days. A copy has been logged to dmca@latenapp.com.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("DMCA submission error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
