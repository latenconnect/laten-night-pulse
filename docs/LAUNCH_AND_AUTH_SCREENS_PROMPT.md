# Laten — Launch Screen & Authentication Screen (Native SwiftUI)

> **Purpose**: This document provides the complete specification for building the Launch Screen (Splash) and Authentication Screen natively in SwiftUI. It covers visual design, animations, authentication flows, validation rules, biometric integration, and Supabase backend connectivity.

---

## 1. LAUNCH SCREEN (Splash Screen)

### 1.1 Overview
A fullscreen branded splash screen shown on app launch while the auth session is being resolved. It displays the Laten logo with animated glow effects and a loading indicator. Minimum display time: **2 seconds**.

### 1.2 Visual Design

**Background:**
- Solid color: `#0A0A0F` (HSL 240 20% 4%) — the app's `--background` token
- Three layered radial glow effects (blurred circles) for ambient lighting:
  1. **Center glow**: 500×500pt, color `#8B5CF6` (electric purple) at 30% opacity, blur radius 120pt, centered on screen
  2. **Upper-left accent**: 256×256pt, color `#EC4899` (neon pink) at 20% opacity, blur radius 100pt, positioned at top-third / left-quarter
  3. **Lower-right accent**: 256×256pt, color `#00FFFF` (secondary cyan) at 20% opacity, blur radius 100pt, positioned at bottom-third / right-quarter

**Logo:**
- Use the Laten app icon (the same asset used for `laten-logo.png`)
- Size: 112×112pt (28×28 grid units)
- Centered horizontally and vertically
- Animated pulsing glow effect around the logo:
  - Drop shadow oscillates between:
    - `drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))` → `drop-shadow(0 0 40px rgba(139, 92, 246, 0.8))` → back
  - Duration: 1.5s per cycle, repeats infinitely, ease-in-out

**Loading Indicator:**
- Three small dots (8×8pt each) in a horizontal row, spaced 6pt apart
- Color: `#8B5CF6` (primary purple)
- Each dot animates scale (1.0 → 1.3 → 1.0) and opacity (0.4 → 1.0 → 0.4)
- Duration: 0.8s per cycle, infinite repeat
- Staggered delay: dot 0 = 0ms, dot 1 = 150ms, dot 2 = 300ms
- Positioned 40pt below the logo

### 1.3 Animations

**Entry animations (all use iOS spring: stiffness 380, damping 35):**
1. Background glows: Fade in from 0 opacity over 1.0s, center glow also scales from 0.8→1.0
2. Logo: Scale from 0.5→1.0 and opacity 0→1.0 over 0.6s with spring easing `[0.16, 1, 0.3, 1]`
3. Loading dots: Fade in from opacity 0 with 20pt upward slide, 0.4s delay, 0.4s duration

**Exit animation:**
- Entire screen fades out (opacity 1→0) over 0.4s with ease-out timing
- Triggered after minimum 2 seconds AND auth state is resolved

### 1.4 Behavior Logic

```
on appear:
  1. Start 2-second minimum timer
  2. Simultaneously check Supabase auth session: supabase.auth.getSession()
  3. When BOTH timer completes AND session check returns:
     - Trigger success haptic (UINotificationFeedbackGenerator.success)
     - Begin exit animation
     - Navigate based on result:
       a. Valid session exists → navigate to /explore (main tab view)
       b. No session, onboarding not completed → navigate to /onboarding
       c. No session, onboarding completed → navigate to Auth screen
```

### 1.5 Haptic Feedback
- On splash completion: `UINotificationFeedbackGenerator` with `.success` type

---

## 2. AUTHENTICATION SCREEN

### 2.1 Overview
A single screen that toggles between **Sign In** and **Sign Up** modes. Supports email/password authentication, social login (Apple, Google, Facebook), and biometric login (Face ID / Touch ID) for returning users on native iOS.

### 2.2 Visual Design

**Background:**
- Same base color as splash: `#0A0A0F`
- Two ambient glow layers:
  1. Center-top: 600×600pt, `#8B5CF6` at 15% opacity, blur 180pt, positioned at top-quarter center
  2. Bottom-left: 288×288pt, `#EC4899` at 10% opacity, blur 120pt, positioned at bottom-third left-quarter

**Layout (top to bottom, centered, max-width 360pt):**

