-- Create message reactions table
CREATE TABLE public.dm_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_message_emoji UNIQUE (message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.dm_message_reactions ENABLE ROW LEVEL SECURITY;

-- Participants can view reactions
CREATE POLICY "Participants can view reactions"
ON public.dm_message_reactions FOR SELECT
USING (
  message_id IN (
    SELECT dm.id FROM public.direct_messages dm
    JOIN public.dm_conversations c ON dm.conversation_id = c.id
    WHERE c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()
  )
);

-- Users can add reactions
CREATE POLICY "Users can add reactions"
ON public.dm_message_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  message_id IN (
    SELECT dm.id FROM public.direct_messages dm
    JOIN public.dm_conversations c ON dm.conversation_id = c.id
    WHERE c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()
  )
);

-- Users can remove own reactions
CREATE POLICY "Users can remove own reactions"
ON public.dm_message_reactions FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_message_reactions;

-- Add edited_at column to direct_messages for edit tracking
ALTER TABLE public.direct_messages 
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Create index for reactions lookup
CREATE INDEX idx_dm_reactions_message ON public.dm_message_reactions(message_id);