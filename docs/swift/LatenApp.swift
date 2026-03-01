// LatenApp.swift
// Laten
// Bundle ID: com.laten.app

import SwiftUI
import Supabase

@main
struct LatenApp: App {
    @StateObject private var authService = AuthService.shared
    @StateObject private var locationService = LocationService.shared
    
    init() {
        // Configure appearance
        configureAppearance()
    }
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authService.isLoading {
                    SplashScreenView()
                } else if authService.isAuthenticated {
                    ContentView()
                        .environmentObject(authService)
                        .environmentObject(locationService)
                } else {
                    LoginView()
                        .environmentObject(authService)
                }
            }
            .preferredColorScheme(.dark)
            .onAppear {
                Task {
                    await authService.checkSession()
                }
            }
        }
    }
    
    private func configureAppearance() {
        // Tab bar
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor(Color.latenBackground)
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
        
        // Navigation bar
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(Color.latenBackground)
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
    }
}
