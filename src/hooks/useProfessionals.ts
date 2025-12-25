import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Types
export type ProfessionType = 'dj' | 'bartender' | 'photographer' | 'security';

export interface Professional {
  id: string;
  user_id: string;
  profession_type: ProfessionType;
  display_name: string;
  bio: string | null;
  profile_photo: string | null;
  city: string;
  country: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  experience_level: string | null;
  skills: string[];
  preferred_event_types: string[];
  genres: string[];
  soundcloud_url: string | null;
  mixcloud_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalSubscription {
  id: string;
  professional_id: string;
  tier: string;
  status: string;
  price_cents: number;
  currency: string;
  started_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
}

export interface ProfessionalAvailability {
  id: string;
  professional_id: string;
  date: string;
  is_available: boolean;
  notes: string | null;
}

export interface ProfessionalBooking {
  id: string;
  professional_id: string;
  user_id: string;
  event_date: string;
  event_type: string;
  event_location: string | null;
  event_description: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  message: string | null;
  status: string;
  professional_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalReview {
  id: string;
  professional_id: string;
  user_id: string;
  booking_id: string | null;
  rating: number;
  review: string | null;
  created_at: string;
}

export interface ProfessionalFilters {
  city?: string;
  professionTypes?: ProfessionType[];
  genres?: string[];
  skills?: string[];
  eventTypes?: string[];
  priceMin?: number;
  priceMax?: number;
  availableDate?: string;
}

// Constants
export const PROFESSION_LABELS: Record<ProfessionType, string> = {
  dj: 'DJ',
  bartender: 'Bartender',
  photographer: 'Photographer',
  security: 'Security',
};

export const PROFESSION_ICONS: Record<ProfessionType, string> = {
  dj: 'Music',
  bartender: 'Wine',
  photographer: 'Camera',
  security: 'Shield',
};

export const MUSIC_GENRES = [
  'House', 'Techno', 'EDM', 'Hip Hop', 'R&B', 'Pop', 'Rock', 
  'Latin', 'Reggaeton', 'Drum & Bass', 'Dubstep', 'Trance', 
  'Deep House', 'Tech House', 'Minimal', 'Progressive'
];

export const BARTENDER_SKILLS = [
  'Cocktail Mixing', 'Flair Bartending', 'Wine Service', 'Beer Expert',
  'Mocktails', 'Event Setup', 'Bar Management', 'Speed Service'
];

export const PHOTOGRAPHER_SKILLS = [
  'Event Photography', 'Portrait', 'Candid Shots', 'Video Recording',
  'Photo Editing', 'Drone Photography', 'Night Photography', 'Group Photos'
];

export const SECURITY_SKILLS = [
  'Crowd Control', 'ID Verification', 'VIP Protection', 'Emergency Response',
  'Conflict Resolution', 'First Aid', 'Access Control', 'Risk Assessment'
];

export const EVENT_TYPES = [
  'Club Night', 'Private Party', 'Wedding', 'Corporate Event',
  'Festival', 'Bar/Restaurant', 'House Party', 'Birthday Party'
];

// Hooks
export function useProfessionals(filters?: ProfessionalFilters) {
  return useQuery({
    queryKey: ['professionals', filters],
    queryFn: async () => {
      // First get all active professional profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('professionals')
        .select('*')
        .eq('is_active', true);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      // Get active subscriptions for these profiles
      const profileIds = profiles.map(p => p.id);
      const { data: subscriptions, error: subsError } = await supabase
        .from('professional_subscriptions')
        .select('professional_id, status, expires_at')
        .in('professional_id', profileIds)
        .eq('status', 'active');

      if (subsError) throw subsError;

      // Filter to only professionals with active, non-expired subscriptions
      const now = new Date();
      const activeSubProfileIds = new Set(
        (subscriptions || [])
          .filter(s => s.expires_at && new Date(s.expires_at) > now)
          .map(s => s.professional_id)
      );

      let filteredProfiles = profiles.filter(p => activeSubProfileIds.has(p.id));

      // Apply additional filters
      if (filters?.city) {
        filteredProfiles = filteredProfiles.filter(p => p.city === filters.city);
      }

      if (filters?.professionTypes && filters.professionTypes.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => 
          filters.professionTypes!.includes(p.profession_type as ProfessionType)
        );
      }

      if (filters?.genres && filters.genres.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.genres?.some((g: string) => filters.genres!.includes(g))
        );
      }

      if (filters?.skills && filters.skills.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.skills?.some((s: string) => filters.skills!.includes(s))
        );
      }

      if (filters?.priceMin) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.price_min === null || p.price_min >= filters.priceMin!
        );
      }

