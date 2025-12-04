-- Fix security definer views by dropping them and using a different approach
DROP VIEW IF EXISTS public.public_profiles;
DROP VIEW IF EXISTS public.public_hosts;

-- The RLS policies are already in place - we'll handle column filtering at the application level
-- This is the recommended approach for iOS App Store compliance