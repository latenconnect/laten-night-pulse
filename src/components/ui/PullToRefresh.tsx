import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

/**
 * Native-feeling pull-to-refresh component
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}) => {
  const { mediumTap } = useHaptics();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const pullDistance = useMotionValue(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  // Transform pull distance to rotation
  const rotation = useTransform(pullDistance, [0, threshold], [0, 360]);
  const scale = useTransform(pullDistance, [0, threshold / 2, threshold], [0.5, 1, 1]);
  const opacity = useTransform(pullDistance, [0, threshold / 2], [0, 1]);
  
  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollTop <= 0;
  }, [disabled, isRefreshing]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canPull()) return;
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [canPull]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || !canPull()) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance for rubber-band effect
    const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
    pullDistance.set(resistedDistance);
    
    // Haptic feedback when crossing threshold
    if (resistedDistance >= threshold && pullDistance.get() < threshold) {
      mediumTap();
    }
  }, [isPulling, canPull, threshold, pullDistance, mediumTap]);
  
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);
    
    const distance = pullDistance.get();
    
    if (distance >= threshold) {
      setIsRefreshing(true);
      pullDistance.set(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        pullDistance.set(0);
      }
    } else {
      pullDistance.set(0);
    }
  }, [isPulling, threshold, pullDistance, onRefresh]);
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Pull indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
            style={{
              top: useTransform(pullDistance, (d) => Math.min(d, threshold) - 40),
              opacity,
              scale,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={cn(
                'w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center shadow-lg',
                isRefreshing && 'animate-pulse'
              )}
            >
              <motion.div
                style={{ rotate: isRefreshing ? undefined : rotation }}
                animate={isRefreshing ? { rotate: 360 } : undefined}
                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : undefined}
              >
                <RefreshCw className="w-5 h-5 text-primary" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content container */}
      <motion.div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-contain"
        style={{
          y: useTransform(pullDistance, (d) => (isPulling || isRefreshing ? Math.min(d, threshold) : 0)),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