1. **Logo** — 96×96pt, centered, with spring entry animation (scale 0.8→1.0, opacity 0→1, 0.5s)
2. **Title** — 30pt bold, tracking tight
   - Sign In mode: "Welcome back" (translation key: `home.greeting`)
   - Sign Up mode: "Welcome to Laten" (translation key: `onboarding.welcome`)
3. **Subtitle** — 15pt, muted foreground color (`#A3A3B3` approx HSL 240 5% 65%)
   - Sign In: "Sign in to your account" (key: `auth.signIn`)
   - Sign Up: "Create your account" (key: `auth.signUp`)
4. **Form Fields** (see §2.3)
5. **Submit Button** (see §2.4)
6. **Divider** — "OR CONTINUE WITH" text, 11pt uppercase, tracking wider, with horizontal lines on each side
7. **Biometric Button** — Only in Sign In mode, only if device has biometrics AND stored credentials exist (see §2.6)
8. **Social Login Buttons** (see §2.5)
9. **Toggle Link** — "Don't have an account? Sign Up" / "Already have an account? Sign In"

### 2.3 Form Fields

All input fields:
- Height: 52pt minimum
- Font size: 16pt minimum (CRITICAL: prevents iOS auto-zoom on focus)
- Background: `#14141F` (card color, HSL 240 15% 8%) at 80% opacity
- Border: 1pt, `#2A2A3D` (border color) at 50% opacity
- Corner radius: 12pt (xl)
- Focus state: border transitions to `#8B5CF6` at 60% opacity, adds 3pt ring at 15% opacity
- Left icon: 18×18pt, muted color, 16pt left padding
- Touch target: minimum 44pt

**Sign Up mode fields (in order):**

| Field | Icon | Placeholder | Validation |
|-------|------|-------------|------------|
| Display Name | `person.fill` (SF Symbol) | "Display name" | 2-50 chars, alphanumeric + spaces + `- _ .` only |
| Email | `envelope.fill` | "Email address" | Valid email, max 255 chars |
| Password | `lock.fill` | "Password" | Min 8 chars, must contain uppercase + lowercase + digit |

**Sign In mode fields:**

| Field | Icon | Placeholder | Validation |
|-------|------|-------------|------------|
| Email | `envelope.fill` | "Email address" | Valid email format |
| Password | `lock.fill` | "Password" | Non-empty |

**Password field extras:**
- Toggle visibility button on the right side (eye/eye-off icon, `eye.fill` / `eye.slash.fill`)
- In Sign Up mode only: password strength indicator below the field
  - 5 horizontal bars (1.5pt height, equal width, 6pt gap, rounded)
  - Strength levels based on criteria met:
    - ≥8 chars = +1
    - Has uppercase = +1
    - Has lowercase = +1
    - Has digit = +1
    - Has special char = +1
  - Colors: 1-2 bars = red (`#EF4444`), 3 bars = yellow (`#EAB308`), 4-5 bars = green (`#22C55E`)
  - Label below: "Weak" / "Medium" / "Strong" at 11pt

**Sign Up age confirmation:**
- Info box with primary/10 background, primary/20 border, 12pt corner radius
- Checkmark icon (primary color) + text: "You must be 18 or older to use Laten"
- 13pt text, muted foreground

**Inline validation errors:**
- Shown below each field when validation fails
- 13pt text, destructive red color
- Alert circle icon (3.5×3.5pt) + error message

### 2.4 Submit Button

- Full width, 56pt height
- 16pt font, semibold
- Primary background (`#8B5CF6`) with white text
- Label: "Sign In" / "Sign Up" with right arrow icon
- Loading state: spinning circular indicator (5×5pt, 2pt border, primary-foreground color, 1s rotation)
- Disabled while loading

### 2.5 Social Login Buttons

**Order matters — Apple MUST be first (App Store Guideline 4.8).**

All social buttons:
- Full width, outline variant (transparent background, 1pt border)
- 52pt height
- Icon (20×20pt) + label text

| Order | Provider | Label | Icon |
|-------|----------|-------|------|
| 1 | Apple | "Continue with Apple" | Apple logo (SF Symbol `apple.logo`) |
| 2 | Google | "Continue with Google" | Google "G" logo (4-color) |
| 3 | Facebook | "Continue with Facebook" | Facebook "f" logo (color: `#1877F2`) |

