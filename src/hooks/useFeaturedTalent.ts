import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DJProfile } from './useDJs';
import type { BartenderProfile } from './useBartenders';

export interface FeaturedDJ extends DJProfile {
  subscription_status: string;
}

export interface FeaturedBartender extends BartenderProfile {
  subscription_status: string;
}

export const useFeaturedDJs = (limit = 5) => {
  return useQuery({
    queryKey: ['featured-djs', limit],
    queryFn: async () => {
      // Get DJs with active subscriptions
      const { data, error } = await supabase
        .from('dj_profiles')
        .select(`
          *,
          dj_subscriptions!inner (
            status,
            expires_at
          )
        `)
        .eq('is_active', true)
        .eq('dj_subscriptions.status', 'active')
        .gt('dj_subscriptions.expires_at', new Date().toISOString())
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(dj => ({
        ...dj,
        subscription_status: 'active',
        dj_subscriptions: undefined,
      })) as FeaturedDJ[];
    },
  });
};

export const useFeaturedBartenders = (limit = 5) => {
  return useQuery({
    queryKey: ['featured-bartenders', limit],
    queryFn: async () => {
      // Get Bartenders with active subscriptions
      const { data, error } = await supabase
        .from('bartender_profiles')
        .select(`
          *,
          bartender_subscriptions!inner (
            status,
            expires_at
          )
        `)
        .eq('is_active', true)
        .eq('bartender_subscriptions.status', 'active')
        .gt('bartender_subscriptions.expires_at', new Date().toISOString())
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(bartender => ({
        ...bartender,
        subscription_status: 'active',
        bartender_subscriptions: undefined,
      })) as FeaturedBartender[];
    },
  });
};

export const useFeaturedTalent = (limit = 3) => {
  const { data: featuredDJs, isLoading: djsLoading } = useFeaturedDJs(limit);
  const { data: featuredBartenders, isLoading: bartendersLoading } = useFeaturedBartenders(limit);

  return {
    featuredDJs: featuredDJs || [],
    featuredBartenders: featuredBartenders || [],
    isLoading: djsLoading || bartendersLoading,
    hasFeatured: (featuredDJs?.length || 0) > 0 || (featuredBartenders?.length || 0) > 0,
  };
};
