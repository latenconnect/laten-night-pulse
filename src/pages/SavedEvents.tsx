import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Sparkles, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import MobileLayout from '@/components/layouts/MobileLayout';
import MobileHeader from '@/components/MobileHeader';
import { mockEvents } from '@/data/mockEvents';
import { useSavedEvents, useEventRsvp } from '@/hooks/useEvents';
import { useAuth } from '@/context/AuthContext';
import { dbEventsToEvents } from '@/utils/eventUtils';

const SavedEvents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedEvents, loading: savedLoading } = useSavedEvents();
  const { rsvpEventIds, loading: rsvpLoading } = useEventRsvp();

  // Convert DB events to frontend format
  const savedEventsList = dbEventsToEvents(savedEvents);
  
  // For mock data fallback - filter events user RSVPed to
  const upcomingMockEvents = mockEvents.filter(e => rsvpEventIds.includes(e.id));

  if (!user) {
    return (
      <MobileLayout header={<MobileHeader title="Saved" />}>
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl mb-2">Sign in to see your events</h2>
          <p className="text-muted-foreground text-center mb-6">
            Save events and track your RSVPs by signing in
          </p>
          <Button variant="neon" onClick={() => navigate('/auth')} className="touch-target">
            Sign In
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout header={<MobileHeader title="Saved" />}>
      <main className="px-4 py-6 space-y-8">
        {/* Upcoming Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-secondary" />
            <h2 className="font-display font-bold text-lg">Your Upcoming Events</h2>
          </div>
          
          {rsvpLoading ? (
            <div className="glass-card p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : upcomingMockEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingMockEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <EventCard
                    event={event}
                    variant="compact"
                    onClick={() => navigate(`/event/${event.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No upcoming events yet</p>
              <Button variant="outline" onClick={() => navigate('/explore')} className="touch-target">
                Explore Events
              </Button>
            </div>
          )}
        </section>

        {/* Saved Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-destructive" />
            <h2 className="font-display font-bold text-lg">Saved Events</h2>
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
              {savedEventsList.length}
            </span>
          </div>
          
          {savedLoading ? (
            <div className="glass-card p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : savedEventsList.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {savedEventsList.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <EventCard
                    event={event}
                    onClick={() => navigate(`/event/${event.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No saved events yet</p>
              <Button variant="outline" onClick={() => navigate('/explore')} className="touch-target">
                Explore Events
              </Button>
            </div>
          )}
        </section>

        {/* Recommendations */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-lg">You Might Like</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
            {mockEvents.slice(0, 4).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EventCard
                  event={event}
                  variant="featured"
                  onClick={() => navigate(`/event/${event.id}`)}
                />
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </MobileLayout>
  );
};

export default SavedEvents;
