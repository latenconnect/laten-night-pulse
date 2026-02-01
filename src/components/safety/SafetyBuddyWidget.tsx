import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Home, AlertTriangle, UserPlus, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSafetyBuddy } from '@/hooks/useSafetyBuddy';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface SafetyBuddyWidgetProps {
  variant?: 'compact' | 'full';
  eventId?: string;
}

export const SafetyBuddyWidget: React.FC<SafetyBuddyWidgetProps> = ({ 
  variant = 'compact',
  eventId 
}) => {
  const { t } = useTranslation();
  const { 
    buddies, 
    activeCheckin, 
    startCheckin, 
    markSafe, 
    loading 
  } = useSafetyBuddy();
  
  const [locationNote, setLocationNote] = useState('');
  const [showStartForm, setShowStartForm] = useState(false);

  const handleStartNight = async () => {
    const expectedHome = new Date();
    expectedHome.setHours(expectedHome.getHours() + 5); // Default 5 hours from now
    
    await startCheckin(eventId, expectedHome, locationNote);
    setShowStartForm(false);
    setLocationNote('');
  };

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="animate-pulse h-12 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`border ${
        activeCheckin 
          ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' 
          : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                activeCheckin ? 'bg-green-500/20' : 'bg-blue-500/20'
              }`}>
                <Shield className={`h-5 w-5 ${
                  activeCheckin ? 'text-green-400' : 'text-blue-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Safety Buddy</h3>
                <p className="text-xs text-muted-foreground">
                  {activeCheckin 
                    ? `Out since ${formatDistanceToNow(new Date(activeCheckin.created_at))} ago`
                    : `${buddies.length} buddies watching`}
                </p>
              </div>
            </div>

            {activeCheckin ? (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={markSafe}
              >
                <Home className="h-4 w-4 mr-1" />
                I'm Safe
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowStartForm(true)}
              >
                Start Night
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showStartForm && !activeCheckin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                <Input
                  placeholder="Where are you headed? (optional)"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={handleStartNight}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Start Check-in
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setShowStartForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Safety Buddy
          </div>
          {activeCheckin && (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeCheckin ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Night out in progress</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Started {formatDistanceToNow(new Date(activeCheckin.created_at))} ago
                {activeCheckin.location_note && ` • ${activeCheckin.location_note}`}
              </p>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={markSafe}
                >
                  <Home className="h-4 w-4 mr-2" />
                  I'm Home Safe
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Your {buddies.length} safety buddies will be notified when you check in
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-center mb-3">
                Let your friends know you're heading out
              </p>
              
              <Input
                placeholder="Where are you going? (optional)"
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                className="mb-3"
              />
              
              <Button className="w-full" onClick={handleStartNight}>
                <MapPin className="h-4 w-4 mr-2" />
                Start Night Out
              </Button>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Your Buddies ({buddies.length})
              </h4>
              
              {buddies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {buddies.map(buddy => (
                    <div 
                      key={buddy.id}
                      className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={buddy.buddy_profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {buddy.buddy_profile?.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">
                        {buddy.buddy_profile?.display_name || 'Friend'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add friends as safety buddies from their profile
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
