import { useCallback, useMemo } from 'react';
import { useHostSubscription } from './useHostSubscription';
import { useHost } from './useHost';

export type BoostFeature = 
  | 'priority_feed' 
  | 'featured_badge' 
  | 'push_notifications' 
  | 'analytics' 
  | 'trending' 
  | 'social_templates';

/**
 * Hook to check if the current user's host profile has active boost features.
 * Party Boost subscription unlocks all features.
 */
export const useHostBoostFeatures = () => {
  const { host, isVerifiedHost, loading: hostLoading } = useHost();
  const { isSubscribed, loading: subLoading } = useHostSubscription(host?.id);

  const isBoosted = useMemo(() => {
    return isVerifiedHost && isSubscribed;
  }, [isVerifiedHost, isSubscribed]);

  /**
   * Check if a specific boost feature is available
   */
  const hasFeature = useCallback((feature: BoostFeature): boolean => {
    if (!isBoosted) return false;
    
    // Party Boost subscription includes ALL features
    const allFeatures: BoostFeature[] = [
      'priority_feed',
      'featured_badge', 
      'push_notifications',
      'analytics',
      'trending',
      'social_templates',
    ];
    
    return allFeatures.includes(feature);
  }, [isBoosted]);

  /**
   * Get list of all enabled features
   */
  const enabledFeatures = useMemo((): BoostFeature[] => {
    if (!isBoosted) return [];
    return [
      'priority_feed',
      'featured_badge',
      'push_notifications', 
      'analytics',
      'trending',
      'social_templates',
    ];
  }, [isBoosted]);

  return {
    isBoosted,
    hasFeature,
    enabledFeatures,
    loading: hostLoading || subLoading,
    hostId: host?.id,
  };
};

/**
 * Check if a specific host has boost features (for use in event listings)
 */
export const checkHostHasBoost = async (
  hostId: string,
  supabase: any
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('host_subscriptions')
      .select('status, expires_at')
      .eq('host_id', hostId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) return false;

    // Check if subscription is still valid
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

export default useHostBoostFeatures;
