import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ImageOff, Star, MapPin, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAdMob } from '@/hooks/useAdMob';

interface NativeAdCardProps {
  variant?: 'venue' | 'professional';
  className?: string;
}

/**
 * Native-styled ad card that blends with venue/professional cards
 * Shows placeholder on web, integrates with AdMob on native
 */
export const NativeAdCard: React.FC<NativeAdCardProps> = ({ 
  variant = 'venue',
  className 
}) => {
  const { isInitialized, isNativeSupported } = useAdMob();
  const [imageError, setImageError] = useState(false);

  // Placeholder ad content for web/demo
  const placeholderAds = {
    venue: {
      title: 'Discover More Venues',
      subtitle: 'Sponsored',
      description: 'Find the hottest clubs and bars in your area',
      image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&h=300&fit=crop',
      cta: 'Explore Now',
    },
    professional: {
      title: 'Featured Professional',
      subtitle: 'Sponsored',
      description: 'Book top-rated DJs and bartenders',
      image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=300&fit=crop',
      cta: 'Learn More',
    },
  };

  const ad = placeholderAds[variant];

  // Venue-styled ad card
  if (variant === 'venue') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-[280px] flex-shrink-0 rounded-2xl overflow-hidden bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors group relative",
          className
        )}
      >
        {/* Sponsored indicator */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-muted/80 backdrop-blur-sm border border-border">
          <Megaphone className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Ad
          </span>
        </div>

        {/* Photo */}
        <div className="relative h-36 bg-muted">
          {!imageError ? (
            <img
              src={ad.image}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <ImageOff className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{ad.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {ad.description}
          </p>
          <div className="flex items-center justify-end mt-2">
            <span className="text-xs text-primary flex items-center gap-1 font-medium">
              {ad.cta} <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Professional-styled ad card
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-card via-card to-card/80",
        "border border-border/50 hover:border-primary/30",
        "shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-300 cursor-pointer",
        className
      )}
    >
      {/* Gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-primary to-secondary" />
      
      <div className="relative p-4">
        <div className="flex gap-4">
          {/* Image */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-xl ring-2 ring-primary/10 overflow-hidden bg-muted">
              {!imageError ? (
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <ImageOff className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Ad badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg bg-muted border border-border">
              <Megaphone className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-0.5">
            {/* Header */}
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-foreground text-lg truncate">
                  {ad.title}
                </h3>
              </div>
              <Badge 
                variant="outline"
                className="text-[10px] border-muted-foreground/30 text-muted-foreground rounded-full px-2"
              >
                Sponsored
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {ad.description}
            </p>

            {/* CTA */}
            <div className="flex items-center justify-end">
              <span className="flex items-center gap-1 text-primary font-medium text-sm">
                {ad.cta}
                <ExternalLink className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NativeAdCard;
