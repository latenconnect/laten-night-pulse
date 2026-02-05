# Laten Native iOS Architecture Guide

> Complete backend documentation for building the native SwiftUI app

---

## 1. Project Configuration

### Bundle & Team
```
Bundle ID: com.laten.app
Team ID: 6BA8ZY4ZPX
Deployment Target: iOS 15.0+
```

### Supabase Configuration
```swift
struct SupabaseConfig {
    static let url = URL(string: "https://huigwbyctzjictnaycjj.supabase.co")!
    static let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aWd3YnljdHpqaWN0bmF5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjY0NjYsImV4cCI6MjA4MDQ0MjQ2Nn0.q9WSajU3VpAGr4N2woiKO9zHIc8koJyRjkGs8aSHhFg"
}
```

### Required SPM Dependencies
```swift
// Package.swift or Xcode Package Dependencies
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
    .package(url: "https://github.com/mapbox/mapbox-maps-ios", from: "11.0.0"),
    .package(url: "https://github.com/googleads/swift-package-manager-google-mobile-ads", from: "11.0.0"),
    .package(url: "https://github.com/onevcat/Kingfisher", from: "7.0.0"),
]
```

### Xcode Capabilities Required
1. **Sign in with Apple** - Authentication
2. **Push Notifications** - APNs
3. **Associated Domains**: 
   - `applinks:latenapp.com`
   - `webcredentials:latenapp.com`
4. **In-App Purchase** - StoreKit 2
5. **Background Modes**: Remote notifications

### Info.plist Entries
```xml
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID for quick sign-in</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Find events near you</string>
<key>NSCameraUsageDescription</key>
<string>Take photos for your profile and stories</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Share photos in your stories</string>
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-4192366585858201~8396389324</string>
<key>SKAdNetworkItems</key>
<!-- Add Google AdMob SKAdNetwork IDs -->
```

---

## 2. Swift Data Models

### Core Models

