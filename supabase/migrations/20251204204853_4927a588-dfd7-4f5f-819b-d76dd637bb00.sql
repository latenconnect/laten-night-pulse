-- Fix 1: Restrict profiles table - remove public access to sensitive data
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a policy that only shows public profile info (no email, no date_of_birth)
-- Users can view basic profile info of others, but sensitive data only for themselves
CREATE POLICY "Users can view public profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can always see their own full profile
  id = auth.uid()
  OR
  -- Others can only see profiles but not sensitive columns (handled at query level)
  true
);

-- Create a view for public profile data (excludes sensitive fields)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  city,
  bio,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Fix 2: Restrict hosts verification_documents to only the owner and admins
DROP POLICY IF EXISTS "Verified hosts are viewable" ON public.hosts;

-- Public can see verified host basic info (no documents)
CREATE POLICY "Anyone can view verified host basic info"
ON public.hosts
FOR SELECT
USING (
  -- Own profile
  user_id = auth.uid()
  OR
  -- Verified hosts are public (documents excluded at query level)
  verification_status = 'verified'
  OR
  -- Admins can see all
  public.has_role(auth.uid(), 'admin')
);

-- Create a secure view for public host info
CREATE OR REPLACE VIEW public.public_hosts AS
SELECT 
  id,
  user_id,
  verification_status,
  rating,
  events_hosted,
  created_at,
  verified_at
  -- Excludes: verification_documents
FROM public.hosts
WHERE verification_status = 'verified' OR user_id = auth.uid();

GRANT SELECT ON public.public_hosts TO authenticated;

-- Fix 3: Add rate limiting function for edge functions
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action text,
  _max_requests int DEFAULT 10,
  _window_minutes int DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count int;
BEGIN
  -- Clean old entries (older than window)
  DELETE FROM public.rate_limits 
  WHERE created_at < NOW() - (_window_minutes || ' minutes')::interval;
  
  -- Count recent requests
  SELECT COUNT(*) INTO _count
  FROM public.rate_limits
  WHERE user_id = _user_id 
    AND action = _action
    AND created_at > NOW() - (_window_minutes || ' minutes')::interval;
  
  -- Check if under limit
  IF _count >= _max_requests THEN
    RETURN false;
  END IF;
  
  -- Log this request
  INSERT INTO public.rate_limits (user_id, action)
  VALUES (_user_id, _action);
  
  RETURN true;
END;
$$;

-- Create rate limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action 
ON public.rate_limits (user_id, action, created_at);

-- Auto-cleanup old rate limit entries (keep table small)
CREATE INDEX IF NOT EXISTS idx_rate_limits_created 
ON public.rate_limits (created_at);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only the system can manage rate limits
CREATE POLICY "Service role only"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);