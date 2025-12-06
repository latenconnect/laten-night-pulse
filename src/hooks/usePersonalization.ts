import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { DbEvent } from './useEvents';

export type InteractionType = 'view' | 'save' | 'rsvp' | 'share' | 'click';

export interface UserPreferences {
  id: string;
  user_id: string;
  pref_club: number;
  pref_house_party: number;
  pref_university: number;
  pref_festival: number;
  pref_public: number;
  avg_price_preference: number;
  preferred_cities: string[];
  updated_at: string;
}

export interface PersonalizedEvent extends DbEvent {
  relevanceScore: number;
}

export const usePersonalization = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
    } else {
      setPreferences(data as UserPreferences | null);
    }
    setLoading(false);
  };

  const trackInteraction = useCallback(async (
    interactionType: InteractionType,
    eventId?: string,
    clubId?: string
  ) => {
    if (!user) return false;
    
    // Don't track if neither event nor club is provided
    if (!eventId && !clubId) return false;

    const { error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        interaction_type: interactionType,
        event_id: eventId || null,
        club_id: clubId || null,
      });

    if (error) {
      console.error('Error tracking interaction:', error);
      return false;
    }

    // Refresh preferences after tracking
    fetchPreferences();
    return true;
  }, [user]);

  const calculateRelevanceScore = useCallback((event: DbEvent): number => {
    if (!preferences) return 50; // Default score if no preferences

    let score = 0;

    // Event type preference (40% weight)
    const typeKey = `pref_${event.type}` as keyof UserPreferences;
    const typePreference = (preferences[typeKey] as number) || 50;
    score += typePreference * 0.4;

    // City preference (30% weight)
    const cityPref = preferences.preferred_cities?.includes(event.city) ? 100 : 50;
    score += cityPref * 0.3;

    // Price preference (20% weight)
    const eventPrice = event.price || 0;
    const avgPricePref = preferences.avg_price_preference || 0;
    const priceDiff = Math.abs(eventPrice - avgPricePref);
    const priceScore = Math.max(0, 100 - (priceDiff / 100)); // Lower score if price differs a lot
    score += priceScore * 0.2;

    // Featured boost (10% weight)
    if (event.is_featured) {
      score += 10;
    }

    return Math.round(score);
  }, [preferences]);

  const sortByRelevance = useCallback((events: DbEvent[]): PersonalizedEvent[] => {
    return events
      .map(event => ({
        ...event,
        relevanceScore: calculateRelevanceScore(event),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [calculateRelevanceScore]);

  return {
    preferences,
    loading,
    trackInteraction,
    calculateRelevanceScore,
    sortByRelevance,
    refetch: fetchPreferences,
  };
};

export const useTrackEventView = (eventId: string | undefined) => {
  const { trackInteraction } = usePersonalization();
  const { user } = useAuth();

  useEffect(() => {
    if (user && eventId) {
      // Track view after a small delay to ensure it's an intentional view
      const timer = setTimeout(() => {
        trackInteraction('view', eventId);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [eventId, user, trackInteraction]);
};

export const useTrackClubView = (clubId: string | undefined) => {
  const { trackInteraction } = usePersonalization();
  const { user } = useAuth();

  useEffect(() => {
    if (user && clubId) {
      const timer = setTimeout(() => {
        trackInteraction('view', undefined, clubId);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [clubId, user, trackInteraction]);
};