import { useState, useCallback, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
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
  stripePriceId: string;
  stripeProductId: string;
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
    stripeProductId: STRIPE_PRODUCTS.dj.productId,
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
    stripeProductId: STRIPE_PRODUCTS.bartender.productId,
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
    stripeProductId: STRIPE_PRODUCTS.professional.productId,
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
    stripeProductId: STRIPE_PRODUCTS.party_boost.productId,
  },
};

interface ActiveSubscription {
  stripeSubscriptionId: string;
  subscriptionType: string;
  productId: string;
  priceId: string;
  profileId?: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface UseSubscriptionReturn {
  loading: boolean;
  error: string | null;
  subscriptions: ActiveSubscription[];
  hasActiveSubscription: boolean;
  createCheckout: (configKey: string, profileId: string) => Promise<boolean>;
  cancelSubscription: (subscriptionId: string, type: SubscriptionType) => Promise<boolean>;
  checkSubscriptionStatus: (profileId: string, type: SubscriptionType) => Promise<boolean>;
  openCustomerPortal: () => Promise<boolean>;
  refreshSubscriptions: () => void;
  isSubscribed: (type: SubscriptionType) => boolean;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription status from Stripe via edge function
  const { data: subscriptionData, refetch: refreshSubscriptions } = useQuery({
    queryKey: ['stripe-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return { subscriptions: [], hasActiveSubscription: false };
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return { subscriptions: [], hasActiveSubscription: false };
      }
      
      return data as { subscriptions: ActiveSubscription[]; hasActiveSubscription: boolean };
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 30000, // Auto-refresh every 30 seconds for faster updates
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  /**
   * Create a Stripe checkout session and redirect to payment
   */
  const createCheckout = useCallback(async (
    configKey: string, 
    profileId: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to subscribe');
      toast.error('Please log in to subscribe');
      return false;
    }

    const config = SUBSCRIPTION_CONFIGS[configKey];
    if (!config) {
      setError('Invalid subscription configuration');
      toast.error('Invalid subscription plan');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: config.stripePriceId,
          profileId,
          subscriptionType: config.type,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancelled`,
        }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast.success('Redirecting to payment...');
        return true;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Open Stripe Customer Portal for subscription management
   */
  const openCustomerPortal = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to manage subscriptions');
      return false;
    }

    setLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('customer-portal');

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to open customer portal');
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        return true;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open subscription management';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Cancel an existing subscription via customer portal
   */
  const cancelSubscription = useCallback(async (
    _subscriptionId: string,
    _type: SubscriptionType
  ): Promise<boolean> => {
    // For cancellation, redirect to customer portal
    return openCustomerPortal();
  }, [openCustomerPortal]);

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
      } else if (type === 'party_boost') {
        const result = await supabase
          .from('host_subscriptions')
          .select('status, expires_at')
          .eq('host_id', profileId)
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

  /**
   * Check if user has active subscription of specific type
   */
  const isSubscribed = useCallback((type: SubscriptionType): boolean => {
    if (!subscriptionData?.subscriptions) return false;
    return subscriptionData.subscriptions.some(
      sub => sub.subscriptionType === type && sub.status === 'active'
    );
  }, [subscriptionData]);

  return {
    loading,
    error,
    subscriptions: subscriptionData?.subscriptions || [],
    hasActiveSubscription: subscriptionData?.hasActiveSubscription || false,
    createCheckout,
    cancelSubscription,
    checkSubscriptionStatus,
    openCustomerPortal,
    refreshSubscriptions,
    isSubscribed,
  };
};

export default useSubscription;
