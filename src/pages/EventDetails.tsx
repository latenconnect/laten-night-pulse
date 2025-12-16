import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Heart, MapPin, Clock, Users, Ticket, 
  Shield, Info, Calendar, Navigation, Flag, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEventById } from '@/data/mockEvents';
import { useSavedEvents, useEventRsvp, useReportEvent } from '@/hooks/useEvents';
import { useAuth } from '@/context/AuthContext';
import { useHaptics } from '@/hooks/useHaptics';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useAgeVerification } from '@/hooks/useAgeVerification';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { EventQA } from '@/components/EventQA';
import { EventChat } from '@/components/EventChat';
import { EVENT_TYPES } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  
  const [isLiked, setIsLiked] = useState(false);
  const [isGoing, setIsGoing] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [liabilityAcknowledged, setLiabilityAcknowledged] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState<boolean | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);

  // For now, use mock data - will be replaced with real DB query
  const event = getEventById(id || '');

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
  
  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const eventType = EVENT_TYPES.find(t => t.id === event.type);
  const attendancePercentage = Math.round((event.currentRSVP / event.expectedAttendance) * 100);

  const handleLike = async () => {
    await lightTap();
    if (!user) {
      toast.error('Please sign in to save events');
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
      toast.error('Please sign in to RSVP');
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
      toast.error('Please select a reason');
      return;
    }
    
    if (!liabilityAcknowledged) {
      toast.error('Please acknowledge the liability disclaimer');
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
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-80">
        <img 
          src={event.coverImage} 
          alt={event.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="glass"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="glass"
              size="icon"
              onClick={handleShare}
              className="rounded-full"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="glass"
              size="icon"
              onClick={handleLike}
              className="rounded-full"
            >
              <Heart className={cn('w-5 h-5', isLiked && 'fill-destructive text-destructive')} />
            </Button>
          </div>
        </div>

        {/* Event Type Badge */}
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{eventType?.icon}</span>
            <span className="px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-sm font-medium">
              {eventType?.label}
            </span>
            {event.isVerified && (
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                <svg className="w-4 h-4 text-secondary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 relative z-10 pb-32">
        {/* Title & Host */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-3xl mb-2 neon-text">{event.name}</h1>
          <div className="flex items-center gap-3">
            {event.hostAvatar && (
              <img src={event.hostAvatar} alt={event.hostName} className="w-8 h-8 rounded-full" />
            )}
            <span className="text-muted-foreground">Hosted by <span className="text-foreground">{event.hostName}</span></span>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Date</span>
            </div>
            <p className="font-semibold">{format(event.startTime, 'EEEE, MMM d')}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Time</span>
            </div>
            <p className="font-semibold">{format(event.startTime, 'h:mm a')}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Ticket className="w-4 h-4" />
              <span className="text-xs">Entry</span>
            </div>
            <p className="font-semibold">{event.price ? `${event.price} Ft` : 'Free Entry'}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Age</span>
            </div>
            <p className="font-semibold">{event.ageLimit}+ Only</p>
          </div>
        </div>

        {/* Attendance */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold">{event.currentRSVP} going</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {event.expectedAttendance - event.currentRSVP} spots left
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${attendancePercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            />
          </div>
        </div>

        {/* Location */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-semibold">Location</span>
          </div>
          <p className="text-foreground mb-1">{event.location.name}</p>
          <p className="text-sm text-muted-foreground mb-4">{event.location.address}, {event.location.city}</p>
          <Button variant="outline" className="w-full gap-2">
            <Navigation className="w-4 h-4" />
            Get Directions
          </Button>
        </div>

        {/* Description */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-primary" />
            <span className="font-semibold">About</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        </div>

        {/* Dress Code */}
        {event.dressCode && (
          <div className="glass-card p-4 mb-6">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Dress Code</span>
            <p className="font-semibold mt-1">{event.dressCode}</p>
          </div>
        )}

        {/* Q&A Section */}
        <div className="mb-6">
          <EventQA eventId={event.id} hostUserId={event.hostId} />
        </div>

        {/* Event Chat */}
        <div className="mb-6">
          <EventChat eventId={event.id} hostUserId={event.hostId} />
        </div>

        {/* Age Verification Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Age Verification Required
              </DialogTitle>
              <DialogDescription>
                You must verify you're 18+ to attend events on Laten.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setVerifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="neon" 
                className="flex-1" 
                onClick={handleVerifyAge}
                disabled={verificationLoading}
              >
                {verificationLoading ? 'Loading...' : 'Verify Now'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Flag className="w-4 h-4" />
              Report this event
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Report Event
              </DialogTitle>
              <DialogDescription>
                Help us keep Laten safe. Select a reason for reporting this event.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-colors',
                    selectedReason === reason
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-muted hover:bg-muted/80 border border-transparent'
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
            
            {/* Liability Acknowledgment */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={liabilityAcknowledged}
                  onChange={(e) => setLiabilityAcknowledged(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I understand that Laten is a platform for event discovery only. I acknowledge that Laten 
                  is not responsible for the events listed, their hosts, or any incidents that may occur. 
                  I am submitting this report in good faith and understand that false reports may result 
                  in account suspension.
                </span>
              </label>
            </div>
            
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => {
                setReportDialogOpen(false);
                setSelectedReason('');
                setLiabilityAcknowledged(false);
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1" 
                onClick={handleReport}
                disabled={!selectedReason || !liabilityAcknowledged}
              >
                Submit Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-50">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Entry Price</p>
            <p className="font-display font-bold text-xl">
              {event.price ? `${event.price} Ft` : 'Free'}
            </p>
          </div>
          <Button
            variant={isGoing ? 'outline' : 'neon'}
            size="lg"
            onClick={handleRSVP}
            className="min-w-32"
          >
            {isGoing ? 'Going ✓' : "I'm Going"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
