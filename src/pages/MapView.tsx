import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, Flame, MapPin, ChevronUp, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import ClubCard from '@/components/ClubCard';
import BottomNav from '@/components/BottomNav';
import Map from '@/components/Map';
import { useApp } from '@/context/AppContext';
import { useClubs, Club } from '@/hooks/useClubs';
import { useEvents, transformDbEvent } from '@/hooks/useEvents';
import { cn } from '@/lib/utils';

// City coordinates for Hungary
const CITY_COORDS: Record<string, [number, number]> = {
  'Budapest': [19.0402, 47.4979],
  'Debrecen': [21.6273, 47.5316],
  'Szeged': [20.1414, 46.2530],
  'Pécs': [18.2232, 46.0727],
  'Győr': [17.6504, 47.6875],
  'Siófok': [18.0486, 46.9086],
  'Miskolc': [20.7784, 48.1035],
  'Eger': [20.3772, 47.9025],
};

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity } = useApp();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showEventList, setShowEventList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const { clubs } = useClubs();
  const { events: dbEvents } = useEvents();

  // Transform DB events to frontend format and filter by city
  const allEvents = dbEvents.map(transformDbEvent);
  const cityEvents = allEvents.filter(e => 
    e.location.city === selectedCity || selectedCity === 'Budapest'
  );

  const selectedEvent = selectedEventId ? cityEvents.find(e => e.id === selectedEventId) : null;

  const handleClubSelect = (club: Club) => {
    setSelectedEventId(null);
    setSelectedClub(club);
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedClub(null);
    setSelectedEventId(eventId);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden safe-top">
      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Mapbox Map */}
        <Map
          events={cityEvents}
          clubs={clubs}
          selectedEventId={selectedEventId}
          onEventSelect={handleEventSelect}
          onClubSelect={handleClubSelect}
          center={CITY_COORDS[selectedCity] || CITY_COORDS['Budapest']}
          showHeatmap={showHeatmap}
        />

        {/* Top Overlay */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 safe-top-padding bg-gradient-to-b from-background via-background/80 to-transparent">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location..."
                className="w-full input-neon pl-12 pr-4 bg-card/90 backdrop-blur-xl border border-border touch-target"
              />
            </div>
            <Button 
              variant="glass" 
              size="icon" 
              className="touch-target"
              onClick={() => setSearchQuery('')}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* City Badge & Heatmap Toggle */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{selectedCity}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/50">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{cityEvents.length} events • {clubs.length} venues</span>
              </div>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={cn(
                'gap-2 transition-all touch-target-sm',
                showHeatmap && 'bg-primary/20 border-primary/50'
              )}
            >
              <Layers className="w-4 h-4" />
              <span className="text-xs">Heatmap</span>
            </Button>
          </div>
        </div>

        {/* Event Preview Card */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-28 left-4 right-4 z-30"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedEventId(null)}
                  className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-card border border-border touch-target"
                >
                  <X className="w-4 h-4" />
                </Button>
                <EventCard
                  event={selectedEvent}
                  variant="compact"
                  onClick={() => navigate(`/event/${selectedEvent.id}`)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Club Preview Card */}
        <AnimatePresence>
          {selectedClub && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-28 left-4 right-4 z-30"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedClub(null)}
                  className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-card border border-border touch-target"
                >
                  <X className="w-4 h-4" />
                </Button>
                <ClubCard club={selectedClub} variant="compact" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pull Up List */}
        <motion.button
          onClick={() => setShowEventList(true)}
          whileTap={{ scale: 0.98 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-3 rounded-full bg-card/90 backdrop-blur-xl border border-border touch-target no-select"
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
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-card rounded-t-3xl border-t border-border overflow-hidden safe-bottom-nav"
            >
              <div className="sticky top-0 bg-card p-4 border-b border-border">
                <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl">Events in {selectedCity}</h3>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh] overscroll-contain">
                {cityEvents.length > 0 ? (
                  cityEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="compact"
                      onClick={() => {
                        setShowEventList(false);
                        navigate(`/event/${event.id}`);
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No events in {selectedCity} yet
                  </div>
                )}
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
