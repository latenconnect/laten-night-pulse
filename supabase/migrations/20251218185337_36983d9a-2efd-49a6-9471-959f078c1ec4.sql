-- Add description and profile columns to clubs table
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS services text[],
ADD COLUMN IF NOT EXISTS highlights text[],
ADD COLUMN IF NOT EXISTS music_genres text[],
ADD COLUMN IF NOT EXISTS crowd_info jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.clubs.description IS 'AI-generated description of the venue';
COMMENT ON COLUMN public.clubs.services IS 'List of services/amenities offered';
COMMENT ON COLUMN public.clubs.highlights IS 'Key highlights and features';
COMMENT ON COLUMN public.clubs.music_genres IS 'Music genres played at the venue';
COMMENT ON COLUMN public.clubs.crowd_info IS 'Information about typical crowd, age range, dress code, etc.';