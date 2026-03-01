// SocialView.swift
// Laten — Social Tab (Friends, DMs, Stories)

import SwiftUI

struct SocialView: View {
    @State private var selectedSegment = 0
    
    var body: some View {
        VStack(spacing: 0) {
            Picker("Section", selection: $selectedSegment) {
                Text("Friends").tag(0)
                Text("Messages").tag(1)
                Text("Groups").tag(2)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.top, 8)
            
            switch selectedSegment {
            case 0: FriendsListView()
            case 1: MessagesListView()
            case 2: PartyGroupsListView()
            default: EmptyView()
            }
        }
        .navigationTitle("Social")
        .navigationBarTitleDisplayMode(.large)
    }
}

// MARK: - Friends List
struct FriendsListView: View {
    @State private var friends: [Profile] = []
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                if friends.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "person.2.slash")
                            .font(.system(size: 40))
                            .foregroundColor(.latenTextMuted)
                        Text("No friends yet")
                            .font(.latenBody())
                            .foregroundColor(.latenTextSecondary)
                        Text("Find people at events and connect!")
                            .font(.latenCaption())
                            .foregroundColor(.latenTextMuted)
                    }
                    .padding(.top, 60)
                } else {
                    ForEach(friends) { friend in
                        FriendRow(profile: friend)
                    }
                }
            }
            .padding(16)
        }
        .task {
            await fetchFriends()
        }
    }
    
    private func fetchFriends() async {
        do {
            let session = try await supabase.auth.session
            let connections: [[String: String]] = try await supabase
                .from("user_connections")
                .select("following_id")
                .eq("follower_id", value: session.user.id.uuidString)
                .execute()
                .value
            
            let friendIds = connections.compactMap { $0["following_id"] }
            if !friendIds.isEmpty {
                friends = try await supabase
                    .from("profiles")
                    .select()
                    .in("id", values: friendIds)
                    .execute()
                    .value
            }
        } catch {
            print("Failed to fetch friends: \(error)")
        }
    }
}

// MARK: - Friend Row
struct FriendRow: View {
    let profile: Profile
    
    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            Circle()
                .fill(Color.latenSurface)
                .frame(width: 44, height: 44)
                .overlay(
                    Group {
                        if let avatarUrl = profile.avatarUrl, let url = URL(string: avatarUrl) {
                            AsyncImage(url: url) { img in
                                img.resizable().aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Image(systemName: "person.fill")
                                    .foregroundColor(.latenTextMuted)
                            }
                        } else {
                            Image(systemName: "person.fill")
                                .foregroundColor(.latenTextMuted)
                        }
                    }
                    .clipShape(Circle())
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(profile.displayName ?? "User")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.latenTextPrimary)
                if let city = profile.city {
                    Text(city)
                        .font(.latenSmall())
                        .foregroundColor(.latenTextMuted)
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.latenSmall())
                .foregroundColor(.latenTextMuted)
        }
        .padding(12)
        .cardStyle()
    }
}

// MARK: - Messages List (Placeholder)
struct MessagesListView: View {
    var body: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "bubble.left.and.bubble.right")
                .font(.system(size: 40))
                .foregroundColor(.latenTextMuted)
            Text("Encrypted Messages")
                .font(.latenHeadline())
                .foregroundColor(.latenTextPrimary)
            Text("E2E encrypted DMs coming soon")
                .font(.latenCaption())
                .foregroundColor(.latenTextMuted)
            Spacer()
        }
    }
}

// MARK: - Party Groups (Placeholder)
struct PartyGroupsListView: View {
    var body: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: "person.3.fill")
                .font(.system(size: 40))
                .foregroundColor(.latenTextMuted)
            Text("Party Groups")
                .font(.latenHeadline())
                .foregroundColor(.latenTextPrimary)
            Text("Create squads for events")
                .font(.latenCaption())
                .foregroundColor(.latenTextMuted)
            Spacer()
        }
    }
}
