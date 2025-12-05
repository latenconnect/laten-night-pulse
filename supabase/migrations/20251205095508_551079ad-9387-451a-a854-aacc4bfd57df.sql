-- Fix hosts table RLS policy to restrict sensitive verification_documents access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view verified host basic info" ON hosts;

-- Create a more restrictive policy that only allows viewing sensitive data to owner/admin
-- Public users can only see basic info about verified hosts (via a separate policy)
CREATE POLICY "Users can view own host profile or admin" ON hosts 
FOR SELECT USING (
  user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create a view for public host info that excludes sensitive columns
CREATE OR REPLACE VIEW public.public_host_info AS 
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