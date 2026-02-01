-- =====================================================
-- LORE BUILDER: Event Stories & Night Recaps
-- =====================================================

-- Event lore clips (5-second vibe clips from attendees)
CREATE TABLE public.event_lore_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'video' CHECK (media_type IN ('video', 'image', 'meme')),
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Night recap summaries (auto-generated wrapped style)
CREATE TABLE public.night_recaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recap_date DATE NOT NULL DEFAULT CURRENT_DATE,
  venues_visited UUID[] DEFAULT '{}',
  friends_met UUID[] DEFAULT '{}',
  total_hours NUMERIC(4,2) DEFAULT 0,
  top_genre TEXT,
  highlight_clips UUID[] DEFAULT '{}',
  montage_url TEXT,
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shared_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, recap_date)
);

-- =====================================================
-- PARTY QUESTS & XP GAMIFICATION
-- =====================================================

-- User XP and levels
CREATE TABLE public.user_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  xp_this_week INTEGER DEFAULT 0,
  xp_this_month INTEGER DEFAULT 0,
  week_reset_date DATE DEFAULT date_trunc('week', CURRENT_DATE)::date,
  month_reset_date DATE DEFAULT date_trunc('month', CURRENT_DATE)::date,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Achievements/badges
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  category TEXT NOT NULL DEFAULT 'explorer' CHECK (category IN ('explorer', 'social', 'loyalty', 'pioneer', 'legendary')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User earned achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Party quests (daily/weekly challenges)
CREATE TABLE public.party_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  quest_type TEXT NOT NULL DEFAULT 'daily' CHECK (quest_type IN ('daily', 'weekly', 'special')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User quest progress
CREATE TABLE public.user_quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.party_quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

-- Leaderboard cache (weekly/monthly)
CREATE TABLE public.leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'alltime')),
  period_start DATE NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- =====================================================
-- SOFT CLUBBING & WELLNESS
-- =====================================================

-- Sober/wellness event tags (extend events)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_sober_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wellness_tags TEXT[] DEFAULT '{}';

-- Safety buddy system
CREATE TABLE public.safety_buddies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buddy_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, buddy_id)
);

-- Safety check-ins
CREATE TABLE public.safety_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'out' CHECK (status IN ('out', 'safe', 'alert')),
  expected_home_time TIMESTAMP WITH TIME ZONE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  location_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ICEBREAKER GROUPS (Pre-event chat rooms)
-- =====================================================

CREATE TABLE public.icebreaker_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL DEFAULT 'general' CHECK (room_type IN ('general', 'rave_squad', 'ride_share', 'first_timers', 'solo_goers')),
  max_members INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.icebreaker_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.icebreaker_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE public.icebreaker_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.icebreaker_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.event_lore_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.night_recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_buddies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icebreaker_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icebreaker_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icebreaker_messages ENABLE ROW LEVEL SECURITY;

-- Event lore clips - public read, authenticated create own
CREATE POLICY "Anyone can view active lore clips" ON public.event_lore_clips FOR SELECT USING (is_active = true AND expires_at > now());
CREATE POLICY "Users can create own clips" ON public.event_lore_clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own clips" ON public.event_lore_clips FOR DELETE USING (auth.uid() = user_id);

-- Night recaps - own only
CREATE POLICY "Users can view own recaps" ON public.night_recaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recaps" ON public.night_recaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recaps" ON public.night_recaps FOR UPDATE USING (auth.uid() = user_id);

-- XP - public read, own write
CREATE POLICY "Anyone can view XP" ON public.user_xp FOR SELECT USING (true);
CREATE POLICY "Users can manage own XP" ON public.user_xp FOR ALL USING (auth.uid() = user_id);

-- Achievements - public read
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (is_secret = false OR EXISTS (SELECT 1 FROM public.user_achievements WHERE achievement_id = achievements.id AND user_id = auth.uid()));

-- User achievements - public read
CREATE POLICY "Anyone can view earned achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "System can grant achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Quests - public read
CREATE POLICY "Anyone can view active quests" ON public.party_quests FOR SELECT USING (is_active = true AND expires_at > now());

-- Quest progress - own only
CREATE POLICY "Users can view own quest progress" ON public.user_quest_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quest progress" ON public.user_quest_progress FOR ALL USING (auth.uid() = user_id);

-- Leaderboards - public read
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards FOR SELECT USING (true);

-- Safety buddies - participants only
CREATE POLICY "Users can view own buddy relationships" ON public.safety_buddies FOR SELECT USING (auth.uid() = user_id OR auth.uid() = buddy_id);
CREATE POLICY "Users can add buddies" ON public.safety_buddies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own buddy links" ON public.safety_buddies FOR DELETE USING (auth.uid() = user_id);

-- Safety checkins - own and buddies
CREATE POLICY "Users can view own checkins and buddies" ON public.safety_checkins FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.safety_buddies WHERE buddy_id = auth.uid() AND user_id = safety_checkins.user_id AND is_active = true)
);
CREATE POLICY "Users can create own checkins" ON public.safety_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.safety_checkins FOR UPDATE USING (auth.uid() = user_id);

