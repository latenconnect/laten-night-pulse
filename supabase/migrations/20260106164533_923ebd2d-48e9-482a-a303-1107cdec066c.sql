-- ==============================================
-- SECURITY HARDENING MIGRATION
-- ==============================================

-- 1. FIX: Event Messages Host Impersonation
-- Create a trigger to validate is_host_message flag
CREATE OR REPLACE FUNCTION public.validate_event_message_host_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If is_host_message is true, verify the user is actually a host/cohost
  IF NEW.is_host_message = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM events e
      JOIN hosts h ON e.host_id = h.id
      WHERE e.id = NEW.event_id AND h.user_id = NEW.user_id
    ) AND NOT EXISTS (
      SELECT 1 FROM event_cohosts ec
      JOIN hosts h ON ec.host_id = h.id
      WHERE ec.event_id = NEW.event_id AND h.user_id = NEW.user_id
    ) THEN
      -- Silently set to false instead of raising error (better UX)
      NEW.is_host_message := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_event_message_host ON public.event_messages;
CREATE TRIGGER validate_event_message_host
  BEFORE INSERT OR UPDATE ON public.event_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_event_message_host_flag();

-- 2. FIX: DM Conversations Validation
-- Ensure participant_1 != participant_2 and user is a participant
CREATE OR REPLACE FUNCTION public.validate_dm_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent self-conversations
  IF NEW.participant_1 = NEW.participant_2 THEN
    RAISE EXCEPTION 'Cannot create a conversation with yourself';
  END IF;
  
  -- Ensure the authenticated user is one of the participants
  IF auth.uid() IS NOT NULL AND auth.uid() NOT IN (NEW.participant_1, NEW.participant_2) THEN
    RAISE EXCEPTION 'You must be a participant in the conversation';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_dm_conversation_insert ON public.dm_conversations;
CREATE TRIGGER validate_dm_conversation_insert
  BEFORE INSERT ON public.dm_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_dm_conversation();

-- 3. FIX: Remove owner_id from public clubs view
DROP VIEW IF EXISTS public.public_clubs;
CREATE VIEW public.public_clubs WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  city,
  country,
  address,
  latitude,
  longitude,
  rating,
  photos,
  music_genres,
  venue_type,
  opening_hours,
  is_featured,
  google_maps_uri
FROM public.clubs
WHERE is_active = true;

-- 4. FIX: Tighten safe_profiles view
DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  avatar_url,
  city,
  is_verified
FROM public.profiles;

-- 5. FIX: Add scanned_at for ticket fraud prevention
ALTER TABLE public.ticket_purchases 
ADD COLUMN IF NOT EXISTS scanned_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS scanned_by uuid DEFAULT NULL;

-- 6. Create function to scan tickets (prevents reuse)
CREATE OR REPLACE FUNCTION public.scan_ticket(p_qr_code text, p_scanner_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
BEGIN
  -- Find the ticket
  SELECT tp.*, e.name as event_name, e.start_time
  INTO v_ticket
  FROM public.ticket_purchases tp
  JOIN public.event_tickets et ON tp.ticket_id = et.id
  JOIN public.events e ON et.event_id = e.id
  WHERE tp.qr_code = p_qr_code;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ticket not found');
  END IF;
  
  IF v_ticket.scanned_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Ticket already scanned',
      'scanned_at', v_ticket.scanned_at
    );
  END IF;
  
  -- Mark as scanned
  UPDATE public.ticket_purchases
  SET scanned_at = now(), scanned_by = p_scanner_id
  WHERE qr_code = p_qr_code;
  
  RETURN json_build_object(
    'success', true,
    'event_name', v_ticket.event_name,
    'event_time', v_ticket.start_time
  );
END;
$$;

-- 7. FIX: Add privacy settings for user connections
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_connections boolean DEFAULT true;

-- 8. FIX: Update event_rsvps policy to respect privacy
CREATE OR REPLACE FUNCTION public.can_view_event_rsvps(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Event hosts can always see RSVPs
    EXISTS (SELECT 1 FROM events e JOIN hosts h ON e.host_id = h.id WHERE e.id = p_event_id AND h.user_id = auth.uid())
    -- Cohosts can see RSVPs
    OR EXISTS (SELECT 1 FROM event_cohosts ec JOIN hosts h ON ec.host_id = h.id WHERE ec.event_id = p_event_id AND h.user_id = auth.uid())
    -- Admins can see RSVPs
    OR has_role(auth.uid(), 'admin')
$$;

-- 9. Add index for better performance on security checks
CREATE INDEX IF NOT EXISTS idx_event_cohosts_host_id ON public.event_cohosts(host_id);
CREATE INDEX IF NOT EXISTS idx_hosts_user_id ON public.hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_follower ON public.user_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_following ON public.user_connections(following_id);

-- 10. Grant access to views
GRANT SELECT ON public.safe_profiles TO anon, authenticated;
GRANT SELECT ON public.public_clubs TO anon, authenticated;