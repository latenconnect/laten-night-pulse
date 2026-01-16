-- Drop the old function first to change return type
DROP FUNCTION IF EXISTS public.delete_user_account(uuid);

-- Improved delete_user_account function with:
-- 1. Proper exception handling to ensure atomic deletion
-- 2. Soft delete for events (preserve for ticket holders) 
-- 3. Comprehensive cleanup with detailed counts

CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_to_delete uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_counts jsonb := '{}'::jsonb;
  affected_rows integer;
  host_ids uuid[];
BEGIN
  -- Verify the user is deleting their own account
  IF auth.uid() != user_id_to_delete THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Get host IDs for this user (needed for event soft-delete)
  SELECT ARRAY_AGG(id) INTO host_ids FROM public.hosts WHERE user_id = user_id_to_delete;

  -- =====================================================
  -- PHASE 1: Clean up DM system
  -- =====================================================
  
  DELETE FROM public.direct_messages 
  WHERE sender_id = user_id_to_delete 
     OR conversation_id IN (
       SELECT id FROM public.dm_conversations 
       WHERE participant_1 = user_id_to_delete OR participant_2 = user_id_to_delete
     );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('direct_messages', affected_rows);
  
  DELETE FROM public.dm_typing_indicators WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('dm_typing_indicators', affected_rows);
  
  DELETE FROM public.dm_message_reactions WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('dm_message_reactions', affected_rows);
  
  DELETE FROM public.dm_conversations 
  WHERE participant_1 = user_id_to_delete OR participant_2 = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('dm_conversations', affected_rows);

  -- =====================================================
  -- PHASE 2: Clean up stories
  -- =====================================================
  
  DELETE FROM public.story_views WHERE viewer_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('story_views', affected_rows);
  
  DELETE FROM public.stories WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('stories', affected_rows);

  -- =====================================================
  -- PHASE 3: Clean up event participation (not hosting)
  -- =====================================================
  
  DELETE FROM public.event_messages WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('event_messages', affected_rows);
  
  DELETE FROM public.event_answers WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('event_answers', affected_rows);
  
  DELETE FROM public.event_questions WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('event_questions', affected_rows);
  
  DELETE FROM public.event_rsvps WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('event_rsvps', affected_rows);
  
  DELETE FROM public.saved_events WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('saved_events', affected_rows);
  
  DELETE FROM public.reports WHERE reporter_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('reports', affected_rows);

  -- =====================================================
  -- PHASE 4: Clean up professional profiles
  -- =====================================================
  
  -- DJ-related data
  DELETE FROM public.dj_reviews WHERE user_id = user_id_to_delete;
  DELETE FROM public.dj_booking_requests WHERE user_id = user_id_to_delete;
  DELETE FROM public.dj_availability 
  WHERE dj_profile_id IN (SELECT id FROM public.dj_profiles WHERE user_id = user_id_to_delete);
  DELETE FROM public.dj_subscriptions 
  WHERE dj_profile_id IN (SELECT id FROM public.dj_profiles WHERE user_id = user_id_to_delete);
  DELETE FROM public.dj_profiles WHERE user_id = user_id_to_delete;

  -- Bartender-related data
  DELETE FROM public.bartender_reviews WHERE user_id = user_id_to_delete;
  DELETE FROM public.bartender_booking_requests WHERE user_id = user_id_to_delete;
  DELETE FROM public.bartender_availability 
  WHERE bartender_profile_id IN (SELECT id FROM public.bartender_profiles WHERE user_id = user_id_to_delete);
  DELETE FROM public.bartender_subscriptions 
  WHERE bartender_profile_id IN (SELECT id FROM public.bartender_profiles WHERE user_id = user_id_to_delete);
  DELETE FROM public.bartender_profiles WHERE user_id = user_id_to_delete;

  -- Professional profiles (unified table)
  DELETE FROM public.professional_reviews WHERE user_id = user_id_to_delete;
  DELETE FROM public.professional_bookings WHERE user_id = user_id_to_delete;
  DELETE FROM public.professional_availability 
  WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id = user_id_to_delete);
  DELETE FROM public.professional_subscriptions 
  WHERE professional_id IN (SELECT id FROM public.professionals WHERE user_id = user_id_to_delete);
  DELETE FROM public.professionals WHERE user_id = user_id_to_delete;

  -- =====================================================
  -- PHASE 5: Clean up tickets
  -- =====================================================
  
  DELETE FROM public.ticket_purchases WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('ticket_purchases', affected_rows);

  -- =====================================================
  -- PHASE 6: Clean up social and preferences
  -- =====================================================
  
  DELETE FROM public.user_connections 
  WHERE follower_id = user_id_to_delete OR following_id = user_id_to_delete;
  DELETE FROM public.user_interactions WHERE user_id = user_id_to_delete;
  DELETE FROM public.user_preferences WHERE user_id = user_id_to_delete;
  DELETE FROM public.push_tokens WHERE user_id = user_id_to_delete;
  DELETE FROM public.user_encryption_keys WHERE user_id = user_id_to_delete;
  DELETE FROM public.notification_preferences WHERE user_id = user_id_to_delete;
  DELETE FROM public.friend_activity WHERE user_id = user_id_to_delete;

  -- =====================================================
  -- PHASE 7: Clean up party groups
  -- =====================================================
  
  DELETE FROM public.party_group_members WHERE user_id = user_id_to_delete;
  
  -- Delete groups created by user (only if no other members)
  DELETE FROM public.party_groups 
  WHERE created_by = user_id_to_delete 
    AND NOT EXISTS (
      SELECT 1 FROM public.party_group_members 
      WHERE group_id = party_groups.id 
        AND user_id != user_id_to_delete
        AND status = 'accepted'
    );

  -- =====================================================
  -- PHASE 8: Clean up club claims
  -- =====================================================
  
  DELETE FROM public.club_claims WHERE user_id = user_id_to_delete;

  -- =====================================================
  -- PHASE 9: Handle host profile and events
  -- =====================================================
  
  -- Remove user as cohost
  DELETE FROM public.event_cohosts WHERE added_by = user_id_to_delete;
  DELETE FROM public.event_cohosts 
  WHERE host_id IN (SELECT id FROM public.hosts WHERE user_id = user_id_to_delete);

  -- Handle events with tickets sold (SOFT DELETE - preserve for ticket holders)
  IF host_ids IS NOT NULL THEN
    UPDATE public.events 
    SET is_active = false,
        name = '[Deleted Host] ' || name,
        description = 'This event''s host account has been deleted. ' || COALESCE(description, '')
    WHERE host_id = ANY(host_ids)
      AND EXISTS (
        SELECT 1 FROM public.ticket_purchases tp
        JOIN public.event_tickets et ON tp.ticket_id = et.id
        WHERE et.event_id = events.id
      );
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    deleted_counts := deleted_counts || jsonb_build_object('events_soft_deleted', affected_rows);

    -- HARD DELETE events without ticket sales (clean up related data first)
    DELETE FROM public.event_analytics 
    WHERE event_id IN (
      SELECT id FROM public.events 
      WHERE host_id = ANY(host_ids)
        AND NOT EXISTS (
          SELECT 1 FROM public.ticket_purchases tp
          JOIN public.event_tickets et ON tp.ticket_id = et.id
          WHERE et.event_id = events.id
        )
    );
    
    DELETE FROM public.event_boosts 
    WHERE event_id IN (
      SELECT id FROM public.events 
      WHERE host_id = ANY(host_ids)
        AND NOT EXISTS (
          SELECT 1 FROM public.ticket_purchases tp
          JOIN public.event_tickets et ON tp.ticket_id = et.id
          WHERE et.event_id = events.id
        )
    );
    
    DELETE FROM public.event_tickets 
    WHERE event_id IN (
      SELECT id FROM public.events 
      WHERE host_id = ANY(host_ids)
        AND NOT EXISTS (
          SELECT 1 FROM public.ticket_purchases tp
          JOIN public.event_tickets et ON tp.ticket_id = et.id
          WHERE et.event_id = events.id
        )
    );

    DELETE FROM public.events 
    WHERE host_id = ANY(host_ids)
      AND NOT EXISTS (
        SELECT 1 FROM public.ticket_purchases tp
        JOIN public.event_tickets et ON tp.ticket_id = et.id
        WHERE et.event_id = events.id
      );
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    deleted_counts := deleted_counts || jsonb_build_object('events_hard_deleted', affected_rows);
  END IF;

  -- Delete host subscription
  DELETE FROM public.host_subscriptions 
  WHERE host_id IN (SELECT id FROM public.hosts WHERE user_id = user_id_to_delete);

  -- Delete host profile
  DELETE FROM public.hosts WHERE user_id = user_id_to_delete;

  -- =====================================================
  -- PHASE 10: Clean up user roles and profile (LAST)
  -- =====================================================
  
  DELETE FROM public.user_roles WHERE user_id = user_id_to_delete;
  DELETE FROM public.rate_limits WHERE user_id = user_id_to_delete;

  -- Delete profile (this should be last)
  DELETE FROM public.profiles WHERE id = user_id_to_delete;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_counts := deleted_counts || jsonb_build_object('profiles', affected_rows);

  -- Return detailed deletion summary
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_id_to_delete,
    'deleted_at', now(),
    'deleted_counts', deleted_counts
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will automatically rollback on exception
    RAISE EXCEPTION 'Account deletion failed: %. All changes have been rolled back.', SQLERRM;
END;
$$;

-- Add comment documenting the function behavior
COMMENT ON FUNCTION public.delete_user_account IS 'Securely deletes a user account and all associated data. Events with sold tickets are soft-deleted (marked inactive) to preserve ticket holder access. Returns a JSON summary of deleted records. The entire operation is atomic - if any part fails, all changes are rolled back.';