import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { eventMessageSchema, validateInput } from '@/lib/validations';

export interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  message: string;
  is_host_message: boolean;
  created_at: string;
  user_display_name?: string;
}

export const useEventChat = (eventId: string) => {
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('event_messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as EventMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages(prev => prev.filter(m => m.id !== deletedId));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [eventId, fetchMessages]);

  const sendMessage = async (message: string, isHostMessage: boolean = false) => {
    if (!user) {
      toast.error('Please sign in to send messages');
      return false;
    }

    // Validate message content
    const validation = validateInput(eventMessageSchema, message);
    if (!validation.success) {
      const errorMessage = 'errors' in validation ? validation.errors[0] : 'Invalid message';
      toast.error(errorMessage);
      return false;
    }

    try {
      const { error } = await supabase
        .from('event_messages')
        .insert({
          event_id: eventId,
          user_id: user.id,
          message: validation.data,
          is_host_message: isHostMessage
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('event_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      return false;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    refetch: fetchMessages
  };
};
