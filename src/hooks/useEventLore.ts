import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface LoreClip {
  id: string;
  event_id: string;
  user_id: string;
  media_url: string;
  media_type: 'video' | 'image' | 'meme';
  caption: string | null;
  created_at: string;
  expires_at: string;
  view_count: number;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface NightRecap {
  id: string;
  user_id: string;
  recap_date: string;
  venues_visited: string[];
  friends_met: string[];
  total_hours: number;
  top_genre: string | null;
  highlight_clips: string[];
  montage_url: string | null;
  stats: Record<string, unknown>;
  created_at: string;
  shared_at: string | null;
}

export const useEventLore = (eventId?: string) => {
  const { user } = useAuth();
  const [clips, setClips] = useState<LoreClip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClips = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      const { data: clipsData } = await supabase
        .from('event_lore_clips')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (clipsData && clipsData.length > 0) {
        // Fetch user profiles
        const userIds = [...new Set(clipsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        setClips(clipsData.map(clip => ({
          ...clip,
          media_type: clip.media_type as 'video' | 'image' | 'meme',
          profile: profileMap.get(clip.user_id)
        })));
      } else {
        setClips([]);
      }
    } catch (error) {
      console.error('Error fetching lore clips:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const uploadClip = async (
    file: File,
    caption?: string,
    mediaType: 'video' | 'image' | 'meme' = 'video'
  ): Promise<boolean> => {
    if (!user || !eventId) return false;

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${eventId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      // Create clip record
      const { error: insertError } = await supabase
        .from('event_lore_clips')
        .insert({
          event_id: eventId,
          user_id: user.id,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          caption: caption || null
        });

      if (insertError) throw insertError;

      toast.success('Vibe clip posted! 🎬');
      await fetchClips();
      return true;
    } catch (error) {
      console.error('Error uploading clip:', error);
      toast.error('Failed to post clip');
      return false;
    }
  };

  const deleteClip = async (clipId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await supabase
        .from('event_lore_clips')
        .delete()
        .eq('id', clipId)
        .eq('user_id', user.id);

      toast.success('Clip deleted');
      await fetchClips();
      return true;
    } catch (error) {
      console.error('Error deleting clip:', error);
      toast.error('Failed to delete clip');
      return false;
    }
  };

  const incrementViewCount = async (clipId: string) => {
    try {
      const currentCount = clips.find(c => c.id === clipId)?.view_count ?? 0;
      await supabase
        .from('event_lore_clips')
        .update({ view_count: currentCount + 1 })
        .eq('id', clipId);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  return {
    clips,
    loading,
    uploadClip,
    deleteClip,
    incrementViewCount,
    refetch: fetchClips
  };
};

export const useNightRecaps = () => {
  const { user } = useAuth();
  const [recaps, setRecaps] = useState<NightRecap[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecaps = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('night_recaps')
        .select('*')
        .eq('user_id', user.id)
        .order('recap_date', { ascending: false })
        .limit(10);

      if (data) {
        setRecaps(data as NightRecap[]);
      }
    } catch (error) {
      console.error('Error fetching recaps:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecaps();
  }, [fetchRecaps]);

  const markShared = async (recapId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('night_recaps')
        .update({ shared_at: new Date().toISOString() })
        .eq('id', recapId)
        .eq('user_id', user.id);

      await fetchRecaps();
    } catch (error) {
      console.error('Error marking recap as shared:', error);
    }
  };

  return {
    recaps,
    loading,
    markShared,
    refetch: fetchRecaps
  };
};
