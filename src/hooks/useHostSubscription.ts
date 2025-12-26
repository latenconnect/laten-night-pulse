import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { STRIPE_PRODUCTS } from './useSubscription';

export interface HostSubscription {
  id: string;
  host_id: string;
  tier: string;
  status: string;
  price_cents: number;
  currency: string;
  stripe_subscription_id: string | null;
  started_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
}

export const useHostSubscription = (hostId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Fetch host subscription from database
  const { data: subscription, refetch, isLoading } = useQuery({
    queryKey: ['host-subscription', hostId],
    queryFn: async () => {
      if (!hostId) return null;

      const { data, error } = await supabase
        .from('host_subscriptions')
        .select('*')
        .eq('host_id', hostId)
        .eq('status', 'active')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching host subscription:', error);
        return null;
      }

      // Check if subscription is still valid
      if (data && data.expires_at && new Date(data.expires_at) < new Date()) {
        return null; // Expired
      }

      return data as HostSubscription | null;
    },
    enabled: !!hostId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  const isSubscribed = !!subscription && subscription.status === 'active';

  // Create checkout for party boost subscription
  const createCheckout = useCallback(async (hostIdParam: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return false;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: STRIPE_PRODUCTS.party_boost.priceId,
          profileId: hostIdParam, // This is the host_id
          subscriptionType: 'party_boost',
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancelled`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to payment...');
        return true;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check what boost features are available
  const hasFeature = useCallback((feature: 'priority_feed' | 'featured_badge' | 'push_notifications' | 'analytics' | 'trending' | 'social_templates') => {
    if (!isSubscribed) return false;
    // Party Boost includes all features
    return true;
  }, [isSubscribed]);

  return {
    subscription,
    loading: loading || isLoading,
    isSubscribed,
    tier: subscription?.tier,
    hasFeature,
    createCheckout,
    refetch,
  };
};

export default useHostSubscription;