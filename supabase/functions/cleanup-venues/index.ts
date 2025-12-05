import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Non-club venue patterns to deactivate
const NON_CLUB_PATTERNS = [
  // Fast food & restaurants
  "mcdonald's", "burger king", "kfc", "subway", "pizza hut", "domino",
  "étterem", "restaurant", "steakhouse", "steak house", "bistro", "grill",
  "brunch", "breakfast", "lunch", "dinner", "kitchen", "konyha",
  // Cafes & bakeries
  "bakery", "pékség", "confectionery", "cukrászda", "pastry", "bagel",
  "kávézó", "kávéház", "coffee", "café", "cafe",
  // Shopping & retail
  "árkád", "mall", "plaza", "shopping", "market", "store", "shop", "áruház",
  // Entertainment (non-nightlife)
  "cinema", "mozi", "theatre", "theater", "színház", "operetta", "opera",
  // Other non-nightlife
  "gym", "fitness", "spa", "wellness", "hotel", "hostel", "museum", "múzeum",
  "pharmacy", "gyógyszertár", "bank", "office", "iroda"
];

// Map venue types based on name patterns
function categorizeVenue(name: string, currentType: string | null): string {
  const nameLower = name.toLowerCase();
  
  // Check for festival venues
  if (nameLower.includes('festival') || nameLower.includes('fesztivál') || 
      nameLower.includes('arena') || nameLower.includes('stadion') ||
      nameLower.includes('sziget') || nameLower.includes('balaton sound') ||
      nameLower.includes('volt') || nameLower.includes('ozora')) {
    return 'festival';
  }
  
  // Check for famous club keywords
  if (nameLower.includes('romkert') || nameLower.includes('szimpla') ||
      nameLower.includes('instant') || nameLower.includes('fogas') ||
      nameLower.includes('akvárium') || nameLower.includes('a38') ||
      nameLower.includes('doboz') || nameLower.includes('ötkert') ||
      nameLower.includes('morrison') || nameLower.includes('akvarium') ||
      nameLower.includes('club') || nameLower.includes('klub') ||
      nameLower.includes('disco') || nameLower.includes('diszkó') ||
      currentType === 'night_club') {
    return 'club';
  }
  
  // Check for rooftop/lounge bars
  if (nameLower.includes('rooftop') || nameLower.includes('sky') ||
      nameLower.includes('terasz') || nameLower.includes('lounge') ||
      nameLower.includes('360')) {
    return 'lounge';
  }
  
  // Pubs and Irish bars
  if (currentType === 'pub' || nameLower.includes('pub') || 
      nameLower.includes('irish') || nameLower.includes('sörház') ||
      nameLower.includes('söröző')) {
    return 'pub';
  }
  
  // Wine bars
  if (nameLower.includes('wine') || nameLower.includes('bor') ||
      nameLower.includes('pince')) {
    return 'wine_bar';
  }
  
  // Default to bar
  return 'bar';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
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

    console.log('Starting venue cleanup and categorization...');
    
    const deactivated: string[] = [];
    const recategorized: string[] = [];
    const errors: string[] = [];

    // Step 1: Deactivate non-club venues by pattern matching
    for (const pattern of NON_CLUB_PATTERNS) {
      const { data, error } = await supabase
        .from('clubs')
        .update({ is_active: false })
        .ilike('name', `%${pattern}%`)
        .eq('is_active', true)
        .select('id, name');
      
      if (error) {
        errors.push(`Error with pattern ${pattern}: ${error.message}`);
      } else if (data && data.length > 0) {
        deactivated.push(...data.map(d => d.name));
      }
    }

    // Step 2: Recategorize remaining active venues
    const { data: activeVenues, error: fetchError } = await supabase
      .from('clubs')
      .select('id, name, venue_type')
      .eq('is_active', true);

    if (fetchError) {
      errors.push(`Error fetching venues: ${fetchError.message}`);
    } else if (activeVenues) {
      for (const venue of activeVenues) {
        const newCategory = categorizeVenue(venue.name, venue.venue_type);
        
        if (newCategory !== venue.venue_type) {
          const { error: updateError } = await supabase
            .from('clubs')
            .update({ venue_type: newCategory })
            .eq('id', venue.id);
          
          if (updateError) {
            errors.push(`Error updating ${venue.name}: ${updateError.message}`);
          } else {
            recategorized.push(`${venue.name}: ${venue.venue_type || 'null'} → ${newCategory}`);
          }
        }
      }
    }

    // Remove duplicates
    const uniqueDeactivated = [...new Set(deactivated)];

    console.log(`Cleanup complete. Deactivated ${uniqueDeactivated.length} venues, recategorized ${recategorized.length} venues.`);

    return new Response(JSON.stringify({
      success: true,
      deactivated_count: uniqueDeactivated.length,
      deactivated_venues: uniqueDeactivated,
      recategorized_count: recategorized.length,
      recategorized_venues: recategorized.slice(0, 50), // Limit response size
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
