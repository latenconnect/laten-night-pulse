import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Music, Calendar, ExternalLink, Instagram, MessageCircle, Camera, Shield, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MobileLayout from '@/components/layouts/MobileLayout';
import { useLanguage } from '@/context/LanguageContext';
import { useProfessionalProfile, useProfessionalReviews } from '@/hooks/useProfessionals';
import { BookProfessionalSheet } from '@/components/professionals/BookProfessionalSheet';
import { format } from 'date-fns';

const professionIcons: Record<string, React.ElementType> = {
  dj: Music,
  bartender: Wine,
  photographer: Camera,
  security: Shield,
};

const professionColors: Record<string, string> = {
  dj: 'from-violet-500/20 to-purple-600/20 border-violet-500/30',
  bartender: 'from-amber-500/20 to-orange-600/20 border-amber-500/30',
  photographer: 'from-rose-500/20 to-pink-600/20 border-rose-500/30',
  security: 'from-emerald-500/20 to-green-600/20 border-emerald-500/30',
};

const ProfessionalProfilePage = () => {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { data: professional, isLoading } = useProfessionalProfile(professionalId);
  const { data: reviews } = useProfessionalReviews(professionalId);
  
  const [showBookingSheet, setShowBookingSheet] = useState(false);

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </MobileLayout>
    );
  }

  if (!professional) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Music className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-medium text-foreground mb-2">{t('professionals.notFound')}</h2>
          <Button onClick={() => navigate('/professionals')}>{t('professionals.backToMarketplace')}</Button>
        </div>
      </MobileLayout>
    );
  }

  const Icon = professionIcons[professional.profession_type] || Music;
  const colorClass = professionColors[professional.profession_type] || professionColors.dj;

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return t('professionals.priceNegotiable');
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} HUF`;
    if (min) return `${min.toLocaleString()}+ HUF`;
    return `Up to ${max?.toLocaleString()} HUF`;
  };

  const skills = professional.profession_type === 'dj' ? professional.genres : professional.skills;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`bg-gradient-to-br ${colorClass}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/30">
                    <AvatarImage src={professional.profile_photo || undefined} alt={professional.display_name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {professional.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-foreground">{professional.display_name}</h1>
                      {professional.is_verified && (
                        <Badge className="bg-primary/20 text-primary border-0 text-xs">
                          ✓ {t('professionals.verified')}
                        </Badge>
                      )}
                    </div>
                    
                    <Badge variant="outline" className="mb-2 capitalize">
                      <Icon className="h-3 w-3 mr-1" />
                      {professional.profession_type}
                    </Badge>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{professional.city}</span>
                    </div>

                    {professional.rating && professional.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-amber-400 fill-current" />
                        <span className="font-semibold text-foreground">{professional.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({professional.review_count} {t('professionals.reviews')})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 p-3 rounded-lg bg-background/50 text-center">
                  <span className="text-sm text-muted-foreground">{t('professionals.startingFrom')}</span>
                  <p className="text-xl font-bold text-primary">{formatPrice(professional.price_min, professional.price_max)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills/Genres */}
          {skills && skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {professional.profession_type === 'dj' ? t('professionals.genres') : t('professionals.skills')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary border-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Bio */}
          {professional.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('professionals.about')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{professional.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Social Links */}
          {(professional.soundcloud_url || professional.mixcloud_url || professional.instagram_url || professional.website_url) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('professionals.links')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {professional.soundcloud_url && (
                    <a 
                      href={professional.soundcloud_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span>SoundCloud</span>
                    </a>
                  )}
                  {professional.mixcloud_url && (
                    <a 
                      href={professional.mixcloud_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span>Mixcloud</span>
                    </a>
                  )}
                  {professional.instagram_url && (
                    <a 
                      href={professional.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Instagram className="h-4 w-4 text-primary" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {professional.website_url && (
                    <a 
                      href={professional.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span>Website</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    {t('professionals.reviews')} ({reviews.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="pb-4 border-b border-border/50 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-muted'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at || ''), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {review.review && (
                        <p className="text-sm text-muted-foreground">{review.review}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Fixed Book Button */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button 
            className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80" 
            size="lg"
            onClick={() => setShowBookingSheet(true)}
          >
            <Calendar className="h-4 w-4" />
            {t('professionals.bookNow')}
          </Button>
        </div>

        {/* Booking Sheet */}
        <BookProfessionalSheet
          professional={professional}
          isOpen={showBookingSheet}
          onClose={() => setShowBookingSheet(false)}
        />
      </div>
    </MobileLayout>
  );
};

export default ProfessionalProfilePage;
