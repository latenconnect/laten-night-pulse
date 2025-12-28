-- Drop the overly permissive policy from migration 20251220135753
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.professional_subscriptions;

-- Also check and drop similar overly permissive policies on related subscription tables
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.dj_subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.bartender_subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.host_subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.venue_subscriptions;