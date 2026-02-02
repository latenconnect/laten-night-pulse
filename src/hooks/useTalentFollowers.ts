import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface TalentFollow {
  id: string;
  follower_user_id: string;
  dj_profile_id: string | null;
  bartender_profile_id: string | null;
  host_id: string | null;
  created_at: string;
}

export const useTalentFollowers = () => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<TalentFollow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowing = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('talent_followers')
        .select('*')
        .eq('follower_user_id', user.id);

      if (error) throw error;
      setFollowing((data || []) as TalentFollow[]);
    } catch (error) {
      console.error('Error fetching talent follows:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const followDJ = async (djProfileId: string) => {
    if (!user) {
      toast.error('Please sign in to follow');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('talent_followers')
        .insert({
          follower_user_id: user.id,
          dj_profile_id: djProfileId,
        })
        .select()
        .single();

      if (error) throw error;

      setFollowing(prev => [...prev, data as TalentFollow]);
      toast.success('Following DJ! You\'ll be notified when they play 🎧');
      return true;
    } catch (error) {
      console.error('Follow DJ error:', error);
      toast.error('Failed to follow');
      return false;
    }
  };

  const followBartender = async (bartenderProfileId: string) => {
    if (!user) {
      toast.error('Please sign in to follow');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('talent_followers')
        .insert({
          follower_user_id: user.id,
          bartender_profile_id: bartenderProfileId,
        })
        .select()
        .single();

      if (error) throw error;

      setFollowing(prev => [...prev, data as TalentFollow]);
      toast.success('Following bartender! 🍹');
      return true;
    } catch (error) {
      console.error('Follow bartender error:', error);
      toast.error('Failed to follow');
      return false;
    }
  };

  const followHost = async (hostId: string) => {
    if (!user) {
      toast.error('Please sign in to follow');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('talent_followers')
        .insert({
          follower_user_id: user.id,
          host_id: hostId,
        })
        .select()
        .single();

      if (error) throw error;

      setFollowing(prev => [...prev, data as TalentFollow]);
      toast.success('Following host! You\'ll see their events first 🎉');
      return true;
    } catch (error) {
      console.error('Follow host error:', error);
      toast.error('Failed to follow');
      return false;
    }
  };

  const unfollow = async (followId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('talent_followers')
        .delete()
        .eq('id', followId)
        .eq('follower_user_id', user.id);

      if (error) throw error;

      setFollowing(prev => prev.filter(f => f.id !== followId));
      toast.success('Unfollowed');
      return true;
    } catch (error) {
      console.error('Unfollow error:', error);
      toast.error('Failed to unfollow');
      return false;
    }
  };

  const isFollowingDJ = (djProfileId: string) => {
    return following.some(f => f.dj_profile_id === djProfileId);
  };

  const isFollowingBartender = (bartenderProfileId: string) => {
    return following.some(f => f.bartender_profile_id === bartenderProfileId);
  };

  const isFollowingHost = (hostId: string) => {
    return following.some(f => f.host_id === hostId);
  };

  const getFollowIdForDJ = (djProfileId: string) => {
    return following.find(f => f.dj_profile_id === djProfileId)?.id;
  };

  const getFollowIdForBartender = (bartenderProfileId: string) => {
    return following.find(f => f.bartender_profile_id === bartenderProfileId)?.id;
  };

  const getFollowIdForHost = (hostId: string) => {
    return following.find(f => f.host_id === hostId)?.id;
  };

  return {
    following,
    loading,
    followDJ,
    followBartender,
    followHost,
    unfollow,
    isFollowingDJ,
    isFollowingBartender,
    isFollowingHost,
    getFollowIdForDJ,
    getFollowIdForBartender,
    getFollowIdForHost,
    refetch: fetchFollowing,
  };
};

// Get follower count for talent
export const useTalentFollowerCount = (type: 'dj' | 'bartender' | 'host', profileId: string) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const fetchCount = async () => {
      let followerCount = 0;
      
      if (type === 'dj') {
        const { count, error } = await supabase
          .from('talent_followers')
          .select('*', { count: 'exact', head: true })
          .eq('dj_profile_id', profileId);
        if (!error) followerCount = count || 0;
      } else if (type === 'bartender') {
        const { count, error } = await supabase
          .from('talent_followers')
          .select('*', { count: 'exact', head: true })
          .eq('bartender_profile_id', profileId);
        if (!error) followerCount = count || 0;
      } else if (type === 'host') {
        const { count, error } = await supabase
          .from('talent_followers')
          .select('*', { count: 'exact', head: true })
          .eq('host_id', profileId);
        if (!error) followerCount = count || 0;
      }

      setCount(followerCount);
      setLoading(false);
    };

    fetchCount();
  }, [type, profileId]);

  return { count, loading };
};
