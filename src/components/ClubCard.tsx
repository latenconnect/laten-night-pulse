import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, ChevronRight, DollarSign, Music, Wine, Beer, Sparkles, GlassWater } from 'lucide-react';
import { Club } from '@/hooks/useClubs';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Map venue types to display labels and styles
const VENUE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  club: { label: 'Club', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Music },
  bar: { label: 'Bar', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: GlassWater },
  pub: { label: 'Pub', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Beer },
  lounge: { label: 'Lounge', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: Sparkles },
  wine_bar: { label: 'Wine Bar', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: Wine },
  festival: { label: 'Festival', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Sparkles },
};

interface ClubCardProps {
  club: Club;
  variant?: 'default' | 'compact';
}

const ClubCard: React.FC<ClubCardProps> = ({ club, variant = 'default' }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/club/${club.id}`);
  };

  const venueConfig = club.venue_type ? VENUE_TYPE_CONFIG[club.venue_type] || VENUE_TYPE_CONFIG.bar : VENUE_TYPE_CONFIG.bar;
  const VenueIcon = venueConfig.icon;

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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{club.name}</h3>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 flex-shrink-0",
              venueConfig.color
            )}>
              <VenueIcon className="w-2.5 h-2.5" />
              {venueConfig.label}
            </span>
          </div>
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

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
        
        {/* Venue type badge */}
        <div className={cn(
          "absolute top-2 left-2 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 border",
          venueConfig.color
        )}>
          <VenueIcon className="w-3 h-3" />
          <span className="text-xs font-medium">{venueConfig.label}</span>
        </div>
        
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
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{club.name}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary flex-shrink-0">{club.city}</span>
        </div>
        {club.address && (
          <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {club.address}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          {priceIndicator || <span />}
          <span className="text-xs text-primary flex items-center gap-1">
            View Details <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ClubCard;
