import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Music, Calendar, ExternalLink, Instagram, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import MobileLayout from '@/components/layouts/MobileLayout';
import { BookDJSheet } from '@/components/dj/BookDJSheet';
import { useLanguage } from '@/context/LanguageContext';
import { useDJProfile, useDJReviews, useDJAvailability } from '@/hooks/useDJs';
import { format } from 'date-fns';

const DJProfilePage = () => {
  const { djId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { data: dj, isLoading } = useDJProfile(djId);
  const { data: reviews } = useDJReviews(djId);
  const { data: availability } = useDJAvailability(djId);
  
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

  if (!dj) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Music className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-medium text-foreground mb-2">{t('djNotFound')}</h2>
          <Button onClick={() => navigate('/djs')}>{t('backToMarketplace')}</Button>
        </div>
      </MobileLayout>
    );
  }

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return t('priceNegotiable');
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} HUF`;
    if (min) return `${min.toLocaleString()}+ HUF`;
    return `Up to ${max?.toLocaleString()} HUF`;
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/30">
                    <AvatarImage src={dj.profile_photo || undefined} alt={dj.dj_name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {dj.dj_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground mb-1">{dj.dj_name}</h1>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{dj.city}</span>
                    </div>

                    {dj.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-amber-400 fill-current" />
                        <span className="font-semibold text-foreground">{dj.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({dj.review_count} {t('reviews')})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 p-3 rounded-lg bg-background/50 text-center">
                  <span className="text-sm text-muted-foreground">{t('startingFrom')}</span>
                  <p className="text-xl font-bold text-primary">{formatPrice(dj.price_min, dj.price_max)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Genres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  {t('musicGenres')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dj.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="bg-primary/10 text-primary border-0">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bio */}
          {dj.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('about')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{dj.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Social Links */}
          {(dj.soundcloud_url || dj.mixcloud_url || dj.instagram_url) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('listenToMixes')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dj.soundcloud_url && (
                    <a 
                      href={dj.soundcloud_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span>SoundCloud</span>
                    </a>
                  )}
                  {dj.mixcloud_url && (
                    <a 
                      href={dj.mixcloud_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span>Mixcloud</span>
                    </a>
                  )}
                  {dj.instagram_url && (
                    <a 
                      href={dj.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Instagram className="h-4 w-4 text-primary" />
                      <span>Instagram</span>
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
                    {t('reviews')} ({reviews.length})
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
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
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
            {t('bookDJ')}
          </Button>
        </div>

        {/* Booking Sheet */}
        <BookDJSheet 
          dj={dj} 
          isOpen={showBookingSheet} 
          onClose={() => setShowBookingSheet(false)} 
        />
      </div>
    </MobileLayout>
  );
};

export default DJProfilePage;
