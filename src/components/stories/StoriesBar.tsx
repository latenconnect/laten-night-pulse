import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useStories, StoryGroup } from '@/hooks/useStories';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StoryViewer from './StoryViewer';
import CreateStoryDialog from './CreateStoryDialog';

const StoriesBar: React.FC = () => {
  const { user } = useAuth();
  const { storyGroups, loading, viewedStoryIds } = useStories();
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const userHasStory = storyGroups.some(g => g.user_id === user?.id);

  if (loading) {
    return (
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* Create Story Button */}
        {user && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateDialog(true)}
            className="flex flex-col items-center gap-1 min-w-[64px]"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-dashed border-primary/50 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              {userHasStory && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[10px] text-primary-foreground font-bold">
                    {storyGroups.find(g => g.user_id === user.id)?.stories.length || 0}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate w-16 text-center">
              Your Story
            </span>
          </motion.button>
        )}

        {/* Story Circles */}
        {storyGroups.map((group, index) => {
          if (group.user_id === user?.id) return null; // Skip own story in list
          
          const hasUnviewed = group.stories.some(s => !viewedStoryIds.has(s.id));
          
          return (
            <motion.button
              key={group.user_id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedGroupIndex(index)}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <div className={`p-0.5 rounded-full ${
                hasUnviewed 
                  ? 'bg-gradient-to-br from-primary via-accent to-primary' 
                  : 'bg-muted'
              }`}>
                <Avatar className="w-[60px] h-[60px] border-2 border-background">
                  <AvatarImage src={group.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-lg">
                    {(group.display_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground truncate w-16 text-center">
                {group.display_name || 'User'}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Story Viewer */}
      {selectedGroupIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={selectedGroupIndex}
          onClose={() => setSelectedGroupIndex(null)}
        />
      )}

      {/* Create Story Dialog */}
      <CreateStoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
};

export default StoriesBar;
