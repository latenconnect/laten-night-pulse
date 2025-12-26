-- Create host_subscriptions table for party boost subscriptions
CREATE TABLE public.host_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'boost',
  status TEXT NOT NULL DEFAULT 'inactive',
  price_cents INTEGER NOT NULL DEFAULT 1000,
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_subscription_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT host_subscriptions_host_id_key UNIQUE (host_id)
);

-- Enable Row Level Security
ALTER TABLE public.host_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Hosts can view their own subscription
CREATE POLICY "Hosts can view own subscription"
ON public.host_subscriptions
FOR SELECT
USING (host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()));

-- Policy: Hosts can manage their own subscription (for inserts from system)
CREATE POLICY "System can manage host subscriptions"
ON public.host_subscriptions
FOR ALL
USING (host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()))
WITH CHECK (host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()));

-- Policy: Admins can manage all host subscriptions
CREATE POLICY "Admins can manage all host subscriptions"
ON public.host_subscriptions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_host_subscriptions_updated_at
  BEFORE UPDATE ON public.host_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add index for faster lookups
CREATE INDEX idx_host_subscriptions_host_id ON public.host_subscriptions(host_id);
CREATE INDEX idx_host_subscriptions_status ON public.host_subscriptions(status);