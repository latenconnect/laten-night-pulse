import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Flame, Clock, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialSignalProps {
  type: 'filling-fast' | 'trending' | 'friends-going' | 'almost-full' | 'live-now' | 'hot';
  count?: number;
  friendAvatars?: string[];
  className?: string;
}

export const SocialSignal: React.FC<SocialSignalProps> = ({
  type,
  count,
  friendAvatars = [],
  className,
}) => {
  const configs = {
    'filling-fast': {
      icon: Zap,
      label: 'Filling fast',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/30',
      pulse: true,
    },
    'trending': {
      icon: TrendingUp,
      label: 'Trending',
      color: 'text-secondary',
      bg: 'bg-secondary/10 border-secondary/30',
      pulse: false,
    },
    'friends-going': {
      icon: Users,
      label: `${count || friendAvatars.length} friends going`,
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/30',
      pulse: false,
    },
    'almost-full': {
      icon: Flame,
      label: 'Almost full!',
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/30',
      pulse: true,
    },
    'live-now': {
      icon: Clock,
      label: 'Happening now',
      color: 'text-green-400',
      bg: 'bg-green-400/10 border-green-400/30',
      pulse: true,
    },
    'hot': {
      icon: Flame,
      label: 'Hot right now',
      color: 'text-orange-400',
      bg: 'bg-orange-400/10 border-orange-400/30',
      pulse: true,
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium',
        config.bg,
        config.color,
        className
      )}
    >
      <Icon className={cn('w-3 h-3', config.pulse && 'animate-pulse')} />
      <span>{config.label}</span>
      
      {type === 'friends-going' && friendAvatars.length > 0 && (
        <div className="flex -space-x-1.5 ml-1">
          {friendAvatars.slice(0, 3).map((avatar, i) => (
            <img
              key={i}
              src={avatar}
              alt=""
              className="w-4 h-4 rounded-full border border-background"
            />
          ))}
          {friendAvatars.length > 3 && (
            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold border border-background">
              +{friendAvatars.length - 3}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Live activity pulse component
export const ActivityPulse: React.FC<{ count: number; label?: string }> = ({ 
  count, 
  label = 'people browsing' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-xs text-muted-foreground"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span>
        <span className="font-semibold text-foreground">{count}</span> {label}
      </span>
    </motion.div>
  );
};

// Hype meter component
export const HypeMeter: React.FC<{ level: number; maxLevel?: number }> = ({ 
  level, 
  maxLevel = 5 
}) => {
  const percentage = (level / maxLevel) * 100;
  
  const getColor = () => {
    if (percentage >= 80) return 'from-red-500 to-orange-500';
    if (percentage >= 60) return 'from-orange-500 to-amber-500';
    if (percentage >= 40) return 'from-amber-500 to-yellow-500';
    return 'from-yellow-500 to-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      <Flame className={cn(
        'w-4 h-4',
        percentage >= 80 ? 'text-red-500 animate-pulse' : 'text-muted-foreground'
      )} />
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full bg-gradient-to-r', getColor())}
        />
      </div>
      <span className="text-xs text-muted-foreground">{level}/{maxLevel}</span>
    </div>
  );
};

// Quick reactions for events
export const QuickReactions: React.FC<{ 
  reactions: { emoji: string; count: number }[];
  onReact?: (emoji: string) => void;
}> = ({ reactions, onReact }) => {
  return (
    <div className="flex items-center gap-1">
      {reactions.map((reaction, i) => (
        <motion.button
          key={reaction.emoji}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReact?.(reaction.emoji)}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted/50 hover:bg-muted text-xs"
        >
          <span>{reaction.emoji}</span>
          <span className="text-muted-foreground">{reaction.count}</span>
        </motion.button>
      ))}
    </div>
  );
};
