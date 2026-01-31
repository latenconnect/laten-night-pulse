import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents, transformDbEvent } from '@/hooks/useEvents';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

interface CommunityEventsSectionProps {
  limit?: number;
}

const CommunityEventsSection: React.FC<CommunityEventsSectionProps> = ({ limit = 6 }) => {
  const navigate = useNavigate();
  const { selectedCity } = useApp();
  const { t, isReady: translationsReady } = useLanguage();
  const { events, loading } = useEvents(selectedCity);

  // Filter for community-created events (house parties, university, outdoor, etc. - not club events)
  const communityEvents = events
    .filter(event => ['house_party', 'university', 'outdoor', 'foreigner', 'festival'].includes(event.type))
    .slice(0, limit)
    .map(transformDbEvent);

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-pink" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-[280px] flex-shrink-0">
              <Skeleton className="h-36 rounded-t-2xl" />
              <div className="p-3 space-y-2 bg-card rounded-b-2xl border border-t-0 border-border">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Always show the section - even with no events, display the Create Event CTA

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-pink" />
          <h2 className="font-display font-bold text-xl">
            {!translationsReady ? (
              <Skeleton className="h-5 w-40 inline-block" />
            ) : (
              'Community Events'
            )}
          </h2>
          <span className="text-xs bg-neon-pink/20 text-neon-pink px-2 py-0.5 rounded-full">
            By People
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/explore')}
        >
          See All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
        {communityEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-[280px] flex-shrink-0"
          >
            <EventCard
              event={event}
              variant="featured"
              onClick={() => navigate(`/event/${event.id}`)}
            />
          </motion.div>
        ))}
        
        {/* Create Event CTA */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: communityEvents.length * 0.05 }}
          onClick={() => navigate('/create')}
          className="w-[200px] flex-shrink-0 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-card/50 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl">+</span>
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Create Event</p>
            <p className="text-xs text-muted-foreground mt-1">Host your own party</p>
          </div>
        </motion.button>
      </div>
    </section>
  );
};

export default CommunityEventsSection;
