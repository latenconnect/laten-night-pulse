-- Fix search_path for update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix search_path for update_rsvp_count function
CREATE OR REPLACE FUNCTION public.update_rsvp_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events SET actual_rsvp = actual_rsvp + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events SET actual_rsvp = actual_rsvp - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;