import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// iOS Product IDs mapping
const IOS_PRODUCT_MAPPING: Record<string, { type: string; table: string; idField: string }> = {
  'com.laten.bartender.sub': { type: 'bartender', table: 'bartender_subscriptions', idField: 'bartender_profile_id' },
  'com.laten.dj.sub': { type: 'dj', table: 'dj_subscriptions', idField: 'dj_profile_id' },
  'com.laten.party.boost': { type: 'party_boost', table: 'host_subscriptions', idField: 'host_id' },
  'com.laten.pro.sub': { type: 'professional', table: 'professional_subscriptions', idField: 'professional_id' },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-IOS-RECEIPT] ${step}${detailsStr}`);
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

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { receipt, productId, transactionId, profileId, subscriptionType } = await req.json();
    logStep("Request data", { productId, transactionId, profileId, subscriptionType });

    if (!receipt || !productId || !transactionId || !profileId) {
      throw new Error("Missing required fields: receipt, productId, transactionId, profileId");
    }

    // Validate product ID
    const productConfig = IOS_PRODUCT_MAPPING[productId];
    if (!productConfig) {
      throw new Error(`Unknown product ID: ${productId}`);
    }
    logStep("Product validated", productConfig);

    // Get Apple Shared Secret from environment
    const appleSharedSecret = Deno.env.get("APPLE_SHARED_SECRET");
    if (!appleSharedSecret) {
      logStep("WARNING: APPLE_SHARED_SECRET not set, skipping Apple verification");
      // For development/testing, we'll trust the receipt without Apple verification
      // In production, you should always verify with Apple
    }

    let isValid = true;
    let expiresAt: Date | null = null;

    // Verify with Apple if we have the shared secret
    if (appleSharedSecret) {
      // Try production first, then sandbox
      const verifyUrls = [
        'https://buy.itunes.apple.com/verifyReceipt',
        'https://sandbox.itunes.apple.com/verifyReceipt'
      ];

      for (const url of verifyUrls) {
        try {
          const verifyResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              'receipt-data': receipt,
              'password': appleSharedSecret,
              'exclude-old-transactions': true,
            }),
          });

          const verifyData = await verifyResponse.json();
          logStep("Apple verification response", { status: verifyData.status, url });

          // Status 0 = valid, 21007 = sandbox receipt sent to production (try sandbox)
          if (verifyData.status === 0) {
            isValid = true;

            // Find the latest receipt for this product
            const latestReceipts = verifyData.latest_receipt_info || [];
            const productReceipt = latestReceipts.find(
              (r: any) => r.product_id === productId
            );

            if (productReceipt && productReceipt.expires_date_ms) {
              expiresAt = new Date(parseInt(productReceipt.expires_date_ms));
              logStep("Subscription expires at", { expiresAt: expiresAt.toISOString() });
            }
            break;
          } else if (verifyData.status === 21007) {
            // Sandbox receipt, try sandbox URL
            continue;
          } else {
            logStep("Invalid receipt status", { status: verifyData.status });
            isValid = false;
            break;
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logStep("Apple verification error", { error: errorMessage, url });
        }
      }
    } else {
      // Development mode - set expiry to 1 month from now
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      logStep("Development mode - setting 1 month expiry");
    }

    if (!isValid) {
      throw new Error("Receipt validation failed");
    }

    // Update subscription in database
    const now = new Date().toISOString();
    const expiresAtStr = expiresAt?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const subscriptionData = {
      [productConfig.idField]: profileId,
      status: 'active',
      tier: 'standard',
      price_cents: 1500, // Default, will be updated based on product
      currency: 'EUR',
      started_at: now,
      expires_at: expiresAtStr,
      auto_renew: true,
      stripe_subscription_id: `ios_${transactionId}`, // Store iOS transaction ID
      updated_at: now,
    };

    // Adjust price for party_boost
    if (productId === 'com.laten.party.boost') {
      subscriptionData.price_cents = 1000;
      subscriptionData.tier = 'boost';
    }

    logStep("Upserting subscription", { table: productConfig.table, data: subscriptionData });

    const { error: upsertError } = await supabaseClient
      .from(productConfig.table)
      .upsert(subscriptionData, {
        onConflict: productConfig.idField,
      });

    if (upsertError) {
      logStep("Upsert error", { error: upsertError });
      throw new Error(`Failed to update subscription: ${upsertError.message}`);
    }

    logStep("Subscription updated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionType: productConfig.type,
        expiresAt: expiresAtStr,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
