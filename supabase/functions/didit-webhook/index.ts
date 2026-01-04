import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

// Simple in-memory rate limiter for webhook (IP-based)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100; // Max 100 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // IP-based rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  
  if (!checkIpRateLimit(clientIp)) {
    console.warn('Rate limit exceeded for IP:', clientIp);
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    // Verify webhook signature - REQUIRED
    const signature = req.headers.get('x-signature');
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

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

    // Auto-verify host if age verification passed
    if (ageVerified) {
      // Check if user has a pending host application
      const { data: hostData } = await supabase
        .from('hosts')
        .select('id, verification_status')
        .eq('user_id', userId)
        .maybeSingle();

      if (hostData && hostData.verification_status === 'pending') {
        // Auto-approve the host since ID verification passed
        const { error: hostError } = await supabase
          .from('hosts')
          .update({
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
          })
          .eq('id', hostData.id);

        if (hostError) {
          console.error('Error auto-verifying host:', hostError);
        } else {
          console.log('Host auto-verified for user:', userId);
        }
      } else if (!hostData) {
        // User doesn't have a host record yet - create one as verified
        const { error: createHostError } = await supabase
          .from('hosts')
          .insert({
            user_id: userId,
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
          });

        if (createHostError) {
          console.error('Error creating verified host:', createHostError);
        } else {
          console.log('Created verified host for user:', userId);
        }
      }
    }

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
