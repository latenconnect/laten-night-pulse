-- Add verified badge column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Set verified for the specific user
UPDATE public.profiles 
SET is_verified = true 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'aronpeterszabo@gmail.com'
);