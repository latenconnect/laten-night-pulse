import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clubId = url.searchParams.get("clubId");
    const photoIndex = parseInt(url.searchParams.get("index") || "0");
    
    if (!clubId) {
      return new Response(JSON.stringify({ error: "Missing clubId parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googleApiKey) {
      console.error("[GET-CLUB-PHOTO] Missing GOOGLE_PLACES_API_KEY");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase to get the club's google_place_id
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: club, error: clubError } = await supabaseClient
      .from("clubs")
      .select("google_place_id, name")
      .eq("id", clubId)
      .single();

    if (clubError || !club?.google_place_id) {
      console.error("[GET-CLUB-PHOTO] Club not found:", clubId, clubError);
      return new Response(JSON.stringify({ error: "Club not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[GET-CLUB-PHOTO] Fetching fresh photo for:", club.name, "placeId:", club.google_place_id);

    // Fetch fresh place details from Google Places API
    const placeDetailsUrl = `https://places.googleapis.com/v1/places/${club.google_place_id}`;
    const placeResponse = await fetch(placeDetailsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask": "photos",
      },
    });

    if (!placeResponse.ok) {
      const errorText = await placeResponse.text();
      console.error("[GET-CLUB-PHOTO] Google Places API error:", placeResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch place details" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const placeData = await placeResponse.json();
    
    if (!placeData.photos || placeData.photos.length === 0) {
      console.log("[GET-CLUB-PHOTO] No photos available for place:", club.google_place_id);
      return new Response(JSON.stringify({ error: "No photos available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the requested photo (or first one)
    const photoRef = placeData.photos[Math.min(photoIndex, placeData.photos.length - 1)];
    const photoName = photoRef.name;

    console.log("[GET-CLUB-PHOTO] Got fresh photo reference:", photoName.substring(0, 50) + "...");

    // Fetch the actual image
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${googleApiKey}`;
    const imageResponse = await fetch(photoUrl, {
      headers: {
        "Accept": "image/*",
      },
    });

    if (!imageResponse.ok) {
      console.error("[GET-CLUB-PHOTO] Failed to fetch image:", imageResponse.status);
      return new Response(JSON.stringify({ error: "Failed to fetch image" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await imageResponse.arrayBuffer();

    console.log("[GET-CLUB-PHOTO] Success! Image size:", imageBuffer.byteLength);

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[GET-CLUB-PHOTO] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
