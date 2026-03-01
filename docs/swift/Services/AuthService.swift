// AuthService.swift
// Laten — Authentication (Apple Sign-In + Biometrics)

import Foundation
import SwiftUI
import AuthenticationServices
import LocalAuthentication
import CryptoKit

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var currentUser: Profile?
    @Published var error: String?
    
    private var currentNonce: String?
    
    // MARK: - Session Check
    func checkSession() async {
        isLoading = true
        do {
            let session = try await supabase.auth.session
            isAuthenticated = true
            await fetchProfile(userId: session.user.id)
        } catch {
            isAuthenticated = false
        }
        isLoading = false
    }
    
    // MARK: - Apple Sign-In
    func handleAppleSignIn(result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityToken = credential.identityToken,
                  let tokenString = String(data: identityToken, encoding: .utf8) else {
                self.error = "Failed to get Apple credentials"
                return
            }
            
            do {
                guard let nonce = currentNonce else {
                    self.error = "Missing nonce"
                    return
                }
                
                let session = try await supabase.auth.signInWithIdToken(
                    credentials: .init(
                        provider: .apple,
                        idToken: tokenString,
                        nonce: nonce
                    )
                )
                
                isAuthenticated = true
                await fetchProfile(userId: session.user.id)
                
                // Store credentials for biometric login
                if let email = credential.email {
                    KeychainHelper.save(key: "laten_email", value: email)
                }
                
            } catch {
                self.error = "Sign in failed: \(error.localizedDescription)"
            }
            
        case .failure(let error):
            self.error = "Apple Sign In failed: \(error.localizedDescription)"
        }
    }
    
    /// Generate nonce for Apple Sign-In request
    func generateNonce() -> String {
        let nonce = UUID().uuidString
        currentNonce = nonce
        return nonce
    }
    
    /// SHA-256 hash for Apple authorization request
    func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hashed = SHA256.hash(data: data)
        return hashed.compactMap { String(format: "%02x", $0) }.joined()
    }
    
    // MARK: - Email/Password
    func signInWithEmail(email: String, password: String) async {
        do {
            let session = try await supabase.auth.signIn(
                email: email,
                password: password
            )
            isAuthenticated = true
            await fetchProfile(userId: session.user.id)
            
            // Store for biometric re-login
            KeychainHelper.save(key: "laten_email", value: email)
            KeychainHelper.save(key: "laten_password", value: password)
        } catch {
            self.error = "Login failed: \(error.localizedDescription)"
        }
    }
    
    func signUpWithEmail(email: String, password: String, displayName: String) async {
        do {
            let response = try await supabase.auth.signUp(
                email: email,
                password: password,
                data: ["display_name": .string(displayName)]
            )
            if response.session != nil {
                isAuthenticated = true
                await fetchProfile(userId: response.user.id)
            } else {
                self.error = "Check your email to confirm your account."
            }
        } catch {
            self.error = "Sign up failed: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Biometric Login
    func biometricLogin() async -> Bool {
        let context = LAContext()
        var authError: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &authError) else {
            return false
        }
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Sign in to Laten"
            )
            
            if success,
               let email = KeychainHelper.load(key: "laten_email"),
               let password = KeychainHelper.load(key: "laten_password") {
                await signInWithEmail(email: email, password: password)
                return true
            }
            return false
        } catch {
            return false
        }
    }
    
    func biometricsAvailable() -> Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }
    
    var biometricTypeLabel: String {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return "Biometrics"
        }
        switch context.biometryType {
        case .faceID: return "Face ID"
        case .touchID: return "Touch ID"
        default: return "Biometrics"
        }
    }
    
    // MARK: - Sign Out
    func signOut() async {
        do {
            try await supabase.auth.signOut()
            isAuthenticated = false
            currentUser = nil
        } catch {
            self.error = "Sign out failed: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Fetch Profile
    func fetchProfile(userId: UUID) async {
        do {
            let profile: Profile = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: userId.uuidString)
                .single()
                .execute()
                .value
            currentUser = profile
        } catch {
            print("Failed to fetch profile: \(error)")
        }
    }
}

// MARK: - Keychain Helper
enum KeychainHelper {
    static func save(key: String, value: String) {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.laten.app",
            kSecValueData as String: data
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    static func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.laten.app",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.laten.app"
        ]
        SecItemDelete(query as CFDictionary)
    }
}
