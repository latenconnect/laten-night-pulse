import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Event } from '@/types';

export interface DbEvent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  cover_image: string | null;
  photos: string[] | null;
  location_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  city: string;
  country: string | null;
  start_time: string;
  end_time: string | null;
  price: number | null;
  age_limit: number | null;
  max_attendees: number | null;
  expected_attendance: number | null;
  actual_rsvp: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  safety_rules: string | null;
  host_id: string;
  created_at: string;
}

// Transform database event to frontend Event type
export const transformDbEvent = (dbEvent: DbEvent): Event => ({
  id: dbEvent.id,
  name: dbEvent.name,
  type: dbEvent.type as Event['type'],
  description: dbEvent.description || '',
  location: {
    name: dbEvent.location_name,
    address: dbEvent.location_address || '',
    city: dbEvent.city,
    lat: dbEvent.location_lat || 0,
    lng: dbEvent.location_lng || 0,
  },
  coverImage: dbEvent.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
  startTime: new Date(dbEvent.start_time),
  endTime: dbEvent.end_time ? new Date(dbEvent.end_time) : new Date(dbEvent.start_time),
  price: dbEvent.price,
  ageLimit: dbEvent.age_limit || 18,
  expectedAttendance: dbEvent.expected_attendance || 100,
  currentRSVP: dbEvent.actual_rsvp || 0,
  hostId: dbEvent.host_id,
  hostName: 'Host', // Would need to join with hosts table
  isVerified: true,
  isFeatured: dbEvent.is_featured || false,
  createdAt: new Date(dbEvent.created_at),
});

export interface DbEvent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  cover_image: string | null;
  photos: string[] | null;
  location_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  city: string;
  country: string | null;
  start_time: string;
  end_time: string | null;
  price: number | null;
  age_limit: number | null;
  max_attendees: number | null;
  expected_attendance: number | null;
  actual_rsvp: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  safety_rules: string | null;
  host_id: string;
  created_at: string;
}

export const useEvents = (city?: string) => {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    let query = supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [city]);

  // Subscribe to realtime changes for events
  useEffect(() => {
    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Realtime event update:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as DbEvent;
            // Only add if active and matches city filter
            if (newEvent.is_active && (!city || newEvent.city === city)) {
              setEvents(prev => [...prev, newEvent].sort((a, b) => 
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
              ));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = payload.new as DbEvent;
            setEvents(prev => {
              // If event is no longer active or doesn't match city, remove it
              if (!updatedEvent.is_active || (city && updatedEvent.city !== city)) {
                return prev.filter(e => e.id !== updatedEvent.id);
              }
              // Otherwise update or add the event
              const exists = prev.find(e => e.id === updatedEvent.id);
              if (exists) {
                return prev.map(e => e.id === updatedEvent.id ? updatedEvent : e);
              } else {
                return [...prev, updatedEvent].sort((a, b) => 
                  new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                );
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedEvent = payload.old as DbEvent;
            setEvents(prev => prev.filter(e => e.id !== deletedEvent.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [city]);

  return { events, loading, refetch: fetchEvents };
};

export const useEvent = (eventId?: string) => {
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const fetchEvent = async () => {
    if (!eventId) return;
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
    } else {
      setEvent(data);
    }
    setLoading(false);
  };

  return { event, loading, refetch: fetchEvent };
};

export const useSavedEvents = () => {
  const { user } = useAuth();
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [savedEvents, setSavedEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedEvents();
    } else {
      setSavedEventIds([]);
      setSavedEvents([]);
      setLoading(false);
    }
  }, [user]);

  const fetchSavedEvents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_events')
      .select('event_id, events(*)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching saved events:', error);
    } else {
      const ids = data?.map(s => s.event_id) || [];
      const events = data?.map(s => s.events).filter(Boolean) as DbEvent[] || [];
      setSavedEventIds(ids);
      setSavedEvents(events);
    }
    setLoading(false);
  };

  const saveEvent = async (eventId: string) => {
    if (!user) {
      toast.error('Please sign in to save events');
      return false;
    }

    const { error } = await supabase
      .from('saved_events')
      .insert({ event_id: eventId, user_id: user.id });

    if (error) {
      if (error.code === '23505') {
        toast.info('Event already saved');
      } else {
        toast.error('Failed to save event');
      }
      return false;
    }

    setSavedEventIds(prev => [...prev, eventId]);
    toast.success('Event saved!');
    return true;
  };

  const unsaveEvent = async (eventId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('saved_events')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to unsave event');
      return false;
    }

    setSavedEventIds(prev => prev.filter(id => id !== eventId));
    setSavedEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success('Event removed from saved');
    return true;
  };

  const isEventSaved = (eventId: string) => savedEventIds.includes(eventId);

  return { savedEvents, savedEventIds, loading, saveEvent, unsaveEvent, isEventSaved, refetch: fetchSavedEvents };
};

export const useEventRsvp = () => {
  const { user } = useAuth();
  const [rsvpEventIds, setRsvpEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRsvps();
    } else {
      setRsvpEventIds([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRsvps = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching RSVPs:', error);
    } else {
      setRsvpEventIds(data?.map(r => r.event_id) || []);
    }
    setLoading(false);
  };

  const rsvpToEvent = async (eventId: string) => {
    if (!user) {
      toast.error('Please sign in to RSVP');
      return false;
    }

    const { error } = await supabase
      .from('event_rsvps')
      .insert({ event_id: eventId, user_id: user.id });

    if (error) {
      if (error.code === '23505') {
        toast.info('Already RSVPed to this event');
      } else {
        toast.error('Failed to RSVP');
      }
      return false;
    }

    setRsvpEventIds(prev => [...prev, eventId]);
    toast.success("You're going! 🎉");
    return true;
  };

  const cancelRsvp = async (eventId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to cancel RSVP');
      return false;
    }

    setRsvpEventIds(prev => prev.filter(id => id !== eventId));
    toast.success('RSVP cancelled');
    return true;
  };

  const hasRsvped = (eventId: string) => rsvpEventIds.includes(eventId);

  return { rsvpEventIds, loading, rsvpToEvent, cancelRsvp, hasRsvped, refetch: fetchRsvps };
};

export const useReportEvent = () => {
  const { user } = useAuth();

  const reportEvent = async (eventId: string, reason: string, description?: string) => {
    if (!user) {
      toast.error('Please sign in to report events');
      return false;
    }

    const { error } = await supabase
      .from('reports')
      .insert({ 
        event_id: eventId, 
        reporter_id: user.id,
        reason,
        description
      });

    if (error) {
      if (error.code === '23505') {
        toast.info('You have already reported this event');
      } else {
        toast.error('Failed to submit report');
      }
      return false;
    }

    toast.success('Report submitted. Thank you for keeping Laten safe!');
    return true;
  };

  return { reportEvent };
};
