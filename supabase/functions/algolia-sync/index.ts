import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALGOLIA_APP_ID = Deno.env.get('ALGOLIA_APP_ID')!;
const ALGOLIA_ADMIN_API_KEY = Deno.env.get('ALGOLIA_ADMIN_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting Algolia sync...');

    // Fetch all active events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, description, type, city, location_name, location_address, start_time, end_time, price, cover_image, is_featured')
      .eq('is_active', true);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    // Fetch all active clubs
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name, address, city, venue_type, rating, price_level, photos, google_maps_uri')
      .eq('is_active', true);

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError);
      throw clubsError;
    }

    // Format events for Algolia
    const eventRecords = (events || []).map(event => ({
      objectID: `event_${event.id}`,
      id: event.id,
      type: 'event',
      name: event.name,
      description: event.description,
      eventType: event.type,
      city: event.city,
      locationName: event.location_name,
      locationAddress: event.location_address,
      startTime: event.start_time,
      endTime: event.end_time,
      price: event.price,
      coverImage: event.cover_image,
      isFeatured: event.is_featured,
    }));

    // Format clubs for Algolia
    const clubRecords = (clubs || []).map(club => ({
      objectID: `club_${club.id}`,
      id: club.id,
      type: 'club',
      name: club.name,
      address: club.address,
      city: club.city,
      venueType: club.venue_type,
      rating: club.rating,
      priceLevel: club.price_level,
      photo: club.photos?.[0] || null,
      googleMapsUri: club.google_maps_uri,
    }));

    const allRecords = [...eventRecords, ...clubRecords];

    // Send to Algolia
    const indexName = 'laten_search';
    const algoliaUrl = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/batch`;

    const batchRequests = allRecords.map(record => ({
      action: 'updateObject',
      body: record,
    }));

    const response = await fetch(algoliaUrl, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_ADMIN_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: batchRequests }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Algolia error:', errorText);
      throw new Error(`Algolia sync failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Algolia sync completed:', result);

    // Configure searchable attributes and ranking
    const settingsUrl = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/settings`;
    await fetch(settingsUrl, {
      method: 'PUT',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_ADMIN_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchableAttributes: ['name', 'description', 'locationName', 'locationAddress', 'address', 'city', 'venueType', 'eventType'],
        attributesForFaceting: ['type', 'city', 'eventType', 'venueType'],
        customRanking: ['desc(isFeatured)', 'desc(rating)'],
      }),
    });

    return new Response(JSON.stringify({
      success: true,
      eventsIndexed: eventRecords.length,
      clubsIndexed: clubRecords.length,
      totalRecords: allRecords.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in algolia-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
