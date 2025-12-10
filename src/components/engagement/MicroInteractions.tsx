import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Heart, Bookmark, Share2, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

// Animated save button with satisfying feedback
interface SaveButtonProps {
  saved: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  saved,
  onToggle,
  size = 'md',
  className,
}) => {
  const controls = useAnimation();
  const { lightTap, successNotification } = useHaptics();

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = async () => {
    if (!saved) {
      await controls.start({
        scale: [1, 1.4, 1],
        transition: { duration: 0.3 },
      });
      successNotification();
    } else {
      lightTap();
    }
    onToggle();
  };

  return (
    <motion.button
      onClick={handleClick}
      animate={controls}
      whileTap={{ scale: 0.9 }}
      className={cn('p-2 rounded-full transition-colors', className)}
    >
      <Bookmark
        className={cn(
          sizes[size],
          'transition-all duration-200',
          saved ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      />
    </motion.button>
  );
};

// Animated like/heart button with particle effect
interface LikeButtonProps {
  liked: boolean;
  count?: number;
  onToggle: () => void;
  showCount?: boolean;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  liked,
  count = 0,
  onToggle,
  showCount = true,
  className,
}) => {
  const controls = useAnimation();
  const { mediumTap, successNotification } = useHaptics();

  const handleClick = async () => {
    if (!liked) {
      await controls.start({
        scale: [1, 1.3, 0.9, 1.1, 1],
        transition: { duration: 0.4 },
      });
      successNotification();
    } else {
      mediumTap();
    }
    onToggle();
  };

  return (
    <motion.button
      onClick={handleClick}
      animate={controls}
      whileTap={{ scale: 0.9 }}
      className={cn('flex items-center gap-1.5 p-2 rounded-full transition-colors', className)}
    >
      <Heart
        className={cn(
          'w-5 h-5 transition-all duration-200',
          liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-foreground'
        )}
      />
      {showCount && count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-sm text-muted-foreground"
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  );
};

// RSVP button with celebration animation
interface RSVPButtonProps {
  isGoing: boolean;
  onToggle: () => void;
  attendeeCount?: number;
  disabled?: boolean;
  className?: string;
}

export const RSVPButton: React.FC<RSVPButtonProps> = ({
  isGoing,
  onToggle,
  attendeeCount,
  disabled = false,
  className,
}) => {
  const controls = useAnimation();
  const { heavyTap, successNotification } = useHaptics();

  const handleClick = async () => {
    if (disabled) return;
    
    if (!isGoing) {
      heavyTap();
      await controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.2 },
      });
      successNotification();
    } else {
      heavyTap();
    }
    onToggle();
  };

  return (
    <motion.button
      onClick={handleClick}
      animate={controls}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200',
        isGoing
          ? 'bg-primary/20 text-primary border border-primary/50'
          : 'bg-primary text-primary-foreground shadow-[0_0_20px_hsla(270,91%,65%,0.4)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isGoing ? (
        <>
          <Check className="w-5 h-5" />
          <span>Going</span>
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          <span>RSVP</span>
        </>
      )}
      {attendeeCount !== undefined && (
        <span className="ml-1 text-sm opacity-80">
          +{attendeeCount}
        </span>
      )}
    </motion.button>
  );
};

// Share button with ripple effect
interface ShareButtonProps {
  onShare: () => void;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onShare, className }) => {
  const { lightTap } = useHaptics();

  const handleClick = () => {
    lightTap();
    onShare();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors',
        className
      )}
    >
      <Share2 className="w-5 h-5" />
    </motion.button>
  );
};

// Smooth counter animation
export const AnimatedCounter: React.FC<{ value: number; className?: string }> = ({
  value,
  className,
}) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={className}
    >
      {value.toLocaleString()}
    </motion.span>
  );
};

// Pulsing notification dot
export const NotificationDot: React.FC<{ count?: number; className?: string }> = ({
  count,
  className,
}) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive flex items-center justify-center',
        className
      )}
    >
      <span className="text-[10px] font-bold text-destructive-foreground px-1">
        {count && count > 99 ? '99+' : count}
      </span>
    </motion.div>
  );
};

// Skeleton with shimmer for loading states
export const ShimmerSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('shimmer rounded', className)} />
  );
};
