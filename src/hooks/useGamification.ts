import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_this_week: number;
  xp_this_month: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: 'explorer' | 'social' | 'loyalty' | 'pioneer' | 'legendary';
  requirement_type: string;
  requirement_value: number;
  is_secret: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface PartyQuest {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  quest_type: 'daily' | 'weekly' | 'special';
  requirement_type: string;
  requirement_value: number;
  expires_at: string;
}

export interface QuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  rank: number;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useGamification = () => {
  const { user } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [quests, setQuests] = useState<PartyQuest[]>([]);
  const [questProgress, setQuestProgress] = useState<QuestProgress[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGamificationData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user XP
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (xpData) {
        setUserXP(xpData as UserXP);
      } else {
        // Create initial XP record
        const { data: newXP } = await supabase
          .from('user_xp')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (newXP) setUserXP(newXP as UserXP);
      }

      // Fetch all achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('category');

      if (achievementsData) {
        setAchievements(achievementsData as Achievement[]);
      }

      // Fetch user's earned achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id);

      if (userAchievementsData) {
        setUserAchievements(userAchievementsData as unknown as UserAchievement[]);
      }

      // Fetch active quests
      const { data: questsData } = await supabase
        .from('party_quests')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (questsData) {
        setQuests(questsData as PartyQuest[]);
      }

      // Fetch quest progress
      const { data: progressData } = await supabase
        .from('user_quest_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressData) {
        setQuestProgress(progressData as QuestProgress[]);
      }

      // Fetch weekly leaderboard (top 10)
      const { data: leaderboardData } = await supabase
        .from('user_xp')
        .select('user_id, total_xp')
        .order('total_xp', { ascending: false })
        .limit(10);

      if (leaderboardData) {
        // Fetch profiles for leaderboard users
        const userIds = leaderboardData.map(e => e.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        setLeaderboard(leaderboardData.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          profile: profileMap.get(entry.user_id)
        })));
      }

    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  const addXP = async (amount: number, reason?: string) => {
    if (!user) return;

    try {
      await supabase.rpc('add_user_xp', { p_user_id: user.id, p_xp: amount });
      
      if (reason) {
        toast.success(`+${amount} XP`, { description: reason });
      }
      
      await fetchGamificationData();
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  const claimQuest = async (questId: string) => {
    if (!user) return false;

    try {
      const quest = quests.find(q => q.id === questId);
      const progress = questProgress.find(p => p.quest_id === questId);
      
      if (!quest || !progress || progress.claimed_at) return false;
      if (progress.progress < quest.requirement_value) return false;

      // Mark as claimed
      await supabase
        .from('user_quest_progress')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', progress.id);

      // Award XP
      await addXP(quest.xp_reward, `Quest completed: ${quest.title}`);
      
      await fetchGamificationData();
      return true;
    } catch (error) {
      console.error('Error claiming quest:', error);
      return false;
    }
  };

  const getXPForNextLevel = (currentLevel: number) => {
    return (currentLevel + 1) * (currentLevel + 1) * 50;
  };

  const getXPProgress = () => {
    if (!userXP) return { current: 0, needed: 50, percentage: 0 };
    
    const currentLevelXP = userXP.current_level * userXP.current_level * 50;
    const nextLevelXP = getXPForNextLevel(userXP.current_level);
    const progressXP = userXP.total_xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    
    return {
      current: progressXP,
      needed: neededXP,
      percentage: Math.min(100, (progressXP / neededXP) * 100)
    };
  };

  return {
    userXP,
    achievements,
    userAchievements,
    quests,
    questProgress,
    leaderboard,
    loading,
    addXP,
    claimQuest,
    getXPProgress,
    refetch: fetchGamificationData
  };
};
