import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Crown, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';

interface XPLevelCardProps {
  variant?: 'mini' | 'compact' | 'full';
}

export const XPLevelCard: React.FC<XPLevelCardProps> = ({ variant = 'compact' }) => {
  const { userXP, getXPProgress, loading } = useGamification();
  const xpProgress = getXPProgress();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-muted rounded-lg" />
      </div>
    );
  }

  const level = userXP?.current_level || 1;
  const getLevelTitle = (lvl: number) => {
    if (lvl >= 50) return 'Legend';
    if (lvl >= 40) return 'Party God';
    if (lvl >= 30) return 'Night King';
    if (lvl >= 20) return 'Party Pro';
    if (lvl >= 10) return 'Social Star';
    if (lvl >= 5) return 'Night Owl';
    return 'Newcomer';
  };

  const getLevelColor = (lvl: number) => {
    if (lvl >= 50) return 'from-yellow-400 via-orange-500 to-red-500';
    if (lvl >= 30) return 'from-purple-400 via-pink-500 to-red-400';
    if (lvl >= 20) return 'from-blue-400 via-purple-500 to-pink-400';
    if (lvl >= 10) return 'from-cyan-400 via-blue-500 to-purple-400';
    return 'from-green-400 via-emerald-500 to-teal-400';
  };

  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center`}>
          <span className="text-xs font-bold text-white">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <Progress value={xpProgress.percentage} className="h-1.5" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center shadow-lg`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {level >= 50 ? (
                <Crown className="h-7 w-7 text-white" />
              ) : (
                <span className="text-xl font-bold text-white">{level}</span>
              )}
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold">{getLevelTitle(level)}</h3>
                <span className="text-xs text-muted-foreground">Lv. {level}</span>
              </div>
              <div className="space-y-1">
                <Progress value={xpProgress.percentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{xpProgress.current} / {xpProgress.needed} XP</span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-400" />
                    {userXP?.total_xp || 0} total
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          <motion.div 
            className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center shadow-xl`}
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(147, 51, 234, 0.3)',
                '0 0 40px rgba(147, 51, 234, 0.5)',
                '0 0 20px rgba(147, 51, 234, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {level >= 50 ? (
              <Crown className="h-10 w-10 text-white" />
            ) : (
              <span className="text-3xl font-bold text-white">{level}</span>
            )}
            <motion.div 
              className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="h-4 w-4 text-yellow-900" />
            </motion.div>
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold">{getLevelTitle(level)}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                Level {level}
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Progress value={xpProgress.percentage} className="h-3" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">{xpProgress.current}</span>
                  <span className="text-muted-foreground">/ {xpProgress.needed} XP to next level</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span>{userXP?.xp_this_week || 0} this week</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400" />
                <span>{userXP?.total_xp || 0} total XP</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
