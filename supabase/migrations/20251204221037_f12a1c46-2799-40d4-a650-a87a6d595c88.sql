-- Add DELETE policy for profiles table (GDPR compliance - right to erasure)
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);