import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Sparkles, MapPin, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveFeedHeaderProps {
  city: string;
  activeUsers?: number;
  trendingCount?: number;
  newEventsToday?: number;
  className?: string;
}

export const LiveFeedHeader: React.FC<LiveFeedHeaderProps> = ({
  city,
  activeUsers = 0,
  trendingCount = 0,
  newEventsToday = 0,
  className,
}) => {
  const [currentStat, setCurrentStat] = useState(0);
  
  const stats = [
    { icon: Users, value: activeUsers, label: 'exploring now', color: 'text-green-400' },
    { icon: TrendingUp, value: trendingCount, label: 'trending events', color: 'text-secondary' },
    { icon: Sparkles, value: newEventsToday, label: 'new today', color: 'text-primary' },
  ].filter(s => s.value > 0);

  useEffect(() => {
    if (stats.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [stats.length]);

  if (stats.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm border-b border-border/50',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs text-muted-foreground">Live in {city}</span>
      </div>

      <AnimatePresence mode="wait">
        {stats[currentStat] && (
          <motion.div
            key={currentStat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1.5 text-xs"
          >
            {React.createElement(stats[currentStat].icon, {
              className: cn('w-3 h-3', stats[currentStat].color)
            })}
            <span className="font-semibold">{stats[currentStat].value}</span>
            <span className="text-muted-foreground">{stats[currentStat].label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Trending topics bar
interface TrendingTopic {
  id: string;
  name: string;
  count: number;
}

export const TrendingTopics: React.FC<{ topics: TrendingTopic[] }> = ({ topics }) => {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
      {topics.map((topic, i) => (
        <motion.button
          key={topic.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 hover:border-primary/50 transition-colors text-sm whitespace-nowrap"
        >
          <TrendingUp className="w-3 h-3 text-secondary" />
          <span className="font-medium">{topic.name}</span>
          <span className="text-xs text-muted-foreground">{topic.count}</span>
        </motion.button>
      ))}
    </div>
  );
};

// Friend activity feed item
interface FriendActivity {
  id: string;
  name: string;
  avatar: string;
  action: 'rsvp' | 'created' | 'attending';
  eventName: string;
  eventId: string;
  timestamp: Date;
}

export const FriendActivityItem: React.FC<{ activity: FriendActivity }> = ({ activity }) => {
  const actionText = {
    rsvp: 'is going to',
    created: 'created',
    attending: 'checked in at',
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2"
    >
      <div className="relative">
        <img
          src={activity.avatar}
          alt={activity.name}
          className="w-8 h-8 rounded-full"
        />
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Zap className="w-2.5 h-2.5 text-white" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          <span className="font-medium">{activity.name}</span>
          {' '}
          <span className="text-muted-foreground">{actionText[activity.action]}</span>
          {' '}
          <span className="font-medium text-primary">{activity.eventName}</span>
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo(activity.timestamp)}</p>
      </div>
    </motion.div>
  );
};

// Friend activity feed
export const FriendActivityFeed: React.FC<{ activities: FriendActivity[] }> = ({ activities }) => {
  if (activities.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Friend Activity</span>
      </div>
      <div className="divide-y divide-border/50">
        {activities.slice(0, 5).map(activity => (
          <FriendActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};
