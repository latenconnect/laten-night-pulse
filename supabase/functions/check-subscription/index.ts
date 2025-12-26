import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe Product IDs mapped to subscription types
const PRODUCT_TYPE_MAP: Record<string, string> = {
  'prod_TdnvAia219rtSO': 'dj',
  'prod_TdnwYmmUIal76I': 'bartender',
  'prod_Tdnyd3McApSwtc': 'professional',
  'prod_Tdo0A4hfXONheD': 'venue_basic',
  'prod_Tdo1e3kiPtTebJ': 'venue_boost',
  'prod_Te7JXXsqH06QCu': 'party_boost',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        subscriptions: [],
        hasActiveSubscription: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

  const activeSubscriptions = subscriptions.data.map((sub: Stripe.Subscription) => {
    const productId = sub.items.data[0]?.price?.product as string;
    const subscriptionType = PRODUCT_TYPE_MAP[productId] || 'unknown';
    const priceId = sub.items.data[0]?.price?.id;
    
    // Get metadata
    const profileId = sub.metadata?.profileId;
      
      return {
        stripeSubscriptionId: sub.id,
        subscriptionType,
        productId,
        priceId,
        profileId,
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    });

    logStep("Active subscriptions found", { count: activeSubscriptions.length, subscriptions: activeSubscriptions });

    // Sync to database for each subscription
    for (const sub of activeSubscriptions) {
      const expiresAt = sub.currentPeriodEnd;
      const now = new Date().toISOString();
      
      try {
        if (sub.subscriptionType === 'dj' && sub.profileId) {
          const { error } = await supabaseClient
            .from('dj_subscriptions')
            .upsert({
              dj_profile_id: sub.profileId,
              status: 'active',
              tier: 'standard',
              stripe_subscription_id: sub.stripeSubscriptionId,
              expires_at: expiresAt,
              started_at: now,
              auto_renew: !sub.cancelAtPeriodEnd,
              updated_at: now,
            }, { onConflict: 'dj_profile_id' });
          
          if (error) logStep("Error syncing DJ subscription", { error: error.message });
          else logStep("Synced DJ subscription", { profileId: sub.profileId });
        } else if (sub.subscriptionType === 'bartender' && sub.profileId) {
          const { error } = await supabaseClient
            .from('bartender_subscriptions')
            .upsert({
              bartender_profile_id: sub.profileId,
              status: 'active',
              tier: 'standard',
              stripe_subscription_id: sub.stripeSubscriptionId,
              expires_at: expiresAt,
              started_at: now,
              auto_renew: !sub.cancelAtPeriodEnd,
              updated_at: now,
            }, { onConflict: 'bartender_profile_id' });
          
          if (error) logStep("Error syncing bartender subscription", { error: error.message });
          else logStep("Synced bartender subscription", { profileId: sub.profileId });
        } else if (sub.subscriptionType === 'professional' && sub.profileId) {
          const { error } = await supabaseClient
            .from('professional_subscriptions')
            .upsert({
              professional_id: sub.profileId,
              status: 'active',
              tier: 'standard',
              stripe_subscription_id: sub.stripeSubscriptionId,
              expires_at: expiresAt,
              started_at: now,
              auto_renew: !sub.cancelAtPeriodEnd,
              updated_at: now,
            }, { onConflict: 'professional_id' });
          
          if (error) logStep("Error syncing professional subscription", { error: error.message });
          else logStep("Synced professional subscription", { profileId: sub.profileId });
        } else if ((sub.subscriptionType === 'venue_basic' || sub.subscriptionType === 'venue_boost') && sub.profileId) {
          const { error } = await supabaseClient
            .from('venue_subscriptions')
            .upsert({
              club_id: sub.profileId,
              status: 'active',
              tier: sub.subscriptionType === 'venue_boost' ? 'boost' : 'basic',
              stripe_subscription_id: sub.stripeSubscriptionId,
              expires_at: expiresAt,
              started_at: now,
              price_cents: sub.subscriptionType === 'venue_boost' ? 6500 : 5000,
              auto_renew: !sub.cancelAtPeriodEnd,
            }, { onConflict: 'club_id' });
          
          if (error) logStep("Error syncing venue subscription", { error: error.message });
          else logStep("Synced venue subscription", { clubId: sub.profileId });
        } else if (sub.subscriptionType === 'party_boost' && sub.profileId) {
          // Party Boost is a host-level subscription
          const { error } = await supabaseClient
            .from('host_subscriptions')
            .upsert({
              host_id: sub.profileId,
              status: 'active',
              tier: 'boost',
              stripe_subscription_id: sub.stripeSubscriptionId,
              expires_at: expiresAt,
              started_at: now,
              price_cents: 1000,
              currency: 'EUR',
              auto_renew: !sub.cancelAtPeriodEnd,
              updated_at: now,
            }, { onConflict: 'host_id' });
          
          if (error) logStep("Error syncing party boost subscription", { error: error.message });
          else logStep("Synced party boost subscription", { hostId: sub.profileId });
        } else if (!sub.profileId) {
          logStep("Subscription missing profileId - cannot sync to database", { 
            subscriptionType: sub.subscriptionType,
            stripeSubscriptionId: sub.stripeSubscriptionId 
          });
        }
      } catch (syncError) {
        logStep("Exception syncing subscription", { 
          type: sub.subscriptionType, 
          error: syncError instanceof Error ? syncError.message : String(syncError) 
        });
      }
    }

    return new Response(JSON.stringify({
      subscriptions: activeSubscriptions,
      hasActiveSubscription: activeSubscriptions.length > 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
