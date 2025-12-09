import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  text_overlay: string | null;
  text_position: string;
  text_color: string;
  created_at: string;
  expires_at: string;
  view_count: number;
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

export const useStories = () => {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());

  const fetchStories = async () => {
    try {
      // Fetch all non-expired stories with profile info
      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          profile:profiles!stories_user_id_fkey(display_name, avatar_url)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      // Group stories by user
      const groupedMap = new Map<string, StoryGroup>();
      
      (stories || []).forEach((story: any) => {
        const existing = groupedMap.get(story.user_id);
        const storyData: Story = {
          ...story,
          profile: story.profile
        };
        
        if (existing) {
          existing.stories.push(storyData);
          if (!viewedIds.has(story.id)) {
            existing.hasUnviewed = true;
          }
        } else {
          groupedMap.set(story.user_id, {
            user_id: story.user_id,
            display_name: story.profile?.display_name || 'User',
            avatar_url: story.profile?.avatar_url,
            stories: [storyData],
            hasUnviewed: !viewedIds.has(story.id)
          });
        }
      });

      // Sort: user's own stories first, then others
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
  };

  const uploadStory = async (file: File, textOverlay?: string, textPosition?: string, textColor?: string) => {
    if (!user) {
      toast.error('Please log in to post stories');
      return null;
    }

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
          text_overlay: textOverlay || null,
          text_position: textPosition || 'bottom',
          text_color: textColor || '#FFFFFF'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Story posted!');
      fetchStories();
      return story;
    } catch (error: any) {
      console.error('Error uploading story:', error);
      toast.error('Failed to post story');
      return null;
    }
  };

  const markAsViewed = async (storyId: string) => {
    if (!user || viewedStoryIds.has(storyId)) return;

    try {
      await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id
        });
      
      setViewedStoryIds(prev => new Set([...prev, storyId]));
    } catch (error) {
      // Ignore duplicate errors
    }
  };

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

  useEffect(() => {
    fetchStories();
  }, [user]);

  return {
    storyGroups,
    loading,
    uploadStory,
    markAsViewed,
    deleteStory,
    viewedStoryIds,
    refetch: fetchStories
  };
};
