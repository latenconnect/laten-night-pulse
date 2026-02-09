# LATEN — Complete Project Reference
> Master reference document for the Xcode AI. Last updated: 2026-02-09

---

## TABLE OF CONTENTS
1. [Project Overview](#1-project-overview)
2. [Infrastructure & Credentials](#2-infrastructure--credentials)
3. [Database Schema (All Tables)](#3-database-schema-all-tables)
4. [Enums & Custom Types](#4-enums--custom-types)
5. [Database Views](#5-database-views)
6. [Edge Functions](#6-edge-functions)
7. [Storage Buckets](#7-storage-buckets)
8. [Realtime Subscriptions](#8-realtime-subscriptions)
9. [Swift Data Models](#9-swift-data-models)
10. [Services Architecture](#10-services-architecture)
11. [Design System](#11-design-system)
12. [Business Rules & Triggers](#12-business-rules--triggers)
13. [Critical Constraints](#13-critical-constraints)

---

## 1. Project Overview

**Laten** is a nightlife event discovery app for Hungary (expanding to Europe). Users discover clubs, house parties, university events, festivals, and outdoor events. Two user roles: **Regular Users** (browse, RSVP, save) and **Event Hosts** (create/manage events, verify identity).

### Platform Strategy
- **Native iOS (SwiftUI)** — Primary platform, MVVM architecture
- **Web (React/Vite)** — Maintained as fallback at latenapp.com
- The AI Agent provides backend/architectural support only — no direct Swift code generation in Lovable

### App Identity
```
Bundle ID: com.laten.app
Team ID: 6BA8ZY4ZPX
Deployment Target: iOS 15.0+
```

### SPM Dependencies
- `supabase-swift` (≥2.0.0)
- `mapbox-maps-ios` (≥11.0.0)
- `swift-package-manager-google-mobile-ads` (≥11.0.0)
- `Kingfisher` (≥7.0.0)

### Xcode Capabilities
1. Sign in with Apple
2. Push Notifications (APNs)
3. Associated Domains: `applinks:latenapp.com`, `webcredentials:latenapp.com`
4. In-App Purchase (StoreKit 2)
5. Background Modes: Remote notifications

---

## 2. Infrastructure & Credentials

### Supabase
```
Project ID: huigwbyctzjictnaycjj
URL: https://huigwbyctzjictnaycjj.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aWd3YnljdHpqaWN0bmF5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjY0NjYsImV4cCI6MjA4MDQ0MjQ2Nn0.q9WSajU3VpAGr4N2woiKO9zHIc8koJyRjkGs8aSHhFg
```

### Mapbox
```
Access Token: pk.eyJ1IjoiYXJvc3NzIiwiYSI6ImNtaW5heTd0dDE1amgzZXIxZnVnczBmZHgifQ._8a-aON5RVdACW4_jsla7A
Style: .dark
```

### AdMob
```
App ID: ca-app-pub-4192366585858201~8396389324
Interstitial Unit ID: TBD
Banner Unit ID: TBD
```

### Google Places
**CRITICAL RULE:** The iOS app must NEVER call Google Places API directly. All venue data is pre-cached in the `clubs` table via Edge Functions. Photos must be fetched via the `get-club-photo` proxy Edge Function. Do NOT `import GooglePlaces` or store the API key in the iOS bundle.

---

## 3. Database Schema (All Tables)

### Domain: Auth & Identity

#### `profiles`
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | — | PK, matches auth.users.id |
| display_name | text | YES | — | |
| bio | text | YES | — | |
| avatar_url | text | YES | — | |
| age_verified | bool | YES | — | |
| age_verified_at | timestamptz | YES | — | |
| city | text | YES | — | |
| date_of_birth | date | YES | — | |
| didit_session_id | text | YES | — | Age verification |
| is_verified | bool | YES | — | |
| show_city | bool | YES | — | Privacy |
| show_connections | bool | YES | — | Privacy |
| created_at | timestamptz | YES | — | |
| updated_at | timestamptz | YES | — | |

#### `user_roles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| role | app_role enum | 'admin', 'moderator', 'user' |

#### `user_encryption_keys`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| public_key | text | For E2E encrypted DMs |
| key_created_at | timestamptz | |

### Domain: Events

#### `events`
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | PK |
| host_id | uuid | NO | FK → hosts.id |
| name | text | NO | |
| type | event_type enum | NO | club, house_party, festival, university, outdoor, foreigner |
| description | text | YES | |
| location_name | text | NO | |
| location_address | text | YES | |
| location_lat | float8 | YES | |
| location_lng | float8 | YES | |
| city | text | NO | Default 'Budapest' |
| country | text | YES | |
| start_time | timestamptz | NO | |
| end_time | timestamptz | YES | |
| price | numeric | YES | null = free |
| age_limit | int | YES | |
| cover_image | text | YES | |
| photos | text[] | YES | |
| expected_attendance | int | YES | |
| max_attendees | int | YES | |
| actual_rsvp | int | YES | Auto-updated by trigger |
| is_active | bool | YES | Auto-set false when report_count ≥ 5 |
| is_featured | bool | YES | |
| is_sober_friendly | bool | YES | |
| wellness_tags | text[] | YES | |
| safety_rules | text | YES | |
| report_count | int | YES | |
| created_at | timestamptz | YES | |
| updated_at | timestamptz | YES | |

#### `event_rsvps`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| user_id | uuid | |
| status | text | YES |
| created_at | timestamptz | |

#### `saved_events`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| user_id | uuid | |
| created_at | timestamptz | |

#### `event_tickets`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| name | text | |
| description | text | YES |
| price_cents | int | |
| currency | text | Default 'HUF' |
| quantity_total | int | |
| quantity_sold | int | YES |
| sale_starts_at | timestamptz | YES |
| sale_ends_at | timestamptz | YES |

#### `ticket_purchases`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| ticket_id | uuid | FK → event_tickets.id |
| user_id | uuid | |
| price_paid_cents | int | |
| commission_cents | int | |
| status | ticket_status enum | purchased, used, refunded, cancelled |
| stripe_payment_id | text | YES |
| qr_code | text | YES |
| scanned_at | timestamptz | YES |
| scanned_by | text | YES |
| purchased_at | timestamptz | |
| used_at | timestamptz | YES |

#### `event_boosts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| boost_type | text | |
| price_cents | int | |
| currency | text | Default 'HUF' |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| status | boost_status enum | pending, active, expired, cancelled |
| impressions | int | YES |
| clicks | int | YES |
| stripe_payment_id | text | YES |

#### `event_messages` (Event Chat)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| user_id | uuid | |
| message | text | |
| is_host_message | bool | YES |
| created_at | timestamptz | |

#### `event_questions` / `event_answers` (Q&A)
Questions have: id, event_id, user_id, question, created_at  
Answers have: id, question_id (FK), user_id, answer, is_host_answer, created_at

#### `event_cohosts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| host_id | uuid | FK → hosts.id |
| role | text | Default 'cohost' |
| added_by | uuid | |
| added_at | timestamptz | |

#### `event_analytics`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| date | date | |
| views | int | |
| clicks | int | |
| rsvps | int | |
| shares | int | |
| ticket_sales | int | |
| revenue_cents | int | |

#### `event_heat` (Live Vibe Tracking)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK, unique (one-to-one) |
| heat_level | int | |
| current_attendees | int | |
| peak_attendees | int | |
| vibe_tags | text[] | YES |
| updated_at | timestamptz | |

#### `event_check_ins`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| user_id | uuid | |
| check_in_time | timestamptz | |
| check_out_time | timestamptz | YES |
| duration_minutes | int | YES |
| rep_earned | int | Default 0 |
| qr_code_id | text | YES |

#### `event_qr_codes`
id, event_id (FK), code, is_active, scans_count, expires_at, created_at

#### `event_lore_clips` (Post-Event Content)
id, event_id (FK), user_id, media_url, media_type, caption, view_count, is_active, expires_at, created_at

#### `event_access_tiers`
id, event_id (FK), min_rep_score, min_rep_level, early_access_hours, max_capacity, created_at

### Domain: Hosts

#### `hosts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| verification_status | verification_status enum | pending, verified, rejected |
| verification_documents | text[] | YES |
| verified_at | timestamptz | YES |
| events_hosted | int | YES |
| rating | float | YES |
| created_at | timestamptz | |

#### `host_subscriptions`
id, host_id (FK → hosts, one-to-one), tier, status, price_cents, currency, started_at, expires_at, auto_renew, stripe_subscription_id

### Domain: Venues & Clubs

#### `clubs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| google_place_id | text | Unique |
| name | text | |
| address | text | YES |
| city | text | |
| country | text | YES |
| latitude | float8 | |
| longitude | float8 | |
| rating | float | YES |
| price_level | int | YES |
| photos | text[] | YES (EXPIRED Google URLs — use proxy!) |
| google_maps_uri | text | YES |
| business_status | text | YES |
| opening_hours | jsonb | YES |
| venue_type | text | YES |
| description | text | YES |
| services | text[] | YES |
| highlights | text[] | YES |
| music_genres | text[] | YES |
| crowd_info | jsonb | YES |
| is_featured | bool | YES |
| is_active | bool | YES |
| owner_id | uuid | YES |
| created_at | timestamptz | |
| last_updated | timestamptz | |

#### `club_claims`
id, club_id (FK → clubs), user_id, business_name, business_email_encrypted, business_phone_encrypted, verification_documents, status (club_verification_status enum: pending/approved/rejected), admin_notes, reviewed_by, reviewed_at

#### `club_analytics`
id, club_id (FK → clubs), date, views, clicks, shares, directions_clicks

### Domain: Social & Connections

#### `user_connections`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| follower_id | uuid | |
| following_id | uuid | |
| connection_type | text | Default 'follow' |
| status | text | Default 'active' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `close_friends`
id, user_id, friend_id, created_at

#### `friend_activity`
id, user_id, activity_type, event_id (FK), club_id (FK), metadata (jsonb), created_at

#### `friend_locations`
id, user_id, event_id (FK), status, visible_to, updated_at

### Domain: Messaging (E2E Encrypted)

#### `dm_conversations`
id, participant_1, participant_2, created_at, updated_at

#### `direct_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| conversation_id | uuid | FK → dm_conversations.id |
| sender_id | uuid | |
| encrypted_content_sender | text | E2E encrypted |
| encrypted_content_recipient | text | E2E encrypted |
| nonce_sender | text | |
| nonce_recipient | text | |
| message_type | text | 'text', 'image', 'file' |
| file_url | text | YES |
| file_name | text | YES |
| file_size | int | YES |
| file_mime_type | text | YES |
| read_at | timestamptz | YES |
| edited_at | timestamptz | YES |
| is_deleted | bool | Default false |
| created_at | timestamptz | |

#### `dm_message_reactions`
id, message_id (FK → direct_messages), user_id, emoji, created_at

#### `dm_typing_indicators`
id, conversation_id (FK), user_id, is_typing, updated_at

### Domain: Stories & Content

#### `stories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| media_url | text | |
| media_type | text | Default 'image' |
| visibility | text | 'public', 'followers', 'close_friends', 'private' |
| view_count | int | |
| text_overlay | text | YES |
| text_position | text | YES |
| text_color | text | YES |
| text_font | text | YES |
| text_size | text | YES |
| text_background | text | YES |
| text_animation | text | YES |
| expires_at | timestamptz | Default now()+24h |
| created_at | timestamptz | |

#### `story_views`
id, story_id (FK), viewer_id, viewed_at

#### `story_replies`
id, story_id (FK), sender_id, recipient_id, message, conversation_id (FK → dm_conversations), created_at

#### `story_stickers`
id, story_id (FK), sticker_type, content, position_x, position_y, rotation, scale, metadata (jsonb)

#### `story_highlights` / `story_highlight_items`
Highlights: id, user_id, name, cover_image  
Items: id, highlight_id (FK), story_id (FK), media_url, text_overlay, text_position, text_color, text_font

#### `story_hidden_from`
id, user_id, hidden_user_id — users whose stories are hidden from specific people

### Domain: Professionals Marketplace

#### `professionals` (Unified)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| profession_type | profession_type enum | dj, bartender, photographer, security, decorator, caterer, mc |
| display_name | text | |
| bio | text | YES |
| city | text | Default 'Budapest' |
| country | text | YES |
| genres | text[] | YES |
| skills | text[] | YES |
| experience_level | text | YES |
| price_min | numeric | YES |
| price_max | numeric | YES |
| currency | text | YES |
| profile_photo | text | YES |
| instagram_url | text | YES |
| soundcloud_url | text | YES |
| mixcloud_url | text | YES |
| website_url | text | YES |
| preferred_event_types | text[] | YES |
| rating | float | YES |
| review_count | int | YES |
| is_active | bool | YES |
| is_verified | bool | YES |

#### `professional_bookings`
id, professional_id (FK), user_id, event_type, event_date, event_location, event_description, budget_min, budget_max, currency, message, professional_response, status, created_at, updated_at

#### `professional_reviews`
id, professional_id (FK), user_id, booking_id (FK), rating, review, created_at

#### `professional_availability`
id, professional_id (FK), date, is_available, notes

#### `professional_subscriptions`
id, professional_id (FK, one-to-one), tier, status, price_cents, currency, started_at, expires_at, auto_renew, stripe_subscription_id

#### Legacy DJ Tables (still in DB)
- `dj_profiles` — Same structure as professionals but DJ-specific
- `dj_booking_requests`, `dj_reviews`, `dj_availability`, `dj_subscriptions`

#### Legacy Bartender Tables (still in DB)
- `bartender_profiles` — Same structure as professionals but bartender-specific
- `bartender_booking_requests`, `bartender_reviews`, `bartender_availability`, `bartender_subscriptions`

### Domain: Gamification & Reputation

#### `user_xp`
id, user_id, total_xp, current_level, xp_this_week, xp_this_month, week_reset_date, month_reset_date, created_at, updated_at

#### `user_reputation`
id, user_id, total_rep, reputation_level, events_attended, events_ghosted, violations_count, total_vibe_votes, average_vibe_rating, created_at, updated_at

#### `user_streaks`
id, user_id, current_streak, longest_streak, last_activity_date, events_this_month, total_events_attended, month_reset_date, created_at, updated_at

#### `achievements`
id, name, description, icon, category, requirement_type, requirement_value, xp_reward, is_secret

#### `user_achievements`
id, user_id, achievement_id (FK), earned_at

#### `leaderboards`
id, user_id, period_type, period_start, total_xp, rank

#### `party_quests`
id, title, description, quest_type, requirement_type, requirement_value, xp_reward, starts_at, expires_at, is_active

#### `user_quest_progress`
id, user_id, quest_id (FK), progress, completed_at, claimed_at

#### `user_milestones`
id, user_id, milestone_type, milestone_value, achieved_at, notified

#### `reputation_violations`
id, user_id, violation_type, description, rep_penalty, event_id (FK)

### Domain: Safety

#### `safety_buddies`
id, user_id, buddy_id, is_active, created_at

#### `safety_checkins`
id, user_id, event_id (FK), status, expected_home_time, location_note, checked_in_at, created_at

#### `reports`
id, event_id (FK → events), reporter_id, reason, description, severity, status

### Domain: Matching & Groups

#### `party_groups`
id, name, description, cover_image, created_by, event_id (FK), preferred_venue_id (FK → clubs), genres, is_active, created_at, updated_at

#### `party_group_members`
id, group_id (FK), user_id, role, status, invited_by, joined_at

#### `party_match_groups`
id, name, creator_id, energy_level, target_event_id (FK), looking_for_size, is_active, expires_at

#### `party_match_group_members`
id, group_id (FK), user_id, role, joined_at

#### `group_match_requests`
id, requesting_group_id (FK), target_group_id (FK), status, created_at

#### `party_connections`
id, user_id, matched_user_id, event_id (FK), connection_type, connection_date, expires_at, status

#### `party_preferences`
id, user_id, energy_level, music_vibes, city, max_distance_km, age_range_min, age_range_max

### Domain: Analytics & Personalization

#### `user_preferences`
id, user_id, pref_club, pref_house_party, pref_university, pref_festival, pref_public, avg_price_preference, preferred_cities (jsonb)

#### `user_interactions`
id, user_id, interaction_type, event_id (FK), club_id (FK), event_type, city, created_at

#### `party_timeline`
id, user_id, event_id (FK), event_name, event_city, attended_date, duration_hours, highlight_moment, rep_earned, is_public

#### `night_recaps`
id, user_id, recap_date, total_hours, venues_visited, friends_met, top_genre, highlight_clips, montage_url, stats (jsonb), shared_at

#### `flex_cards`
id, user_id, card_type, title, subtitle, stats (jsonb), share_code, is_public

### Domain: Notifications

#### `push_tokens`
id, user_id, token, platform ('ios'/'android'/'web'), is_active, device_id, created_at, updated_at

#### `notification_preferences`
id, user_id, tonights_picks_enabled, tonights_picks_time, weekly_recap_enabled, friend_activity_enabled

#### `scheduled_notifications`
id, user_id, notification_type, event_ids, metadata (jsonb), sent_at

### Domain: Monetization

#### `talent_followers`
id, follower_user_id, dj_profile_id (FK), bartender_profile_id (FK), host_id (FK)

### Other

#### `rate_limits`
id, user_id, action, created_at

#### `icebreaker_rooms` / `icebreaker_members` / `icebreaker_messages`
Event-based chat rooms for meeting people. Rooms have: name, event_id, room_type, max_members, expires_at

---

## 4. Enums & Custom Types

```sql
-- Event types
CREATE TYPE event_type AS ENUM ('club', 'house_party', 'festival', 'university', 'outdoor', 'foreigner');

-- User roles
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- Host verification
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Club claim verification
CREATE TYPE club_verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Boost status
CREATE TYPE boost_status AS ENUM ('pending', 'active', 'expired', 'cancelled');

-- Ticket status
CREATE TYPE ticket_status AS ENUM ('purchased', 'used', 'refunded', 'cancelled');

-- Profession types
CREATE TYPE profession_type AS ENUM ('dj', 'bartender', 'photographer', 'security', 'decorator', 'caterer', 'mc');
```

---

## 5. Database Views

### `public_clubs`
Public read-only view of clubs (filters active clubs, may exclude sensitive fields).

### `public_host_info`
Public read-only view of hosts.

### `events_with_privacy`
Events view that respects privacy settings.

---

## 6. Edge Functions

All edge functions are at: `https://huigwbyctzjictnaycjj.supabase.co/functions/v1/{name}`

| Function | Method | Auth | Purpose |
|----------|--------|------|---------|
| `verify-ios-receipt` | POST | Required | Verify StoreKit receipts, activate subscriptions |
| `apple-subscription-webhook` | POST | — | Apple server-to-server subscription notifications |
| `send-notification` | POST | Admin | Send push notifications via APNs |
| `send-booking-notification` | POST | Required | Notify professionals of new bookings |
| `send-boost-notification` | POST | Required | Notify about event boost status |
| `send-dm-notification` | POST | Required | Notify about new DMs |
| `algolia-search` | POST | Optional | Search events/clubs via Algolia |
| `algolia-sync` | POST | Admin | Bulk sync data to Algolia |
| `algolia-sync-single` | POST | Required | Sync single record to Algolia |
| `tonights-picks` | GET | Optional | AI-curated tonight's event picks. Query: `?city=Budapest` |
| `didit-session` | POST | Required | Create ID verification session |
| `didit-webhook` | POST | — | Didit verification callback |
| `get-club-photo` | GET | Optional | Proxy club photos. Query: `?clubId=X&index=0` |
| `import-clubs` | POST | Admin | Import clubs from Google Places |
| `generate-club-profiles` | POST | Admin | AI-generate club descriptions |
| `cleanup-venues` | POST | Admin | Clean up inactive venues |
| `proxy-image` | GET | Optional | General image proxy |
| `translate-i18n` | POST | Admin | Translate i18n strings |
| `weekly-recap` | POST | — | Generate weekly recap notifications |

### StoreKit Product IDs
- `com.laten.bartender.sub` — Bartender subscription
- `com.laten.dj.sub` — DJ subscription
- `com.laten.party.boost` — Host Party Boost
- `com.laten.pro.sub` — Professional subscription

---

## 7. Storage Buckets

| Bucket | Public | Use Case |
|--------|--------|----------|
| `avatars` | ✅ | User profile photos |
| `photos` | ✅ | Event cover images |
| `stories` | ✅ | Story media (images/videos) |
| `professional-photos` | ✅ | DJ/Bartender/Pro portfolio |
| `documents` | ❌ | Private verification docs |

---

## 8. Realtime Subscriptions

Subscribe to these tables for live updates:

| Table | Channel Pattern | Use Case |
|-------|----------------|----------|
| `event_messages` | `event_messages:{eventId}` | Live event chat |
| `direct_messages` | `dm:{conversationId}` | DM chat |
| `dm_typing_indicators` | `typing:{conversationId}` | Typing indicators |
| `events` | `events-realtime` | Event updates (RSVP counts, status) |
| `event_heat` | `heat:{eventId}` | Live vibe/attendance |

---

## 9. Swift Data Models

(See `docs/NATIVE_IOS_ARCHITECTURE.md` Section 2 for complete Swift structs with CodingKeys)

Core models: `Profile`, `Event`, `EventType`, `Host`, `Club`, `EventRSVP`, `SavedEvent`, `Story`, `DMConversation`, `DirectMessage`, `UserConnection`, `PushToken`

**Key CodingKeys pattern:** All models use `snake_case` CodingKeys mapping to match Supabase column names:
```swift
enum CodingKeys: String, CodingKey {
    case hostId = "host_id"
    case startTime = "start_time"
    // etc.
}
```

---

## 10. Services Architecture

### AuthService
- Sign in with Apple → Supabase `signInWithIdToken` (uses RAW nonce for Supabase, HASHED for Apple)
- Face ID / Touch ID via `LAContext` + Keychain-stored session
- Email/password as fallback
- Auto-creates profile via database trigger on signup

### EventService
- Fetch events by city with `is_active = true` filter
- RSVP/cancel via `event_rsvps` table (trigger auto-updates `actual_rsvp` count)
- Save/unsave via `saved_events` table
- Create events (host role required)

### PushNotificationService
- APNs registration → token stored in `push_tokens` table
- Upsert on `user_id,token` conflict
- Deep link handling via `UNUserNotificationCenterDelegate`

### AdManager (Google AdMob)
- Singleton pattern
- Interstitial preloading
- SwiftUI `BannerAdView` via `UIViewRepresentable`

---

## 11. Design System

### Colors (HSL)
```swift
Primary:           hue: 262°, sat: 83%, light: 58%  // Electric Purple
Secondary:         hue: 330°, sat: 81%, light: 60%  // Neon Pink
Background:        hue: 240°, sat: 20%, light: 4%   // Near-black
Card:              hue: 240°, sat: 14%, light: 8%
Foreground:        hue: 0°,   sat: 0%,  light: 98%  // White
Muted Foreground:  hue: 240°, sat: 5%,  light: 65%
Border:            hue: 240°, sat: 6%,  light: 15%
Accent:            same as Primary
```

### Supported Cities (Launch)
Budapest, Debrecen, Szeged, Pécs, Győr, Siófok, Miskolc, Eger, Veszprém, Székesfehérvár, Sopron, Nyíregyháza, Kaposvár, Balatonfüred, Tokaj, Kecskemét, Dunaújváros, Esztergom, Hévíz, Zamárdi, Vienna, Bratislava, Prague, Zagreb, Ljubljana

---

## 12. Business Rules & Triggers

1. **Auto RSVP count:** Insert/delete on `event_rsvps` → trigger updates `events.actual_rsvp`
2. **Auto deactivate:** When `events.report_count` ≥ 5 → trigger sets `is_active = false`
3. **Profile auto-create:** New auth.users row → trigger creates `profiles` row
4. **Timestamp auto-update:** `updated_at` columns auto-set via `update_updated_at_column()` trigger
5. **RLS enabled on all tables** — policies restrict access based on `auth.uid()`

---

## 13. Critical Constraints

### DO NOT
- Call Google Places API from iOS — use cached `clubs` table
- Store Google Places API key in iOS bundle
- Reference `clubs.photos` directly — URLs expire. Use `get-club-photo` Edge Function proxy
- Create foreign keys to `auth.users` — use `profiles` table instead
- Modify Supabase reserved schemas (auth, storage, realtime, vault)

### ALWAYS
- Filter events by `is_active = true`
- Use Kingfisher for client-side image caching
- Use RAW nonce for Supabase Apple Sign-In, HASHED nonce for Apple
- Respect the 1000-row default Supabase query limit
- Use `snake_case` CodingKeys in all Swift models

### App Architecture
```
MVVM with SwiftUI
├── Models/     — Codable structs matching Supabase schema
├── Services/   — Supabase client wrappers (Auth, Event, Push, Ad)
├── ViewModels/ — @MainActor ObservableObjects
├── Views/      — SwiftUI views organized by feature
└── Config/     — SupabaseConfig, MapboxConfig
```
