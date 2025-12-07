import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface Cohost {
  id: string;
  event_id: string;
  host_id: string;
  role: string;
  added_at: string;
  added_by: string;
  host_display_name?: string;
  host_user_id?: string;
}

export interface AvailableHost {
  id: string;
  user_id: string;
  display_name: string;
  verification_status: string;
}

export const useEventCohosts = (eventId?: string) => {
  const [cohosts, setCohosts] = useState<Cohost[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCohosts = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_cohosts')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      setCohosts(data || []);
    } catch (error) {
      console.error('Error fetching cohosts:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchCohosts();
    }
  }, [eventId, fetchCohosts]);

  const searchHosts = async (query: string): Promise<AvailableHost[]> => {
    if (!query.trim() || query.length < 2) return [];

    try {
      // Search for verified hosts by their profile display name
      const { data: hosts, error: hostsError } = await supabase
        .from('hosts')
        .select('id, user_id, verification_status')
        .eq('verification_status', 'verified')
        .limit(10);

      if (hostsError) throw hostsError;

      if (!hosts || hosts.length === 0) return [];

      // Get profile info for these hosts
      const userIds = hosts.map(h => h.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds)
        .ilike('display_name', `%${query}%`);

      if (profilesError) throw profilesError;

      // Combine data
      return hosts
        .filter(h => profiles?.some(p => p.id === h.user_id))
        .map(h => {
          const profile = profiles?.find(p => p.id === h.user_id);
          return {
            id: h.id,
            user_id: h.user_id,
            display_name: profile?.display_name || 'Unknown',
            verification_status: h.verification_status
          };
        })
        .filter(h => h.user_id !== user?.id); // Exclude current user
    } catch (error) {
      console.error('Error searching hosts:', error);
      return [];
    }
  };

  const addCohost = async (hostId: string, role: string = 'cohost') => {
    if (!eventId || !user) {
      toast.error('Unable to add cohost');
      return false;
    }

    try {
      const { error } = await supabase
        .from('event_cohosts')
        .insert({
          event_id: eventId,
          host_id: hostId,
          role,
          added_by: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This host is already a cohost');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Cohost added!');
      fetchCohosts();
      return true;
    } catch (error) {
      console.error('Error adding cohost:', error);
      toast.error('Failed to add cohost');
      return false;
    }
  };

  const removeCohost = async (cohostId: string) => {
    try {
      const { error } = await supabase
        .from('event_cohosts')
        .delete()
        .eq('id', cohostId);

      if (error) throw error;

      toast.success('Cohost removed');
      fetchCohosts();
      return true;
    } catch (error) {
      console.error('Error removing cohost:', error);
      toast.error('Failed to remove cohost');
      return false;
    }
  };

  return {
    cohosts,
    loading,
    searchHosts,
    addCohost,
    removeCohost,
    refetch: fetchCohosts
  };
};
