import { motion } from 'framer-motion';
import { Star, Music, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/LanguageContext';
import { DJProfile } from '@/hooks/useDJs';
import { useNavigate } from 'react-router-dom';

interface DJCardProps {
  dj: DJProfile;
}

export const DJCard = ({ dj }: DJCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return t('priceNegotiable');
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} HUF`;
    if (min) return `${min.toLocaleString()}+ HUF`;
    return `Up to ${max?.toLocaleString()} HUF`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Profile Photo */}
            <Avatar className="h-20 w-20 ring-2 ring-primary/20">
              <AvatarImage src={dj.profile_photo || undefined} alt={dj.dj_name} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                {dj.dj_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{dj.dj_name}</h3>
                {dj.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{dj.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({dj.review_count})</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span>{dj.city}</span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1 mb-3">
                {dj.genres.slice(0, 3).map((genre) => (
                  <Badge 
                    key={genre} 
                    variant="secondary" 
                    className="text-xs bg-primary/10 text-primary border-0"
                  >
                    <Music className="h-2.5 w-2.5 mr-1" />
                    {genre}
                  </Badge>
                ))}
                {dj.genres.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{dj.genres.length - 3}
                  </Badge>
                )}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">
                  {formatPrice(dj.price_min, dj.price_max)}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/dj/${dj.id}`)}
                  className="bg-primary hover:bg-primary/90"
                >
                  {t('bookDJ')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
