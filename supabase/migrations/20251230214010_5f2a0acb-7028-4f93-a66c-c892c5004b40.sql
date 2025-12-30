-- Fix security definer view by using SECURITY INVOKER instead
DROP VIEW IF EXISTS public.events_with_privacy;

-- Recreate view with SECURITY INVOKER (default, runs with caller's permissions)
CREATE VIEW public.events_with_privacy 
WITH (security_invoker = true)
AS
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