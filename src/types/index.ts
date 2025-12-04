export type EventType = 'club' | 'house_party' | 'university' | 'festival' | 'outdoor' | 'foreigner';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  description: string;
  location: {
    name: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  coverImage: string;
  startTime: Date;
  endTime: Date;
  price: number | null; // null means free
  ageLimit: number;
  dressCode?: string;
  expectedAttendance: number;
  currentRSVP: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  avatar?: string;
  role: 'user' | 'host';
  interests: string[];
  favoriteEvents: string[];
  attendingEvents: string[];
}

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const HUNGARIAN_CITIES: City[] = [
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402 },
  { name: 'Debrecen', country: 'Hungary', lat: 47.5316, lng: 21.6273 },
  { name: 'Szeged', country: 'Hungary', lat: 46.2530, lng: 20.1414 },
  { name: 'Pécs', country: 'Hungary', lat: 46.0727, lng: 18.2323 },
  { name: 'Győr', country: 'Hungary', lat: 47.6875, lng: 17.6504 },
  { name: 'Siófok', country: 'Hungary', lat: 46.9048, lng: 18.0489 },
  { name: 'Miskolc', country: 'Hungary', lat: 48.1035, lng: 20.7784 },
  { name: 'Eger', country: 'Hungary', lat: 47.9025, lng: 20.3772 },
  { name: 'Veszprém', country: 'Hungary', lat: 47.0930, lng: 17.9093 },
  { name: 'Székesfehérvár', country: 'Hungary', lat: 47.1860, lng: 18.4221 },
  { name: 'Sopron', country: 'Hungary', lat: 47.6851, lng: 16.5908 },
  { name: 'Nyíregyháza', country: 'Hungary', lat: 47.9554, lng: 21.7167 },
  { name: 'Kaposvár', country: 'Hungary', lat: 46.3594, lng: 17.7968 },
  { name: 'Balatonfüred', country: 'Hungary', lat: 46.9573, lng: 17.8896 },
  { name: 'Tokaj', country: 'Hungary', lat: 48.1177, lng: 21.4097 },
  { name: 'Kecskemét', country: 'Hungary', lat: 46.9062, lng: 19.6913 },
  { name: 'Dunaújváros', country: 'Hungary', lat: 46.9619, lng: 18.9355 },
  { name: 'Esztergom', country: 'Hungary', lat: 47.7856, lng: 18.7403 },
  { name: 'Hévíz', country: 'Hungary', lat: 46.7883, lng: 17.1894 },
  { name: 'Zamárdi', country: 'Hungary', lat: 46.8833, lng: 17.9500 },
];

export const EVENT_TYPES = [
  { id: 'club', label: 'Club', icon: '🎵' },
  { id: 'house_party', label: 'House Party', icon: '🏠' },
  { id: 'university', label: 'University', icon: '🎓' },
  { id: 'festival', label: 'Festival', icon: '🎪' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌙' },
  { id: 'foreigner', label: 'International', icon: '🌍' },
] as const;

export const INTERESTS = [
  'Techno',
  'House',
  'Hip-Hop',
  'EDM',
  'R&B',
  'Latin',
  'Pop',
  'Rock',
  'Jazz',
  'Drum & Bass',
  'Trance',
  'Afrobeats',
  'Reggaeton',
  'K-Pop',
  'Indie',
];
