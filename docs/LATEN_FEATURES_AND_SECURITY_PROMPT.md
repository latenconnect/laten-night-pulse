# Laten — Complete Features & App Security Reference Prompt

> **Purpose:** Authoritative reference for replicating Laten's full feature set and security architecture in any app builder or native codebase. Covers every user-facing feature, backend system, and security layer.

---

## 1. AUTHENTICATION & IDENTITY

### Sign-In Methods
- **Email/Password** — Standard Supabase Auth with email confirmation
- **Sign in with Apple** — MANDATORY for iOS App Store (uses ASAuthorizationController natively, hashed SHA-256 nonce for request, raw UUID nonce for Supabase call)
- **Google Sign-In** — OAuth 2.0 via Supabase Auth
- **Biometric Login (Face ID / Touch ID)** — After first successful login, user can opt in to store credentials securely in iOS Keychain (native) or via `capacitor-native-biometric` (web). Subsequent logins authenticate via `LAContext` / NativeBiometric before retrieving stored email+password to call `signInWithPassword`

### Age Verification (18+)
- **Provider:** Didit (identity verification API)
- **Flow:**
  1. Client calls `didit-session` Edge Function → returns verification URL
  2. User completes ID check in Didit's hosted flow
  3. Didit sends HMAC-SHA256 signed webhook to `didit-webhook` Edge Function
  4. Webhook verifies signature, updates `profiles.age_verified = true` and `profiles.age_verified_at`
  5. Native app handles `laten://verification-complete` deep link return
- **Enforcement:** Age verification is required before creating events or RSVPing
- **Dev bypass:** `is_dev_user()` RPC returns true for developer accounts, skipping verification in development

### Session Management
- Sessions persisted in `localStorage` (web) / Keychain (native)
- `autoRefreshToken: true` — tokens refresh automatically before expiry
- `onAuthStateChange` listener set up BEFORE `getSession()` call
- Password reset flow: `resetPasswordForEmail` → redirect to `/reset-password` → `updateUser({ password })`

---

## 2. USER ROLES & ACCESS CONTROL

### Role Architecture
- Roles stored in dedicated `user_roles` table (NEVER on profiles table — prevents privilege escalation)
- Enum type: `app_role` = `admin | moderator | user | dev`
- `has_role(_user_id, _role)` — `SECURITY DEFINER` function used in all RLS policies (prevents infinite recursion)
- Default role `user` assigned automatically via `handle_new_user()` trigger on signup

### Admin Access
- Restricted to single owner account (`aronpeterszabo@gmail.com`)
- Server-side validation via `has_role(auth.uid(), 'admin')` RPC — NEVER client-side checks
- Admin link hidden from all non-owner users in Profile page
- Admin capabilities: user management, content moderation, venue imports, translation management, marketplace oversight

---

## 3. ROW-LEVEL SECURITY (RLS)

### Design Principles
- **RLS enabled on ALL public tables** — no exceptions
- Every policy uses `has_role()` SECURITY DEFINER function to avoid recursive policy checks
- Users can only read/update their own profile data
- Event visibility: public events visible to all; private events (house_party, university) location restricted to host, cohosts, and RSVPed users via `can_view_event_location()` SECURITY DEFINER function
- RSVP visibility restricted via `can_view_event_rsvps()` — only hosts, cohosts, and admins
- Story visibility controlled by `can_view_story()` — supports public, close_friends, followers, and private tiers
- DM conversations: only participants can read/write; validated by `validate_dm_conversation()` trigger

