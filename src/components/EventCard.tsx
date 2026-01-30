import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Ticket, Star } from 'lucide-react';
import { Event, EVENT_TYPES } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import FeaturedBadge from './FeaturedBadge';

interface EventCardProps {
  event: Event & { hostHasBoost?: boolean };
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
        whileTap={{ scale: 0.98 }}
        className="glass-card p-3.5 cursor-pointer flex gap-3.5 transition-all duration-200 hover:border-primary/30"
      >
        <div className="w-[68px] h-[68px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{eventType?.icon}</span>
            <span className="text-[11px] text-muted-foreground font-medium">{event.location.city}</span>
          </div>
          <h4 className="font-semibold text-[15px] truncate leading-snug">{event.name}</h4>
          <p className="text-[13px] text-muted-foreground mt-0.5">{format(event.startTime, 'EEE, MMM d • h:mm a')}</p>
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
        whileTap={{ scale: 0.98 }}
        className="relative w-72 h-[380px] rounded-3xl overflow-hidden cursor-pointer flex-shrink-0 group"
      >
        <img src={event.coverImage} alt={event.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Badge */}
        {(event.hostHasBoost || event.isFeatured) && (
          <div className="absolute top-4 left-4">
            <FeaturedBadge 
              variant={event.hostHasBoost ? 'boosted' : 'default'} 
              size="sm" 
            />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-lg">{eventType?.icon}</span>
            <span className="text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full backdrop-blur-md font-medium">
              {eventType?.label}
            </span>
          </div>
          
          <h3 className="font-bold text-xl mb-2.5 neon-text leading-tight">{event.name}</h3>
          
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-3.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.location.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px] font-medium">{format(event.startTime, 'EEE, h:mm a')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-[12px] font-semibold text-primary">{event.currentRSVP}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="glass-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/30 group"
    >
      <div className="relative h-40">
        <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {event.hostHasBoost ? (
            <FeaturedBadge variant="boosted" size="sm" />
          ) : (
            <>
              <span className="text-base">{eventType?.icon}</span>
              <span className="text-[11px] bg-card/80 backdrop-blur-md px-2.5 py-1 rounded-full font-medium">
                {eventType?.label}
              </span>
            </>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className={cn(
            "px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md",
            event.price ? "bg-primary/90 text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}>
            {event.price ? `${event.price} Ft` : 'Free Entry'}
          </span>
        </div>

        {event.isVerified && (
          <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-secondary flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-secondary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-[17px] mb-1.5 leading-snug">{event.name}</h3>
        
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{event.location.name}, {event.location.city}</span>
        </div>

        <div className="flex items-center gap-4 text-[13px] mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{format(event.startTime, 'EEE, MMM d')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-muted-foreground" />
            <span>{event.ageLimit}+</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {event.hostAvatar && (
              <img src={event.hostAvatar} alt={event.hostName} className="w-6 h-6 rounded-full ring-2 ring-background" />
            )}
            <span className="text-[13px] text-muted-foreground font-medium">{event.hostName}</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="w-16 h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">{event.currentRSVP}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