      if (filters?.priceMax) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.price_max === null || p.price_max <= filters.priceMax!
        );
      }

      // Sort by rating
      return filteredProfiles.sort((a, b) => (b.rating || 0) - (a.rating || 0)) as Professional[];
    },
  });
}

export function useProfessionalProfile(id?: string) {
  return useQuery({
    queryKey: ['professional', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Professional;
    },
    enabled: !!id,
  });
}

export function useMyProfessionalProfiles() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-professionals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []) as Professional[];
    },
    enabled: !!user,
  });
}

export function useMyProfessionalProfile(professionType?: ProfessionType) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-professional', user?.id, professionType],
    queryFn: async () => {
      if (!user) return null;
      
      let query = supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id);
        
      if (professionType) {
        query = query.eq('profession_type', professionType);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as Professional | null;
    },
    enabled: !!user,
  });
}

export function useProfessionalSubscription(professionalId?: string) {
  return useQuery({
    queryKey: ['professional-subscription', professionalId],
    queryFn: async () => {
      if (!professionalId) return null;
      
      const { data, error } = await supabase
        .from('professional_subscriptions')
        .select('*')
        .eq('professional_id', professionalId)
        .maybeSingle();

      if (error) throw error;
      return data as ProfessionalSubscription | null;
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalAvailability(professionalId?: string) {
  return useQuery({
    queryKey: ['professional-availability', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('professional_id', professionalId)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date');

      if (error) throw error;
      return (data || []) as ProfessionalAvailability[];
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalReviews(professionalId?: string) {
  return useQuery({
    queryKey: ['professional-reviews', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from('professional_reviews')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProfessionalReview[];
    },
    enabled: !!professionalId,
  });
}

export function useCreateProfessionalProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profile: Partial<Professional> & { profession_type: ProfessionType; display_name: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('professionals')
        .insert({
          ...profile,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Professional;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-professionals'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}

export function useUpdateProfessionalProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Professional> & { id: string }) => {
      const { data, error } = await supabase
        .from('professionals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Professional;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['professional', data.id] });
      queryClient.invalidateQueries({ queryKey: ['my-professionals'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}

export function useCreateBookingRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (booking: Omit<ProfessionalBooking, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'professional_response'>) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('professional_bookings')
        .insert({
          ...booking,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProfessionalBooking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

export function useMyBookingRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('professional_bookings')
        .select('*, professionals(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useProfessionalBookings(professionalId?: string) {
  return useQuery({
    queryKey: ['professional-bookings', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from('professional_bookings')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProfessionalBooking[];
    },
    enabled: !!professionalId,
  });
}

export function useMyProfessionalSubscription() {
  const { data: profile } = useMyProfessionalProfile();
  
  return useQuery({
    queryKey: ['my-professional-subscription', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('professional_subscriptions')
        .select('*')
        .eq('professional_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data as ProfessionalSubscription | null;
    },
    enabled: !!profile?.id,
  });
}

export function useMyProfessionalBookings() {
  const { data: profile } = useMyProfessionalProfile();
  
  return useQuery({
    queryKey: ['my-professional-bookings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('professional_bookings')
        .select('*')
        .eq('professional_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProfessionalBooking[];
    },
    enabled: !!profile?.id,
  });
}
