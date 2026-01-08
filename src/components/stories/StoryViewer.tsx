import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useStories, StoryGroup } from '@/hooks/useStories';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StoryAd } from '@/components/ads';
import { formatDistanceToNow } from 'date-fns';

// Show ad after every N story groups
const AD_FREQUENCY = 3;

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  storyGroups,
  initialGroupIndex,
  onClose
}) => {
  const { user } = useAuth();
  const { markAsViewed, deleteStory } = useStories();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [groupsViewedSinceAd, setGroupsViewedSinceAd] = useState(0);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentGroup?.user_id === user?.id;

  const STORY_DURATION = 5000; // 5 seconds per story

  const goToNextStory = useCallback(() => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      // Check if we should show an ad before moving to next group
      const newGroupsViewed = groupsViewedSinceAd + 1;
      if (newGroupsViewed >= AD_FREQUENCY && !showingAd) {
        setShowingAd(true);
        setGroupsViewedSinceAd(0);
        return;
      }
      
      setGroupsViewedSinceAd(newGroupsViewed);
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, currentGroupIndex, currentGroup?.stories.length, storyGroups.length, onClose, groupsViewedSinceAd, showingAd]);

  const handleAdComplete = useCallback(() => {
    setShowingAd(false);
    if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroupIndex, storyGroups.length, onClose]);

  const handleAdSkip = useCallback(() => {
    setShowingAd(false);
    if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroupIndex, storyGroups.length, onClose]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, currentGroupIndex, storyGroups]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !isOwnStory) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory?.id, isOwnStory, markAsViewed]);

  // Progress timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, goToNextStory]);

  // Reset progress on story change
  useEffect(() => {
    setProgress(0);
  }, [currentStory?.id]);

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      goToPrevStory();
    } else {
      goToNextStory();
    }
  };

  const handleDelete = async () => {
    if (currentStory && isOwnStory) {
      await deleteStory(currentStory.id);
      if (currentGroup.stories.length <= 1) {
        onClose();
      } else {
        goToNextStory();
      }
    }
  };

  if (!currentStory) return null;

  // Show story ad between groups
  if (showingAd) {
    return (
      <StoryAd
        onComplete={handleAdComplete}
        onSkip={handleAdSkip}
        isPaused={isPaused}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2 pt-safe">
          {currentGroup.stories.map((story, index) => (
            <div
              key={story.id}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentStoryIndex 
                    ? '100%' 
                    : index === currentStoryIndex 
                      ? `${progress}%` 
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={currentGroup.avatar_url || undefined} />
              <AvatarFallback>
                {(currentGroup.display_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium text-sm">
                {currentGroup.display_name || 'User'}
              </p>
              <p className="text-white/60 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwnStory && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-white/10 text-white"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Content */}
        <div
          className="w-full h-full flex items-center justify-center"
          onClick={handleTap}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={currentStory.media_url}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />

          {/* Text Overlay */}
          {currentStory.text_overlay && (
            <div
              className={`absolute left-4 right-4 text-center ${
                currentStory.text_position === 'top' 
                  ? 'top-24' 
                  : currentStory.text_position === 'center'
                    ? 'top-1/2 -translate-y-1/2'
                    : 'bottom-24'
              }`}
            >
              <p
                className="text-xl font-bold px-4 py-2 rounded-lg backdrop-blur-sm"
                style={{ 
                  color: currentStory.text_color,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                {currentStory.text_overlay}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Arrows (desktop) */}
        {currentGroupIndex > 0 && (
          <button
            onClick={goToPrevStory}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentGroupIndex < storyGroups.length - 1 && (
          <button
            onClick={goToNextStory}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
