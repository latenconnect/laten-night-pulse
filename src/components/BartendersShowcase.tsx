import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wine, Star, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBartenders } from '@/hooks/useBartenders';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface BartendersShowcaseProps {
  limit?: number;
}

const BartendersShowcase: React.FC<BartendersShowcaseProps> = ({ limit = 5 }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { selectedCity } = useApp();
  const { bartenders, isLoading } = useBartenders({ city: selectedCity });

  const displayBartenders = bartenders.slice(0, limit);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-[180px] h-[140px] flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (displayBartenders.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wine className="w-5 h-5 text-amber-500" />
          <h2 className="font-display font-bold text-xl">
            {t('bartender.topBartenders') || 'Top Bartenders'}
          </h2>
          <Badge 
            variant="secondary" 
            className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            New
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1"
          onClick={() => navigate('/bartenders')}
        >
          {t('common.viewAll') || 'View All'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
        {displayBartenders.map((bartender, index) => (
          <motion.button
            key={bartender.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/bartender/${bartender.id}`)}
            className={cn(
              "relative flex-shrink-0 w-[180px] rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-amber-500/10 via-card to-card",
              "border border-amber-500/20 hover:border-amber-500/40",
              "shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10",
              "transition-all duration-300",
              "text-left p-4 group"
            )}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Avatar and rating */}
              <div className="flex items-start justify-between mb-3">
                <Avatar className="h-14 w-14 border-2 border-amber-500/30 shadow-lg">
                  <AvatarImage 
                    src={bartender.profile_photo || undefined} 
                    alt={bartender.bartender_name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-amber-500/20 text-amber-500">
                    <Wine className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                
                {bartender.rating && bartender.rating > 0 && (
                  <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold">{bartender.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="font-semibold text-foreground truncate mb-1">
                {bartender.bartender_name}
              </p>
              
              {/* Location */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{bartender.city}</span>
              </div>

              {/* Skills */}
              {bartender.skills && bartender.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {bartender.skills.slice(0, 2).map(skill => (
                    <span 
                      key={skill} 
                      className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500/80 rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {bartender.skills.length > 2 && (
                    <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                      +{bartender.skills.length - 2}
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
          transition={{ delay: displayBartenders.length * 0.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/bartenders')}
          className={cn(
            "flex-shrink-0 w-[120px] min-h-[140px] rounded-2xl",
            "border border-dashed border-amber-500/30 hover:border-amber-500/50",
            "flex flex-col items-center justify-center gap-2",
            "transition-all duration-300 group"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <ChevronRight className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-amber-500 transition-colors font-medium">
            {t('common.viewMore') || 'View More'}
          </span>
        </motion.button>
      </div>
    </section>
  );
};

export default BartendersShowcase;
