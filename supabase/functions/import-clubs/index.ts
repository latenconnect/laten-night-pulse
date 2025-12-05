import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hungarian cities with coordinates and recommended radius (km)
// Budapest has multiple search points to cover more area
const HUNGARIAN_CITIES = [
  // Budapest - multiple districts for comprehensive coverage
  { name: "Budapest", lat: 47.4979, lng: 19.0402, radius: 8000, area: "center" }, // City center
  { name: "Budapest", lat: 47.5074, lng: 19.0454, radius: 5000, area: "district7" }, // Party district (VII)
  { name: "Budapest", lat: 47.4733, lng: 19.0621, radius: 6000, area: "district9" }, // IX district
  { name: "Budapest", lat: 47.5225, lng: 19.0514, radius: 5000, area: "district6" }, // VI district 
  { name: "Budapest", lat: 47.4869, lng: 19.0178, radius: 6000, area: "buda" }, // Buda side
  { name: "Budapest", lat: 47.5384, lng: 19.0705, radius: 5000, area: "district13" }, // XIII district
  // Other cities
  { name: "Debrecen", lat: 47.5316, lng: 21.6273, radius: 15000, area: "main" },
  { name: "Szeged", lat: 46.253, lng: 20.1414, radius: 15000, area: "main" },
  { name: "Pécs", lat: 46.0727, lng: 18.2323, radius: 15000, area: "main" },
  { name: "Győr", lat: 47.6875, lng: 17.6504, radius: 15000, area: "main" },
  { name: "Siófok", lat: 46.9048, lng: 18.0486, radius: 20000, area: "main" },
  { name: "Miskolc", lat: 48.1035, lng: 20.7784, radius: 15000, area: "main" },
  { name: "Eger", lat: 47.9025, lng: 20.3772, radius: 12000, area: "main" },
  { name: "Veszprém", lat: 47.0933, lng: 17.9115, radius: 12000, area: "main" },
  { name: "Székesfehérvár", lat: 47.1896, lng: 18.4105, radius: 12000, area: "main" },
  { name: "Sopron", lat: 47.6851, lng: 16.5903, radius: 12000, area: "main" },
  { name: "Nyíregyháza", lat: 47.9554, lng: 21.7177, radius: 12000, area: "main" },
  { name: "Kaposvár", lat: 46.3594, lng: 17.7968, radius: 12000, area: "main" },
  { name: "Balatonfüred", lat: 46.9579, lng: 17.8903, radius: 15000, area: "main" },
  { name: "Tokaj", lat: 48.1172, lng: 21.4097, radius: 10000, area: "main" },
  { name: "Kecskemét", lat: 46.8964, lng: 19.6897, radius: 12000, area: "main" },
  { name: "Dunaújváros", lat: 46.9619, lng: 18.9355, radius: 10000, area: "main" },
  { name: "Esztergom", lat: 47.7858, lng: 18.7403, radius: 10000, area: "main" },
  { name: "Hévíz", lat: 46.7903, lng: 17.1892, radius: 15000, area: "main" },
  { name: "Zamárdi", lat: 46.8833, lng: 17.9500, radius: 15000, area: "main" },
];

// Venue types to search for - nightlife venues only
const VENUE_TYPES = ["bar", "night_club", "pub"];

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  priceLevel?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  photos?: Array<{ name: string }>;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
}

interface SearchResponse {
  places?: PlaceResult[];
  nextPageToken?: string;
}

async function searchNearby(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  includedTypes: string[],
  pageToken?: string
): Promise<SearchResponse> {
  const url = "https://places.googleapis.com/v1/places:searchNearby";
  
  const body: any = {
    includedTypes,
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radius,
      },
    },
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.googleMapsUri,places.businessStatus,places.photos,places.regularOpeningHours",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Search Nearby error:", error);
    throw new Error(`Search Nearby failed: ${response.status}`);
  }

  return response.json();
}

async function getPhotoUrl(apiKey: string, photoName: string, maxWidth: number = 400): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
    // Return the URL directly - Google will redirect to the actual image
    return url;
  } catch (error) {
    console.error("Error getting photo URL:", error);
    return null;
  }
}

