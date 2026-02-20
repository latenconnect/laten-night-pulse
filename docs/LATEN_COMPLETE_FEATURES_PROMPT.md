# Laten — Complete Features & Architecture Prompt

> Use this document as the single source of truth when building or replicating the Laten nightlife platform. Every screen, feature, subscription tier, and data constraint is defined below.

---

## 1. Product Overview

**Laten** is a nightlife discovery and event platform for Hungary. It connects partygoers with clubs, house parties, university events, festivals, and professional nightlife talent (DJs, bartenders, photographers, security). The app is dark-mode only, iOS-first, and monetised exclusively through Apple In-App Purchases.

### Core Value Propositions
- **For Users:** Discover tonight's best events, see which friends are going, RSVP, buy tickets, and navigate to venues via an interactive map.
- **For Hosts:** Create and promote events, track RSVPs and ticket sales in real-time, boost visibility with paid features, and manage co-hosts.
- **For Professionals:** Get discovered by event organisers, receive direct booking requests, showcase portfolios, and build verified reputations.

---

## 2. Supported Cities & Venue Database

The platform launches across **15 Hungarian cities** with a curated, quality-controlled venue database. Venues are imported periodically (every 30–90 days) from Google Places API and enriched with AI-generated profiles. Only vetted nightlife establishments are included — generic restaurants, cafés, and non-nightlife businesses are excluded.

| City | Venue Count | Notes |
|------|------------|-------|
| **Budapest** | 100 | Capital, highest density of premium clubs and bars |
| **Debrecen** | 59 | Major university city, strong nightlife scene |
| **Siófok** | 54 | Lake Balaton party capital, highly seasonal (summer peak) |
| **Szeged** | 49 | University town, vibrant bar culture |
| **Győr** | 45 | Western Hungary hub |
| **Pécs** | 45 | Cultural capital, diverse venue types |
| **Nyíregyháza** | 40 | Eastern Hungary nightlife centre |
| **Miskolc** | 40 | Northern Hungary hub |
| **Kecskemét** | 40 | Central Hungary, growing scene |
| **Székesfehérvár** | 25 | Historic city with emerging nightlife |
| **Hévíz** | 25 | Spa town, tourism-driven nightlife |
| **Eger** | 20 | Famous wine region, Valley of the Beautiful Women |
| **Sopron** | 20 | Border town, cross-border nightlife with Austria |
| **Zamárdi** | 20 | Balaton Sound festival town, highly seasonal |
| **Balatonfüred** | 15 | Lake Balaton resort, seasonal upscale venues |

**Total: ~657 curated venues**

### Venue Data Model
Each venue record contains:
- Basic info: name, address, city, country, lat/lng coordinates
- Quality signals: Google rating (1–5), price level (1–4), business status
- Media: array of photo URLs (venues without photos are excluded from display)
- Categorisation: venue_type (`night_club`, `bar`, `pub`, `lounge`, `festival_venue`, `event_space`)
- AI-enriched content: description, music genres, highlights, services
- Crowd intelligence: age range, dress code, atmosphere, "best for" tags
- Opening hours with `open_now` status
- Google Maps deep link for navigation
- Admin curation flags: `is_active`, `is_featured`

### Venue Categories
- `night_club` — Traditional nightclubs with dance floors
- `bar` — Drinking establishments, cocktail bars
- `pub` — Casual drinking venues
- `lounge` — Upscale, relaxed atmosphere
- `festival_venue` — Large-scale event spaces
- `event_space` — Multi-purpose venues for private events

---

## 3. User Roles & Permissions

### 3.1 Regular User (Default)
- Browse and search events and venues
- RSVP to events (free) or purchase tickets (paid events)
- Save/favourite events
- View interactive map with venue markers and heatmaps
- Send and receive direct messages (end-to-end encrypted)
- Add friends, see friend activity and who's attending events
- Post and view Stories (24-hour ephemeral content)
- Join Party Groups for coordinated attendance
- Earn XP, unlock achievements, maintain attendance streaks
- Access Safety Buddy features
- Report events or users

### 3.2 Event Host
All Regular User features, plus:
- Create and manage events with full details
- Set ticket tiers with pricing
- View real-time event analytics (RSVPs, views, clicks, shares)
- Manage co-hosts with role-based permissions
- Generate QR codes for event check-ins
- Access host-specific dashboard
- Book professionals (DJs, bartenders) for events
- Use social share templates for promotion

