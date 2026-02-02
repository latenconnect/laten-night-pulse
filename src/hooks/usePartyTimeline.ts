import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export interface TimelineEntry {
  id: string;
  user_id: string;
  event_id: string | null;
  event_name: string;
  event_city: string;
  attended_date: string;
  duration_hours: number | null;
  rep_earned: number;
  highlight_moment: string | null;
  is_public: boolean;
  created_at: string;
}

export interface FlexCard {
  id: string;
  user_id: string;
  card_type: 'weekly_recap' | 'monthly_stats' | 'milestone' | 'streak';
  title: string;
  subtitle: string | null;
  stats: Record<string, any>;
  share_code: string;
  is_public: boolean;
  created_at: string;
}

export interface TimelineStats {
  totalNights: number;
  totalHours: number;
  totalRep: number;
  citiesVisited: string[];
  currentStreak: number;
  longestStreak: number;
  favoriteCity: string | null;
  thisWeek: {
    nights: number;
    rep: number;
  };
  thisMonth: {
    nights: number;
    rep: number;
  };
}

export const usePartyTimeline = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [flexCards, setFlexCards] = useState<FlexCard[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback((entries: TimelineEntry[]): TimelineStats => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const cities = new Set(entries.map(e => e.event_city));
    const cityCounts: Record<string, number> = {};
    entries.forEach(e => {
      cityCounts[e.event_city] = (cityCounts[e.event_city] || 0) + 1;
    });
    const favoriteCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Calculate streak
    const sortedDates = [...new Set(entries.map(e => e.attended_date))].sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = parseISO(sortedDates[i]);
      const prevDate = i > 0 ? parseISO(sortedDates[i - 1]) : null;
      
      if (prevDate && (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 7) {
        tempStreak++;
      } else {
        if (i === 0 || (prevDate && (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 7)) {
          currentStreak = tempStreak + 1;
        }
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    const weekEntries = entries.filter(e => {
      const date = parseISO(e.attended_date);
      return date >= weekStart && date <= weekEnd;
    });

    const monthEntries = entries.filter(e => {
      const date = parseISO(e.attended_date);
      return date >= monthStart && date <= monthEnd;
    });

    return {
      totalNights: entries.length,
      totalHours: entries.reduce((sum, e) => sum + (e.duration_hours || 0), 0),
      totalRep: entries.reduce((sum, e) => sum + e.rep_earned, 0),
      citiesVisited: Array.from(cities),
      currentStreak,
      longestStreak,
      favoriteCity,
      thisWeek: {
        nights: weekEntries.length,
        rep: weekEntries.reduce((sum, e) => sum + e.rep_earned, 0),
      },
      thisMonth: {
        nights: monthEntries.length,
        rep: monthEntries.reduce((sum, e) => sum + e.rep_earned, 0),
      },
    };
  }, []);

  const fetchTimeline = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch timeline entries
      const { data: timelineData, error: timelineError } = await supabase
        .from('party_timeline')
        .select('*')
        .eq('user_id', targetUserId)
        .order('attended_date', { ascending: false });

      if (timelineError) throw timelineError;

      const entries = (timelineData || []) as TimelineEntry[];
      setTimeline(entries);
      setStats(calculateStats(entries));

      // Fetch flex cards
      const { data: cardsData } = await supabase
        .from('flex_cards')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (cardsData) {
        setFlexCards(cardsData as FlexCard[]);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, calculateStats]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const addTimelineEntry = async (entry: Omit<TimelineEntry, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('party_timeline')
        .insert({
          ...entry,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTimeline(prev => [data as TimelineEntry, ...prev]);
      setStats(prev => prev ? calculateStats([data as TimelineEntry, ...timeline]) : null);
      
      toast.success('Night added to timeline! 🌙');
      return data as TimelineEntry;
    } catch (error) {
      console.error('Add timeline entry error:', error);
      toast.error('Failed to add entry');
      return null;
    }
  };

  const updateHighlight = async (entryId: string, highlight: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('party_timeline')
        .update({ highlight_moment: highlight })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTimeline(prev => prev.map(e => 
        e.id === entryId ? { ...e, highlight_moment: highlight } : e
      ));

      toast.success('Highlight saved!');
      return true;
    } catch (error) {
      console.error('Update highlight error:', error);
      toast.error('Failed to update');
      return false;
    }
  };

  const togglePublic = async (entryId: string) => {
    if (!user) return false;

    const entry = timeline.find(e => e.id === entryId);
    if (!entry) return false;

    try {
      const { error } = await supabase
        .from('party_timeline')
        .update({ is_public: !entry.is_public })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTimeline(prev => prev.map(e => 
        e.id === entryId ? { ...e, is_public: !e.is_public } : e
      ));

      return true;
    } catch (error) {
      console.error('Toggle public error:', error);
      return false;
    }
  };

  const generateFlexCard = async (cardType: FlexCard['card_type']): Promise<FlexCard | null> => {
    if (!user || !stats) return null;

    try {
      let title = '';
      let subtitle = '';
      let cardStats: Record<string, any> = {};

      switch (cardType) {
        case 'weekly_recap':
          title = `${stats.thisWeek.nights} Nights This Week`;
          subtitle = `+${stats.thisWeek.rep} Rep earned`;
          cardStats = {
            nights: stats.thisWeek.nights,
            rep: stats.thisWeek.rep,
            week: format(new Date(), "'Week of' MMM d"),
          };
          break;

        case 'monthly_stats':
          title = `${stats.thisMonth.nights} Nights in ${format(new Date(), 'MMMM')}`;
          subtitle = `${stats.citiesVisited.length} cities explored`;
          cardStats = {
            nights: stats.thisMonth.nights,
            rep: stats.thisMonth.rep,
            cities: stats.citiesVisited.length,
            month: format(new Date(), 'MMMM yyyy'),
          };
          break;

        case 'milestone':
          title = `${stats.totalNights} Nights Total`;
          subtitle = `Party Legend in the making`;
          cardStats = {
            totalNights: stats.totalNights,
            totalHours: Math.round(stats.totalHours),
            totalRep: stats.totalRep,
          };
          break;

        case 'streak':
          title = `${stats.currentStreak} Week Streak! 🔥`;
          subtitle = `${stats.longestStreak} weeks is your best`;
          cardStats = {
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
          };
          break;
      }

      const { data, error } = await supabase
        .from('flex_cards')
        .insert({
          user_id: user.id,
          card_type: cardType,
          title,
          subtitle,
          stats: cardStats,
        })
        .select()
        .single();

      if (error) throw error;

      setFlexCards(prev => [data as FlexCard, ...prev]);
      toast.success('Flex card created! 💪');
      return data as FlexCard;
    } catch (error) {
      console.error('Generate flex card error:', error);
      toast.error('Failed to generate card');
      return null;
    }
  };

  const getShareableUrl = (shareCode: string) => {
    return `${window.location.origin}/flex/${shareCode}`;
  };

  return {
    timeline,
    flexCards,
    stats,
    loading,
    addTimelineEntry,
    updateHighlight,
    togglePublic,
    generateFlexCard,
    getShareableUrl,
    refetch: fetchTimeline,
  };
};

// Hook to fetch a public flex card by share code
export const usePublicFlexCard = (shareCode: string) => {
  const [card, setCard] = useState<FlexCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareCode) {
      setLoading(false);
      return;
    }

    const fetchCard = async () => {
      const { data, error } = await supabase
        .from('flex_cards')
        .select('*')
        .eq('share_code', shareCode)
        .eq('is_public', true)
        .maybeSingle();

      if (!error && data) {
        setCard(data as FlexCard);
      }
      setLoading(false);
    };

    fetchCard();
  }, [shareCode]);

  return { card, loading };
};