function mapPriceLevel(priceLevel?: string): number | null {
  if (!priceLevel) return null;
  const mapping: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return mapping[priceLevel] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (roleError || !isAdmin) {
      console.error("Admin check failed:", roleError?.message || "User is not admin");
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${user.email} authorized for import`);

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    // Parse request body for optional parameters
    let targetCity: string | null = null;
    let maxPlacesPerCity = 100;
    
    try {
      const body = await req.json();
      targetCity = body.city || null;
      maxPlacesPerCity = body.maxPlacesPerCity || 100;
    } catch {
      // No body provided, use defaults
    }

    const citiesToProcess = targetCity
      ? HUNGARIAN_CITIES.filter((c) => c.name.toLowerCase() === targetCity.toLowerCase())
      : HUNGARIAN_CITIES;

    if (citiesToProcess.length === 0) {
      return new Response(
        JSON.stringify({ error: "City not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalImported = 0;
    let totalSkipped = 0;
    const results: Record<string, { imported: number; skipped: number }> = {};

    for (const city of citiesToProcess) {
      console.log(`Processing city: ${city.name}`);
      let cityImported = 0;
      let citySkipped = 0;
      const seenPlaceIds = new Set<string>();

      for (const venueType of VENUE_TYPES) {
        if (cityImported >= maxPlacesPerCity) break;

        let pageToken: string | undefined;
        let pageCount = 0;
        const maxPages = 5; // Increased for better coverage

        do {
          try {
            console.log(`Searching ${venueType} in ${city.name}, page ${pageCount + 1}`);
            
            const searchResult = await searchNearby(
              apiKey,
              city.lat,
              city.lng,
              city.radius,
              [venueType],
              pageToken
            );

            if (!searchResult.places || searchResult.places.length === 0) {
              console.log(`No results for ${venueType} in ${city.name}`);
              break;
            }

            for (const place of searchResult.places) {
              if (cityImported >= maxPlacesPerCity) break;
              if (seenPlaceIds.has(place.id)) continue;
              seenPlaceIds.add(place.id);

              // Check if place already exists
              const { data: existing } = await supabase
                .from("clubs")
                .select("id")
                .eq("google_place_id", place.id)
                .single();

              if (existing) {
                citySkipped++;
                continue;
              }

              // Get photo URLs (max 2)
              const photoUrls: string[] = [];
              if (place.photos && place.photos.length > 0) {
                for (const photo of place.photos.slice(0, 2)) {
                  const photoUrl = await getPhotoUrl(apiKey, photo.name);
                  if (photoUrl) photoUrls.push(photoUrl);
                }
              }

              // Prepare opening hours data
              const openingHours = place.regularOpeningHours ? {
                open_now: place.regularOpeningHours.openNow,
                weekday_text: place.regularOpeningHours.weekdayDescriptions,
              } : null;

              // Insert into database
              const { error: insertError } = await supabase.from("clubs").insert({
                google_place_id: place.id,
                name: place.displayName?.text || "Unknown Venue",
                address: place.formattedAddress || null,
                city: city.name,
                country: "Hungary",
                latitude: place.location?.latitude || city.lat,
                longitude: place.location?.longitude || city.lng,
                rating: place.rating || null,
                price_level: mapPriceLevel(place.priceLevel),
                photos: photoUrls.length > 0 ? photoUrls : null,
                google_maps_uri: place.googleMapsUri || null,
                business_status: place.businessStatus || null,
                opening_hours: openingHours,
                venue_type: venueType,
                is_active: true,
              });

              if (insertError) {
                console.error(`Error inserting ${place.displayName?.text}:`, insertError);
              } else {
                cityImported++;
                console.log(`Imported: ${place.displayName?.text} (${city.name})`);
              }
            }

            pageToken = searchResult.nextPageToken;
            pageCount++;

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`Error searching ${venueType} in ${city.name}:`, error);
            break;
          }
        } while (pageToken && pageCount < maxPages && cityImported < maxPlacesPerCity);
      }

      results[city.name] = { imported: cityImported, skipped: citySkipped };
      totalImported += cityImported;
      totalSkipped += citySkipped;

      console.log(`${city.name}: imported ${cityImported}, skipped ${citySkipped}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalImported,
        totalSkipped,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
