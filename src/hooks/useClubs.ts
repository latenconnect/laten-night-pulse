import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

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
}

export const useClubs = (limit?: number, filterByCity?: boolean) => {
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
          .select('id, name, address, city, latitude, longitude, rating, price_level, photos, google_maps_uri')
          .eq('is_active', true)
          .order('rating', { ascending: false, nullsFirst: false });

        // Only filter by city if explicitly requested
        if (filterByCity) {
          query = query.eq('city', selectedCity);
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setClubs(data || []);
      } catch (err) {
        console.error('Error fetching clubs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [selectedCity, limit, filterByCity]);

  return { clubs, loading, error };
};
