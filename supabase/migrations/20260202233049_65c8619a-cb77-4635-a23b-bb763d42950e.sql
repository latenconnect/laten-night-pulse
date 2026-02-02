-- =====================================================
-- PARTY REPUTATION SYSTEM
-- =====================================================

-- User reputation scores
CREATE TABLE public.user_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_rep INTEGER NOT NULL DEFAULT 0,
  reputation_level TEXT NOT NULL DEFAULT 'newcomer',
  events_attended INTEGER NOT NULL DEFAULT 0,
  events_ghosted INTEGER NOT NULL DEFAULT 0,
  average_vibe_rating NUMERIC(3,2) DEFAULT NULL,
  total_vibe_votes INTEGER NOT NULL DEFAULT 0,
  violations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event check-ins via QR code
CREATE TABLE public.event_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  qr_code_id UUID DEFAULT NULL,
  duration_minutes INTEGER DEFAULT NULL,
  rep_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- QR codes for event check-ins
CREATE TABLE public.event_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scans_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Anonymous vibe ratings
CREATE TABLE public.vibe_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL,
  rated_user_id UUID NOT NULL,
  vibe_score INTEGER NOT NULL CHECK (vibe_score >= 1 AND vibe_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, rater_user_id, rated_user_id)
);

-- Reputation violations
CREATE TABLE public.reputation_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  violation_type TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  rep_penalty INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TONIGHT MODE
-- =====================================================

CREATE TABLE public.event_heat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  heat_level INTEGER NOT NULL DEFAULT 0 CHECK (heat_level >= 0 AND heat_level <= 100),
  current_attendees INTEGER NOT NULL DEFAULT 0,
  peak_attendees INTEGER NOT NULL DEFAULT 0,
  vibe_tags TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.friend_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available',
  visible_to TEXT NOT NULL DEFAULT 'friends',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- FRIENDS-TO-PARTY MATCHING
-- =====================================================

CREATE TABLE public.party_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  energy_level TEXT NOT NULL DEFAULT 'balanced',
  music_vibes TEXT[] DEFAULT '{}',
  city TEXT DEFAULT 'Budapest',
  max_distance_km INTEGER DEFAULT 20,
  age_range_min INTEGER DEFAULT 18,
  age_range_max INTEGER DEFAULT 99,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.party_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  matched_user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  connection_type TEXT NOT NULL DEFAULT 'solo',
  connection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '12 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, matched_user_id, connection_date)
);

CREATE TABLE public.party_match_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT DEFAULT NULL,
  target_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  energy_level TEXT NOT NULL DEFAULT 'balanced',
  looking_for_size INTEGER DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '8 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.party_match_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.party_match_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE public.group_match_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requesting_group_id UUID NOT NULL REFERENCES public.party_match_groups(id) ON DELETE CASCADE,
  target_group_id UUID NOT NULL REFERENCES public.party_match_groups(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requesting_group_id, target_group_id)
);

-- =====================================================
-- PARTY TIMELINE
-- =====================================================

CREATE TABLE public.party_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_city TEXT DEFAULT 'Budapest',
  attended_date DATE NOT NULL,
  duration_hours NUMERIC(4,1) DEFAULT NULL,
  rep_earned INTEGER NOT NULL DEFAULT 0,
  highlight_moment TEXT DEFAULT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.flex_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT NULL,
  stats JSONB DEFAULT '{}',
  share_code TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENHANCED DJ/HOST PROFILES
-- =====================================================

CREATE TABLE public.talent_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_user_id UUID NOT NULL,
  dj_profile_id UUID REFERENCES public.dj_profiles(id) ON DELETE CASCADE,
  bartender_profile_id UUID REFERENCES public.bartender_profiles(id) ON DELETE CASCADE,
  host_id UUID REFERENCES public.hosts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (
    (dj_profile_id IS NOT NULL AND bartender_profile_id IS NULL AND host_id IS NULL) OR
    (dj_profile_id IS NULL AND bartender_profile_id IS NOT NULL AND host_id IS NULL) OR
    (dj_profile_id IS NULL AND bartender_profile_id IS NULL AND host_id IS NOT NULL)
  )
);

