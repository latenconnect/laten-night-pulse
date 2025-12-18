-- Add typing indicators table for real-time typing status
CREATE TABLE public.dm_typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for one typing indicator per user per conversation
ALTER TABLE public.dm_typing_indicators
ADD CONSTRAINT dm_typing_unique_user_conversation UNIQUE (conversation_id, user_id);

-- Enable RLS
ALTER TABLE public.dm_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Participants can view typing indicators
CREATE POLICY "Participants can view typing indicators"
ON public.dm_typing_indicators FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.dm_conversations
    WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
);

-- Participants can update their own typing status
CREATE POLICY "Users can manage own typing status"
ON public.dm_typing_indicators FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_typing_indicators;

-- Add message_type column to direct_messages for file/image support
ALTER TABLE public.direct_messages 
ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text',
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_size INTEGER,
ADD COLUMN file_mime_type TEXT;

-- Create index for faster unread count queries
CREATE INDEX idx_dm_unread ON public.direct_messages(conversation_id, read_at) WHERE read_at IS NULL;