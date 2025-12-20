-- Fix SQL Injection vulnerability in increment_club_analytics
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

  INSERT INTO public.club_analytics (club_id, date)
  VALUES (p_club_id, CURRENT_DATE)
  ON CONFLICT (club_id, date) DO NOTHING;
  
  EXECUTE format(
    'UPDATE public.club_analytics SET %I = %I + 1 WHERE club_id = $1 AND date = CURRENT_DATE',
    p_field, p_field
  ) USING p_club_id;
END;
$function$;

-- Fix SQL Injection vulnerability in increment_event_analytics
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

  INSERT INTO public.event_analytics (event_id, date)
  VALUES (p_event_id, CURRENT_DATE)
  ON CONFLICT (event_id, date) DO NOTHING;
  
  EXECUTE format(
    'UPDATE public.event_analytics SET %I = %I + 1 WHERE event_id = $1 AND date = CURRENT_DATE',
    p_field, p_field
  ) USING p_event_id;
END;
$function$;

-- Fix public_host_info view - add RLS policy to allow anyone to view verified hosts
CREATE POLICY "Anyone can view verified host info"
ON public.hosts
FOR SELECT
USING (verification_status = 'verified'::verification_status);