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

// iOS-style page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.15,
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
  
  // Enable iOS-style swipe-back gesture
  useSwipeBack(handleBack);

  return (
    <div className={cn(
      'min-h-screen bg-background flex flex-col',
      'safe-top',
      className
    )}>
      {header && (
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 safe-top-padding"
        >
          {header}
        </motion.header>
      )}
      
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
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
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileLayout;
