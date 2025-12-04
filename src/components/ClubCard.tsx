import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, ExternalLink, DollarSign } from 'lucide-react';
import { Club } from '@/hooks/useClubs';
import { cn } from '@/lib/utils';

interface ClubCardProps {
  club: Club;
  variant?: 'default' | 'compact';
}

const ClubCard: React.FC<ClubCardProps> = ({ club, variant = 'default' }) => {
  const handleClick = () => {
    if (club.google_maps_uri) {
      window.open(club.google_maps_uri, '_blank', 'noopener,noreferrer');
    }
  };

  const priceIndicator = club.price_level ? (
    <div className="flex items-center gap-0.5">
      {[...Array(4)].map((_, i) => (
        <DollarSign
          key={i}
          className={cn(
            'w-3 h-3',
            i < club.price_level! ? 'text-primary' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  ) : null;

  if (variant === 'compact') {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="flex gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors"
      >
        {/* Photo */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {club.photos?.[0] ? (
            <img
              src={club.photos[0]}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{club.name}</h3>
          {club.address && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {club.address}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {club.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-medium">{club.rating.toFixed(1)}</span>
              </div>
            )}
            {priceIndicator}
          </div>
        </div>

        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className="w-[280px] flex-shrink-0 rounded-2xl overflow-hidden bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors group"
    >
      {/* Photo */}
      <div className="relative h-36 bg-muted">
        {club.photos?.[0] ? (
          <img
            src={club.photos[0]}
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <MapPin className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        
        {/* Rating badge */}
        {club.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium text-white">{club.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold truncate">{club.name}</h3>
        {club.address && (
          <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {club.address}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          {priceIndicator || <span />}
          <span className="text-xs text-primary flex items-center gap-1">
            View on Maps <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ClubCard;