### 3.3 Professional (DJ / Bartender / Other)
All Regular User features, plus:
- Create and manage a professional profile (requires active subscription)
- Set availability calendar
- Receive and respond to booking requests
- Collect verified ratings and reviews
- Showcase portfolio (photos, external links)

### 3.4 Admin
- Full dashboard with user management
- Event moderation and approval
- Host verification queue
- Report review and resolution
- Venue curation (feature/unfeature, activate/deactivate)
- Translation management for i18n
- Data import tools
- Platform-wide analytics

---

## 4. Core Features — Screen by Screen

### 4.1 Onboarding Flow
**Screens:** Welcome → Age Verification → City Selection → Interests → Permissions

1. **Welcome Screen:** App logo, tagline, "Get Started" CTA
2. **Age Verification:** Users must confirm they are 18+. Integrated with Didit for identity verification. Under-18 users are blocked from proceeding.
3. **City Selection:** Scrollable list of all 15 supported cities. Default: Budapest. Selection persists across sessions (stored in local storage).
4. **Interests Selection:** Grid of music genre tags: Techno, House, Hip-Hop, EDM, R&B, Latin, Pop, Rock, Jazz, Drum & Bass, Trance, Afrobeats, Reggaeton, K-Pop, Indie. Multi-select with visual feedback. Used for personalised feed ranking.
5. **Permissions:** Request notification permissions and location access.

### 4.2 Authentication
**Methods supported:**
- Email + password (magic link optional)
- Phone number (OTP)
- Apple Sign-In (native iOS)
- Google Sign-In
- Biometric login (Face ID / Touch ID) for returning users

Auth state is managed via Supabase Auth with JWT tokens. Sessions persist across app launches.

### 4.3 Home Screen
Two primary tabs: **Feed** and **Map**

#### Feed Tab
- **Stories Bar:** Horizontal scrollable row of user/event stories at the top (Instagram-style circles with gradient borders)
- **Tonight's Picks:** Algorithmically selected events happening tonight, based on location, interests, and friend activity
- **For You Section:** Personalised event feed based on interests, past RSVPs, and social signals
- **Community Events:** User-created house parties and gatherings
- **Featured Talent:** Carousel of subscribed professionals (DJs, bartenders)
- **Party Groups:** Active groups the user belongs to

#### Map Tab
- Full-screen Mapbox GL map
- Glowing venue markers colour-coded by venue type
- Clustered markers that expand on zoom
- Heatmap overlay showing nightlife density
- Filter controls for event type, date, price range
- Tap marker → venue/event preview card slides up from bottom
- "Tonight Mode" toggle for showing only active events

### 4.4 Explore / Search
- **Global search** powered by Algolia
- Searches across both events and venues simultaneously
- Results categorised into tabs: Events | Venues
- Filters: city, event type, date range, price range, music genre
- Recent searches persisted locally
- Highlighted matching text in results

### 4.5 Event Details
- **Hero section:** Full-width cover image with parallax scroll effect
- **Event metadata:** Name, date/time, location, price (or "Free"), age limit, dress code
- **Host info:** Avatar, name, verification badge, tap to view profile
- **Description:** Full event description with markdown support
- **Attendance:** RSVP count, friends going (with avatars), expected attendance
- **Ticket section:** Available ticket tiers with pricing, quantity remaining, "Buy Ticket" CTA
- **Event Chat:** Real-time group chat for attendees (Supabase Realtime)
- **Q&A Section:** Ask questions to the host, host-marked answers highlighted
- **Safety info:** Safety rules, sober-friendly badge, wellness tags
- **Share button:** Native share sheet + social share templates
- **Save/favourite:** Bookmark for later
- **Navigation:** "Get Directions" opens Google Maps or Apple Maps
- **Nearby venues:** Carousel of other venues in the same city
- **Co-hosts:** Listed with roles if applicable

### 4.6 Event Creation (Host)
Multi-step wizard with progress indicator:

1. **Basics:** Event name, type (club/house_party/university/festival/outdoor/foreigner), cover image upload
2. **Details:** Description, age limit, dress code, expected attendance, price, safety rules, wellness tags, sober-friendly toggle
3. **Location:** Venue name, address, city selection, map pin placement (lat/lng)
4. **Review:** Preview card showing how the event will appear in the feed, confirm and publish

### 4.7 User Profile
- Profile photo (uploadable)
- Display name, age, bio
- Attendance stats: events attended, streak count, XP level
- Achievement badges grid
- Favourite events list
- Friends list with activity status
- Settings: language (Hungarian/English), notification preferences, privacy, account management

