import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
}

export interface Connection {
  id: string;
  follower_id: string;
  following_id: string;
  connection_type: 'follow' | 'friend_request' | 'friend';
  status: 'pending' | 'active' | 'rejected';
  created_at: string;
  profile?: UserProfile;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [following, setFollowing] = useState<Connection[]>([]);
  const [friends, setFriends] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch people I follow
      const { data: myFollowing } = await supabase
        .from('user_connections')
        .select('*')
        .eq('follower_id', user.id)
        .eq('status', 'active');

      // Fetch people following me
      const { data: myFollowers } = await supabase
        .from('user_connections')
        .select('*')
        .eq('following_id', user.id)
        .eq('status', 'active');

      // Fetch pending friend requests to me
      const { data: pending } = await supabase
        .from('user_connections')
        .select('*')
        .eq('following_id', user.id)
        .eq('connection_type', 'friend_request')
        .eq('status', 'pending');

      // Get profile info for all connections
      const allUserIds = new Set<string>();
      myFollowing?.forEach(c => allUserIds.add(c.following_id));
      myFollowers?.forEach(c => allUserIds.add(c.follower_id));
      pending?.forEach(c => allUserIds.add(c.follower_id));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, city')
        .in('id', Array.from(allUserIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Map connections with profiles
      const mapWithProfile = (connections: any[], getProfileId: (c: any) => string) => 
        (connections || []).map(c => ({
          ...c,
          profile: profileMap.get(getProfileId(c))
        }));

      setFollowing(mapWithProfile(myFollowing || [], c => c.following_id));
      setFollowers(mapWithProfile(myFollowers || [], c => c.follower_id));
      setPendingRequests(mapWithProfile(pending || [], c => c.follower_id));

      // Friends are mutual follows or accepted friend requests
      const friendConnections = (myFollowing || []).filter(f => 
        f.connection_type === 'friend' && f.status === 'active'
      );
      setFriends(mapWithProfile(friendConnections, c => c.following_id));

    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user) {
      toast.error('Please log in');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_connections')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          connection_type: 'follow',
          status: 'active'
        });

      if (error) throw error;

      toast.success('Following!');
      fetchConnections();
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Already following');
      } else {
        toast.error('Failed to follow');
      }
      return false;
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      toast.success('Unfollowed');
      fetchConnections();
      return true;
    } catch (error) {
      toast.error('Failed to unfollow');
      return false;
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) {
      toast.error('Please log in');
      return false;
    }

    try {
      // First unfollow if already following
      await supabase
        .from('user_connections')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      const { error } = await supabase
        .from('user_connections')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          connection_type: 'friend_request',
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Friend request sent!');
      fetchConnections();
      return true;
    } catch (error: any) {
      toast.error('Failed to send friend request');
      return false;
    }
  };

  const acceptFriendRequest = async (connectionId: string, requesterId: string) => {
    if (!user) return false;

    try {
      // Update the incoming request to friend status
      await supabase
        .from('user_connections')
        .update({ connection_type: 'friend', status: 'active' })
        .eq('id', connectionId);

      // Create reverse connection
      await supabase
        .from('user_connections')
        .insert({
          follower_id: user.id,
          following_id: requesterId,
          connection_type: 'friend',
          status: 'active'
        });

      toast.success('Friend request accepted!');
      fetchConnections();
      return true;
    } catch (error) {
      toast.error('Failed to accept request');
      return false;
    }
  };

  const rejectFriendRequest = async (connectionId: string) => {
    if (!user) return false;

    try {
      await supabase
        .from('user_connections')
        .update({ status: 'rejected' })
        .eq('id', connectionId);

      toast.success('Request declined');
      fetchConnections();
      return true;
    } catch (error) {
      toast.error('Failed to decline request');
      return false;
    }
  };

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
    if (!query.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, city')
        .ilike('display_name', `%${query}%`)
        .neq('id', user?.id || '')
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const getConnectionStatus = (targetUserId: string) => {
    const isFollowing = following.some(f => f.following_id === targetUserId);
    const isFriend = friends.some(f => f.following_id === targetUserId);
    const hasPendingRequest = following.some(
      f => f.following_id === targetUserId && f.connection_type === 'friend_request' && f.status === 'pending'
    );

    return { isFollowing, isFriend, hasPendingRequest };
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  return {
    followers,
    following,
    friends,
    pendingRequests,
    loading,
    followUser,
    unfollowUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    getConnectionStatus,
    refetch: fetchConnections
  };
};
