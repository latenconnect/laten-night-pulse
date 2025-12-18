import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Music, Star, MapPin, ChevronRight, Disc } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDJs } from '@/hooks/useDJs';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface DJsShowcaseProps {
  limit?: number;
}

const DJsShowcase: React.FC<DJsShowcaseProps> = ({ limit = 5 }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { selectedCity } = useApp();
  const { djs, isLoading } = useDJs({ city: selectedCity });

  const displayDJs = djs.slice(0, limit);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-[180px] h-[140px] flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (displayDJs.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl">
            {t('dj.topDJs') || 'Top DJs'}
          </h2>
          <Badge 
            variant="secondary" 
            className="bg-primary/20 text-primary border-primary/30 text-xs"
          >
            <Disc className="w-3 h-3 mr-1" />
            Hot
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1"
          onClick={() => navigate('/djs')}
        >
          {t('common.viewAll') || 'View All'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
        {displayDJs.map((dj, index) => (
          <motion.button
            key={dj.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/dj/${dj.id}`)}
            className={cn(
              "relative flex-shrink-0 w-[180px] rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-primary/10 via-card to-card",
              "border border-primary/20 hover:border-primary/40",
              "shadow-lg shadow-primary/5 hover:shadow-primary/10",
              "transition-all duration-300",
              "text-left p-4 group"
            )}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Avatar and rating */}
              <div className="flex items-start justify-between mb-3">
                <Avatar className="h-14 w-14 border-2 border-primary/30 shadow-lg">
                  <AvatarImage 
                    src={dj.profile_photo || undefined} 
                    alt={dj.dj_name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    <Music className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                
                {dj.rating && dj.rating > 0 && (
                  <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold">{dj.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="font-semibold text-foreground truncate mb-1">
                {dj.dj_name}
              </p>
              
              {/* Location */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{dj.city}</span>
              </div>

              {/* Genres */}
              {dj.genres && dj.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dj.genres.slice(0, 2).map(genre => (
                    <span 
                      key={genre} 
                      className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary/80 rounded-full font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                  {dj.genres.length > 2 && (
                    <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                      +{dj.genres.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.button>
        ))}

        {/* View More Card */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: displayDJs.length * 0.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/djs')}
          className={cn(
            "flex-shrink-0 w-[120px] min-h-[140px] rounded-2xl",
            "border border-dashed border-primary/30 hover:border-primary/50",
            "flex flex-col items-center justify-center gap-2",
            "transition-all duration-300 group"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <ChevronRight className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
            {t('common.viewMore') || 'View More'}
          </span>
        </motion.button>
      </div>
    </section>
  );
};

export default DJsShowcase;