**Apple Sign-In (Native iOS — REQUIRED):**
```
Flow:
1. Generate cryptographic nonce: UUID string (rawNonce)
2. Hash nonce with SHA-256 → hashedNonce (hex string)
3. Call ASAuthorizationController with:
   - clientId: "com.laten.app"
   - scopes: [.email, .fullName]
   - nonce: hashedNonce (Apple gets the HASHED version)
4. On success, extract identityToken from credential
5. Call supabase.auth.signInWithIdToken:
   - provider: "apple"
   - token: identityToken (as string)
   - nonce: rawNonce (Supabase gets the RAW/unhashed version)
6. On success → navigate to /explore
7. Handle cancellation silently (ASAuthorizationError codes 1000, 1001)
8. Timeout: 60 seconds
```

**Google Sign-In:**
```
Flow:
1. Call supabase.auth.signInWithOAuth(provider: "google")
2. redirectTo: "laten://auth/callback" (native) or "https://latenapp.com/auth" (web)
3. Open returned URL in system browser (SFSafariViewController or ASWebAuthenticationSession)
4. Handle callback via Universal Links / custom URL scheme
```

**Facebook Sign-In:**
```
Flow:
1. Call supabase.auth.signInWithOAuth(provider: "facebook")
2. scopes: "email,public_profile"
3. redirectTo: same as Google
4. Handle callback same as Google
```

### 2.6 Biometric Authentication (Face ID / Touch ID)

**When to show the biometric button:**
- Device is native iOS (not web)
- Biometric hardware is available (LAContext.canEvaluatePolicy)
- User has previously stored credentials (check Keychain)
- User is in Sign In mode (not Sign Up)

**Button design:**
- Full width, outline variant
- 56pt height, 15pt font, medium weight
- Border: primary at 30% opacity
- Background: primary at 5% opacity
- Icon: Face ID icon (`faceid` SF Symbol) or Touch ID icon (`touchid` SF Symbol) based on biometricType
- Label: "Sign in with Face ID" / "Sign in with Touch ID"
- Entry animation: fade in + slide up 10pt over 0.3s

**Biometric login flow:**
```
1. User taps biometric button
2. Present LAContext evaluation with reason: "Sign in to Laten"
3. On biometric success:
   a. Retrieve credentials from iOS Keychain (key: "laten_auth_credentials")
   b. Call supabase.auth.signInWithPassword(email, password)
   c. On success → toast "Welcome back!" → navigate to /explore
   d. On "Invalid login credentials" error → toast error → delete stored credentials
4. On biometric failure: show toast error
```

**Biometric enrollment flow (after successful email/password login):**
```
1. User logs in successfully with email + password
2. If biometrics available AND no stored credentials:
   a. Show enrollment modal (see §2.7)
   b. If user accepts:
      - Present LAContext with reason: "Enable Face ID for future sign-ins"
      - On success: store {email, password} in Keychain
      - Toast: "Face ID enabled for quick sign-in!"
   c. If user declines: skip, proceed to app
```

### 2.7 Biometric Enrollment Modal

Shown as an overlay/alert after first successful email login on a device with biometrics.

**Design:**
- Fullscreen overlay: black at 60% opacity + backdrop blur
- Centered card: `#14141F` background, 1pt border, 16pt corner radius, max-width 360pt
- Content (centered):
  1. Icon circle: 64pt, primary/10 background, contains Face ID/Touch ID icon (32pt, primary color)
  2. Title: "Enable Face ID?" — 20pt semibold
  3. Description: "Sign in faster next time with Face ID. Your credentials will be stored securely on this device." — 14pt muted
  4. Primary button: "Enable Face ID" — full width, 48pt
  5. Ghost button: "Not now" — full width, 48pt, muted text
- Entry animation: spring (damping 25, stiffness 300), scale 0.9→1.0

### 2.8 Credential Storage (Keychain)

```
Keychain Configuration:
- Service: "com.laten.app"  
- Account: "biometric_credentials"
- Access: .whenUnlockedThisDeviceOnly
- Data format: JSON { "username": "email", "password": "password" }
- Use kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
```

### 2.9 Mode Toggle Animation

