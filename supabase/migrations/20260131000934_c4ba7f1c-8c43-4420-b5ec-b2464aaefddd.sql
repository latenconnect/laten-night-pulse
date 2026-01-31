-- Add media_type column to stories for video support
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

-- Add font styling columns
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS text_font text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS text_size text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS text_background text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS text_animation text DEFAULT NULL;

-- Create story_stickers table for sticker overlays
CREATE TABLE IF NOT EXISTS public.story_stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  sticker_type text NOT NULL, -- 'emoji', 'location', 'mention', 'gif', 'time', 'poll'
  content text NOT NULL, -- The sticker content/data
  position_x numeric NOT NULL DEFAULT 50, -- Percentage from left
  position_y numeric NOT NULL DEFAULT 50, -- Percentage from top
  rotation numeric DEFAULT 0,
  scale numeric DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create close_friends table
CREATE TABLE IF NOT EXISTS public.close_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create story_hidden_from table (users blocked from seeing stories)
CREATE TABLE IF NOT EXISTS public.story_hidden_from (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- Story owner
  hidden_user_id uuid NOT NULL, -- User who can't see stories
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, hidden_user_id)
);

-- Create story_highlights table
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  cover_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create story_highlight_items table (links stories to highlights)
CREATE TABLE IF NOT EXISTS public.story_highlight_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id uuid REFERENCES public.story_highlights(id) ON DELETE CASCADE NOT NULL,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  media_url text NOT NULL, -- Copy of media URL so it persists after story expires
  text_overlay text,
  text_position text,
  text_color text,
  text_font text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(highlight_id, story_id)
);

-- Create story_replies table (replies go to DMs)
CREATE TABLE IF NOT EXISTS public.story_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  message text NOT NULL,
  conversation_id uuid REFERENCES public.dm_conversations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.story_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_hidden_from ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_stickers
CREATE POLICY "Story owners can manage stickers"
ON public.story_stickers FOR ALL
USING (story_id IN (SELECT id FROM public.stories WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view stickers on viewable stories"
ON public.story_stickers FOR SELECT
USING (story_id IN (
  SELECT id FROM public.stories 
  WHERE can_view_story(user_id, visibility)
));

-- RLS policies for close_friends
CREATE POLICY "Users can manage own close friends"
ON public.close_friends FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can see if they are close friends"
ON public.close_friends FOR SELECT
USING (friend_id = auth.uid());

-- RLS policies for story_hidden_from
CREATE POLICY "Users can manage who to hide from"
ON public.story_hidden_from FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS policies for story_highlights
CREATE POLICY "Highlights are publicly viewable"
ON public.story_highlights FOR SELECT
USING (true);

CREATE POLICY "Users can manage own highlights"
ON public.story_highlights FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS policies for story_highlight_items
CREATE POLICY "Highlight items are publicly viewable"
ON public.story_highlight_items FOR SELECT
USING (highlight_id IN (SELECT id FROM public.story_highlights));

CREATE POLICY "Users can manage own highlight items"
ON public.story_highlight_items FOR ALL
USING (highlight_id IN (SELECT id FROM public.story_highlights WHERE user_id = auth.uid()));

-- RLS policies for story_replies
CREATE POLICY "Senders can create replies"
ON public.story_replies FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Participants can view replies"
ON public.story_replies FOR SELECT
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Update can_view_story function to include close friends and hidden users logic
CREATE OR REPLACE FUNCTION public.can_view_story(story_user_id uuid, story_visibility text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- Own stories always visible
      WHEN story_user_id = auth.uid() THEN true
      -- Check if hidden from this user
      WHEN EXISTS (
        SELECT 1 FROM story_hidden_from 
        WHERE user_id = story_user_id 
        AND hidden_user_id = auth.uid()
      ) THEN false
      -- Public stories visible to all
      WHEN story_visibility = 'public' THEN true
      -- Close friends only: check if viewer is in close friends list
      WHEN story_visibility = 'close_friends' THEN EXISTS (
        SELECT 1 FROM close_friends 
        WHERE user_id = story_user_id 
        AND friend_id = auth.uid()
      )
      -- Followers-only: check if viewer follows the story creator
      WHEN story_visibility = 'followers' THEN EXISTS (
        SELECT 1 FROM user_connections 
        WHERE follower_id = auth.uid() 
        AND following_id = story_user_id
      )
      -- Private stories only visible to owner
      WHEN story_visibility = 'private' THEN story_user_id = auth.uid()
      ELSE false
    END
$$;