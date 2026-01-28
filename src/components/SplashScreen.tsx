import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import latenLogo from '@/assets/laten-logo.png';
import { useHaptics } from '@/hooks/useHaptics';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete,
  minDuration = 2000, 
}) => {
  const [isReady, setIsReady] = useState(false);
  const { successNotification } = useHaptics();
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Trigger haptic on splash complete
      await successNotification();
      setIsReady(true);
      onComplete?.();
    }, minDuration);
    
    return () => clearTimeout(timer);
  }, [minDuration, onComplete, successNotification]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isReady ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center safe-area-inset"
      style={{ willChange: 'opacity' }}
    >
      {/* Background Glow Effects - GPU accelerated */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden gpu-accelerated">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px]"
          style={{ willChange: 'transform, opacity' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute top-1/3 left-1/4 w-64 h-64 bg-neon-pink/20 rounded-full blur-[100px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Logo with pulsing glow */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10"
      >
        <motion.img
          src={latenLogo}
          alt="Laten"
          className="w-28 h-28 object-contain gpu-accelerated"
          animate={{ 
            filter: [
              'drop-shadow(0 0 20px hsla(270, 91%, 65%, 0.5))',
              'drop-shadow(0 0 40px hsla(270, 91%, 65%, 0.8))',
              'drop-shadow(0 0 20px hsla(270, 91%, 65%, 0.5))',
            ]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ willChange: 'filter' }}
        />
      </motion.div>

      {/* Native-style loading indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-10 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
      
    </motion.div>
  );
};

export default SplashScreen;
