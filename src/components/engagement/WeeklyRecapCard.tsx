import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Users, Flame, MapPin, Music } from 'lucide-react';
import { useUserStreaks, WeeklyRecap } from '@/hooks/useUserStreaks';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO } from 'date-fns';

const WeeklyRecapCard: React.FC = () => {
  const { user } = useAuth();
  const { recentRecap, loading } = useUserStreaks();

  if (!user || loading) return null;
  if (!recentRecap) return null;

  const weekStart = parseISO(recentRecap.week_start);
  const weekEnd = parseISO(recentRecap.week_end);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-cyan-500/10 border border-primary/20"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-display font-bold text-lg">Weekly Recap</h2>
          <p className="text-xs text-muted-foreground">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon={<Calendar className="w-4 h-4 text-primary" />}
          label="Events"
          value={recentRecap.events_attended}
          color="primary"
        />
        <StatCard
          icon={<Users className="w-4 h-4 text-cyan-400" />}
          label="Friends Met"
          value={recentRecap.friends_met}
          color="cyan"
        />
        <StatCard
          icon={<Flame className="w-4 h-4 text-orange-400" />}
          label="Streak"
          value={recentRecap.streak_at_week_end}
          suffix=" days"
          color="orange"
        />
        <StatCard
          icon={<Music className="w-4 h-4 text-pink-400" />}
          label="RSVPs"
          value={recentRecap.total_rsvps}
          color="pink"
        />
      </div>

      {/* Top Event Type */}
      {recentRecap.top_event_type && (
        <div className="p-3 rounded-xl bg-background/50">
          <p className="text-xs text-muted-foreground mb-1">Your vibe this week</p>
          <p className="text-sm font-medium text-foreground capitalize">
            {recentRecap.top_event_type.replace('_', ' ')} events
          </p>
        </div>
      )}
    </motion.section>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: 'primary' | 'cyan' | 'orange' | 'pink';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, suffix = '', color }) => {
  const colorClasses = {
    primary: 'text-primary',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400'
  };

  return (
    <div className="p-3 rounded-xl bg-background/50">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold ${colorClasses[color]}`}>
        {value}{suffix}
      </p>
    </div>
  );
};

export default WeeklyRecapCard;
