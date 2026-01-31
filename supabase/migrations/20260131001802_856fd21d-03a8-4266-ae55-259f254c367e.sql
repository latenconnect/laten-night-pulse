-- Add show_city privacy toggle to profiles (default false = hidden)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_city boolean DEFAULT false;

-- Update safe_profiles view to respect privacy setting
DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  CASE WHEN show_city = true THEN city ELSE NULL END as city,
  is_verified
FROM public.profiles;