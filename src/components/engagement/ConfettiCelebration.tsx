import { useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiOptions {
  type?: 'rsvp' | 'create' | 'streak' | 'badge' | 'milestone';
}

export const useConfetti = () => {
  const celebrate = useCallback((options: ConfettiOptions = {}) => {
    const { type = 'rsvp' } = options;

    const colors = ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b'];

    switch (type) {
      case 'rsvp':
        // Quick burst for RSVP
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors,
        });
        break;
      
      case 'create':
        // Double burst for event creation
        const duration = 500;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
        break;
      
      case 'streak':
        // Firework for streak milestones
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors,
          shapes: ['star'],
        });
        break;

      case 'badge':
        // Stars for badges
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
          shapes: ['star'],
          scalar: 1.2,
        });
        break;

      case 'milestone':
        // Epic celebration for milestones
        const endMilestone = Date.now() + 1000;

        const milestoneFn = () => {
          confetti({
            particleCount: 5,
            angle: Math.random() * 360,
            spread: 80,
            origin: { x: Math.random(), y: Math.random() * 0.4 },
            colors,
          });

          if (Date.now() < endMilestone) {
            requestAnimationFrame(milestoneFn);
          }
        };
        milestoneFn();
        break;
    }
  }, []);

  return { celebrate };
};

// Component wrapper for triggering confetti on mount
export const ConfettiCelebration: React.FC<ConfettiOptions & { trigger?: boolean }> = ({ 
  type = 'rsvp',
  trigger = true 
}) => {
  const { celebrate } = useConfetti();

  useEffect(() => {
    if (trigger) {
      celebrate({ type });
    }
  }, [trigger, type, celebrate]);

  return null;
};
