import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALGOLIA_APP_ID = Deno.env.get('ALGOLIA_APP_ID')!;
const ALGOLIA_ADMIN_API_KEY = Deno.env.get('ALGOLIA_ADMIN_API_KEY')!;

// Input validation schema
const SyncInputSchema = z.object({
  type: z.enum(['event', 'club']),
  action: z.enum(['insert', 'update', 'delete']),
  record: z.object({
    id: z.string().uuid(),
  }).passthrough(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This can be called from database webhook or authenticated user
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If auth header is present, verify the user is the event/club owner
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
      }
    }

    const rawBody = await req.json();
    
    // Validate input
    const parseResult = SyncInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.warn('Invalid input:', parseResult.error.errors);
      return new Response(JSON.stringify({ 
        error: 'Invalid input parameters',
        details: parseResult.error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, action, record } = parseResult.data;
    const indexName = 'laten_search';

    console.log(`Processing ${action} for ${type} ${record.id}`);

    // Handle delete action
    if (action === 'delete') {
      const objectID = `${type}_${record.id}`;
      const deleteUrl = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/${objectID}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'X-Algolia-API-Key': ALGOLIA_ADMIN_API_KEY,
          'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Algolia delete error:', errorText);
        throw new Error(`Algolia delete failed: ${errorText}`);
      }

      console.log(`Deleted ${objectID} from Algolia`);
      return new Response(JSON.stringify({ success: true, deleted: objectID }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle insert/update - fetch fresh data from database
    let algoliaRecord: Record<string, unknown>;

    if (type === 'event') {
      const { data: event, error } = await supabase
        .from('events')
        .select('id, name, description, type, city, location_name, location_address, start_time, end_time, price, cover_image, is_featured, is_active, host_id')
        .eq('id', record.id)
        .single();

      if (error || !event) {
        console.error('Error fetching event:', error);
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Skip if event is not active
      if (!event.is_active) {
        // Delete from Algolia if it exists
        const objectID = `event_${event.id}`;
        await fetch(`https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/${objectID}`, {
          method: 'DELETE',
          headers: {
            'X-Algolia-API-Key': ALGOLIA_ADMIN_API_KEY,
            'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          },
        });
        
        return new Response(JSON.stringify({ success: true, skipped: 'Event not active' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify ownership if user is authenticated and not admin
      if (userId) {
        const { data: host } = await supabase
          .from('hosts')
          .select('user_id')
          .eq('id', event.host_id)
          .single();

        if (host?.user_id !== userId) {
          const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
          if (!isAdmin) {
            return new Response(JSON.stringify({ error: 'Not authorized to sync this event' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }

      algoliaRecord = {
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
      };
    } else {
      // Club sync
      const { data: club, error } = await supabase
        .from('clubs')
        .select('id, name, address, city, venue_type, rating, price_level, photos, google_maps_uri, is_active')
        .eq('id', record.id)
        .single();

      if (error || !club) {
        console.error('Error fetching club:', error);
        return new Response(JSON.stringify({ error: 'Club not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Skip if club is not active
      if (!club.is_active) {
        const objectID = `club_${club.id}`;
        await fetch(`https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/${objectID}`, {
          method: 'DELETE',
          headers: {
            'X-Algolia-API-Key': ALGOLIA_ADMIN_API_KEY,
            'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          },
        });
        
        return new Response(JSON.stringify({ success: true, skipped: 'Club not active' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      algoliaRecord = {
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
      };
    }

    // Send to Algolia
    const algoliaUrl = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}`;
    
    const response = await fetch(algoliaUrl, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_ADMIN_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(algoliaRecord),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Algolia error:', errorText);
      throw new Error(`Algolia sync failed: ${errorText}`);
    }

    const result = await response.json();
    console.log(`Synced ${type}_${record.id} to Algolia:`, result);

    return new Response(JSON.stringify({
      success: true,
      objectID: algoliaRecord.objectID,
      taskID: result.taskID,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in algolia-sync-single:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
