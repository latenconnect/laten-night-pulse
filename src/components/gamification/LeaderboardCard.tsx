import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/context/AuthContext';

interface LeaderboardCardProps {
  variant?: 'compact' | 'full';
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ variant = 'compact' }) => {
  const { leaderboard, userXP, loading } = useGamification();
  const { user } = useAuth();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-4 w-4 text-yellow-400" />;
      case 2: return <Medal className="h-4 w-4 text-gray-300" />;
      case 3: return <Medal className="h-4 w-4 text-amber-600" />;
      default: return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default: return 'bg-card/50 border-border/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const myRank = leaderboard.findIndex(e => e.user_id === user?.id) + 1;
  const displayedEntries = variant === 'compact' ? leaderboard.slice(0, 5) : leaderboard;

  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span className="text-lg">Leaderboard</span>
          </div>
          {myRank > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              You: #{myRank}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedEntries.map((entry, index) => {
          const isCurrentUser = entry.user_id === user?.id;
          
          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                isCurrentUser ? 'ring-2 ring-primary/50 ' : ''
              }${getRankStyle(entry.rank)}`}
            >
              <div className="w-8 text-center">
                {getRankIcon(entry.rank) || (
                  <span className="text-sm font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>

              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={entry.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {entry.profile?.display_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${isCurrentUser && 'text-primary'}`}>
                  {entry.profile?.display_name || 'Anonymous'}
                  {isCurrentUser && ' (You)'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="font-bold text-sm">{entry.total_xp.toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}

        {displayedEntries.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No party scouts yet</p>
            <p className="text-xs">Be the first to earn XP!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
