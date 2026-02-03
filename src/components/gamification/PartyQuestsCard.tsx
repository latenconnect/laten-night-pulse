import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, Zap, CheckCircle, Gift, Flame, Trophy, ChevronRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useGamification } from '@/hooks/useGamification';
import { formatDistanceToNow } from 'date-fns';

interface PartyQuestsCardProps {
  variant?: 'compact' | 'full';
}

export const PartyQuestsCard: React.FC<PartyQuestsCardProps> = ({ variant = 'full' }) => {
  const { quests, questProgress, claimQuest, loading } = useGamification();
  const [showFullQuests, setShowFullQuests] = useState(false);

  const getQuestProgress = (questId: string) => {
    return questProgress.find(p => p.quest_id === questId);
  };

  const getProgressPercentage = (quest: typeof quests[0]) => {
    const progress = getQuestProgress(quest.id);
    if (!progress) return 0;
    return Math.min(100, (progress.progress / quest.requirement_value) * 100);
  };

  const isCompleted = (quest: typeof quests[0]) => {
    const progress = getQuestProgress(quest.id);
    return progress && progress.progress >= quest.requirement_value;
  };

  const isClaimed = (quest: typeof quests[0]) => {
    const progress = getQuestProgress(quest.id);
    return progress?.claimed_at !== null;
  };

  const getQuestIcon = (questType: string) => {
    switch (questType) {
      case 'daily': return <Flame className="h-4 w-4 text-orange-400" />;
      case 'weekly': return <Trophy className="h-4 w-4 text-yellow-400" />;
      case 'special': return <Zap className="h-4 w-4 text-purple-400" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  // Full quest list component (used in sheet and full variant)
  const QuestList = () => (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {quests.map(quest => {
          const progress = getQuestProgress(quest.id);
          const completed = isCompleted(quest);
          const claimed = isClaimed(quest);

          return (
            <motion.div
              key={quest.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-xl border ${
                claimed 
                  ? 'bg-muted/30 border-border/30 opacity-60'
                  : completed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-card/50 border-border/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  claimed ? 'bg-muted' : completed ? 'bg-green-500/20' : 'bg-purple-500/20'
                }`}>
                  {claimed ? (
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  ) : completed ? (
                    <Gift className="h-5 w-5 text-green-400" />
                  ) : (
                    getQuestIcon(quest.quest_type)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{quest.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        quest.quest_type === 'daily' 
                          ? 'border-orange-500/50 text-orange-400'
                          : quest.quest_type === 'weekly'
                          ? 'border-yellow-500/50 text-yellow-400'
                          : 'border-purple-500/50 text-purple-400'
                      }`}
                    >
                      {quest.quest_type}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    {quest.description}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress 
                        value={getProgressPercentage(quest)} 
                        className="h-2"
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {progress?.progress || 0}/{quest.requirement_value}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(quest.expires_at), { addSuffix: true })}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Zap className="h-3 w-3 mr-1" />
                        +{quest.xp_reward} XP
                      </Badge>
                      
                      {completed && !claimed && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => claimQuest(quest.id)}
                        >
                          Claim
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {quests.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active quests right now</p>
          <p className="text-xs">Check back later for new challenges!</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    const activeQuests = quests.filter(q => !isClaimed(q)).slice(0, 2);
    
    return (
      <>
        <Card 
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => setShowFullQuests(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                <span className="font-semibold text-sm">Party Quests</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                  {quests.length} active
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              {activeQuests.map(quest => (
                <div key={quest.id} className="flex items-center gap-3">
                  {getQuestIcon(quest.quest_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{quest.title}</p>
                    <Progress value={getProgressPercentage(quest)} className="h-1 mt-1" />
                  </div>
                  <span className="text-xs text-muted-foreground">+{quest.xp_reward}</span>
                </div>
              ))}
              {activeQuests.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No active quests
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Full Quests Sheet */}
        <Sheet open={showFullQuests} onOpenChange={setShowFullQuests}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Party Quests
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-full pb-8">
              <QuestList />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-purple-400" />
          Party Quests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <QuestList />
      </CardContent>
    </Card>
  );
};
