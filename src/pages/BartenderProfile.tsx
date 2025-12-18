import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Wine, Calendar, Instagram, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MobileLayout from '@/components/layouts/MobileLayout';
import { BookBartenderSheet } from '@/components/bartender/BookBartenderSheet';
import { useLanguage } from '@/context/LanguageContext';
import { useBartenderProfile, useBartenderReviews, useBartenderAvailability } from '@/hooks/useBartenders';
import { format } from 'date-fns';

const BartenderProfilePage = () => {
  const { bartenderId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { data: bartender, isLoading } = useBartenderProfile(bartenderId);
  const { data: reviews } = useBartenderReviews(bartenderId);
  const { data: availability } = useBartenderAvailability(bartenderId);
  
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

  if (!bartender) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Wine className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="font-medium text-foreground mb-2">{t('bartenderNotFound')}</h2>
          <Button onClick={() => navigate('/bartenders')}>{t('backToMarketplace')}</Button>
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
            <Card className="bg-gradient-to-br from-amber-500/10 to-background border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-24 w-24 ring-4 ring-amber-500/30">
                    <AvatarImage src={bartender.profile_photo || undefined} alt={bartender.bartender_name} />
                    <AvatarFallback className="bg-amber-500/20 text-amber-500 text-2xl font-bold">
                      {bartender.bartender_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground mb-1">{bartender.bartender_name}</h1>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{bartender.city}</span>
                    </div>

                    {bartender.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-amber-400 fill-current" />
                        <span className="font-semibold text-foreground">{bartender.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({bartender.review_count} {t('reviews')})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 p-3 rounded-lg bg-background/50 text-center">
                  <span className="text-sm text-muted-foreground">{t('startingFrom')}</span>
                  <p className="text-xl font-bold text-amber-500">{formatPrice(bartender.price_min, bartender.price_max)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wine className="h-4 w-4 text-amber-500" />
                  {t('skills')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {bartender.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-amber-500/10 text-amber-500 border-0">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bio */}
          {bartender.bio && (
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
                  <p className="text-muted-foreground">{bartender.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Social Links */}
          {bartender.instagram_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('socialLinks')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a 
                    href={bartender.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Instagram className="h-4 w-4 text-amber-500" />
                    <span>Instagram</span>
                  </a>
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
                    <MessageCircle className="h-4 w-4 text-amber-500" />
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
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black" 
            size="lg"
            onClick={() => setShowBookingSheet(true)}
          >
            <Calendar className="h-4 w-4" />
            {t('bookBartender')}
          </Button>
        </div>

        {/* Booking Sheet */}
        <BookBartenderSheet 
          bartender={bartender} 
          isOpen={showBookingSheet} 
          onClose={() => setShowBookingSheet(false)} 
        />
      </div>
    </MobileLayout>
  );
};

export default BartenderProfilePage;
