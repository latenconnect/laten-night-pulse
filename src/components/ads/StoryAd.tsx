import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Megaphone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdMob } from '@/hooks/useAdMob';

interface StoryAdProps {
  onComplete: () => void;
  onSkip: () => void;
  isPaused?: boolean;
}

/**
 * Full-screen story ad that appears between user stories
 * Instagram/Facebook-style interstitial ad
 */
export const StoryAd: React.FC<StoryAdProps> = ({ 
  onComplete, 
  onSkip,
  isPaused = false 
}) => {
  const { isInitialized, isNativeSupported } = useAdMob();
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  const AD_DURATION = 5000; // 5 seconds
  const SKIP_AFTER = 3000; // Can skip after 3 seconds

  // Placeholder ad content
  const ad = {
    title: 'Upgrade to Premium',
    subtitle: 'Get unlimited access',
    description: 'Enjoy ad-free experience, exclusive features, and more!',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1080&h=1920&fit=crop',
    cta: 'Learn More',
    ctaUrl: '#',
  };

  useEffect(() => {
    if (isPaused) return;

    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, SKIP_AFTER);

    return () => clearTimeout(skipTimer);
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          onComplete();
          return 100;
        }
        return prev + (100 / (AD_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, onComplete]);

  const handleClick = useCallback(() => {
    // In production, this would open the ad URL
    console.log('Ad clicked');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2 pt-safe">
        <div className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Sponsored</p>
            <p className="text-white/60 text-xs">Advertisement</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canSkip ? (
            <button
              onClick={onSkip}
              className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium"
            >
              Skip Ad
            </button>
          ) : (
            <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/60 text-sm">
              Skip in {Math.ceil((SKIP_AFTER - (progress / 100 * AD_DURATION)) / 1000)}s
            </span>
          )}
          <button
            onClick={onSkip}
            className="p-2 rounded-full bg-white/10 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ad Content */}
      <div 
        className="w-full h-full flex items-center justify-center"
        onClick={handleClick}
      >
        {/* Background Image */}
        <img
          src={ad.image}
          alt="Ad"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              {ad.title}
            </h2>
            <p className="text-lg text-white/80 mb-4">
              {ad.description}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className={cn(
                "w-full py-4 rounded-xl font-semibold text-lg",
                "bg-primary text-primary-foreground",
                "shadow-lg shadow-primary/30",
                "flex items-center justify-center gap-2",
                "hover:opacity-90 transition-opacity"
              )}
            >
              {ad.cta}
              <ExternalLink className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryAd;
