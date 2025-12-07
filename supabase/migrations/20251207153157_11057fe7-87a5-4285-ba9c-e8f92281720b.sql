-- Create event_messages table for real-time chat
CREATE TABLE public.event_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_host_message BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages for active events
CREATE POLICY "Anyone can view messages for active events"
ON public.event_messages FOR SELECT
USING (event_id IN (SELECT id FROM public.events WHERE is_active = true));

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
ON public.event_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.event_messages FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_event_messages_event_id ON public.event_messages(event_id);
CREATE INDEX idx_event_messages_created_at ON public.event_messages(created_at);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;