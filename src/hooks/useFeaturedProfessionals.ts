import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Professional } from './useProfessionals';

export interface FeaturedProfessional extends Professional {
  subscription_status: string;
}

export const useFeaturedProfessionals = (limit = 6) => {
  return useQuery({
    queryKey: ['featured-professionals', limit],
    queryFn: async () => {
      // Get professionals with active subscriptions
      const { data, error } = await supabase
        .from('professionals')
        .select(`
          *,
          professional_subscriptions!inner (
            status,
            expires_at
          )
        `)
        .eq('is_active', true)
        .eq('professional_subscriptions.status', 'active')
        .gt('professional_subscriptions.expires_at', new Date().toISOString())
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(pro => ({
        ...pro,
        subscription_status: 'active',
        professional_subscriptions: undefined,
      })) as FeaturedProfessional[];
    },
  });
};
