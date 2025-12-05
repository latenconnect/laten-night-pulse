-- Add opening_hours column to clubs table
ALTER TABLE public.clubs
ADD COLUMN opening_hours jsonb DEFAULT NULL;