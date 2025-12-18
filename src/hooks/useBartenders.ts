import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface BartenderProfile {
  id: string;
  user_id: string;
  bartender_name: string;
  bio: string | null;
  profile_photo: string | null;
  skills: string[];
  experience_level: string;
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

export interface BartenderSubscription {
  id: string;
  bartender_profile_id: string;
  status: string;
  tier: string;
  price_cents: number;
  currency: string;
  started_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
}

export interface BartenderAvailability {
  id: string;
  bartender_profile_id: string;
  date: string;
  is_available: boolean;
  notes: string | null;
}

export interface BartenderBookingRequest {
  id: string;
  bartender_profile_id: string;
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
  bartender_response: string | null;
  created_at: string;
}

export interface BartenderReview {
  id: string;
  bartender_profile_id: string;
  user_id: string;
  booking_id: string | null;
  rating: number;
  review: string | null;
  created_at: string;
}

export interface BartenderFilters {
  city?: string;
  skills?: string[];
  eventTypes?: string[];
  priceMin?: number;
  priceMax?: number;
  availableDate?: string;
}

export const BARTENDER_SKILLS = [
  'Classic Cocktails', 'Mixology', 'Flair Bartending', 'Wine Service',
  'Speed Bartending', 'Craft Beer', 'Non-Alcoholic Drinks', 'Event Setup',
  'Bar Management', 'Customer Service', 'Molecular Mixology'
];

export const BARTENDER_EVENT_TYPES = [
  'House Party', 'Club', 'Birthday', 'Wedding',
  'Corporate', 'Festival', 'Private Event', 'Bar Opening'
];

export const BARTENDER_SUBSCRIPTION_PRICE = 4000; // HUF

export const useBartenders = (filters?: BartenderFilters) => {
  const { data: bartenders, isLoading, error } = useQuery({
    queryKey: ['bartenders', filters],
    queryFn: async () => {
      let query = supabase
        .from('bartender_profiles')
        .select('*')
        .eq('is_active', true);

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }

      if (filters?.skills && filters.skills.length > 0) {
        query = query.overlaps('skills', filters.skills);
      }

      if (filters?.eventTypes && filters.eventTypes.length > 0) {
        query = query.overlaps('preferred_event_types', filters.eventTypes);
      }

      if (filters?.priceMax) {
        query = query.lte('price_min', filters.priceMax);
      }

      const { data, error } = await query.order('rating', { ascending: false });

      if (error) throw error;
      return data as BartenderProfile[];
    },
  });

  return { bartenders: bartenders || [], isLoading, error };
};

export const useBartenderProfile = (bartenderId?: string) => {
  return useQuery({
    queryKey: ['bartender-profile', bartenderId],
    queryFn: async () => {
      if (!bartenderId) return null;
      
      const { data, error } = await supabase
        .from('bartender_profiles')
        .select('*')
        .eq('id', bartenderId)
        .maybeSingle();

      if (error) throw error;
      return data as BartenderProfile | null;
    },
    enabled: !!bartenderId,
  });
};

export const useMyBartenderProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-bartender-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('bartender_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as BartenderProfile | null;
    },
    enabled: !!user,
  });
};

export const useMyBartenderSubscription = () => {
  const { data: profile } = useMyBartenderProfile();

  return useQuery({
    queryKey: ['my-bartender-subscription', profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      
      const { data, error } = await supabase
        .from('bartender_subscriptions')
        .select('*')
        .eq('bartender_profile_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data as BartenderSubscription | null;
    },
    enabled: !!profile,
  });
};

export const useBartenderAvailability = (bartenderId?: string) => {
  return useQuery({
    queryKey: ['bartender-availability', bartenderId],
    queryFn: async () => {
      if (!bartenderId) return [];
      
      const { data, error } = await supabase
        .from('bartender_availability')
        .select('*')
        .eq('bartender_profile_id', bartenderId)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      return data as BartenderAvailability[];
    },
    enabled: !!bartenderId,
  });
};

export const useBartenderReviews = (bartenderId?: string) => {
  return useQuery({
    queryKey: ['bartender-reviews', bartenderId],
    queryFn: async () => {
      if (!bartenderId) return [];
      
      const { data, error } = await supabase
        .from('bartender_reviews')
        .select('*')
        .eq('bartender_profile_id', bartenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BartenderReview[];
    },
    enabled: !!bartenderId,
  });
};

export const useCreateBartenderProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profile: Partial<BartenderProfile>) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('bartender_profiles')
        .insert({
          user_id: user.id,
          bartender_name: profile.bartender_name!,
          bio: profile.bio,
          profile_photo: profile.profile_photo,
          skills: profile.skills || [],
          experience_level: profile.experience_level || 'intermediate',
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
      queryClient.invalidateQueries({ queryKey: ['my-bartender-profile'] });
      toast.success('Bartender profile created!');
    },
    onError: (error) => {
      toast.error('Failed to create profile: ' + error.message);
    },
  });
};

export const useUpdateBartenderProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BartenderProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from('bartender_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bartender-profile'] });
      queryClient.invalidateQueries({ queryKey: ['bartenders'] });
      toast.success('Profile updated!');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
};

export const useCreateBartenderBookingRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: Omit<BartenderBookingRequest, 'id' | 'user_id' | 'status' | 'bartender_response' | 'created_at'> & {
      bartenderUserId: string;
      bartenderName: string;
      bookerName: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { bartenderUserId, bartenderName, bookerName, ...bookingData } = request;

      const { data, error } = await supabase
        .from('bartender_booking_requests')
        .insert({
          ...bookingData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send push notification to the bartender (fire and forget)
      supabase.functions.invoke('send-booking-notification', {
        body: {
          type: 'bartender_booking',
          professionalUserId: bartenderUserId,
          professionalName: bartenderName,
          bookerName,
          eventDate: bookingData.event_date,
          eventType: bookingData.event_type,
          eventLocation: bookingData.event_location,
        },
      }).catch(err => console.log('Notification send failed:', err));

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bartender-booking-requests'] });
      toast.success('Booking request sent!');
    },
    onError: (error) => {
      toast.error('Failed to send request: ' + error.message);
    },
  });
};

export const useMyBartenderBookingRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-bartender-booking-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bartender_booking_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BartenderBookingRequest[];
    },
    enabled: !!user,
  });
};

export const useBartenderBookingRequests = () => {
  const { data: profile } = useMyBartenderProfile();

  return useQuery({
    queryKey: ['bartender-booking-requests', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('bartender_booking_requests')
        .select('*')
        .eq('bartender_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BartenderBookingRequest[];
    },
    enabled: !!profile,
  });
};
