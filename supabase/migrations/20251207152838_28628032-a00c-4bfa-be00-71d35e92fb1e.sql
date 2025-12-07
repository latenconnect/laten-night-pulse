-- Create event_questions table for Q&A feature
CREATE TABLE public.event_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_answers table for host responses
CREATE TABLE public.event_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.event_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answer TEXT NOT NULL,
  is_host_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_answers ENABLE ROW LEVEL SECURITY;

-- Questions policies: Anyone can view questions for active events
CREATE POLICY "Anyone can view questions for active events"
ON public.event_questions FOR SELECT
USING (event_id IN (SELECT id FROM public.events WHERE is_active = true));

-- Authenticated users can ask questions
CREATE POLICY "Authenticated users can ask questions"
ON public.event_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own questions
CREATE POLICY "Users can delete own questions"
ON public.event_questions FOR DELETE
USING (auth.uid() = user_id);

-- Answers policies: Anyone can view answers
CREATE POLICY "Anyone can view answers"
ON public.event_answers FOR SELECT
USING (question_id IN (
  SELECT q.id FROM public.event_questions q 
  JOIN public.events e ON q.event_id = e.id 
  WHERE e.is_active = true
));

-- Authenticated users can post answers
CREATE POLICY "Authenticated users can post answers"
ON public.event_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own answers
CREATE POLICY "Users can delete own answers"
ON public.event_answers FOR DELETE
USING (auth.uid() = user_id);

-- Create event_cohosts table for multiple hosts feature
CREATE TABLE public.event_cohosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'cohost',
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID NOT NULL,
  UNIQUE(event_id, host_id)
);

-- Enable RLS
ALTER TABLE public.event_cohosts ENABLE ROW LEVEL SECURITY;

-- Anyone can view cohosts for active events
CREATE POLICY "Anyone can view cohosts for active events"
ON public.event_cohosts FOR SELECT
USING (event_id IN (SELECT id FROM public.events WHERE is_active = true));

-- Primary host can add cohosts
CREATE POLICY "Primary host can add cohosts"
ON public.event_cohosts FOR INSERT
WITH CHECK (
  event_id IN (
    SELECT e.id FROM public.events e
    JOIN public.hosts h ON e.host_id = h.id
    WHERE h.user_id = auth.uid()
  )
);

-- Primary host can remove cohosts
CREATE POLICY "Primary host can remove cohosts"
ON public.event_cohosts FOR DELETE
USING (
  event_id IN (
    SELECT e.id FROM public.events e
    JOIN public.hosts h ON e.host_id = h.id
    WHERE h.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_event_questions_event_id ON public.event_questions(event_id);
CREATE INDEX idx_event_answers_question_id ON public.event_answers(question_id);
CREATE INDEX idx_event_cohosts_event_id ON public.event_cohosts(event_id);