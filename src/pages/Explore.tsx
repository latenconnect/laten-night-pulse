import React, { useState, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, TrendingUp, Calendar, Sparkles, Building2, ChevronDown, Star, Users, Music, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EventCard from '@/components/EventCard';
import ClubCard from '@/components/ClubCard';
import ForYouSection from '@/components/ForYouSection';
import FeaturedTalentSection from '@/components/FeaturedTalentSection';
import StoriesBar from '@/components/stories/StoriesBar';
import FeaturedBadge from '@/components/FeaturedBadge';
import MobileLayout from '@/components/layouts/MobileLayout';
import { LiveFeedHeader, SocialSignal } from '@/components/engagement';
import { SocialActivityFeed, FriendsSuggestions } from '@/components/social';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { mockEvents, getFeaturedEvents } from '@/data/mockEvents';
import { useApp } from '@/context/AppContext';
import { SearchContext } from '@/context/SearchContext';
import { useLanguage } from '@/context/LanguageContext';
import { useClubs } from '@/hooks/useClubs';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { useFeaturedClubs } from '@/hooks/useFeaturedContent';
import { useAuth } from '@/context/AuthContext';
import { EVENT_TYPES } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const HUNGARIAN_CITIES = [
  'Budapest', 'Debrecen', 'Szeged', 'Pécs', 'Győr', 'Siófok', 'Miskolc', 'Eger',
  'Veszprém', 'Székesfehérvár', 'Sopron', 'Nyíregyháza', 'Kaposvár', 'Balatonfüred',
  'Tokaj', 'Kecskemét', 'Dunaújváros', 'Esztergom', 'Hévíz', 'Zamárdi'
];

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity, setSelectedCity } = useApp();
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchContext = useContext(SearchContext);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real data hooks
  const { clubs, loading: clubsLoading } = useClubs(10, false, true); // prioritize nightlife venues
  const { clubs: featuredClubs, loading: featuredClubsLoading } = useFeaturedClubs(selectedCity, 5);
  const { 
    forYouEvents, 
    trendingEvents, 
    featuredEvents: dbFeaturedEvents,
    loading: feedLoading,
    hasPersonalization 
  } = usePersonalizedFeed();

  // Mock data as fallback
  const mockFeaturedEvents = getFeaturedEvents();
  const filteredEvents = mockEvents.filter(event => {
    const matchesFilter = !activeFilter || event.type === activeFilter;
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Combine featured clubs with regular clubs, prioritizing featured
  const displayClubs = useMemo(() => {
    const featured = featuredClubs.map(c => ({ ...c, isFeatured: true }));
    const regular = clubs.filter(c => !featuredClubs.find(fc => fc.id === c.id));
    return [...featured, ...regular].slice(0, 10);
  }, [clubs, featuredClubs]);

  const ExploreHeader = (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('common.currentLocation')}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-display font-semibold">{selectedCity}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-48 max-h-64 overflow-y-auto bg-card border border-border z-50"
            >
              {HUNGARIAN_CITIES.map((city) => (
                <DropdownMenuItem
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={cn(
                    "cursor-pointer",
                    city === selectedCity && "bg-primary/10 text-primary"
                  )}
                >
                  {city}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button 
            variant="glass" 
            size="icon" 
            className="touch-target"
            onClick={() => setActiveFilter(null)}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {/* Search */}
      <button
        onClick={() => searchContext?.openSearch()}
        className="w-full relative flex items-center"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <div className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-left text-muted-foreground touch-target">
          {t('common.search')}...
        </div>
        <kbd className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      
      {/* Category Pills */}
      <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth-mobile pb-1">
        <motion.button
          onClick={() => setActiveFilter(null)}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
            !activeFilter 
              ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(270,91%,65%,0.4)]' 
              : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
          )}
        >
          {t('explore.allEvents')}
        </motion.button>
        {EVENT_TYPES.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => setActiveFilter(type.id)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
              activeFilter === type.id
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(270,91%,65%,0.4)]'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            <span className="text-base">{type.icon}</span>
            <span>{type.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <MobileLayout header={ExploreHeader}>
      {/* Live Activity Header */}
      <LiveFeedHeader 
        city={selectedCity}
        activeUsers={Math.floor(Math.random() * 50) + 20}
        trendingCount={trendingEvents.length}
        newEventsToday={dbFeaturedEvents.length}
      />
      
      {/* Stories Bar */}
      <StoriesBar />

      <main className="px-4 py-6 space-y-8">
        {/* Friend Suggestions (for logged in users) */}
        {user && <FriendsSuggestions city={selectedCity} limit={3} />}

        {/* For You Section (Personalized) */}
        <ForYouSection 
          events={forYouEvents} 
          loading={feedLoading} 
          hasPersonalization={hasPersonalization}
        />

        {/* Featured Talent Section (Premium DJs & Bartenders) */}
        <FeaturedTalentSection />

        {/* Friend Activity Feed */}
        {user && <SocialActivityFeed limit={3} />}

        {/* Featured Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="font-display font-bold text-xl">{t('home.featured')} {t('common.tonight')}</h2>
            <FeaturedBadge variant="sponsored" size="sm" />
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
            {mockFeaturedEvents.map((event, index) => (
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
            <h2 className="font-display font-bold text-xl">{t('home.trending')} {selectedCity}</h2>
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

        {/* Venues Section with Featured */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-bold text-xl">{t('explore.popularVenues')}</h2>
            {featuredClubs.length > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                {featuredClubs.length} Promoted
              </span>
            )}
          </div>
          {clubsLoading || featuredClubsLoading ? (
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
          ) : displayClubs.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
              {displayClubs.map((club, index) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <ClubCard club={club} />
                  {(club as any).isFeatured && (
                    <div className="absolute top-2 left-2">
                      <FeaturedBadge variant="premium" size="sm" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('common.noResults')}</p>
            </div>
          )}
        </section>

        {/* Hire Talent Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-xl">{t('explore.hireTalent') || 'Hire Talent'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/djs')}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/30 p-5 text-left group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <Music className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground">{t('dj.browseDJs')}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('dj.findPerfectDJ') || 'Find your perfect DJ'}</p>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/bartenders')}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/20 via-card to-card border border-secondary/30 p-5 text-left group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <Wine className="w-8 h-8 text-secondary mb-3" />
              <h3 className="font-semibold text-foreground">{t('bartender.browseBartenders')}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t('bartender.findPerfectBartender') || 'Find your perfect bartender'}</p>
            </motion.button>
          </div>
        </section>

        {/* This Week */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-neon-pink" />
            <h2 className="font-display font-bold text-xl">{t('common.thisWeek')}</h2>
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
    </MobileLayout>
  );
};

export default Explore;