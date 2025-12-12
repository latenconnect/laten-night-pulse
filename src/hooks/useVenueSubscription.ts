import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type SubscriptionTier = 'basic' | 'boost' | 'ultimate';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

export interface VenueSubscription {
  id: string;
  club_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  price_cents: number;
  currency: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
}

export const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    price: 15000, // €150 in cents
    features: [
      'Listed on Laten',
      'Unlimited event uploads',
      'Basic analytics',
      'Standard support',
    ],
  },
  boost: {
    name: 'Boost',
    price: 25000, // €250 in cents
    features: [
      'Everything in Basic',
      'Priority ranking in search',
      'Advanced analytics dashboard',
      'Featured badge',
      'Weekly performance reports',
    ],
  },
  ultimate: {
    name: 'Ultimate',
    price: 50000, // €500 in cents
    features: [
      'Everything in Boost',
      'Homepage featured slot',
      'Push notification campaigns',
      'Dedicated account manager',
      'Custom branding options',
      'API access',
    ],
  },
} as const;

export const useVenueSubscription = (clubId?: string) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<VenueSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!clubId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('venue_subscriptions')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }
      
      setSubscription(data as VenueSubscription | null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const hasFeature = useCallback((feature: 'priority_ranking' | 'push_notifications' | 'homepage_slot' | 'analytics') => {
    if (!subscription) return false;
    
    switch (feature) {
      case 'priority_ranking':
        return subscription.tier === 'boost' || subscription.tier === 'ultimate';
      case 'push_notifications':
        return subscription.tier === 'ultimate';
      case 'homepage_slot':
        return subscription.tier === 'ultimate';
      case 'analytics':
        return true; // All tiers have some analytics
      default:
        return false;
    }
  }, [subscription]);

  const isSubscribed = subscription?.status === 'active';

  return {
    subscription,
    loading,
    isSubscribed,
    tier: subscription?.tier,
    hasFeature,
    refetch: fetchSubscription,
  };
};
