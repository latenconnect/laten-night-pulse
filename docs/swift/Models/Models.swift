// Models.swift
// Laten — Data Models (mirrors Supabase schema)

import Foundation
import CoreLocation

// MARK: - Profile
struct Profile: Codable, Identifiable {
    let id: UUID
    var displayName: String?
    var avatarUrl: String?
    var age: Int?
    var city: String?
    var bio: String?
    var ageVerified: Bool?
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case avatarUrl = "avatar_url"
        case age, city, bio
        case ageVerified = "age_verified"
        case createdAt = "created_at"
    }
}

// MARK: - Event
enum EventType: String, Codable, CaseIterable {
    case club, house_party, university, festival, outdoor, foreigner
    
    var label: String {
        switch self {
        case .club: return "Club"
        case .house_party: return "House Party"
        case .university: return "University"
        case .festival: return "Festival"
        case .outdoor: return "Outdoor"
        case .foreigner: return "International"
        }
    }
    
    var icon: String {
        switch self {
        case .club: return "🎵"
        case .house_party: return "🏠"
        case .university: return "🎓"
        case .festival: return "🎪"
        case .outdoor: return "🌙"
        case .foreigner: return "🌍"
        }
    }
}

struct LatenEvent: Codable, Identifiable {
    let id: UUID
    var name: String
    var type: EventType
    var description: String?
    var locationName: String
    var locationAddress: String?
    var locationLat: Double?
    var locationLng: Double?
    var city: String
    var coverImage: String?
    var startTime: String
    var endTime: String?
    var price: Double?
    var ageLimit: Int?
    var expectedAttendance: Int?
    var actualRsvp: Int?
    var hostId: UUID
    var isActive: Bool?
    var isFeatured: Bool?
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id, name, type, description, city, price
        case locationName = "location_name"
        case locationAddress = "location_address"
        case locationLat = "location_lat"
        case locationLng = "location_lng"
        case coverImage = "cover_image"
        case startTime = "start_time"
        case endTime = "end_time"
        case ageLimit = "age_limit"
        case expectedAttendance = "expected_attendance"
        case actualRsvp = "actual_rsvp"
        case hostId = "host_id"
        case isActive = "is_active"
        case isFeatured = "is_featured"
        case createdAt = "created_at"
    }
    
    var coordinate: CLLocationCoordinate2D? {
        guard let lat = locationLat, let lng = locationLng else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

// MARK: - Club / Venue
struct Club: Codable, Identifiable {
    let id: UUID
    var name: String
    var city: String
    var address: String?
    var latitude: Double
    var longitude: Double
    var rating: Double?
    var description: String?
    var googlePlaceId: String
    var googleMapsUri: String?
    var musicGenres: [String]?
    var highlights: [String]?
    var photos: [String]?
    var priceLevel: Int?
    var venueType: String?
    var isActive: Bool?
    var isFeatured: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id, name, city, address, latitude, longitude, rating, description, photos, highlights
        case googlePlaceId = "google_place_id"
        case googleMapsUri = "google_maps_uri"
        case musicGenres = "music_genres"
        case priceLevel = "price_level"
        case venueType = "venue_type"
        case isActive = "is_active"
        case isFeatured = "is_featured"
    }
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

// MARK: - Emergency Alert
struct EmergencyAlert: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var latitude: Double
    var longitude: Double
    var status: String
    var message: String?
    let createdAt: String?
    var resolvedAt: String?
    var notifiedFriendIds: [UUID]?
    
    enum CodingKeys: String, CodingKey {
        case id, latitude, longitude, status, message
        case userId = "user_id"
        case createdAt = "created_at"
        case resolvedAt = "resolved_at"
        case notifiedFriendIds = "notified_friend_ids"
    }
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

// MARK: - Close Friend (Trusted Contact)
struct CloseFriend: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let friendId: UUID
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case friendId = "friend_id"
        case createdAt = "created_at"
    }
}

