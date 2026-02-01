import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface IcebreakerRoom {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  room_type: 'general' | 'rave_squad' | 'ride_share' | 'first_timers' | 'solo_goers';
  max_members: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  member_count?: number;
}

export interface IcebreakerMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface IcebreakerMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useIcebreakerRooms = (eventId?: string) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<IcebreakerRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      const { data: roomsData } = await supabase
        .from('icebreaker_rooms')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true);

      if (roomsData) {
        // Get member counts
        const roomIds = roomsData.map(r => r.id);
        const { data: membersData } = await supabase
          .from('icebreaker_members')
          .select('room_id')
          .in('room_id', roomIds);

        const countMap: Record<string, number> = {};
        membersData?.forEach(m => {
          countMap[m.room_id] = (countMap[m.room_id] || 0) + 1;
        });

        setRooms(roomsData.map(room => ({
          ...room,
          room_type: room.room_type as IcebreakerRoom['room_type'],
          member_count: countMap[room.id] || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching icebreaker rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const createRoom = async (
    name: string,
    roomType: IcebreakerRoom['room_type'],
    description?: string
  ): Promise<IcebreakerRoom | null> => {
    if (!user || !eventId) return null;

    try {
      const { data, error } = await supabase
        .from('icebreaker_rooms')
        .insert({
          event_id: eventId,
          name,
          room_type: roomType,
          description: description || null,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator
      await supabase
        .from('icebreaker_members')
        .insert({
          room_id: data.id,
          user_id: user.id
        });

      toast.success('Chat room created!');
      await fetchRooms();
      return data as IcebreakerRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
      return null;
    }
  };

  const joinRoom = async (roomId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('icebreaker_members')
        .insert({
          room_id: roomId,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in this room');
          return true;
        }
        throw error;
      }

      toast.success('Joined the chat!');
      await fetchRooms();
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
      return false;
    }
  };

  const leaveRoom = async (roomId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await supabase
        .from('icebreaker_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      toast.success('Left the room');
      await fetchRooms();
      return true;
    } catch (error) {
      console.error('Error leaving room:', error);
      toast.error('Failed to leave room');
      return false;
    }
  };

  return {
    rooms,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    refetch: fetchRooms
  };
};

export const useIcebreakerChat = (roomId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<IcebreakerMessage[]>([]);
  const [members, setMembers] = useState<IcebreakerMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch messages
      const { data: messagesData } = await supabase
        .from('icebreaker_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      // Fetch members
      const { data: membersData } = await supabase
        .from('icebreaker_members')
        .select('*')
        .eq('room_id', roomId);

      if (messagesData || membersData) {
        // Get all user IDs
        const userIds = [...new Set([
          ...(messagesData?.map(m => m.user_id) || []),
          ...(membersData?.map(m => m.user_id) || [])
        ])];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        if (messagesData) {
          setMessages(messagesData.map(msg => ({
            ...msg,
            profile: profileMap.get(msg.user_id)
          })));
        }

        if (membersData) {
          setMembers(membersData.map(member => ({
            ...member,
            profile: profileMap.get(member.user_id)
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime messages
    if (!roomId) return;

    const channel = supabase
      .channel(`icebreaker-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'icebreaker_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMessage = payload.new as IcebreakerMessage;
          
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', newMessage.user_id)
            .single();

          setMessages(prev => [...prev, {
            ...newMessage,
            profile: profile || undefined
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchData]);

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!user || !roomId || !message.trim()) return false;

    try {
      const { error } = await supabase
        .from('icebreaker_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message: message.trim()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  };

  return {
    messages,
    members,
    loading,
    sendMessage,
    refetch: fetchData
  };
};
