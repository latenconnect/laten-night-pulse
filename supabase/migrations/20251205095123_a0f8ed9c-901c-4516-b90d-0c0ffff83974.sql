-- Fix profiles table RLS policy - replace overly permissive policy
DROP POLICY IF EXISTS "Users can view public profile info" ON profiles;

-- Create policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (id = auth.uid());