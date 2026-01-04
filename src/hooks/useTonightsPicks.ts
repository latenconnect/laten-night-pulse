import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface TonightsEvent {
  id: string;
  name: string;
  type: string;
  city: string;
  location_name: string;
  start_time: string;
  price: number | null;
  cover_image: string | null;
}

interface NotificationPreferences {
  tonights_picks_enabled: boolean;
  tonights_picks_time: string;
  weekly_recap_enabled: boolean;
  friend_activity_enabled: boolean;
}

export const useTonightsPicks = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<TonightsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const fetchTonightsEvents = useCallback(async () => {
    try {
      const now = new Date();
      const tonight = new Date(now);
      tonight.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          type,
          city,
          location_name,
          start_time,
          price,
          cover_image
        `)
        .eq('is_active', true)
        .gte('start_time', now.toISOString())
        .lte('start_time', tonight.toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching tonight\'s events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPreferences({
          tonights_picks_enabled: data.tonights_picks_enabled ?? true,
          tonights_picks_time: data.tonights_picks_time ?? '18:00:00',
          weekly_recap_enabled: data.weekly_recap_enabled ?? true,
          friend_activity_enabled: data.friend_activity_enabled ?? true
        });
      } else {
        // Default preferences
        setPreferences({
          tonights_picks_enabled: true,
          tonights_picks_time: '18:00:00',
          weekly_recap_enabled: true,
          friend_activity_enabled: true
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchTonightsEvents();
    fetchPreferences();
  }, [fetchTonightsEvents, fetchPreferences]);

  const updatePreferences = async (
    updates: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          ...updates
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  };

  const triggerTonightsPicks = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.functions.invoke('tonights-picks', {
        body: { userId: user.id }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error triggering tonight\'s picks:', error);
      return false;
    }
  };

  return {
    events,
    loading,
    preferences,
    updatePreferences,
    triggerTonightsPicks,
    refetch: fetchTonightsEvents
  };
};
