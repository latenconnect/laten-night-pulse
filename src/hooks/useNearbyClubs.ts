import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, OpeningHours } from './useClubs';

export const useNearbyClubs = (city: string | undefined, excludeId: string | undefined, limit: number = 6) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) {
      setLoading(false);
      return;
    }

    const fetchNearbyClubs = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('id, name, address, city, latitude, longitude, rating, price_level, photos, google_maps_uri, business_status, opening_hours, venue_type, description, services, highlights, music_genres, crowd_info')
          .eq('is_active', true)
          .eq('city', city)
          .in('venue_type', ['night_club', 'club', 'bar', 'pub', 'lounge'])
          .neq('id', excludeId || '')
          .order('rating', { ascending: false, nullsFirst: false })
          .limit(limit);

        if (error) throw error;

        setClubs((data || []).map(club => ({
          ...club,
          opening_hours: club.opening_hours as OpeningHours | null,
          crowd_info: club.crowd_info as Club['crowd_info']
        })));
      } catch (err) {
        console.error('Error fetching nearby clubs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyClubs();
  }, [city, excludeId, limit]);

  return { clubs, loading };
};
