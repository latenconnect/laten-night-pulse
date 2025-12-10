import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFriends, UserProfile } from '@/hooks/useFriends';
import { useAuth } from '@/context/AuthContext';

interface FriendsSuggestionsProps {
  city?: string;
  limit?: number;
}

// Mock suggestions - in production this would come from a hook that analyzes mutual friends, interests, etc.
const mockSuggestions: UserProfile[] = [
  { id: 'sug1', display_name: 'Party Planner', avatar_url: null, city: 'Budapest' },
  { id: 'sug2', display_name: 'Night Owl', avatar_url: null, city: 'Budapest' },
  { id: 'sug3', display_name: 'Music Lover', avatar_url: null, city: 'Szeged' },
];

const FriendsSuggestions: React.FC<FriendsSuggestionsProps> = ({ 
  city,
  limit = 3 
}) => {
  const { user } = useAuth();
  const { followUser, getConnectionStatus } = useFriends();
  const [loading, setLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!user) return null;

  const handleFollow = async (userId: string) => {
    setLoading(userId);
    await followUser(userId);
    setLoading(null);
  };

  const handleDismiss = (userId: string) => {
    setDismissed(prev => new Set([...prev, userId]));
  };

  const suggestions = mockSuggestions
    .filter(s => !dismissed.has(s.id))
    .filter(s => !city || s.city === city)
    .slice(0, limit);

  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-secondary" />
          <h2 className="font-display font-bold text-lg">People You May Know</h2>
        </div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {suggestions.map((suggestion, index) => {
          const { isFollowing } = getConnectionStatus(suggestion.id);
          
          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex-shrink-0 w-36 p-4 rounded-2xl bg-card border border-border text-center"
            >
              <button
                onClick={() => handleDismiss(suggestion.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
              
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarImage src={suggestion.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-lg">
                  {(suggestion.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <p className="font-medium text-sm truncate mb-1">
                {suggestion.display_name || 'User'}
              </p>
              
              {suggestion.city && (
                <p className="text-xs text-muted-foreground mb-3">{suggestion.city}</p>
              )}
              
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "neon"}
                className="w-full gap-1"
                onClick={() => handleFollow(suggestion.id)}
                disabled={loading === suggestion.id || isFollowing}
              >
                {loading === suggestion.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  'Following'
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default FriendsSuggestions;
