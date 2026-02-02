import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Award, Share2, ChevronRight, Plus, Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { usePartyTimeline, TimelineEntry, FlexCard } from '@/hooks/usePartyTimeline';
import { useReputation } from '@/hooks/useReputation';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface PartyTimelineWidgetProps {
  userId?: string;
  compact?: boolean;
}

export const PartyTimelineWidget: React.FC<PartyTimelineWidgetProps> = ({ 
  userId, 
  compact = false 
}) => {
  const { user } = useAuth();
  const { 
    timeline, 
    flexCards, 
    stats, 
    loading, 
    updateHighlight, 
    togglePublic,
    generateFlexCard,
    getShareableUrl 
  } = usePartyTimeline(userId);
  const { reputation, getRepLevel } = useReputation();

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [flexSheetOpen, setFlexSheetOpen] = useState(false);

  const isOwnProfile = !userId || userId === user?.id;

  if (loading) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || timeline.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <CardContent className="p-4 text-center">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-indigo-400 opacity-50" />
          <h3 className="font-semibold mb-1">No Nights Yet</h3>
          <p className="text-sm text-muted-foreground">
            Check in at events to build your party timeline
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleShare = async (card: FlexCard) => {
    const url = getShareableUrl(card.share_code);
    if (navigator.share) {
      await navigator.share({
        title: card.title,
        text: card.subtitle || 'Check out my party stats!',
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  if (compact) {
    return (
      <Card 
        className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 cursor-pointer"
        onClick={() => setDetailSheetOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <span className="text-2xl">🌙</span>
              </div>
              <div>
                <p className="font-semibold">{stats.totalNights} Nights</p>
                <p className="text-xs text-muted-foreground">
                  {stats.citiesVisited.length} cities • {Math.round(stats.totalHours)}h total
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <span className="text-lg">Party Timeline</span>
            </div>
            {isOwnProfile && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFlexSheetOpen(true)}
              >
                <Award className="h-4 w-4 mr-1" />
                Flex
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-card/50 text-center">
              <p className="text-2xl font-bold">{stats.totalNights}</p>
              <p className="text-xs text-muted-foreground">Nights</p>
            </div>
            <div className="p-3 rounded-xl bg-card/50 text-center">
              <p className="text-2xl font-bold">{stats.citiesVisited.length}</p>
              <p className="text-xs text-muted-foreground">Cities</p>
            </div>
            <div className="p-3 rounded-xl bg-card/50 text-center">
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Week Streak</p>
            </div>
          </div>

          {/* Recent Nights */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Recent nights</p>
            <div className="space-y-2">
              {timeline.slice(0, 3).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setSelectedEntry(entry);
                    setDetailSheetOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-card/50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-lg">
                      🌙
                    </div>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[180px]">{entry.event_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {entry.event_city} • {format(parseISO(entry.attended_date), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    +{entry.rep_earned}
                  </Badge>
                </button>
              ))}
            </div>

            {timeline.length > 3 && (
              <Button 
                variant="ghost" 
                className="w-full mt-2"
                onClick={() => setDetailSheetOpen(true)}
              >
                View all {timeline.length} nights
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Flex Cards Preview */}
          {flexCards.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Flex Cards</p>
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {flexCards.slice(0, 3).map((card) => (
                    <div 
                      key={card.id}
                      className="flex-shrink-0 w-40 p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                    >
                      <p className="font-semibold text-sm truncate">{card.title}</p>
                      {card.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => handleShare(card)}
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {selectedEntry ? selectedEntry.event_name : 'Party Timeline'}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(80vh-100px)]">
            {selectedEntry ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-card/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    {selectedEntry.event_city}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {format(parseISO(selectedEntry.attended_date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  {selectedEntry.duration_hours && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {selectedEntry.duration_hours}h
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20">
                  <p className="text-sm font-medium mb-1">Rep Earned</p>
                  <p className="text-2xl font-bold">+{selectedEntry.rep_earned}</p>
                </div>

                {isOwnProfile && (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-2">Highlight Moment</p>
                      <Input
                        placeholder="What was the best part?"
                        defaultValue={selectedEntry.highlight_moment || ''}
                        onBlur={(e) => updateHighlight(selectedEntry.id, e.target.value)}
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => togglePublic(selectedEntry.id)}
                    >
                      {selectedEntry.is_public ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Public
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Private
                        </>
                      )}
                    </Button>
                  </>
                )}

                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setSelectedEntry(null)}
                >
                  ← Back to timeline
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {timeline.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-card/50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-lg">
                        🌙
                      </div>
                      <div>
                        <p className="font-medium">{entry.event_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.event_city} • {format(parseISO(entry.attended_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">+{entry.rep_earned}</Badge>
                      {entry.is_public && (
                        <Eye className="h-3 w-3 text-muted-foreground mt-1 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Flex Card Generation Sheet */}
      <Sheet open={flexSheetOpen} onOpenChange={setFlexSheetOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              Create Flex Card
            </SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => {
                generateFlexCard('weekly_recap');
                setFlexSheetOpen(false);
              }}
            >
              <Sparkles className="h-6 w-6 mb-2 text-blue-400" />
              <span className="font-medium">Weekly Recap</span>
              <span className="text-xs text-muted-foreground">This week's stats</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => {
                generateFlexCard('monthly_stats');
                setFlexSheetOpen(false);
              }}
            >
              <Calendar className="h-6 w-6 mb-2 text-green-400" />
              <span className="font-medium">Monthly Stats</span>
              <span className="text-xs text-muted-foreground">This month's journey</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => {
                generateFlexCard('milestone');
                setFlexSheetOpen(false);
              }}
            >
              <Award className="h-6 w-6 mb-2 text-yellow-400" />
              <span className="font-medium">Milestone</span>
              <span className="text-xs text-muted-foreground">Total achievements</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col"
              onClick={() => {
                generateFlexCard('streak');
                setFlexSheetOpen(false);
              }}
            >
              <span className="text-2xl mb-2">🔥</span>
              <span className="font-medium">Streak</span>
              <span className="text-xs text-muted-foreground">Your consistency</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PartyTimelineWidget;
