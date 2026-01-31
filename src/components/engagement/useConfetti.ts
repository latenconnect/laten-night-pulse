import React, { useEffect, useRef, useCallback } from 'react';
import canvasConfetti from 'canvas-confetti';
import { useHaptics } from '@/hooks/useHaptics';

type ConfettiType = 'rsvp' | 'achievement' | 'milestone' | 'streak' | 'celebration';

interface ConfettiOptions {
  type?: ConfettiType;
  duration?: number;
}

// Hook for triggering confetti
export const useConfetti = () => {
  const { successNotification, heavyTap } = useHaptics();

  const triggerConfetti = useCallback((options: ConfettiOptions = {}) => {
    const { type = 'celebration', duration = 2000 } = options;

    // Haptic feedback
    successNotification();

    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 9999,
      disableForReducedMotion: true,
    };

    switch (type) {
      case 'rsvp':
        // Party popper style - burst from sides
        canvasConfetti({
          ...defaults,
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#a855f7', '#06b6d4', '#f472b6', '#fbbf24'],
        });
        canvasConfetti({
          ...defaults,
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#a855f7', '#06b6d4', '#f472b6', '#fbbf24'],
        });
        break;

      case 'achievement':
        // Golden burst from center
        heavyTap();
        canvasConfetti({
          ...defaults,
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#fff'],
        });
        break;

      case 'milestone':
        // Stars falling
        const end = Date.now() + duration;
        const colors = ['#fbbf24', '#a855f7', '#06b6d4'];
        
        (function frame() {
          canvasConfetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0 },
            colors: colors,
            shapes: ['star'],
            scalar: 1.2,
          });
          canvasConfetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0 },
            colors: colors,
            shapes: ['star'],
            scalar: 1.2,
          });
          
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
        break;

      case 'streak':
        // Fire-themed - oranges and reds
        canvasConfetti({
          ...defaults,
          particleCount: 80,
          spread: 100,
          origin: { y: 0.7 },
          colors: ['#f97316', '#ef4444', '#fbbf24', '#dc2626'],
        });
        break;

      case 'celebration':
      default:
        // Standard celebration
        const count = 200;
        const celebrationDefaults = {
          origin: { y: 0.7 },
          zIndex: 9999,
        };

        function fire(particleRatio: number, opts: canvasConfetti.Options) {
          canvasConfetti({
            ...celebrationDefaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
        break;
    }
  }, [successNotification, heavyTap]);

  return { triggerConfetti };
};

// Component wrapper for easy use
interface ConfettiTriggerProps {
  trigger: boolean;
  type?: ConfettiType;
  onComplete?: () => void;
}

export const ConfettiTrigger: React.FC<ConfettiTriggerProps> = ({
  trigger,
  type = 'celebration',
  onComplete,
}) => {
  const { triggerConfetti } = useConfetti();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      triggerConfetti({ type });
      
      // Reset after animation
      setTimeout(() => {
        hasTriggered.current = false;
        onComplete?.();
      }, 2000);
    }
  }, [trigger, type, triggerConfetti, onComplete]);

  return null;
};

export default useConfetti;
