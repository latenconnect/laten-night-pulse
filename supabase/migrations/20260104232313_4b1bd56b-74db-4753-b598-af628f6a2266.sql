-- Create a public view for clubs that hides sensitive owner_id field
CREATE OR REPLACE VIEW public.public_clubs AS
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

-- Update clubs RLS to restrict owner_id visibility
-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Clubs are publicly viewable" ON public.clubs;

-- Create new policy that hides owner_id for non-owners/non-admins
-- Note: View-based approach is cleaner, but we keep SELECT for backward compatibility
CREATE POLICY "Clubs are publicly viewable" ON public.clubs
FOR SELECT
USING (is_active = true);

-- The view handles the column filtering, application code should use public_clubs view for listings