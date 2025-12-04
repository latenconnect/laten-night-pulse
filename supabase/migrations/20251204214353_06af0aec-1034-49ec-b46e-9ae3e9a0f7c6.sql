-- Create clubs table for storing venue data from Google Places API
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'Hungary',
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  rating NUMERIC,
  price_level INTEGER,
  photos TEXT[],
  google_maps_uri TEXT,
  business_status TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create index for geospatial queries
CREATE INDEX idx_clubs_location ON public.clubs (latitude, longitude);
CREATE INDEX idx_clubs_city ON public.clubs (city);
CREATE INDEX idx_clubs_google_place_id ON public.clubs (google_place_id);

-- Enable RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Public read access (clubs are public data)
CREATE POLICY "Clubs are publicly viewable"
ON public.clubs
FOR SELECT
USING (is_active = true);

-- Only admins can modify clubs
CREATE POLICY "Admins can manage clubs"
ON public.clubs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));