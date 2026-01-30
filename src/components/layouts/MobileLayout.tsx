import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useSwipeBack } from '@/hooks/useNativeFeatures';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  header?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  enableSwipeBack?: boolean;
}

// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches 
  : false;

// iOS-style page transition variants with spring physics
const pageVariants = {
  initial: prefersReducedMotion ? { opacity: 0 } : {
    opacity: 0,
    x: 50,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: prefersReducedMotion 
      ? { duration: 0.15 }
      : {
          type: 'spring' as const,
          stiffness: 400,
          damping: 38,
          mass: 0.75,
        },
  },
  exit: prefersReducedMotion ? { opacity: 0 } : {
    opacity: 0,
    x: -25,
    scale: 0.985,
    transition: {
      type: 'spring' as const,
      stiffness: 420,
      damping: 42,
    },
  },
};

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  showNav = true, 
  header,
  className,
  contentClassName,
  enableSwipeBack = true,
}) => {
  const navigate = useNavigate();
  
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  // Enhanced iOS-style swipe-back gesture with visual feedback
  const { isSwiping, swipeStyle, swipeProgress } = useSwipeBack(handleBack);

  return (
    <div className={cn(
      'min-h-screen bg-background flex flex-col',
      'safe-top',
      className
    )}>
      {/* Swipe back shadow indicator */}
      <AnimatePresence>
        {isSwiping && swipeProgress > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: swipeProgress * 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, hsla(0, 0%, 0%, 0.2) 0%, transparent 30%)',
            }}
          />
        )}
      </AnimatePresence>

      {header && (
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="sticky top-0 z-40 ios-blur-material border-b border-border/20 safe-top-padding"
        >
          {header}
        </motion.header>
      )}
      
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={enableSwipeBack ? swipeStyle : undefined}
        className={cn(
          'flex-1 overflow-y-auto overscroll-contain scroll-smooth-mobile',
          showNav ? 'pb-24' : '',
          contentClassName
        )}
      >
        {children}
      </motion.main>
      
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileLayout;
