import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export type SubscriptionType = 'dj' | 'bartender' | 'professional' | 'party_boost';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial' | 'inactive';
export type SubscriptionTier = 'standard' | 'premium' | 'boost';

export interface SubscriptionConfig {
  type: SubscriptionType;
  tier: SubscriptionTier;
  priceInCents: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
}

// Stripe Product & Price IDs
export const STRIPE_PRODUCTS = {
  dj: {
    productId: 'prod_TdnvAia219rtSO',
    priceId: 'price_1SgWJX0pDoPM38rzyMLDI7F7',
  },
  bartender: {
    productId: 'prod_TdnwYmmUIal76I',
    priceId: 'price_1SgWKs0pDoPM38rzgwmlBQlE',
  },
  professional: {
    productId: 'prod_Tdnyd3McApSwtc',
    priceId: 'price_1SgWN00pDoPM38rzSkYpOsR4',
  },
  venue_basic: {
    productId: 'prod_Tdo0A4hfXONheD',
    priceId: 'price_1SgWOB0pDoPM38rzAEFGra0c',
  },
  venue_boost: {
    productId: 'prod_Tdo1e3kiPtTebJ',
    priceId: 'price_1SgWPf0pDoPM38rzwbsmt8de',
  },
  party_boost: {
    productId: 'prod_Te7JXXsqH06QCu',
    priceId: 'price_1Sgp4n0pDoPM38rzfTeVwGjo',
  },
};

// Subscription pricing configuration - synced with Stripe
export const SUBSCRIPTION_CONFIGS: Record<string, SubscriptionConfig> = {
  dj_standard: {
    type: 'dj',
    tier: 'standard',
    priceInCents: 1500, // €15
    currency: 'EUR',
    interval: 'month',
    features: [
      'Appear in DJ search results',
      'Receive booking requests',
      'Chat with potential clients',
      'Collect ratings & reviews',
      'Priority support',
    ],
    stripePriceId: STRIPE_PRODUCTS.dj.priceId,
  },
  bartender_standard: {
    type: 'bartender',
    tier: 'standard',
    priceInCents: 1500, // €15
    currency: 'EUR',
    interval: 'month',
    features: [
      'Appear in bartender search',
      'Receive booking requests',
      'Chat with potential clients',
      'Collect ratings & reviews',
      'Priority support',
    ],
    stripePriceId: STRIPE_PRODUCTS.bartender.priceId,
  },
  professional_standard: {
    type: 'professional',
    tier: 'standard',
    priceInCents: 1500, // €15
    currency: 'EUR',
    interval: 'month',
    features: [
      'Appear in professional search',
      'Receive booking requests',
      'Multi-profession profile',
      'Portfolio showcase',
      'Priority support',
    ],
    stripePriceId: STRIPE_PRODUCTS.professional.priceId,
  },
  party_boost: {
    type: 'party_boost',
    tier: 'boost',
    priceInCents: 1000, // €10
    currency: 'EUR',
    interval: 'month',
    features: [
      'Priority placement in feed',
      'Featured party badge',
      'Push notifications to nearby users',
      'Real-time event analytics',
      'Trending section visibility',
      'Social share templates',
    ],
    stripePriceId: STRIPE_PRODUCTS.party_boost.priceId,
  },
};

interface UseSubscriptionReturn {
  loading: boolean;
  error: string | null;
  createSubscription: (configKey: string, profileId: string) => Promise<boolean>;
  cancelSubscription: (subscriptionId: string, type: SubscriptionType) => Promise<boolean>;
  checkSubscriptionStatus: (profileId: string, type: SubscriptionType) => Promise<boolean>;
}

