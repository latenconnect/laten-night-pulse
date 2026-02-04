import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Heart, MapPin, Clock, Users, Ticket, 
  Shield, Info, Calendar, Navigation, Flag, AlertTriangle,
  Rocket, BarChart3, Sparkles, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedEvents, useEventRsvp, useReportEvent, useEvent, transformDbEvent } from '@/hooks/useEvents';
import { useAuth } from '@/context/AuthContext';
import { useHaptics } from '@/hooks/useHaptics';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useAgeVerification } from '@/hooks/useAgeVerification';
import { useLanguage } from '@/context/LanguageContext';
import { useHost } from '@/hooks/useHost';
import { useHostSubscription } from '@/hooks/useHostSubscription';
import { supabase } from '@/integrations/supabase/client';
import { EventQA } from '@/components/EventQA';
import { EventChat } from '@/components/EventChat';
import { EventAnalyticsDashboard } from '@/components/host/EventAnalyticsDashboard';
import { SocialShareTemplates } from '@/components/host/SocialShareTemplates';
import { EventLoreFeed } from '@/components/lore';
import { IcebreakerRooms } from '@/components/icebreaker';
import { SafetyBuddyWidget } from '@/components/safety';
import { EVENT_TYPES } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REPORT_REASONS = [
  'reportReasonFake',
  'reportReasonInappropriate',
  'reportReasonSafety',
  'reportReasonSpam',
  'reportReasonOther',
];

