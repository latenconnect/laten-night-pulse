-- =====================================================
-- USER PREFERENCES & PERSONALIZATION TABLES
-- =====================================================

-- Track user interactions for personalization algorithm
CREATE TABLE public.user_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'save', 'rsvp', 'share', 'click')),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_type text, -- Store the event type for preference learning
  city text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Either event_id or club_id must be set
  CONSTRAINT interaction_target CHECK (event_id IS NOT NULL OR club_id IS NOT NULL)
);

-- User preference scores computed from interactions
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  -- Preference scores per event type (0-100)
  pref_club numeric DEFAULT 50,
  pref_house_party numeric DEFAULT 50,
  pref_university numeric DEFAULT 50,
  pref_festival numeric DEFAULT 50,
  pref_public numeric DEFAULT 50,
  -- Price preference (avg price of interacted events)
  avg_price_preference numeric DEFAULT 0,
  -- Preferred cities (JSON array of city names with weights)
  preferred_cities jsonb DEFAULT '[]'::jsonb,
  -- Last updated
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- ADD FEATURED FLAG TO CLUBS
-- =====================================================
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- User interactions policies
CREATE POLICY "Users can view own interactions"
  ON public.user_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON public.user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
  ON public.user_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can manage featured clubs
CREATE POLICY "Admins can update featured status"
  ON public.clubs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FUNCTION TO UPDATE USER PREFERENCES
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_user_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type text;
  v_city text;
  v_price numeric;
  total_interactions int;
  type_interactions int;
  new_score numeric;
BEGIN
  -- Get event details if this is an event interaction
  IF NEW.event_id IS NOT NULL THEN
    SELECT type, city, price INTO v_event_type, v_city, v_price
    FROM public.events WHERE id = NEW.event_id;
    
    NEW.event_type := v_event_type;
    NEW.city := v_city;
  ELSIF NEW.club_id IS NOT NULL THEN
    SELECT city INTO v_city FROM public.clubs WHERE id = NEW.club_id;
    NEW.city := v_city;
  END IF;
  
  -- Ensure user has a preferences record
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Calculate new preference scores based on interaction type weights
  -- Views: 1 point, Clicks: 2 points, Saves: 3 points, RSVPs: 5 points, Shares: 4 points
  IF NEW.event_type IS NOT NULL THEN
    -- Get total weighted interactions for this user
    SELECT COALESCE(SUM(
      CASE interaction_type 
        WHEN 'view' THEN 1
        WHEN 'click' THEN 2
        WHEN 'save' THEN 3
        WHEN 'share' THEN 4
        WHEN 'rsvp' THEN 5
        ELSE 1
      END
    ), 0) INTO total_interactions
    FROM public.user_interactions
    WHERE user_id = NEW.user_id AND event_type IS NOT NULL;
    
    -- Get weighted interactions for this specific event type
    SELECT COALESCE(SUM(
      CASE interaction_type 
        WHEN 'view' THEN 1
        WHEN 'click' THEN 2
        WHEN 'save' THEN 3
        WHEN 'share' THEN 4
        WHEN 'rsvp' THEN 5
        ELSE 1
      END
    ), 0) INTO type_interactions
    FROM public.user_interactions
    WHERE user_id = NEW.user_id AND event_type = NEW.event_type;
    
    -- Add current interaction weight
    total_interactions := total_interactions + CASE NEW.interaction_type 
      WHEN 'view' THEN 1 WHEN 'click' THEN 2 WHEN 'save' THEN 3 
      WHEN 'share' THEN 4 WHEN 'rsvp' THEN 5 ELSE 1 END;
    type_interactions := type_interactions + CASE NEW.interaction_type 
      WHEN 'view' THEN 1 WHEN 'click' THEN 2 WHEN 'save' THEN 3 
      WHEN 'share' THEN 4 WHEN 'rsvp' THEN 5 ELSE 1 END;
    
    -- Calculate new score (percentage of total interactions)
    IF total_interactions > 0 THEN
      new_score := (type_interactions::numeric / total_interactions::numeric) * 100;
    ELSE
      new_score := 50;
    END IF;
    
    -- Update the appropriate preference column
    CASE NEW.event_type
      WHEN 'club' THEN
        UPDATE public.user_preferences SET pref_club = new_score, updated_at = now() WHERE user_id = NEW.user_id;
      WHEN 'house_party' THEN
        UPDATE public.user_preferences SET pref_house_party = new_score, updated_at = now() WHERE user_id = NEW.user_id;
      WHEN 'university' THEN
        UPDATE public.user_preferences SET pref_university = new_score, updated_at = now() WHERE user_id = NEW.user_id;
      WHEN 'festival' THEN
        UPDATE public.user_preferences SET pref_festival = new_score, updated_at = now() WHERE user_id = NEW.user_id;
      WHEN 'public' THEN
        UPDATE public.user_preferences SET pref_public = new_score, updated_at = now() WHERE user_id = NEW.user_id;
      ELSE NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update preferences on new interactions
CREATE TRIGGER on_user_interaction_insert
  BEFORE INSERT ON public.user_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_preferences();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_event_type ON public.user_interactions(event_type);
CREATE INDEX idx_user_interactions_created_at ON public.user_interactions(created_at DESC);
CREATE INDEX idx_clubs_is_featured ON public.clubs(is_featured) WHERE is_featured = true;