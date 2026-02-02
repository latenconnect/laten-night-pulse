import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface EventHeat {
  id: string;
  event_id: string;
  heat_level: number;
  current_attendees: number;
  peak_attendees: number;
  vibe_tags: string[];
  updated_at: string;
}

export interface FriendLocation {
  id: string;
  user_id: string;
  event_id: string | null;
  status: 'available' | 'heading_out' | 'at_party' | 'going_home';
  visible_to: 'friends' | 'close_friends' | 'nobody';
  updated_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  event?: {
    name: string;
    location_name: string;
  };
}

export interface HotEvent {
  id: string;
  name: string;
  location_name: string;
  cover_image: string | null;
  start_time: string;
  heat_level: number;
  current_attendees: number;
  friends_going: number;
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', emoji: '🟢' },
  { value: 'heading_out', label: 'Heading Out', emoji: '🚗' },
  { value: 'at_party', label: 'At Party', emoji: '🎉' },
  { value: 'going_home', label: 'Going Home', emoji: '🏠' },
];

const VISIBILITY_OPTIONS = [
  { value: 'friends', label: 'All Friends', emoji: '👥' },
  { value: 'close_friends', label: 'Close Friends Only', emoji: '💜' },
  { value: 'nobody', label: 'Hidden', emoji: '🔒' },
];

export const useTonightMode = () => {
  const { user } = useAuth();
  const [hotEvents, setHotEvents] = useState<HotEvent[]>([]);
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [myLocation, setMyLocation] = useState<FriendLocation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTonightData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get tonight's date range (6 PM today to 6 AM tomorrow)
      const now = new Date();
      const todayEvening = new Date(now);
      todayEvening.setHours(18, 0, 0, 0);
      
      const tomorrowMorning = new Date(now);
      tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
      tomorrowMorning.setHours(6, 0, 0, 0);

      // If before 6 PM, use yesterday evening to this morning
      let startTime = todayEvening;
      let endTime = tomorrowMorning;
      if (now.getHours() < 6) {
        startTime = new Date(now);
        startTime.setDate(startTime.getDate() - 1);
        startTime.setHours(18, 0, 0, 0);
        endTime = new Date(now);
        endTime.setHours(6, 0, 0, 0);
      }

      // Fetch events happening tonight with heat data
      const { data: events } = await supabase
        .from('events')
        .select(`
          id, name, location_name, cover_image, start_time,
          event_heat (heat_level, current_attendees)
        `)
        .eq('is_active', true)
        .gte('start_time', startTime.toISOString())
        .lte('start_time', endTime.toISOString())
        .order('start_time');

      if (events) {
        // Get friend RSVPs for these events
        const eventIds = events.map(e => e.id);
        const { data: friendConnections } = await supabase
          .from('user_connections')
          .select('following_id')
          .eq('follower_id', user.id);

        const friendIds = friendConnections?.map(f => f.following_id) || [];

        let friendRsvps: { event_id: string }[] = [];
        if (friendIds.length > 0 && eventIds.length > 0) {
          const { data } = await supabase
            .from('event_rsvps')
            .select('event_id')
            .in('event_id', eventIds)
            .in('user_id', friendIds);
          friendRsvps = data || [];
        }

        const rsvpCounts: Record<string, number> = {};
        friendRsvps.forEach(r => {
          rsvpCounts[r.event_id] = (rsvpCounts[r.event_id] || 0) + 1;
        });

        const hotEventsList: HotEvent[] = events.map(e => {
          const heat = Array.isArray(e.event_heat) ? e.event_heat[0] : e.event_heat;
          return {
            id: e.id,
            name: e.name,
            location_name: e.location_name,
            cover_image: e.cover_image,
            start_time: e.start_time,
            heat_level: heat?.heat_level || 0,
            current_attendees: heat?.current_attendees || 0,
            friends_going: rsvpCounts[e.id] || 0,
          };
        }).sort((a, b) => b.heat_level - a.heat_level);

        setHotEvents(hotEventsList);
      }

      // Fetch friend locations
      const { data: locations } = await supabase
        .from('friend_locations')
        .select('*')
        .neq('user_id', user.id);

      if (locations && locations.length > 0) {
        // Fetch profiles and event names
        const userIds = locations.map(l => l.user_id);
        const eventIds = locations.filter(l => l.event_id).map(l => l.event_id);

        const { data: profiles } = await supabase
          .from('safe_profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        let eventMap = new Map<string, { name: string; location_name: string }>();
        if (eventIds.length > 0) {
          const { data: eventsData } = await supabase
            .from('events')
            .select('id, name, location_name')
            .in('id', eventIds);
          eventMap = new Map(eventsData?.map(e => [e.id, { name: e.name, location_name: e.location_name }]) || []);
        }

        setFriendLocations(locations.map(l => ({
          ...l as FriendLocation,
          profile: profileMap.get(l.user_id),
          event: l.event_id ? eventMap.get(l.event_id) : undefined,
        })));
      }

      // Fetch my location
      const { data: myLoc } = await supabase
        .from('friend_locations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (myLoc) {
        setMyLocation(myLoc as FriendLocation);
      }

    } catch (error) {
      console.error('Error fetching tonight data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTonightData();

    // Set up realtime subscription for event heat
    const heatChannel = supabase
      .channel('event_heat_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_heat' }, () => {
        fetchTonightData();
      })
      .subscribe();

    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchTonightData, 30000);

    return () => {
      supabase.removeChannel(heatChannel);
      clearInterval(interval);
    };
  }, [fetchTonightData]);

  const updateMyStatus = async (status: FriendLocation['status'], eventId?: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('friend_locations')
        .upsert({
          user_id: user.id,
          status,
          event_id: eventId || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setMyLocation(data as FriendLocation);
      toast.success(`Status updated: ${STATUS_OPTIONS.find(s => s.value === status)?.label}`);
      return true;
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
      return false;
    }
  };

  const updateVisibility = async (visibility: FriendLocation['visible_to']) => {
    if (!user || !myLocation) return false;

    try {
      const { error } = await supabase
        .from('friend_locations')
        .update({ visible_to: visibility })
        .eq('user_id', user.id);

      if (error) throw error;

      setMyLocation(prev => prev ? { ...prev, visible_to: visibility } : null);
      toast.success(`Visibility: ${VISIBILITY_OPTIONS.find(v => v.value === visibility)?.label}`);
      return true;
    } catch (error) {
      console.error('Update visibility error:', error);
      return false;
    }
  };

  const getHeatColor = (level: number) => {
    if (level >= 80) return 'text-red-500';
    if (level >= 60) return 'text-orange-500';
    if (level >= 40) return 'text-yellow-500';
    if (level >= 20) return 'text-green-500';
    return 'text-gray-500';
  };

  const getHeatEmoji = (level: number) => {
    if (level >= 80) return '🔥🔥🔥';
    if (level >= 60) return '🔥🔥';
    if (level >= 40) return '🔥';
    if (level >= 20) return '✨';
    return '💤';
  };

  return {
    hotEvents,
    friendLocations,
    myLocation,
    loading,
    updateMyStatus,
    updateVisibility,
    getHeatColor,
    getHeatEmoji,
    refetch: fetchTonightData,
    STATUS_OPTIONS,
    VISIBILITY_OPTIONS,
  };
};
