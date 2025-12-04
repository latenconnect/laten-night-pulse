import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Heart, MapPin, Clock, Users, Ticket, 
  Shield, Info, Calendar, Navigation, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEventById } from '@/data/mockEvents';
import { EVENT_TYPES } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [isGoing, setIsGoing] = useState(false);

  const event = getEventById(id || '');
  
  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const eventType = EVENT_TYPES.find(t => t.id === event.type);
  const attendancePercentage = Math.round((event.currentRSVP / event.expectedAttendance) * 100);

  const handleRSVP = () => {
    setIsGoing(!isGoing);
    toast.success(isGoing ? 'Removed from your events' : 'Added to your events!', {
      description: isGoing ? undefined : `See you at ${event.name}!`,
    });
  };

  const handleShare = () => {
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
              onClick={() => setIsLiked(!isLiked)}
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

        {/* Report */}
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Flag className="w-4 h-4" />
          Report this event
        </button>
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
