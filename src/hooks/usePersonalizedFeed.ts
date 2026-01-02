import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { DbEvent } from './useEvents';
import { usePersonalization, PersonalizedEvent } from './usePersonalization';

interface EventWithBoost extends DbEvent {
  hostHasBoost?: boolean;
}

export const usePersonalizedFeed = (limit: number = 20) => {
  const { user } = useAuth();
  const { selectedCity } = useApp();
  const { sortByRelevance, preferences, loading: prefsLoading } = usePersonalization();
  const [events, setEvents] = useState<EventWithBoost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      // Fetch events
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching events for feed:', error);
        setEvents([]);
        setLoading(false);
        return;
      }

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Get unique host IDs
      const hostIds = [...new Set(eventsData.map(e => e.host_id))];
      
      // Fetch active host subscriptions (Party Boost)
      const { data: hostSubs } = await supabase
        .from('host_subscriptions')
        .select('host_id, status, expires_at')
        .in('host_id', hostIds)
        .eq('status', 'active');

      // Create set of boosted host IDs
      const boostedHostIds = new Set(
        (hostSubs || [])
          .filter(s => s.expires_at && new Date(s.expires_at) > new Date())
          .map(s => s.host_id)
      );

      // Mark events with boost status
      const eventsWithBoost: EventWithBoost[] = eventsData.map(event => ({
        ...event,
        hostHasBoost: boostedHostIds.has(event.host_id),
      }));

      setEvents(eventsWithBoost);
      setLoading(false);
    };

    fetchEvents();
  }, [limit]);

  // Personalized events sorted by relevance WITH boost priority
  const personalizedEvents = useMemo((): PersonalizedEvent[] => {
    let scoredEvents: PersonalizedEvent[];

    if (!user || !preferences) {
      // For non-authenticated users, return events with default score
      scoredEvents = events.map(event => ({
        ...event,
        // BOOST FEATURE: Boosted hosts get higher base score
        relevanceScore: event.hostHasBoost ? 85 : (event.is_featured ? 75 : 50),
      }));
    } else {
      // Get personalized scores
      scoredEvents = sortByRelevance(events).map(event => ({
        ...event,
        // BOOST FEATURE: Add +20 to relevance score for boosted hosts
        relevanceScore: (event as EventWithBoost).hostHasBoost 
          ? event.relevanceScore + 20 
          : event.relevanceScore,
      }));
    }

    // Sort by relevance score (boosted events naturally rise to top)
    return scoredEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [events, user, preferences, sortByRelevance]);

  // Events filtered by selected city
  const cityEvents = useMemo(() => {
    return personalizedEvents.filter(event => event.city === selectedCity);
  }, [personalizedEvents, selectedCity]);

  // Featured events - includes both manually featured AND boosted hosts
  const featuredEvents = useMemo(() => {
    return personalizedEvents.filter(event => 
      event.is_featured || (event as EventWithBoost).hostHasBoost
    );
  }, [personalizedEvents]);

  // "For You" recommendations based on preferences
  const forYouEvents = useMemo(() => {
    if (!user || !preferences) return [];
    
    return personalizedEvents
      .filter(event => event.relevanceScore >= 60)
      .slice(0, 5);
  }, [personalizedEvents, user, preferences]);

  // Trending events (high RSVP count + boosted)
  const trendingEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        // Boosted events get priority in trending
        const aBoostBonus = a.hostHasBoost ? 1000 : 0;
        const bBoostBonus = b.hostHasBoost ? 1000 : 0;
        return (b.actual_rsvp || 0) + bBoostBonus - ((a.actual_rsvp || 0) + aBoostBonus);
      })
      .slice(0, 5)
      .map(event => ({
        ...event,
        relevanceScore: event.hostHasBoost ? 80 : 50,
      }));
  }, [events]);

  // Boosted events only
  const boostedEvents = useMemo(() => {
    return personalizedEvents.filter(event => (event as EventWithBoost).hostHasBoost);
  }, [personalizedEvents]);

  return {
    allEvents: personalizedEvents,
    cityEvents,
    featuredEvents,
    forYouEvents,
    trendingEvents,
    boostedEvents,
    loading: loading || prefsLoading,
    hasPersonalization: !!user && !!preferences,
  };
};