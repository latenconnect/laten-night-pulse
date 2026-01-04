import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Calendar, Star, X, Sparkles } from 'lucide-react';
import { useUserStreaks, getMilestoneLabel } from '@/hooks/useUserStreaks';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface StreakDisplayProps {
  compact?: boolean;
  showMilestones?: boolean;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  compact = false,
  showMilestones = true
}) => {
  const { user } = useAuth();
  const { 
    streak, 
    newMilestones, 
    dismissNewMilestones,
    getNextMilestone,
    getProgress,
    loading 
  } = useUserStreaks();

  if (!user || loading) return null;
  if (!streak && !newMilestones.length) return null;

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const eventsThisMonth = streak?.events_this_month || 0;
  const totalEvents = streak?.total_events_attended || 0;

  const nextStreakMilestone = getNextMilestone('streak', currentStreak);
  const streakProgress = getProgress('streak', currentStreak);
  const nextEventsM = getNextMilestone('events_attended', totalEvents);
  const eventsProgress = getProgress('events_attended', totalEvents);

  // Compact version for header/small spaces
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{currentStreak}</span>
          </div>
        )}
        {eventsThisMonth > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{eventsThisMonth}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* New Milestone Toast */}
      <AnimatePresence>
        {showMilestones && newMilestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-20 left-4 right-4 z-50 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-primary/20 to-pink-500/20 border border-amber-500/30 backdrop-blur-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">
                  🎉 Achievement Unlocked!
                </h3>
                {newMilestones.map(m => (
                  <p key={m.id} className="text-sm text-muted-foreground">
                    {getMilestoneLabel(m.milestone_type, m.milestone_value)}
                  </p>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismissNewMilestones}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Streak Display */}
      <section className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-card to-card border border-orange-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-400" />
          <h2 className="font-display font-bold text-lg">Your Streak</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Current Streak */}
          <div className="p-3 rounded-xl bg-background/50">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Current</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>

          {/* Longest Streak */}
          <div className="p-3 rounded-xl bg-background/50">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Best</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>

          {/* Events This Month */}
          <div className="p-3 rounded-xl bg-background/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-bold text-primary">{eventsThisMonth}</p>
            <p className="text-xs text-muted-foreground">events</p>
          </div>

          {/* Total Events */}
          <div className="p-3 rounded-xl bg-background/50">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-pink-400" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-pink-400">{totalEvents}</p>
            <p className="text-xs text-muted-foreground">attended</p>
          </div>
        </div>

        {/* Progress to next milestone */}
        {nextStreakMilestone && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Next streak milestone</span>
              <span className="text-orange-400 font-medium">{currentStreak}/{nextStreakMilestone}</span>
            </div>
            <Progress value={streakProgress} className="h-2" />
          </div>
        )}

        {nextEventsM && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Next events milestone</span>
              <span className="text-primary font-medium">{totalEvents}/{nextEventsM}</span>
            </div>
            <Progress value={eventsProgress} className="h-2" />
          </div>
        )}
      </section>
    </>
  );
};

export default StreakDisplay;