### Rate Limiting
- `check_rate_limit(_user_id, _action, _max_requests, _window_minutes)` — database-level rate limiting
- Applied to analytics increments (max 10 per resource per user per minute)
- Silently ignores rate-limited requests (doesn't break UX)
- Old rate limit entries cleaned up automatically

---

## 4. DATA ENCRYPTION & PRIVACY

### End-to-End Encrypted Direct Messages
- **Key Exchange:** ECDH P-256 (Web Crypto API)
- **Message Encryption:** AES-256-GCM with random 12-byte nonce per message
- **Architecture:**
  - Each user generates an ECDH key pair on first use
  - Public key stored in `user_encryption_keys` table
  - Private key encrypted at rest in localStorage using:
    - Device-bound secret (random 256-bit, stored in localStorage)
    - User ID as additional entropy
    - PBKDF2 with 100,000 iterations + random 16-byte salt
    - AES-256-GCM for the storage encryption itself
  - Messages encrypted client-side BEFORE transmission to Supabase
  - Each message stored as two ciphertexts: `encrypted_content_sender` + `encrypted_content_recipient` with separate nonces
  - Server never sees plaintext message content

### Sensitive Data Handling
- Business contact info in `club_claims` stored as encrypted fields (`business_email_encrypted`, `business_phone_encrypted`)
- Verification documents stored in private `documents` storage bucket (not publicly accessible)
- Push tokens stored per-user, cleaned up on account deletion

---

## 5. WEBHOOK SECURITY

### Didit Webhook (Age Verification)
- Endpoint: `didit-webhook` Edge Function (`verify_jwt = false` — public endpoint)
- Verification: HMAC-SHA256 signature validation using `DIDIT_WEBHOOK_SECRET`
- Session ownership check: webhook payload matched against initiating user
- Prevents hijacking of verification sessions

### Apple Subscription Webhook
- Endpoint: `apple-subscription-webhook` Edge Function (`verify_jwt = false`)
- Server-to-server notifications from Apple (App Store Server Notifications V2)
- Validates using `APPLE_SHARED_SECRET`
- Handles subscription lifecycle: initial purchase, renewal, cancellation, billing retry, grace period

---

## 6. ACCOUNT DELETION & DATA PRIVACY

### GDPR & iOS Compliance
- Full account deletion via `delete_user_account()` SECURITY DEFINER function
- **Transaction-safe:** entire deletion rolls back on any error
- **Self-only:** validates `auth.uid() = user_id_to_delete`
- **10-phase cascading deletion:**
  1. DM system (messages, typing indicators, reactions, conversations)
  2. Stories (views, story records)
  3. Event participation (messages, Q&A, RSVPs, saved events, reports)
  4. Professional profiles (DJ, bartender, professional — including reviews, bookings, availability, subscriptions)
  5. Ticket purchases
  6. Social data (connections, interactions, preferences, push tokens, encryption keys, notifications, friend activity)
  7. Party groups (members, empty groups)
  8. Club claims
  9. Host profile & events — **soft delete** for events with active ticket sales (preserves for ticket holders), hard delete for others
  10. User roles, rate limits, profile (last)
- Returns detailed JSON deletion summary
- Encryption keys (`user_encryption_keys`) explicitly deleted
- localStorage encryption keys become orphaned (device-bound, cannot be recovered)

### Legal Pages
- `/privacy` — Privacy Policy (mandatory)
- `/terms` — Terms of Service (mandatory)
- Cookie consent banner (GDPR) — hidden on native iOS for native feel
- Liability disclaimer in event reporting flow
- 18+ age restriction legally enforced at signup

---

## 7. EVENTS SYSTEM

### Event Types
- `club` — Venue-based nightclub events
- `house_party` — Private house parties (location hidden until RSVP)
- `university` — University/campus events (location hidden until RSVP)
- `festival` — Multi-day festival events
- `public` — Open public gatherings

### Event Features
- **Creation Wizard:** 4-step flow (Basics → Details → Location → Review)
- **Co-hosting:** Multiple hosts per event via `event_cohosts` table with roles
- **RSVP System:** Track attendance with automatic count updates via `update_rsvp_count()` trigger
- **Ticketing:** Multiple ticket tiers per event, QR code generation (`generate_ticket_qr()` trigger), ticket scanning via `scan_ticket()` function
- **Event Chat:** Real-time messaging with host message badges, validated via `validate_event_message_host_flag()` trigger
- **Q&A:** Question and answer system with host-answer flagging
- **Event Boost:** Paid promotion with impressions/clicks tracking
- **Event Heat:** Real-time popularity tracking (heat level, current/peak attendees, vibe tags)
- **Event Lore:** Ephemeral media clips attached to events (auto-expire)
- **Event Analytics:** Daily views, clicks, shares, RSVPs, ticket sales, revenue tracking
- **Safety Rules:** Per-event safety information display
- **Auto-moderation:** Events with 5+ reports automatically deactivated via `check_report_count()` trigger

### Location Privacy
- Public events (club, festival, public): location visible to everyone
- Private events (house_party, university): location only visible to host, cohosts, RSVPed users, and admins
- Enforced via `can_view_event_location()` SECURITY DEFINER function

---

## 8. VENUES & CLUBS

### Venue Data
- 657 curated venues across 15 Hungarian cities:
  - Budapest: 100 | Debrecen: 59 | Siófok: 54 | Szeged: 49 | Győr: 45 | Pécs: 45
  - Nyíregyháza: 40 | Miskolc: 40 | Kecskemét: 40 | Székesfehérvár: 25 | Hévíz: 25
  - Sopron: 20 | Eger: 20 | Zamárdi: 20 | Balatonfüred: 15
- Data sourced from Google Places API (backend-only enrichment via Edge Functions)
- Venue fields: name, address, city, country, coordinates, photos, rating, price level, music genres, opening hours, highlights, services, venue type
- **Algolia search sync:** Real-time sync via `sync_club_to_algolia()` trigger → `algolia-sync-single` Edge Function

### Venue Claiming
- Business owners can claim venues via `club_claims` table
- Verification status enum: `pending | approved | rejected`
- Admin review required for approval
- Sensitive business contact info stored encrypted

### Venue Analytics
- Daily tracking: views, clicks, shares, directions clicks
- Rate-limited increments via `increment_club_analytics()` SECURITY DEFINER function

---

## 9. PROFESSIONALS MARKETPLACE

### DJ Profiles
- Fields: name, bio, city, genres, experience level, price range, currency, social links (Instagram, SoundCloud, Mixcloud), profile photo, rating, review count
- Booking request system with event details, budget range, and status tracking
- Availability calendar
- Review system with automatic rating recalculation via `update_dj_rating()` trigger
- Subscription tier: **DJ Spotlight** (€15/month)
- Active subscription check: `has_active_dj_subscription()` SECURITY DEFINER function
- Admin deletion: `delete_dj_profile()` cascades all related data

### Bartender Profiles
- Fields: name, bio, city, skills, experience level, price range, currency, Instagram, profile photo, rating, review count, preferred event types
- Booking system identical to DJ system
- Review system with `update_bartender_rating()` trigger
- Subscription tier: **Bartender Pro** (€15/month)
- Active subscription check: `has_active_bartender_subscription()`
- Admin deletion: `delete_bartender_profile()` cascades all related data

### Professional Profiles (Unified)
- Supports multiple profession types in a single table
- Same booking, availability, review, and subscription infrastructure
- Subscription tier: **Professional Plus** (€15/month)
- Active subscription check: `has_active_professional_subscription()`

---

## 10. SUBSCRIPTIONS & MONETIZATION

### Subscription Tiers
| Tier | Price | Entitlements |
|------|-------|-------------|
| DJ Spotlight | €15/mo | Marketplace listing, booking requests, portfolio links, analytics |
| Bartender Pro | €15/mo | Skills showcase, availability calendar, booking requests |
| Professional Plus | €15/mo | Multi-profession support, visual portfolios, booking requests |
| Party Boost (Host) | €10/mo | Priority event ranking, "Featured" badge, event analytics, Tonight's Picks eligibility |

### iOS In-App Purchases
- **StoreKit 2** for native iOS (mandatory — Apple requires IAP for digital goods)
- `verify-ios-receipt` Edge Function validates receipts server-side
- `apple-subscription-webhook` handles lifecycle events (renewal, cancellation, billing issues)
- 72-hour grace period on failed billing before deactivation
- `iOSSubscriptionNotice` component shown on web to redirect to native app for purchasing

### Event Boosts (One-time Purchases)
- Boost types with configurable duration (start/end times)
- Impressions and clicks tracking
- Status enum: `pending | active | completed | cancelled`
- Stripe payment integration for web purchases

### Advertising
- AdMob integration via `@capacitor-community/admob`
- Non-personalized ads ONLY (iOS privacy compliance)
- Native ad cards and story ads
- Cookie consent clarifies no tracking/data sharing for advertising

---

## 11. SOCIAL & ENGAGEMENT

### Friends & Connections
- `user_connections` table: follower/following relationship
- Friend suggestions algorithm
- Friend activity feed (RSVPs, saves tracked via triggers)
- "Live Friends Bar" showing friends' current activity
- Close friends list for story privacy

### Stories System
- Create photo/video stories with captions
- Privacy tiers: `public | close_friends | followers | private`
- Visibility enforced by `can_view_story()` SECURITY DEFINER function
- `story_hidden_from` table for per-user hiding
- Auto-expiry with `cleanup_expired_stories()` function
- View tracking with `increment_story_view_count()`
- Story highlights for persistent collections
- Storage: `stories` public bucket

### Gamification
- **XP System:** `add_user_xp()` awards XP, calculates level via `√(total_xp / 50)`
- Weekly/monthly XP tracking with automatic resets
- **Reputation System:**
  - `add_reputation()` SECURITY DEFINER function (only callable from triggers/admins)
  - Levels: Newcomer (0-99) → Regular (100-499) → Trusted (500-1999) → Elite (2000-4999) → Legend (5000+)
  - `calculate_rep_level()` IMMUTABLE function
  - Ghosting penalty: -25 rep via `record_ghost()` + violation logging
  - Check-in reward: +10 rep via `award_checkin_rep()` trigger
  - Users have SELECT-only access to their own reputation data
- **Attendance Streaks:** Tracked in `user_streaks` with current/longest streak, monthly counters
- **Achievements/Badges:** Category-based with secret achievements, XP rewards
- **Leaderboards:** Weekly/monthly rankings
- **Party Quests:** Gamified event participation challenges

### Party Groups
- Create/join party groups for coordinated event attendance
- Member management with status tracking
- Groups cleaned up on creator account deletion (only if no other active members)

### Party Matching
- Widget-based matching system for finding party companions
- Connection system with expiry (`cleanup_expired_connections()`)
- Match groups with active/inactive status

---

## 12. REAL-TIME FEATURES

### Supabase Realtime Subscriptions
- `event_messages` — Live event chat
- `direct_messages` — E2E encrypted DM delivery
- `dm_typing_indicators` — Typing status with `is_typing` flag and timestamp
- `events` — Event updates (RSVPs, status changes)
- `dm_message_reactions` — Emoji reactions on DMs

### Tonight Mode
- Curated "Tonight's Picks" via `tonights-picks` Edge Function
- Real-time event heat tracking
- Live friends bar showing who's going where

---

## 13. MAPS & LOCATION

### Mapbox Integration
- Interactive map view with venue markers
- Heatmap overlay showing event density/popularity
- User geolocation for nearby discovery
- Directions integration

### Location Permissions (iOS)
- `NSLocationWhenInUseUsageDescription` — Map positioning and nearby venue discovery
- `NSLocationAlwaysAndWhenInUseUsageDescription` — Background notifications for nearby events
- Location data used for personalized feed and venue sorting

---

## 14. NOTIFICATIONS

### Push Notifications
- **APNs** for native iOS (via `APNS_AUTH_KEY`, `APNS_KEY_ID`, `APPLE_TEAM_ID`)
- `push_tokens` table stores device tokens per user
- Edge Functions for different notification types:
  - `send-notification` — General notifications
  - `send-dm-notification` — New DM alerts
  - `send-booking-notification` — Booking request updates
  - `send-boost-notification` — Boost status changes
- `notification_preferences` table for user opt-in/opt-out
- Background mode capability required: Remote notifications
- Tokens cleaned up on account deletion

---

## 15. SEARCH

### Algolia Integration
- Real-time sync for events and clubs via database triggers
- `algolia-sync-single` Edge Function handles individual record sync
- `algolia-sync` Edge Function for bulk sync operations
- `algolia-search` Edge Function for server-side search (public, no JWT required)
- Client-side search via `useAlgoliaSearch` hook
- Secrets: `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_API_KEY`, `ALGOLIA_SEARCH_API_KEY`

---

## 16. PERSONALIZATION

### User Preferences Engine
- `user_interactions` table tracks: view, click, save, share, RSVP actions
- `update_user_preferences()` trigger calculates weighted preference scores:
  - View: 1pt | Click: 2pt | Save: 3pt | Share: 4pt | RSVP: 5pt
- Per-event-type preference percentages stored in `user_preferences`
- Powers personalized "For You" feed and event recommendations
- `friend_activity` tracked for social proof signals

---

## 17. SAFETY & MODERATION

### Event Safety
- Per-event safety rules display
- Sober-friendly event flag (`is_sober_friendly`)
- Wellness tags on events
- Age limit enforcement per event

### Reporting System
- Users can report events and other users
- Auto-deactivation at 5 reports via `check_report_count()` trigger
- Admin review queue for reported content
- Liability disclaimer: users acknowledge Laten is not responsible for events

### Safety Buddy
- SOS/safety widget for users at events
- Emergency contact features

### Content Moderation
- Host verification required before creating real events
- Event message host flag validation (prevents impersonation)
- Admin moderation tools for content review

---

## 18. INFRASTRUCTURE SECURITY

### Edge Functions
- All Edge Functions use `verify_jwt = true` EXCEPT:
  - `didit-webhook` (public webhook endpoint, HMAC-verified)
  - `algolia-search` (public search endpoint)
  - `proxy-image` (public image proxy)
  - `get-club-photo` (public photo endpoint)
  - `algolia-sync-single` (triggered by database, no user JWT)
  - `apple-subscription-webhook` (Apple server-to-server)

### Storage Buckets
| Bucket | Public | Purpose |
|--------|--------|---------|
| `stories` | Yes | Story media (photos/videos) |
| `photos` | Yes | Event and profile photos |
| `avatars` | Yes | User profile pictures |
| `professional-photos` | Yes | DJ/bartender portfolio images |
| `documents` | **No** | Verification documents (private) |

### API Security
- All Supabase queries go through RLS — no direct table access without policy approval
- SECURITY DEFINER functions for sensitive operations (reputation, XP, analytics, ticket scanning)
- Rate limiting on analytics endpoints
- Input validation via Zod schemas on client side
- DOMPurify for HTML sanitization
- `encodeURIComponent` for URL parameters
- 16px minimum font size on inputs (prevents iOS zoom)

### Secrets Management
- 22 secrets stored in Supabase Edge Function secrets (never in client code)
- Private keys: `DIDIT_API_KEY`, `STRIPE_SECRET_KEY`, `ALGOLIA_ADMIN_API_KEY`, `APNS_AUTH_KEY`, `APPLE_SHARED_SECRET`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_TRANSLATION_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Publishable keys in `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (safe for client)

---

## 19. COMPLIANCE

### GDPR
- Cookie consent banner with essential-only cookie clarification
- Full account deletion with cascading data removal
- Privacy policy at `/privacy`
- No tracking or data sharing for advertising on iOS

### iOS App Store
- Sign in with Apple (mandatory)
- In-App Purchases via StoreKit 2 (mandatory for digital goods)
- Account deletion capability (mandatory)
- Privacy usage descriptions for all permissions
- Non-personalized ads only

### France Encryption Declaration
- ANSSI declaration required for App Store distribution in France
- Encryption type: Standard HTTPS/TLS for API communications
- Algorithms: TLS 1.2/1.3 for authentication and secure data transmission
- Acknowledgment receipt uploaded to App Store Connect

---

## 20. NATIVE iOS CAPABILITIES (Xcode)

### Required Capabilities
- Sign in with Apple
- Push Notifications
- In-App Purchase
- Background Modes (Remote notifications)
- Associated Domains (`applinks:latenapp.com`, `webcredentials:latenapp.com`)

### Privacy Permissions (Info.plist)
| Key | Usage |
|-----|-------|
| `NSCameraUsageDescription` | Capture photos for stories, event posts, and profile pictures |
| `NSFaceIDUsageDescription` | Securely sign in using Face ID |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | Receive notifications about events near you, even in the background |
| `NSLocationWhenInUseUsageDescription` | Show nearby venues, events, and your position on the map |
| `NSAppleMusicUsageDescription` | Share music in your event posts and stories |
| `NSMicrophoneUsageDescription` | Record audio for video stories |
| `NSPhotoLibraryUsageDescription` | Select photos and videos for stories, events, and your profile |
| `NSPhotoLibraryAddUsageDescription` | Save event tickets and QR codes to your photo library |

### App Identity
- Bundle ID: `com.laten.app`
- Team ID: `6BA8ZY4ZPX`
- Custom URL scheme: `laten://`
- AASA hosted at: `https://latenapp.com/.well-known/apple-app-site-association`

---

## 21. INTERNATIONALIZATION

### Supported Languages
- **Hungarian** (primary)
- **English** (secondary)
- Translation management via admin panel using Google Cloud Translation API
- `translate-i18n` Edge Function for automated translations
- i18next + react-i18next for client-side localization

---

## 22. WEEKLY RECAP & ANALYTICS

### Weekly Recap
- `weekly-recap` Edge Function generates personalized weekly summaries
- Attendance stats, streak updates, XP earned
- Delivered as in-app cards (`WeeklyRecapCard` component)

### Host Analytics
- Event analytics dashboard for hosts
- Social share templates for event promotion
- Boost performance tracking (impressions, clicks, conversion)

---

*This document is the single source of truth for Laten's complete feature set and security architecture. Every system described here is implemented and production-ready.*