### 4.8 Direct Messages
- **Inbox:** List of conversations sorted by most recent
- **Chat view:** Real-time messaging with typing indicators
- **End-to-end encryption:** Messages encrypted client-side before storage
- **Message types:** Text, reactions (emoji), file attachments
- **Read receipts:** Timestamp when message was read
- **New conversation:** Search users to start a DM
- **Push notifications:** Triggered via Edge Function on new message

### 4.9 Stories System
- **Create:** Photo/video upload with caption, privacy settings (public/friends-only/close-friends)
- **View:** Full-screen viewer with tap-to-advance, swipe between users
- **Stories Bar:** Horizontal scroll on home screen, gradient ring indicates unviewed
- **Highlights:** Pin stories to profile permanently
- **Expiry:** Auto-delete after 24 hours
- **View count:** Visible to story creator

### 4.10 Friends & Social
- **Friend suggestions:** Based on mutual connections, same city, shared interests
- **Friend search:** By name or username
- **Friend activity feed:** See what events friends are attending, RSVPs, check-ins
- **Live friends bar:** Shows friends currently at events (real-time)
- **Close friends list:** Curated subset for story privacy

### 4.11 Party Groups
- Create named groups for coordinated event attendance
- Invite friends to groups
- Group chat
- Shared event suggestions
- "Going together" status on event cards

### 4.12 Interactive Map
- **Technology:** Mapbox GL JS
- **Markers:** Custom glowing markers, colour-coded by venue type
- **Clustering:** Automatic at lower zoom levels, expands on tap
- **Heatmap:** Density overlay based on venue concentration and event activity
- **Filters:** Event type, date, genre, price range
- **Tonight Mode:** Toggle to show only events happening in the next 6 hours
- **User location:** Blue pulsing dot with accuracy circle
- **Venue preview:** Bottom sheet slides up on marker tap with venue photo, name, rating, and "View Details" CTA

### 4.13 Professionals Marketplace

#### DJ Marketplace
- Browse DJs filtered by: city, genre, experience level, price range, availability
- DJ cards show: profile photo, name, genres, rating, price range, city
- Tap to view full profile with bio, portfolio links (SoundCloud, Mixcloud, Instagram), reviews
- "Book DJ" bottom sheet: select event date, type, budget range, add message
- **Subscription-gated:** Only DJs with active subscriptions appear in search

#### Bartender Marketplace
- Browse bartenders filtered by: city, skills, experience level, price range, availability
- Bartender cards show: profile photo, name, skills (up to 15), rating, price range
- Tap to view full profile with bio, event type preferences, reviews
- "Book Bartender" bottom sheet: event date, type, location, budget, description
- **Subscription-gated:** Only bartenders with active subscriptions appear in search

#### Unified Professionals Page
- Combined view of all professional types (photographers, security, videographers, etc.)
- Filter by profession type, city, price range
- Multi-profession profiles supported (e.g., photographer + videographer)
- Portfolio showcase with visual grid
- **Subscription-gated:** Active subscription required for visibility

### 4.14 Gamification & Engagement

#### XP & Levels
- Earn XP for: attending events, posting stories, RSVPs, streaks, reviews
- Level progression displayed on profile
- Level-up celebrations with confetti animation

#### Achievements & Badges
- Categorised badges: attendance milestones, social (friends count), hosting, exploration
- Secret achievements for surprise engagement
- Badge grid on profile with earned/locked states

#### Attendance Streaks
- Track consecutive week attendance
- Streak display widget on home screen
- Streak freeze mechanic (miss one week without losing streak)
- Weekly streak rewards

#### Leaderboards
- City-level and global leaderboards
- Ranked by XP, events attended, or streak length
- Friends-only leaderboard view

#### Party Quests
- Weekly challenges: "Attend 3 events this week," "Try a new venue," "Invite 5 friends"
- XP rewards on completion
- Progress tracking with visual indicators

### 4.15 Reputation System
- Reputation score based on: events attended, reviews given/received, report history, community contributions
- Reputation levels: Newcomer → Regular → Trusted → VIP → Legend
- Higher reputation unlocks: early event access, exclusive event tiers, priority ticket purchasing
- Event access tiers can require minimum reputation scores

### 4.16 Safety Features

#### Safety Buddy
- Designate a trusted contact as your "Safety Buddy" for a night out
- Share real-time location with buddy during events
- Quick SOS button sends alert with location to buddy
- Auto check-in reminders at configurable intervals
- "Got home safe" confirmation prompt

