import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface TouchFeedbackProps extends HTMLMotionProps<'div'> {
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  scaleAmount?: number;
  children: React.ReactNode;
}

/**
 * A wrapper that provides native-feeling touch feedback with haptics
 */
export const TouchFeedback = forwardRef<HTMLDivElement, TouchFeedbackProps>(
  ({ hapticType = 'light', scaleAmount = 0.97, children, onClick, className, ...props }, ref) => {
    const { lightTap, mediumTap, heavyTap, selectionChanged } = useHaptics();
    
    const triggerHaptic = async () => {
      switch (hapticType) {
        case 'light':
          await lightTap();
          break;
        case 'medium':
          await mediumTap();
          break;
        case 'heavy':
          await heavyTap();
          break;
        case 'selection':
          await selectionChanged();
          break;
        default:
          break;
      }
    };
    
    const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
      await triggerHaptic();
      onClick?.(e);
    };
    
    return (
      <motion.div
        ref={ref}
        whileTap={{ scale: scaleAmount }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={handleClick}
        className={cn('cursor-pointer select-none', className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

TouchFeedback.displayName = 'TouchFeedback';

interface PressableProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  variant?: 'scale' | 'opacity' | 'both';
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * A native-feeling pressable button with haptic feedback
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  ({ hapticType = 'light', variant = 'both', children, onClick, className, disabled, type = 'button', ...props }, ref) => {
    const { lightTap, mediumTap, heavyTap, successNotification, warningNotification, errorNotification } = useHaptics();
    
    const triggerHaptic = async () => {
      switch (hapticType) {
        case 'light':
          await lightTap();
          break;
        case 'medium':
          await mediumTap();
          break;
        case 'heavy':
          await heavyTap();
          break;
        case 'success':
          await successNotification();
          break;
        case 'warning':
          await warningNotification();
          break;
        case 'error':
          await errorNotification();
          break;
      }
    };
    
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      await triggerHaptic();
      onClick?.(e);
    };
    
    const getAnimationProps = () => {
      switch (variant) {
        case 'scale':
          return { whileTap: { scale: 0.95 } };
        case 'opacity':
          return { whileTap: { opacity: 0.7 } };
        case 'both':
        default:
          return { whileTap: { scale: 0.97, opacity: 0.9 } };
      }
    };
    
    return (
      <motion.button
        ref={ref}
        {...getAnimationProps()}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        onClick={handleClick}
        className={cn('select-none touch-target', className)}
        disabled={disabled}
        type={type}
      >
        {children}
      </motion.button>
    );
  }
);

Pressable.displayName = 'Pressable';

interface LongPressProps extends HTMLMotionProps<'div'> {
  onLongPress?: () => void;
  longPressDelay?: number;
  children: React.ReactNode;
}

/**
 * A component that handles long press with haptic feedback
 */
export const LongPress: React.FC<LongPressProps> = ({
  onLongPress,
  longPressDelay = 500,
  children,
  className,
  ...props
}) => {
  const { heavyTap } = useHaptics();
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = React.useState(false);
  
  const handlePressStart = () => {
    setIsPressed(true);
    timerRef.current = setTimeout(async () => {
      await heavyTap();
      onLongPress?.();
    }, longPressDelay);
  };
  
  const handlePressEnd = () => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
  
  return (
    <motion.div
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      animate={isPressed ? { scale: 0.95 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn('select-none', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default { TouchFeedback, Pressable, LongPress };
