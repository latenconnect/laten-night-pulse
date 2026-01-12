import { useState, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { usePlatform } from './usePlatform';
import { useIOSPurchases } from './useIOSPurchases';

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
  iosProductId: string;
}

// iOS Product IDs mapped to subscription types
export const IOS_PRODUCT_IDS = {
  dj: 'com.laten.dj.subscription',
  bartender: 'com.laten.bartender.subscription',
  professional: 'com.laten.professional.subscription',
  party_boost: 'com.laten.partyboost.subscription',
};

// Subscription pricing configuration
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
    iosProductId: IOS_PRODUCT_IDS.dj,
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
    iosProductId: IOS_PRODUCT_IDS.bartender,
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
    iosProductId: IOS_PRODUCT_IDS.professional,
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
    iosProductId: IOS_PRODUCT_IDS.party_boost,
  },
};

interface ActiveSubscription {
  subscriptionType: string;
  profileId?: string;
  status: string;
  expiresAt: string;
  iosTransactionId?: string;
}

interface UseSubscriptionReturn {
  loading: boolean;
  error: string | null;
  subscriptions: ActiveSubscription[];
  hasActiveSubscription: boolean;
  purchaseSubscription: (configKey: string, profileId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: (profileId: string, type: SubscriptionType) => Promise<boolean>;
  refreshSubscriptions: () => void;
  isSubscribed: (type: SubscriptionType) => boolean;
  isIOSNative: boolean;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isIOS } = usePlatform();
  const { purchase: purchaseProduct, restorePurchases: restoreIOSPurchases, loading: iosLoading } = useIOSPurchases();

  // Fetch subscription status from database
  const { data: subscriptionData, refetch: refreshSubscriptions } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return { subscriptions: [], hasActiveSubscription: false };
      
      const subscriptions: ActiveSubscription[] = [];
      const now = new Date().toISOString();

      // Check all subscription tables
      const [djSub, bartenderSub, professionalSub, hostSub] = await Promise.all([
        supabase
          .from('dj_subscriptions')
          .select('*, dj_profiles!inner(user_id)')
          .eq('dj_profiles.user_id', user.id)
          .eq('status', 'active')
          .gte('expires_at', now)
          .maybeSingle(),
        supabase
          .from('bartender_subscriptions')
          .select('*, bartender_profiles!inner(user_id)')
          .eq('bartender_profiles.user_id', user.id)
          .eq('status', 'active')
          .gte('expires_at', now)
          .maybeSingle(),
        supabase
          .from('professional_subscriptions')
          .select('*, professionals!inner(user_id)')
          .eq('professionals.user_id', user.id)
          .eq('status', 'active')
          .gte('expires_at', now)
          .maybeSingle(),
        supabase
          .from('host_subscriptions')
          .select('*, hosts!inner(user_id)')
          .eq('hosts.user_id', user.id)
          .eq('status', 'active')
          .gte('expires_at', now)
          .maybeSingle(),
      ]);

      if (djSub.data) {
        subscriptions.push({
          subscriptionType: 'dj',
          profileId: djSub.data.dj_profile_id,
          status: djSub.data.status,
          expiresAt: djSub.data.expires_at,
        });
      }

      if (bartenderSub.data) {
        subscriptions.push({
          subscriptionType: 'bartender',
          profileId: bartenderSub.data.bartender_profile_id,
          status: bartenderSub.data.status,
          expiresAt: bartenderSub.data.expires_at,
        });
      }

      if (professionalSub.data) {
        subscriptions.push({
          subscriptionType: 'professional',
          profileId: professionalSub.data.professional_id,
          status: professionalSub.data.status,
          expiresAt: professionalSub.data.expires_at,
        });
      }

      if (hostSub.data) {
        subscriptions.push({
          subscriptionType: 'party_boost',
          profileId: hostSub.data.host_id,
          status: hostSub.data.status,
          expiresAt: hostSub.data.expires_at,
        });
      }

      return {
        subscriptions,
        hasActiveSubscription: subscriptions.length > 0,
      };
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  /**
   * Purchase subscription via iOS In-App Purchase
   */
  const purchaseSubscription = useCallback(async (
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

    if (!isIOS) {
      toast.error('Subscriptions are only available on iOS');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Map config type to IOSProductType
      const iosProductType = config.type as 'dj' | 'bartender' | 'professional' | 'party_boost';
      const success = await purchaseProduct(iosProductType, profileId);
      
      if (success) {
        // Refresh subscription data
        await refreshSubscriptions();
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      }
      
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to purchase subscription';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isIOS, purchaseProduct, refreshSubscriptions, queryClient]);

  /**
   * Restore previous purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isIOS) {
      toast.info('Restore purchases is only available on iOS');
      return false;
    }

    try {
      const success = await restoreIOSPurchases();
      if (success) {
        await refreshSubscriptions();
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore purchases';
      toast.error(message);
      return false;
    }
  }, [isIOS, restoreIOSPurchases, refreshSubscriptions, queryClient]);

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
    loading: loading || iosLoading,
    error,
    subscriptions: subscriptionData?.subscriptions || [],
    hasActiveSubscription: subscriptionData?.hasActiveSubscription || false,
    purchaseSubscription,
    restorePurchases,
    checkSubscriptionStatus,
    refreshSubscriptions,
    isSubscribed,
    isIOSNative: isIOS,
  };
};

export default useSubscription;
