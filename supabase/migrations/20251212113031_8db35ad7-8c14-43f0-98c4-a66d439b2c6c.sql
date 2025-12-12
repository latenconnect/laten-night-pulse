-- Venue Subscription Tiers
CREATE TYPE public.subscription_tier AS ENUM ('basic', 'boost', 'ultimate');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');

-- Venue Subscriptions Table
CREATE TABLE public.venue_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'basic',
  status subscription_status NOT NULL DEFAULT 'active',
  price_cents INTEGER NOT NULL, -- Store in cents for precision
  currency TEXT NOT NULL DEFAULT 'EUR',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(club_id) -- One active subscription per venue
);

-- Event Spotlight Boosts
CREATE TYPE public.boost_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

CREATE TABLE public.event_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL DEFAULT 'spotlight', -- spotlight, homepage, push
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status boost_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ticketing System
CREATE TYPE public.ticket_status AS ENUM ('available', 'sold', 'used', 'refunded', 'cancelled');

CREATE TABLE public.event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Early Bird", "VIP", "General"
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  quantity_total INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  sale_starts_at TIMESTAMP WITH TIME ZONE,
  sale_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.ticket_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status ticket_status NOT NULL DEFAULT 'sold',
  qr_code TEXT UNIQUE, -- Unique QR code for entry
  price_paid_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL, -- Our 3-7% cut
  stripe_payment_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Club Analytics (Views, Clicks, RSVPs tracking)
CREATE TABLE public.club_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  directions_clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(club_id, date)
);

-- Event Analytics
CREATE TABLE public.event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  rsvps INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  ticket_sales INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, date)
);

-- Club Verification/Onboarding (self-service)
CREATE TYPE public.club_verification_status AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE public.club_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status club_verification_status NOT NULL DEFAULT 'pending',
  business_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  business_phone TEXT,
  verification_documents TEXT[],
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Add owner_id to clubs for verified ownership
ALTER TABLE public.clubs ADD COLUMN owner_id UUID;

-- Enable RLS on all new tables
ALTER TABLE public.venue_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Venue Subscriptions: Owners can view their own, admins can manage all
CREATE POLICY "Club owners can view own subscriptions" ON public.venue_subscriptions
  FOR SELECT USING (
    club_id IN (SELECT id FROM public.clubs WHERE owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all subscriptions" ON public.venue_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Event Boosts: Event hosts can view/create, admins manage all
CREATE POLICY "Event hosts can view own boosts" ON public.event_boosts
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()))
  );

CREATE POLICY "Event hosts can create boosts" ON public.event_boosts
  FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()))
  );

CREATE POLICY "Admins can manage all boosts" ON public.event_boosts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Event Tickets: Public can view available, hosts can manage
CREATE POLICY "Anyone can view available tickets" ON public.event_tickets
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE is_active = true)
  );

CREATE POLICY "Event hosts can manage tickets" ON public.event_tickets
  FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()))
  );

-- Ticket Purchases: Users can view own, hosts can view event purchases
CREATE POLICY "Users can view own purchases" ON public.ticket_purchases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can purchase tickets" ON public.ticket_purchases
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event hosts can view ticket purchases" ON public.ticket_purchases
  FOR SELECT USING (
    ticket_id IN (
      SELECT t.id FROM public.event_tickets t
      JOIN public.events e ON t.event_id = e.id
      JOIN public.hosts h ON e.host_id = h.id
      WHERE h.user_id = auth.uid()
    )
  );

-- Club Analytics: Owners and admins only
CREATE POLICY "Club owners can view own analytics" ON public.club_analytics
  FOR SELECT USING (
    club_id IN (SELECT id FROM public.clubs WHERE owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage club analytics" ON public.club_analytics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Event Analytics: Hosts and admins only
CREATE POLICY "Event hosts can view own analytics" ON public.event_analytics
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()))
  );

CREATE POLICY "Admins can manage event analytics" ON public.event_analytics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Club Claims: Users can create/view own, admins manage all
CREATE POLICY "Users can create club claims" ON public.club_claims
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own claims" ON public.club_claims
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all claims" ON public.club_claims
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Function to increment analytics
CREATE OR REPLACE FUNCTION public.increment_club_analytics(
  p_club_id UUID,
  p_field TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.club_analytics (club_id, date)
  VALUES (p_club_id, CURRENT_DATE)
  ON CONFLICT (club_id, date) DO NOTHING;
  
  EXECUTE format(
    'UPDATE public.club_analytics SET %I = %I + 1 WHERE club_id = $1 AND date = CURRENT_DATE',
    p_field, p_field
  ) USING p_club_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_event_analytics(
  p_event_id UUID,
  p_field TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.event_analytics (event_id, date)
  VALUES (p_event_id, CURRENT_DATE)
  ON CONFLICT (event_id, date) DO NOTHING;
  
  EXECUTE format(
    'UPDATE public.event_analytics SET %I = %I + 1 WHERE event_id = $1 AND date = CURRENT_DATE',
    p_field, p_field
  ) USING p_event_id;
END;
$$;

-- Generate unique QR code for tickets
CREATE OR REPLACE FUNCTION public.generate_ticket_qr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.qr_code := 'LATEN-' || encode(gen_random_bytes(12), 'hex');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_ticket_qr_trigger
  BEFORE INSERT ON public.ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_qr();