-- Create user_streaks table for tracking attendance streaks
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_events_attended INTEGER DEFAULT 0,
  events_this_month INTEGER DEFAULT 0,
  month_reset_date DATE DEFAULT date_trunc('month', CURRENT_DATE)::date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_milestones table for tracking achievements
CREATE TABLE public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, milestone_type, milestone_value)
);

-- Create weekly_recaps table for storing generated recaps
CREATE TABLE public.weekly_recaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  events_attended INTEGER DEFAULT 0,
  total_rsvps INTEGER DEFAULT 0,
  top_venue_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  top_event_type TEXT,
  friends_met INTEGER DEFAULT 0,
  streak_at_week_end INTEGER DEFAULT 0,
  highlights JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Create friend_activity table for caching friend activities (for feed)
CREATE TABLE public.friend_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('rsvp', 'save', 'attend', 'host', 'review')),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_activity ENABLE ROW LEVEL SECURITY;

-- User streaks policies
CREATE POLICY "Users can view own streaks"
ON public.user_streaks FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streaks"
ON public.user_streaks FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streaks"
ON public.user_streaks FOR UPDATE
USING (user_id = auth.uid());

-- User milestones policies
CREATE POLICY "Users can view own milestones"
ON public.user_milestones FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert milestones"
ON public.user_milestones FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Weekly recaps policies
CREATE POLICY "Users can view own recaps"
ON public.weekly_recaps FOR SELECT
USING (user_id = auth.uid());

-- Friend activity policies - can view activities of people you follow
CREATE POLICY "Users can view friend activities"
ON public.friend_activity FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_connections 
    WHERE follower_id = auth.uid() 
    AND following_id = friend_activity.user_id 
    AND status = 'active'
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can insert own activities"
ON public.friend_activity FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX idx_weekly_recaps_user_week ON public.weekly_recaps(user_id, week_start);
CREATE INDEX idx_friend_activity_user_created ON public.friend_activity(user_id, created_at DESC);
CREATE INDEX idx_friend_activity_created ON public.friend_activity(created_at DESC);

-- Trigger for updated_at on user_streaks
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Function to record friend activity when user RSVPs
CREATE OR REPLACE FUNCTION public.record_rsvp_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.friend_activity (user_id, activity_type, event_id)
  VALUES (NEW.user_id, 'rsvp', NEW.event_id);
  
  -- Update user streak
  INSERT INTO public.user_streaks (user_id, current_streak, last_activity_date, total_events_attended, events_this_month)
  VALUES (NEW.user_id, 1, CURRENT_DATE, 1, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE 
      WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
      WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE 
        WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
        ELSE 1
      END
    ),
    last_activity_date = CURRENT_DATE,
    total_events_attended = user_streaks.total_events_attended + 1,
    events_this_month = CASE
      WHEN user_streaks.month_reset_date = date_trunc('month', CURRENT_DATE)::date 
      THEN user_streaks.events_this_month + 1
      ELSE 1
    END,
    month_reset_date = date_trunc('month', CURRENT_DATE)::date,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for RSVP activity
CREATE TRIGGER on_rsvp_record_activity
AFTER INSERT ON public.event_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.record_rsvp_activity();

-- Function to record saved event activity
CREATE OR REPLACE FUNCTION public.record_save_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.friend_activity (user_id, activity_type, event_id)
  VALUES (NEW.user_id, 'save', NEW.event_id);
  RETURN NEW;
END;
$$;

-- Create trigger for save activity
CREATE TRIGGER on_save_record_activity
AFTER INSERT ON public.saved_events
FOR EACH ROW
EXECUTE FUNCTION public.record_save_activity();