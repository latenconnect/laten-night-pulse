-- Create DJ profiles table
CREATE TABLE public.dj_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  dj_name TEXT NOT NULL,
  bio TEXT,
  profile_photo TEXT,
  genres TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT DEFAULT 'intermediate',
  soundcloud_url TEXT,
  mixcloud_url TEXT,
  instagram_url TEXT,
  price_min INTEGER,
  price_max INTEGER,
  currency TEXT DEFAULT 'HUF',
  preferred_event_types TEXT[] DEFAULT '{}',
  city TEXT NOT NULL DEFAULT 'Budapest',
  is_active BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create DJ subscriptions table
CREATE TABLE public.dj_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID NOT NULL REFERENCES public.dj_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive',
  tier TEXT NOT NULL DEFAULT 'standard',
  price_cents INTEGER NOT NULL DEFAULT 400000,
  currency TEXT NOT NULL DEFAULT 'HUF',
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dj_profile_id)
);

-- Create DJ availability table
CREATE TABLE public.dj_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID NOT NULL REFERENCES public.dj_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dj_profile_id, date)
);

-- Create DJ booking requests table
CREATE TABLE public.dj_booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID NOT NULL REFERENCES public.dj_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  event_location TEXT,
  event_description TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  currency TEXT DEFAULT 'HUF',
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  dj_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create DJ reviews table
CREATE TABLE public.dj_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID NOT NULL REFERENCES public.dj_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.dj_booking_requests(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.dj_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_reviews ENABLE ROW LEVEL SECURITY;

-- DJ Profiles policies
CREATE POLICY "Active subscribed DJs are publicly viewable"
ON public.dj_profiles FOR SELECT
USING (
  is_active = true AND 
  id IN (
    SELECT dj_profile_id FROM public.dj_subscriptions 
    WHERE status = 'active' AND expires_at > now()
  )
);

CREATE POLICY "Users can view own DJ profile"
ON public.dj_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own DJ profile"
ON public.dj_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own DJ profile"
ON public.dj_profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own DJ profile"
ON public.dj_profiles FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all DJ profiles"
ON public.dj_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- DJ Subscriptions policies
CREATE POLICY "DJs can view own subscription"
ON public.dj_subscriptions FOR SELECT
USING (
  dj_profile_id IN (
    SELECT id FROM public.dj_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all DJ subscriptions"
ON public.dj_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- DJ Availability policies
CREATE POLICY "Anyone can view DJ availability"
ON public.dj_availability FOR SELECT
USING (true);

CREATE POLICY "DJs can manage own availability"
ON public.dj_availability FOR ALL
USING (
  dj_profile_id IN (
    SELECT id FROM public.dj_profiles WHERE user_id = auth.uid()
  )
);

-- DJ Booking Requests policies
CREATE POLICY "Users can create booking requests"
ON public.dj_booking_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own booking requests"
ON public.dj_booking_requests FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "DJs can view booking requests for their profile"
ON public.dj_booking_requests FOR SELECT
USING (
  dj_profile_id IN (
    SELECT id FROM public.dj_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "DJs can update booking requests for their profile"
ON public.dj_booking_requests FOR UPDATE
USING (
  dj_profile_id IN (
    SELECT id FROM public.dj_profiles WHERE user_id = auth.uid()
  )
);

-- DJ Reviews policies
CREATE POLICY "Anyone can view reviews"
ON public.dj_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for completed bookings"
ON public.dj_reviews FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  booking_id IN (
    SELECT id FROM public.dj_booking_requests 
    WHERE user_id = auth.uid() AND status = 'completed'
  )
);

-- Function to update DJ rating
CREATE OR REPLACE FUNCTION public.update_dj_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dj_profiles
  SET 
    rating = (SELECT AVG(rating) FROM public.dj_reviews WHERE dj_profile_id = NEW.dj_profile_id),
    review_count = (SELECT COUNT(*) FROM public.dj_reviews WHERE dj_profile_id = NEW.dj_profile_id)
  WHERE id = NEW.dj_profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_dj_rating_trigger
AFTER INSERT OR UPDATE ON public.dj_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_dj_rating();

-- Indexes for performance
CREATE INDEX idx_dj_profiles_city ON public.dj_profiles(city);
CREATE INDEX idx_dj_profiles_genres ON public.dj_profiles USING GIN(genres);
CREATE INDEX idx_dj_availability_date ON public.dj_availability(date);
CREATE INDEX idx_dj_booking_requests_status ON public.dj_booking_requests(status);