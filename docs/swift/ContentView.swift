// ContentView.swift
// Laten — Main Tab Navigation

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthService
    @State private var selectedTab = 0
    @State private var showEmergencyConfirmation = false
    
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            TabView(selection: $selectedTab) {
                
                // Tab 1: Discover
                NavigationView {
                    DiscoverView()
                }
                .tabItem {
                    Image(systemName: "sparkles")
                    Text("Discover")
                }
                .tag(0)
                
                // Tab 2: Social
                NavigationView {
                    SocialView()
                }
                .tabItem {
                    Image(systemName: "person.2.fill")
                    Text("Social")
                }
                .tag(1)
                
                // Tab 3: Safety
                NavigationView {
                    SafetyView()
                }
                .tabItem {
                    Image(systemName: "shield.fill")
                    Text("Safety")
                }
                .tag(2)
                
                // Tab 4: Profile
                NavigationView {
                    ProfileView()
                }
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profile")
                }
                .tag(3)
            }
            .accentColor(.latenPurple)
            
            // Floating Emergency Button (FAB) — visible on all tabs except Safety
            if selectedTab != 2 {
                EmergencyFAB(showConfirmation: $showEmergencyConfirmation)
                    .padding(.trailing, 16)
                    .padding(.bottom, 90) // Above tab bar
            }
        }
        .alert("Emergency Alert", isPresented: $showEmergencyConfirmation) {
            Button("Send Alert", role: .destructive) {
                Task {
                    await EmergencyService.shared.triggerEmergency()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will send your current location to all trusted friends immediately.")
        }
    }
}

// MARK: - Floating Emergency Button
struct EmergencyFAB: View {
    @Binding var showConfirmation: Bool
    @State private var isPulsing = false
    
    var body: some View {
        Button {
            let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
            impactFeedback.impactOccurred()
            showConfirmation = true
        } label: {
            ZStack {
                // Pulse ring
                Circle()
                    .fill(Color.latenDanger.opacity(0.3))
                    .frame(width: 60, height: 60)
                    .scaleEffect(isPulsing ? 1.3 : 1.0)
                    .opacity(isPulsing ? 0 : 0.5)
                
                // Main button
                Circle()
                    .fill(Color.latenDanger)
                    .frame(width: 52, height: 52)
                    .glowingShadow(color: .latenDanger, radius: 10)
                    .overlay(
                        Image(systemName: "sos")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                    )
            }
        }
        .accessibilityLabel("Emergency Alert")
        .accessibilityHint("Double-tap to send your location to trusted friends")
        .onAppear {
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: false)) {
                isPulsing = true
            }
        }
    }
}
