-- Fix the view to use SECURITY INVOKER instead of DEFINER
DROP VIEW IF EXISTS public.public_host_info;

CREATE VIEW public.public_host_info 
WITH (security_invoker = true) AS 
SELECT 
  id, 
  user_id, 
  rating, 
  events_hosted, 
  verification_status, 
  verified_at,
  created_at
FROM hosts 
WHERE verification_status = 'verified'::verification_status;