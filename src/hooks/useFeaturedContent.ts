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

      // Only show clubs that are explicitly featured (curated by admin)
      // This ensures only quality venues like Ötkert, Szimpla Kert appear
      let query = supabase
        .from('clubs')
        .select('id, name, address, city, latitude, longitude, rating, price_level, photos, google_maps_uri, business_status, opening_hours, venue_type, is_featured')
        .eq('is_active', true)
        .eq('is_featured', true)
        .not('photos', 'is', null) // Must have photos
        .gte('rating', 4.0) // High-rated only
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (city) {
        query = query.eq('city', city);
      }

      let { data, error } = await query;

      // Filter to ensure venues have actual quality photos (not empty arrays)
      const qualityVenues = (data || []).filter(club => 
        club.photos && 
        Array.isArray(club.photos) && 
        club.photos.length > 0
      );

      if (error) {
        console.error('Error fetching featured clubs:', error);
        setClubs([]);
      } else {
        setClubs(qualityVenues.map(club => ({
          ...club,
          opening_hours: club.opening_hours as Club['opening_hours'],
          crowd_info: null,
          description: null,
          services: null,
          highlights: null,
          music_genres: null,
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