-- Icebreaker rooms - public read for event attendees
CREATE POLICY "Anyone can view active rooms" ON public.icebreaker_rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Hosts can create rooms" ON public.icebreaker_rooms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.events e JOIN public.hosts h ON e.host_id = h.id WHERE e.id = event_id AND h.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Icebreaker members
CREATE POLICY "Room members can view members" ON public.icebreaker_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.icebreaker_members WHERE room_id = icebreaker_members.room_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.icebreaker_rooms WHERE id = room_id AND is_active = true)
);
CREATE POLICY "Users can join rooms" ON public.icebreaker_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.icebreaker_members FOR DELETE USING (auth.uid() = user_id);

-- Icebreaker messages
CREATE POLICY "Room members can view messages" ON public.icebreaker_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.icebreaker_members WHERE room_id = icebreaker_messages.room_id AND user_id = auth.uid())
);
CREATE POLICY "Room members can send messages" ON public.icebreaker_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.icebreaker_members WHERE room_id = icebreaker_messages.room_id AND user_id = auth.uid())
);

-- =====================================================
-- SEED ACHIEVEMENTS
-- =====================================================

INSERT INTO public.achievements (name, description, icon, xp_reward, category, requirement_type, requirement_value) VALUES
-- Explorer achievements
('First Night Out', 'Attend your first event', '🌙', 50, 'explorer', 'events_attended', 1),
('District Hopper', 'Visit 5 different districts', '🗺️', 100, 'explorer', 'districts_visited', 5),
('Venue Explorer', 'Check into 10 different venues', '🏛️', 150, 'explorer', 'venues_visited', 10),
('Underground Scout', 'Discover 3 hidden gems', '🔦', 200, 'pioneer', 'hidden_gems', 3),
('Ruin Bar Master', 'Visit all major ruin bars', '🍺', 300, 'explorer', 'ruin_bars', 5),

-- Social achievements
('Squad Goals', 'Attend an event with 3+ friends', '👯', 75, 'social', 'group_attendance', 3),
('Icebreaker', 'Join your first icebreaker chat', '💬', 50, 'social', 'icebreaker_joins', 1),
('Party Connector', 'Meet 10 new people', '🤝', 150, 'social', 'connections_made', 10),
('Lore Keeper', 'Post 5 vibe clips', '📹', 100, 'social', 'clips_posted', 5),

-- Loyalty achievements
('Weekly Warrior', 'Maintain a 4-week streak', '🔥', 200, 'loyalty', 'streak_weeks', 4),
('Night Owl', 'Check in after midnight 10 times', '🦉', 150, 'loyalty', 'late_checkins', 10),
('Early Bird', 'Attend 5 morning/day events', '🌅', 100, 'loyalty', 'day_events', 5),

-- Pioneer achievements
('Trendsetter', 'Be first to RSVP to 3 events', '⭐', 100, 'pioneer', 'first_rsvp', 3),
('Beta Tester', 'Use a new feature first', '🧪', 50, 'pioneer', 'beta_features', 1),

-- Legendary (secret)
('Legend', 'Reach level 50', '👑', 1000, 'legendary', 'level_reached', 50);

-- =====================================================
-- SEED PARTY QUESTS
-- =====================================================

INSERT INTO public.party_quests (title, description, xp_reward, quest_type, requirement_type, requirement_value, expires_at) VALUES
('Weekend Warrior', 'Attend 2 events this weekend', 150, 'weekly', 'events_attended', 2, now() + INTERVAL '7 days'),
('Social Butterfly', 'Connect with 3 new people', 100, 'weekly', 'connections_made', 3, now() + INTERVAL '7 days'),
('Lore Contributor', 'Post a vibe clip at any event', 75, 'daily', 'clips_posted', 1, now() + INTERVAL '1 day'),
('Safety First', 'Set up a safety buddy', 50, 'daily', 'safety_buddies', 1, now() + INTERVAL '1 day'),
('Explorer Mode', 'Visit a new venue', 100, 'daily', 'new_venues', 1, now() + INTERVAL '1 day');

-- =====================================================
-- XP HELPER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_xp INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Upsert XP record
  INSERT INTO public.user_xp (user_id, total_xp, xp_this_week, xp_this_month)
  VALUES (p_user_id, p_xp, p_xp, p_xp)
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_xp,
    xp_this_week = CASE 
      WHEN user_xp.week_reset_date = date_trunc('week', CURRENT_DATE)::date 
      THEN user_xp.xp_this_week + p_xp 
      ELSE p_xp 
    END,
    xp_this_month = CASE 
      WHEN user_xp.month_reset_date = date_trunc('month', CURRENT_DATE)::date 
      THEN user_xp.xp_this_month + p_xp 
      ELSE p_xp 
    END,
    week_reset_date = date_trunc('week', CURRENT_DATE)::date,
    month_reset_date = date_trunc('month', CURRENT_DATE)::date,
    updated_at = now()
  RETURNING total_xp INTO v_new_total;

  -- Calculate new level (100 XP per level, exponential curve)
  v_new_level := GREATEST(1, FLOOR(SQRT(v_new_total / 50))::INTEGER);

  -- Update level if changed
  UPDATE public.user_xp 
  SET current_level = v_new_level 
  WHERE user_id = p_user_id AND current_level != v_new_level;
END;
$$;