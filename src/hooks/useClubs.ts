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

      // Keywords that indicate non-nightlife venues to exclude
      const excludedKeywords = ['wedding', 'catering', 'restaurant', 'hotel', 'pension', 'house', 'ház', 'étterem', 'esküvő', 'vendéglő', 'csárda', 'borház', 'pince', 'szálloda', 'szálló', 'ízműhely', 'műhely', 'fogadó', 'kúria', 'major', 'tanya', 'wine', 'winery', 'cellar', 'pincészet'];

      try {
        let query = supabase
          .from('clubs')
          .select('id, name, address, city, latitude, longitude, rating, price_level, photos, google_maps_uri, business_status, opening_hours, venue_type, description, services, highlights, music_genres, crowd_info')
          .eq('is_active', true)
          .order('rating', { ascending: false, nullsFirst: false });

        // Prioritize actual nightlife venues - only real clubs and lounges
        if (prioritizeNightlife) {
          query = query.in('venue_type', ['night_club', 'club', 'lounge', 'disco', 'dance_club']);
        }

        // Only filter by city if explicitly requested
        if (filterByCity) {
          query = query.eq('city', selectedCity);
        }

        // Fetch more to allow for client-side filtering
        if (limit) {
          query = query.limit(limit * 3);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        
        // Filter out venues with excluded keywords in name
        const filteredData = (data || []).filter(club => {
          const nameLower = club.name.toLowerCase();
          return !excludedKeywords.some(keyword => nameLower.includes(keyword.toLowerCase()));
        });
        
        // Map data to Club type with proper casting
        const mappedClubs: Club[] = filteredData.slice(0, limit || filteredData.length).map(club => ({
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