// MARK: - Story
struct Story: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var mediaUrl: String
    var mediaType: String
    var caption: String?
    var visibility: String
    var viewCount: Int?
    var expiresAt: String
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case mediaUrl = "media_url"
        case mediaType = "media_type"
        case caption, visibility
        case viewCount = "view_count"
        case expiresAt = "expires_at"
        case createdAt = "created_at"
    }
}

// MARK: - User XP
struct UserXP: Codable {
    let userId: UUID
    var totalXp: Int
    var currentLevel: Int
    var xpThisWeek: Int
    var xpThisMonth: Int
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case totalXp = "total_xp"
        case currentLevel = "current_level"
        case xpThisWeek = "xp_this_week"
        case xpThisMonth = "xp_this_month"
    }
}

// MARK: - User Reputation
struct UserReputation: Codable {
    let userId: UUID
    var totalRep: Int
    var reputationLevel: String
    var eventsAttended: Int
    var eventsGhosted: Int
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case totalRep = "total_rep"
        case reputationLevel = "reputation_level"
        case eventsAttended = "events_attended"
        case eventsGhosted = "events_ghosted"
    }
}

// MARK: - User Streak
struct UserStreak: Codable {
    let userId: UUID
    var currentStreak: Int
    var longestStreak: Int
    var totalEventsAttended: Int
    var eventsThisMonth: Int
    var lastActivityDate: String?
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case totalEventsAttended = "total_events_attended"
        case eventsThisMonth = "events_this_month"
        case lastActivityDate = "last_activity_date"
    }
}

// MARK: - Push Token
struct PushToken: Codable {
    let userId: UUID
    var token: String
    var platform: String
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case token, platform
    }
}

// MARK: - Hungarian Cities
struct HungarianCity: Identifiable {
    let id = UUID()
    let name: String
    let coordinate: CLLocationCoordinate2D
}

let hungarianCities: [HungarianCity] = [
    .init(name: "Budapest", coordinate: .init(latitude: 47.4979, longitude: 19.0402)),
    .init(name: "Debrecen", coordinate: .init(latitude: 47.5316, longitude: 21.6273)),
    .init(name: "Szeged", coordinate: .init(latitude: 46.2530, longitude: 20.1414)),
    .init(name: "Pécs", coordinate: .init(latitude: 46.0727, longitude: 18.2323)),
    .init(name: "Győr", coordinate: .init(latitude: 47.6875, longitude: 17.6504)),
    .init(name: "Siófok", coordinate: .init(latitude: 46.9048, longitude: 18.0489)),
    .init(name: "Miskolc", coordinate: .init(latitude: 48.1035, longitude: 20.7784)),
    .init(name: "Eger", coordinate: .init(latitude: 47.9025, longitude: 20.3772)),
    .init(name: "Veszprém", coordinate: .init(latitude: 47.0930, longitude: 17.9093)),
    .init(name: "Székesfehérvár", coordinate: .init(latitude: 47.1860, longitude: 18.4221)),
    .init(name: "Sopron", coordinate: .init(latitude: 47.6851, longitude: 16.5908)),
    .init(name: "Nyíregyháza", coordinate: .init(latitude: 47.9554, longitude: 21.7167)),
    .init(name: "Kaposvár", coordinate: .init(latitude: 46.3594, longitude: 17.7968)),
    .init(name: "Balatonfüred", coordinate: .init(latitude: 46.9573, longitude: 17.8896)),
    .init(name: "Tokaj", coordinate: .init(latitude: 48.1177, longitude: 21.4097)),
    .init(name: "Kecskemét", coordinate: .init(latitude: 46.9062, longitude: 19.6913)),
    .init(name: "Dunaújváros", coordinate: .init(latitude: 46.9619, longitude: 18.9355)),
    .init(name: "Esztergom", coordinate: .init(latitude: 47.7856, longitude: 18.7403)),
    .init(name: "Hévíz", coordinate: .init(latitude: 46.7883, longitude: 17.1894)),
    .init(name: "Zamárdi", coordinate: .init(latitude: 46.8833, longitude: 17.9500)),
]
