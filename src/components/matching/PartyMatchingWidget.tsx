import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, Zap, Music, ChevronRight, Heart, X, Check, MessageCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { usePartyMatching, PotentialMatch } from '@/hooks/usePartyMatching';
import { useAuth } from '@/context/AuthContext';

interface PartyMatchingWidgetProps {
  eventId?: string;
}

export const PartyMatchingWidget: React.FC<PartyMatchingWidgetProps> = ({ eventId }) => {
  const { user } = useAuth();
  const {
    preferences,
    potentialMatches,
    connections,
    loading,
    updatePreferences,
    sendConnectionRequest,
    respondToConnection,
    getPendingRequests,
    getActiveConnections,
    ENERGY_LEVELS,
    MUSIC_VIBES,
  } = usePartyMatching();

  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [prefsSheetOpen, setPrefsSheetOpen] = useState(false);
  const [connectionsSheetOpen, setConnectionsSheetOpen] = useState(false);

  const pendingRequests = getPendingRequests();
  const activeConnections = getActiveConnections();
  const currentMatch = potentialMatches[currentMatchIndex];

  if (!user) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Sign in to find your party squad</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  // If no preferences set, show setup
  if (!preferences) {
    return (
      <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
        <CardContent className="p-4 text-center">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-pink-400" />
          <h3 className="font-semibold mb-1">Find Your Party Crew</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Match with people heading out tonight
          </p>
          <Button onClick={() => setPrefsSheetOpen(true)} className="gap-2">
            <Zap className="h-4 w-4" />
            Set Up Matching
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSwipeRight = async () => {
    if (!currentMatch) return;
    await sendConnectionRequest(currentMatch.user_id, eventId);
    setCurrentMatchIndex(prev => prev + 1);
  };

  const handleSwipeLeft = () => {
    setCurrentMatchIndex(prev => prev + 1);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-400" />
              <span className="text-lg">Party Matching</span>
            </div>
            <div className="flex gap-2">
              {pendingRequests.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="bg-pink-500/20 text-pink-400"
                  onClick={() => setConnectionsSheetOpen(true)}
                >
                  {pendingRequests.length} new
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPrefsSheetOpen(true)}
              >
                ⚙️
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {currentMatch ? (
            <div className="space-y-4">
              {/* Match Card */}
              <motion.div
                key={currentMatch.user_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-4 rounded-xl bg-card/50 border border-border/50"
              >
                <div className="flex items-center gap-4 mb-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={currentMatch.avatar_url || undefined} />
                    <AvatarFallback className="text-xl">
                      {currentMatch.display_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{currentMatch.display_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {ENERGY_LEVELS.find(e => e.value === currentMatch.energy_level)?.emoji}{' '}
                        {ENERGY_LEVELS.find(e => e.value === currentMatch.energy_level)?.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {currentMatch.compatibility_score}% match
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Music vibes */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {currentMatch.music_vibes.slice(0, 4).map((vibe) => (
                    <Badge key={vibe} variant="outline" className="text-xs">
                      🎵 {vibe}
                    </Badge>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="flex-1"
                    onClick={handleSwipeLeft}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500"
                    onClick={handleSwipeRight}
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Connect
                  </Button>
                </div>
              </motion.div>

              {/* Remaining count */}
              <p className="text-xs text-center text-muted-foreground">
                {potentialMatches.length - currentMatchIndex - 1} more potential matches
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <Sparkles className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No more matches right now
              </p>
              <p className="text-xs text-muted-foreground">
                Check back later tonight!
              </p>
            </div>
          )}

          {/* Active connections preview */}
          {activeConnections.length > 0 && (
            <Button
              variant="ghost"
              className="w-full mt-4 justify-between"
              onClick={() => setConnectionsSheetOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {activeConnections.length} connection{activeConnections.length > 1 ? 's' : ''} tonight
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preferences Sheet */}
      <Sheet open={prefsSheetOpen} onOpenChange={setPrefsSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Party Preferences</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Energy Level */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Your Energy Tonight</Label>
              <div className="grid grid-cols-2 gap-2">
                {ENERGY_LEVELS.map((level) => (
                  <Button
                    key={level.value}
                    variant={preferences?.energy_level === level.value ? 'default' : 'outline'}
                    className="h-auto py-3 flex-col items-start"
                    onClick={() => updatePreferences({ energy_level: level.value as any })}
                  >
                    <span className="text-xl mb-1">{level.emoji}</span>
                    <span className="font-medium">{level.label}</span>
                    <span className="text-xs text-muted-foreground">{level.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Music Vibes */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Music Vibes</Label>
              <div className="flex flex-wrap gap-2">
                {MUSIC_VIBES.map((vibe) => (
                  <Badge
                    key={vibe}
                    variant={preferences?.music_vibes?.includes(vibe) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = preferences?.music_vibes || [];
                      const updated = current.includes(vibe)
                        ? current.filter(v => v !== vibe)
                        : [...current, vibe];
                      updatePreferences({ music_vibes: updated });
                    }}
                  >
                    {vibe}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Age Range: {preferences?.age_range_min || 18} - {preferences?.age_range_max || 99}
              </Label>
              <div className="px-2">
                <Slider
                  value={[preferences?.age_range_min || 18, preferences?.age_range_max || 99]}
                  min={18}
                  max={99}
                  step={1}
                  onValueChange={([min, max]) => {
                    updatePreferences({ age_range_min: min, age_range_max: max });
                  }}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Connections Sheet */}
      <Sheet open={connectionsSheetOpen} onOpenChange={setConnectionsSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>Your Connections</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto max-h-[50vh]">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Pending Requests</p>
                {pendingRequests.map((conn) => (
                  <div 
                    key={conn.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card/50 mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={conn.profile?.avatar_url || undefined} />
                        <AvatarFallback>{conn.profile?.display_name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{conn.profile?.display_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => respondToConnection(conn.id, false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => respondToConnection(conn.id, true)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Connections */}
            {activeConnections.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Connected Tonight</p>
                {activeConnections.map((conn) => (
                  <div 
                    key={conn.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card/50 mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={conn.profile?.avatar_url || undefined} />
                        <AvatarFallback>{conn.profile?.display_name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{conn.profile?.display_name}</p>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Connected
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {pendingRequests.length === 0 && activeConnections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No connections yet</p>
                <p className="text-sm">Start swiping to find your crew!</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PartyMatchingWidget;