```swift
import Foundation

// MARK: - Profile
struct Profile: Codable, Identifiable {
    let id: UUID
    var displayName: String?
    var bio: String?
    var avatarUrl: String?
    var age: Int?
    var city: String?
    var preferences: [String]?
    var isVerified: Bool
    var instagramHandle: String?
    var tiktokHandle: String?
    var partyPersonality: String?
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case bio
        case avatarUrl = "avatar_url"
        case age
        case city
        case preferences
        case isVerified = "is_verified"
        case instagramHandle = "instagram_handle"
        case tiktokHandle = "tiktok_handle"
        case partyPersonality = "party_personality"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Event
struct Event: Codable, Identifiable {
    let id: UUID
    let hostId: UUID
    var name: String
    var type: EventType
    var locationName: String
    var locationAddress: String?
    var city: String
    var latitude: Double?
    var longitude: Double?
    var startTime: Date
    var endTime: Date?
    var price: Double?
    var ageLimit: Int
    var description: String?
    var coverImage: String?
    var expectedAttendance: Int?
    var maxAttendees: Int?
    var actualRsvp: Int
    var isActive: Bool
    var isVerified: Bool
    var isFeatured: Bool
    var safetyRules: String?
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case hostId = "host_id"
        case name
        case type
        case locationName = "location_name"
        case locationAddress = "location_address"
        case city
        case latitude
        case longitude
        case startTime = "start_time"
        case endTime = "end_time"
        case price
        case ageLimit = "age_limit"
        case description
        case coverImage = "cover_image"
        case expectedAttendance = "expected_attendance"
        case maxAttendees = "max_attendees"
        case actualRsvp = "actual_rsvp"
        case isActive = "is_active"
        case isVerified = "is_verified"
        case isFeatured = "is_featured"
        case safetyRules = "safety_rules"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

enum EventType: String, Codable, CaseIterable {
    case club = "club"
    case houseParty = "house_party"
    case festival = "festival"
    case university = "university"
    case outdoor = "outdoor"
    case foreigner = "foreigner"
    
    var icon: String {
        switch self {
        case .club: return "🎵"
        case .houseParty: return "🏠"
        case .festival: return "🎪"
        case .university: return "🎓"
        case .outdoor: return "🌳"
        case .foreigner: return "🌍"
        }
    }
    
    var label: String {
        switch self {
        case .club: return "Club"
        case .houseParty: return "House Party"
        case .festival: return "Festival"
        case .university: return "University"
        case .outdoor: return "Outdoor"
        case .foreigner: return "International"
        }
    }
}

// MARK: - Host
struct Host: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var hostName: String
    var bio: String?
    var profilePhoto: String?
    var rating: Double?
    var totalEvents: Int
    var isVerified: Bool
    var verificationCode: String?
    var instagramHandle: String?
    var twitterHandle: String?
    var websiteUrl: String?
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case hostName = "host_name"
        case bio
        case profilePhoto = "profile_photo"
        case rating
        case totalEvents = "total_events"
        case isVerified = "is_verified"
        case verificationCode = "verification_code"
        case instagramHandle = "instagram_handle"
        case twitterHandle = "twitter_handle"
        case websiteUrl = "website_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Club (Venue)
struct Club: Codable, Identifiable {
    let id: UUID
    let googlePlaceId: String
    var name: String
    var address: String?
    var city: String
    var country: String?
    var latitude: Double
    var longitude: Double
    var rating: Double?
    var priceLevel: Int?
    var photos: [String]?
    var googleMapsUri: String?
    var businessStatus: String?
    var openingHours: [String: Any]? // JSONB
    var venueType: String?
    var isFeatured: Bool
    var description: String?
    var services: [String]?
    var highlights: [String]?
    var musicGenres: [String]?
    var isActive: Bool
    let createdAt: Date
    var lastUpdated: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case googlePlaceId = "google_place_id"
        case name
        case address
        case city
        case country
        case latitude
        case longitude
        case rating
        case priceLevel = "price_level"
        case photos
        case googleMapsUri = "google_maps_uri"
        case businessStatus = "business_status"
        case venueType = "venue_type"
        case isFeatured = "is_featured"
        case description
        case services
        case highlights
        case musicGenres = "music_genres"
        case isActive = "is_active"
        case createdAt = "created_at"
        case lastUpdated = "last_updated"
    }
}

// MARK: - Event RSVP
struct EventRSVP: Codable, Identifiable {
    let id: UUID
    let eventId: UUID
    let userId: UUID
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case eventId = "event_id"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}

// MARK: - Saved Event
struct SavedEvent: Codable, Identifiable {
    let id: UUID
    let eventId: UUID
    let userId: UUID
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case eventId = "event_id"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}

// MARK: - Story
struct Story: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var mediaUrl: String
    var mediaType: String // "image" or "video"
    var caption: String?
    var eventId: UUID?
    var visibility: String // "public", "followers", "close_friends", "private"
    var viewCount: Int
    let expiresAt: Date
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case mediaUrl = "media_url"
        case mediaType = "media_type"
        case caption
        case eventId = "event_id"
        case visibility
        case viewCount = "view_count"
        case expiresAt = "expires_at"
        case createdAt = "created_at"
    }
}

// MARK: - DM Conversation
struct DMConversation: Codable, Identifiable {
    let id: UUID
    let participant1: UUID
    let participant2: UUID
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case participant1 = "participant_1"
        case participant2 = "participant_2"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Direct Message (E2E Encrypted)
struct DirectMessage: Codable, Identifiable {
    let id: UUID
    let conversationId: UUID
    let senderId: UUID
    var encryptedContentSender: String
    var encryptedContentRecipient: String
    var nonceSender: String
    var nonceRecipient: String
    var messageType: String // "text", "image", "file"
    var fileUrl: String?
    var fileName: String?
    var fileSize: Int?
    var fileMimeType: String?
    var readAt: Date?
    var editedAt: Date?
    var isDeleted: Bool
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case conversationId = "conversation_id"
        case senderId = "sender_id"
        case encryptedContentSender = "encrypted_content_sender"
        case encryptedContentRecipient = "encrypted_content_recipient"
        case nonceSender = "nonce_sender"
        case nonceRecipient = "nonce_recipient"
        case messageType = "message_type"
        case fileUrl = "file_url"
        case fileName = "file_name"
        case fileSize = "file_size"
        case fileMimeType = "file_mime_type"
        case readAt = "read_at"
        case editedAt = "edited_at"
        case isDeleted = "is_deleted"
        case createdAt = "created_at"
    }
}

// MARK: - User Connection (Follow)
struct UserConnection: Codable, Identifiable {
    let id: UUID
    let followerId: UUID
    let followingId: UUID
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case followerId = "follower_id"
        case followingId = "following_id"
        case createdAt = "created_at"
    }
}

// MARK: - Push Token
struct PushToken: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var token: String
    var platform: String // "ios", "android", "web"
    var isActive: Bool
    var deviceInfo: String?
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case token
        case platform
        case isActive = "is_active"
        case deviceInfo = "device_info"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

---

## 3. Services Architecture

### AuthService (Sign in with Apple + Face ID)

```swift
import AuthenticationServices
import LocalAuthentication
import Supabase
import Security

