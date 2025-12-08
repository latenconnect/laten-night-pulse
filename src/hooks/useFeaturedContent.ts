import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DbEvent } from './useEvents';
import { Club } from './useClubs';

export const useFeaturedEvents = (city?: string, limit: number = 5) => {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      setLoading(true);

      let query = supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit);

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching featured events:', error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };

    fetchFeaturedEvents();
  }, [city, limit]);

  return { events, loading };
};

export const useFeaturedClubs = (city?: string, limit: number = 5) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedClubs = async () => {
      setLoading(true);

      // First try to get explicitly featured clubs
      let query = supabase
        .from('clubs')
        .select('id, name, address, city, latitude, longitude, rating, price_level, photos, google_maps_uri, business_status, opening_hours, venue_type, is_featured')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (city) {
        query = query.eq('city', city);
      }

      let { data, error } = await query;

      // If no featured clubs, fall back to top-rated nightlife venues
      if (!error && (!data || data.length === 0)) {
        let fallbackQuery = supabase
          .from('clubs')
          .select('id, name, address, city, latitude, longitude, rating, price_level, photos, google_maps_uri, business_status, opening_hours, venue_type, is_featured')
          .eq('is_active', true)
          .in('venue_type', ['night_club', 'club', 'bar', 'pub', 'lounge'])
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(limit);

        if (city) {
          fallbackQuery = fallbackQuery.eq('city', city);
        }

        const fallbackResult = await fallbackQuery;
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Error fetching featured clubs:', error);
      } else {
        setClubs((data || []).map(club => ({
          ...club,
          opening_hours: club.opening_hours as Club['opening_hours'],
        })));
      }
      setLoading(false);
    };

    fetchFeaturedClubs();
  }, [city, limit]);

  return { clubs, loading };
};

// Hook for admin to manage featured status
export const useFeaturedManagement = () => {
  const setEventFeatured = async (eventId: string, isFeatured: boolean) => {
    const { error } = await supabase
      .from('events')
      .update({ is_featured: isFeatured })
      .eq('id', eventId);

    return !error;
  };

  const setClubFeatured = async (clubId: string, isFeatured: boolean) => {
    const { error } = await supabase
      .from('clubs')
      .update({ is_featured: isFeatured })
      .eq('id', clubId);

    return !error;
  };

  return { setEventFeatured, setClubFeatured };
};