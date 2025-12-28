-- Fix: Hosts table should not expose user_id to public
-- Drop the overly permissive public policy that exposes user_id
DROP POLICY IF EXISTS "Anyone can view verified host info" ON public.hosts;

-- Create a restrictive policy: only the host themselves can SELECT their own row
-- Using IF NOT EXISTS pattern by dropping first
DROP POLICY IF EXISTS "Users can view their own host profile" ON public.hosts;
CREATE POLICY "Users can view their own host profile"
ON public.hosts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure the view has proper permissions for public access
GRANT SELECT ON public.public_host_info TO anon;
GRANT SELECT ON public.public_host_info TO authenticated;