#### Reporting
- Report events (inappropriate content, safety concerns, scam)
- Report users (harassment, fake profiles)
- Report count tracked per event; auto-flag at threshold
- Admin review queue for reports

### 4.17 Ticketing
- Hosts create ticket tiers per event: name, price (in cents), quantity, sale window
- Users purchase tickets via in-app flow
- Ticket confirmation with QR code for entry
- Ticket inventory tracking (quantity sold / quantity total)
- Sale start/end dates for time-limited releases

### 4.18 Event Analytics (Host Dashboard)
- **Views:** How many users saw the event
- **Clicks:** How many tapped into details
- **RSVPs:** Total count with trend
- **Ticket sales:** Revenue tracking in cents
- **Shares:** How many times the event was shared
- **Daily breakdown:** Chart with date-based granularity
- **Real-time updates:** Live counters during event

### 4.19 Venue Details (Club Page)
- Hero photo gallery (swipeable carousel)
- Venue name, address, city, rating (stars), price level (€–€€€€)
- AI-generated description
- Music genres tags
- Highlights (e.g., "Rooftop terrace," "Craft cocktails," "Live music")
- Services (e.g., "Table reservations," "VIP area," "Coat check")
- Crowd info: age range, dress code, atmosphere, "best for"
- Opening hours with "Open Now" indicator
- Google Maps link for navigation
- Upcoming events at this venue
- Nearby venues carousel
- Venue analytics (for claimed venues): views, clicks, direction requests

### 4.20 Venue Claiming (Business)
- Business owners can claim a venue listing
- Claim form: business name, email, phone (encrypted), verification documents
- Admin review and approval workflow
- Approved owners get edit access to venue details and analytics

