import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CheckCircle2, Flame, Star, Clock, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useReputation, useEventCheckIn, useVibeRatings } from '@/hooks/useReputation';
import { useAuth } from '@/context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

interface ReputationBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({ size = 'md', showProgress = false }) => {
  const { reputation, loading, getRepLevel, getProgressToNextLevel } = useReputation();

  if (loading || !reputation) {
    return (
      <div className={`animate-pulse bg-muted rounded-full ${
        size === 'sm' ? 'h-6 w-16' : size === 'md' ? 'h-8 w-20' : 'h-10 w-24'
      }`} />
    );
  }

  const level = getRepLevel(reputation.reputation_level);
  const progress = getProgressToNextLevel();

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary" 
        className={`${level.color} bg-black/20 border-0 ${
          size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'md' ? 'text-sm px-2.5 py-1' : 'text-base px-3 py-1.5'
        }`}
      >
        <span className="mr-1">{level.emoji}</span>
        {reputation.total_rep} Rep
      </Badge>
      
      {showProgress && (
        <div className="flex-1 max-w-24">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              className="h-full bg-gradient-to-r from-primary to-secondary"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {progress.current}/{progress.needed} to {level.label}
          </p>
        </div>
      )}
    </div>
  );
};

interface EventCheckInWidgetProps {
  eventId: string;
  eventName: string;
  isHost?: boolean;
}

export const EventCheckInWidget: React.FC<EventCheckInWidgetProps> = ({ 
  eventId, 
  eventName,
  isHost = false 
}) => {
  const { user } = useAuth();
  const { checkIn, isCheckedIn, checkInWithQR, checkOut, loading } = useEventCheckIn(eventId);
  const [qrInput, setQrInput] = useState('');
  const [showQRInput, setShowQRInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Sign in to check in and earn Rep</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const handleCheckIn = async () => {
    if (!qrInput.trim()) return;
    setSubmitting(true);
    await checkInWithQR(qrInput.trim());
    setSubmitting(false);
    setShowQRInput(false);
    setQrInput('');
  };

  if (isCheckedIn && checkIn) {
    const duration = checkIn.check_out_time 
      ? null 
      : formatDistanceToNow(new Date(checkIn.check_in_time), { addSuffix: false });

    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-green-400">Checked In!</p>
                {duration && (
                  <p className="text-xs text-muted-foreground">Here for {duration}</p>
                )}
                {checkIn.check_out_time && (
                  <p className="text-xs text-muted-foreground">
                    Stayed {checkIn.duration_minutes} mins
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <Badge className="bg-green-500/20 text-green-400 border-0">
                +{checkIn.rep_earned} Rep
              </Badge>
              {!checkIn.check_out_time && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-1"
                  onClick={checkOut}
                >
                  Check Out
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
      <CardContent className="p-4">
        {!showQRInput ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Check In</p>
                <p className="text-xs text-muted-foreground">Scan QR to earn Rep</p>
              </div>
            </div>
            <Button onClick={() => setShowQRInput(true)} className="gap-2">
              <QrCode className="h-4 w-4" />
              Enter Code
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">Enter the event's check-in code</p>
            <div className="flex gap-2">
              <Input
                placeholder="LATEN-XXXX-XXXX"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <Button onClick={handleCheckIn} disabled={submitting || !qrInput.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => setShowQRInput(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface VibeRatingWidgetProps {
  eventId: string;
}

export const VibeRatingWidget: React.FC<VibeRatingWidgetProps> = ({ eventId }) => {
  const { attendees, myRatings, loading, rateVibe, getRatingForUser } = useVibeRatings(eventId);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (loading || attendees.length === 0) return null;

  const unratedCount = attendees.filter(a => !getRatingForUser(a.user_id)).length;

  return (
    <>
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <CardContent className="p-4">
          <button 
            onClick={() => setSheetOpen(true)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-left">
                <p className="font-medium">Rate the Vibes</p>
                <p className="text-xs text-muted-foreground">
                  {unratedCount > 0 ? `${unratedCount} people to rate` : 'All rated!'}
                </p>
              </div>
            </div>
            <div className="flex -space-x-2">
              {attendees.slice(0, 3).map((a) => (
                <Avatar key={a.user_id} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={a.avatar_url || undefined} />
                  <AvatarFallback>{a.display_name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </button>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Rate Attendees' Vibes
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Anonymous ratings help build reputation
            </p>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto max-h-[50vh]">
            {attendees.map((attendee) => {
              const currentRating = getRatingForUser(attendee.user_id);

              return (
                <div 
                  key={attendee.user_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={attendee.avatar_url || undefined} />
                      <AvatarFallback>{attendee.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{attendee.display_name}</p>
                  </div>

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <motion.button
                        key={score}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => rateVibe(attendee.user_id, score)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          currentRating === score
                            ? 'bg-yellow-500 text-yellow-950'
                            : currentRating && currentRating >= score
                            ? 'bg-yellow-500/50 text-yellow-300'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        ⭐
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
