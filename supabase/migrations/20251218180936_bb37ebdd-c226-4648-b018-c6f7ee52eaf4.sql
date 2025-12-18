-- 1. Remove email from profiles table (it's already in auth.users)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 2. Update handle_new_user function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 3. Create encrypted columns for business contact info in club_claims
-- Using pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns (we'll keep original columns for backward compatibility during migration)
ALTER TABLE public.club_claims 
ADD COLUMN IF NOT EXISTS business_email_encrypted bytea,
ADD COLUMN IF NOT EXISTS business_phone_encrypted bytea;

-- 4. Create function to securely delete user account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_to_delete uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is deleting their own account
  IF auth.uid() != user_id_to_delete THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Delete user's direct messages and conversations
  DELETE FROM public.direct_messages 
  WHERE sender_id = user_id_to_delete 
     OR conversation_id IN (
       SELECT id FROM public.dm_conversations 
       WHERE participant_1 = user_id_to_delete OR participant_2 = user_id_to_delete
     );
  
  DELETE FROM public.dm_typing_indicators WHERE user_id = user_id_to_delete;
  DELETE FROM public.dm_message_reactions WHERE user_id = user_id_to_delete;
  DELETE FROM public.dm_conversations 
  WHERE participant_1 = user_id_to_delete OR participant_2 = user_id_to_delete;

  -- Delete user's stories and views
  DELETE FROM public.story_views WHERE viewer_id = user_id_to_delete;
  DELETE FROM public.stories WHERE user_id = user_id_to_delete;

  -- Delete user's event-related data
  DELETE FROM public.event_messages WHERE user_id = user_id_to_delete;
  DELETE FROM public.event_answers WHERE user_id = user_id_to_delete;
  DELETE FROM public.event_questions WHERE user_id = user_id_to_delete;
  DELETE FROM public.event_rsvps WHERE user_id = user_id_to_delete;
  DELETE FROM public.saved_events WHERE user_id = user_id_to_delete;
  DELETE FROM public.reports WHERE reporter_id = user_id_to_delete;

  -- Delete user's DJ-related data
  DELETE FROM public.dj_reviews WHERE user_id = user_id_to_delete;
  DELETE FROM public.dj_booking_requests WHERE user_id = user_id_to_delete;
  DELETE FROM public.dj_availability 
  WHERE dj_profile_id IN (SELECT id FROM public.dj_profiles WHERE user_id = user_id_to_delete);
  DELETE FROM public.dj_subscriptions 
  WHERE dj_profile_id IN (SELECT id FROM public.dj_profiles WHERE user_id = user_id_to_delete);
  DELETE FROM public.dj_profiles WHERE user_id = user_id_to_delete;

  -- Delete user's bartender-related data
  DELETE FROM public.bartender_reviews WHERE user_id = user_id_to_delete;
  DELETE FROM public.bartender_booking_requests WHERE user_id = user_id_to_delete;
  DELETE FROM public.bartender_availability 
  WHERE bartender_profile_id IN (SELECT id FROM public.bartender_profiles WHERE user_id = user_id_to_delete);
  DELETE FROM public.bartender_subscriptions 
  WHERE bartender_profile_id IN (SELECT id FROM public.bartender_profiles WHERE user_id = user_id_to_delete);
  DELETE FROM public.bartender_profiles WHERE user_id = user_id_to_delete;

  -- Delete user's tickets
  DELETE FROM public.ticket_purchases WHERE user_id = user_id_to_delete;

  -- Delete user's social connections
  DELETE FROM public.user_connections 
  WHERE follower_id = user_id_to_delete OR following_id = user_id_to_delete;

  -- Delete user's interactions and preferences
  DELETE FROM public.user_interactions WHERE user_id = user_id_to_delete;
  DELETE FROM public.user_preferences WHERE user_id = user_id_to_delete;

  -- Delete user's push tokens
  DELETE FROM public.push_tokens WHERE user_id = user_id_to_delete;

  -- Delete user's encryption keys
  DELETE FROM public.user_encryption_keys WHERE user_id = user_id_to_delete;

  -- Delete user's club claims
  DELETE FROM public.club_claims WHERE user_id = user_id_to_delete;

  -- Delete user's host profile and events
  DELETE FROM public.event_cohosts WHERE added_by = user_id_to_delete;
  DELETE FROM public.events WHERE host_id IN (SELECT id FROM public.hosts WHERE user_id = user_id_to_delete);
  DELETE FROM public.hosts WHERE user_id = user_id_to_delete;

  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = user_id_to_delete;

  -- Delete profile (this should be last before auth deletion)
  DELETE FROM public.profiles WHERE id = user_id_to_delete;

  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;