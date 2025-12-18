import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  generateKeyPair,
  storePrivateKey,
  getPrivateKey,
  encryptForConversation,
  decryptFromConversation,
} from '@/utils/encryption';

export interface DecryptedMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

// Hook for managing user's encryption keys
export const useEncryptionKeys = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(false);

  // Check if user has encryption keys set up
  const { data: publicKeyData, isLoading } = useQuery({
    queryKey: ['encryption-key', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('public_key')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasKeys = !!publicKeyData && !!getPrivateKey(user?.id || '');

  // Initialize encryption keys for user
  const initializeKeys = useCallback(async () => {
    if (!user || isInitializing) return false;

    setIsInitializing(true);
    try {
      console.log('Generating new encryption key pair...');
      const { publicKey, privateKey } = await generateKeyPair();

      // Store public key in database
      const { error } = await supabase
        .from('user_encryption_keys')
        .upsert({
          user_id: user.id,
          public_key: publicKey,
        });

      if (error) throw error;

      // Store private key locally
      storePrivateKey(user.id, privateKey);

      queryClient.invalidateQueries({ queryKey: ['encryption-key', user.id] });
      console.log('Encryption keys initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize encryption keys:', error);
      toast.error('Failed to set up secure messaging');
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [user, isInitializing, queryClient]);

  return {
    hasKeys,
    isLoading,
    isInitializing,
    initializeKeys,
    publicKey: publicKeyData?.public_key || null,
  };
};

// Hook for fetching other user's public key
export const useUserPublicKey = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-public-key', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('public_key')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.public_key || null;
    },
    enabled: !!userId,
  });
};

// Hook for managing conversations
export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dm-conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: conversations, error } = await supabase
        .from('dm_conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch participant profiles
      const participantIds = conversations.map(c => 
        c.participant_1 === user.id ? c.participant_2 : c.participant_1
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', participantIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return conversations.map(conv => {
        const participantId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
        const profile = profileMap.get(participantId);
        
        return {
          id: conv.id,
          participantId,
          participantName: profile?.display_name || 'Unknown User',
          participantAvatar: profile?.avatar_url,
          lastMessageAt: conv.updated_at,
          unreadCount: 0, // TODO: Calculate unread count
        } as Conversation;
      });
    },
    enabled: !!user,
  });
};

// Hook for a single conversation's messages
export const useConversationMessages = (conversationId: string | null, otherUserId: string | null) => {
  const { user } = useAuth();
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Get other user's public key
  const { data: otherPublicKey } = useUserPublicKey(otherUserId);

  // Fetch encrypted messages
  const { data: encryptedMessages, isLoading, refetch } = useQuery({
    queryKey: ['dm-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });

  // Decrypt messages when they arrive
  useEffect(() => {
    const decryptMessages = async () => {
      if (!user || !encryptedMessages || !otherPublicKey) return;

      const privateKey = getPrivateKey(user.id);
      if (!privateKey) {
        console.error('No private key available');
        return;
      }

      setIsDecrypting(true);
      try {
        const decrypted = await Promise.all(
          encryptedMessages.map(async (msg) => {
            try {
              const isMine = msg.sender_id === user.id;
              // If I'm the sender, decrypt using my encrypted copy
              // If I'm the recipient, decrypt using recipient's copy
              const ciphertext = isMine 
                ? msg.encrypted_content_sender 
                : msg.encrypted_content_recipient;
              const nonce = isMine 
                ? msg.nonce_sender 
                : msg.nonce_recipient;

              const content = await decryptFromConversation(
                ciphertext,
                nonce,
                privateKey,
                otherPublicKey
              );

              return {
                id: msg.id,
                senderId: msg.sender_id,
                content,
                createdAt: msg.created_at,
                readAt: msg.read_at,
                isMine,
              };
            } catch (error) {
              console.error('Failed to decrypt message:', msg.id, error);
              return {
                id: msg.id,
                senderId: msg.sender_id,
                content: '[Unable to decrypt]',
                createdAt: msg.created_at,
                readAt: msg.read_at,
                isMine: msg.sender_id === user.id,
              };
            }
          })
        );
        setDecryptedMessages(decrypted);
      } catch (error) {
        console.error('Failed to decrypt messages:', error);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptMessages();
  }, [encryptedMessages, user, otherPublicKey]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, refetch]);

  return {
    messages: decryptedMessages,
    isLoading: isLoading || isDecrypting,
    refetch,
  };
};

// Hook for sending messages
export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { publicKey: myPublicKey } = useEncryptionKeys();

  return useMutation({
    mutationFn: async ({
      conversationId,
      recipientId,
      recipientPublicKey,
      message,
    }: {
      conversationId: string;
      recipientId: string;
      recipientPublicKey: string;
      message: string;
    }) => {
      if (!user || !myPublicKey) throw new Error('Not authenticated or no encryption key');

      const privateKey = getPrivateKey(user.id);
      if (!privateKey) throw new Error('No private key available');

      // Encrypt message for both sender and recipient
      const { encryptedForSender, encryptedForRecipient } = await encryptForConversation(
        message,
        privateKey,
        myPublicKey,
        recipientPublicKey
      );

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          encrypted_content_sender: encryptedForSender.ciphertext,
          encrypted_content_recipient: encryptedForRecipient.ciphertext,
          nonce_sender: encryptedForSender.nonce,
          nonce_recipient: encryptedForRecipient.nonce,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dm-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    },
  });
};

// Hook for creating or getting a conversation
export const useCreateConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('dm_conversations')
        .select('*')
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) return existing;

      // Create new conversation (ensure consistent ordering)
      const [p1, p2] = [user.id, otherUserId].sort();
      const { data, error } = await supabase
        .from('dm_conversations')
        .insert({
          participant_1: p1,
          participant_2: p2,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to start conversation');
    },
  });
};
