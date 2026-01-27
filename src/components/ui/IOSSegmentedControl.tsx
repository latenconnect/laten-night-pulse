import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface Segment {
  value: string;
  label: string;
}

interface IOSSegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const IOSSegmentedControl: React.FC<IOSSegmentedControlProps> = ({
  segments,
  value,
  onChange,
  className,
}) => {
  const { selectionChanged } = useHaptics();
  const activeIndex = segments.findIndex(s => s.value === value);

  const handleSelect = async (segmentValue: string) => {
    if (segmentValue !== value) {
      await selectionChanged();
      onChange(segmentValue);
    }
  };

  return (
    <div 
      className={cn(
        'relative flex p-0.5 rounded-[9px] bg-muted',
        className
      )}
      role="tablist"
    >
      {/* Sliding background indicator */}
      <motion.div
        className="absolute top-0.5 bottom-0.5 rounded-[7px] bg-card shadow-sm"
        initial={false}
        animate={{
          x: `${activeIndex * 100}%`,
          width: `${100 / segments.length}%`,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 35,
          mass: 0.8,
        }}
        style={{
          left: 2,
          right: 2,
        }}
      />

      {segments.map((segment) => (
        <button
          key={segment.value}
          role="tab"
          aria-selected={value === segment.value}
          onClick={() => handleSelect(segment.value)}
          className={cn(
            'relative flex-1 py-[7px] px-3 text-[13px] font-medium text-center rounded-[7px] transition-colors duration-150 z-10',
            value === segment.value
              ? 'text-foreground'
              : 'text-muted-foreground active:text-foreground/70'
          )}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
};

export default IOSSegmentedControl;
