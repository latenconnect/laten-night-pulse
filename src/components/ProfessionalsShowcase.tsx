import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Music, Wine, Camera, Shield, Star, MapPin, ChevronRight, Briefcase, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfessionals, ProfessionType } from '@/hooks/useProfessionals';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

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

interface ProfessionalsShowcaseProps {
  limit?: number;
}

const professionIcons: Record<ProfessionType, React.ElementType> = {
  dj: Music,
  bartender: Wine,
  photographer: Camera,
  security: Shield,
};

const professionColors: Record<ProfessionType, { bg: string; border: string; glow: string; text: string }> = {
  dj: {
    bg: 'from-violet-500/10 via-card to-card',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    glow: 'bg-violet-500/10 group-hover:bg-violet-500/20',
    text: 'text-violet-400',
  },
  bartender: {
    bg: 'from-amber-500/10 via-card to-card',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    glow: 'bg-amber-500/10 group-hover:bg-amber-500/20',
    text: 'text-amber-400',
  },
  photographer: {
    bg: 'from-rose-500/10 via-card to-card',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    glow: 'bg-rose-500/10 group-hover:bg-rose-500/20',
    text: 'text-rose-400',
  },
  security: {
    bg: 'from-emerald-500/10 via-card to-card',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    glow: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    text: 'text-emerald-400',
  },
};

const ProfessionalsShowcase: React.FC<ProfessionalsShowcaseProps> = ({ limit = 6 }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { selectedCity } = useApp();
  const { data: professionals, isLoading } = useProfessionals({ city: selectedCity });

  const displayProfessionals = (professionals || []).slice(0, limit);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-[180px] h-[160px] flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (displayProfessionals.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl">
            {t('professionals.findProfessionals') || 'Find Professionals'}
          </h2>
          <Badge 
            variant="secondary" 
            className="bg-primary/20 text-primary border-primary/30 text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {t('common.new') || 'New'}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1"
          onClick={() => navigate('/professionals')}
        >
          {t('common.viewAll') || 'View All'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
        {displayProfessionals.map((professional, index) => {
          const Icon = professionIcons[professional.profession_type] || Briefcase;
          const colors = professionColors[professional.profession_type] || professionColors.dj;
          const skills = professional.profession_type === 'dj' ? professional.genres : professional.skills;

          return (
            <motion.button
              key={professional.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/professional/${professional.id}`)}
              className={cn(
                "relative flex-shrink-0 w-[180px] rounded-2xl overflow-hidden",
                `bg-gradient-to-br ${colors.bg}`,
                `border ${colors.border}`,
                "shadow-lg transition-all duration-300",
                "text-left p-4 group"
              )}
            >
              {/* Ambient glow */}
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors",
                colors.glow
              )} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Avatar and rating */}
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    <Avatar className={cn("h-14 w-14 border-2 shadow-lg", colors.border)}>
                      <AvatarImage 
                        src={professional.profile_photo || getShowcaseFallback(professional.profession_type, index)} 
                        alt={professional.display_name}
                        className="object-cover"
                      />
                      <AvatarFallback className={cn("bg-background/50", colors.text)}>
                        <Icon className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    {/* Profession badge */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
                      "bg-background border shadow-sm",
                      colors.border
                    )}>
                      <Icon className={cn("w-3.5 h-3.5", colors.text)} />
                    </div>
                  </div>
                  
                  {professional.rating && professional.rating > 0 && (
                    <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold">{professional.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className="font-semibold text-foreground truncate mb-1">
                  {professional.display_name}
                </p>
                
                {/* Profession type badge */}
                <Badge variant="outline" className={cn("text-[10px] mb-2 capitalize", colors.text)}>
                  {professional.profession_type}
                </Badge>
                
                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{professional.city}</span>
                </div>

                {/* Skills/Genres */}
                {skills && skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 2).map(skill => (
                      <span 
                        key={skill} 
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          "bg-background/50 text-muted-foreground"
                        )}
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 2 && (
                      <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        +{skills.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}

        {/* View More Card */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: displayProfessionals.length * 0.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/professionals')}
          className={cn(
            "flex-shrink-0 w-[120px] min-h-[160px] rounded-2xl",
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

export default ProfessionalsShowcase;
