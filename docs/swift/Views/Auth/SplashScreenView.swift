// SplashScreenView.swift
// Laten

import SwiftUI

struct SplashScreenView: View {
    @State private var scale: CGFloat = 0.8
    @State private var opacity: Double = 0
    
    var body: some View {
        ZStack {
            Color.latenBackground.ignoresSafeArea()
            
            VStack(spacing: 16) {
                Text("LATEN")
                    .font(.system(size: 52, weight: .black, design: .rounded))
                    .foregroundStyle(LinearGradient.latenGlow)
                    .scaleEffect(scale)
                    .opacity(opacity)
                
                ProgressView()
                    .tint(.latenPurple)
                    .opacity(opacity)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) {
                scale = 1.0
                opacity = 1.0
            }
        }
    }
}
