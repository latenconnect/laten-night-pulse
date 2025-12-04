import { Event } from '@/types';
import { DbEvent } from '@/hooks/useEvents';

// Convert database event to frontend Event format
export const dbEventToEvent = (dbEvent: DbEvent): Event => {
  return {
    id: dbEvent.id,
    name: dbEvent.name,
    description: dbEvent.description || '',
    type: dbEvent.type as Event['type'],
    coverImage: dbEvent.cover_image || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    hostId: dbEvent.host_id,
    hostName: 'Event Host',
    hostAvatar: undefined,
    isVerified: true,
    location: {
      name: dbEvent.location_name,
      address: dbEvent.location_address || '',
      city: dbEvent.city,
      lat: Number(dbEvent.location_lat) || 47.4979,
      lng: Number(dbEvent.location_lng) || 19.0402,
    },
    startTime: new Date(dbEvent.start_time),
    endTime: dbEvent.end_time ? new Date(dbEvent.end_time) : new Date(dbEvent.start_time),
    price: Number(dbEvent.price) || 0,
    ageLimit: dbEvent.age_limit || 18,
    expectedAttendance: dbEvent.expected_attendance || 100,
    currentRSVP: dbEvent.actual_rsvp || 0,
    isFeatured: dbEvent.is_featured || false,
    createdAt: new Date(dbEvent.created_at),
  };
};

export const dbEventsToEvents = (dbEvents: DbEvent[]): Event[] => {
  return dbEvents.map(dbEventToEvent);
};
