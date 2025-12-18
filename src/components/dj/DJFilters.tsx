import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Calendar, Music, Flame, DollarSign, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/context/LanguageContext';
import { MUSIC_GENRES, EVENT_TYPES, DJFilters as DJFiltersType } from '@/hooks/useDJs';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DJFiltersProps {
  filters: DJFiltersType;
  onFiltersChange: (filters: DJFiltersType) => void;
}

export const DJFilters = ({ filters, onFiltersChange }: DJFiltersProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<DJFiltersType>(filters);
  const [priceRange, setPriceRange] = useState([0, 200000]);

  const toggleGenre = (genre: string) => {
    const current = localFilters.genres || [];
    const updated = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre];
    setLocalFilters({ ...localFilters, genres: updated });
  };

  const toggleEventType = (type: string) => {
    const current = localFilters.eventTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setLocalFilters({ ...localFilters, eventTypes: updated });
  };

  const applyFilters = () => {
    onFiltersChange({
      ...localFilters,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
    });
    setIsOpen(false);
  };

  const clearFilters = () => {
    setLocalFilters({});
    setPriceRange([0, 200000]);
    onFiltersChange({});
    setIsOpen(false);
  };

  const activeFilterCount = [
    filters.genres?.length || 0,
    filters.eventTypes?.length || 0,
    filters.availableDate ? 1 : 0,
    filters.priceMax ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
      {/* Date picker pill */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "rounded-full gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all flex-shrink-0",
              localFilters.availableDate && "border-primary/50 bg-primary/10 text-primary"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            {localFilters.availableDate 
              ? format(new Date(localFilters.availableDate), 'MMM d')
              : t('dj.availability') || 'Date'
            }
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={localFilters.availableDate ? new Date(localFilters.availableDate) : undefined}
            onSelect={(date) => {
              const dateStr = date?.toISOString().split('T')[0];
              setLocalFilters({ ...localFilters, availableDate: dateStr });
              onFiltersChange({ ...filters, availableDate: dateStr });
            }}
            disabled={(date) => date < new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Quick genre filters */}
      {['House', 'Techno', 'Hip Hop'].map((genre) => (
        <Button
          key={genre}
          variant="outline"
          size="sm"
          onClick={() => {
            const current = filters.genres || [];
            const updated = current.includes(genre)
              ? current.filter(g => g !== genre)
              : [...current, genre];
            onFiltersChange({ ...filters, genres: updated });
          }}
          className={cn(
            "rounded-full border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all flex-shrink-0",
            filters.genres?.includes(genre) && "border-primary/50 bg-primary/10 text-primary"
          )}
        >
          {genre}
        </Button>
      ))}

      {/* Full Filter Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "rounded-full gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all flex-shrink-0",
              activeFilterCount > 0 && "border-primary/50 bg-primary/10"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            {t('common.filter') || 'Filters'}
            {activeFilterCount > 0 && (
              <span className="ml-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center justify-between">
              <span className="text-lg">{t('common.filter') || 'Filters'}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                {t('common.cancel') || 'Clear all'}
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-8 overflow-y-auto max-h-[calc(85vh-180px)] pr-2">
            {/* Music Genres */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2 text-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                {t('dj.genres') || 'Music Genres'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {MUSIC_GENRES.map((genre) => (
                  <motion.button
                    key={genre}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleGenre(genre)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      localFilters.genres?.includes(genre)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {genre}
                    {localFilters.genres?.includes(genre) && (
                      <X className="h-3 w-3 ml-1.5 inline" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Event Types */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2 text-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-primary" />
                </div>
                {t('explore.eventTypes') || 'Event Types'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((type) => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleEventType(type)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      localFilters.eventTypes?.includes(type)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {type}
                    {localFilters.eventTypes?.includes(type) && (
                      <X className="h-3 w-3 ml-1.5 inline" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2 text-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                {t('dj.priceRange') || 'Budget'}
              </h4>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={200000}
                  step={5000}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{priceRange[0].toLocaleString()} HUF</span>
                  <span className="text-muted-foreground">{priceRange[1].toLocaleString()} HUF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
            <Button 
              className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20" 
              onClick={applyFilters}
            >
              {t('common.confirm') || 'Apply Filters'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Clear button if filters active */}
      {activeFilterCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="rounded-full h-8 w-8 p-0 flex-shrink-0"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
};
