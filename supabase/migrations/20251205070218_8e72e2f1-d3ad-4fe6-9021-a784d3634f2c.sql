-- Add age verification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS age_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS didit_session_id text;