-- =====================================================
-- SOFT EXCLUSIVITY TIERS
-- =====================================================

CREATE TABLE public.event_access_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  min_rep_level TEXT DEFAULT NULL,
  min_rep_score INTEGER DEFAULT NULL,
  early_access_hours INTEGER DEFAULT NULL,
  max_capacity INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_heat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_match_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_match_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flex_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_access_tiers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- User Reputation
CREATE POLICY "Users can view all reputation" ON public.user_reputation FOR SELECT USING (true);
CREATE POLICY "Users can manage own reputation" ON public.user_reputation FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Event Check-ins
CREATE POLICY "Users can view own check-ins" ON public.event_check_ins FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Event hosts can view check-ins" ON public.event_check_ins FOR SELECT USING (
  event_id IN (SELECT e.id FROM events e JOIN hosts h ON e.host_id = h.id WHERE h.user_id = auth.uid())
);
CREATE POLICY "Users can check in" ON public.event_check_ins FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own check-in" ON public.event_check_ins FOR UPDATE USING (user_id = auth.uid());

-- Event QR Codes
CREATE POLICY "Anyone can view active QR codes" ON public.event_qr_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Event hosts can manage QR codes" ON public.event_qr_codes FOR ALL USING (
  event_id IN (SELECT e.id FROM events e JOIN hosts h ON e.host_id = h.id WHERE h.user_id = auth.uid())
);

-- Vibe Ratings
CREATE POLICY "Users can rate others" ON public.vibe_ratings FOR INSERT WITH CHECK (rater_user_id = auth.uid() AND rated_user_id != auth.uid());
CREATE POLICY "Users can view own ratings" ON public.vibe_ratings FOR SELECT USING (rated_user_id = auth.uid() OR rater_user_id = auth.uid());

-- Reputation Violations
CREATE POLICY "Users can view own violations" ON public.reputation_violations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage violations" ON public.reputation_violations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Event Heat
CREATE POLICY "Anyone can view event heat" ON public.event_heat FOR SELECT USING (true);
CREATE POLICY "Hosts can update event heat" ON public.event_heat FOR ALL USING (
  event_id IN (SELECT e.id FROM events e JOIN hosts h ON e.host_id = h.id WHERE h.user_id = auth.uid())
);

-- Friend Locations
CREATE POLICY "Users can manage own location" ON public.friend_locations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Friends can view locations" ON public.friend_locations FOR SELECT USING (
  (visible_to = 'friends' AND EXISTS (
    SELECT 1 FROM user_connections WHERE follower_id = auth.uid() AND following_id = friend_locations.user_id
  )) OR
  (visible_to = 'close_friends' AND EXISTS (
    SELECT 1 FROM close_friends WHERE user_id = friend_locations.user_id AND friend_id = auth.uid()
  ))
);

-- Party Preferences
CREATE POLICY "Users can manage own preferences" ON public.party_preferences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view others for matching" ON public.party_preferences FOR SELECT USING (true);

-- Party Connections
CREATE POLICY "Users can view own connections" ON public.party_connections FOR SELECT USING (user_id = auth.uid() OR matched_user_id = auth.uid());
CREATE POLICY "Users can create connections" ON public.party_connections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update connections" ON public.party_connections FOR UPDATE USING (user_id = auth.uid() OR matched_user_id = auth.uid());

-- Party Match Groups
CREATE POLICY "Anyone can view active groups" ON public.party_match_groups FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create groups" ON public.party_match_groups FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators can manage groups" ON public.party_match_groups FOR ALL USING (creator_id = auth.uid());

-- Party Match Group Members
CREATE POLICY "Anyone can view group members" ON public.party_match_group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.party_match_group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave groups" ON public.party_match_group_members FOR DELETE USING (user_id = auth.uid());

