-- Add RLS policy to allow authenticated users to search and view public profile info
CREATE POLICY "Authenticated users can view all profiles for search"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);