import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/EventCard';
import BottomNav from '@/components/BottomNav';
import { mockEvents, getFeaturedEvents } from '@/data/mockEvents';
import { useApp } from '@/context/AppContext';
import { EVENT_TYPES } from '@/types';
import { cn } from '@/lib/utils';

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity } = useApp();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const featuredEvents = getFeaturedEvents();
  const filteredEvents = mockEvents.filter(event => {
    const matchesFilter = !activeFilter || event.type === activeFilter;
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Location</p>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-display font-semibold">{selectedCity}</span>
              </div>
            </div>
            <Button variant="glass" size="icon">
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, clubs, hosts..."
              className="w-full input-neon pl-12 pr-4 bg-card border border-border"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <motion.button
            onClick={() => setActiveFilter(null)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              !activeFilter 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(270,91%,65%,0.4)]' 
                : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            All Events
          </motion.button>
          {EVENT_TYPES.map((type) => (
            <motion.button
              key={type.id}
              onClick={() => setActiveFilter(type.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
                activeFilter === type.id
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(270,91%,65%,0.4)]'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              <span>{type.icon}</span>
              {type.label}
            </motion.button>
          ))}
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* Featured Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-xl">Featured Tonight</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {featuredEvents.map((event, index) => (
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

        {/* Trending Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <h2 className="font-display font-bold text-xl">Trending in {selectedCity}</h2>
          </div>
          <div className="grid gap-4">
            {filteredEvents.slice(0, 3).map((event, index) => (
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
        </section>

        {/* This Week */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-neon-pink" />
            <h2 className="font-display font-bold text-xl">This Week</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard
                  event={event}
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

export default Explore;
