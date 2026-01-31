-- Fix SECURITY DEFINER view issue by setting SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles WITH (security_invoker = on) AS
SELECT 
  id,
  display_name,
  avatar_url,
  CASE WHEN show_city = true THEN city ELSE NULL END as city,
  is_verified
FROM public.profiles;