-- Group Match Requests
CREATE POLICY "Group members can view requests" ON public.group_match_requests FOR SELECT USING (
  requesting_group_id IN (SELECT group_id FROM party_match_group_members WHERE user_id = auth.uid()) OR
  target_group_id IN (SELECT group_id FROM party_match_group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group creators can request" ON public.group_match_requests FOR INSERT WITH CHECK (
  requesting_group_id IN (SELECT id FROM party_match_groups WHERE creator_id = auth.uid())
);
CREATE POLICY "Target creators can respond" ON public.group_match_requests FOR UPDATE USING (
  target_group_id IN (SELECT id FROM party_match_groups WHERE creator_id = auth.uid())
);

-- Party Timeline
CREATE POLICY "Users can view own timeline" ON public.party_timeline FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Public timelines visible" ON public.party_timeline FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own timeline" ON public.party_timeline FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Flex Cards
CREATE POLICY "Users can manage own cards" ON public.flex_cards FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Public cards visible" ON public.flex_cards FOR SELECT USING (is_public = true);

-- Talent Followers
CREATE POLICY "Anyone can view followers" ON public.talent_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow" ON public.talent_followers FOR ALL USING (follower_user_id = auth.uid()) WITH CHECK (follower_user_id = auth.uid());

-- Event Access Tiers
CREATE POLICY "Anyone can view tiers" ON public.event_access_tiers FOR SELECT USING (true);
CREATE POLICY "Hosts can manage tiers" ON public.event_access_tiers FOR ALL USING (
  event_id IN (SELECT e.id FROM events e JOIN hosts h ON e.host_id = h.id WHERE h.user_id = auth.uid())
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_rep_level(rep_score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF rep_score >= 5000 THEN RETURN 'legend';
  ELSIF rep_score >= 2000 THEN RETURN 'elite';
  ELSIF rep_score >= 500 THEN RETURN 'trusted';
  ELSIF rep_score >= 100 THEN RETURN 'regular';
  ELSE RETURN 'newcomer';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.add_reputation(p_user_id UUID, p_amount INTEGER, p_reason TEXT DEFAULT NULL)
RETURNS void AS $$
DECLARE
  new_total INTEGER;
  new_level TEXT;
BEGIN
  INSERT INTO user_reputation (user_id, total_rep)
  VALUES (p_user_id, GREATEST(0, p_amount))
  ON CONFLICT (user_id) DO UPDATE SET
    total_rep = GREATEST(0, user_reputation.total_rep + p_amount),
    updated_at = now();
  
  SELECT total_rep INTO new_total FROM user_reputation WHERE user_id = p_user_id;
  new_level := calculate_rep_level(new_total);
  UPDATE user_reputation SET reputation_level = new_level WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_event_heat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO event_heat (event_id, current_attendees, heat_level)
  VALUES (NEW.event_id, 1, 10)
  ON CONFLICT (event_id) DO UPDATE SET
    current_attendees = event_heat.current_attendees + 1,
    heat_level = LEAST(100, event_heat.heat_level + 5),
    peak_attendees = GREATEST(event_heat.peak_attendees, event_heat.current_attendees + 1),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_heat_on_checkin
AFTER INSERT ON event_check_ins
FOR EACH ROW EXECUTE FUNCTION update_event_heat();

CREATE OR REPLACE FUNCTION public.award_checkin_rep()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_reputation(NEW.user_id, 10, 'Event check-in');
  UPDATE event_check_ins SET rep_earned = 10 WHERE id = NEW.id;
  UPDATE user_reputation SET events_attended = events_attended + 1 WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER award_rep_on_checkin
AFTER INSERT ON event_check_ins
FOR EACH ROW EXECUTE FUNCTION award_checkin_rep();

CREATE OR REPLACE FUNCTION public.record_ghost(p_user_id UUID, p_event_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO reputation_violations (user_id, violation_type, event_id, rep_penalty, description)
  VALUES (p_user_id, 'ghost', p_event_id, 25, 'Did not attend after RSVP');
  PERFORM add_reputation(p_user_id, -25, 'Ghosted event');
  UPDATE user_reputation SET 
    events_ghosted = events_ghosted + 1,
    violations_count = violations_count + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_expired_connections()
RETURNS void AS $$
BEGIN
  UPDATE party_connections SET status = 'expired' WHERE expires_at < now() AND status = 'pending';
  UPDATE party_match_groups SET is_active = false WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;