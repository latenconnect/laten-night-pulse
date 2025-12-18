-- User encryption keys (public keys are stored here, private keys stay on device)
CREATE TABLE public.user_encryption_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  public_key text NOT NULL,
  key_created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Conversations (DMs between two users)
CREATE TABLE public.dm_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 uuid NOT NULL,
  participant_2 uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2),
  CONSTRAINT different_participants CHECK (participant_1 <> participant_2)
);

-- Direct messages (encrypted content)
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  -- Messages are stored twice: encrypted for sender and encrypted for recipient
  encrypted_content_sender text NOT NULL,
  encrypted_content_recipient text NOT NULL,
  -- Nonce/IV for decryption
  nonce_sender text NOT NULL,
  nonce_recipient text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- Create index for faster message lookups
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id, created_at DESC);
CREATE INDEX idx_dm_conversations_participants ON public.dm_conversations(participant_1, participant_2);

-- Enable RLS
ALTER TABLE public.user_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_encryption_keys
CREATE POLICY "Users can insert own encryption key"
  ON public.user_encryption_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own encryption key"
  ON public.user_encryption_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own encryption key"
  ON public.user_encryption_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view public keys"
  ON public.user_encryption_keys FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS policies for dm_conversations
CREATE POLICY "Users can view own conversations"
  ON public.dm_conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
  ON public.dm_conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update own conversations"
  ON public.dm_conversations FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- RLS policies for direct_messages
CREATE POLICY "Participants can view messages"
  ON public.direct_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.dm_conversations 
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM public.dm_conversations 
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

CREATE POLICY "Participants can update read status"
  ON public.direct_messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.dm_conversations 
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Update timestamp function for conversations
CREATE OR REPLACE FUNCTION public.update_dm_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dm_conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dm_conversation_timestamp();