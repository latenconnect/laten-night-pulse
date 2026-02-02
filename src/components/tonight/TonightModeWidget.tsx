import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Users, MapPin, Clock, ChevronRight, Sparkles, Radio, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTonightMode, HotEvent, FriendLocation } from '@/hooks/useTonightMode';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface TonightModeProps {
  onEventSelect?: (eventId: string) => void;
}

export const TonightModeWidget: React.FC<TonightModeProps> = ({ onEventSelect }) => {
  const navigate = useNavigate();
  const {
    hotEvents,
    friendLocations,
    myLocation,
    loading,
    updateMyStatus,
    updateVisibility,
    getHeatColor,
    getHeatEmoji,
    STATUS_OPTIONS,
    VISIBILITY_OPTIONS,
  } = useTonightMode();

  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HotEvent | null>(null);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleEventClick = (event: HotEvent) => {
    if (onEventSelect) {
      onEventSelect(event.id);
    } else {
      navigate(`/event/${event.id}`);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 border-orange-500/20 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Radio className="h-5 w-5 text-red-500" />
              </motion.div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Tonight Mode
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setStatusSheetOpen(true)}
              className="text-xs gap-1"
            >
              {myLocation ? STATUS_OPTIONS.find(s => s.value === myLocation.status)?.emoji : '🟢'}
              Set Status
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Hot Events */}
          {hotEvents.length > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Flame className="h-3 w-3" />
                What's hot right now
              </p>
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-2">
                  {hotEvents.slice(0, 5).map((event, i) => (
                    <motion.button
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleEventClick(event)}
                      className="flex-shrink-0 w-36 rounded-xl overflow-hidden bg-card/50 border border-border/50 text-left"
                    >
                      <div className="relative h-20">
                        {event.cover_image ? (
                          <img 
                            src={event.cover_image} 
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        
                        {/* Heat indicator */}
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant="secondary" 
                            className={`${getHeatColor(event.heat_level)} bg-black/50 text-xs px-1.5`}
                          >
                            {getHeatEmoji(event.heat_level)}
                          </Badge>
                        </div>

                        {/* Attendees */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                          <Users className="h-3 w-3" />
                          {event.current_attendees}
                        </div>
                      </div>

                      <div className="p-2">
                        <p className="font-medium text-sm truncate">{event.name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {event.location_name}
                        </p>
                        {event.friends_going > 0 && (
                          <p className="text-xs text-primary mt-1">
                            {event.friends_going} friends going
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events happening right now</p>
              <p className="text-xs">Check back later tonight!</p>
            </div>
          )}

          {/* Friend Locations */}
          {friendLocations.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Friends tonight
              </p>
              <div className="flex -space-x-2">
                {friendLocations.slice(0, 8).map((friend) => (
                  <div key={friend.id} className="relative">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={friend.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {friend.profile?.display_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 text-sm">
                      {STATUS_OPTIONS.find(s => s.value === friend.status)?.emoji}
                    </span>
                  </div>
                ))}
                {friendLocations.length > 8 && (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                    +{friendLocations.length - 8}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Sheet */}
      <Sheet open={statusSheetOpen} onOpenChange={setStatusSheetOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>What's your status tonight?</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {/* Status Options */}
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status.value}
                  variant={myLocation?.status === status.value ? 'default' : 'outline'}
                  className="h-14 justify-start gap-2"
                  onClick={() => {
                    updateMyStatus(status.value as FriendLocation['status']);
                  }}
                >
                  <span className="text-xl">{status.emoji}</span>
                  <span>{status.label}</span>
                </Button>
              ))}
            </div>

            {/* Visibility */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                {myLocation?.visible_to === 'nobody' ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Who can see your status?
              </p>
              <div className="flex gap-2">
                {VISIBILITY_OPTIONS.map((vis) => (
                  <Button
                    key={vis.value}
                    variant={myLocation?.visible_to === vis.value ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => updateVisibility(vis.value as FriendLocation['visible_to'])}
                  >
                    <span>{vis.emoji}</span>
                    <span className="text-xs">{vis.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TonightModeWidget;
