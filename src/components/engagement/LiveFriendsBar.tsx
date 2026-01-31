import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface OnlineFriend {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: 'online' | 'browsing' | 'viewing_event';
  current_activity?: string;
}

export const LiveFriendsBar: React.FC<{ className?: string }> = ({ className }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [onlineFriends, setOnlineFriends] = useState<OnlineFriend[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch friends
    const fetchFriends = async () => {
      try {
        // Get friends I follow
        const { data: connections } = await supabase
          .from('user_connections')
          .select('following_id')
          .eq('follower_id', user.id)
          .eq('status', 'active')
          .limit(10);

        const friendIds = connections?.map(c => c.following_id) || [];
        if (friendIds.length === 0) return;

        // Get profiles of friends
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', friendIds)
          .limit(10);

        if (profiles) {
          // Initially set as "online" - real presence will update this
          setOnlineFriends(profiles.map(p => ({
            id: p.id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            status: 'online' as const,
          })));
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();

    // Set up realtime presence channel
    const channel = supabase.channel('online-friends')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Process presence state
        const online: OnlineFriend[] = [];
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach(presence => {
            if (presence.user_id !== user.id) {
              online.push({
                id: presence.user_id,
                display_name: presence.display_name,
                avatar_url: presence.avatar_url,
                status: presence.status || 'online',
                current_activity: presence.current_activity,
              });
            }
          });
        });
        // Merge with fetched friends (filter to only show friends)
        setOnlineFriends(prev => {
          const friendIds = prev.map(f => f.id);
          return online.filter(o => friendIds.includes(o.id));
        });
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        
        // Track own presence
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single();

        await channel.track({
          user_id: user.id,
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          status: 'browsing',
          online_at: new Date().toISOString(),
        });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || onlineFriends.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl overflow-hidden transition-all',
        isExpanded ? 'bg-card/80 border border-border/50 p-3' : 'bg-transparent',
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 w-full"
      >
        {/* Stacked avatars */}
        <div className="flex -space-x-2">
          {onlineFriends.slice(0, 4).map((friend, i) => (
            <motion.div
              key={friend.id}
              initial={{ scale: 0, x: -10 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarImage src={friend.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {friend.display_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </motion.div>
          ))}
          {onlineFriends.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
              +{onlineFriends.length - 4}
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">
            {onlineFriends.length} {onlineFriends.length === 1 ? 'friend' : 'friends'} online
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            Active now
          </p>
        </div>

        <ChevronRight className={cn(
          'w-4 h-4 text-muted-foreground transition-transform',
          isExpanded && 'rotate-90'
        )} />
      </button>

      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {onlineFriends.map((friend, i) => (
              <motion.button
                key={friend.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/user/${friend.id}`)}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={friend.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {friend.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{friend.display_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {friend.status === 'viewing_event' ? (
                      <>
                        <Sparkles className="w-3 h-3 text-primary" />
                        Checking out events
                      </>
                    ) : (
                      'Browsing'
                    )}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Mini version for compact spaces
export const LiveFriendsDot: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-xs font-medium text-green-400">{count} online</span>
    </motion.div>
  );
};

export default LiveFriendsBar;
