// EmergencyService.swift
// Laten — Emergency Alert System (v1)

import Foundation
import CoreLocation

@MainActor
class EmergencyService: ObservableObject {
    static let shared = EmergencyService()
    
    @Published var activeAlert: EmergencyAlert?
    @Published var isTriggering = false
    @Published var error: String?
    
    // MARK: - Trigger Emergency (v1: single GPS ping)
    func triggerEmergency(message: String? = nil) async {
        isTriggering = true
        error = nil
        
        do {
            // 1. Get current GPS coordinates
            let location = try await LocationService.shared.getCurrentLocation()
            
            // 2. Get current user
            let session = try await supabase.auth.session
            let userId = session.user.id
            
            // 3. Get trusted friend IDs from close_friends table
            let closeFriends: [CloseFriend] = try await supabase
                .from("close_friends")
                .select()
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            
            let friendIds = closeFriends.map { $0.friendId }
            
            // 4. Insert emergency alert into database
            let alert = EmergencyAlertInsert(
                userId: userId,
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                status: "active",
                message: message,
                notifiedFriendIds: friendIds
            )
            
            let inserted: EmergencyAlert = try await supabase
                .from("emergency_alerts")
                .insert(alert)
                .select()
                .single()
                .execute()
                .value
            
            activeAlert = inserted
            
            // 5. Send push notifications to trusted friends
            await sendEmergencyNotifications(
                friendIds: friendIds,
                alertId: inserted.id,
                userName: AuthService.shared.currentUser?.displayName ?? "A friend"
            )
            
            isTriggering = false
            
        } catch {
            self.error = "Failed to send alert: \(error.localizedDescription)"
            isTriggering = false
        }
    }
    
    // MARK: - Cancel / Resolve Alert
    func resolveAlert() async {
        guard let alert = activeAlert else { return }
        
        do {
            try await supabase
                .from("emergency_alerts")
                .update(["status": "resolved", "resolved_at": ISO8601DateFormatter().string(from: Date())])
                .eq("id", value: alert.id.uuidString)
                .execute()
            
            activeAlert = nil
        } catch {
            self.error = "Failed to resolve alert: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Fetch Active Alerts for Me (as a trusted friend)
    func fetchAlertsForMe() async -> [EmergencyAlert] {
        do {
            let alerts: [EmergencyAlert] = try await supabase
                .from("emergency_alerts")
                .select()
                .eq("status", value: "active")
                .execute()
                .value
            return alerts
        } catch {
            return []
        }
    }
    
    // MARK: - Send Push Notifications via Edge Function
    private func sendEmergencyNotifications(friendIds: [UUID], alertId: UUID, userName: String) async {
        for friendId in friendIds {
            do {
                try await supabase.functions.invoke(
                    "send-notification",
                    options: .init(body: [
                        "user_id": friendId.uuidString,
                        "title": "🚨 Emergency Alert",
                        "body": "\(userName) triggered an emergency alert. Tap to view location.",
                        "data": [
                            "type": "emergency",
                            "alert_id": alertId.uuidString
                        ]
                    ] as [String: Any])
                )
            } catch {
                print("Failed to notify friend \(friendId): \(error)")
            }
        }
    }
}

// MARK: - Insert Model
private struct EmergencyAlertInsert: Encodable {
    let userId: UUID
    let latitude: Double
    let longitude: Double
    let status: String
    let message: String?
    let notifiedFriendIds: [UUID]
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case latitude, longitude, status, message
        case notifiedFriendIds = "notified_friend_ids"
    }
}
