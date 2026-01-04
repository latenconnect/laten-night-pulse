import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface FriendActivity {
  id: string;
  user_id: string;
  activity_type: 'rsvp' | 'save' | 'attend' | 'host' | 'review';
  event_id: string | null;
  club_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  event?: {
    id: string;
    name: string;
    cover_image: string | null;
    start_time: string;
    location_name: string;
  };
}

export const useFriendActivity = (limit: number = 10) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      // Get friends I follow
      const { data: connections } = await supabase
        .from('user_connections')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'active');

      const friendIds = connections?.map(c => c.following_id) || [];
      
      if (friendIds.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Fetch friend activities
      const { data: activitiesData, error } = await supabase
        .from('friend_activity')
        .select('*')
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get unique user IDs and event IDs
      const userIds = [...new Set(activitiesData?.map(a => a.user_id) || [])];
      const eventIds = [...new Set(activitiesData?.filter(a => a.event_id).map(a => a.event_id) || [])];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      // Fetch events
      const { data: events } = await supabase
        .from('events')
        .select('id, name, cover_image, start_time, location_name')
        .in('id', eventIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const eventsMap = new Map(events?.map(e => [e.id, e]) || []);

      // Combine data
      const enrichedActivities: FriendActivity[] = (activitiesData || []).map(activity => ({
        ...activity,
        activity_type: activity.activity_type as FriendActivity['activity_type'],
        metadata: (activity.metadata || {}) as Record<string, unknown>,
        profile: profilesMap.get(activity.user_id),
        event: activity.event_id ? eventsMap.get(activity.event_id) : undefined
      }));

      setActivities(enrichedActivities);
    } catch (error) {
      console.error('Error fetching friend activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, refetch: fetchActivities };
};
