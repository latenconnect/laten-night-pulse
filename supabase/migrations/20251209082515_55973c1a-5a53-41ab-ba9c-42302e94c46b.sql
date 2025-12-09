-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  text_overlay TEXT,
  text_position TEXT DEFAULT 'bottom',
  text_color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  view_count INTEGER DEFAULT 0
);

-- Create friendships/follows table
CREATE TABLE public.user_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'follow' CHECK (connection_type IN ('follow', 'friend_request', 'friend')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create story views table to track who viewed stories
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Anyone can view non-expired stories" ON public.stories
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- User connections policies
CREATE POLICY "Users can view connections involving them" ON public.user_connections
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create follows/requests" ON public.user_connections
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update their own connections" ON public.user_connections
  FOR UPDATE USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can delete own connections" ON public.user_connections
  FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Story views policies
CREATE POLICY "Users can view story views for their stories" ON public.story_views
  FOR SELECT USING (
    story_id IN (SELECT id FROM public.stories WHERE user_id = auth.uid())
    OR viewer_id = auth.uid()
  );

CREATE POLICY "Users can mark stories as viewed" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Add display_name to profiles for friend search (if not exists, it already exists)
-- Create index for faster friend search
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_stories_user_expires ON public.stories(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_connections_follower ON public.user_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_following ON public.user_connections(following_id);

-- Create storage bucket for story media
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true);

-- Storage policies for stories bucket
CREATE POLICY "Anyone can view story images" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY "Users can upload own stories" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own story files" ON storage.objects
  FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to clean up expired stories (can be called by cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$;