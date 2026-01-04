-- Fix the view to use SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public.public_clubs;

CREATE VIEW public.public_clubs 
WITH (security_invoker = true) AS
SELECT 
  id,
  google_place_id,
  name,
  address,
  city,
  country,
  latitude,
  longitude,
  rating,
  price_level,
  photos,
  google_maps_uri,
  business_status,
  venue_type,
  opening_hours,
  is_featured,
  description,
  services,
  highlights,
  music_genres,
  crowd_info,
  created_at,
  last_updated
FROM public.clubs 
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.public_clubs TO anon, authenticated;

-- Add comment explaining purpose
COMMENT ON VIEW public.public_clubs IS 'Public view of clubs without sensitive owner_id field for privacy';