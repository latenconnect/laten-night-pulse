import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_events_attended: number;
  events_this_month: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  user_id: string;
  milestone_type: string;
  milestone_value: number;
  achieved_at: string;
  notified: boolean;
}

export interface WeeklyRecap {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  events_attended: number;
  total_rsvps: number;
  top_venue_id: string | null;
  top_event_type: string | null;
  friends_met: number;
  streak_at_week_end: number;
  highlights: unknown;
  created_at: string;
}

// Milestone definitions
export const MILESTONES = {
  events_attended: [1, 5, 10, 25, 50, 100],
  streak: [3, 7, 14, 30, 60, 100],
  friends: [5, 10, 25, 50, 100],
  hosted: [1, 5, 10, 25]
};

export const getMilestoneLabel = (type: string, value: number): string => {
  const labels: Record<string, Record<number, string>> = {
    events_attended: {
      1: 'First Event! 🎉',
      5: 'Party Starter',
      10: 'Regular',
      25: 'Social Butterfly',
      50: 'Party Animal',
      100: 'Legend'
    },
    streak: {
      3: 'On a Roll',
      7: 'Week Warrior',
      14: 'Two Week Streak',
      30: 'Monthly Master',
      60: 'Unstoppable',
      100: 'Century Streak'
    },
    friends: {
      5: 'Making Friends',
      10: 'Popular',
      25: 'Influencer',
      50: 'Social Star',
      100: 'Party Icon'
    },
    hosted: {
      1: 'First Host',
      5: 'Party Planner',
      10: 'Event Pro',
      25: 'Host Legend'
    }
  };
  return labels[type]?.[value] || `${type} ${value}`;
};

export const useUserStreaks = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [recentRecap, setRecentRecap] = useState<WeeklyRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMilestones, setNewMilestones] = useState<Milestone[]>([]);

  const fetchStreakData = useCallback(async () => {
    if (!user) {
      setStreak(null);
      setMilestones([]);
      setRecentRecap(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch user streak
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakData) {
        setStreak(streakData);
        
        // Check for new milestones
        await checkAndAwardMilestones(streakData);
      }

      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      setMilestones(milestonesData || []);

      // Check for unnotified milestones
      const unnotified = (milestonesData || []).filter(m => !m.notified);
      if (unnotified.length > 0) {
        setNewMilestones(unnotified);
        // Mark as notified
        await supabase
          .from('user_milestones')
          .update({ notified: true })
          .in('id', unnotified.map(m => m.id));
      }

      // Fetch most recent recap
      const { data: recapData } = await supabase
        .from('weekly_recaps')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();

      setRecentRecap(recapData || null);

    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkAndAwardMilestones = async (streakData: UserStreak) => {
    if (!user) return;

    const newMilestonesToAward: { type: string; value: number }[] = [];

    // Check events attended milestones
    for (const threshold of MILESTONES.events_attended) {
      if (streakData.total_events_attended >= threshold) {
        newMilestonesToAward.push({ type: 'events_attended', value: threshold });
      }
    }

    // Check streak milestones
    for (const threshold of MILESTONES.streak) {
      if (streakData.current_streak >= threshold || streakData.longest_streak >= threshold) {
        newMilestonesToAward.push({ type: 'streak', value: threshold });
      }
    }

    // Try to insert milestones (duplicates will be ignored due to unique constraint)
    for (const milestone of newMilestonesToAward) {
      try {
        await supabase
          .from('user_milestones')
          .insert({
            user_id: user.id,
            milestone_type: milestone.type,
            milestone_value: milestone.value
          });
      } catch {
        // Milestone already exists, ignore
      }
    }
  };

  const dismissNewMilestones = () => {
    setNewMilestones([]);
  };

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  // Calculate next milestone
  const getNextMilestone = (type: keyof typeof MILESTONES, currentValue: number) => {
    const thresholds = MILESTONES[type];
    return thresholds.find(t => t > currentValue) || null;
  };

  const getProgress = (type: keyof typeof MILESTONES, currentValue: number) => {
    const thresholds = MILESTONES[type];
    const achieved = thresholds.filter(t => t <= currentValue);
    const next = thresholds.find(t => t > currentValue);
    const previous = achieved[achieved.length - 1] || 0;
    
    if (!next) return 100; // All milestones achieved
    return Math.round(((currentValue - previous) / (next - previous)) * 100);
  };

  return {
    streak,
    milestones,
    recentRecap,
    loading,
    newMilestones,
    dismissNewMilestones,
    getNextMilestone,
    getProgress,
    refetch: fetchStreakData
  };
};
