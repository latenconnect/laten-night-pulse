import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Json } from '@/integrations/supabase/types';

export interface OpeningHours {
  weekday_text?: string[];
  open_now?: boolean;
}

export interface CrowdInfo {
  age_range?: string;
  dress_code?: string;
  atmosphere?: string;
  best_for?: string;
}

export interface Club {
  id: string;
  name: string;
  address: string | null;
  city: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  price_level: number | null;
  photos: string[] | null;
  google_maps_uri: string | null;
  business_status: string | null;
  opening_hours: OpeningHours | null;
  venue_type: string | null;
  description: string | null;
  services: string[] | null;
  highlights: string[] | null;
  music_genres: string[] | null;
  crowd_info: CrowdInfo | null;
}

export const useClubs = (limit?: number, filterByCity?: boolean, prioritizeNightlife?: boolean) => {
  const { selectedCity } = useApp();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('clubs')
          .select('id, name, address, city, latitude, longitude, rating, price_level, photos, google_maps_uri, business_status, opening_hours, venue_type, description, services, highlights, music_genres, crowd_info')
          .eq('is_active', true)
          .not('photos', 'is', null) // Must have photos
          .order('rating', { ascending: false, nullsFirst: false });

        // For nightlife prioritization, only show featured clubs with good ratings
        if (prioritizeNightlife) {
          query = query
            .eq('is_featured', true) // Only admin-curated venues
            .gte('rating', 4.0); // High-rated only
        }

        // Only filter by city if explicitly requested
        if (filterByCity) {
          query = query.eq('city', selectedCity);
        }

        if (limit) {
          query = query.limit(limit * 2);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        
        // Filter to ensure venues have actual quality photos (not empty arrays)
        const qualityVenues = (data || []).filter(club => 
          club.photos && 
          Array.isArray(club.photos) && 
          club.photos.length > 0
        );
        
        // Map data to Club type with proper casting
        const mappedClubs: Club[] = qualityVenues.slice(0, limit || qualityVenues.length).map(club => ({
          ...club,
          opening_hours: club.opening_hours as OpeningHours | null,
          crowd_info: club.crowd_info as CrowdInfo | null
        }));
        setClubs(mappedClubs);
      } catch (err) {
        console.error('Error fetching clubs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [selectedCity, limit, filterByCity, prioritizeNightlife]);

  return { clubs, loading, error };
};
