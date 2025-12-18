import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  DollarSign, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  X,
  Share2,
  Clock,
  Copy,
  Check,
  Building2,
  Music,
  Sparkles,
  Users,
  Tag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClubById } from '@/hooks/useClubById';
import { useNearbyClubs } from '@/hooks/useNearbyClubs';
import { useLanguage } from '@/context/LanguageContext';
import ClubCard from '@/components/ClubCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ClubDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { club, loading } = useClubById(id);
  const { clubs: nearbyClubs, loading: nearbyLoading } = useNearbyClubs(club?.city, id, 6);
  const { t } = useLanguage();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleGetDirections = () => {
    if (club?.google_maps_uri) {
      window.open(club.google_maps_uri, '_blank', 'noopener,noreferrer');
    } else if (club?.latitude && club?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: club?.name || 'Check out this venue',
      text: `Check out ${club?.name} on Laten!`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
      await navigator.clipboard.writeText(shareUrl);
        toast.success(t('events.linkCopied'));
      }
    } catch (err) {
      // User cancelled share or error occurred
      if ((err as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('events.linkCopied'));
      }
    }
  };

  const nextPhoto = () => {
    if (club?.photos && club.photos.length > 1) {
      setActivePhotoIndex((prev) => (prev + 1) % club.photos!.length);
    }
  };

  const prevPhoto = () => {
    if (club?.photos && club.photos.length > 1) {
      setActivePhotoIndex((prev) => (prev - 1 + club.photos!.length) % club.photos!.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative">
          <Skeleton className="w-full h-72" />
          <div className="absolute top-4 left-4">
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">{t('venues.venueNotFound')}</h1>
        <p className="text-muted-foreground mb-6">{t('venues.venueNotFoundDesc')}</p>
        <Button onClick={() => navigate('/explore')} variant="neon">
          {t('venues.backToExplore')}
        </Button>
      </div>
    );
  }

  const photos = club.photos || [];
  const hasMultiplePhotos = photos.length > 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Photo Gallery */}
      <div className="relative h-72 bg-muted">
        {photos.length > 0 ? (
          <>
            <motion.img
              key={activePhotoIndex}
              src={photos[activePhotoIndex]}
              alt={`${club.name} photo ${activePhotoIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowFullscreen(true)}
            />
            
            {/* Photo navigation */}
            {hasMultiplePhotos && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Photo indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePhotoIndex(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        index === activePhotoIndex
                          ? 'bg-white w-4'
                          : 'bg-white/50 hover:bg-white/70'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <MapPin className="w-16 h-16 text-muted-foreground" />
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* City badge & Share button */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <div className="px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm">
            <span className="text-sm font-medium text-primary-foreground">{club.city}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-display font-bold">{club.name}</h1>
            {club.venue_type && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/20 text-secondary capitalize">
                {club.venue_type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          
          {/* Rating & Price */}
          <div className="flex items-center gap-4">
            {club.rating && (
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{club.rating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">{t('venues.rating')}</span>
              </div>
            )}
            
            {club.price_level && (
              <div className="flex items-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <DollarSign
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < club.price_level! ? 'text-primary' : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {club.description && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <p className="text-foreground leading-relaxed">{club.description}</p>
          </motion.div>
        )}

        {/* Highlights */}
        {club.highlights && club.highlights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm">{t('venues.highlights') || 'Highlights'}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {club.highlights.map((highlight: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-amber-500/10 text-amber-300 border-amber-500/20">
                  {highlight}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Music Genres */}
        {club.music_genres && club.music_genres.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">{t('venues.musicGenres') || 'Music'}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {club.music_genres.map((genre: string, index: number) => (
                <Badge key={index} variant="outline" className="border-primary/30 text-primary">
                  {genre}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Services */}
        {club.services && club.services.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-secondary" />
              <h3 className="font-semibold text-sm">{t('venues.services') || 'Services & Amenities'}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {club.services.map((service: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-muted">
                  {service}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Crowd Info */}
        {club.crowd_info && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-sm">{t('venues.crowdInfo') || 'What to Expect'}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {club.crowd_info.age_range && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('venues.ageRange') || 'Age Range'}</p>
                  <p className="text-sm font-medium">{club.crowd_info.age_range}</p>
                </div>
              )}
              {club.crowd_info.dress_code && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('venues.dressCode') || 'Dress Code'}</p>
                  <p className="text-sm font-medium">{club.crowd_info.dress_code}</p>
                </div>
              )}
              {club.crowd_info.atmosphere && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('venues.atmosphere') || 'Atmosphere'}</p>
                  <p className="text-sm font-medium">{club.crowd_info.atmosphere}</p>
                </div>
              )}
              {club.crowd_info.best_for && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('venues.bestFor') || 'Best For'}</p>
                  <p className="text-sm font-medium">{club.crowd_info.best_for}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Address Card */}
        {club.address && (
          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('venues.address')}</p>
                <p className="font-medium">{club.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Opening Hours */}
        {club.opening_hours && club.opening_hours.weekday_text && club.opening_hours.weekday_text.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{t('venues.openingHours')}</p>
                  {club.opening_hours.open_now !== undefined && (
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      club.opening_hours.open_now 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    )}>
                      {club.opening_hours.open_now ? t('venues.openNow') : t('venues.closed')}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {club.opening_hours.weekday_text.map((day, index) => (
                    <p key={index} className="text-sm">
                      {day}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Status */}
        {club.business_status && (
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              club.business_status === 'OPERATIONAL' ? 'bg-green-500' : 'bg-amber-500'
            )} />
            <span className="text-sm text-muted-foreground">
              {club.business_status === 'OPERATIONAL' ? t('venues.currentlyOperating') : club.business_status.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>
        )}

        {/* Photo Thumbnails */}
        {photos.length > 1 && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">{t('venues.photos')} ({photos.length})</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActivePhotoIndex(index);
                    setShowFullscreen(true);
                  }}
                  className={cn(
                    'w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                    index === activePhotoIndex
                      ? 'border-primary'
                      : 'border-transparent hover:border-primary/50'
                  )}
                >
                  <img
                    src={photo}
                    alt={`${club.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Venues Section */}
        {nearbyClubs.length > 0 && (
          <section className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <h2 className="font-display font-bold text-lg">{t('venues.nearbyIn')} {club.city}</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              {nearbyClubs.map((nearbyClub, index) => (
                <motion.div
                  key={nearbyClub.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0"
                >
                  <ClubCard club={nearbyClub} variant="compact" />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleGetDirections}
          variant="neon"
          size="lg"
          className="w-full gap-2"
        >
          <ExternalLink className="w-5 h-5" />
          {t('venues.getDirections')}
        </Button>
      </div>

      {/* Fullscreen Photo Modal */}
      <AnimatePresence>
        {showFullscreen && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setShowFullscreen(false)}
          >
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={photos[activePhotoIndex]}
              alt={`${club.name} fullscreen`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {hasMultiplePhotos && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="text-white text-sm">
                    {activePhotoIndex + 1} / {photos.length}
                  </span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClubDetails;
