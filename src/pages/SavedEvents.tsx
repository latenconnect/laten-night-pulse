import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import BottomNav from '@/components/BottomNav';
import { mockEvents } from '@/data/mockEvents';

const SavedEvents: React.FC = () => {
  const navigate = useNavigate();
  
  // Mock saved events (first 3 events)
  const savedEvents = mockEvents.slice(0, 3);
  const upcomingEvents = mockEvents.slice(3, 5);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-4">
        <h1 className="font-display font-bold text-2xl">Saved</h1>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* Upcoming Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-secondary" />
            <h2 className="font-display font-bold text-lg">Your Upcoming Events</h2>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
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
              <Button variant="outline" onClick={() => navigate('/explore')}>
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
              {savedEvents.length}
            </span>
          </div>
          
          {savedEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {savedEvents.map((event, index) => (
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
              <Button variant="outline" onClick={() => navigate('/explore')}>
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
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {mockEvents.slice(4).map((event, index) => (
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

      <BottomNav />
    </div>
  );
};

export default SavedEvents;
