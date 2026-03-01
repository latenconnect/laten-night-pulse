// LoginView.swift
// Laten — Authentication Screen

import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    
    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var isSignUp = false
    @State private var showEmailForm = false
    
    var body: some View {
        ZStack {
            // Background
            Color.latenBackground.ignoresSafeArea()
            
            VStack(spacing: 32) {
                Spacer()
                
                // Logo & Title
                VStack(spacing: 16) {
                    Text("LATEN")
                        .font(.system(size: 48, weight: .black, design: .rounded))
                        .foregroundStyle(LinearGradient.latenGlow)
                    
                    Text("Your nightlife. Your scene.")
                        .font(.latenBody())
                        .foregroundColor(.latenTextSecondary)
                }
                
                Spacer()
                
                // Auth Buttons
                VStack(spacing: 14) {
                    
                    // Sign in with Apple (primary)
                    SignInWithAppleButton(.signIn) { request in
                        let nonce = authService.generateNonce()
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = authService.sha256(nonce)
                    } onCompletion: { result in
                        Task {
                            await authService.handleAppleSignIn(result: result)
                        }
                    }
                    .signInWithAppleButtonStyle(.white)
                    .frame(height: 52)
                    .cornerRadius(12)
                    
                    // Email/Password
                    Button {
                        withAnimation(.latenSpring) {
                            showEmailForm.toggle()
                        }
                    } label: {
                        HStack {
                            Image(systemName: "envelope.fill")
                            Text("Continue with Email")
                        }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Color.latenSurface)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                    }
                    
                    // Biometric login (if credentials stored)
                    if authService.biometricsAvailable() {
                        Button {
                            Task {
                                await authService.biometricLogin()
                            }
                        } label: {
                            HStack {
                                Image(systemName: "faceid")
                                Text("Sign in with \(authService.biometricTypeLabel)")
                            }
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.latenPurple)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(Color.latenPurple.opacity(0.1))
                            .cornerRadius(12)
                        }
                    }
                }
                
                // Email Form (expandable)
                if showEmailForm {
                    emailFormSection
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                
                // Error
                if let error = authService.error {
                    Text(error)
                        .font(.latenCaption())
                        .foregroundColor(.latenDanger)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                // Footer
                VStack(spacing: 8) {
                    Text("By continuing, you agree to our")
                        .font(.latenSmall())
                        .foregroundColor(.latenTextMuted)
                    HStack(spacing: 4) {
                        Text("Terms of Service")
                            .underline()
                        Text("&")
                        Text("Privacy Policy")
                            .underline()
                    }
                    .font(.latenSmall())
                    .foregroundColor(.latenTextSecondary)
                }
                .padding(.bottom, 16)
            }
            .padding(.horizontal, 24)
        }
    }
    
    // MARK: - Email Form
    private var emailFormSection: some View {
        VStack(spacing: 12) {
            if isSignUp {
                TextField("Display Name", text: $displayName)
                    .textFieldStyle(LatenTextFieldStyle())
                    .textContentType(.name)
            }
            
            TextField("Email", text: $email)
                .textFieldStyle(LatenTextFieldStyle())
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
            
            SecureField("Password", text: $password)
                .textFieldStyle(LatenTextFieldStyle())
                .textContentType(isSignUp ? .newPassword : .password)
            
            Button {
                Task {
                    if isSignUp {
                        await authService.signUpWithEmail(
                            email: email,
                            password: password,
                            displayName: displayName
                        )
                    } else {
                        await authService.signInWithEmail(
                            email: email,
                            password: password
                        )
                    }
                }
            } label: {
                Text(isSignUp ? "Create Account" : "Sign In")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(LinearGradient.latenGlow)
                    .cornerRadius(12)
            }
            
            Button {
                withAnimation { isSignUp.toggle() }
            } label: {
                Text(isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                    .font(.latenCaption())
                    .foregroundColor(.latenPurple)
            }
        }
    }
}

// MARK: - Custom Text Field Style
struct LatenTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(14)
            .background(Color.latenSurface)
            .cornerRadius(12)
            .foregroundColor(.white)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
    }
}
