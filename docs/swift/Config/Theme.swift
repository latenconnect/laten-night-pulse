// Theme.swift
// Laten — Design System

import SwiftUI

// MARK: - Colors
extension Color {
    // Core palette
    static let latenBackground = Color(hex: "0A0A0F")
    static let latenSurface = Color(hex: "1A1A2E")
    static let latenSurfaceLight = Color(hex: "2A2A3E")
    
    // Brand
    static let latenPurple = Color(hex: "8B5CF6")
    static let latenPink = Color(hex: "EC4899")
    static let latenCyan = Color(hex: "06B6D4")
    static let latenAmber = Color(hex: "F59E0B")
    
    // Semantic
    static let latenDanger = Color(hex: "EF4444")
    static let latenSuccess = Color(hex: "22C55E")
    
    // Text
    static let latenTextPrimary = Color.white
    static let latenTextSecondary = Color.white.opacity(0.6)
    static let latenTextMuted = Color.white.opacity(0.4)
    
    // Hex initializer
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Gradients
extension LinearGradient {
    static let latenGlow = LinearGradient(
        colors: [.latenPurple, .latenPink],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let latenCyanGlow = LinearGradient(
        colors: [.latenCyan, .latenPurple],
        startPoint: .leading,
        endPoint: .trailing
    )
}

// MARK: - Shadows
extension View {
    func glowingShadow(color: Color = .latenPurple, radius: CGFloat = 15) -> some View {
        self.shadow(color: color.opacity(0.6), radius: radius, x: 0, y: 0)
    }
    
    func cardStyle() -> some View {
        self
            .background(Color.latenSurface)
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
    }
    
    func glassMorphism() -> some View {
        self
            .background(.ultraThinMaterial)
            .cornerRadius(16)
    }
}

// MARK: - Spring Animations
extension Animation {
    static let latenSpring = Animation.spring(response: 0.4, dampingFraction: 0.75, blendDuration: 0)
    static let latenBounce = Animation.spring(response: 0.35, dampingFraction: 0.6, blendDuration: 0)
}

// MARK: - Font System
extension Font {
    static func latenTitle() -> Font { .system(size: 28, weight: .bold, design: .rounded) }
    static func latenHeadline() -> Font { .system(size: 20, weight: .semibold) }
    static func latenBody() -> Font { .system(size: 16, weight: .regular) }
    static func latenCaption() -> Font { .system(size: 13, weight: .medium) }
    static func latenSmall() -> Font { .system(size: 11, weight: .regular) }
}
