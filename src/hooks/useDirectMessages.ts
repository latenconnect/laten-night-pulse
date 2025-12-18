import { useState, useEffect, useCallback, useRef } from 'react';
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
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
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

  const initializeKeys = useCallback(async () => {
    if (!user || isInitializing) return false;

    setIsInitializing(true);
    try {
      console.log('Generating new encryption key pair...');
      const { publicKey, privateKey } = await generateKeyPair();

      const { error } = await supabase
        .from('user_encryption_keys')
        .upsert({
          user_id: user.id,
          public_key: publicKey,
        });

      if (error) throw error;

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

      const participantIds = conversations.map(c => 
        c.participant_1 === user.id ? c.participant_2 : c.participant_1
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', participantIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Get unread counts
      const { data: unreadCounts } = await supabase
        .from('direct_messages')
        .select('conversation_id')
        .neq('sender_id', user.id)
        .is('read_at', null);

      const unreadMap = new Map<string, number>();
      unreadCounts?.forEach(msg => {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
      });

      return conversations.map(conv => {
        const participantId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
        const profile = profileMap.get(participantId);
        
        return {
          id: conv.id,
          participantId,
          participantName: profile?.display_name || 'Unknown User',
          participantAvatar: profile?.avatar_url,
          lastMessageAt: conv.updated_at,
          unreadCount: unreadMap.get(conv.id) || 0,
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
  const queryClient = useQueryClient();

  const { data: otherPublicKey } = useUserPublicKey(otherUserId);

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

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (!user || messageIds.length === 0) return;
      
      const { error } = await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
    },
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
                messageType: (msg.message_type || 'text') as 'text' | 'image' | 'file',
                fileUrl: msg.file_url,
                fileName: msg.file_name,
                fileSize: msg.file_size,
                fileMimeType: msg.file_mime_type,
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
                messageType: 'text' as const,
              };
            }
          })
        );
        setDecryptedMessages(decrypted);

        // Mark unread messages as read
        const unreadIds = encryptedMessages
          .filter(msg => msg.sender_id !== user.id && !msg.read_at)
          .map(msg => msg.id);
        
        if (unreadIds.length > 0) {
          markAsRead.mutate(unreadIds);
        }
      } catch (error) {
        console.error('Failed to decrypt messages:', error);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptMessages();
  }, [encryptedMessages, user, otherPublicKey]);

  // Real-time subscription for new messages and read receipts
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
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

// Hook for typing indicators
export const useTypingIndicator = (conversationId: string | null, otherUserId: string | null) => {
  const { user } = useAuth();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to typing indicator changes
  useEffect(() => {
    if (!conversationId || !otherUserId) return;

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dm_typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const data = payload.new as { user_id: string; is_typing: boolean } | undefined;
          if (data && data.user_id === otherUserId) {
            setIsOtherTyping(data.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, otherUserId]);

  // Set typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!user || !conversationId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await supabase
        .from('dm_typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'conversation_id,user_id',
        });

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  }, [user, conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (user && conversationId) {
        supabase
          .from('dm_typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: user.id,
            is_typing: false,
          }, {
            onConflict: 'conversation_id,user_id',
          });
      }
    };
  }, [user, conversationId]);

  return {
    isOtherTyping,
    setTyping,
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
      messageType = 'text',
      fileUrl,
      fileName,
      fileSize,
      fileMimeType,
      senderName,
    }: {
      conversationId: string;
      recipientId: string;
      recipientPublicKey: string;
      message: string;
      messageType?: 'text' | 'image' | 'file';
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      fileMimeType?: string;
      senderName?: string;
    }) => {
      if (!user || !myPublicKey) throw new Error('Not authenticated or no encryption key');

      const privateKey = getPrivateKey(user.id);
      if (!privateKey) throw new Error('No private key available');

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
          message_type: messageType,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_mime_type: fileMimeType,
        })
        .select()
        .single();

      if (error) throw error;

      // Send push notification
      try {
        await supabase.functions.invoke('send-dm-notification', {
          body: {
            recipientId,
            senderName: senderName || 'Someone',
            messagePreview: messageType === 'text' ? message : undefined,
            messageType,
            conversationId,
          },
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't throw - message was sent successfully
      }

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

// Hook for uploading encrypted files
export const useUploadDMFile = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(`dm/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('photos')
        .getPublicUrl(`dm/${fileName}`);

      return {
        url: data.publicUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };
    },
    onError: (error) => {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file');
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

      const { data: existing } = await supabase
        .from('dm_conversations')
        .select('*')
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) return existing;

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