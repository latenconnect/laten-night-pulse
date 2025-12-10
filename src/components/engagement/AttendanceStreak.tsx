import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Gift, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceStreakProps {
  currentStreak: number;
  longestStreak: number;
  eventsThisMonth: number;
  nextMilestone: number;
  className?: string;
}

export const AttendanceStreak: React.FC<AttendanceStreakProps> = ({
  currentStreak,
  longestStreak,
  eventsThisMonth,
  nextMilestone,
  className,
}) => {
  const progress = (currentStreak / nextMilestone) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card p-4', className)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            currentStreak >= 5 
              ? 'bg-gradient-to-br from-orange-400 to-red-500' 
              : 'bg-muted'
          )}>
            <Flame className={cn(
              'w-5 h-5',
              currentStreak >= 5 ? 'text-white animate-pulse' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Event Streak</p>
            <p className="text-2xl font-bold font-display">
              {currentStreak} <span className="text-sm text-muted-foreground">events</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best: {longestStreak}</p>
          <p className="text-xs text-muted-foreground">{eventsThisMonth} this month</p>
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Next milestone</span>
          <span className="flex items-center gap-1 text-amber-400">
            <Gift className="w-3 h-3" />
            {nextMilestone} events
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
          />
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {nextMilestone - currentStreak} more events to unlock reward!
        </p>
      </div>
    </motion.div>
  );
};

// Weekly activity display
interface WeeklyActivityProps {
  days: { date: Date; attended: boolean; eventName?: string }[];
  className?: string;
}

export const WeeklyActivity: React.FC<WeeklyActivityProps> = ({ days, className }) => {
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className={cn('glass-card p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">This Week</span>
      </div>
      <div className="flex justify-between">
        {days.slice(0, 7).map((day, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-[10px] text-muted-foreground">{dayNames[i]}</span>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                day.attended 
                  ? 'bg-gradient-to-br from-primary to-pink-500' 
                  : 'bg-muted/50'
              )}
              title={day.eventName}
            >
              {day.attended ? (
                <Zap className="w-4 h-4 text-white" />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {day.date.getDate()}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Achievement unlocked toast
export const AchievementUnlocked: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  onClose?: () => void;
}> = ({ title, description, icon, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed bottom-24 left-4 right-4 z-50"
    >
      <div className="glass-card p-4 border border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-orange-400/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            {icon || <Gift className="w-6 h-6 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400">🎉 Achievement Unlocked!</p>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