/**
 * Hook for managing subscriptions - prepared for Stripe integration
 * 
 * When Stripe is enabled, this hook will:
 * 1. Create a Stripe checkout session via edge function
 * 2. Redirect user to Stripe checkout
 * 3. Handle webhook callbacks to update subscription status
 * 
 * For now, it creates subscriptions directly in the database (for testing)
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new subscription
   * Ready for Stripe: Will call edge function to create checkout session
   */
  const createSubscription = useCallback(async (
    configKey: string, 
    profileId: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to subscribe');
      return false;
    }

    const config = SUBSCRIPTION_CONFIGS[configKey];
    if (!config) {
      setError('Invalid subscription configuration');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: When Stripe is integrated, replace with:
      // const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      //   body: { 
      //     priceId: config.stripePriceId,
      //     profileId,
      //     type: config.type,
      //     successUrl: `${window.location.origin}/subscription/success`,
      //     cancelUrl: `${window.location.origin}/subscription/cancelled`,
      //   }
      // });
      // if (data?.url) window.location.href = data.url;

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const subscriptionData = {
        status: 'active' as const,
        tier: config.tier,
        price_cents: config.priceInCents,
        currency: config.currency,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
      };

      // Handle each subscription type with proper typing
      if (config.type === 'dj') {
        const { error: insertError } = await supabase
          .from('dj_subscriptions')
          .upsert({
            ...subscriptionData,
            dj_profile_id: profileId,
          }, { onConflict: 'dj_profile_id' });
        if (insertError) throw insertError;
      } else if (config.type === 'bartender') {
        const { error: insertError } = await supabase
          .from('bartender_subscriptions')
          .upsert({
            ...subscriptionData,
            bartender_profile_id: profileId,
          }, { onConflict: 'bartender_profile_id' });
        if (insertError) throw insertError;
      } else if (config.type === 'professional') {
        const { error: insertError } = await supabase
          .from('professional_subscriptions')
          .upsert({
            ...subscriptionData,
            professional_id: profileId,
          }, { onConflict: 'professional_id' });
        if (insertError) throw insertError;
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`my-${config.type}-subscription`] });
      
      toast.success('Subscription activated successfully!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, queryClient]);

  /**
   * Cancel an existing subscription
   */
  const cancelSubscription = useCallback(async (
    subscriptionId: string,
    type: SubscriptionType
  ): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: When Stripe is integrated, call edge function to cancel via Stripe API
      
      if (type === 'dj') {
        const { error: updateError } = await supabase
          .from('dj_subscriptions')
          .update({ status: 'cancelled', auto_renew: false })
          .eq('id', subscriptionId);
        if (updateError) throw updateError;
      } else if (type === 'bartender') {
        const { error: updateError } = await supabase
          .from('bartender_subscriptions')
          .update({ status: 'cancelled', auto_renew: false })
          .eq('id', subscriptionId);
        if (updateError) throw updateError;
      } else if (type === 'professional') {
        const { error: updateError } = await supabase
          .from('professional_subscriptions')
          .update({ status: 'cancelled', auto_renew: false })
          .eq('id', subscriptionId);
        if (updateError) throw updateError;
      }

      queryClient.invalidateQueries({ queryKey: [`my-${type}-subscription`] });
      
      toast.success('Subscription cancelled');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, queryClient]);

  /**
   * Check if a profile has an active subscription
   */
  const checkSubscriptionStatus = useCallback(async (
    profileId: string,
    type: SubscriptionType
  ): Promise<boolean> => {
    try {
      let data: { status: string; expires_at: string | null } | null = null;

      if (type === 'dj') {
        const result = await supabase
          .from('dj_subscriptions')
          .select('status, expires_at')
          .eq('dj_profile_id', profileId)
          .maybeSingle();
        if (result.error) throw result.error;
        data = result.data;
      } else if (type === 'bartender') {
        const result = await supabase
          .from('bartender_subscriptions')
          .select('status, expires_at')
          .eq('bartender_profile_id', profileId)
          .maybeSingle();
        if (result.error) throw result.error;
        data = result.data;
      } else if (type === 'professional') {
        const result = await supabase
          .from('professional_subscriptions')
          .select('status, expires_at')
          .eq('professional_id', profileId)
          .maybeSingle();
        if (result.error) throw result.error;
        data = result.data;
      }

      if (!data) return false;

      const isActive = data.status === 'active' && 
        data.expires_at && 
        new Date(data.expires_at) > new Date();

      return isActive;
    } catch (err) {
      console.error('Error checking subscription:', err);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    createSubscription,
    cancelSubscription,
    checkSubscriptionStatus,
  };
};

export default useSubscription;
