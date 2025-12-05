import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Calendar, Music, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAlgoliaSearch, SearchHit, SearchFilters } from '@/hooks/useAlgoliaSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useApp } from '@/context/AppContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'event' | 'club'>('all');
  const { results, loading, search, clearResults } = useAlgoliaSearch();
  const { selectedCity } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
      clearResults();
      setActiveFilter('all');
    }
  }, [isOpen, clearResults]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        const filters: SearchFilters = {};
        if (activeFilter !== 'all') filters.type = activeFilter;
        search(query, filters);
      } else {
        clearResults();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, activeFilter, search, clearResults]);

  const handleResultClick = (hit: SearchHit) => {
    if (hit.type === 'event') {
      navigate(`/event/${hit.id}`);
    } else {
      navigate(`/club/${hit.id}`);
    }
    onClose();
  };

  const getHighlightedText = (hit: SearchHit, field: string) => {
    const highlight = hit._highlightResult?.[field];
    if (highlight?.value) {
      return <span dangerouslySetInnerHTML={{ __html: highlight.value }} />;
    }
    return (hit as any)[field] || '';
  };

  const renderEventResult = (hit: SearchHit) => (
    <motion.button
      key={hit.objectID}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
      onClick={() => handleResultClick(hit)}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {hit.coverImage ? (
          <img src={hit.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <Calendar className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">
            {getHighlightedText(hit, 'name')}
          </span>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {hit.eventType}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{hit.locationName}</span>
        </div>
        {hit.startTime && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(hit.startTime), 'MMM d, yyyy • h:mm a')}
          </div>
        )}
      </div>
    </motion.button>
  );

  const renderClubResult = (hit: SearchHit) => (
    <motion.button
      key={hit.objectID}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
      onClick={() => handleResultClick(hit)}
    >
      <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {hit.photo ? (
          <img src={hit.photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <Building2 className="w-5 h-5 text-amber-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">
            {getHighlightedText(hit, 'name')}
          </span>
          {hit.venueType && (
            <Badge variant="outline" className="text-xs flex-shrink-0 border-amber-500/50 text-amber-500">
              {hit.venueType}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{hit.address || hit.city}</span>
        </div>
        {hit.rating && (
          <div className="text-xs text-muted-foreground mt-0.5">
            ⭐ {hit.rating.toFixed(1)}
          </div>
        )}
      </div>
    </motion.button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-50"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search events, clubs, venues..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 p-3 border-b border-border">
                {(['all', 'event', 'club'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className="capitalize"
                  >
                    {filter === 'all' ? 'All' : filter === 'event' ? 'Events' : 'Venues'}
                  </Button>
                ))}
              </div>

              {/* Results */}
              <ScrollArea className="max-h-[60vh]">
                <div className="p-2">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!loading && !query && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Start typing to search</p>
                    </div>
                  )}

                  {!loading && query && results?.hits.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No results found for "{query}"</p>
                    </div>
                  )}

                  {!loading && results?.hits && results.hits.length > 0 && (
                    <div className="space-y-1">
                      {results.hits.map((hit) =>
                        hit.type === 'event'
                          ? renderEventResult(hit)
                          : renderClubResult(hit)
                      )}
                    </div>
                  )}

                  {results && results.nbHits > 0 && (
                    <div className="text-center text-xs text-muted-foreground pt-3 pb-2">
                      {results.nbHits} result{results.nbHits !== 1 ? 's' : ''} found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