@MainActor
class AuthService: NSObject, ObservableObject {
    @Published var user: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    
    private let supabase: SupabaseClient
    private let keychain = KeychainService()
    
    init() {
        self.supabase = SupabaseClient(
            supabaseURL: SupabaseConfig.url,
            supabaseKey: SupabaseConfig.anonKey
        )
        
        Task {
            await checkExistingSession()
        }
    }
    
    // MARK: - Sign in with Apple
    func signInWithApple() async throws {
        let rawNonce = UUID().uuidString
        let hashedNonce = sha256(rawNonce)
        
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.email, .fullName]
        request.nonce = hashedNonce
        
        let result = try await performAppleSignIn(request: request)
        
        guard let credential = result.credential as? ASAuthorizationAppleIDCredential,
              let identityToken = credential.identityToken,
              let tokenString = String(data: identityToken, encoding: .utf8) else {
            throw AuthError.invalidCredentials
        }
        
        // Sign in with Supabase using the Apple token
        // CRITICAL: Use RAW nonce for Supabase, HASHED nonce for Apple
        try await supabase.auth.signInWithIdToken(
            credentials: .init(
                provider: .apple,
                idToken: tokenString,
                nonce: rawNonce // RAW nonce here!
            )
        )
        
        self.user = supabase.auth.currentUser
        self.isAuthenticated = true
        
        // Save credentials for biometric login
        if let email = credential.email {
            try? await keychain.save(email: email, token: tokenString)
        }
    }
    
    // MARK: - Biometric Login (Face ID / Touch ID)
    func authenticateWithBiometrics() async throws -> Bool {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw AuthError.biometricsNotAvailable
        }
        
        let reason = "Sign in to Laten"
        let success = try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason
        )
        
        if success {
            // Retrieve stored session from Keychain
            if let storedToken = try? keychain.getStoredToken() {
                try await supabase.auth.setSession(accessToken: storedToken)
                self.user = supabase.auth.currentUser
                self.isAuthenticated = true
                return true
            }
        }
        
        return false
    }
    
    var biometricType: LABiometryType {
        let context = LAContext()
        _ = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        return context.biometryType
    }
    
    // MARK: - Email Sign In (Fallback)
    func signIn(email: String, password: String) async throws {
        try await supabase.auth.signIn(email: email, password: password)
        self.user = supabase.auth.currentUser
        self.isAuthenticated = true
    }
    
    func signUp(email: String, password: String, displayName: String) async throws {
        try await supabase.auth.signUp(
            email: email,
            password: password,
            data: ["display_name": .string(displayName)]
        )
    }
    
    func signOut() async throws {
        try await supabase.auth.signOut()
        try? keychain.clearCredentials()
        self.user = nil
        self.isAuthenticated = false
    }
    
    private func checkExistingSession() async {
        do {
            self.user = try await supabase.auth.session.user
            self.isAuthenticated = self.user != nil
        } catch {
            self.isAuthenticated = false
        }
    }
    
    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
        }
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}

enum AuthError: LocalizedError {
    case invalidCredentials
    case biometricsNotAvailable
    case sessionExpired
    
    var errorDescription: String? {
        switch self {
        case .invalidCredentials: return "Invalid credentials"
        case .biometricsNotAvailable: return "Biometrics not available on this device"
        case .sessionExpired: return "Session expired, please sign in again"
        }
    }
}
```

### EventService

```swift
import Supabase

@MainActor
class EventService: ObservableObject {
    @Published var events: [Event] = []
    @Published var featuredEvents: [Event] = []
    @Published var isLoading = false
    
