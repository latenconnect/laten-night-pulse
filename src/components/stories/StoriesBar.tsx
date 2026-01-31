import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import { useStories, StoryGroup } from '@/hooks/useStories';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StoryViewer from './StoryViewer';
import CreateStorySheet from './CreateStorySheet';
import StoryPrivacySettings from './StoryPrivacySettings';

const StoriesBar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { storyGroups, loading, viewedStoryIds } = useStories();
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  const userHasStory = storyGroups.some(g => g.user_id === user?.id);
  const userStoryGroup = storyGroups.find(g => g.user_id === user?.id);

  if (loading) {
    return (
      <div className="flex gap-4 px-4 py-4 overflow-x-auto scrollbar-hide">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-[68px] h-[68px] rounded-full bg-muted/50 animate-pulse" />
            <div className="w-12 h-3 rounded-full bg-muted/50 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3.5 px-4 py-3 overflow-x-auto scrollbar-hide scroll-smooth-mobile">
        {/* Your Story / Create Story Button */}
        {user && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => userHasStory 
              ? setSelectedGroupIndex(storyGroups.findIndex(g => g.user_id === user.id))
              : setShowCreateSheet(true)
            }
            className="flex flex-col items-center gap-1.5 min-w-[72px]"
          >
            <div className="relative">
              {userHasStory && userStoryGroup ? (
                <div className="p-[2.5px] rounded-full bg-gradient-to-br from-primary via-accent to-primary shadow-lg shadow-primary/25">
                  <Avatar className="w-[67px] h-[67px] border-[3px] border-background">
                    <AvatarImage src={userStoryGroup.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted text-lg font-medium">
                      {(userStoryGroup.display_name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary/15 to-accent/15 border-2 border-dashed border-primary/40 flex items-center justify-center transition-all duration-200 hover:border-primary/60 hover:from-primary/25 hover:to-accent/25">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
              )}
              {userHasStory && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateSheet(true);
                  }}
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-background"
                >
                  <Plus className="w-3.5 h-3.5 text-primary-foreground" />
                </motion.button>
              )}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground truncate w-[72px] text-center leading-tight">
              {t('common.yourStory')}
            </span>
          </motion.button>
        )}

        {/* Story Circles */}
        {storyGroups.map((group, index) => {
          if (group.user_id === user?.id) return null;
          
          const hasUnviewed = group.stories.some(s => !viewedStoryIds.has(s.id));
          
          return (
            <motion.button
              key={group.user_id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedGroupIndex(index)}
              className="flex flex-col items-center gap-1.5 min-w-[72px]"
            >
              <div className={`p-[2.5px] rounded-full transition-all duration-200 ${
                hasUnviewed 
                  ? 'bg-gradient-to-br from-primary via-accent to-primary shadow-lg shadow-primary/25' 
                  : 'bg-muted/50'
              }`}>
                <Avatar className="w-[67px] h-[67px] border-[3px] border-background">
                  <AvatarImage src={group.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-lg font-medium">
                    {(group.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground truncate w-[72px] text-center leading-tight">
                {group.display_name || 'User'}
              </span>
            </motion.button>
          );
        })}

        {/* Privacy Settings Button */}
        {user && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowPrivacySettings(true)}
            className="flex flex-col items-center gap-1.5 min-w-[72px] opacity-60"
          >
            <div className="w-[72px] h-[72px] rounded-full bg-muted/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground truncate w-[72px] text-center leading-tight">
              {t('common.settings')}
            </span>
          </motion.button>
        )}
      </div>

      {/* Story Viewer */}
      {selectedGroupIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={selectedGroupIndex}
          onClose={() => setSelectedGroupIndex(null)}
        />
      )}

      {/* Create Story Sheet */}
      <CreateStorySheet
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
      />

      {/* Privacy Settings */}
      <StoryPrivacySettings
        open={showPrivacySettings}
        onOpenChange={setShowPrivacySettings}
      />
    </>
  );
};

export default StoriesBar;
