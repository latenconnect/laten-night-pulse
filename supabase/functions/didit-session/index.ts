import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DIDIT_API_KEY) {
      console.error('DIDIT_API_KEY is not configured');
      throw new Error('Didit API key not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating Didit session for user:', user.id);

    const { callback_url } = await req.json();
    
    // Create Didit verification session
    const diditResponse = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIDIT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback: callback_url || `https://huigwbyctzjictnaycjj.supabase.co/functions/v1/didit-webhook`,
        vendor_data: user.id, // Store user ID to link back
        features: 'age-estimation', // Use age estimation feature
      }),
    });

    if (!diditResponse.ok) {
      const errorText = await diditResponse.text();
      console.error('Didit API error:', diditResponse.status, errorText);
      throw new Error(`Didit API error: ${diditResponse.status}`);
    }

    const sessionData = await diditResponse.json();
    console.log('Didit session created:', sessionData.session_id);

    // Store session ID in user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ didit_session_id: sessionData.session_id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile with session ID:', updateError);
    }

    return new Response(JSON.stringify({
      session_id: sessionData.session_id,
      url: sessionData.url,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in didit-session function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
