-- Fix SECURITY DEFINER view warnings by making them SECURITY INVOKER
-- The views intentionally expose only safe fields, but should use invoker security

-- Recreate safe_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_profiles CASCADE;
CREATE VIEW public.safe_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  city,
  is_verified
FROM public.profiles;

GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;

-- Recreate public_clubs view with SECURITY INVOKER  
DROP VIEW IF EXISTS public.public_clubs CASCADE;
CREATE VIEW public.public_clubs
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  city,
  country,
  address,
  latitude,
  longitude,
  rating,
  google_maps_uri,
  photos,
  venue_type,
  is_active,
  is_featured
FROM public.clubs
WHERE is_active = true;

GRANT SELECT ON public.public_clubs TO authenticated;
GRANT SELECT ON public.public_clubs TO anon;

-- We need anon/authenticated to be able to select from the underlying tables
-- but RLS will still protect the data appropriately
-- Add a policy allowing anyone to read basic club info
CREATE POLICY "Anyone can view active clubs basic info" 
ON public.clubs 
FOR SELECT 
USING (is_active = true);