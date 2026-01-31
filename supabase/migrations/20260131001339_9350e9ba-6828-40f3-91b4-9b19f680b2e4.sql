-- Create function to increment story view count
CREATE OR REPLACE FUNCTION public.increment_story_view_count(p_story_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.stories 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = p_story_id;
END;
$$;