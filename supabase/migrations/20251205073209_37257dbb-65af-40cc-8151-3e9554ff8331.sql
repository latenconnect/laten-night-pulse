-- Add venue_type column to clubs table
ALTER TABLE public.clubs
ADD COLUMN venue_type text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.clubs.venue_type IS 'Type of venue: bar, night_club, restaurant, pub, etc.';