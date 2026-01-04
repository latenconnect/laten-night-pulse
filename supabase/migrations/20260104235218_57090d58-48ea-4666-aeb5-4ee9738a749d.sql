-- Add genres and preferred venue to party_groups
ALTER TABLE public.party_groups
ADD COLUMN genres text[] DEFAULT '{}',
ADD COLUMN preferred_venue_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL;

-- Create index for preferred venue lookups
CREATE INDEX idx_party_groups_preferred_venue ON public.party_groups(preferred_venue_id) WHERE preferred_venue_id IS NOT NULL;