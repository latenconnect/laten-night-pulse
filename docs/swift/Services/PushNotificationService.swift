// PushNotificationService.swift
// Laten — APNs Push Notifications

import Foundation
import UserNotifications
import UIKit

@MainActor
class PushNotificationService: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    static let shared = PushNotificationService()
    
    @Published var isRegistered = false
    @Published var deviceToken: String?
    
    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    // MARK: - Request Permission
    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            return granted
        } catch {
            print("Push permission error: \(error)")
            return false
        }
    }
    
    // MARK: - Register Token with Supabase
    func registerToken(_ tokenData: Data) async {
        let token = tokenData.map { String(format: "%02.2hhx", $0) }.joined()
        deviceToken = token
        
        do {
            let session = try await supabase.auth.session
            
            // Upsert push token
            try await supabase
                .from("push_tokens")
                .upsert([
                    "user_id": session.user.id.uuidString,
                    "token": token,
                    "platform": "ios"
                ])
                .execute()
            
            isRegistered = true
            print("Push token registered: \(token.prefix(20))...")
        } catch {
            print("Failed to register push token: \(error)")
        }
    }
    
    // MARK: - Handle Incoming Notification
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle emergency alert tap
        if let type = userInfo["type"] as? String, type == "emergency",
           let alertId = userInfo["alert_id"] as? String {
            Task { @MainActor in
                // Navigate to emergency map view
                NotificationCenter.default.post(
                    name: .openEmergencyAlert,
                    object: nil,
                    userInfo: ["alert_id": alertId]
                )
            }
        }
        
        completionHandler()
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let openEmergencyAlert = Notification.Name("openEmergencyAlert")
}
