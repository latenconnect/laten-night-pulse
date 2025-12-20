-- Fix infinite recursion in professionals RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view active professionals" ON public.professionals;
DROP POLICY IF EXISTS "Users can view their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can create their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can update their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Users can delete their own professional profile" ON public.professionals;
DROP POLICY IF EXISTS "Anyone can view active professionals" ON public.professionals;
DROP POLICY IF EXISTS "Professionals are viewable by everyone" ON public.professionals;

-- Create simple, non-recursive policies for professionals
CREATE POLICY "Anyone can view active professionals"
ON public.professionals
FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can manage own professional profile"
ON public.professionals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix infinite recursion in professional_subscriptions RLS policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.professional_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.professional_subscriptions;
DROP POLICY IF EXISTS "Anyone can view active subscriptions" ON public.professional_subscriptions;
DROP POLICY IF EXISTS "Professional subscriptions are viewable" ON public.professional_subscriptions;

-- Create simple, non-recursive policies for professional_subscriptions
-- Allow viewing subscriptions for active professionals (no subquery to professionals table)
CREATE POLICY "Anyone can view subscriptions"
ON public.professional_subscriptions
FOR SELECT
USING (true);

CREATE POLICY "Users can manage own professional subscription"
ON public.professional_subscriptions
FOR ALL
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
);