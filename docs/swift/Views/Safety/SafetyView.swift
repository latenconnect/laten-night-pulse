// SafetyView.swift
// Laten — Safety Tab (Emergency Button, Trusted Friends)

import SwiftUI
import MapKit

struct SafetyView: View {
    @StateObject private var emergencyService = EmergencyService.shared
    @State private var showEmergencyConfirmation = false
    @State private var trustedFriends: [Profile] = []
    @State private var incomingAlerts: [EmergencyAlert] = []
    @State private var showAlertMap = false
    @State private var selectedAlert: EmergencyAlert?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                
                // MARK: - Emergency Button (Primary)
                VStack(spacing: 16) {
                    Text("Emergency Alert")
                        .font(.latenHeadline())
                        .foregroundColor(.latenTextPrimary)
                    
                    Text("Sends your location to all trusted friends")
                        .font(.latenCaption())
                        .foregroundColor(.latenTextSecondary)
                    
                    // Big Emergency Button
                    Button {
                        let impact = UIImpactFeedbackGenerator(style: .heavy)
                        impact.impactOccurred()
                        showEmergencyConfirmation = true
                    } label: {
                        ZStack {
                            Circle()
                                .fill(Color.latenDanger.opacity(0.15))
                                .frame(width: 160, height: 160)
                            
                            Circle()
                                .fill(Color.latenDanger.opacity(0.3))
                                .frame(width: 130, height: 130)
                            
                            Circle()
                                .fill(Color.latenDanger)
                                .frame(width: 100, height: 100)
                                .glowingShadow(color: .latenDanger, radius: 20)
                                .overlay(
                                    VStack(spacing: 4) {
                                        Image(systemName: "sos")
                                            .font(.system(size: 28, weight: .bold))
                                        Text("SOS")
                                            .font(.system(size: 14, weight: .heavy))
                                    }
                                    .foregroundColor(.white)
                                )
                        }
                    }
                    .disabled(emergencyService.isTriggering)
                    
                    if emergencyService.isTriggering {
                        ProgressView("Sending alert...")
                            .tint(.latenDanger)
                    }
                    
                    // Active alert indicator
                    if let alert = emergencyService.activeAlert {
                        VStack(spacing: 8) {
                            HStack {
                                Circle().fill(Color.latenDanger).frame(width: 8, height: 8)
                                Text("Alert Active")
                                    .font(.latenCaption())
                                    .foregroundColor(.latenDanger)
                            }
                            
                            Button("Cancel Alert") {
                                Task { await emergencyService.resolveAlert() }
                            }
                            .font(.latenCaption())
                            .foregroundColor(.latenTextSecondary)
                        }
                    }
                }
                .padding(24)
                .cardStyle()
                
