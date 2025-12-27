-- Add rate limiting to analytics functions and create secure deletion functions

-- Update increment_club_analytics to include rate limiting
CREATE OR REPLACE FUNCTION public.increment_club_analytics(p_club_id uuid, p_field text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate field name against whitelist to prevent SQL injection
  IF p_field NOT IN ('views', 'clicks', 'shares', 'directions_clicks') THEN
    RAISE EXCEPTION 'Invalid field name: %', p_field;
  END IF;

  -- Rate limit: max 10 increments per resource per user per minute
  IF auth.uid() IS NOT NULL AND NOT check_rate_limit(auth.uid(), 'analytics_club_' || p_club_id::text, 10, 1) THEN
    -- Silently ignore rate-limited requests (don't break UX)
    RETURN;
  END IF;

  INSERT INTO public.club_analytics (club_id, date)
  VALUES (p_club_id, CURRENT_DATE)
  ON CONFLICT (club_id, date) DO NOTHING;
  
  EXECUTE format(
    'UPDATE public.club_analytics SET %I = %I + 1 WHERE club_id = $1 AND date = CURRENT_DATE',
    p_field, p_field
  ) USING p_club_id;
END;
$function$;

-- Update increment_event_analytics to include rate limiting
CREATE OR REPLACE FUNCTION public.increment_event_analytics(p_event_id uuid, p_field text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate field name against whitelist to prevent SQL injection
  IF p_field NOT IN ('views', 'clicks', 'shares', 'rsvps', 'ticket_sales') THEN
    RAISE EXCEPTION 'Invalid field name: %', p_field;
  END IF;

  -- Rate limit: max 10 increments per resource per user per minute
  IF auth.uid() IS NOT NULL AND NOT check_rate_limit(auth.uid(), 'analytics_event_' || p_event_id::text, 10, 1) THEN
    -- Silently ignore rate-limited requests (don't break UX)
    RETURN;
  END IF;

  INSERT INTO public.event_analytics (event_id, date)
  VALUES (p_event_id, CURRENT_DATE)
  ON CONFLICT (event_id, date) DO NOTHING;
  
  EXECUTE format(
    'UPDATE public.event_analytics SET %I = %I + 1 WHERE event_id = $1 AND date = CURRENT_DATE',
    p_field, p_field
  ) USING p_event_id;
END;
$function$;

-- Create secure deletion function for bartender profiles (admin only)
CREATE OR REPLACE FUNCTION public.delete_bartender_profile(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;
  
  -- Delete related records first (respecting FK constraints)
  DELETE FROM public.bartender_subscriptions WHERE bartender_profile_id = profile_id;
  DELETE FROM public.bartender_availability WHERE bartender_profile_id = profile_id;
  DELETE FROM public.bartender_booking_requests WHERE bartender_profile_id = profile_id;
  DELETE FROM public.bartender_reviews WHERE bartender_profile_id = profile_id;
  
  -- Delete the profile
  DELETE FROM public.bartender_profiles WHERE id = profile_id;
  
  RETURN true;
END;
$function$;

-- Create secure deletion function for DJ profiles (admin only)
CREATE OR REPLACE FUNCTION public.delete_dj_profile(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;
  
  -- Delete related records first (respecting FK constraints)
  DELETE FROM public.dj_subscriptions WHERE dj_profile_id = profile_id;
  DELETE FROM public.dj_availability WHERE dj_profile_id = profile_id;
  DELETE FROM public.dj_booking_requests WHERE dj_profile_id = profile_id;
  DELETE FROM public.dj_reviews WHERE dj_profile_id = profile_id;
  
  -- Delete the profile
  DELETE FROM public.dj_profiles WHERE id = profile_id;
  
  RETURN true;
END;
$function$;