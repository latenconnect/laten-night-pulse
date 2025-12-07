import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, X, UserPlus, BadgeCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEventCohosts, AvailableHost, Cohost } from '@/hooks/useEventCohosts';
import { cn } from '@/lib/utils';

interface CohostManagerProps {
  eventId?: string;
  onCohostsChange?: (cohostIds: string[]) => void;
  initialCohosts?: string[];
}

export const CohostManager = ({ eventId, onCohostsChange, initialCohosts = [] }: CohostManagerProps) => {
  const { cohosts, loading, searchHosts, addCohost, removeCohost } = useEventCohosts(eventId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AvailableHost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingCohosts, setPendingCohosts] = useState<AvailableHost[]>([]);

  // For new events (no eventId yet), track cohosts locally
  const isNewEvent = !eventId;

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchHosts(searchQuery);
        // Filter out already added cohosts
        const existingIds = isNewEvent 
          ? pendingCohosts.map(c => c.id)
          : cohosts.map(c => c.host_id);
        setSearchResults(results.filter(r => !existingIds.includes(r.id)));
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, cohosts, pendingCohosts, isNewEvent, searchHosts]);

  const handleAddCohost = async (host: AvailableHost) => {
    if (isNewEvent) {
      // For new events, just track locally
      setPendingCohosts(prev => [...prev, host]);
      onCohostsChange?.([...pendingCohosts.map(c => c.id), host.id]);
    } else {
      // For existing events, add to database
      await addCohost(host.id);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveCohost = async (cohostOrHost: Cohost | AvailableHost) => {
    if (isNewEvent) {
      const hostToRemove = cohostOrHost as AvailableHost;
      setPendingCohosts(prev => prev.filter(c => c.id !== hostToRemove.id));
      onCohostsChange?.(pendingCohosts.filter(c => c.id !== hostToRemove.id).map(c => c.id));
    } else {
      const cohost = cohostOrHost as Cohost;
      await removeCohost(cohost.id);
    }
  };

  const displayCohosts = isNewEvent ? pendingCohosts : cohosts;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Co-Hosts</h3>
        <span className="text-sm text-muted-foreground">({displayCohosts.length})</span>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search verified hosts by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background/50 border-border/50"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {searchResults.map((host) => (
              <button
                key={host.id}
                onClick={() => handleAddCohost(host)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{host.display_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="h-3 w-3 text-secondary" />
                    <span>Verified Host</span>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current cohosts */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : displayCohosts.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border/50 rounded-lg">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No co-hosts added yet</p>
          <p className="text-xs text-muted-foreground">Search for verified hosts above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayCohosts.map((cohost) => {
            const displayName = isNewEvent 
              ? (cohost as AvailableHost).display_name 
              : (cohost as Cohost).host_display_name || 'Co-host';
            const key = isNewEvent ? (cohost as AvailableHost).id : (cohost as Cohost).id;
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <BadgeCheck className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {isNewEvent ? 'Co-host' : (cohost as Cohost).role}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCohost(cohost)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
