-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for event types
CREATE TYPE public.event_type AS ENUM ('club', 'house_party', 'university', 'festival', 'public');

-- Create enum for host verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  bio TEXT,
  city TEXT DEFAULT 'Budapest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create hosts table
CREATE TABLE public.hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  verification_status verification_status DEFAULT 'pending',
  verification_documents TEXT[],
  rating DECIMAL(3,2) DEFAULT 0,
  events_hosted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES public.hosts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type event_type NOT NULL DEFAULT 'public',
  cover_image TEXT,
  photos TEXT[],
  location_name TEXT NOT NULL,
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  city TEXT NOT NULL DEFAULT 'Budapest',
  country TEXT DEFAULT 'Hungary',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  price DECIMAL(10,2) DEFAULT 0,
  age_limit INTEGER DEFAULT 18,
  max_attendees INTEGER,
  expected_attendance INTEGER,
  actual_rsvp INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  safety_rules TEXT,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event RSVPs table
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'going',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- Create saved events table
CREATE TABLE public.saved_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, reporter_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to auto-hide events with 5+ reports
CREATE OR REPLACE FUNCTION public.check_report_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET is_active = false, report_count = report_count + 1
  WHERE id = NEW.event_id
    AND (SELECT COUNT(*) FROM public.reports WHERE event_id = NEW.event_id) >= 5;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.check_report_count();

-- Function to update RSVP count
CREATE OR REPLACE FUNCTION public.update_rsvp_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events SET actual_rsvp = actual_rsvp + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events SET actual_rsvp = actual_rsvp - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_rsvp_change
  AFTER INSERT OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_rsvp_count();

-- RLS POLICIES

-- Profiles: Users can view all profiles, update own
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles: Only admins can view/modify
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Hosts: Anyone can view verified hosts
CREATE POLICY "Verified hosts are viewable"
  ON public.hosts FOR SELECT
  USING (verification_status = 'verified' OR user_id = auth.uid());

CREATE POLICY "Users can create host application"
  ON public.hosts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own host profile"
  ON public.hosts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Events: Active events visible to all, hosts can manage own
CREATE POLICY "Active events are viewable"
  ON public.events FOR SELECT
  USING (is_active = true OR host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()));

CREATE POLICY "Verified hosts can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    host_id IN (
      SELECT id FROM public.hosts 
      WHERE user_id = auth.uid() AND verification_status = 'verified'
    )
  );

CREATE POLICY "Hosts can update own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()));

CREATE POLICY "Hosts can delete own events"
  ON public.events FOR DELETE
  TO authenticated
  USING (host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid()));

-- RSVPs: Users can view/manage own
CREATE POLICY "Users can view own RSVPs"
  ON public.event_rsvps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Event hosts can view RSVPs"
  ON public.event_rsvps FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.hosts h ON e.host_id = h.id
      WHERE h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can RSVP to events"
  ON public.event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own RSVP"
  ON public.event_rsvps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Saved events: Users manage own
CREATE POLICY "Users can view own saved events"
  ON public.saved_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save events"
  ON public.saved_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave events"
  ON public.saved_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reports: Users can create, admins can view all
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);