    private let supabase: SupabaseClient
    
    init(supabase: SupabaseClient) {
        self.supabase = supabase
    }
    
    // Fetch events for a city
    func fetchEvents(city: String, limit: Int = 50) async throws {
        isLoading = true
        defer { isLoading = false }
        
        let response: [Event] = try await supabase
            .from("events")
            .select()
            .eq("city", value: city)
            .eq("is_active", value: true)
            .gte("start_time", value: ISO8601DateFormatter().string(from: Date()))
            .order("start_time", ascending: true)
            .limit(limit)
            .execute()
            .value
        
        self.events = response
        self.featuredEvents = response.filter { $0.isFeatured }
    }
    
    // RSVP to event
    func rsvp(eventId: UUID, userId: UUID) async throws {
        try await supabase
            .from("event_rsvps")
            .insert(["event_id": eventId.uuidString, "user_id": userId.uuidString])
            .execute()
        
        // Trigger updates the actual_rsvp count automatically
    }
    
    // Cancel RSVP
    func cancelRsvp(eventId: UUID, userId: UUID) async throws {
        try await supabase
            .from("event_rsvps")
            .delete()
            .eq("event_id", value: eventId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
    }
    
    // Save event
    func saveEvent(eventId: UUID, userId: UUID) async throws {
        try await supabase
            .from("saved_events")
            .insert(["event_id": eventId.uuidString, "user_id": userId.uuidString])
            .execute()
    }
    
    // Unsave event
    func unsaveEvent(eventId: UUID, userId: UUID) async throws {
        try await supabase
            .from("saved_events")
            .delete()
            .eq("event_id", value: eventId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
    }
    
    // Check if user has RSVP'd
    func hasRsvp(eventId: UUID, userId: UUID) async throws -> Bool {
        let response: [EventRSVP] = try await supabase
            .from("event_rsvps")
            .select()
            .eq("event_id", value: eventId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        
        return !response.isEmpty
    }
    
    // Create event (for hosts)
    func createEvent(_ event: Event) async throws -> Event {
        let response: Event = try await supabase
            .from("events")
            .insert(event)
            .select()
            .single()
            .execute()
            .value
        
        return response
    }
}
```

### PushNotificationService

```swift
import UserNotifications
import UIKit

class PushNotificationService: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    @Published var deviceToken: String?
    
    private let supabase: SupabaseClient
    
    override init() {
        self.supabase = SupabaseClient(
            supabaseURL: SupabaseConfig.url,
            supabaseKey: SupabaseConfig.anonKey
        )
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    func requestPermission() async throws -> Bool {
        let center = UNUserNotificationCenter.current()
        let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
        
        if granted {
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
        
        return granted
    }
    
    func registerToken(_ tokenData: Data, userId: UUID) async throws {
        let token = tokenData.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = token
        
        try await supabase
            .from("push_tokens")
            .upsert([
                "user_id": userId.uuidString,
                "token": token,
                "platform": "ios",
                "is_active": true,
                "device_info": UIDevice.current.model
            ], onConflict: "user_id,token")
            .execute()
    }
    
    func unregisterToken(userId: UUID) async throws {
        guard let token = deviceToken else { return }
        
        try await supabase
            .from("push_tokens")
            .update(["is_active": false])
            .eq("user_id", value: userId.uuidString)
            .eq("token", value: token)
            .execute()
    }
    
    // UNUserNotificationCenterDelegate
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        return [.banner, .badge, .sound]
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        
        if let eventId = userInfo["eventId"] as? String {
            // Navigate to event - post notification to app
            NotificationCenter.default.post(
                name: .navigateToEvent,
                object: nil,
                userInfo: ["eventId": eventId]
            )
        }
    }
}

extension Notification.Name {
    static let navigateToEvent = Notification.Name("navigateToEvent")
}
```

### AdManager (Google AdMob)

```swift
import GoogleMobileAds
import SwiftUI

class AdManager: NSObject, ObservableObject {
    static let shared = AdManager()
    
    @Published var interstitialAd: GADInterstitialAd?
    @Published var isAdReady = false
    
    // AdMob App ID: ca-app-pub-4192366585858201~8396389324
    private let interstitialAdUnitId = "ca-app-pub-4192366585858201/XXXXXXXXXX" // Replace with actual unit ID
    private let bannerAdUnitId = "ca-app-pub-4192366585858201/XXXXXXXXXX" // Replace with actual unit ID
    
    override init() {
        super.init()
        GADMobileAds.sharedInstance().start(completionHandler: nil)
        
        // Request non-personalized ads for privacy compliance
        GADMobileAds.sharedInstance().requestConfiguration.testDeviceIdentifiers = []
    }
    
    func loadInterstitialAd() {
        let request = GADRequest()
        
        GADInterstitialAd.load(
            withAdUnitID: interstitialAdUnitId,
            request: request
        ) { [weak self] ad, error in
            if let error = error {
                print("Failed to load interstitial: \(error.localizedDescription)")
                return
            }
            self?.interstitialAd = ad
            self?.isAdReady = true
        }
    }
    
    func showInterstitialAd(from viewController: UIViewController) {
        guard let ad = interstitialAd else {
            print("Interstitial ad not ready")
            return
        }
        
        ad.present(fromRootViewController: viewController)
        isAdReady = false
        loadInterstitialAd() // Preload next ad
    }
}

// SwiftUI Banner Ad View
struct BannerAdView: UIViewRepresentable {
    let adUnitID: String
    
    func makeUIView(context: Context) -> GADBannerView {
        let bannerView = GADBannerView(adSize: GADAdSizeBanner)
        bannerView.adUnitID = adUnitID
        bannerView.rootViewController = UIApplication.shared.windows.first?.rootViewController
        bannerView.load(GADRequest())
        return bannerView
    }
    
    func updateUIView(_ uiView: GADBannerView, context: Context) {}
}
```

---

## 4. Edge Function API Reference

### `/functions/v1/verify-ios-receipt`
Verify iOS In-App Purchase receipts and activate subscriptions.

**Method:** POST  
**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "receipt": "base64_encoded_receipt_data",
  "productId": "com.laten.party.boost",
  "transactionId": "transaction_id_from_storekit",
  "profileId": "uuid_of_host_or_professional_profile"
}
```

**Product IDs:**
- `com.laten.bartender.sub` - Bartender subscription
- `com.laten.dj.sub` - DJ subscription  
- `com.laten.party.boost` - Host Party Boost
- `com.laten.pro.sub` - Professional subscription

**Response:**
```json
{
  "success": true,
  "subscriptionType": "party_boost",
  "expiresAt": "2025-03-05T12:00:00.000Z"
}
```

---

### `/functions/v1/send-notification`
Send push notifications to users (admin only).

**Method:** POST  
**Auth:** Required (Admin role)

**Request Body:**
```json
{
  "type": "event_reminder",
  "userIds": ["uuid1", "uuid2"],
  "eventId": "event_uuid",
  "title": "Event Starting Soon!",
  "body": "Your event starts in 1 hour"
}
```

**Notification Types:** `event_reminder`, `rsvp_update`, `new_event`

---

### `/functions/v1/algolia-search`
Search events and clubs via Algolia.

**Method:** POST  
**Auth:** Optional

**Request Body:**
```json
{
  "query": "techno party",
  "city": "Budapest",
  "type": "events",
  "filters": {
    "eventType": "club",
    "priceMax": 5000
  }
}
```

---

### `/functions/v1/tonights-picks`
Get AI-curated tonight's event picks.

**Method:** GET  
**Auth:** Optional  
**Query Params:** `city=Budapest`

---

### `/functions/v1/didit-session`
Create ID verification session.

**Method:** POST  
**Auth:** Required

---

## 5. Realtime Subscriptions

```swift
// Subscribe to event messages (chat)
func subscribeToEventMessages(eventId: UUID) -> RealtimeChannel {
    return supabase.channel("event_messages:\(eventId)")
        .on("postgres_changes", filter: .eq("event_id", value: eventId.uuidString)) { payload in
            // Handle new message
        }
        .subscribe()
}

// Subscribe to DM conversations
func subscribeToDMs(conversationId: UUID) -> RealtimeChannel {
    return supabase.channel("dm:\(conversationId)")
        .on("postgres_changes", table: "direct_messages", filter: .eq("conversation_id", value: conversationId.uuidString)) { payload in
            // Handle new DM
        }
        .subscribe()
}

// Subscribe to typing indicators
func subscribeToTyping(conversationId: UUID) -> RealtimeChannel {
    return supabase.channel("typing:\(conversationId)")
        .on("postgres_changes", table: "dm_typing_indicators", filter: .eq("conversation_id", value: conversationId.uuidString)) { payload in
            // Handle typing state
        }
        .subscribe()
}
```

---

## 6. Storage Buckets

| Bucket | Public | Use Case |
|--------|--------|----------|
| `avatars` | ✅ | User profile photos |
| `photos` | ✅ | Event cover images |
| `stories` | ✅ | Story media |
| `professional-photos` | ✅ | DJ/Bartender portfolio |
| `documents` | ❌ | Private documents |

**Upload Example:**
```swift
func uploadAvatar(userId: UUID, imageData: Data) async throws -> String {
    let path = "\(userId.uuidString)/avatar.jpg"
    
    try await supabase.storage
        .from("avatars")
        .upload(path: path, file: imageData, options: FileOptions(contentType: "image/jpeg"))
    
    return supabase.storage.from("avatars").getPublicURL(path: path).absoluteString
}
```

---

## 7. Mapbox Configuration

```swift
import MapboxMaps

struct MapboxConfig {
    static let accessToken = "pk.eyJ1IjoiYXJvc3NzIiwiYSI6ImNtaW5heTd0dDE1amgzZXIxZnVnczBmZHgifQ._8a-aON5RVdACW4_jsla7A"
    static let styleURI = StyleURI.dark
}

// In AppDelegate or App init
MapboxOptions.accessToken = MapboxConfig.accessToken
```

---

## 8. App Architecture (MVVM)

```
Laten/
├── App/
│   ├── LatenApp.swift
│   └── AppDelegate.swift
├── Models/
│   ├── Event.swift
│   ├── Profile.swift
│   ├── Host.swift
│   └── ...
├── Services/
│   ├── AuthService.swift
│   ├── EventService.swift
│   ├── PushNotificationService.swift
│   ├── AdManager.swift
│   └── KeychainService.swift
├── ViewModels/
│   ├── HomeViewModel.swift
│   ├── MapViewModel.swift
│   ├── ProfileViewModel.swift
│   └── ...
├── Views/
│   ├── Auth/
│   │   └── AuthView.swift
│   ├── Home/
│   │   ├── HomeView.swift
│   │   └── EventCardView.swift
│   ├── Map/
│   │   └── MapView.swift
│   ├── Event/
│   │   ├── EventDetailView.swift
│   │   └── CreateEventView.swift
│   ├── Messages/
│   │   └── MessagesView.swift
│   ├── Profile/
│   │   └── ProfileView.swift
│   └── Components/
│       ├── AsyncImageView.swift
│       ├── LoadingView.swift
│       └── ...
├── Config/
│   └── SupabaseConfig.swift
└── Utilities/
    ├── Extensions/
    └── Helpers/
```

---

## 9. Design System Colors (HSL)

```swift
extension Color {
    // Primary - Electric Purple
    static let primary = Color(hue: 262/360, saturation: 0.83, lightness: 0.58)
    static let primaryForeground = Color.white
    
    // Secondary - Neon Pink  
    static let secondary = Color(hue: 330/360, saturation: 0.81, lightness: 0.60)
    
    // Background
    static let background = Color(hue: 240/360, saturation: 0.20, lightness: 0.04)
    static let card = Color(hue: 240/360, saturation: 0.14, lightness: 0.08)
    
    // Text
    static let foreground = Color(hue: 0, saturation: 0, lightness: 0.98)
    static let mutedForeground = Color(hue: 240/360, saturation: 0.05, lightness: 0.65)
    
    // Accent
    static let accent = Color(hue: 262/360, saturation: 0.83, lightness: 0.58)
    
    // Borders
    static let border = Color(hue: 240/360, saturation: 0.06, lightness: 0.15)
}
```

---

## 10. Cities Supported

```swift
let supportedCities = [
    "Budapest",
    "Vienna", 
    "Prague",
    "Berlin",
    "Munich",
    "Zurich"
]
```

---

This documentation provides everything needed to build the native iOS app. The backend (Supabase + Edge Functions) remains unchanged - your native app will consume the same APIs.
