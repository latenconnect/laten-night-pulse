import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface Host {
  id: string;
  user_id: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_documents: string[] | null;
  rating: number | null;
  events_hosted: number | null;
  created_at: string;
  verified_at: string | null;
}

export const useHost = () => {
  const { user } = useAuth();
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHost();
    } else {
      setHost(null);
      setLoading(false);
    }
  }, [user]);

  const fetchHost = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('hosts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching host:', error);
    } else {
      setHost(data);
    }
    setLoading(false);
  };

  const applyAsHost = async () => {
    if (!user) {
      toast.error('Please sign in to apply as a host');
      return false;
    }

    if (host) {
      toast.info(`Your application is ${host.verification_status}`);
      return false;
    }

    const { data, error } = await supabase
      .from('hosts')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.info('You have already applied as a host');
      } else {
        toast.error('Failed to submit application');
        console.error(error);
      }
      return false;
    }

    setHost(data);
    toast.success('Host application submitted! We will review it shortly.');
    return true;
  };

  const isVerifiedHost = host?.verification_status === 'verified';
  const isPendingHost = host?.verification_status === 'pending';

  return { host, loading, applyAsHost, isVerifiedHost, isPendingHost, refetch: fetchHost };
};

export const useCreateEvent = () => {
  const { user } = useAuth();
  const { host, isVerifiedHost } = useHost();

  const createEvent = async (eventData: {
    name: string;
    description?: string;
    type: string;
    cover_image?: string;
    location_name: string;
    location_address?: string;
    location_lat?: number;
    location_lng?: number;
    city: string;
    start_time: string;
    end_time?: string;
    price?: number;
    age_limit?: number;
    max_attendees?: number;
    expected_attendance?: number;
    safety_rules?: string;
  }) => {
    if (!user) {
      toast.error('Please sign in to create events');
      return null;
    }

    if (!host || !isVerifiedHost) {
      toast.error('You must be a verified host to create events');
      return null;
    }

    const insertData = {
      name: eventData.name,
      description: eventData.description || null,
      type: eventData.type as 'club' | 'house_party' | 'university' | 'festival' | 'public',
      cover_image: eventData.cover_image || null,
      location_name: eventData.location_name,
      location_address: eventData.location_address || null,
      location_lat: eventData.location_lat || null,
      location_lng: eventData.location_lng || null,
      city: eventData.city,
      start_time: eventData.start_time,
      end_time: eventData.end_time || null,
      price: eventData.price || 0,
      age_limit: eventData.age_limit || 18,
      max_attendees: eventData.max_attendees || null,
      expected_attendance: eventData.expected_attendance || null,
      safety_rules: eventData.safety_rules || null,
      host_id: host.id,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast.error('Failed to create event');
      console.error(error);
      return null;
    }

    toast.success('Event created successfully!');
    return data;
  };

  return { createEvent, canCreateEvent: isVerifiedHost };
};
