import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, Flame, MapPin, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import BottomNav from '@/components/BottomNav';
import { mockEvents } from '@/data/mockEvents';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showEventList, setShowEventList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cityEvents = mockEvents.filter(e => 
    e.location.city === selectedCity || selectedCity === 'Budapest'
  );

  const event = selectedEvent ? mockEvents.find(e => e.id === selectedEvent) : null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 bg-[#0a0a12]">
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Glowing City Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
          </div>

          {/* Event Markers */}
          {cityEvents.map((event, index) => {
            const randomX = 20 + (index * 15) % 60;
            const randomY = 25 + (index * 20) % 50;
            
            return (
              <motion.button
                key={event.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                onClick={() => setSelectedEvent(event.id)}
                className={cn(
                  'absolute z-10 group',
                  selectedEvent === event.id && 'z-20'
                )}
                style={{ left: `${randomX}%`, top: `${randomY}%` }}
              >
                <div className={cn(
                  'relative transition-all duration-300',
                  selectedEvent === event.id && 'scale-125'
                )}>
                  {/* Pulse Ring */}
                  <div className={cn(
                    'absolute inset-0 rounded-full animate-ping',
                    event.isFeatured ? 'bg-primary/40' : 'bg-secondary/40'
                  )} />
                  
                  {/* Marker */}
                  <div className={cn(
                    'relative w-4 h-4 rounded-full flex items-center justify-center',
                    event.isFeatured 
                      ? 'bg-primary shadow-[0_0_20px_hsla(270,91%,65%,0.6)]'
                      : 'bg-secondary shadow-[0_0_20px_hsla(180,100%,50%,0.6)]'
                  )}>
                    {event.isFeatured && (
                      <Flame className="w-2 h-2 text-primary-foreground" />
                    )}
                  </div>

                  {/* Label */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap',
                      'px-2 py-1 rounded-lg bg-card/90 backdrop-blur-sm text-xs font-medium',
                      'border border-border/50 shadow-lg',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      selectedEvent === event.id && 'opacity-100'
                    )}
                  >
                    {event.name}
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-background via-background/80 to-transparent">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                className="w-full input-neon pl-12 pr-4 bg-card/90 backdrop-blur-xl border border-border"
              />
            </div>
            <Button variant="glass" size="icon">
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* City Badge */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{selectedCity}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/50">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{cityEvents.length} events</span>
            </div>
          </div>
        </div>

        {/* Event Preview Card */}
        <AnimatePresence>
          {event && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-24 left-4 right-4 z-30"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedEvent(null)}
                  className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-card border border-border"
                >
                  <X className="w-4 h-4" />
                </Button>
                <EventCard
                  event={event}
                  variant="compact"
                  onClick={() => navigate(`/event/${event.id}`)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pull Up List */}
        <motion.button
          onClick={() => setShowEventList(true)}
          whileTap={{ scale: 0.98 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 backdrop-blur-xl border border-border"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm font-medium">View all events</span>
        </motion.button>
      </div>

      {/* Event List Sheet */}
      <AnimatePresence>
        {showEventList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEventList(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-card rounded-t-3xl border-t border-border overflow-hidden"
            >
              <div className="sticky top-0 bg-card p-4 border-b border-border">
                <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl">Events in {selectedCity}</h3>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
                {cityEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="compact"
                    onClick={() => {
                      setShowEventList(false);
                      navigate(`/event/${event.id}`);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default MapView;
