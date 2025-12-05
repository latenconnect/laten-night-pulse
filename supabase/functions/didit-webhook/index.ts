import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DIDIT_WEBHOOK_SECRET = Deno.env.get('DIDIT_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DIDIT_WEBHOOK_SECRET) {
      console.error('DIDIT_WEBHOOK_SECRET is not configured');
      throw new Error('Webhook secret not configured');
    }

    const body = await req.text();
    console.log('Received webhook payload:', body);

    // Verify webhook signature
    const signature = req.headers.get('x-signature');
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(DIDIT_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(body)
      );
      
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    const payload = JSON.parse(body);
    console.log('Parsed webhook data:', JSON.stringify(payload, null, 2));

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Extract user ID from vendor_data
    const userId = payload.vendor_data;
    const sessionId = payload.session_id;
    const status = payload.status;

    if (!userId) {
      console.error('No user ID in vendor_data');
      return new Response(JSON.stringify({ error: 'Missing user ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing verification for user:', userId, 'status:', status);

    // Check if verification was successful and user is 18+
    let ageVerified = false;
    
    if (status === 'Approved' || status === 'approved') {
      // Check age from the verification result
      const ageEstimation = payload.age_estimation;
      const documentAge = payload.document?.age;
      
      // Use age from document if available, otherwise use age estimation
      const age = documentAge || ageEstimation?.age;
      
      if (age && age >= 18) {
        ageVerified = true;
        console.log('User verified as 18+ with age:', age);
      } else if (ageEstimation?.is_adult === true) {
        ageVerified = true;
        console.log('User verified as adult via age estimation');
      } else {
        console.log('User age verification failed - under 18 or age not determined');
      }
    }

    // Update user's profile with verification status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        age_verified: ageVerified,
        age_verified_at: ageVerified ? new Date().toISOString() : null,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    console.log('Profile updated successfully. Age verified:', ageVerified);

    return new Response(JSON.stringify({ 
      success: true,
      age_verified: ageVerified 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in didit-webhook function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
