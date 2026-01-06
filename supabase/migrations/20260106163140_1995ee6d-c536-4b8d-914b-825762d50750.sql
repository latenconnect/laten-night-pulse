-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Fixes 3 critical security vulnerabilities
-- =====================================================

-- 1. PROTECT PROFILES TABLE - Only expose safe fields for search
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles for search" ON public.profiles;

-- Create a more restrictive policy - users can view their own full profile
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Drop and recreate safe_profiles view
DROP VIEW IF EXISTS public.safe_profiles CASCADE;
CREATE VIEW public.safe_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  city,
  is_verified
FROM public.profiles;

-- Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;

-- 2. PROTECT CLUB_CLAIMS TABLE - Only claim owners can see their claims
DROP POLICY IF EXISTS "Users can view their own claims" ON public.club_claims;
DROP POLICY IF EXISTS "Users can view their claims" ON public.club_claims;

-- Owners can only see their own claims
CREATE POLICY "Users can view only their own claims" 
ON public.club_claims 
FOR SELECT 
USING (auth.uid() = user_id);

-- Owners can insert their own claims
DROP POLICY IF EXISTS "Users can submit claims" ON public.club_claims;
CREATE POLICY "Users can submit their own claims" 
ON public.club_claims 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. PROTECT CLUBS TABLE - Drop and recreate public-safe view
DROP VIEW IF EXISTS public.public_clubs CASCADE;
CREATE VIEW public.public_clubs AS
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

-- Grant access to the safe view
GRANT SELECT ON public.public_clubs TO authenticated;
GRANT SELECT ON public.public_clubs TO anon;

-- 4. Add rate limiting helper function for future use
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action text,
  _max_per_hour int DEFAULT 100
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN true;
END;
$$;