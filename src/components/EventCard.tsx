import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Ticket, Star } from 'lucide-react';
import { Event, EVENT_TYPES } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
  onClick?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, variant = 'default', onClick }) => {
  const eventType = EVENT_TYPES.find(t => t.id === event.type);
  const attendancePercentage = Math.round((event.currentRSVP / event.expectedAttendance) * 100);

  if (variant === 'compact') {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="glass-card p-3 cursor-pointer event-card-glow flex gap-3"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs">{eventType?.icon}</span>
            <span className="text-xs text-muted-foreground">{event.location.city}</span>
          </div>
          <h4 className="font-display font-semibold text-sm truncate">{event.name}</h4>
          <p className="text-xs text-muted-foreground">{format(event.startTime, 'EEE, MMM d • h:mm a')}</p>
        </div>
        <div className="flex flex-col items-end justify-center">
          <span className="text-primary font-semibold text-sm">
            {event.price ? `${event.price} Ft` : 'Free'}
          </span>
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-72 h-96 rounded-3xl overflow-hidden cursor-pointer flex-shrink-0 event-card-glow"
      >
        <img src={event.coverImage} alt={event.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {event.isFeatured && (
          <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-semibold">Featured</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{eventType?.icon}</span>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {eventType?.label}
            </span>
          </div>
          
          <h3 className="font-display font-bold text-xl mb-2 neon-text">{event.name}</h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{event.location.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{format(event.startTime, 'EEE, h:mm a')}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 border border-primary/50">
              <Users className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">{event.currentRSVP}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card overflow-hidden cursor-pointer event-card-glow"
    >
      <div className="relative h-40">
        <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-lg">{eventType?.icon}</span>
          <span className="text-xs bg-card/80 backdrop-blur-sm px-2 py-1 rounded-full">
            {eventType?.label}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold",
            event.price ? "bg-primary/90" : "bg-secondary text-secondary-foreground"
          )}>
            {event.price ? `${event.price} Ft` : 'Free Entry'}
          </span>
        </div>

        {event.isVerified && (
          <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-3 h-3 text-secondary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display font-bold text-lg mb-1">{event.name}</h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{event.location.name}, {event.location.city}</span>
        </div>

        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{format(event.startTime, 'EEE, MMM d')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Ticket className="w-4 h-4 text-muted-foreground" />
            <span>{event.ageLimit}+</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {event.hostAvatar && (
              <img src={event.hostAvatar} alt={event.hostName} className="w-6 h-6 rounded-full" />
            )}
            <span className="text-sm text-muted-foreground">{event.hostName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{event.currentRSVP}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
