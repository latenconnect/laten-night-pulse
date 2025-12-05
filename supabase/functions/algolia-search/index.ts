import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALGOLIA_APP_ID = Deno.env.get('ALGOLIA_APP_ID')!;
const ALGOLIA_SEARCH_API_KEY = Deno.env.get('ALGOLIA_SEARCH_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, filters, page = 0, hitsPerPage = 20 } = await req.json();

    if (!query || query.trim() === '') {
      return new Response(JSON.stringify({ hits: [], nbHits: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Searching Algolia for:', query, 'filters:', filters);

    const indexName = 'laten_search';
    const searchUrl = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${indexName}/query`;

    const searchParams: Record<string, any> = {
      query: query.trim(),
      page,
      hitsPerPage,
      attributesToRetrieve: ['*'],
      attributesToHighlight: ['name', 'description', 'locationName', 'address'],
    };

    // Add filters if provided
    if (filters) {
      const filterParts: string[] = [];
      if (filters.type) filterParts.push(`type:${filters.type}`);
      if (filters.city) filterParts.push(`city:"${filters.city}"`);
      if (filters.eventType) filterParts.push(`eventType:${filters.eventType}`);
      if (filterParts.length > 0) {
        searchParams.filters = filterParts.join(' AND ');
      }
    }

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_SEARCH_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Algolia search error:', errorText);
      throw new Error(`Algolia search failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Algolia search completed, hits:', result.nbHits);

    return new Response(JSON.stringify({
      hits: result.hits,
      nbHits: result.nbHits,
      page: result.page,
      nbPages: result.nbPages,
      hitsPerPage: result.hitsPerPage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in algolia-search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, hits: [], nbHits: 0 }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
