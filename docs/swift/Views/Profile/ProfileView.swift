// ProfileView.swift
// Laten — Profile Tab (XP, Reputation, Settings)

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @State private var xp: UserXP?
    @State private var reputation: UserReputation?
    @State private var streak: UserStreak?
    @State private var showSettings = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // MARK: - Profile Header
                VStack(spacing: 12) {
                    // Avatar
                    Circle()
                        .fill(Color.latenSurface)
                        .frame(width: 80, height: 80)
                        .overlay(
                            Group {
                                if let url = authService.currentUser?.avatarUrl,
                                   let imageUrl = URL(string: url) {
                                    AsyncImage(url: imageUrl) { img in
                                        img.resizable().aspectRatio(contentMode: .fill)
                                    } placeholder: {
                                        Image(systemName: "person.fill")
                                            .font(.system(size: 32))
                                            .foregroundColor(.latenTextMuted)
                                    }
                                } else {
                                    Image(systemName: "person.fill")
                                        .font(.system(size: 32))
                                        .foregroundColor(.latenTextMuted)
                                }
                            }
                            .clipShape(Circle())
                        )
                        .overlay(
                            Circle()
                                .stroke(LinearGradient.latenGlow, lineWidth: 2)
                        )
                    
                    Text(authService.currentUser?.displayName ?? "User")
                        .font(.latenTitle())
                        .foregroundColor(.latenTextPrimary)
                    
                    if let city = authService.currentUser?.city {
                        Label(city, systemImage: "mappin")
                            .font(.latenCaption())
                            .foregroundColor(.latenTextSecondary)
                    }
                    
                    // Rep badge
                    if let rep = reputation {
                        Text(rep.reputationLevel.capitalized)
                            .font(.system(size: 12, weight: .bold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(repColor(rep.reputationLevel).opacity(0.2))
                            .foregroundColor(repColor(rep.reputationLevel))
                            .cornerRadius(12)
                    }
                }
                .padding(.top, 8)
                
                // MARK: - Stats Row
                HStack(spacing: 0) {
                    statItem(
                        value: "\(xp?.currentLevel ?? 1)",
                        label: "Level",
                        icon: "star.fill",
                        color: .latenPurple
                    )
                    Divider().frame(height: 40)
                    statItem(
                        value: "\(reputation?.totalRep ?? 0)",
                        label: "Rep",
                        icon: "flame.fill",
                        color: .latenPink
                    )
                    Divider().frame(height: 40)
                    statItem(
                        value: "\(streak?.currentStreak ?? 0)",
                        label: "Streak",
                        icon: "bolt.fill",
                        color: .latenAmber
                    )
                    Divider().frame(height: 40)
                    statItem(
                        value: "\(reputation?.eventsAttended ?? 0)",
                        label: "Events",
                        icon: "party.popper",
                        color: .latenCyan
                    )
                }
                .padding(.vertical, 12)
                .cardStyle()
                
                // MARK: - XP Progress
                if let xp = xp {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Level \(xp.currentLevel)")
                                .font(.latenHeadline())
                                .foregroundColor(.latenTextPrimary)
                            Spacer()
                            Text("\(xp.totalXp) XP")
                                .font(.latenCaption())
                                .foregroundColor(.latenPurple)
                        }
                        
                        let nextLevelXp = (xp.currentLevel + 1) * (xp.currentLevel + 1) * 50
                        let progress = Double(xp.totalXp) / Double(nextLevelXp)
                        
                        ProgressView(value: min(progress, 1.0))
                            .tint(.latenPurple)
                        
                        Text("\(nextLevelXp - xp.totalXp) XP to Level \(xp.currentLevel + 1)")
                            .font(.latenSmall())
                            .foregroundColor(.latenTextMuted)
                    }
                    .padding(16)
                    .cardStyle()
                }
                
                // MARK: - Quick Actions
                VStack(spacing: 0) {
                    menuRow(icon: "calendar.badge.plus", title: "Host Dashboard", color: .latenPurple) {
                        // Navigate to host dashboard
                    }
                    Divider().padding(.leading, 50)
                    menuRow(icon: "bookmark.fill", title: "Saved Events", color: .latenAmber) {
                        // Navigate to saved events
                    }
                    Divider().padding(.leading, 50)
                    menuRow(icon: "ticket.fill", title: "My Tickets", color: .latenCyan) {
                        // Navigate to tickets
                    }
                    Divider().padding(.leading, 50)
                    menuRow(icon: "gearshape.fill", title: "Settings", color: .latenTextSecondary) {
                        showSettings = true
                    }
                }
                .cardStyle()
                
                // MARK: - Sign Out
                Button {
                    Task { await authService.signOut() }
                } label: {
                    Text("Sign Out")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.latenDanger)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(Color.latenDanger.opacity(0.1))
                        .cornerRadius(12)
                }
                .padding(.top, 8)
            }
            .padding(16)
        }
        .background(Color.latenBackground)
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
        .task {
            await fetchStats()
        }
    }
    
    // MARK: - Helpers
    private func statItem(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(color)
            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.latenTextPrimary)
            Text(label)
                .font(.latenSmall())
                .foregroundColor(.latenTextMuted)
        }
        .frame(maxWidth: .infinity)
    }
    
    private func menuRow(icon: String, title: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(color)
                    .frame(width: 28)
                Text(title)
                    .font(.latenBody())
                    .foregroundColor(.latenTextPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(.latenTextMuted)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }
    
    private func repColor(_ level: String) -> Color {
        switch level {
        case "legend": return .latenAmber
        case "elite": return .latenPurple
        case "trusted": return .latenCyan
        case "regular": return .latenSuccess
        default: return .latenTextSecondary
        }
    }
    
    private func fetchStats() async {
        guard let userId = authService.currentUser?.id else { return }
        
        do {
            xp = try? await supabase.from("user_xp").select().eq("user_id", value: userId.uuidString).single().execute().value
            reputation = try? await supabase.from("user_reputation").select().eq("user_id", value: userId.uuidString).single().execute().value
            streak = try? await supabase.from("user_streaks").select().eq("user_id", value: userId.uuidString).single().execute().value
        }
    }
}

// MARK: - Settings View (Placeholder)
struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List {
                Section("Account") {
                    Label("Edit Profile", systemImage: "person.crop.circle")
                    Label("Notifications", systemImage: "bell")
                    Label("Privacy", systemImage: "lock.shield")
                }
                
                Section("App") {
                    Label("Language", systemImage: "globe")
                    Label("Appearance", systemImage: "moon.fill")
                }
                
                Section("Support") {
                    Label("Help & FAQ", systemImage: "questionmark.circle")
                    Label("Terms of Service", systemImage: "doc.text")
                    Label("Privacy Policy", systemImage: "hand.raised")
                }
                
                Section {
                    Button(role: .destructive) {
                        // Delete account
                    } label: {
                        Label("Delete Account", systemImage: "trash")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.latenPurple)
                }
            }
        }
    }
}
