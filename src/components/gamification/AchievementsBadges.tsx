import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock, Sparkles, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGamification, Achievement, UserAchievement } from '@/hooks/useGamification';

interface AchievementsBadgesProps {
  variant?: 'compact' | 'full';
}

export const AchievementsBadges: React.FC<AchievementsBadgesProps> = ({ variant = 'compact' }) => {
  const { achievements, userAchievements, loading } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));

  const categories = [
    { id: 'explorer', label: 'Explorer', icon: '🗺️' },
    { id: 'social', label: 'Social', icon: '👯' },
    { id: 'loyalty', label: 'Loyalty', icon: '🔥' },
    { id: 'pioneer', label: 'Pioneer', icon: '⭐' },
    { id: 'legendary', label: 'Legendary', icon: '👑' }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'explorer': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'social': return 'from-pink-500/20 to-rose-500/20 border-pink-500/30';
      case 'loyalty': return 'from-orange-500/20 to-amber-500/20 border-orange-500/30';
      case 'pioneer': return 'from-yellow-500/20 to-lime-500/20 border-yellow-500/30';
      case 'legendary': return 'from-purple-500/20 to-violet-500/20 border-purple-500/30';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  const filteredAchievements = selectedCategory
    ? achievements.filter(a => a.category === selectedCategory)
    : achievements;

  const recentEarned = userAchievements
    .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="animate-pulse flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 rounded-full bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span className="font-semibold text-sm">Achievements</span>
            </div>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 text-xs">
              {userAchievements.length}/{achievements.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {recentEarned.slice(0, 4).map(ua => {
              const achievement = achievements.find(a => a.id === ua.achievement_id);
              if (!achievement) return null;
              
              return (
                <motion.div
                  key={ua.id}
                  whileHover={{ scale: 1.1 }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-lg border border-amber-500/30"
                  title={achievement.name}
                >
                  {achievement.icon}
                </motion.div>
              );
            })}
            
            {achievements.length > 4 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-shrink-0 h-10 w-10 rounded-full p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-400" />
                      All Achievements
                    </SheetTitle>
                  </SheetHeader>
                  <AchievementsFullList 
                    achievements={achievements}
                    earnedIds={earnedIds}
                    categories={categories}
                    getCategoryColor={getCategoryColor}
                  />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            Achievements
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
            {userAchievements.length}/{achievements.length} unlocked
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AchievementsFullList 
          achievements={achievements}
          earnedIds={earnedIds}
          categories={categories}
          getCategoryColor={getCategoryColor}
        />
      </CardContent>
    </Card>
  );
};

interface AchievementsFullListProps {
  achievements: Achievement[];
  earnedIds: Set<string>;
  categories: { id: string; label: string; icon: string }[];
  getCategoryColor: (category: string) => string;
}

const AchievementsFullList: React.FC<AchievementsFullListProps> = ({
  achievements,
  earnedIds,
  categories,
  getCategoryColor
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredAchievements = selectedCategory
    ? achievements.filter(a => a.category === selectedCategory)
    : achievements;

  return (
    <div className="space-y-4 mt-4">
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="flex-shrink-0"
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="flex-shrink-0"
            >
              {cat.icon} {cat.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="grid grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map(achievement => {
            const isEarned = earnedIds.has(achievement.id);
            
            return (
              <motion.div
                key={achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                className={`relative p-3 rounded-xl border text-center ${
                  isEarned 
                    ? `bg-gradient-to-br ${getCategoryColor(achievement.category)}`
                    : 'bg-muted/30 border-border/30'
                }`}
              >
                {isEarned && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                )}
                
                <div className={`text-2xl mb-1 ${!isEarned && 'opacity-30 grayscale'}`}>
                  {achievement.icon}
                </div>
                
                <h4 className={`text-xs font-medium mb-0.5 ${!isEarned && 'text-muted-foreground'}`}>
                  {achievement.is_secret && !isEarned ? '???' : achievement.name}
                </h4>
                
                {isEarned ? (
                  <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-300">
                    +{achievement.xp_reward} XP
                  </Badge>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <Lock className="h-2.5 w-2.5" />
                    {achievement.is_secret ? 'Secret' : 'Locked'}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
