import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowlist of hostnames the proxy is permitted to fetch from.
// Keep this tight — anything not on this list is rejected to prevent SSRF
// and open-proxy abuse.
const ALLOWED_HOSTS = new Set<string>([
  // Google Places / Maps photo hosts
  "maps.googleapis.com",
  "places.googleapis.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "streetviewpixels-pa.googleapis.com",
  // Supabase storage (this project)
  "huigwbyctzjictnaycjj.supabase.co",
]);

function isAllowedUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "Only https is allowed" };
  }
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    return { ok: false, reason: "Host not allowed" };
  }
  return { ok: true, url };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const check = isAllowedUrl(imageUrl);
    if (!check.ok) {
      console.warn("[PROXY-IMAGE] Rejected URL:", check.reason, imageUrl.slice(0, 120));
      return new Response(JSON.stringify({ error: check.reason }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[PROXY-IMAGE] Fetching:", check.url.toString().slice(0, 120));

    const response = await fetch(check.url.toString(), {
      headers: { Accept: "image/*" },
      redirect: "follow",
    });

    if (!response.ok) {
      console.error("[PROXY-IMAGE] Upstream failed:", response.status);
      return new Response(JSON.stringify({ error: "Failed to fetch image" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      console.warn("[PROXY-IMAGE] Non-image content-type rejected:", contentType);
      return new Response(JSON.stringify({ error: "Upstream is not an image" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[PROXY-IMAGE] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
