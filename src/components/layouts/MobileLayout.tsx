import React from 'react';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  header?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  showNav = true, 
  header,
  className,
  contentClassName
}) => {
  return (
    <div className={cn(
      'min-h-screen bg-background flex flex-col',
      'safe-top',
      className
    )}>
      {header && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-top-padding">
          {header}
        </header>
      )}
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'flex-1 overflow-y-auto overscroll-contain',
          showNav ? 'pb-24' : '',
          contentClassName
        )}
      >
        {children}
      </motion.main>
      
      {showNav && <BottomNav />}
    </div>
  );
};

export default MobileLayout;
