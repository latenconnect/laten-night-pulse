import React, { useState, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, TrendingUp, Calendar, Sparkles, Building2, ChevronDown, Star, Users, Briefcase } from 'lucide-react';
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
import ProfessionalsShowcase from '@/components/ProfessionalsShowcase';
import FeaturedTalentSection from '@/components/FeaturedTalentSection';
import SubscriptionPlansSection from '@/components/SubscriptionPlansSection';
import CommunityEventsSection from '@/components/CommunityEventsSection';
import StoriesBar from '@/components/stories/StoriesBar';
import FeaturedBadge from '@/components/FeaturedBadge';
import MobileLayout from '@/components/layouts/MobileLayout';
import TonightsPicksSection from '@/components/TonightsPicksSection';
import PartyGroupsSection from '@/components/PartyGroupsSection';
import { LiveFeedHeader, SocialSignal, StreakDisplay, WeeklyRecapCard, StreakWidget, LiveFriendsBar } from '@/components/engagement';
import { SocialActivityFeed, FriendsSuggestions } from '@/components/social';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NativeAdCard } from '@/components/ads';
import { XPLevelCard, PartyQuestsCard, AchievementsBadges } from '@/components/gamification';
import { SafetyBuddyWidget } from '@/components/safety';
import { useEvents, transformDbEvent } from '@/hooks/useEvents';
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
  const { t, isReady: translationsReady } = useLanguage();
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

  // Use real events hook
  const { events: allDbEvents, loading: eventsLoading } = useEvents(selectedCity);

  // Transform and filter events based on active filter and search
  const filteredEvents = useMemo(() => {
    return allDbEvents
      .filter(event => {
        const matchesFilter = !activeFilter || event.type === activeFilter;
        const matchesSearch = !searchQuery || 
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .map(transformDbEvent);
  }, [allDbEvents, activeFilter, searchQuery]);

  // Get featured events from the feed
  const featuredEvents = dbFeaturedEvents?.map(transformDbEvent) || [];

  // Combine featured clubs with regular clubs, prioritizing featured
  const displayClubs = useMemo(() => {
    const featured = featuredClubs.map(c => ({ ...c, isFeatured: true }));
    const regular = clubs.filter(c => !featuredClubs.find(fc => fc.id === c.id));
    return [...featured, ...regular].slice(0, 10);
  }, [clubs, featuredClubs]);

  const ExploreHeader = (
    <div className="px-4 py-5">
      {/* Location & Actions Row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {!translationsReady ? (
            <Skeleton className="h-3 w-20 mb-1.5" />
          ) : (
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">{t('common.currentLocation')}</p>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity mt-0.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="font-display font-bold text-xl">{selectedCity}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-52 max-h-72 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border z-50"
            >
              {HUNGARIAN_CITIES.map((city) => (
                <DropdownMenuItem
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={cn(
                    "cursor-pointer py-3",
                    city === selectedCity && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <MapPin className={cn("w-4 h-4 mr-2", city === selectedCity ? "text-primary" : "text-muted-foreground")} />
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
            className="touch-target w-11 h-11 rounded-xl"
            onClick={() => setActiveFilter(null)}
          >
            <Filter className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </div>
      
      {/* Search - Enhanced */}
      <motion.button
        onClick={() => searchContext?.openSearch()}
        whileTap={{ scale: 0.98 }}
        className="w-full relative flex items-center group"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
          <Search className="w-4 h-4 text-primary" />
        </div>
        <div className="w-full pl-[60px] pr-4 py-4 bg-card/80 border border-border/60 rounded-2xl text-left text-muted-foreground touch-target hover:border-primary/40 transition-all">
          {!translationsReady ? <Skeleton className="h-4 w-28 inline-block" /> : `${t('common.search')} events, venues...`}
        </div>
        <kbd className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1 rounded-lg bg-muted/80 px-2 py-1 text-[10px] font-medium text-muted-foreground border border-border/50">
          ⌘K
        </kbd>
      </motion.button>
      
      {/* Category Pills - Improved spacing and styling */}
      <div className="mt-4 -mx-4 px-4 flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth-mobile pb-1">
        <motion.button
          onClick={() => setActiveFilter(null)}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all',
            !activeFilter 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
              : 'bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          {!translationsReady ? <Skeleton className="h-4 w-16 inline-block" /> : t('explore.allEvents')}
        </motion.button>
        {EVENT_TYPES.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => setActiveFilter(type.id)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2',
              activeFilter === type.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
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
        trendingCount={trendingEvents.length}
        newEventsToday={dbFeaturedEvents.length}
      />
      
      {/* Stories Bar */}
      <StoriesBar />

      {/* Friend Presence & Gamification - Addictive engagement elements */}
      {user && (
        <div className="px-4 pt-4 space-y-3">
          <LiveFriendsBar />
          <XPLevelCard variant="compact" />
          <div className="grid grid-cols-2 gap-3">
            <StreakWidget variant="mini" />
            <PartyQuestsCard variant="compact" />
          </div>
        </div>
      )}

      <main className="px-4 py-6 space-y-8">
        {/* Tonight's Picks - Curated events for tonight */}
        <TonightsPicksSection />

        {/* Gamification & Safety */}
        {user && (
          <div className="grid gap-4 sm:grid-cols-2">
            <AchievementsBadges variant="compact" />
            <SafetyBuddyWidget variant="compact" />
          </div>
        )}
        {user && <WeeklyRecapCard />}

        {/* Party Groups - Plan events with friends */}
        {user && <PartyGroupsSection />}

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

        {/* Professionals Showcase */}
        <ProfessionalsShowcase limit={6} />

        {/* Friend Activity Feed */}
        {user && <SocialActivityFeed limit={3} />}

        {/* Featured Section - Enhanced Visual */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">
                {!translationsReady ? <Skeleton className="h-5 w-32 inline-block" /> : `${t('home.featured')} ${t('common.tonight')}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Curated picks for you</p>
            </div>
            <div className="ml-auto">
              <FeaturedBadge variant="sponsored" size="sm" />
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 scroll-smooth-mobile">
            {featuredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
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

        {/* Trending Section - Enhanced */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-secondary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">
                {!translationsReady ? <Skeleton className="h-5 w-36 inline-block" /> : `${t('home.trending')} ${selectedCity}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Hot events right now</p>
            </div>
          </div>
          <div className="grid gap-3">
            {filteredEvents.slice(0, 3).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 300 }}
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
            <h2 className="font-display font-bold text-xl">
              {!translationsReady ? <Skeleton className="h-5 w-32 inline-block" /> : t('explore.popularVenues')}
            </h2>
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
                <React.Fragment key={club.id}>
                  <motion.div
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
                  {/* Show ad after every 4th venue */}
                  {index > 0 && (index + 1) % 4 === 0 && (
                    <NativeAdCard variant="venue" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('common.noResults')}</p>
            </div>
          )}
        </section>

        {/* Community Events - People Created */}
        <CommunityEventsSection limit={6} />

        {/* Subscription Plans Section */}
        <SubscriptionPlansSection />

        {/* Find Professionals CTA */}
        <section>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/professionals')}
            className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/30 p-6 text-left group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">
                    {t('professionals.hireProfessionals') || 'Hire Professionals'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t('professionals.djBartenderPhotographer') || 'DJs, Bartenders, Photographers & more'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
            </div>
          </motion.button>
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