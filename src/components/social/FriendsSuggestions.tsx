import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Loader2, X, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useFriendSuggestions } from '@/hooks/useFriendSuggestions';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface FriendsSuggestionsProps {
  city?: string;
  limit?: number;
}

const FriendsSuggestions: React.FC<FriendsSuggestionsProps> = ({ 
  city,
  limit = 3 
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { suggestions, loading } = useFriendSuggestions(city, limit);
  const { followUser } = useFriends();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  if (!user) return null;
  if (loading) return null;
  
  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.id) && !followed.has(s.id));
  if (visibleSuggestions.length === 0) return null;

  const handleFollow = async (userId: string) => {
    setLoadingId(userId);
    await followUser(userId);
    setFollowed(prev => new Set([...prev, userId]));
    setLoadingId(null);
  };

  const handleDismiss = (userId: string) => {
    setDismissed(prev => new Set([...prev, userId]));
  };

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h2 className="font-display font-bold text-lg">People You May Know</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {visibleSuggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex-shrink-0 w-36 p-4 rounded-2xl bg-card border border-border text-center"
          >
            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(suggestion.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* Avatar */}
            <Avatar className="w-16 h-16 mx-auto mb-3 border-2 border-primary/20">
              <AvatarImage src={suggestion.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {suggestion.display_name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <p className="font-medium text-sm text-foreground truncate mb-1">
              {suggestion.display_name || 'User'}
            </p>

            {/* Connection info */}
            {(suggestion.mutual_friends > 0 || suggestion.common_events > 0) && (
              <p className="text-xs text-muted-foreground mb-3">
                {suggestion.mutual_friends > 0 && (
                  <span>{suggestion.mutual_friends} mutual</span>
                )}
                {suggestion.mutual_friends > 0 && suggestion.common_events > 0 && ' • '}
                {suggestion.common_events > 0 && (
                  <span>{suggestion.common_events} events</span>
                )}
              </p>
            )}
            {suggestion.city && suggestion.mutual_friends === 0 && suggestion.common_events === 0 && (
              <p className="text-xs text-muted-foreground mb-3">{suggestion.city}</p>
            )}

            {/* Follow button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFollow(suggestion.id)}
              disabled={loadingId === suggestion.id}
              className="w-full gap-1"
            >
              {loadingId === suggestion.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-3 h-3" />
                  Follow
                </>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FriendsSuggestions;
