import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IOSLargeTitleProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

const IOSLargeTitle: React.FC<IOSLargeTitleProps> = ({
  title,
  subtitle,
  rightAction,
  children,
  className,
  scrollContainerRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  
  // Threshold for when to switch to compact title
  const collapseThreshold = 50;
  const isCollapsed = scrollY > collapseThreshold;

  useEffect(() => {
    const container = scrollContainerRef?.current || window;
    
    const handleScroll = () => {
      if (scrollContainerRef?.current) {
        setScrollY(scrollContainerRef.current.scrollTop);
      } else {
        setScrollY(window.scrollY);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  // Calculate opacity and transform values
  const largeTitleOpacity = Math.max(0, 1 - scrollY / collapseThreshold);
  const largeTitleY = Math.min(0, -scrollY * 0.5);
  const compactTitleOpacity = Math.min(1, (scrollY - collapseThreshold * 0.5) / (collapseThreshold * 0.5));

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Compact Navigation Bar (shown on scroll) */}
      <div 
        className={cn(
          'sticky top-0 z-40 safe-top-padding transition-all duration-200',
          isCollapsed ? 'ios-nav-bar' : 'bg-transparent'
        )}
      >
        <div className="flex items-center justify-between px-4 h-11">
          {/* Compact title (appears on scroll) */}
          <motion.h1
            className="ios-title flex-1 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: compactTitleOpacity }}
          >
            {title}
          </motion.h1>
          
          {/* Right action */}
          {rightAction && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {rightAction}
            </div>
          )}
        </div>
      </div>

      {/* Large Title Section */}
      <motion.div
        className="px-4 pt-1 pb-2"
        style={{
          opacity: largeTitleOpacity,
          transform: `translateY(${largeTitleY}px)`,
        }}
      >
        <div className="flex items-end justify-between">
          <div>
            <h1 className="ios-large-title text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-[15px] text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {rightAction && !isCollapsed && (
            <div className="pb-1">{rightAction}</div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {children}
    </div>
  );
};

export default IOSLargeTitle;
