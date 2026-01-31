import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X, Trash2, Send, MoreVertical, Bookmark, Flag, Eye } from 'lucide-react';
import { useStories, StoryGroup } from '@/hooks/useStories';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StoryAd } from '@/components/ads';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AD_FREQUENCY = 3;
const STORY_DURATION = 5000;

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
  const { t } = useLanguage();
  const { markAsViewed, deleteStory, saveToHighlight } = useStories();
  
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [groupsViewedSinceAd, setGroupsViewedSinceAd] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);
  
  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentGroup?.user_id === user?.id;
  const isVideo = currentStory?.media_type === 'video';

  // Swipe between users
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x < -threshold && currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else if (info.offset.x > threshold && currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentStoryIndex(0);
      setProgress(0);
    }
    dragX.set(0);
  };

  const goToNextStory = useCallback(() => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < storyGroups.length - 1) {
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

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  }, [currentStoryIndex, currentGroupIndex]);

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

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !isOwnStory) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory?.id, isOwnStory, markAsViewed]);

  // Progress timer
  useEffect(() => {
    if (isPaused || showReplyInput || isVideo) return;

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
  }, [isPaused, showReplyInput, isVideo, goToNextStory]);

  useEffect(() => {
    setProgress(0);
  }, [currentStory?.id]);

  const handleTouchStart = () => !showReplyInput && setIsPaused(true);
  const handleTouchEnd = () => !showReplyInput && setIsPaused(false);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (showReplyInput) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      goToPrevStory();
    } else if (x > (width * 2) / 3) {
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

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStory || !user) return;
    
    setIsSending(true);
    try {
      // Create or get conversation
      const { data: existingConvo } = await supabase
        .from('dm_conversations')
        .select('id')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${currentGroup.user_id}),and(participant_1.eq.${currentGroup.user_id},participant_2.eq.${user.id})`)
        .single();

      let conversationId = existingConvo?.id;

      if (!conversationId) {
        const { data: newConvo } = await supabase
          .from('dm_conversations')
          .insert({
            participant_1: user.id,
            participant_2: currentGroup.user_id
          })
          .select('id')
          .single();
        conversationId = newConvo?.id;
      }

      // Save story reply
      await supabase.from('story_replies').insert({
        story_id: currentStory.id,
        sender_id: user.id,
        recipient_id: currentGroup.user_id,
        message: replyText,
        conversation_id: conversationId
      });

      toast.success(t('stories.replySent'));
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(t('stories.replyFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveToHighlight = async () => {
    if (!currentStory || !isOwnStory) return;
    await saveToHighlight(currentStory.id);
    toast.success(t('stories.savedToHighlight'));
  };

  if (!currentStory) return null;

  if (showingAd) {
    return (
      <StoryAd
        onComplete={handleAdComplete}
        onSkip={handleAdComplete}
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
        className="fixed inset-0 z-50 bg-black touch-none"
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-safe">
          {currentGroup.stories.map((story, index) => (
            <div
              key={story.id}
              className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{
                  width: index < currentStoryIndex 
                    ? '100%' 
                    : index === currentStoryIndex 
                      ? `${progress}%` 
                      : '0%'
                }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-white/50">
              <AvatarImage src={currentGroup.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(currentGroup.display_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm drop-shadow-lg">
                {currentGroup.display_name || 'User'}
              </p>
              <p className="text-white/70 text-xs drop-shadow">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {isOwnStory && (
              <>
                <button
                  onClick={() => setShowViewers(!showViewers)}
                  className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white active:scale-95 transition-transform"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSaveToHighlight}
                  className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white active:scale-95 transition-transform"
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white active:scale-95 transition-transform"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Content with swipe gestures */}
        <motion.div
          className="w-full h-full flex items-center justify-center"
          style={{ x: dragX, opacity: dragOpacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={handleTap}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo ? (
            <video
              src={currentStory.media_url}
              className="max-w-full max-h-full object-contain"
              autoPlay
              playsInline
              muted={false}
              onEnded={goToNextStory}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                const duration = video.duration * 1000;
                // Update progress based on video duration
              }}
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          )}

          {/* Text Overlay with styling */}
          {currentStory.text_overlay && (
            <div
              className={`absolute left-4 right-4 text-center pointer-events-none ${
                currentStory.text_position === 'top' 
                  ? 'top-28' 
                  : currentStory.text_position === 'center'
                    ? 'top-1/2 -translate-y-1/2'
                    : 'bottom-32'
              }`}
            >
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-block font-bold px-4 py-2 rounded-xl ${
                  currentStory.text_background 
                    ? 'backdrop-blur-md' 
                    : ''
                } ${
                  currentStory.text_size === 'small' ? 'text-base' :
                  currentStory.text_size === 'large' ? 'text-3xl' : 'text-xl'
                } ${
                  currentStory.text_font === 'serif' ? 'font-serif' :
                  currentStory.text_font === 'mono' ? 'font-mono' : ''
                }`}
                style={{ 
                  color: currentStory.text_color || '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  backgroundColor: currentStory.text_background || 'transparent'
                }}
              >
                {currentStory.text_overlay}
              </motion.p>
            </div>
          )}

          {/* Stickers */}
          {currentStory.stickers?.map((sticker) => (
            <div
              key={sticker.id}
              className="absolute pointer-events-none"
              style={{
                left: `${sticker.position_x}%`,
                top: `${sticker.position_y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`
              }}
            >
              {sticker.sticker_type === 'emoji' && (
                <span className="text-4xl">{sticker.content}</span>
              )}
              {sticker.sticker_type === 'location' && (
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-black">
                  📍 {sticker.content}
                </div>
              )}
              {sticker.sticker_type === 'mention' && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-white">
                  @{sticker.content}
                </div>
              )}
              {sticker.sticker_type === 'time' && (
                <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-mono text-white">
                  {sticker.content}
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Reply Input (for non-own stories) */}
        {!isOwnStory && user && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-safe">
            {showReplyInput ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('stories.replyPlaceholder')}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-full px-5"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                />
                <Button
                  size="icon"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSending}
                  className="h-12 w-12 rounded-full bg-primary"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => {
                  setShowReplyInput(true);
                  setIsPaused(true);
                }}
                className="w-full py-3 px-6 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm font-medium text-center border border-white/20"
              >
                {t('stories.sendMessage')}
              </motion.button>
            )}
          </div>
        )}

        {/* Story Viewers (for own stories) */}
        {isOwnStory && showViewers && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-xl rounded-t-3xl max-h-[60vh] overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">
                  {currentStory.view_count || 0} {t('stories.views')}
                </h3>
                <button
                  onClick={() => setShowViewers(false)}
                  className="p-2 rounded-full bg-white/10 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Viewers list would be fetched and displayed here */}
              <p className="text-white/60 text-sm text-center py-8">
                {t('stories.viewersList')}
              </p>
            </div>
          </motion.div>
        )}

        {/* User indicator dots */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {storyGroups.slice(Math.max(0, currentGroupIndex - 2), currentGroupIndex + 3).map((group, i) => {
            const actualIndex = Math.max(0, currentGroupIndex - 2) + i;
            return (
              <motion.div
                key={group.user_id}
                className={`rounded-full transition-all ${
                  actualIndex === currentGroupIndex 
                    ? 'w-2 h-2 bg-white' 
                    : 'w-1.5 h-1.5 bg-white/40'
                }`}
                layoutId={`dot-${group.user_id}`}
              />
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;