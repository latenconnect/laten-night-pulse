import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALGOLIA_APP_ID = Deno.env.get('ALGOLIA_APP_ID')!;
const ALGOLIA_SEARCH_API_KEY = Deno.env.get('ALGOLIA_SEARCH_API_KEY')!;

// Input validation schema
const SearchInputSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.object({
    type: z.enum(['event', 'club']).optional(),
    city: z.string().max(100).optional(),
    eventType: z.string().max(50).optional(),
  }).optional(),
  page: z.number().int().min(0).max(100).default(0),
  hitsPerPage: z.number().int().min(1).max(100).default(20),
});

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(JSON.stringify({ 
      error: 'Too many requests. Please try again later.',
      hits: [], 
      nbHits: 0 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const parseResult = SearchInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.warn('Invalid input:', parseResult.error.errors);
      return new Response(JSON.stringify({ 
        error: 'Invalid input parameters',
        details: parseResult.error.errors,
        hits: [], 
        nbHits: 0 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { query, filters, page, hitsPerPage } = parseResult.data;

    if (query.trim() === '') {
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
      
      if (response.status === 404) {
        console.log('Index does not exist yet - needs initial sync');
        return new Response(JSON.stringify({ 
          hits: [], 
          nbHits: 0, 
          page: 0, 
          nbPages: 0, 
          hitsPerPage,
          needsSync: true,
          message: 'Search index not created yet. Please sync data from Admin panel.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
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
