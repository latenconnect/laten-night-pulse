-- Create a function to call the Algolia sync edge function when events change
CREATE OR REPLACE FUNCTION public.sync_event_to_algolia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  payload JSONB;
BEGIN
  -- Determine the action type
  IF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    payload := jsonb_build_object(
      'type', 'event',
      'action', action_type,
      'record', jsonb_build_object('id', OLD.id)
    );
  ELSIF TG_OP = 'INSERT' THEN
    action_type := 'insert';
    payload := jsonb_build_object(
      'type', 'event',
      'action', action_type,
      'record', jsonb_build_object('id', NEW.id)
    );
  ELSE
    action_type := 'update';
    payload := jsonb_build_object(
      'type', 'event',
      'action', action_type,
      'record', jsonb_build_object('id', NEW.id)
    );
  END IF;

  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := 'https://huigwbyctzjictnaycjj.supabase.co/functions/v1/algolia-sync-single',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for events table
DROP TRIGGER IF EXISTS sync_events_to_algolia ON public.events;
CREATE TRIGGER sync_events_to_algolia
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_event_to_algolia();

-- Create a function to call the Algolia sync edge function when clubs change
CREATE OR REPLACE FUNCTION public.sync_club_to_algolia()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
  payload JSONB;
BEGIN
  -- Determine the action type
  IF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    payload := jsonb_build_object(
      'type', 'club',
      'action', action_type,
      'record', jsonb_build_object('id', OLD.id)
    );
  ELSIF TG_OP = 'INSERT' THEN
    action_type := 'insert';
    payload := jsonb_build_object(
      'type', 'club',
      'action', action_type,
      'record', jsonb_build_object('id', NEW.id)
    );
  ELSE
    action_type := 'update';
    payload := jsonb_build_object(
      'type', 'club',
      'action', action_type,
      'record', jsonb_build_object('id', NEW.id)
    );
  END IF;

  -- Call the edge function asynchronously using pg_net
  PERFORM net.http_post(
    url := 'https://huigwbyctzjictnaycjj.supabase.co/functions/v1/algolia-sync-single',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for clubs table
DROP TRIGGER IF EXISTS sync_clubs_to_algolia ON public.clubs;
CREATE TRIGGER sync_clubs_to_algolia
  AFTER INSERT OR UPDATE OR DELETE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_club_to_algolia();

-- Enable realtime for events table so map updates automatically
ALTER TABLE public.events REPLICA IDENTITY FULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.sync_event_to_algolia() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_club_to_algolia() TO service_role;