import { motion } from 'framer-motion';
import { Star, Wine, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/LanguageContext';
import { BartenderProfile } from '@/hooks/useBartenders';
import { useNavigate } from 'react-router-dom';

interface BartenderCardProps {
  bartender: BartenderProfile;
}

export const BartenderCard = ({ bartender }: BartenderCardProps) => {
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
      <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-amber-500/50 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Profile Photo */}
            <Avatar className="h-20 w-20 ring-2 ring-amber-500/20">
              <AvatarImage src={bartender.profile_photo || undefined} alt={bartender.bartender_name} />
              <AvatarFallback className="bg-amber-500/20 text-amber-500 text-xl font-bold">
                {bartender.bartender_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{bartender.bartender_name}</h3>
                {bartender.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{bartender.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({bartender.review_count})</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span>{bartender.city}</span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mb-3">
                {bartender.skills.slice(0, 3).map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="secondary" 
                    className="text-xs bg-amber-500/10 text-amber-500 border-0"
                  >
                    <Wine className="h-2.5 w-2.5 mr-1" />
                    {skill}
                  </Badge>
                ))}
                {bartender.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{bartender.skills.length - 3}
                  </Badge>
                )}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-500">
                  {formatPrice(bartender.price_min, bartender.price_max)}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/bartender/${bartender.id}`)}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {t('bookBartender')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
