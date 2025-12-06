import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp } from 'lucide-react';
import EventCard from '@/components/EventCard';
import { PersonalizedEvent } from '@/hooks/usePersonalization';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { Event } from '@/types';

interface ForYouSectionProps {
  events: PersonalizedEvent[];
  loading: boolean;
  hasPersonalization: boolean;
}

// Convert DB event to app Event format
const mapToEvent = (dbEvent: PersonalizedEvent): Event => ({
  id: dbEvent.id,
  name: dbEvent.name,
  description: dbEvent.description || '',
  type: dbEvent.type as Event['type'],
  coverImage: dbEvent.cover_image || '/placeholder.svg',
  location: {
    name: dbEvent.location_name,
    address: dbEvent.location_address || '',
    city: dbEvent.city,
    lat: dbEvent.location_lat || 0,
    lng: dbEvent.location_lng || 0,
  },
  startTime: new Date(dbEvent.start_time),
  endTime: dbEvent.end_time ? new Date(dbEvent.end_time) : new Date(dbEvent.start_time),
  price: dbEvent.price || 0,
  ageLimit: dbEvent.age_limit || 18,
  expectedAttendance: dbEvent.expected_attendance || 100,
  currentRSVP: dbEvent.actual_rsvp || 0,
  hostId: dbEvent.host_id,
  hostName: 'Host',
  isVerified: true,
  isFeatured: dbEvent.is_featured || false,
  createdAt: new Date(dbEvent.created_at),
});

const ForYouSection: React.FC<ForYouSectionProps> = ({ events, loading, hasPersonalization }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null; // Don't show for non-authenticated users
  }

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl">For You</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-72 flex-shrink-0">
              <Skeleton className="h-96 rounded-3xl" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    if (!hasPersonalization) {
      return (
        <section className="glass-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Personalized Feed</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep exploring events and we'll learn your preferences to show you the best matches!
          </p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">🎉 View events</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">💜 Save favorites</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">✓ RSVP</span>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        <h2 className="font-display font-bold text-xl">For You</h2>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">AI Picks</span>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <EventCard
              event={mapToEvent(event)}
              variant="featured"
              onClick={() => navigate(`/event/${event.id}`)}
            />
            {/* Relevance indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-card/80 backdrop-blur-sm">
              <TrendingUp className="w-3 h-3 text-secondary" />
              <span className="text-xs font-semibold">{event.relevanceScore}% match</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ForYouSection;