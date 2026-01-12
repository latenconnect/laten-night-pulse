import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePlatform } from './usePlatform';
import { useIOSPurchases } from './useIOSPurchases';
import { IOS_PRODUCT_IDS } from './useSubscription';

export interface HostSubscription {
  id: string;
  host_id: string;
  tier: string;
  status: string;
  price_cents: number;
  currency: string;
  started_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
}

export const useHostSubscription = (hostId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { isIOS } = usePlatform();
  const { purchase: purchaseProduct, loading: iosLoading } = useIOSPurchases();

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

  // Purchase party boost subscription via iOS IAP
  const purchaseBoost = useCallback(async (hostIdParam: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return false;
    }

    if (!isIOS) {
      toast.error('Subscriptions are only available on iOS');
      return false;
    }

    setLoading(true);

    try {
      const success = await purchaseProduct('party_boost', hostIdParam);
      
      if (success) {
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['host-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        toast.success('Party Boost activated!');
      }
      
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to purchase subscription';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isIOS, purchaseProduct, refetch, queryClient]);

  // Check what boost features are available
  const hasFeature = useCallback((feature: 'priority_feed' | 'featured_badge' | 'push_notifications' | 'analytics' | 'trending' | 'social_templates') => {
    if (!isSubscribed) return false;
    // Party Boost includes all features
    return true;
  }, [isSubscribed]);

  return {
    subscription,
    loading: loading || isLoading || iosLoading,
    isSubscribed,
    tier: subscription?.tier,
    hasFeature,
    purchaseBoost,
    refetch,
  };
};

export default useHostSubscription;
