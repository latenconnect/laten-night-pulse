import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface IOSListItemProps {
  icon?: React.ReactNode;
  iconBackground?: string;
  label: string;
  value?: string | React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const IOSListItem: React.FC<IOSListItemProps> = ({
  icon,
  iconBackground,
  label,
  value,
  showChevron = false,
  destructive = false,
  onClick,
  className,
}) => {
  const { lightTap } = useHaptics();

  const handleClick = async () => {
    if (onClick) {
      await lightTap();
      onClick();
    }
  };

  const content = (
    <>
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            'w-[29px] h-[29px] rounded-[6px] flex items-center justify-center mr-3',
            iconBackground || 'bg-primary'
          )}
        >
          <div className="text-white w-[17px] h-[17px]">{icon}</div>
        </div>
      )}

      {/* Label */}
      <span
        className={cn(
          'flex-1 text-[17px]',
          destructive ? 'text-destructive' : 'text-foreground'
        )}
      >
        {label}
      </span>

      {/* Value */}
      {value && (
        <span className="text-[17px] text-muted-foreground mr-1">
          {value}
        </span>
      )}

      {/* Chevron */}
      {showChevron && (
        <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
      )}
    </>
  );

  if (onClick) {
    return (
      <motion.button
        whileTap={{ backgroundColor: 'hsl(var(--muted))' }}
        onClick={handleClick}
        className={cn(
          'w-full flex items-center px-4 py-3 text-left transition-colors',
          'border-b border-border/30 last:border-b-0',
          className
        )}
        style={{ background: 'hsl(var(--ios-grouped-secondary))' }}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center px-4 py-3',
        'border-b border-border/30 last:border-b-0',
        className
      )}
      style={{ background: 'hsl(var(--ios-grouped-secondary))' }}
    >
      {content}
    </div>
  );
};

interface IOSListGroupProps {
  header?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

export const IOSListGroup: React.FC<IOSListGroupProps> = ({
  header,
  footer,
  children,
  className,
  inset = true,
}) => {
  return (
    <div className={cn('py-4', className)}>
      {header && (
        <p className={cn(
          'text-[13px] uppercase text-muted-foreground mb-2 px-4',
          inset && 'mx-4'
        )}>
          {header}
        </p>
      )}
      
      <div
        className={cn(
          'rounded-xl overflow-hidden',
          inset && 'mx-4'
        )}
        style={{ background: 'hsl(var(--ios-grouped-secondary))' }}
      >
        {children}
      </div>

      {footer && (
        <p className={cn(
          'text-[13px] text-muted-foreground mt-2 px-4',
          inset && 'mx-4'
        )}>
          {footer}
        </p>
      )}
    </div>
  );
};

export default IOSListGroup;