### 4.21 Notifications
- Push notifications via APNs (Apple Push Notification service)
- Notification types:
  - New booking request (for professionals)
  - Booking status update
  - New direct message
  - Event reminder (1 hour before RSVP'd events)
  - Friend activity (friend RSVPs to an event)
  - Boost notification (nearby boosted event)
  - Weekly recap summary
- In-app notification prompt with permission request

### 4.22 Weekly Recap
- Automated weekly summary delivered as push notification and in-app card
- Content: events attended, XP earned, streak status, friend highlights, trending events missed
- Generated via Edge Function on a schedule

### 4.23 Internationalization (i18n)
- Two languages: **Hungarian** (default) and **English**
- Language switcher accessible from profile/settings
- All UI strings stored in translation files
- AI-powered translation via Edge Function for dynamic content
- Date/time formatting respects locale

---

## 5. Subscription Tiers & Monetisation

All subscriptions are managed exclusively through **Apple In-App Purchases (StoreKit 2)**. No web-based payment flow exists. Each subscription auto-renews monthly.

### 5.1 DJ Spotlight — €15/month
**iOS Product ID:** `com.laten.dj.subscription`

**Entitlements:**
- ✅ Appear in DJ marketplace search results (hidden when inactive)
- ✅ Receive direct booking requests from event hosts
- ✅ In-app chat with potential clients about bookings
- ✅ Collect and display verified ratings & reviews
- ✅ Availability calendar (set available/unavailable dates with notes)
- ✅ Portfolio links: SoundCloud, Mixcloud, Instagram URLs displayed on profile
- ✅ Priority support
- ✅ 72-hour grace period after lapse before profile is hidden

**Profile Data:**
- DJ name, bio, city, profile photo
- Genres (multi-select array)
- Experience level
- Price range (min/max with currency)
- Preferred event types
- External links (SoundCloud, Mixcloud, Instagram)

### 5.2 Bartender Pro — €15/month
**iOS Product ID:** `com.laten.bartender.subscription`

**Entitlements:**
- ✅ Appear in bartender marketplace search results (hidden when inactive)
- ✅ Receive direct booking requests for private events
- ✅ Skills showcase (up to 15 cocktail/bartending skills)
- ✅ In-app chat with potential clients
- ✅ Collect and display verified ratings & reviews
- ✅ Availability calendar
- ✅ Event type filtering (specify preferred event types)
- ✅ Priority support
- ✅ 72-hour grace period after lapse

**Profile Data:**
- Bartender name, bio, city, profile photo
- Skills array (max 15)
- Experience level
- Price range (min/max with currency)
- Preferred event types
- Instagram URL

### 5.3 Professional Plus — €15/month
**iOS Product ID:** `com.laten.professional.subscription`

**Entitlements:**
- ✅ Appear in unified professionals marketplace (hidden when inactive)
- ✅ Multi-profession listings (e.g., photographer + videographer in one profile)
- ✅ Visual portfolio showcase
- ✅ Receive direct booking requests
- ✅ In-app chat with potential clients
- ✅ Collect and display verified ratings & reviews
- ✅ Unified marketplace visibility across all profession categories
- ✅ Priority support
- ✅ 72-hour grace period after lapse

**Profile Data:**
- Professional name, bio, city, profile photo
- Profession types (multi-select)
- Portfolio images
- Price range (min/max with currency)
- Experience level

### 5.4 Party Boost (Host Tier) — €10/month
**iOS Product ID:** `com.laten.partyboost.subscription`

**Entitlements:**
- ✅ Priority placement in the home feed (events ranked higher)
- ✅ "Featured" badge displayed on event cards
- ✅ Automated push notifications sent to nearby users when event starts
- ✅ Real-time event analytics dashboard (views, RSVPs, ticket sales, shares, clicks)
- ✅ Trending section visibility (eligible for "Tonight's Picks" algorithm)
- ✅ Social share templates (pre-designed promotional graphics)
- ✅ Priority support

**Host Data:**
- Host profile linked to user account
- Event history and analytics
- Subscription status tracked in `host_subscriptions` table

### 5.5 Subscription Technical Implementation

#### Database Schema
Each professional type has its own subscription table:
- `dj_subscriptions` → linked to `dj_profiles` via `dj_profile_id`
- `bartender_subscriptions` → linked to `bartender_profiles` via `bartender_profile_id`
- `professional_subscriptions` → linked to `professionals` via `professional_id`
- `host_subscriptions` → linked to `hosts` via `host_id`

Each subscription record contains:
- `status`: `active` | `cancelled` | `expired` | `trial` | `inactive`
- `tier`: `standard` | `premium` | `boost`
- `price_cents`: amount in EUR cents
- `currency`: always `EUR`
- `started_at` / `expires_at`: subscription window
- `auto_renew`: boolean
- `stripe_subscription_id`: legacy field (unused on iOS)

#### Subscription Gating Logic
```
IF user has professional profile (DJ/Bartender/Professional):
  IF subscription.status == 'active' AND subscription.expires_at > now():
    → Profile VISIBLE in marketplace search
    → Can receive booking requests
    → Can chat with clients
  ELSE IF subscription.expires_at + 72_hours > now():
    → Profile still VISIBLE (grace period)
  ELSE:
    → Profile HIDDEN from all search results
    → Cannot receive new booking requests
    → Existing conversations remain accessible (read-only)
```

#### Purchase Flow (iOS)
1. User taps "Subscribe" on paywall screen
2. App calls StoreKit 2 to initiate purchase
3. Apple handles payment UI and authentication
4. On success, receipt is sent to `verify-ios-receipt` Edge Function
5. Edge Function validates receipt with Apple's servers
6. On valid receipt, subscription record is created/updated in database
7. App refreshes subscription state from database
8. Professional profile becomes visible in marketplace

#### Subscription Lifecycle (Server-Side)
- `apple-subscription-webhook` Edge Function receives App Store Server Notifications V2
- Handles events: `DID_RENEW`, `DID_FAIL_TO_RENEW`, `EXPIRED`, `REFUND`, `REVOKE`
- Updates subscription status in database accordingly
- No client action needed for renewals

#### Multi-Subscription Support
Users can hold multiple subscriptions simultaneously. For example:
- A user can be both a DJ (DJ Spotlight) and an event host (Party Boost)
- Each subscription is tracked independently in its own table
- The app queries all subscription tables to build a complete entitlement picture

#### Restore Purchases
- "Restore Purchases" button on paywall/settings screen
- Calls StoreKit 2 restore API
- Re-validates all previous purchases
- Updates local subscription state

---

## 6. Event Types

| Type | Label | Icon | Description |
|------|-------|------|-------------|
| `club` | Club | 🎵 | Nightclub events at established venues |
| `house_party` | House Party | 🏠 | Private residence events |
| `university` | University | 🎓 | Campus and student events |
| `festival` | Festival | 🎪 | Multi-day or large-scale festivals |
| `outdoor` | Outdoor | 🌙 | Open-air events, rooftops, gardens |
| `foreigner` | International | 🌍 | Events targeting international visitors |

---

## 7. Tech Stack & Infrastructure

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS with custom design tokens (HSL-based)
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Animations:** Framer Motion (spring: stiffness 380, damping 35)
- **Maps:** Mapbox GL JS
- **Search:** Algolia (via Supabase Edge Function proxy)
- **State:** TanStack React Query for server state, React Context for app state
- **i18n:** i18next + react-i18next
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router v6

### Native (iOS)
- **Shell:** Capacitor 7 wrapping the React web app
- **Auth:** @capacitor-community/apple-sign-in
- **Biometrics:** capacitor-native-biometric
- **Haptics:** @capacitor/haptics
- **Push:** @capacitor/push-notifications (APNs)
- **Payments:** cordova-plugin-purchase (StoreKit 2)
- **Ads:** @capacitor-community/admob
- **Keyboard:** @capacitor/keyboard
- **Status Bar:** @capacitor/status-bar

### Backend
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth (email, phone, OAuth providers)
- **Realtime:** Supabase Realtime for chat and live updates
- **Storage:** Supabase Storage for images and media
- **Edge Functions:** Deno-based serverless functions for:
  - `algolia-search` / `algolia-sync` — Search indexing
  - `verify-ios-receipt` — Apple receipt validation
  - `apple-subscription-webhook` — Subscription lifecycle
  - `send-notification` / `send-dm-notification` / `send-booking-notification` / `send-boost-notification` — Push notifications
  - `tonights-picks` — Algorithm for curated event selection
  - `weekly-recap` — Automated weekly summaries
  - `didit-session` / `didit-webhook` — Age verification
  - `import-clubs` / `generate-club-profiles` / `get-club-photo` / `cleanup-venues` — Venue management
  - `proxy-image` — Image proxy for external URLs
  - `translate-i18n` — AI-powered translations

### External Services
- **Mapbox:** Map rendering, geocoding
- **Algolia:** Full-text search across events and venues
- **Google Places API (New):** Backend-only venue data imports
- **Didit:** Identity and age verification
- **Apple App Store:** In-App Purchases, Server Notifications
- **APNs:** Push notification delivery
- **AdMob:** Native advertising (non-subscriber users)

---

## 8. Security & Privacy

- **End-to-end encrypted DMs:** Messages encrypted client-side with per-conversation keys; server stores only ciphertext
- **Row Level Security:** All Supabase tables have RLS policies; users can only access their own data
- **Encrypted PII:** Business contact info (email, phone) in club claims is encrypted at rest
- **Age verification:** Mandatory 18+ check during onboarding
- **Report system:** Users can report events and profiles; auto-flagging at report thresholds
- **Biometric auth:** Optional Face ID / Touch ID for app access
- **Session management:** JWT-based with automatic refresh

---

## 9. Design System Summary

- **Theme:** Dark mode only, "nightclub VIP" aesthetic
- **Background:** `#0A0A0F` (near-black)
- **Primary:** `#8B5CF6` (electric purple)
- **Accent:** Neon pink, cyan, amber gradients
- **Cards:** Glassmorphism (backdrop-blur 20px, 1px semi-transparent borders, 5% white background)
- **Typography:** DM Sans (body) + Outfit (headings)
- **Animations:** Spring physics (stiffness 380, damping 35), parallax heroes, scale-bounce on touch
- **Touch targets:** Minimum 44pt
- **Bottom nav:** 83px height including safe area inset
- **Skeleton loaders:** Pulsing dark glass cards during loading states
- **Toasts:** Sonner notifications for success/error feedback

---

## 10. Advertising

- **Native ad cards** inserted into event feed (every 5th position)
- **Story ads** between user stories
- **AdMob integration** for banner and interstitial ads
- **Ad-free experience** for subscribers (future consideration)

---

## 11. Data Flow Summary

```
User Action → React Component → React Query / Supabase Client
  → Supabase (PostgreSQL + RLS) → Response → UI Update

Real-time:
  Supabase Realtime Channel → Subscription Callback → State Update → UI

Push Notifications:
  Database Trigger → Edge Function → APNs → iOS Device

Search:
  User Query → Edge Function (algolia-search) → Algolia API → Results → UI

Payments:
  StoreKit 2 → Receipt → Edge Function (verify-ios-receipt) → Apple Servers
  → Database Update → UI Refresh

Venue Import (Admin):
  Edge Function (import-clubs) → Google Places API → Supabase Insert
  → Edge Function (generate-club-profiles) → AI Enrichment → Update
```

---

*This document covers the complete Laten feature set as of February 2026. Use it as the authoritative reference for any implementation, replication, or native port of the platform.*
