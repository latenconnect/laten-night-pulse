import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface PartyPreferences {
  id: string;
  user_id: string;
  energy_level: 'chill' | 'balanced' | 'wild' | 'afterparty_demon';
  music_vibes: string[];
  city: string;
  max_distance_km: number;
  age_range_min: number;
  age_range_max: number;
}

export interface PartyConnection {
  id: string;
  user_id: string;
  matched_user_id: string;
  event_id: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  connection_type: 'solo' | 'group';
  expires_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface PartyMatchGroup {
  id: string;
  creator_id: string;
  name: string | null;
  target_event_id: string | null;
  energy_level: string;
  looking_for_size: number;
  is_active: boolean;
  expires_at: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  user_id: string;
  role: 'creator' | 'member';
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface PotentialMatch {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  energy_level: string;
  music_vibes: string[];
  compatibility_score: number;
}

const ENERGY_LEVELS = [
  { value: 'chill', label: 'Chill', emoji: '😌', description: 'Low-key vibes, good convos' },
  { value: 'balanced', label: 'Balanced', emoji: '🙂', description: 'Mix of dance & chill' },
  { value: 'wild', label: 'Wild', emoji: '🤪', description: 'Non-stop dancing, full energy' },
  { value: 'afterparty_demon', label: 'Afterparty Demon', emoji: '👹', description: 'Going until sunrise' },
];

const MUSIC_VIBES = [
  'Techno', 'House', 'Hip-Hop', 'EDM', 'R&B', 'Latin', 'Pop', 'Drum & Bass',
  'Afrobeats', 'Reggaeton', 'Indie', 'Everything',
];

export const usePartyMatching = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<PartyPreferences | null>(null);
  const [connections, setConnections] = useState<PartyConnection[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch my preferences
      const { data: prefs } = await supabase
        .from('party_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefs) {
        setPreferences(prefs as PartyPreferences);
      }

      // Fetch my connections (pending or accepted, not expired)
      const { data: conns } = await supabase
        .from('party_connections')
        .select('*')
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .in('status', ['pending', 'accepted'])
        .gt('expires_at', new Date().toISOString());

      if (conns && conns.length > 0) {
        // Fetch profiles for matches
        const userIds = conns.map(c => c.user_id === user.id ? c.matched_user_id : c.user_id);
        const { data: profiles } = await supabase
          .from('safe_profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        setConnections(conns.map(c => ({
          ...c as PartyConnection,
          profile: profileMap.get(c.user_id === user.id ? c.matched_user_id : c.user_id),
        })));
      }

      // Fetch potential matches based on preferences
      if (prefs) {
        await fetchPotentialMatches(prefs as PartyPreferences);
      }
    } catch (error) {
      console.error('Error fetching party matching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPotentialMatches = async (myPrefs: PartyPreferences) => {
    if (!user) return;

    try {
      // Get users with similar preferences
      const { data: allPrefs } = await supabase
        .from('party_preferences')
        .select('*')
        .eq('city', myPrefs.city)
        .neq('user_id', user.id);

      if (!allPrefs || allPrefs.length === 0) {
        setPotentialMatches([]);
        return;
      }

      // Calculate compatibility scores
      const userIds = allPrefs.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('safe_profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Exclude already connected users
      const connectedUserIds = new Set(connections.map(c => 
        c.user_id === user.id ? c.matched_user_id : c.user_id
      ));

      const matches: PotentialMatch[] = allPrefs
        .filter(p => !connectedUserIds.has(p.user_id))
        .map(p => {
          let score = 0;

          // Energy level matching (40 points max)
          if (p.energy_level === myPrefs.energy_level) score += 40;
          else if (
            (p.energy_level === 'balanced' && ['chill', 'wild'].includes(myPrefs.energy_level)) ||
            (myPrefs.energy_level === 'balanced' && ['chill', 'wild'].includes(p.energy_level))
          ) score += 20;

          // Music vibes overlap (40 points max)
          const myVibes = new Set(myPrefs.music_vibes);
          const theirVibes = new Set(p.music_vibes);
          const overlap = [...myVibes].filter(v => theirVibes.has(v)).length;
          score += Math.min(40, overlap * 10);

          // Age range compatibility (20 points max)
          if (
            myPrefs.age_range_min <= p.age_range_max &&
            myPrefs.age_range_max >= p.age_range_min
          ) score += 20;

          const profile = profileMap.get(p.user_id);

          return {
            user_id: p.user_id,
            display_name: profile?.display_name || 'Anonymous',
            avatar_url: profile?.avatar_url || null,
            energy_level: p.energy_level,
            music_vibes: p.music_vibes,
            compatibility_score: score,
          };
        })
        .filter(m => m.compatibility_score >= 30)
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, 20);

      setPotentialMatches(matches);
    } catch (error) {
      console.error('Error fetching potential matches:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updatePreferences = async (updates: Partial<PartyPreferences>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('party_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setPreferences(data as PartyPreferences);
      toast.success('Preferences updated!');

      // Refresh matches with new preferences
      await fetchPotentialMatches(data as PartyPreferences);
      return true;
    } catch (error) {
      console.error('Update preferences error:', error);
      toast.error('Failed to update preferences');
      return false;
    }
  };

  const sendConnectionRequest = async (matchedUserId: string, eventId?: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('party_connections')
        .insert({
          user_id: user.id,
          matched_user_id: matchedUserId,
          event_id: eventId || null,
          connection_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Already connected with this person today');
        } else {
          throw error;
        }
        return false;
      }

      // Get profile for the new connection
      const { data: profile } = await supabase
        .from('safe_profiles')
        .select('id, display_name, avatar_url')
        .eq('id', matchedUserId)
        .single();

      setConnections(prev => [...prev, { ...data as PartyConnection, profile }]);
      
      // Remove from potential matches
      setPotentialMatches(prev => prev.filter(m => m.user_id !== matchedUserId));

      toast.success('Connection request sent! 🎉');
      return true;
    } catch (error) {
      console.error('Send connection error:', error);
      toast.error('Failed to send request');
      return false;
    }
  };

  const respondToConnection = async (connectionId: string, accept: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('party_connections')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', connectionId);

      if (error) throw error;

      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, status: accept ? 'accepted' : 'declined' } : c
      ));

      toast.success(accept ? 'Connection accepted! 🔥' : 'Request declined');
      return true;
    } catch (error) {
      console.error('Respond to connection error:', error);
      toast.error('Failed to respond');
      return false;
    }
  };

  const getPendingRequests = () => {
    return connections.filter(c => 
      c.status === 'pending' && c.matched_user_id === user?.id
    );
  };

  const getActiveConnections = () => {
    return connections.filter(c => c.status === 'accepted');
  };

  return {
    preferences,
    connections,
    potentialMatches,
    loading,
    updatePreferences,
    sendConnectionRequest,
    respondToConnection,
    getPendingRequests,
    getActiveConnections,
    refetch: fetchData,
    ENERGY_LEVELS,
    MUSIC_VIBES,
  };
};

