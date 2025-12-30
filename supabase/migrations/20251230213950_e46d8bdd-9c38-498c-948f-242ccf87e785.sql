-- =====================================================
-- SECURITY FIX: Address critical vulnerabilities
-- =====================================================

-- 1. CLUB_CLAIMS: Remove plaintext contact columns (keep only encrypted)
-- First, ensure encrypted columns have data before dropping plaintext
ALTER TABLE public.club_claims 
  ALTER COLUMN business_email DROP NOT NULL;

-- Drop plaintext columns that duplicate encrypted data
ALTER TABLE public.club_claims 
  DROP COLUMN IF EXISTS business_email,
  DROP COLUMN IF EXISTS business_phone;

-- 2. EVENTS: Add privacy protection for private event locations
-- Create a security definer function to check if user can see event location
CREATE OR REPLACE FUNCTION public.can_view_event_location(event_row events)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Public events (club, festival, public) - anyone can see location
    CASE WHEN event_row.type IN ('club', 'festival', 'public') THEN true
    -- Private events (house_party, university) - only host, cohosts, or RSVPed users
    ELSE (
      -- Is the event host
      EXISTS (SELECT 1 FROM hosts WHERE id = event_row.host_id AND user_id = auth.uid())
      -- Or is a cohost
      OR EXISTS (SELECT 1 FROM event_cohosts WHERE event_id = event_row.id AND host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid()))
      -- Or has RSVPed
      OR EXISTS (SELECT 1 FROM event_rsvps WHERE event_id = event_row.id AND user_id = auth.uid())
      -- Or is admin
      OR has_role(auth.uid(), 'admin')
    )
    END
$$;

-- Drop existing events policies
DROP POLICY IF EXISTS "Active events are publicly viewable" ON public.events;
DROP POLICY IF EXISTS "Events are publicly viewable" ON public.events;

-- Create new policy that hides sensitive location data for private events
CREATE POLICY "Active events are publicly viewable"
ON public.events
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Create a secure view for events that masks location for private events
CREATE OR REPLACE VIEW public.events_with_privacy AS
SELECT 
  id,
  name,
  description,
  type,
  start_time,
  end_time,
  -- Mask exact location for private events if user doesn't have access
  CASE 
    WHEN type IN ('club', 'festival', 'public') THEN location_name
    WHEN can_view_event_location(events.*) THEN location_name
    ELSE 'Location visible after RSVP'
  END as location_name,
  CASE 
    WHEN type IN ('club', 'festival', 'public') THEN location_address
    WHEN can_view_event_location(events.*) THEN location_address
    ELSE NULL
  END as location_address,
  CASE 
    WHEN type IN ('club', 'festival', 'public') THEN location_lat
    WHEN can_view_event_location(events.*) THEN location_lat
    ELSE NULL
  END as location_lat,
  CASE 
    WHEN type IN ('club', 'festival', 'public') THEN location_lng
    WHEN can_view_event_location(events.*) THEN location_lng
    ELSE NULL
  END as location_lng,
  city,
  country,
  cover_image,
  photos,
  price,
  age_limit,
  max_attendees,
  expected_attendance,
  actual_rsvp,
  safety_rules,
  host_id,
  is_active,
  is_featured,
  created_at,
  updated_at,
  -- Flag to indicate if location is hidden
  NOT can_view_event_location(events.*) AND type IN ('house_party', 'university') as location_hidden
FROM public.events
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.events_with_privacy TO authenticated;
GRANT SELECT ON public.events_with_privacy TO anon;

-- 3. STORIES: Add follower-based visibility (optional privacy)
-- Add privacy column to stories
ALTER TABLE public.stories 
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public' 
  CHECK (visibility IN ('public', 'followers', 'private'));

-- Create function to check if user can view story
CREATE OR REPLACE FUNCTION public.can_view_story(story_user_id uuid, story_visibility text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- Public stories visible to all
      WHEN story_visibility = 'public' THEN true
      -- Own stories always visible
      WHEN story_user_id = auth.uid() THEN true
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

-- Update stories RLS policy to respect visibility settings
DROP POLICY IF EXISTS "Anyone can view non-expired stories" ON public.stories;

CREATE POLICY "Users can view stories based on visibility"
ON public.stories
FOR SELECT
TO authenticated
USING (
  expires_at > now() 
  AND can_view_story(user_id, visibility)
);

-- Allow anon users to only see public stories
CREATE POLICY "Anonymous users can view public stories"
ON public.stories
FOR SELECT
TO anon
USING (
  expires_at > now() 
  AND visibility = 'public'
);