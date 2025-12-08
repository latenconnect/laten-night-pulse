import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, OpeningHours } from './useClubs';

export const useClubById = (id: string | undefined) => {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchClub = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('clubs')
          .select('id, name, address, city, latitude, longitude, rating, price_level, photos, google_maps_uri, business_status, opening_hours, venue_type')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        
        if (data) {
          setClub({
            ...data,
            opening_hours: data.opening_hours as OpeningHours | null
          });
        }
      } catch (err) {
        console.error('Error fetching club:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch club');
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [id]);

  return { club, loading, error };
};
