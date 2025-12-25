import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface DJProfile {
  id: string;
  user_id: string;
  dj_name: string;
  bio: string | null;
  profile_photo: string | null;
  genres: string[];
  experience_level: string;
  soundcloud_url: string | null;
  mixcloud_url: string | null;
  instagram_url: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  preferred_event_types: string[];
  city: string;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface DJSubscription {
  id: string;
  dj_profile_id: string;
  status: string;
  tier: string;
  price_cents: number;
  currency: string;
  started_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
}

export interface DJAvailability {
  id: string;
  dj_profile_id: string;
  date: string;
  is_available: boolean;
  notes: string | null;
}

export interface BookingRequest {
  id: string;
  dj_profile_id: string;
  user_id: string;
  event_date: string;
  event_type: string;
  event_location: string | null;
  event_description: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  status: string;
  message: string | null;
  dj_response: string | null;
  created_at: string;
}

export interface DJReview {
  id: string;
  dj_profile_id: string;
  user_id: string;
  booking_id: string | null;
  rating: number;
  review: string | null;
  created_at: string;
}

export interface DJFilters {
  city?: string;
  genres?: string[];
  eventTypes?: string[];
  priceMin?: number;
  priceMax?: number;
  availableDate?: string;
}

const MUSIC_GENRES = [
  'Techno', 'House', 'EDM', 'Hip-Hop', 'RnB', 'Commercial', 
  'Drum & Bass', 'Trance', 'Deep House', 'Tech House', 
  'Minimal', 'Progressive', 'Afrobeats', 'Reggaeton', 'Pop'
];

const EVENT_TYPES = [
  'House Party', 'Club', 'Birthday', 'Student Event', 
  'Wedding', 'Corporate', 'Festival', 'Private Event'
];

export const DJ_SUBSCRIPTION_PRICE = 15; // EUR

export const useDJs = (filters?: DJFilters) => {
  const { data: djs, isLoading, error } = useQuery({
    queryKey: ['djs', filters],
    queryFn: async () => {
      // First get all active DJ profiles with their subscriptions
      const { data: profiles, error: profilesError } = await supabase
        .from('dj_profiles')
        .select('*')
        .eq('is_active', true);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      // Get active subscriptions for these profiles
      const profileIds = profiles.map(p => p.id);
      const { data: subscriptions, error: subsError } = await supabase
        .from('dj_subscriptions')
        .select('dj_profile_id, status, expires_at')
        .in('dj_profile_id', profileIds)
        .eq('status', 'active');

      if (subsError) throw subsError;

      // Filter to only DJs with active, non-expired subscriptions
      const now = new Date();
      const activeSubProfileIds = new Set(
        (subscriptions || [])
          .filter(s => s.expires_at && new Date(s.expires_at) > now)
          .map(s => s.dj_profile_id)
      );

      let filteredProfiles = profiles.filter(p => activeSubProfileIds.has(p.id));

      // Apply additional filters
      if (filters?.city) {
        filteredProfiles = filteredProfiles.filter(p => p.city === filters.city);
      }

      if (filters?.genres && filters.genres.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.genres?.some((g: string) => filters.genres!.includes(g))
        );
      }

      if (filters?.eventTypes && filters.eventTypes.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.preferred_event_types?.some((e: string) => filters.eventTypes!.includes(e))
        );
      }

      if (filters?.priceMax) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.price_min === null || p.price_min <= filters.priceMax!
        );
      }

      // Sort by rating
      return filteredProfiles.sort((a, b) => (b.rating || 0) - (a.rating || 0)) as DJProfile[];
    },
  });

  return { djs: djs || [], isLoading, error };
};

export const useDJProfile = (djId?: string) => {
  return useQuery({
    queryKey: ['dj-profile', djId],
    queryFn: async () => {
      if (!djId) return null;
      
      const { data, error } = await supabase
        .from('dj_profiles')
        .select('*')
        .eq('id', djId)
        .maybeSingle();

      if (error) throw error;
      return data as DJProfile | null;
    },
    enabled: !!djId,
  });
};

export const useMyDJProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-dj-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('dj_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as DJProfile | null;
    },
    enabled: !!user,
  });
};

export const useMyDJSubscription = () => {
  const { data: profile } = useMyDJProfile();

  return useQuery({
    queryKey: ['my-dj-subscription', profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      
      const { data, error } = await supabase
        .from('dj_subscriptions')
        .select('*')
        .eq('dj_profile_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data as DJSubscription | null;
    },
    enabled: !!profile,
  });
};

export const useDJAvailability = (djId?: string) => {
  return useQuery({
    queryKey: ['dj-availability', djId],
    queryFn: async () => {
      if (!djId) return [];
      
      const { data, error } = await supabase
        .from('dj_availability')
        .select('*')
        .eq('dj_profile_id', djId)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      return data as DJAvailability[];
    },
    enabled: !!djId,
  });
};

export const useDJReviews = (djId?: string) => {
  return useQuery({
    queryKey: ['dj-reviews', djId],
    queryFn: async () => {
      if (!djId) return [];
      
      const { data, error } = await supabase
        .from('dj_reviews')
        .select('*')
        .eq('dj_profile_id', djId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DJReview[];
    },
    enabled: !!djId,
  });
};

export const useCreateDJProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profile: Partial<DJProfile>) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('dj_profiles')
        .insert({
          user_id: user.id,
          dj_name: profile.dj_name!,
          bio: profile.bio,
          profile_photo: profile.profile_photo,
          genres: profile.genres || [],
          experience_level: profile.experience_level || 'intermediate',
          soundcloud_url: profile.soundcloud_url,
          mixcloud_url: profile.mixcloud_url,
          instagram_url: profile.instagram_url,
          price_min: profile.price_min,
          price_max: profile.price_max,
          preferred_event_types: profile.preferred_event_types || [],
          city: profile.city || 'Budapest',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-dj-profile'] });
      toast.success('DJ profile created!');
    },
    onError: (error) => {
      toast.error('Failed to create profile: ' + error.message);
    },
  });
};

export const useUpdateDJProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DJProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from('dj_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-dj-profile'] });
      queryClient.invalidateQueries({ queryKey: ['djs'] });
      toast.success('Profile updated!');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
};

export const useCreateBookingRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: Omit<BookingRequest, 'id' | 'user_id' | 'status' | 'dj_response' | 'created_at'> & { 
      djUserId: string; 
      djName: string;
      bookerName: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { djUserId, djName, bookerName, ...bookingData } = request;

      const { data, error } = await supabase
        .from('dj_booking_requests')
        .insert({
          ...bookingData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send push notification to the DJ (fire and forget)
      supabase.functions.invoke('send-booking-notification', {
        body: {
          type: 'dj_booking',
          professionalUserId: djUserId,
          professionalName: djName,
          bookerName,
          eventDate: bookingData.event_date,
          eventType: bookingData.event_type,
          eventLocation: bookingData.event_location,
        },
      }).catch(err => console.log('Notification send failed:', err));

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-booking-requests'] });
      toast.success('Booking request sent!');
    },
    onError: (error) => {
      toast.error('Failed to send request: ' + error.message);
    },
  });
};

export const useMyBookingRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-booking-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('dj_booking_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BookingRequest[];
    },
    enabled: !!user,
  });
};

export const useDJBookingRequests = () => {
  const { data: profile } = useMyDJProfile();

  return useQuery({
    queryKey: ['dj-booking-requests', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('dj_booking_requests')
        .select('*')
        .eq('dj_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BookingRequest[];
    },
    enabled: !!profile,
  });
};

export { MUSIC_GENRES, EVENT_TYPES };
