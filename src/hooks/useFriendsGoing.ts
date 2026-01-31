import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface FriendGoingInfo {
  eventId: string;
  count: number;
  friends: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  }[];
}

export const useFriendsGoing = (eventIds: string[]) => {
  const { user } = useAuth();
  const [friendsGoingMap, setFriendsGoingMap] = useState<Map<string, FriendGoingInfo>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchFriendsGoing = useCallback(async () => {
    if (!user || eventIds.length === 0) {
      setFriendsGoingMap(new Map());
      return;
    }

    setLoading(true);
    try {
      // Get friends I follow
      const { data: connections } = await supabase
        .from('user_connections')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'active');

      const friendIds = connections?.map(c => c.following_id) || [];
      if (friendIds.length === 0) {
        setFriendsGoingMap(new Map());
        setLoading(false);
        return;
      }

      // Get RSVPs from friends for these events
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('event_id, user_id')
        .in('event_id', eventIds)
        .in('user_id', friendIds)
        .eq('status', 'going');

      if (!rsvps || rsvps.length === 0) {
        setFriendsGoingMap(new Map());
        setLoading(false);
        return;
      }

      // Get unique friend IDs who are going
      const goingFriendIds = [...new Set(rsvps.map(r => r.user_id))];

      // Fetch their profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', goingFriendIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build the map
      const resultMap = new Map<string, FriendGoingInfo>();
      
      eventIds.forEach(eventId => {
        const eventRsvps = rsvps.filter(r => r.event_id === eventId);
        const friends = eventRsvps
          .map(r => profileMap.get(r.user_id))
          .filter(Boolean) as FriendGoingInfo['friends'];

        if (friends.length > 0) {
          resultMap.set(eventId, {
            eventId,
            count: friends.length,
            friends,
          });
        }
      });

      setFriendsGoingMap(resultMap);
    } catch (error) {
      console.error('Error fetching friends going:', error);
    } finally {
      setLoading(false);
    }
  }, [user, eventIds.join(',')]);

  useEffect(() => {
    fetchFriendsGoing();
  }, [fetchFriendsGoing]);

  return { friendsGoingMap, loading, refetch: fetchFriendsGoing };
};

// Single event version
export const useFriendsGoingToEvent = (eventId: string | undefined) => {
  const { friendsGoingMap, loading, refetch } = useFriendsGoing(eventId ? [eventId] : []);
  
  const friendsGoing = eventId ? friendsGoingMap.get(eventId) : undefined;
  
  return { friendsGoing, loading, refetch };
};