const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { isEventSaved, saveEvent, unsaveEvent } = useSavedEvents();
  const { hasRsvped, rsvpToEvent, cancelRsvp } = useEventRsvp();
  const { reportEvent } = useReportEvent();
  const { lightTap, mediumTap, successNotification, warningNotification } = useHaptics();
  const { trackInteraction } = usePersonalization();
  const { startVerification, loading: verificationLoading } = useAgeVerification();
  
  // Fetch event from database
  const { event: dbEvent, loading: eventLoading } = useEvent(id);
  const event = dbEvent ? transformDbEvent(dbEvent) : null;
  
  const [isLiked, setIsLiked] = useState(false);
  const [isGoing, setIsGoing] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [liabilityAcknowledged, setLiabilityAcknowledged] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState<boolean | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [hostToolsOpen, setHostToolsOpen] = useState(false);

  // Check if current user is the event host
  const { host } = useHost();
  const { isSubscribed: hasPartyBoost } = useHostSubscription(host?.id);
  const isEventHost = event && host && event.hostId === host.id;

  useEffect(() => {
    if (id) {
      setIsLiked(isEventSaved(id));
      setIsGoing(hasRsvped(id));
      
      // Track view interaction after 2 seconds (ensures intentional view)
      const timer = setTimeout(() => {
        trackInteraction('view', id);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [id, isEventSaved, hasRsvped, trackInteraction]);

  useEffect(() => {
    const checkAge = async () => {
      if (!user) {
        setIsAgeVerified(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('age_verified')
        .eq('id', user.id)
        .maybeSingle();
      setIsAgeVerified(data?.age_verified === true);
    };
    checkAge();
  }, [user]);

  const handleVerifyAge = async () => {
    const result = await startVerification();
    if (result?.url) {
      window.open(result.url, '_blank');
      toast.info('Complete verification in the new tab.');
      setVerifyDialogOpen(false);
    }
  };
  
  const { t } = useLanguage();

  // Loading state
  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('events.eventNotFound')}</p>
      </div>
    );
  }

  const eventType = EVENT_TYPES.find(t => t.id === event.type);
  const attendancePercentage = Math.round((event.currentRSVP / event.expectedAttendance) * 100);

  const handleLike = async () => {
    await lightTap();
    if (!user) {
      toast.error(t('events.signInToSave'));
      navigate('/auth');
      return;
    }
    
    if (isLiked) {
      await unsaveEvent(event.id);
      setIsLiked(false);
    } else {
      await saveEvent(event.id);
      setIsLiked(true);
      await successNotification();
      // Track save interaction
      trackInteraction('save', event.id);
    }
  };

  const handleRSVP = async () => {
    await mediumTap();
    if (!user) {
      toast.error(t('events.signInToRsvp'));
      navigate('/auth');
      return;
    }

    // Check age verification before allowing RSVP
    if (!isAgeVerified) {
      setVerifyDialogOpen(true);
      return;
    }
    
    if (isGoing) {
      await cancelRsvp(event.id);
      setIsGoing(false);
    } else {
      await rsvpToEvent(event.id);
      setIsGoing(true);
      await successNotification();
      // Track RSVP interaction (highest weight)
      trackInteraction('rsvp', event.id);
    }
  };

  const handleReport = async () => {
    if (!selectedReason) {
      toast.error(t('events.pleaseSelectReason'));
      return;
    }
    
    if (!liabilityAcknowledged) {
      toast.error(t('events.pleaseAcknowledgeLiability'));
      return;
    }
    
    const success = await reportEvent(event.id, selectedReason);
    if (success) {
      setReportDialogOpen(false);
      setSelectedReason('');
      setLiabilityAcknowledged(false);
    }
  };

  const handleShare = () => {
    // Track share interaction
    trackInteraction('share', event.id);
    
    if (navigator.share) {
      navigator.share({
        title: event.name,
        text: `Check out ${event.name} on Laten!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('events.linkCopied'));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Parallax Effect */}
      <div className="relative h-[420px] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img 
            src={event.coverImage} 
            alt={event.name} 
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        
        {/* Floating Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 p-4 safe-top-padding flex items-center justify-between z-10"
        >
          <Button
            variant="glass"
            size="icon"
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full backdrop-blur-xl bg-black/30 border-white/10 hover:bg-black/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="glass"
              size="icon"
              onClick={handleShare}
              className="w-11 h-11 rounded-full backdrop-blur-xl bg-black/30 border-white/10 hover:bg-black/50"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="glass"
                size="icon"
                onClick={handleLike}
                className="w-11 h-11 rounded-full backdrop-blur-xl bg-black/30 border-white/10 hover:bg-black/50"
              >
                <Heart className={cn('w-5 h-5 transition-all', isLiked && 'fill-red-500 text-red-500 scale-110')} />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Event Info Overlay at Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 p-5"
        >
          {/* Event Type & Verified Badges */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
              <span className="text-lg">{eventType?.icon}</span>
              <span className="text-sm font-medium">{eventType?.label}</span>
            </div>
            {event.isVerified && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/90 backdrop-blur-xl">
                <svg className="w-3.5 h-3.5 text-secondary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-secondary-foreground">Verified</span>
              </div>
            )}
          </div>
          
          {/* Event Title */}
          <h1 className="font-display font-bold text-3xl mb-2 leading-tight">{event.name}</h1>
          
          {/* Host Info */}
          <div className="flex items-center gap-3">
            {event.hostAvatar && (
              <img src={event.hostAvatar} alt={event.hostName} className="w-9 h-9 rounded-full ring-2 ring-primary/50" />
            )}
            <span className="text-white/80">{t('events.hostedBy')} <span className="text-white font-medium">{event.hostName}</span></span>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 pb-32 space-y-5">
        {/* Quick Info Pills - Horizontal scroll */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar pb-1"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border shrink-0">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{format(event.startTime, 'EEE, MMM d')}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border shrink-0">
            <Clock className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">{format(event.startTime, 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/20 border border-primary/40 shrink-0">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{event.price ? `${event.price} Ft` : t('events.freeEntry')}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border shrink-0">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{event.ageLimit}+</span>
          </div>
        </motion.div>

        {/* Attendance Progress - More Visual */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-2xl">{event.currentRSVP}</p>
                <p className="text-sm text-muted-foreground">{t('events.going')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">{event.expectedAttendance - event.currentRSVP}</p>
              <p className="text-sm text-muted-foreground">{t('events.spotsLeft')}</p>
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${attendancePercentage}%` }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                attendancePercentage >= 80 
                  ? "bg-gradient-to-r from-orange-500 to-red-500" 
                  : "bg-gradient-to-r from-primary via-purple-500 to-secondary"
              )}
            />
          </div>
          {attendancePercentage >= 80 && (
            <p className="text-xs text-orange-400 mt-2 flex items-center gap-1">
              <span className="animate-pulse">🔥</span> Filling up fast!
            </p>
          )}
        </motion.div>

        {/* Location Card - Enhanced */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card overflow-hidden"
        >
          {/* Mini Map Preview Placeholder */}
          <div className="h-32 bg-gradient-to-br from-primary/10 via-card to-secondary/10 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1">{event.location.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{event.location.address}, {event.location.city}</p>
            <Button variant="outline" className="w-full gap-2 h-12">
              <Navigation className="w-4 h-4" />
              {t('events.getDirections')}
            </Button>
          </div>
        </motion.div>

        {/* Description - Collapsible Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">{t('events.about')}</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        </motion.div>

        {/* Dress Code */}
        {event.dressCode && (
          <div className="glass-card p-4 mb-6">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('events.dressCode')}</span>
            <p className="font-semibold mt-1">{event.dressCode}</p>
          </div>
        )}

        {/* Event Lore Feed - Collaborative vibe clips */}
        <div className="mb-6">
          <EventLoreFeed eventId={event.id} variant="full" />
        </div>

        {/* Icebreaker Rooms - Find your squad */}
        <div className="mb-6">
          <IcebreakerRooms eventId={event.id} />
        </div>

        {/* Safety Buddy Widget */}
        <div className="mb-6">
          <SafetyBuddyWidget eventId={event.id} variant="full" />
        </div>

        {/* Q&A Section */}
        <div className="mb-6">
          <EventQA eventId={event.id} hostUserId={event.hostId} />
        </div>

        {/* Event Chat */}
        <div className="mb-6">
          <EventChat eventId={event.id} hostUserId={event.hostId} />
        </div>

        {/* Host Tools Section - Only visible to event host with Party Boost */}
        {isEventHost && hasPartyBoost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div 
              className="glass-card p-4 cursor-pointer"
              onClick={() => setHostToolsOpen(!hostToolsOpen)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      Host Tools
                      <Badge className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 text-xs border-0">
                        Party Boost
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">Analytics & share templates</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: hostToolsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-[-90deg]" />
                </motion.div>
              </div>
            </div>
            
            {hostToolsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <Tabs defaultValue="analytics" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="analytics" className="gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="share" className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Share
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="analytics">
                    <EventAnalyticsDashboard eventId={event.id} />
                  </TabsContent>
                  <TabsContent value="share">
                    <SocialShareTemplates 
                      event={{
                        id: event.id,
                        name: event.name,
                        startTime: event.startTime,
                        location: event.location,
                        price: event.price,
                        type: event.type,
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Age Verification Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t('events.ageVerificationRequired')}
              </DialogTitle>
              <DialogDescription>
                {t('events.ageVerificationRsvpDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setVerifyDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                variant="neon" 
                className="flex-1" 
                onClick={handleVerifyAge}
                disabled={verificationLoading}
              >
                {verificationLoading ? t('common.loading') : t('events.verifyNow')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Flag className="w-5 h-5" />
                {t('events.reportEvent')}
              </DialogTitle>
              <DialogDescription>
                {t('events.reportEventDesc')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 mt-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-colors',
                    selectedReason === reason
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  {t(`events.${reason}`)}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500">{t('events.liabilityWarning')}</p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={liabilityAcknowledged}
                    onChange={(e) => setLiabilityAcknowledged(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-muted-foreground">{t('events.iAcknowledge')}</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setReportDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleReport}
                disabled={!selectedReason || !liabilityAcknowledged}
              >
                {t('events.submitReport')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Button */}
        <div className="text-center">
          <button
            onClick={() => setReportDialogOpen(true)}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1"
          >
            <Flag className="w-4 h-4" />
            {t('events.reportEvent')}
          </button>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40 safe-bottom">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLike}
            className="flex-shrink-0 touch-target"
          >
            <Heart className={cn('w-5 h-5', isLiked && 'fill-destructive text-destructive')} />
          </Button>
          <Button
            variant={isGoing ? "outline" : "neon"}
            size="lg"
            onClick={handleRSVP}
            className="flex-1 gap-2 touch-target"
          >
            {isGoing ? (
              <>
                <Users className="w-5 h-5" />
                {t('events.youreGoing')}
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                {t('events.joinParty')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
