-- Fix infinite recursion in RLS policies by using helper functions
-- The problem: profiles check subscriptions, subscriptions check profiles = infinite loop

-- Drop the problematic policies that cause circular dependency
DROP POLICY IF EXISTS "Active subscribed bartenders are publicly viewable" ON public.bartender_profiles;
DROP POLICY IF EXISTS "Bartenders can view own subscription" ON public.bartender_subscriptions;
DROP POLICY IF EXISTS "Active subscribed DJs are publicly viewable" ON public.dj_profiles;
DROP POLICY IF EXISTS "DJs can view own subscription" ON public.dj_subscriptions;
DROP POLICY IF EXISTS "Active subscribed professionals are publicly viewable" ON public.professionals;
DROP POLICY IF EXISTS "Professionals can view own subscription" ON public.professional_subscriptions;
DROP POLICY IF EXISTS "Users can manage own professional subscription" ON public.professional_subscriptions;

-- Create helper functions to check subscription status without triggering RLS
CREATE OR REPLACE FUNCTION public.has_active_bartender_subscription(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bartender_subscriptions
    WHERE bartender_profile_id = profile_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_active_dj_subscription(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dj_subscriptions
    WHERE dj_profile_id = profile_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_active_professional_subscription(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professional_subscriptions
    WHERE professional_id = profile_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;

-- Create helper function to get user's bartender profile ID
CREATE OR REPLACE FUNCTION public.get_user_bartender_profile_id(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.bartender_profiles WHERE user_id = uid LIMIT 1;
$$;

-- Create helper function to get user's DJ profile ID
CREATE OR REPLACE FUNCTION public.get_user_dj_profile_id(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.dj_profiles WHERE user_id = uid LIMIT 1;
$$;

-- Create helper function to get user's professional profile ID
CREATE OR REPLACE FUNCTION public.get_user_professional_id(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.professionals WHERE user_id = uid LIMIT 1;
$$;

-- Recreate bartender_profiles policy using helper function (no recursion)
CREATE POLICY "Active subscribed bartenders are publicly viewable" 
ON public.bartender_profiles 
FOR SELECT 
USING (
  is_active = true AND has_active_bartender_subscription(id)
);

-- Recreate bartender_subscriptions policy using helper function
CREATE POLICY "Bartenders can view own subscription" 
ON public.bartender_subscriptions 
FOR SELECT 
USING (
  bartender_profile_id = get_user_bartender_profile_id(auth.uid())
);

-- Recreate dj_profiles policy using helper function (no recursion)
CREATE POLICY "Active subscribed DJs are publicly viewable" 
ON public.dj_profiles 
FOR SELECT 
USING (
  is_active = true AND has_active_dj_subscription(id)
);

-- Recreate dj_subscriptions policy using helper function
CREATE POLICY "DJs can view own subscription" 
ON public.dj_subscriptions 
FOR SELECT 
USING (
  dj_profile_id = get_user_dj_profile_id(auth.uid())
);

-- Recreate professionals policy using helper function (no recursion)
CREATE POLICY "Active subscribed professionals are publicly viewable" 
ON public.professionals 
FOR SELECT 
USING (
  is_active = true AND has_active_professional_subscription(id)
);

-- Recreate professional_subscriptions policies using helper function
CREATE POLICY "Professionals can view own subscription" 
ON public.professional_subscriptions 
FOR SELECT 
USING (
  professional_id = get_user_professional_id(auth.uid())
);

CREATE POLICY "Users can manage own professional subscription" 
ON public.professional_subscriptions 
FOR ALL 
USING (
  professional_id = get_user_professional_id(auth.uid())
)
WITH CHECK (
  professional_id = get_user_professional_id(auth.uid())
);