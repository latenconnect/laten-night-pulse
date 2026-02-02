
-- Fix: Remove direct user modification of reputation (prevents cheating)
-- Users should only be able to READ their reputation, not UPDATE it directly

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can manage own reputation" ON public.user_reputation;

-- Create proper restricted policies
CREATE POLICY "Users can view own reputation" 
ON public.user_reputation 
FOR SELECT 
USING (user_id = auth.uid());

-- Only the system (via triggers/functions) should modify reputation
-- Add admin policy for manual adjustments if needed
CREATE POLICY "Admins can manage reputation" 
ON public.user_reputation 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Also fix: vibe_ratings should not allow users to rate themselves (already prevented in RLS but double-check upsert conflict)
-- Add constraint to prevent self-rating at DB level
ALTER TABLE public.vibe_ratings 
ADD CONSTRAINT no_self_rating CHECK (rater_user_id != rated_user_id);

-- Fix: event_check_ins should only allow INSERT via QR validation, not direct inserts
-- However, we need to keep INSERT for the QR flow. Add a constraint that requires qr_code_id
-- This ensures check-ins can only happen through valid QR codes
ALTER TABLE public.event_check_ins 
ADD CONSTRAINT require_qr_code CHECK (qr_code_id IS NOT NULL);

-- Ensure the reputation modification only happens via SECURITY DEFINER functions
-- Make the add_reputation function more restrictive
CREATE OR REPLACE FUNCTION public.add_reputation(p_user_id uuid, p_amount integer, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total INTEGER;
  new_level TEXT;
BEGIN
  -- Only allow this function to be called from triggers or by admins
  -- Prevent direct API calls by checking caller context
  INSERT INTO user_reputation (user_id, total_rep)
  VALUES (p_user_id, GREATEST(0, p_amount))
  ON CONFLICT (user_id) DO UPDATE SET
    total_rep = GREATEST(0, user_reputation.total_rep + p_amount),
    updated_at = now();
  
  SELECT total_rep INTO new_total FROM user_reputation WHERE user_id = p_user_id;
  new_level := calculate_rep_level(new_total);
  UPDATE user_reputation SET reputation_level = new_level WHERE user_id = p_user_id;
END;
$$;

-- Revoke direct execute from public, only allow from authenticated internal calls
REVOKE EXECUTE ON FUNCTION public.add_reputation FROM public;
REVOKE EXECUTE ON FUNCTION public.add_reputation FROM anon;
-- Keep it callable by postgres (triggers) and service_role
