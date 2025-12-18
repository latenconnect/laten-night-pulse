import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Star, MapPin, ChevronRight, Music, Wine, Camera, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedProfessionals } from '@/hooks/useFeaturedProfessionals';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import type { ProfessionType } from '@/hooks/useProfessionals';

// Showcase fallback images
import djImage1 from '@/assets/showcase/dj-1.jpg';
import djImage2 from '@/assets/showcase/dj-2.jpg';
import bartenderImage1 from '@/assets/showcase/bartender-1.jpg';
import bartenderImage2 from '@/assets/showcase/bartender-2.jpg';
import professionalImage1 from '@/assets/showcase/professional-1.jpg';
import professionalImage2 from '@/assets/showcase/professional-2.jpg';

const showcaseFallbacks: Record<ProfessionType, string[]> = {
  dj: [djImage1, djImage2],
  bartender: [bartenderImage1, bartenderImage2],
  photographer: [professionalImage1, professionalImage2],
  security: [professionalImage1, professionalImage2],
};

const getShowcaseFallback = (type: ProfessionType, index: number) => {
  const images = showcaseFallbacks[type] || showcaseFallbacks.dj;
  return images[index % images.length];
};

const professionConfig: Record<ProfessionType, { icon: React.ElementType; gradient: string; border: string }> = {
  dj: { icon: Music, gradient: 'from-primary/20 via-card to-card', border: 'border-primary/30 hover:border-primary/50' },
  bartender: { icon: Wine, gradient: 'from-secondary/20 via-card to-card', border: 'border-secondary/30 hover:border-secondary/50' },
  photographer: { icon: Camera, gradient: 'from-amber-500/20 via-card to-card', border: 'border-amber-500/30 hover:border-amber-500/50' },
  security: { icon: Shield, gradient: 'from-emerald-500/20 via-card to-card', border: 'border-emerald-500/30 hover:border-emerald-500/50' },
};

const professionLabels: Record<ProfessionType, string> = {
  dj: 'DJ',
  bartender: 'Bartender',
  photographer: 'Photographer',
  security: 'Security',
};

const FeaturedTalentSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: featuredProfessionals, isLoading } = useFeaturedProfessionals(6);

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

  if (!featuredProfessionals || featuredProfessionals.length === 0) {
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
        {featuredProfessionals.map((professional, index) => {
          const config = professionConfig[professional.profession_type] || professionConfig.dj;
          const Icon = config.icon;
          const skills = professional.profession_type === 'dj' ? professional.genres : professional.skills;

          return (
            <motion.button
              key={professional.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/professional/${professional.id}`)}
              className={cn(
                "relative flex-shrink-0 w-[200px] rounded-xl overflow-hidden",
                `bg-gradient-to-br ${config.gradient}`,
                `border ${config.border} transition-all`,
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
                  <AvatarImage src={professional.profile_photo || getShowcaseFallback(professional.profession_type, index)} alt={professional.display_name} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    <Icon className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{professional.display_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{professional.city}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium">{professional.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-xs text-muted-foreground">({professional.review_count || 0})</span>
                </div>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {professionLabels[professional.profession_type]}
                </Badge>
              </div>

              {skills && skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {skills.slice(0, 2).map(skill => (
                    <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: featuredProfessionals.length * 0.1 }}
          className="flex-shrink-0 flex items-center"
        >
          <Button
            variant="ghost"
            className="h-full min-h-[120px] rounded-xl border border-dashed border-border hover:border-primary/50 flex flex-col gap-2 px-6"
            onClick={() => navigate('/professionals')}
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
