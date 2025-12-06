import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { DbEvent } from './useEvents';
import { usePersonalization, PersonalizedEvent } from './usePersonalization';

export const usePersonalizedFeed = (limit: number = 20) => {
  const { user } = useAuth();
  const { selectedCity } = useApp();
  const { sortByRelevance, preferences, loading: prefsLoading } = usePersonalization();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching events for feed:', error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };

    fetchEvents();
  }, [limit]);

  // Personalized events sorted by relevance
  const personalizedEvents = useMemo((): PersonalizedEvent[] => {
    if (!user || !preferences) {
      // For non-authenticated users, return events with default score
      return events.map(event => ({
        ...event,
        relevanceScore: event.is_featured ? 75 : 50,
      }));
    }

    return sortByRelevance(events);
  }, [events, user, preferences, sortByRelevance]);

  // Events filtered by selected city
  const cityEvents = useMemo(() => {
    return personalizedEvents.filter(event => event.city === selectedCity);
  }, [personalizedEvents, selectedCity]);

  // Featured events (always show at top)
  const featuredEvents = useMemo(() => {
    return personalizedEvents.filter(event => event.is_featured);
  }, [personalizedEvents]);

  // "For You" recommendations based on preferences
  const forYouEvents = useMemo(() => {
    if (!user || !preferences) return [];
    
    return personalizedEvents
      .filter(event => event.relevanceScore >= 60)
      .slice(0, 5);
  }, [personalizedEvents, user, preferences]);

  // Trending events (high RSVP count)
  const trendingEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => (b.actual_rsvp || 0) - (a.actual_rsvp || 0))
      .slice(0, 5)
      .map(event => ({
        ...event,
        relevanceScore: 50,
      }));
  }, [events]);

  return {
    allEvents: personalizedEvents,
    cityEvents,
    featuredEvents,
    forYouEvents,
    trendingEvents,
    loading: loading || prefsLoading,
    hasPersonalization: !!user && !!preferences,
  };
};