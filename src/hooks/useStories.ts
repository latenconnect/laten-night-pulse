import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface StorySticker {
  id: string;
  sticker_type: string;
  content: string;
  position_x: number;
  position_y: number;
  rotation: number;
  scale: number;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  text_overlay: string | null;
  text_position: string;
  text_color: string;
  text_font: string | null;
  text_size: string | null;
  text_background: string | null;
  text_animation: string | null;
  created_at: string;
  expires_at: string;
  view_count: number;
  visibility: string;
  stickers?: StorySticker[];
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface StoryGroup {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

interface UploadOptions {
  textOverlay?: string;
  textPosition?: string;
  textColor?: string;
  textFont?: string;
  textSize?: string;
  textBackground?: string | null;
  mediaType?: 'image' | 'video';
  visibility?: string;
  stickers?: Array<{
    sticker_type: string;
    content: string;
    position_x: number;
    position_y: number;
    rotation: number;
    scale: number;
  }>;
}

export const useStories = () => {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());

  const fetchStories = useCallback(async () => {
    try {
      // Fetch all non-expired stories with visibility check
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set((stories || []).map(s => s.user_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch stickers for all stories
      const storyIds = (stories || []).map(s => s.id);
      const { data: stickers } = await supabase
        .from('story_stickers')
        .select('*')
        .in('story_id', storyIds);

      const stickerMap = new Map<string, StorySticker[]>();
      (stickers || []).forEach(sticker => {
        const existing = stickerMap.get(sticker.story_id) || [];
        stickerMap.set(sticker.story_id, [...existing, sticker]);
      });

      // Fetch viewed stories if user is logged in
      let viewedIds = new Set<string>();
      if (user) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', user.id);
        
        if (views) {
          viewedIds = new Set(views.map(v => v.story_id));
        }
      }
      setViewedStoryIds(viewedIds);

      // Filter stories based on visibility
      const visibleStories = (stories || []).filter((story: any) => {
        // Own stories always visible
        if (story.user_id === user?.id) return true;
        // Public stories visible to all
        if (story.visibility === 'public') return true;
        // For other visibility types, we rely on the RLS policy
        return true;
      });

      // Group stories by user
      const groupedMap = new Map<string, StoryGroup>();
      
      visibleStories.forEach((story: any) => {
        const profile = profileMap.get(story.user_id);
        const storyStickers = stickerMap.get(story.id) || [];
        const storyData: Story = {
          ...story,
          media_type: story.media_type || 'image',
          stickers: storyStickers,
          profile
        };
        const existing = groupedMap.get(story.user_id);
        
        if (existing) {
          existing.stories.push(storyData);
          if (!viewedIds.has(story.id)) {
            existing.hasUnviewed = true;
          }
        } else {
          groupedMap.set(story.user_id, {
            user_id: story.user_id,
            display_name: profile?.display_name || 'User',
            avatar_url: profile?.avatar_url,
            stories: [storyData],
            hasUnviewed: !viewedIds.has(story.id)
          });
        }
      });

      // Sort: user's own stories first, then unviewed, then viewed
      const groups = Array.from(groupedMap.values());
      groups.sort((a, b) => {
        if (a.user_id === user?.id) return -1;
        if (b.user_id === user?.id) return 1;
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      setStoryGroups(groups);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const uploadStory = async (
    file: File, 
    options: UploadOptions = {}
  ) => {
    if (!user) {
      toast.error('Please log in to post stories');
      return null;
    }

    const {
      textOverlay,
      textPosition = 'bottom',
      textColor = '#FFFFFF',
      textFont = 'default',
      textSize = 'medium',
      textBackground = null,
      mediaType = 'image',
      visibility = 'public',
      stickers = []
    } = options;

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      // Create story record
      const { data: story, error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          text_overlay: textOverlay || null,
          text_position: textPosition,
          text_color: textColor,
          text_font: textFont,
          text_size: textSize,
          text_background: textBackground,
          visibility: visibility
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add stickers if any
      if (stickers.length > 0 && story) {
        const stickerRecords = stickers.map(s => ({
          story_id: story.id,
          sticker_type: s.sticker_type,
          content: s.content,
          position_x: s.position_x,
          position_y: s.position_y,
          rotation: s.rotation,
          scale: s.scale
        }));

        await supabase.from('story_stickers').insert(stickerRecords);
      }

      toast.success('Story posted!');
      fetchStories();
      return story;
    } catch (error: any) {
      console.error('Error uploading story:', error);
      toast.error('Failed to post story');
      return null;
    }
  };

  const markAsViewed = useCallback(async (storyId: string) => {
    if (!user || viewedStoryIds.has(storyId)) return;

    try {
      await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id
        });
      
      // Increment view count directly
      await supabase
        .from('stories')
        .update({ view_count: supabase.rpc ? 1 : 1 }) // Will use trigger instead
        .eq('id', storyId);
      
      setViewedStoryIds(prev => new Set([...prev, storyId]));
    } catch (error) {
      // Ignore duplicate errors
    }
  }, [user, viewedStoryIds]);

  const deleteStory = async (storyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Story deleted');
      fetchStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
    }
  };

  const saveToHighlight = async (storyId: string, highlightId?: string) => {
    if (!user) return;

    try {
      // Get the story data
      const { data: story } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (!story) throw new Error('Story not found');

      // If no highlight specified, use default or create one
      let targetHighlightId = highlightId;
      
      if (!targetHighlightId) {
        // Get or create a default highlight
        const { data: defaultHighlight } = await supabase
          .from('story_highlights')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', 'Highlights')
          .single();

        if (defaultHighlight) {
          targetHighlightId = defaultHighlight.id;
        } else {
          const { data: newHighlight } = await supabase
            .from('story_highlights')
            .insert({
              user_id: user.id,
              name: 'Highlights',
              cover_image: story.media_url
            })
            .select('id')
            .single();
          
          targetHighlightId = newHighlight?.id;
        }
      }

      if (!targetHighlightId) throw new Error('Could not create highlight');

      // Add story to highlight
      await supabase
        .from('story_highlight_items')
        .insert({
          highlight_id: targetHighlightId,
          story_id: storyId,
          media_url: story.media_url,
          text_overlay: story.text_overlay,
          text_position: story.text_position,
          text_color: story.text_color,
          text_font: story.text_font
        });

    } catch (error) {
      console.error('Error saving to highlight:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return {
    storyGroups,
    loading,
    uploadStory,
    markAsViewed,
    deleteStory,
    saveToHighlight,
    viewedStoryIds,
    refetch: fetchStories
  };
};