When switching between Sign In ↔ Sign Up:
- Display Name field animates in/out with height transition (0→auto) and opacity (0→1)
- Clear all validation errors on toggle
- Use `AnimatedContent` or `.transition(.asymmetric(insertion: .push(from: .top), removal: .push(from: .bottom)))` in SwiftUI

---

## 3. COLOR REFERENCE

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--background` | 240 20% 4% | `#0A0A0F` | Screen backgrounds |
| `--foreground` | 0 0% 98% | `#FAFAFA` | Primary text |
| `--card` | 240 15% 8% | `#14141F` | Input backgrounds, cards |
| `--primary` | 270 91% 65% | `#8B5CF6` | Buttons, accents, glows |
| `--primary-foreground` | 0 0% 100% | `#FFFFFF` | Text on primary |
| `--muted-foreground` | 240 5% 65% | `#A3A3B3` | Subtitles, placeholders |
| `--border` | 240 15% 18% | `#2A2A3D` | Input borders, dividers |
| `--neon-pink` | 330 100% 65% | `#EC4899` | Accent glow |
| `--neon-cyan` | 180 100% 50% | `#00FFFF` | Secondary accent |
| `--destructive` | 0 84% 60% | `#EF4444` | Errors, weak password |

---

## 4. SUPABASE INTEGRATION

**Client setup:**
```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
    supabaseKey: "YOUR_SUPABASE_ANON_KEY"
)
```

**Email Sign Up:**
```swift
try await supabase.auth.signUp(
    email: email,
    password: password,
    data: ["display_name": .string(displayName)]
)
```

**Email Sign In:**
```swift
try await supabase.auth.signIn(
    email: email,
    password: password
)
```

**Apple Sign In with ID Token:**
```swift
try await supabase.auth.signInWithIdToken(
    credentials: .init(
        provider: .apple,
        idToken: identityTokenString,
        nonce: rawNonce  // The UN-hashed nonce
    )
)
```

**Google/Facebook OAuth:**
```swift
try await supabase.auth.signInWithOAuth(
    provider: .google,  // or .facebook
    redirectTo: URL(string: "laten://auth/callback")
)
```

**Session Check:**
```swift
let session = try? await supabase.auth.session
// session != nil means user is logged in
```

**Auth State Listener:**
```swift
for await (event, session) in supabase.auth.authStateChanges {
    // Update app state based on event
}
```

---

## 5. ACCESSIBILITY & PERFORMANCE

- All touch targets: minimum 44×44pt
- Font sizes: minimum 16pt on input fields (prevents iOS auto-zoom)
- Support `@Environment(\.accessibilityReduceMotion)` — replace spring animations with simple fades
- VoiceOver labels on all interactive elements
- Password field: use `.textContentType(.password)` for AutoFill
- Email field: use `.textContentType(.emailAddress)` and `.keyboardType(.emailAddress)`
- Display name: use `.textContentType(.name)`
- All animations use `willChange` / GPU acceleration where applicable
- Respect safe area insets on all screens

---

## 6. ERROR HANDLING

| Scenario | User Message |
|----------|-------------|
| Invalid credentials | "Invalid email or password" |
| Email already registered | "This email is already registered. Try logging in instead." |
| Apple Sign-In cancelled | (silent, no toast) |
| Apple Sign-In timeout (60s) | "Apple Sign-In timed out. Please try again." |
| Apple nonce error | "Authentication verification failed. Please try again." |
| Provider not enabled | "[Provider] Sign-In is not configured. Please use email/password." |
| Biometric credentials expired | "Saved credentials are no longer valid. Please sign in again." |
| Generic error | "An unexpected error occurred" |
| Successful sign up | "Account created! Check your email to verify." |
| Successful sign in | "Welcome back!" |
| Biometric enabled | "Face ID enabled for quick sign-in!" |

---

## 7. NAVIGATION FLOW SUMMARY

```
App Launch
  └─→ Splash Screen (2s minimum)
        ├─→ Has valid session → /explore
        ├─→ No session + onboarding incomplete → /onboarding  
        └─→ No session + onboarding complete → Auth Screen
              ├─→ Sign In (email/password) → success → check biometric enrollment → /explore
              ├─→ Sign In (biometric) → success → /explore
              ├─→ Sign In (Apple/Google/Facebook) → success → /explore
              └─→ Sign Up → success → "Check email" toast → stay on Auth (login mode)
```
