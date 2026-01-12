import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { decode as base64Decode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

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
  console.log(`[APPLE-WEBHOOK] ${step}${detailsStr}`);
};

// Decode JWT payload without verification (we trust Apple's signature for now)
function decodeJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Add padding if needed
    let payload = parts[1];
    while (payload.length % 4) {
      payload += '=';
    }
    
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logStep('JWT decode error', { error: errorMessage });
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    // Apple sends POST requests with JSON body
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    const body = await req.json();
    logStep("Request body received", { hasSignedPayload: !!body.signedPayload });

    // V2 notifications come as a signed JWS
    const signedPayload = body.signedPayload;
    if (!signedPayload) {
      throw new Error("Missing signedPayload in request");
    }

    // Decode the outer JWS to get the notification
    const notificationPayload = decodeJWTPayload(signedPayload);
    if (!notificationPayload) {
      throw new Error("Failed to decode notification payload");
    }

    logStep("Notification decoded", {
      notificationType: notificationPayload.notificationType,
      subtype: notificationPayload.subtype,
    });

    const notificationType = notificationPayload.notificationType;
    const subtype = notificationPayload.subtype;
    const data = notificationPayload.data;

    // Decode the transaction info if present
    let transactionInfo: any = null;
    let renewalInfo: any = null;

    if (data?.signedTransactionInfo) {
      transactionInfo = decodeJWTPayload(data.signedTransactionInfo);
      logStep("Transaction info decoded", {
        productId: transactionInfo?.productId,
        transactionId: transactionInfo?.transactionId,
      });
    }

    if (data?.signedRenewalInfo) {
      renewalInfo = decodeJWTPayload(data.signedRenewalInfo);
      logStep("Renewal info decoded", {
        autoRenewStatus: renewalInfo?.autoRenewStatus,
      });
    }

    // Process the notification based on type
    const productId = transactionInfo?.productId;
    const productConfig = productId ? IOS_PRODUCT_MAPPING[productId] : null;

    if (!productConfig) {
      logStep("Unknown or missing product ID", { productId });
      // Return 200 to acknowledge receipt even if we don't process it
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Find the subscription by iOS transaction ID
    const iosTransactionId = `ios_${transactionInfo?.originalTransactionId || transactionInfo?.transactionId}`;
    
    const { data: existingSubscription, error: fetchError } = await supabaseClient
      .from(productConfig.table)
      .select('*')
      .eq('stripe_subscription_id', iosTransactionId)
      .maybeSingle();

    if (fetchError) {
      logStep("Error fetching subscription", { error: fetchError.message });
    }

    const now = new Date().toISOString();
    let updateData: Record<string, any> = { updated_at: now };

    // Handle different notification types
    switch (notificationType) {
      case 'SUBSCRIBED':
      case 'DID_RENEW':
        // Subscription started or renewed
        if (transactionInfo?.expiresDate) {
          updateData.status = 'active';
          updateData.expires_at = new Date(transactionInfo.expiresDate).toISOString();
          updateData.auto_renew = renewalInfo?.autoRenewStatus === 1;
        }
        logStep("Processing subscription/renewal", updateData);
        break;

      case 'DID_CHANGE_RENEWAL_STATUS':
        // User toggled auto-renew
        updateData.auto_renew = renewalInfo?.autoRenewStatus === 1;
        logStep("Processing renewal status change", updateData);
        break;

      case 'EXPIRED':
        // Subscription expired
        updateData.status = 'expired';
        updateData.auto_renew = false;
        logStep("Processing expiration", updateData);
        break;

      case 'DID_FAIL_TO_RENEW':
        // Billing issue
        if (subtype === 'GRACE_PERIOD') {
          updateData.status = 'grace_period';
        } else {
          updateData.status = 'billing_issue';
        }
        logStep("Processing billing failure", updateData);
        break;

      case 'REFUND':
        // User got a refund
        updateData.status = 'refunded';
        updateData.auto_renew = false;
        logStep("Processing refund", updateData);
        break;

      case 'REVOKE':
        // Subscription revoked (family sharing removed, etc.)
        updateData.status = 'revoked';
        updateData.auto_renew = false;
        logStep("Processing revocation", updateData);
        break;

      case 'CONSUMPTION_REQUEST':
        // Apple is asking about consumption (for refund decisions)
        logStep("Consumption request received - no action needed");
        break;

      case 'RENEWAL_EXTENDED':
        // Apple extended the renewal (usually for service issues)
        if (transactionInfo?.expiresDate) {
          updateData.expires_at = new Date(transactionInfo.expiresDate).toISOString();
        }
        logStep("Processing renewal extension", updateData);
        break;

      default:
        logStep("Unhandled notification type", { notificationType, subtype });
    }

    // Update the subscription if we found it and have updates
    if (existingSubscription && Object.keys(updateData).length > 1) {
      const { error: updateError } = await supabaseClient
        .from(productConfig.table)
        .update(updateData)
        .eq('stripe_subscription_id', iosTransactionId);

      if (updateError) {
        logStep("Error updating subscription", { error: updateError.message });
      } else {
        logStep("Subscription updated successfully");
      }
    } else if (!existingSubscription) {
      logStep("No existing subscription found for transaction", { iosTransactionId });
    }

    // Always return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({ 
        received: true,
        notificationType,
        subtype,
        productId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    // Return 200 anyway to prevent Apple from retrying
    return new Response(
      JSON.stringify({ received: true, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
