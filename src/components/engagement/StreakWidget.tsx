import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Gift, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStreaks, getMilestoneLabel } from '@/hooks/useUserStreaks';
import { useNavigate } from 'react-router-dom';

interface StreakWidgetProps {
  variant?: 'full' | 'compact' | 'mini';
  className?: string;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ 
  variant = 'compact',
  className 
}) => {
  const navigate = useNavigate();
  const { streak, getNextMilestone, loading } = useUserStreaks();

  if (loading || !streak) return null;

  const nextMilestone = getNextMilestone('events_attended', streak.total_events_attended);
  const progress = nextMilestone 
    ? (streak.total_events_attended / nextMilestone) * 100 
    : 100;

  // Mini version - just the flame with count
  if (variant === 'mini') {
    return (
      <motion.button
        onClick={() => navigate('/profile')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors',
          streak.current_streak >= 3 
            ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30'
            : 'bg-muted/50 border border-border/50',
          className
        )}
      >
        <Flame className={cn(
          'w-4 h-4',
          streak.current_streak >= 3 ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'
        )} />
        <span className={cn(
          'text-sm font-bold',
          streak.current_streak >= 3 ? 'text-orange-500' : 'text-foreground'
        )}>
          {streak.current_streak}
        </span>
      </motion.button>
    );
  }

  // Compact version - horizontal card
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 border border-orange-500/20',
          className
        )}
      >
        {/* Flame icon with badge */}
        <div className="relative">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center',
            streak.current_streak >= 5 
              ? 'bg-gradient-to-br from-orange-500 to-red-600' 
              : 'bg-gradient-to-br from-orange-400/50 to-red-500/50'
          )}>
            <Flame className={cn(
              'w-7 h-7 text-white',
              streak.current_streak >= 5 && 'animate-pulse'
            )} />
          </div>
          {streak.current_streak >= 7 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
              <Trophy className="w-3 h-3 text-amber-900" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-foreground">
              {streak.current_streak}
            </span>
            <span className="text-sm text-muted-foreground">event streak</span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
              />
            </div>
            {nextMilestone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Gift className="w-3 h-3 text-amber-400" />
                {nextMilestone - streak.total_events_attended} more to unlock{' '}
                <span className="text-amber-400 font-medium">
                  {getMilestoneLabel('events_attended', nextMilestone)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Best streak */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="text-lg font-bold text-foreground">{streak.longest_streak}</p>
        </div>
      </motion.div>
    );
  }

  // Full version - detailed card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card p-5 space-y-4', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            streak.current_streak >= 5 
              ? 'bg-gradient-to-br from-orange-500 to-red-600' 
              : 'bg-muted'
          )}>
            <Flame className={cn(
              'w-6 h-6',
              streak.current_streak >= 5 ? 'text-white animate-pulse' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Streak</p>
            <p className="text-3xl font-bold font-display">
              {streak.current_streak}
            </p>
          </div>
        </div>
        
        <div className="text-right space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="w-3 h-3 text-amber-400" />
            Best: {streak.longest_streak}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {streak.events_this_month} this month
          </div>
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Next milestone</span>
          {nextMilestone && (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Gift className="w-4 h-4" />
              {getMilestoneLabel('events_attended', nextMilestone)}
            </span>
          )}
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
          />
        </div>
        {nextMilestone && (
          <p className="text-xs text-center text-muted-foreground">
            {nextMilestone - streak.total_events_attended} more events to go!
          </p>
        )}
      </div>

      {/* Streak warning */}
      {streak.current_streak >= 3 && streak.last_activity_date && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <p className="text-sm text-amber-400">
            Keep it going! Don't break your {streak.current_streak}-event streak 🔥
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StreakWidget;
