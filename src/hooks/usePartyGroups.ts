import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface PartyGroup {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  created_by: string;
  event_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  genres?: string[];
  preferred_venue_id?: string | null;
  member_count?: number;
  members?: Array<{
    user_id: string;
    profile?: {
      avatar_url: string | null;
      display_name: string | null;
    };
  }>;
  preferred_venue?: {
    id: string;
    name: string;
    photos: string[] | null;
  };
  event?: {
    id: string;
    name: string;
    start_time: string;
    location_name: string;
    cover_image: string | null;
  };
}

export interface PartyGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined';
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const usePartyGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<PartyGroup[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PartyGroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch groups where user is creator or accepted member
      const { data: groupsData, error: groupsError } = await supabase
        .from('party_groups')
        .select(`
          *,
          event:events(id, name, start_time, location_name, cover_image),
          preferred_venue:clubs!party_groups_preferred_venue_id_fkey(id, name, photos)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Get member counts and member info for each group
      const groupIds = groupsData?.map(g => g.id) || [];
      const { data: membersData } = await supabase
        .from('party_group_members')
        .select('group_id, user_id')
        .in('group_id', groupIds)
        .eq('status', 'accepted');

      // Get user profiles for member avatars
      const memberUserIds = [...new Set(membersData?.map(m => m.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url, display_name')
        .in('id', memberUserIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      );

      const countMap: Record<string, number> = {};
      const membersMap: Record<string, Array<{ user_id: string; profile?: { avatar_url: string | null; display_name: string | null } }>> = {};
      
      membersData?.forEach(m => {
        countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
        if (!membersMap[m.group_id]) membersMap[m.group_id] = [];
        membersMap[m.group_id].push({
          user_id: m.user_id,
          profile: profilesMap.get(m.user_id)
        });
      });

      const enrichedGroups = (groupsData || []).map(g => ({
        ...g,
        member_count: (countMap[g.id] || 0) + 1, // +1 for creator
        members: membersMap[g.id] || []
      }));

      setGroups(enrichedGroups);

      // Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('party_group_members')
        .select(`
          *,
          group:party_groups(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (invitesError) throw invitesError;
      
      // Type assertion for pending invites
      const typedInvites = (invitesData || []).map(invite => ({
        ...invite,
        role: invite.role as 'admin' | 'member',
        status: invite.status as 'pending' | 'accepted' | 'declined'
      }));
      setPendingInvites(typedInvites);

    } catch (error) {
      console.error('Error fetching party groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (
    name: string,
    eventId?: string,
    description?: string
  ): Promise<PartyGroup | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('party_groups')
        .insert({
          name,
          event_id: eventId || null,
          description: description || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase.from('party_group_members').insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin',
        status: 'accepted',
        joined_at: new Date().toISOString()
      });

      toast.success('Group created!');
      await fetchGroups();
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
      return null;
    }
  };

  const inviteToGroup = async (groupId: string, userIds: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const invites = userIds.map(userId => ({
        group_id: groupId,
        user_id: userId,
        invited_by: user.id,
        role: 'member' as const,
        status: 'pending' as const
      }));

      const { error } = await supabase
        .from('party_group_members')
        .upsert(invites, { onConflict: 'group_id,user_id' });

      if (error) throw error;

      toast.success(`Invited ${userIds.length} friend${userIds.length > 1 ? 's' : ''}`);
      return true;
    } catch (error) {
      console.error('Error inviting to group:', error);
      toast.error('Failed to send invites');
      return false;
    }
  };

  const respondToInvite = async (
    memberId: string,
    response: 'accepted' | 'declined'
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = { status: response };
      if (response === 'accepted') {
        updateData.joined_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('party_group_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;

      toast.success(response === 'accepted' ? 'Joined the group!' : 'Invite declined');
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('Error responding to invite:', error);
      toast.error('Failed to respond to invite');
      return false;
    }
  };

  const leaveGroup = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('party_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Left the group');
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
      return false;
    }
  };

  const deleteGroup = async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('party_groups')
        .delete()
        .eq('id', groupId)
        .eq('created_by', user.id);

      if (error) throw error;

      toast.success('Group deleted');
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
      return false;
    }
  };

  const setGroupEvent = async (groupId: string, eventId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('party_groups')
        .update({ event_id: eventId })
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Event linked to group!');
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('Error setting group event:', error);
      toast.error('Failed to link event');
      return false;
    }
  };

  return {
    groups,
    pendingInvites,
    loading,
    createGroup,
    inviteToGroup,
    respondToInvite,
    leaveGroup,
    deleteGroup,
    setGroupEvent,
    refetch: fetchGroups
  };
};

export const usePartyGroupMembers = (groupId: string) => {
  const [members, setMembers] = useState<PartyGroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupId) {
        setMembers([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch members first
        const { data: membersData, error: membersError } = await supabase
          .from('party_group_members')
          .select('*')
          .eq('group_id', groupId)
          .order('role', { ascending: true });

        if (membersError) throw membersError;

        // Fetch profiles for all members
        const userIds = (membersData || []).map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map(
          (profilesData || []).map(p => [p.id, p])
        );

        // Combine members with their profiles
        const typedMembers: PartyGroupMember[] = (membersData || []).map(m => ({
          ...m,
          role: m.role as 'admin' | 'member',
          status: m.status as 'pending' | 'accepted' | 'declined',
          profile: profilesMap.get(m.user_id) || undefined
        }));

        setMembers(typedMembers);
      } catch (error) {
        console.error('Error fetching group members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  return { members, loading };
};
