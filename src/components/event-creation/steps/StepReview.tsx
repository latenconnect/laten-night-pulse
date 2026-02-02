import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Ticket, Users, Music, 
  Shirt, Shield, Phone, Check, AlertCircle, Sparkles 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EVENT_TYPES } from '@/types';
import { format, parseISO } from 'date-fns';
import { EventFormData } from '../EventCreationWizard';

interface StepReviewProps {
  formData: EventFormData;
  isVerifiedHost: boolean;
  canCreateEvent: boolean;
}

interface ReviewRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
}

const ReviewRow: React.FC<ReviewRowProps> = ({ icon, label, value, highlight }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  </div>
);

export const StepReview: React.FC<StepReviewProps> = ({ 
  formData, 
  isVerifiedHost,
  canCreateEvent 
}) => {
  const eventType = EVENT_TYPES.find(t => t.id === formData.type);
  
  const formatDate = () => {
    if (!formData.date) return 'Not set';
    try {
      return format(parseISO(formData.date), 'EEEE, MMMM d, yyyy');
    } catch {
      return formData.date;
    }
  };

  const formatTime = () => {
    if (!formData.time) return 'Not set';
    const time = formData.time;
    const endTime = formData.end_time ? ` - ${formData.end_time}` : '';
    return time + endTime;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 mb-2"
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold">Looking good! 🎉</h2>
        <p className="text-muted-foreground">Review your event before publishing</p>
      </div>

      {/* Host Status */}
      {!isVerifiedHost && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-accent/10 border border-accent/30"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-accent">Pending Verification</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your event will be saved but won't be visible until you're verified as a host.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Event Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden"
      >
        {/* Cover placeholder */}
        <div className="h-32 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center">
          <span className="text-4xl">{eventType?.icon || '🎉'}</span>
        </div>

        <div className="p-4 space-y-1">
          <Badge variant="secondary" className="text-xs">
            {eventType?.label || formData.type}
          </Badge>
          <h3 className="text-xl font-bold">{formData.name || 'Untitled Event'}</h3>
          <p className="text-sm text-muted-foreground">{formData.location_name}, {formData.city}</p>
        </div>
      </motion.div>

      {/* Details List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/50 bg-card/30 divide-y divide-border/50"
      >
        <div className="px-4">
          <ReviewRow
            icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
            label="Date"
            value={formatDate()}
            highlight
          />
        </div>
        
        <div className="px-4">
          <ReviewRow
            icon={<Clock className="w-4 h-4 text-muted-foreground" />}
            label="Time"
            value={formatTime()}
          />
        </div>
        
        <div className="px-4">
          <ReviewRow
            icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
            label="Location"
            value={
              <div>
                <span>{formData.location_name}</span>
                {formData.location_address && (
                  <span className="text-muted-foreground block text-sm">
                    {formData.location_address}
                    {!formData.show_address && ' (hidden until RSVP)'}
                  </span>
                )}
              </div>
            }
          />
        </div>

        <div className="px-4">
          <ReviewRow
            icon={<Ticket className="w-4 h-4 text-muted-foreground" />}
            label="Entry"
            value={formData.price ? `${formData.price} Ft` : 'Free'}
          />
        </div>

        <div className="px-4">
          <ReviewRow
            icon={<Users className="w-4 h-4 text-muted-foreground" />}
            label="Age Limit"
            value={`${formData.age_limit}+`}
          />
        </div>

        {formData.music_genres.length > 0 && (
          <div className="px-4">
            <ReviewRow
              icon={<Music className="w-4 h-4 text-muted-foreground" />}
              label="Music"
              value={
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.music_genres.map(genre => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              }
            />
          </div>
        )}
      </motion.div>

      {/* Description Preview */}
      {formData.description && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/50 bg-card/30 p-4"
        >
          <p className="text-xs text-muted-foreground mb-2">Description</p>
          <p className="text-sm">{formData.description}</p>
        </motion.div>
      )}

      {/* Ready indicator */}
      {canCreateEvent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 py-4"
        >
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-secondary" />
          </div>
          <span className="text-sm text-muted-foreground">Ready to publish!</span>
        </motion.div>
      )}
    </div>
  );
};
