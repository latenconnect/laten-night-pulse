import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SuggestedUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  mutual_friends: number;
  common_events: number;
}

export const useFriendSuggestions = (city?: string, limit: number = 5) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    if (!user) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      // Get users I already follow
      const { data: myConnections } = await supabase
        .from('user_connections')
        .select('following_id')
        .eq('follower_id', user.id);

      const excludeIds = new Set([
        user.id,
        ...(myConnections?.map(c => c.following_id) || [])
      ]);

      // Get events I've RSVPed to
      const { data: myRsvps } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', user.id);

      const myEventIds = myRsvps?.map(r => r.event_id) || [];

      // Find users who RSVPed to same events
      let commonEventUsers: { user_id: string; count: number }[] = [];
      if (myEventIds.length > 0) {
        const { data: eventUsers } = await supabase
          .from('event_rsvps')
          .select('user_id')
          .in('event_id', myEventIds)
          .neq('user_id', user.id);

        // Count occurrences
        const userCounts: Record<string, number> = {};
        eventUsers?.forEach(eu => {
          if (!excludeIds.has(eu.user_id)) {
            userCounts[eu.user_id] = (userCounts[eu.user_id] || 0) + 1;
          }
        });
        commonEventUsers = Object.entries(userCounts)
          .map(([user_id, count]) => ({ user_id, count }))
          .sort((a, b) => b.count - a.count);
      }

      // Get friends of friends (mutual friends)
      const { data: friendsOfFriends } = await supabase
        .from('user_connections')
        .select('following_id')
        .in('follower_id', myConnections?.map(c => c.following_id) || [])
        .eq('status', 'active');

      const mutualCounts: Record<string, number> = {};
      friendsOfFriends?.forEach(fof => {
        if (!excludeIds.has(fof.following_id)) {
          mutualCounts[fof.following_id] = (mutualCounts[fof.following_id] || 0) + 1;
        }
      });

      // Combine and score users
      const allCandidates = new Set([
        ...commonEventUsers.map(u => u.user_id),
        ...Object.keys(mutualCounts)
      ]);

      // Get profiles for candidates
      const candidateIds = [...allCandidates].slice(0, 20);
      
      if (candidateIds.length === 0) {
        // Fallback: get users from same city
        let cityQuery = supabase
          .from('profiles')
          .select('id, display_name, avatar_url, city')
          .neq('id', user.id);

        if (city) {
          cityQuery = cityQuery.eq('city', city);
        }

        const { data: cityUsers } = await cityQuery.limit(limit);
        
        const filteredCityUsers = (cityUsers || [])
          .filter(u => !excludeIds.has(u.id))
          .map(u => ({
            ...u,
            mutual_friends: 0,
            common_events: 0
          }));

        setSuggestions(filteredCityUsers);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, city')
        .in('id', candidateIds);

      // Score and rank
      const scored = (profiles || []).map(profile => {
        const commonEvents = commonEventUsers.find(u => u.user_id === profile.id)?.count || 0;
        const mutualFriends = mutualCounts[profile.id] || 0;
        const sameCity = city && profile.city?.toLowerCase() === city.toLowerCase() ? 1 : 0;
        
        return {
          ...profile,
          mutual_friends: mutualFriends,
          common_events: commonEvents,
          score: (commonEvents * 3) + (mutualFriends * 2) + sameCity
        };
      }).sort((a, b) => b.score - a.score);

      setSuggestions(scored.slice(0, limit));
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, city, limit]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { suggestions, loading, refetch: fetchSuggestions };
};
