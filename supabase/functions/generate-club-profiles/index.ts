import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClubProfile {
  description: string;
  services: string[];
  highlights: string[];
  music_genres: string[];
  crowd_info: {
    age_range: string;
    dress_code: string;
    atmosphere: string;
    best_for: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 10, offset = 0, club_id } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get clubs to process
    let query = supabase
      .from("clubs")
      .select("id, name, city, venue_type, address, rating, price_level, opening_hours")
      .eq("is_active", true)
      .is("description", null); // Only clubs without description

    if (club_id) {
      query = supabase
        .from("clubs")
        .select("id, name, city, venue_type, address, rating, price_level, opening_hours")
        .eq("id", club_id);
    } else {
      query = query.range(offset, offset + batch_size - 1);
    }

    const { data: clubs, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!clubs || clubs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No clubs to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${clubs.length} clubs starting at offset ${offset}`);

    const results = [];

    for (const club of clubs) {
      try {
        console.log(`Generating profile for: ${club.name}`);

        const prompt = `Generate a detailed profile for this nightlife venue in JSON format:

Venue: ${club.name}
Location: ${club.address}, ${club.city}
Type: ${club.venue_type || "bar/club"}
Rating: ${club.rating || "N/A"}/5
Price Level: ${club.price_level ? "$".repeat(club.price_level) : "N/A"}
Opening Hours: ${club.opening_hours ? JSON.stringify(club.opening_hours) : "N/A"}

Create an engaging, informative profile. Be creative but realistic. Use Hungarian context for venues in Hungary.

Return ONLY valid JSON with this structure:
{
  "description": "2-3 sentence engaging description of the venue atmosphere and vibe",
  "services": ["5-8 services like 'Cocktail Bar', 'Dance Floor', 'VIP Area', 'Outdoor Terrace', 'Live DJ', 'Bottle Service'"],
  "highlights": ["3-5 key highlights like 'Best rooftop view in the city', 'Famous for craft cocktails'"],
  "music_genres": ["2-4 genres played like 'House', 'Techno', 'Pop Hits', 'Live Music'"],
  "crowd_info": {
    "age_range": "e.g., '21-35'",
    "dress_code": "e.g., 'Smart Casual' or 'Casual' or 'Dress to Impress'",
    "atmosphere": "e.g., 'Energetic party vibes' or 'Relaxed lounge atmosphere'",
    "best_for": "e.g., 'Group celebrations' or 'Date nights' or 'After-work drinks'"
  }
}`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a nightlife expert who writes engaging venue descriptions. Always respond with valid JSON only, no markdown or extra text.",
              },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log("Rate limited, stopping batch");
            return new Response(
              JSON.stringify({
                message: "Rate limited - try again later",
                processed: results.length,
                results,
              }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw new Error(`AI API error: ${response.status}`);
        }

        const aiResponse = await response.json();
        const content = aiResponse.choices?.[0]?.message?.content;

        if (!content) {
          console.error(`No content for ${club.name}`);
          continue;
        }

        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = content.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
        }

        const profile: ClubProfile = JSON.parse(jsonStr);

        // Update club in database
        const { error: updateError } = await supabase
          .from("clubs")
          .update({
            description: profile.description,
            services: profile.services,
            highlights: profile.highlights,
            music_genres: profile.music_genres,
            crowd_info: profile.crowd_info,
          })
          .eq("id", club.id);

        if (updateError) {
          console.error(`Failed to update ${club.name}:`, updateError);
          results.push({ id: club.id, name: club.name, status: "error", error: updateError.message });
        } else {
          console.log(`Updated: ${club.name}`);
          results.push({ id: club.id, name: club.name, status: "success" });
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (clubError) {
        console.error(`Error processing ${club.name}:`, clubError);
        results.push({
          id: club.id,
          name: club.name,
          status: "error",
          error: clubError instanceof Error ? clubError.message : "Unknown error",
        });
      }
    }

    // Get count of remaining clubs
    const { count: remaining } = await supabase
      .from("clubs")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("description", null);

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} clubs`,
        processed: results.length,
        remaining: remaining || 0,
        next_offset: offset + batch_size,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-club-profiles error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