                // MARK: - Incoming Alerts
                if !incomingAlerts.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.latenDanger)
                            Text("Friend Alerts")
                                .font(.latenHeadline())
                                .foregroundColor(.latenTextPrimary)
                        }
                        
                        ForEach(incomingAlerts) { alert in
                            Button {
                                selectedAlert = alert
                                showAlertMap = true
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Emergency Alert")
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundColor(.latenDanger)
                                        Text("Tap to view location")
                                            .font(.latenSmall())
                                            .foregroundColor(.latenTextMuted)
                                    }
                                    Spacer()
                                    Image(systemName: "map.fill")
                                        .foregroundColor(.latenPurple)
                                }
                                .padding(12)
                                .background(Color.latenDanger.opacity(0.1))
                                .cornerRadius(12)
                            }
                        }
                    }
                    .padding(16)
                    .cardStyle()
                }
                
                // MARK: - Trusted Friends
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Trusted Friends")
                            .font(.latenHeadline())
                            .foregroundColor(.latenTextPrimary)
                        Spacer()
                        Button {
                            // Add trusted friend
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 22))
                                .foregroundColor(.latenPurple)
                        }
                    }
                    
                    Text("These friends will be notified in an emergency")
                        .font(.latenSmall())
                        .foregroundColor(.latenTextMuted)
                    
                    if trustedFriends.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "person.badge.shield.checkmark")
                                .font(.system(size: 28))
                                .foregroundColor(.latenTextMuted)
                            Text("No trusted friends yet")
                                .font(.latenCaption())
                                .foregroundColor(.latenTextSecondary)
                            Text("Add close friends to enable emergency alerts")
                                .font(.latenSmall())
                                .foregroundColor(.latenTextMuted)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 20)
                    } else {
                        ForEach(trustedFriends) { friend in
                            FriendRow(profile: friend)
                        }
                    }
                }
                .padding(16)
                .cardStyle()
                
                // MARK: - Safety Tips
                VStack(alignment: .leading, spacing: 8) {
                    Text("Safety Tips")
                        .font(.latenHeadline())
                        .foregroundColor(.latenTextPrimary)
                    
                    safetyTip(icon: "location.fill", text: "Share your location before going out")
                    safetyTip(icon: "person.2.fill", text: "Always go with trusted friends")
                    safetyTip(icon: "phone.fill", text: "Keep your phone charged")
                    safetyTip(icon: "drop.fill", text: "Stay hydrated and pace yourself")
                }
                .padding(16)
                .cardStyle()
            }
            .padding(16)
        }
        .background(Color.latenBackground)
        .navigationTitle("Safety")
        .navigationBarTitleDisplayMode(.large)
        .alert("Emergency Alert", isPresented: $showEmergencyConfirmation) {
            Button("Send Alert", role: .destructive) {
                Task { await emergencyService.triggerEmergency() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Your current location will be sent to \(trustedFriends.count) trusted friend(s). Are you sure?")
        }
        .sheet(isPresented: $showAlertMap) {
            if let alert = selectedAlert {
                EmergencyMapView(alert: alert)
            }
        }
        .task {
            await fetchTrustedFriends()
            incomingAlerts = await emergencyService.fetchAlertsForMe()
        }
    }
    
    private func safetyTip(icon: String, text: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(.latenPurple)
                .frame(width: 24)
            Text(text)
                .font(.latenCaption())
                .foregroundColor(.latenTextSecondary)
        }
    }
    
    private func fetchTrustedFriends() async {
        do {
            let session = try await supabase.auth.session
            let closeFriends: [CloseFriend] = try await supabase
                .from("close_friends")
                .select()
                .eq("user_id", value: session.user.id.uuidString)
                .execute()
                .value
            
            let ids = closeFriends.map { $0.friendId.uuidString }
            if !ids.isEmpty {
                trustedFriends = try await supabase
                    .from("profiles")
                    .select()
                    .in("id", values: ids)
                    .execute()
                    .value
            }
        } catch {
            print("Failed to fetch trusted friends: \(error)")
        }
    }
}

// MARK: - Emergency Map View (shows friend's location)
struct EmergencyMapView: View {
    let alert: EmergencyAlert
    @Environment(\.dismiss) private var dismiss
    
    @State private var region: MKCoordinateRegion
    
    init(alert: EmergencyAlert) {
        self.alert = alert
        _region = State(initialValue: MKCoordinateRegion(
            center: alert.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        ))
    }
    
    var body: some View {
        NavigationView {
            Map(coordinateRegion: $region, annotationItems: [alert]) { a in
                MapAnnotation(coordinate: a.coordinate) {
                    ZStack {
                        Circle()
                            .fill(Color.latenDanger.opacity(0.3))
                            .frame(width: 60, height: 60)
                        Circle()
                            .fill(Color.latenDanger)
                            .frame(width: 24, height: 24)
                            .overlay(
                                Image(systemName: "sos")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.white)
                            )
                    }
                }
            }
            .ignoresSafeArea(edges: .bottom)
            .navigationTitle("Emergency Location")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.latenPurple)
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        // Open in Apple Maps
                        let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: alert.coordinate))
                        mapItem.name = "Emergency Location"
                        mapItem.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeWalking])
                    } label: {
                        Label("Directions", systemImage: "arrow.triangle.turn.up.right.diamond")
                            .foregroundColor(.latenPurple)
                    }
                }
            }
        }
    }
}
