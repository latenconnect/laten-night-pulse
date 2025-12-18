-- Create profession type enum
CREATE TYPE public.profession_type AS ENUM ('dj', 'bartender', 'photographer', 'security');

-- Create unified professionals table
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profession_type public.profession_type NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_photo TEXT,
  city TEXT NOT NULL DEFAULT 'Budapest',
  country TEXT DEFAULT 'Hungary',
  
  -- Pricing
  price_min INTEGER,
  price_max INTEGER,
  currency TEXT DEFAULT 'HUF',
  
  -- Professional details
  experience_level TEXT DEFAULT 'intermediate',
  skills TEXT[] DEFAULT '{}',
  preferred_event_types TEXT[] DEFAULT '{}',
  
  -- DJ specific (nullable for other professions)
  genres TEXT[] DEFAULT '{}',
  soundcloud_url TEXT,
  mixcloud_url TEXT,
  
  -- Social
  instagram_url TEXT,
  website_url TEXT,
  
  -- Stats
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_user_profession UNIQUE (user_id, profession_type)
);

-- Create professional subscriptions table
CREATE TABLE public.professional_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'inactive',
  price_cents INTEGER NOT NULL DEFAULT 400000,
  currency TEXT NOT NULL DEFAULT 'HUF',
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_professional_subscription UNIQUE (professional_id)
);

-- Create professional availability table
CREATE TABLE public.professional_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_professional_date UNIQUE (professional_id, date)
);

-- Create professional booking requests table
CREATE TABLE public.professional_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  event_location TEXT,
  event_description TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  currency TEXT DEFAULT 'HUF',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  professional_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create professional reviews table
CREATE TABLE public.professional_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.professional_bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

-- Professionals policies
CREATE POLICY "Active subscribed professionals are publicly viewable"
ON public.professionals FOR SELECT
USING (
  (is_active = true) AND 
  (id IN (
    SELECT professional_id FROM public.professional_subscriptions
    WHERE status = 'active' AND expires_at > now()
  ))
);

CREATE POLICY "Users can view own professional profile"
ON public.professionals FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own professional profile"
ON public.professionals FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own professional profile"
ON public.professionals FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own professional profile"
ON public.professionals FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all professionals"
ON public.professionals FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Subscriptions policies
CREATE POLICY "Professionals can view own subscription"
ON public.professional_subscriptions FOR SELECT
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscriptions"
ON public.professional_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Availability policies
CREATE POLICY "Anyone can view professional availability"
ON public.professional_availability FOR SELECT
USING (true);

CREATE POLICY "Professionals can manage own availability"
ON public.professional_availability FOR ALL
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
);

-- Bookings policies
CREATE POLICY "Users can create booking requests"
ON public.professional_bookings FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own booking requests"
ON public.professional_bookings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Professionals can view bookings for their profile"
ON public.professional_bookings FOR SELECT
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update bookings for their profile"
ON public.professional_bookings FOR UPDATE
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  )
);

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
ON public.professional_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for completed bookings"
ON public.professional_reviews FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  booking_id IN (
    SELECT id FROM public.professional_bookings
    WHERE user_id = auth.uid() AND status = 'completed'
  )
);

-- Create trigger to update rating on new review
CREATE OR REPLACE FUNCTION public.update_professional_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.professionals
  SET 
    rating = (SELECT AVG(rating) FROM public.professional_reviews WHERE professional_id = NEW.professional_id),
    review_count = (SELECT COUNT(*) FROM public.professional_reviews WHERE professional_id = NEW.professional_id)
  WHERE id = NEW.professional_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_professional_review_created
AFTER INSERT ON public.professional_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_professional_rating();

-- Create trigger for updated_at
CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_professional_subscriptions_updated_at
BEFORE UPDATE ON public.professional_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_professional_bookings_updated_at
BEFORE UPDATE ON public.professional_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for performance
CREATE INDEX idx_professionals_profession ON public.professionals(profession_type);
CREATE INDEX idx_professionals_city ON public.professionals(city);
CREATE INDEX idx_professionals_active ON public.professionals(is_active) WHERE is_active = true;
CREATE INDEX idx_professional_subscriptions_status ON public.professional_subscriptions(status, expires_at);
CREATE INDEX idx_professional_bookings_status ON public.professional_bookings(status);
CREATE INDEX idx_professional_availability_date ON public.professional_availability(professional_id, date);