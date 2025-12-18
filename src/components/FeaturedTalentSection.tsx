import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Star, Music, Wine, MapPin, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedTalent } from '@/hooks/useFeaturedTalent';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

const FeaturedTalentSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { featuredDJs, featuredBartenders, isLoading, hasFeatured } = useFeaturedTalent(3);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-[200px] h-[120px] flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!hasFeatured) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          <h2 className="font-display font-bold text-xl">{t('explore.featuredTalent') || 'Featured Talent'}</h2>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
            Premium
          </Badge>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
        {/* Featured DJs */}
        {featuredDJs.map((dj, index) => (
          <motion.button
            key={`dj-${dj.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/dj/${dj.id}`)}
            className={cn(
              "relative flex-shrink-0 w-[200px] rounded-xl overflow-hidden",
              "bg-gradient-to-br from-primary/20 via-card to-card",
              "border border-primary/30 hover:border-primary/50 transition-all",
              "text-left p-4"
            )}
          >
            {/* Premium glow */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            {/* Premium badge */}
            <div className="absolute top-2 right-2">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            </div>

            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/50">
                <AvatarImage src={dj.profile_photo || undefined} alt={dj.dj_name} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  <Music className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{dj.dj_name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{dj.city}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{dj.rating?.toFixed(1) || '5.0'}</span>
                <span className="text-xs text-muted-foreground">({dj.review_count || 0})</span>
              </div>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                DJ
              </Badge>
            </div>

            {dj.genres && dj.genres.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {dj.genres.slice(0, 2).map(genre => (
                  <span key={genre} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </motion.button>
        ))}

        {/* Featured Bartenders */}
        {featuredBartenders.map((bartender, index) => (
          <motion.button
            key={`bartender-${bartender.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (featuredDJs.length + index) * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/bartender/${bartender.id}`)}
            className={cn(
              "relative flex-shrink-0 w-[200px] rounded-xl overflow-hidden",
              "bg-gradient-to-br from-secondary/20 via-card to-card",
              "border border-secondary/30 hover:border-secondary/50 transition-all",
              "text-left p-4"
            )}
          >
            {/* Premium glow */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            {/* Premium badge */}
            <div className="absolute top-2 right-2">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            </div>

            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border-2 border-secondary/50">
                <AvatarImage src={bartender.profile_photo || undefined} alt={bartender.bartender_name} />
                <AvatarFallback className="bg-secondary/20 text-secondary">
                  <Wine className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{bartender.bartender_name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{bartender.city}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{bartender.rating?.toFixed(1) || '5.0'}</span>
                <span className="text-xs text-muted-foreground">({bartender.review_count || 0})</span>
              </div>
              <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
                Bartender
              </Badge>
            </div>

            {bartender.skills && bartender.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {bartender.skills.slice(0, 2).map(skill => (
                  <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </motion.button>
        ))}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: (featuredDJs.length + featuredBartenders.length) * 0.1 }}
          className="flex-shrink-0 flex items-center"
        >
          <Button
            variant="ghost"
            className="h-full min-h-[120px] rounded-xl border border-dashed border-border hover:border-primary/50 flex flex-col gap-2 px-6"
            onClick={() => navigate('/djs')}
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('common.viewMore') || 'View More'}</span>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedTalentSection;
