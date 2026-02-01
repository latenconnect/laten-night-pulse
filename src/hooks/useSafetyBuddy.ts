import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface SafetyBuddy {
  id: string;
  user_id: string;
  buddy_id: string;
  is_active: boolean;
  created_at: string;
  buddy_profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface SafetyCheckin {
  id: string;
  user_id: string;
  event_id: string | null;
  status: 'out' | 'safe' | 'alert';
  expected_home_time: string | null;
  checked_in_at: string | null;
  location_note: string | null;
  created_at: string;
}

export const useSafetyBuddy = () => {
  const { user } = useAuth();
  const [buddies, setBuddies] = useState<SafetyBuddy[]>([]);
  const [activeCheckin, setActiveCheckin] = useState<SafetyCheckin | null>(null);
  const [buddyCheckins, setBuddyCheckins] = useState<SafetyCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSafetyData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch my buddies
      const { data: buddiesData } = await supabase
        .from('safety_buddies')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (buddiesData && buddiesData.length > 0) {
        // Fetch buddy profiles
        const buddyIds = buddiesData.map(b => b.buddy_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', buddyIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        setBuddies(buddiesData.map(b => ({
          ...b,
          buddy_profile: profileMap.get(b.buddy_id)
        })));
      } else {
        setBuddies([]);
      }

      // Fetch my active checkin
      const { data: checkinData } = await supabase
        .from('safety_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'out')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (checkinData) {
        setActiveCheckin(checkinData as SafetyCheckin);
      } else {
        setActiveCheckin(null);
      }

      // Fetch buddy checkins (people who have me as their buddy)
      const { data: buddyCheckinData } = await supabase
        .from('safety_checkins')
        .select('*')
        .eq('status', 'out');

      if (buddyCheckinData) {
        setBuddyCheckins(buddyCheckinData as SafetyCheckin[]);
      }

    } catch (error) {
      console.error('Error fetching safety data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSafetyData();
  }, [fetchSafetyData]);

  const addBuddy = async (buddyId: string): Promise<boolean> => {
    if (!user || buddyId === user.id) return false;

    try {
      const { error } = await supabase
        .from('safety_buddies')
        .insert({
          user_id: user.id,
          buddy_id: buddyId
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Already a safety buddy');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Safety buddy added!');
      await fetchSafetyData();
      return true;
    } catch (error) {
      console.error('Error adding buddy:', error);
      toast.error('Failed to add buddy');
      return false;
    }
  };

  const removeBuddy = async (buddyId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await supabase
        .from('safety_buddies')
        .delete()
        .eq('user_id', user.id)
        .eq('buddy_id', buddyId);

      toast.success('Safety buddy removed');
      await fetchSafetyData();
      return true;
    } catch (error) {
      console.error('Error removing buddy:', error);
      toast.error('Failed to remove buddy');
      return false;
    }
  };

  const startCheckin = async (
    eventId?: string,
    expectedHomeTime?: Date,
    locationNote?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('safety_checkins')
        .insert({
          user_id: user.id,
          event_id: eventId || null,
          expected_home_time: expectedHomeTime?.toISOString() || null,
          location_note: locationNote || null,
          status: 'out'
        });

      if (error) throw error;

      toast.success('Safety check-in started', {
        description: 'Your buddies will be notified'
      });
      await fetchSafetyData();
      return true;
    } catch (error) {
      console.error('Error starting checkin:', error);
      toast.error('Failed to start check-in');
      return false;
    }
  };

  const markSafe = async (): Promise<boolean> => {
    if (!user || !activeCheckin) return false;

    try {
      await supabase
        .from('safety_checkins')
        .update({
          status: 'safe',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', activeCheckin.id);

      toast.success("You're marked as safe! 🏠");
      await fetchSafetyData();
      return true;
    } catch (error) {
      console.error('Error marking safe:', error);
      toast.error('Failed to update status');
      return false;
    }
  };

  const sendAlert = async (): Promise<boolean> => {
    if (!user || !activeCheckin) return false;

    try {
      await supabase
        .from('safety_checkins')
        .update({ status: 'alert' })
        .eq('id', activeCheckin.id);

      toast.error('Alert sent to your buddies!', {
        description: 'They will be notified immediately'
      });
      await fetchSafetyData();
      return true;
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert');
      return false;
    }
  };

  return {
    buddies,
    activeCheckin,
    buddyCheckins,
    loading,
    addBuddy,
    removeBuddy,
    startCheckin,
    markSafe,
    sendAlert,
    refetch: fetchSafetyData
  };
};
