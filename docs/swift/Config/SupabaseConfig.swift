// SupabaseConfig.swift
// Laten

import Foundation
import Supabase

enum SupabaseConfig {
    static let url = URL(string: "https://huigwbyctzjictnaycjj.supabase.co")!
    static let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aWd3YnljdHpqaWN0bmF5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjY0NjYsImV4cCI6MjA4MDQ0MjQ2Nn0.q9WSajU3VpAGr4N2woiKO9zHIc8koJyRjkGs8aSHhFg"
    
    // Apple Maps — no token needed (uses MapKit)
    // AdMob
    static let adMobAppID = "ca-app-pub-4192366585858201~8396389324"
    
    // Apple
    static let bundleID = "com.laten.app"
    static let teamID = "6BA8ZY4ZPX"
}

// MARK: - Shared Supabase Client
let supabase = SupabaseClient(
    supabaseURL: SupabaseConfig.url,
    supabaseKey: SupabaseConfig.anonKey
)
