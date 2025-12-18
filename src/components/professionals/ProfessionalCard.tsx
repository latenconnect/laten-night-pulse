import { motion } from 'framer-motion';
import { Star, MapPin, Play, ChevronRight, Music, Wine, Camera, Shield, Verified } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/LanguageContext';
import { Professional, ProfessionType, PROFESSION_LABELS } from '@/hooks/useProfessionals';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProfessionalCardProps {
  professional: Professional;
  variant?: 'default' | 'compact';
}

const ProfessionIcon = ({ type, className }: { type: ProfessionType; className?: string }) => {
  const icons = {
    dj: Music,
    bartender: Wine,
    photographer: Camera,
    security: Shield,
  };
  const Icon = icons[type];
  return <Icon className={className} />;
};

const professionColors: Record<ProfessionType, string> = {
  dj: 'from-violet-500 to-purple-600',
  bartender: 'from-amber-500 to-orange-600',
  photographer: 'from-blue-500 to-cyan-600',
  security: 'from-slate-500 to-zinc-600',
};

const professionBadgeColors: Record<ProfessionType, string> = {
  dj: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  bartender: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  photographer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  security: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export const ProfessionalCard = ({ professional, variant = 'default' }: ProfessionalCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const formatPrice = (min: number | null, max: number | null, currency: string | null) => {
    const curr = currency || 'HUF';
    if (!min && !max) return t('bartender.priceNegotiable') || 'Negotiable';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${curr}`;
    if (min) return `${t('dj.from') || 'From'} ${min.toLocaleString()} ${curr}`;
    return `Up to ${max?.toLocaleString()} ${curr}`;
  };

  // Get display skills based on profession
  const displaySkills = professional.profession_type === 'dj' 
    ? professional.genres 
    : professional.skills;

  if (variant === 'compact') {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/professional/${professional.id}`)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={professional.profile_photo || undefined} alt={professional.display_name} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {professional.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
              `bg-gradient-to-br ${professionColors[professional.profession_type]}`
            )}>
              <ProfessionIcon type={professional.profession_type} className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{professional.display_name}</p>
            <p className="text-xs text-muted-foreground">{PROFESSION_LABELS[professional.profession_type]}</p>
          </div>
          {professional.rating > 0 && (
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs font-medium">{professional.rating.toFixed(1)}</span>
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
      onClick={() => navigate(`/professional/${professional.id}`)}
      className="w-full text-left group"
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-card via-card to-card/80",
        "border border-border/50 hover:border-primary/30",
        "shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10",
        "transition-all duration-300"
      )}>
        {/* Profession color accent */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500",
          `bg-gradient-to-br ${professionColors[professional.profession_type]}`
        )} />
        
        <div className="relative p-4">
          <div className="flex gap-4">
            {/* Profile Photo with profession indicator */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 rounded-xl ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                <AvatarImage 
                  src={professional.profile_photo || undefined} 
                  alt={professional.display_name}
                  className="object-cover"
                />
                <AvatarFallback className={cn(
                  "text-white text-2xl font-bold rounded-xl",
                  `bg-gradient-to-br ${professionColors[professional.profession_type]}`
                )}>
                  {professional.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Play button overlay for DJs */}
              {professional.profession_type === 'dj' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-xl transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                    <Play className="h-4 w-4 text-primary-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>
              )}

              {/* Profession badge */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg",
                `bg-gradient-to-br ${professionColors[professional.profession_type]}`
              )}>
                <ProfessionIcon type={professional.profession_type} className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 py-0.5">
              {/* Name, Badge & Rating Row */}
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg truncate">
                    {professional.display_name}
                  </h3>
                  {professional.is_verified && (
                    <Verified className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                {professional.rating > 0 && (
                  <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-amber-500">
                      {professional.rating.toFixed(1)}
                    </span>
                    {professional.review_count > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        ({professional.review_count})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Profession Badge & Location */}
              <div className="flex items-center gap-2 mb-3">
                <Badge 
                  variant="outline"
                  className={cn("text-xs border rounded-full px-2", professionBadgeColors[professional.profession_type])}
                >
                  <ProfessionIcon type={professional.profession_type} className="h-2.5 w-2.5 mr-1" />
                  {PROFESSION_LABELS[professional.profession_type]}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{professional.city}</span>
                </div>
              </div>

              {/* Skills/Genres */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {displaySkills.slice(0, 3).map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="secondary" 
                    className="text-xs bg-muted/50 text-muted-foreground border-0 rounded-full px-2.5 py-0.5"
                  >
                    {skill}
                  </Badge>
                ))}
                {displaySkills.length > 3 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs rounded-full px-2.5 py-0.5 text-muted-foreground"
                  >
                    +{displaySkills.length - 3}
                  </Badge>
                )}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('dj.from') || 'From'} </span>
                  <span className="font-semibold text-foreground">
                    {professional.price_min 
                      ? `${professional.price_min.toLocaleString()} ${professional.currency || 'HUF'}` 
                      : t('bartender.priceNegotiable') || 'Negotiable'}
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