export const usePartyGroups = (eventId?: string) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<PartyMatchGroup[]>([]);
  const [myGroup, setMyGroup] = useState<PartyMatchGroup | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch active groups
      let query = supabase
        .from('party_match_groups')
        .select(`
          *,
          party_match_group_members (
            id, user_id, role
          )
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (eventId) {
        query = query.eq('target_event_id', eventId);
      }

      const { data: groupsData } = await query;

      if (groupsData) {
        // Fetch profiles for members
        const allUserIds = groupsData.flatMap(g => 
          (g.party_match_group_members || []).map((m: any) => m.user_id)
        );

        const { data: profiles } = await supabase
          .from('safe_profiles')
          .select('id, display_name, avatar_url')
          .in('id', allUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const enrichedGroups: PartyMatchGroup[] = groupsData.map(g => ({
          ...g,
          members: (g.party_match_group_members || []).map((m: any) => ({
            ...m,
            profile: profileMap.get(m.user_id),
          })),
        }));

        setGroups(enrichedGroups);

        // Find my group
        const myGrp = enrichedGroups.find(g => 
          g.members?.some(m => m.user_id === user.id)
        );
        setMyGroup(myGrp || null);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user, eventId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, energyLevel: string, targetEventId?: string) => {
    if (!user) return null;

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('party_match_groups')
        .insert({
          creator_id: user.id,
          name,
          energy_level: energyLevel,
          target_event_id: targetEventId || null,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      await supabase
        .from('party_match_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'creator',
        });

      toast.success('Squad created! 🎉');
      await fetchGroups();
      return group as PartyMatchGroup;
    } catch (error) {
      console.error('Create group error:', error);
      toast.error('Failed to create squad');
      return null;
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('party_match_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Already in this squad');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Joined squad! 🔥');
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('Join group error:', error);
      toast.error('Failed to join squad');
      return false;
    }
  };

  const leaveGroup = async () => {
    if (!user || !myGroup) return false;

    try {
      await supabase
        .from('party_match_group_members')
        .delete()
        .eq('group_id', myGroup.id)
        .eq('user_id', user.id);

      // If creator leaves and group is empty, deactivate it
      if (myGroup.creator_id === user.id) {
        await supabase
          .from('party_match_groups')
          .update({ is_active: false })
          .eq('id', myGroup.id);
      }

      toast.success('Left squad');
      setMyGroup(null);
      await fetchGroups();
      return true;
    } catch (error) {
      console.error('Leave group error:', error);
      toast.error('Failed to leave squad');
      return false;
    }
  };

  return {
    groups,
    myGroup,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    refetch: fetchGroups,
  };
};
