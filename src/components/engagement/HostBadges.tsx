import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Award, Crown, Verified, Sparkles, Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

type BadgeType = 
  | 'verified' 
  | 'top-host' 
  | 'rising-star' 
  | 'legend' 
  | 'safe-host'
  | 'crowd-favorite'
  | 'newcomer'
  | 'streak';

interface HostBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const badgeConfigs: Record<BadgeType, {
  icon: React.ComponentType<any>;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  verified: {
    icon: Verified,
    label: 'Verified Host',
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    description: 'Identity verified by Laten',
  },
  'top-host': {
    icon: Crown,
    label: 'Top Host',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/20',
    description: 'Top 10% of hosts by ratings',
  },
  'rising-star': {
    icon: Star,
    label: 'Rising Star',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/20',
    description: 'Fast-growing host with great reviews',
  },
  legend: {
    icon: Trophy,
    label: 'Legend',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    description: '100+ successful events hosted',
  },
  'safe-host': {
    icon: Shield,
    label: 'Safe Host',
    color: 'text-green-400',
    bgColor: 'bg-green-400/20',
    description: 'Zero incidents reported',
  },
  'crowd-favorite': {
    icon: Sparkles,
    label: 'Crowd Favorite',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/20',
    description: 'Consistently high attendance',
  },
  newcomer: {
    icon: Award,
    label: 'New Host',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    description: 'New to hosting on Laten',
  },
  streak: {
    icon: Flame,
    label: 'On Fire',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
    description: '5+ events streak',
  },
};

export const HostBadge: React.FC<HostBadgeProps> = ({
  type,
  size = 'md',
  showLabel = false,
  className,
}) => {
  const config = badgeConfigs[type];
  const Icon = config.icon;

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const containerSizes = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  if (showLabel) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
          config.bgColor,
          className
        )}
      >
        <Icon className={cn(sizes[size], config.color)} />
        <span className={cn('text-xs font-medium', config.color)}>
          {config.label}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      title={config.description}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        config.bgColor,
        containerSizes[size],
        className
      )}
    >
      <Icon className={cn(sizes[size], config.color)} />
    </motion.div>
  );
};

// Host level display
interface HostLevelProps {
  level: number;
  eventsHosted: number;
  rating: number;
  className?: string;
}

export const HostLevel: React.FC<HostLevelProps> = ({
  level,
  eventsHosted,
  rating,
  className,
}) => {
  const getLevelTitle = (level: number) => {
    if (level >= 50) return 'Legend';
    if (level >= 30) return 'Master';
    if (level >= 20) return 'Expert';
    if (level >= 10) return 'Pro';
    if (level >= 5) return 'Rising';
    return 'Newcomer';
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-amber-400 to-yellow-500';
    if (level >= 30) return 'from-purple-400 to-pink-500';
    if (level >= 20) return 'from-cyan-400 to-blue-500';
    if (level >= 10) return 'from-green-400 to-emerald-500';
    if (level >= 5) return 'from-blue-400 to-indigo-500';
    return 'from-gray-400 to-gray-500';
  };

  const nextLevelAt = Math.ceil(level / 5) * 5;
  const progress = ((level % 5) / 5) * 100 || 100;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
          'bg-gradient-to-br',
          getLevelColor(level)
        )}
      >
        {level}
      </motion.div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold">{getLevelTitle(level)}</span>
          <span className="text-xs text-muted-foreground">
            {eventsHosted} events • ⭐ {rating.toFixed(1)}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className={cn('h-full rounded-full bg-gradient-to-r', getLevelColor(level))}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {nextLevelAt - level} events to Level {nextLevelAt}
        </p>
      </div>
    </div>
  );
};

// Badge collection display
export const BadgeCollection: React.FC<{ badges: BadgeType[] }> = ({ badges }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, i) => (
        <motion.div
          key={badge}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <HostBadge type={badge} showLabel />
        </motion.div>
      ))}
    </div>
  );
};
