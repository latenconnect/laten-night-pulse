import { motion } from 'framer-motion';
import { Star, Music, MapPin, Play, Headphones, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/LanguageContext';
import { DJProfile } from '@/hooks/useDJs';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DJCardProps {
  dj: DJProfile;
  variant?: 'default' | 'compact';
}

export const DJCard = ({ dj, variant = 'default' }: DJCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const formatPrice = (min: number | null, max: number | null, currency: string | null) => {
    const curr = currency || 'HUF';
    if (!min && !max) return t('bartender.priceNegotiable') || 'Price negotiable';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${curr}`;
    if (min) return `${t('dj.from') || 'From'} ${min.toLocaleString()} ${curr}`;
    return `Up to ${max?.toLocaleString()} ${curr}`;
  };

  if (variant === 'compact') {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/dj/${dj.id}`)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={dj.profile_photo || undefined} alt={dj.dj_name} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {dj.dj_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{dj.dj_name}</p>
            <p className="text-xs text-muted-foreground">{dj.genres.slice(0, 2).join(' • ')}</p>
          </div>
          {dj.rating > 0 && (
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs font-medium">{dj.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate(`/dj/${dj.id}`)}
      className="w-full text-left group"
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-card via-card to-card/80",
        "border border-border/50 hover:border-primary/30",
        "shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-300"
      )}>
        {/* Ambient glow on hover */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative p-4">
          <div className="flex gap-4">
            {/* Profile Photo with play button overlay */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 rounded-xl ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                <AvatarImage 
                  src={dj.profile_photo || undefined} 
                  alt={dj.dj_name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-2xl font-bold rounded-xl">
                  {dj.dj_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-xl transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                  <Play className="h-4 w-4 text-primary-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>

              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center">
                <Headphones className="h-3 w-3 text-primary" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 py-0.5">
              {/* Name & Rating Row */}
              <div className="flex items-start justify-between mb-1.5">
                <h3 className="font-semibold text-foreground text-lg truncate pr-2">
                  {dj.dj_name}
                </h3>
                {dj.rating > 0 && (
                  <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-amber-500">
                      {dj.rating.toFixed(1)}
                    </span>
                    {dj.review_count > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        ({dj.review_count})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{dj.city}</span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {dj.genres.slice(0, 3).map((genre) => (
                  <Badge 
                    key={genre} 
                    variant="secondary" 
                    className="text-xs bg-primary/10 text-primary border-0 rounded-full px-2.5 py-0.5"
                  >
                    <Music className="h-2.5 w-2.5 mr-1" />
                    {genre}
                  </Badge>
                ))}
                {dj.genres.length > 3 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs rounded-full px-2.5 py-0.5 text-muted-foreground"
                  >
                    +{dj.genres.length - 3}
                  </Badge>
                )}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('dj.from') || 'From'} </span>
                  <span className="font-semibold text-foreground">
                    {dj.price_min ? `${dj.price_min.toLocaleString()} ${dj.currency || 'HUF'}` : t('bartender.priceNegotiable') || 'Negotiable'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  {t('common.viewMore') || 'View'}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
};
