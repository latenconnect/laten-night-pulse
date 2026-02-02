import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface UserReputation {
  id: string;
  user_id: string;
  total_rep: number;
  reputation_level: 'newcomer' | 'regular' | 'trusted' | 'elite' | 'legend';
  events_attended: number;
  events_ghosted: number;
  average_vibe_rating: number | null;
  total_vibe_votes: number;
  violations_count: number;
}

export interface EventCheckIn {
  id: string;
  event_id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_minutes: number | null;
  rep_earned: number;
}

export interface EventQRCode {
  id: string;
  event_id: string;
  code: string;
  is_active: boolean;
  scans_count: number;
  expires_at: string | null;
}

export interface VibeRating {
  id: string;
  event_id: string;
  rater_user_id: string;
  rated_user_id: string;
  vibe_score: number;
}

const REP_LEVELS = {
  newcomer: { min: 0, label: 'Newcomer', emoji: '🌱', color: 'text-gray-400' },
  regular: { min: 100, label: 'Regular', emoji: '⭐', color: 'text-blue-400' },
  trusted: { min: 500, label: 'Trusted', emoji: '🔥', color: 'text-orange-400' },
  elite: { min: 2000, label: 'Elite', emoji: '💎', color: 'text-purple-400' },
  legend: { min: 5000, label: 'Legend', emoji: '👑', color: 'text-yellow-400' },
};

export const useReputation = () => {
  const { user } = useAuth();
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReputation = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setReputation(data as UserReputation);
      } else {
        // Reputation is created automatically via triggers on first check-in
        // Show default newcomer state for users who haven't checked in yet
        setReputation({
          id: '',
          user_id: user.id,
          total_rep: 0,
          reputation_level: 'newcomer',
          events_attended: 0,
          events_ghosted: 0,
          average_vibe_rating: null,
          total_vibe_votes: 0,
          violations_count: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching reputation:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  const getRepLevel = (level: string) => {
    return REP_LEVELS[level as keyof typeof REP_LEVELS] || REP_LEVELS.newcomer;
  };

  const getProgressToNextLevel = () => {
    if (!reputation) return { current: 0, needed: 100, percentage: 0 };

    const currentLevel = getRepLevel(reputation.reputation_level);
    const levels = Object.entries(REP_LEVELS);
    const currentIndex = levels.findIndex(([key]) => key === reputation.reputation_level);
    const nextLevel = levels[currentIndex + 1];

    if (!nextLevel) {
      return { current: reputation.total_rep, needed: reputation.total_rep, percentage: 100 };
    }

    const progress = reputation.total_rep - currentLevel.min;
    const needed = nextLevel[1].min - currentLevel.min;
    return {
      current: progress,
      needed,
      percentage: Math.min(100, (progress / needed) * 100),
    };
  };

  return {
    reputation,
    loading,
    getRepLevel,
    getProgressToNextLevel,
    refetch: fetchReputation,
    REP_LEVELS,
  };
};

export const useEventCheckIn = (eventId: string) => {
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState<EventCheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !eventId) {
      setLoading(false);
      return;
    }

    const fetchCheckIn = async () => {
      const { data } = await supabase
        .from('event_check_ins')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) setCheckIn(data as EventCheckIn);
      setLoading(false);
    };

    fetchCheckIn();
  }, [user, eventId]);

  const checkInWithQR = async (qrCode: string) => {
    if (!user) {
      toast.error('Please sign in to check in');
      return false;
    }

    try {
      // Verify QR code
      const { data: qr, error: qrError } = await supabase
        .from('event_qr_codes')
        .select('*')
        .eq('code', qrCode)
        .eq('is_active', true)
        .maybeSingle();

      if (qrError || !qr) {
        toast.error('Invalid or expired QR code');
        return false;
      }

      // Check if QR is for this event
      if (qr.event_id !== eventId) {
        toast.error('QR code is for a different event');
        return false;
      }

      // Create check-in
      const { data: newCheckIn, error } = await supabase
        .from('event_check_ins')
        .insert({
          event_id: eventId,
          user_id: user.id,
          qr_code_id: qr.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Already checked in to this event');
        } else {
          throw error;
        }
        return false;
      }

      // Increment QR scan count
      await supabase
        .from('event_qr_codes')
        .update({ scans_count: (qr.scans_count || 0) + 1 })
        .eq('id', qr.id);

      setCheckIn(newCheckIn as EventCheckIn);
      toast.success('Checked in! +10 Rep earned 🔥');
      return true;
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in');
      return false;
    }
  };

  const checkOut = async () => {
    if (!user || !checkIn) return false;

    try {
      const checkOutTime = new Date();
      const checkInTime = new Date(checkIn.check_in_time);
      const durationMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000);

      // Award bonus rep for staying longer
      let bonusRep = 0;
      if (durationMinutes >= 120) bonusRep = 20; // 2+ hours
      else if (durationMinutes >= 60) bonusRep = 10; // 1+ hour
      else if (durationMinutes >= 30) bonusRep = 5; // 30+ minutes

      const { error } = await supabase
        .from('event_check_ins')
        .update({
          check_out_time: checkOutTime.toISOString(),
          duration_minutes: durationMinutes,
          rep_earned: checkIn.rep_earned + bonusRep,
        })
        .eq('id', checkIn.id);

      if (error) throw error;

      if (bonusRep > 0) {
        toast.success(`Checked out! +${bonusRep} bonus Rep for staying ${Math.round(durationMinutes / 60)}h 🎉`);
      } else {
        toast.success('Checked out!');
      }

      setCheckIn(prev => prev ? { ...prev, check_out_time: checkOutTime.toISOString(), duration_minutes: durationMinutes } : null);
      return true;
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Failed to check out');
      return false;
    }
  };

  return {
    checkIn,
    loading,
    isCheckedIn: !!checkIn,
    checkInWithQR,
    checkOut,
  };
};

