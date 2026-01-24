import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Native-feeling skeleton loader with smooth shimmer animation
 */
export const NativeSkeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true,
}) => {
  const baseClasses = cn(
    'bg-muted/50 overflow-hidden relative',
    {
      'rounded-md': variant === 'rectangular',
      'rounded-full': variant === 'circular',
      'rounded-xl': variant === 'rounded',
      'rounded h-4': variant === 'text',
    },
    className
  );
  
  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1rem' : undefined),
  };
  
  if (!animate) {
    return <div className={baseClasses} style={style} />;
  }
  
  return (
    <div className={baseClasses} style={style}>
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{
          translateX: ['0%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsla(var(--foreground) / 0.05) 50%, transparent 100%)',
        }}
      />
    </div>
  );
};

/**
 * Skeleton for event cards
 */
export const EventCardSkeleton: React.FC = () => (
  <div className="glass-card p-4 space-y-3">
    <NativeSkeleton variant="rounded" height={160} className="w-full" />
    <div className="space-y-2">
      <NativeSkeleton variant="text" width="70%" />
      <NativeSkeleton variant="text" width="50%" height={12} />
      <div className="flex gap-2 pt-2">
        <NativeSkeleton variant="rounded" width={80} height={24} />
        <NativeSkeleton variant="rounded" width={60} height={24} />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for club cards
 */
export const ClubCardSkeleton: React.FC = () => (
  <div className="glass-card overflow-hidden">
    <NativeSkeleton variant="rectangular" height={120} className="w-full rounded-none" />
    <div className="p-3 space-y-2">
      <NativeSkeleton variant="text" width="60%" />
      <NativeSkeleton variant="text" width="80%" height={12} />
      <div className="flex items-center gap-2">
        <NativeSkeleton variant="circular" width={16} height={16} />
        <NativeSkeleton variant="text" width={40} height={12} />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for profile avatar
 */
export const AvatarSkeleton: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <NativeSkeleton variant="circular" width={size} height={size} />
);

/**
 * Skeleton for a list of items
 */
export const ListSkeleton: React.FC<{ count?: number; itemHeight?: number }> = ({
  count = 5,
  itemHeight = 60,
}) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <NativeSkeleton variant="circular" width={44} height={44} />
        <div className="flex-1 space-y-2">
          <NativeSkeleton variant="text" width="60%" />
          <NativeSkeleton variant="text" width="40%" height={12} />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Full page skeleton for loading states
 */
export const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background p-4 space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <NativeSkeleton variant="text" width={120} height={28} />
      <NativeSkeleton variant="circular" width={40} height={40} />
    </div>
    
    {/* Content skeletons */}
    <div className="space-y-4">
      <NativeSkeleton variant="rounded" height={200} className="w-full" />
      <div className="grid grid-cols-2 gap-3">
        <EventCardSkeleton />
        <EventCardSkeleton />
      </div>
      <ListSkeleton count={3} />
    </div>
  </div>
);

export default NativeSkeleton;
