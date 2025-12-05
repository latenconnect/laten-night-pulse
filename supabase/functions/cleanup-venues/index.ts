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
  "brunch", "breakfast", "lunch", "dinner",
  // Cafes & bakeries
  "bakery", "pékség", "confectionery", "cukrászda", "pastry", "bagel",
  "kávézó", "kávéház", "coffee",
  // Shopping & retail
  "árkád", "mall", "plaza", "shopping", "market", "store", "shop",
  // Entertainment (non-nightlife)
  "cinema", "mozi", "theatre", "theater", "színház", "operetta", "opera",
  // Other non-nightlife
  "gym", "fitness", "spa", "wellness", "hotel", "hostel", "museum", "múzeum"
];

// Specific names to deactivate
const SPECIFIC_DEACTIVATIONS = [
  "McDonald's",
  "arán bakery budapest",
  "ÁRKÁD Budapest",
  "Best Bagel Basilica",
  "Budapest Operetta Theatre",
  "Café Gerbeaud",
  "Café Zsivágó",
  "Cirkusz Café",
  "Cookie Beacon Brunch",
  "Cork breakfast & wine",
  "Daubner Confectionery",
  "Beerstro14 Steak House Restaurant",
  "Bem Cinema",
];

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

    console.log('Starting venue cleanup...');
    
    const deactivated: string[] = [];
    const errors: string[] = [];

    // Deactivate specific venues by name
    for (const name of SPECIFIC_DEACTIVATIONS) {
      const { data, error } = await supabase
        .from('clubs')
        .update({ is_active: false })
        .ilike('name', name)
        .select('id, name');
      
      if (error) {
        errors.push(`Error deactivating ${name}: ${error.message}`);
      } else if (data && data.length > 0) {
        deactivated.push(...data.map(d => d.name));
      }
    }

    // Deactivate venues matching non-club patterns
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

    // Deactivate cafes that aren't bars
    const { data: cafes, error: cafeError } = await supabase
      .from('clubs')
      .update({ is_active: false })
      .eq('venue_type', 'cafe')
      .eq('is_active', true)
      .not('name', 'ilike', '%bar%')
      .not('name', 'ilike', '%pub%')
      .not('name', 'ilike', '%club%')
      .select('id, name');

    if (cafeError) {
      errors.push(`Error deactivating cafes: ${cafeError.message}`);
    } else if (cafes && cafes.length > 0) {
      deactivated.push(...cafes.map(d => d.name));
    }

    // Remove duplicates
    const uniqueDeactivated = [...new Set(deactivated)];

    console.log(`Cleanup complete. Deactivated ${uniqueDeactivated.length} venues.`);

    return new Response(JSON.stringify({
      success: true,
      deactivated_count: uniqueDeactivated.length,
      deactivated_venues: uniqueDeactivated,
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