export const useEventQRCodes = (eventId: string) => {
  const { user } = useAuth();
  const [qrCodes, setQRCodes] = useState<EventQRCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const fetchQRCodes = async () => {
      const { data } = await supabase
        .from('event_qr_codes')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (data) setQRCodes(data as EventQRCode[]);
      setLoading(false);
    };

    fetchQRCodes();
  }, [eventId]);

  const generateQRCode = async () => {
    if (!user) return null;

    try {
      const code = `LATEN-${eventId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('event_qr_codes')
        .insert({
          event_id: eventId,
          code,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .select()
        .single();

      if (error) throw error;

      setQRCodes(prev => [data as EventQRCode, ...prev]);
      toast.success('QR code generated!');
      return data as EventQRCode;
    } catch (error) {
      console.error('Generate QR error:', error);
      toast.error('Failed to generate QR code');
      return null;
    }
  };

  const deactivateQRCode = async (qrId: string) => {
    try {
      await supabase
        .from('event_qr_codes')
        .update({ is_active: false })
        .eq('id', qrId);

      setQRCodes(prev => prev.map(qr => qr.id === qrId ? { ...qr, is_active: false } : qr));
      toast.success('QR code deactivated');
    } catch (error) {
      console.error('Deactivate QR error:', error);
      toast.error('Failed to deactivate QR code');
    }
  };

  return {
    qrCodes,
    loading,
    generateQRCode,
    deactivateQRCode,
  };
};

export const useVibeRatings = (eventId: string) => {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<{ user_id: string; display_name: string; avatar_url: string | null }[]>([]);
  const [myRatings, setMyRatings] = useState<VibeRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Fetch attendees (people who checked in)
      const { data: checkIns } = await supabase
        .from('event_check_ins')
        .select('user_id')
        .eq('event_id', eventId)
        .neq('user_id', user.id);

      if (checkIns && checkIns.length > 0) {
        const userIds = checkIns.map(c => c.user_id);
        const { data: profiles } = await supabase
          .from('safe_profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        if (profiles) {
          setAttendees(profiles.map(p => ({
            user_id: p.id,
            display_name: p.display_name || 'Anonymous',
            avatar_url: p.avatar_url,
          })));
        }
      }

      // Fetch my ratings
      const { data: ratings } = await supabase
        .from('vibe_ratings')
        .select('*')
        .eq('event_id', eventId)
        .eq('rater_user_id', user.id);

      if (ratings) setMyRatings(ratings as VibeRating[]);
      setLoading(false);
    };

    fetchData();
  }, [eventId, user]);

  const rateVibe = async (ratedUserId: string, score: number) => {
    if (!user) {
      toast.error('Please sign in to rate');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('vibe_ratings')
        .upsert({
          event_id: eventId,
          rater_user_id: user.id,
          rated_user_id: ratedUserId,
          vibe_score: score,
        }, { onConflict: 'event_id,rater_user_id,rated_user_id' })
        .select()
        .single();

      if (error) throw error;

      setMyRatings(prev => {
        const existing = prev.findIndex(r => r.rated_user_id === ratedUserId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data as VibeRating;
          return updated;
        }
        return [...prev, data as VibeRating];
      });

      toast.success('Vibe rated! 🌟');
      return true;
    } catch (error) {
      console.error('Rate vibe error:', error);
      toast.error('Failed to rate vibe');
      return false;
    }
  };

  const getRatingForUser = (userId: string) => {
    return myRatings.find(r => r.rated_user_id === userId)?.vibe_score;
  };

  return {
    attendees,
    myRatings,
    loading,
    rateVibe,
    getRatingForUser,
  };
};
