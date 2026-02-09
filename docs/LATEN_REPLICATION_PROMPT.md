# PROMPT: Build an Exact Replica of Laten — Native iOS Nightlife App

You are building **Laten**, a native SwiftUI nightlife event discovery app targeting Gen-Z users in Hungary. The app lets users discover clubs, house parties, university events, festivals, and outdoor events. It has two core user roles: **Regular Users** (browse, RSVP, save, attend) and **Event Hosts** (create/manage events, verify identity). The entire backend runs on Supabase (PostgreSQL + Edge Functions + Realtime + Storage). The app connects to Supabase using the Swift SDK — URL: `https://huigwbyctzjictnaycjj.supabase.co`, Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aWd3YnljdHpqaWN0bmF5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjY0NjYsImV4cCI6MjA4MDQ0MjQ2Nn0.q9WSajU3VpAGr4N2woiKO9zHIc8koJyRjkGs8aSHhFg`. Bundle ID: `com.laten.app`, Team ID: `6BA8ZY4ZPX`, deployment target iOS 15.0+.

## Architecture

Use MVVM with `@MainActor` ViewModels. All Supabase calls go through dedicated service classes (AuthService, EventService, ClubService, MessagingService, StoryService, PushService, AdManager). Use `async/await` throughout. SPM dependencies: `supabase-swift` (≥2.0), `mapbox-maps-ios` (≥11.0), `swift-package-manager-google-mobile-ads` (≥11.0), `Kingfisher` (≥7.0). Xcode capabilities: Sign in with Apple, Push Notifications (APNs), Associated Domains (`applinks:latenapp.com`, `webcredentials:latenapp.com`), In-App Purchase (StoreKit 2), Background Modes (Remote notifications).

## Authentication

Support three sign-in methods: (1) **Sign in with Apple** using `ASAuthorizationController` — generate a SHA-256 hashed nonce for the Apple request and pass the raw UUID nonce to `supabase.auth.signInWithIdToken(provider: .apple, idToken:, nonce:)`. (2) **Email/Password** via `supabase.auth.signUp` and `supabase.auth.signIn`. (3) **Biometric login** (Face ID/Touch ID) using `LAContext` — store credentials in iOS Keychain after first successful login. On signup, a trigger `handle_new_user()` auto-creates a `profiles` row and assigns the `user` role in `user_roles`. Age verification (18+) is handled via the Didit identity platform — call the `didit-session` Edge Function to create a verification session, then open the URL in a webview. The `didit-webhook` Edge Function receives results and updates `profiles.age_verified`.

## Core Screens

**Onboarding:** Age gate (18+), interests selection from: Techno, House, Hip-Hop, EDM, R&B, Latin, Pop, Rock, Jazz, Drum & Bass, Trance, Afrobeats, Reggaeton, K-Pop, Indie. Location permission request. City selection from 20 Hungarian cities (Budapest, Debrecen, Szeged, Pécs, Győr, Siófok, Miskolc, Eger, Veszprém, Székesfehérvár, Sopron, Nyíregyháza, Kaposvár, Balatonfüred, Tokaj, Kecskemét, Dunaújváros, Esztergom, Hévíz, Zamárdi).

**Home/Explore:** Vertical scrolling feed with sections: Stories bar at top, Live Friends bar showing online friends, XP level card, streak widget, Tonight's Picks (curated events for tonight via `tonights-picks` Edge Function), For You (personalized via `user_preferences` table — scores calculated from weighted interactions: views=1, clicks=2, saves=3, shares=4, RSVPs=5), Featured events (where `is_featured=true`), Trending events, Popular Venues (from `clubs` table), Community Events, and a Professionals CTA. Event types with icons: Club 🎵, House Party 🏠, University 🎓, Festival 🎪, Outdoor 🌙, International 🌍. Category filter pills at top.

**Map View:** Full-screen Mapbox map (dark style, token: `pk.eyJ1IjoiYXJvc3NzIiwiYSI6ImNtaW5heTd0dDE1amgzZXIxZnVnczBmZHgifQ._8a-aON5RVdACW4_jsla7A`). Glowing event markers with purple/pink neon effects. Toggleable heatmap overlay showing event density using GeoJSON from cached event data. City flyTo animations. Event clustering. Filter by event type.

**Event Details:** Parallax hero image, event info (name, type, date/time, location, price, age limit, dress code, expected attendance, current RSVPs), host info with verification badge, RSVP button, save button, share functionality, real-time event chat (via Supabase Realtime on `event_messages` table), Q&A section, co-hosts display, ticket purchasing, and Event Lore clips feed.

**Profile:** Display name, avatar (from `avatars` storage bucket), bio, city, reputation score and level (newcomer→regular→trusted→elite→legend), XP and current level, attendance streak, achievements/badges, event history (Party Timeline), friends/connections count, host application status, settings (logout, delete account via `delete_user_account()` RPC).

## Social & Engagement

**Stories:** Instagram-style — create photo/video stories (stored in `stories` bucket, max 50MB), text editor with fonts, draggable stickers (location, mentions, emoji). Privacy: public, close_friends, followers, private. 24-hour expiry. Auto-progress viewer with tap-to-skip, hold-to-pause, swipe between users. Story highlights for profiles. View tracking via `story_views`. The `can_view_story()` database function handles visibility logic.

**Direct Messages:** End-to-end encrypted using `user_encryption_keys`. Messages stored with `encrypted_content_sender` and `encrypted_content_recipient` fields plus nonces. Real-time via Supabase Realtime on `direct_messages`. Typing indicators via `dm_typing_indicators`. Message reactions via `dm_message_reactions`. File attachments supported.

**Friends/Connections:** Follow system via `user_connections` (follower_id, following_id). Close friends list via `close_friends`. Friend suggestions. Friend activity feed via `friend_activity` table (tracks RSVPs, saves). Live presence indicators.

**Gamification:** XP system (`user_xp` table) — earned via interactions, leveling formula: `level = floor(sqrt(totalXP / 50))`. Party Quests with objectives and XP rewards (`party_quests`, `quest_objectives`, `user_quest_progress`). Achievements/badges (`achievements`, `user_achievements`). Attendance streaks (`user_streaks`). Weekly leaderboards.

**Reputation:** Social currency system (`user_reputation`). Earned via QR check-ins at events (+10 rep), positive vibe ratings. Lost via ghosting (-25 rep). Levels: newcomer (0-99), regular (100-499), trusted (500-1999), elite (2000-4999), legend (5000+). Higher rep unlocks exclusive events via `event_access_tiers`. All rep modifications happen server-side via `SECURITY DEFINER` functions — users have SELECT-only access.

## Professionals Marketplace

Three professional types sharing similar patterns: **DJs** (`dj_profiles`, genres, SoundCloud/Mixcloud links), **Bartenders** (`bartender_profiles`, skills like Cocktails/Mocktails/Flair), **Professionals** (`professionals`, types: photographer/videographer/security/decorator/caterer). Each has: profiles with rating/reviews, booking requests, availability calendar, subscription tiers (gated via iOS IAP). Booking flow: user submits request → professional responds → notification sent via `send-booking-notification` Edge Function. Reviews update ratings via database triggers (`update_dj_rating`, `update_bartender_rating`, `update_professional_rating`).

## Venues/Clubs

All venue data lives in the `clubs` table — pre-imported from Google Places API via the `import-clubs` Edge Function (backend-only, runs every 30-90 days). **CRITICAL: The iOS app must NEVER call Google Places API directly.** Venue photos must be fetched via the `get-club-photo` Edge Function proxy (handles URL expiration). Use Kingfisher for client-side image caching. Club fields: name, address, city, lat/lng, rating, photos, music_genres, venue_type (night_club/bar/lounge/festival_venue/rooftop/beach_club/underground), opening_hours, highlights, crowd_info, services. Venue claiming via `club_claims` table. Analytics tracked in `club_analytics` (views, clicks, shares, directions).

## Monetization

**iOS In-App Purchases** (StoreKit 2) are the sole payment mechanism on Apple devices. Subscription tiers for DJs, Bartenders, Professionals, and Hosts — stored in respective `*_subscriptions` tables. Receipt verification via `verify-ios-receipt` Edge Function. Apple webhook handling via `apple-subscription-webhook` Edge Function. **Event Boosts:** Hosts pay to promote events (`event_boosts` table with impression/click tracking). **AdMob:** Non-personalized ads only (App ID: `ca-app-pub-4192366585858201~8396389324`). Native ad cards interspersed in feeds.

## Safety & Moderation

Report system (`reports` table) — events auto-deactivate after 5 reports via `check_report_count()` trigger. Safety Buddy: manual check-in links shared with friends. Admin tools: host verification queue, user management, event moderation. Rate limiting via `check_rate_limit()` function (configurable per-action limits). All sensitive data (business emails/phones in `club_claims`) stored encrypted.

## Real-time Features

Subscribe to Supabase Realtime channels for: `event_messages` (live event chat), `direct_messages` (DM updates), `dm_typing_indicators` (typing status), `events` (event updates), `event_heat` (live venue popularity). Use `.on(.postgres_changes, ...)` with appropriate filters.

## Push Notifications

Direct APNs integration. Device tokens stored in `push_tokens` table (upserted via Supabase REST). Server-side dispatch via `send-notification` Edge Function using APNs secrets (Key ID, Auth Key, Team ID stored as Supabase secrets). Notification types: new messages, booking updates, event reminders, friend activity. The `notification_preferences` table stores per-user settings.

## Design System

Dark-mode-first neon aesthetic. Primary: electric purple (#8B5CF6). Accent: neon pink (#EC4899). Background: near-black (#0A0A0F). Cards: dark grey with subtle borders. All animations use SwiftUI spring (stiffness: 380, damping: 35). Minimum 44pt touch targets. Respect safe areas. Fonts: SF Pro Display (headers), SF Pro Text (body). Glowing effects on interactive elements. Gradient overlays on images. The app should feel premium, fast, and addictive — like a social status platform, not a utility.

## Search

Algolia powers global search (synced via `algolia-sync` and `algolia-sync-single` Edge Functions, triggered by database changes). The `algolia-search` Edge Function handles queries. Indices: events and clubs. Search is accessible via a prominent search bar on the Explore screen.

## Key Database Functions

`handle_new_user()` — auto-creates profile + user role on signup. `delete_user_account()` — comprehensive 10-phase cascading delete. `add_reputation()` / `calculate_rep_level()` — reputation management. `add_user_xp()` — XP with auto-leveling. `update_event_heat()` — real-time venue popularity. `record_rsvp_activity()` — tracks activity + updates streaks. `scan_ticket()` — QR ticket validation. `can_view_story()` — story visibility logic. `check_rate_limit()` — abuse prevention.

For the complete database schema with all columns, types, and relationships, refer to `docs/LATEN_COMPLETE_REFERENCE.md`.
