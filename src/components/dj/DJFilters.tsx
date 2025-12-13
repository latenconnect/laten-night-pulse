import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Calendar, Music, PartyPopper, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/context/LanguageContext';
import { MUSIC_GENRES, EVENT_TYPES, DJFilters as DJFiltersType } from '@/hooks/useDJs';
import { format } from 'date-fns';

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
    <div className="flex items-center gap-2">
      {/* Quick Filters */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            {localFilters.availableDate 
              ? format(new Date(localFilters.availableDate), 'MMM d')
              : t('availability')
            }
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

      {/* Full Filter Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            {t('filters')}
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center justify-between">
              {t('filterDJs')}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t('clearAll')}
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto max-h-[calc(80vh-150px)]">
            {/* Music Genres */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" />
                {t('musicGenres')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {MUSIC_GENRES.map((genre) => (
                  <Badge
                    key={genre}
                    variant={localFilters.genres?.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer transition-all"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                    {localFilters.genres?.includes(genre) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Event Types */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-primary" />
                {t('eventTypes')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={localFilters.eventTypes?.includes(type) ? "default" : "outline"}
                    className="cursor-pointer transition-all"
                    onClick={() => toggleEventType(type)}
                  >
                    {type}
                    {localFilters.eventTypes?.includes(type) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                {t('priceRange')}
              </h4>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={200000}
                  step={5000}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{priceRange[0].toLocaleString()} HUF</span>
                  <span>{priceRange[1].toLocaleString()} HUF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <Button className="w-full" onClick={applyFilters}>
              {t('applyFilters')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Clear button if filters active */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
