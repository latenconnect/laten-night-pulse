# PROMPT: Laten — Missing Features Implementation Guide

This document covers all features NOT YET implemented in the Rork AI build. Use this alongside `LATEN_COMPLETE_REFERENCE.md` for full schema details. All features connect to the existing Supabase backend at `https://huigwbyctzjictnaycjj.supabase.co`.

---

## 1. STORIES SYSTEM (Instagram-style)

Add a horizontal scrollable Stories bar at the TOP of the Explore/Home screen, above the search bar.

**How it works:**
- Each story is a photo or video (max 50MB) uploaded to the `stories` Supabase storage bucket
- Stories auto-expire after 24 hours (field: `expires_at`)
- Table: `stories` — fields: `id`, `user_id`, `media_url`, `media_type` (photo/video), `caption`, `visibility` (public/close_friends/followers/private), `expires_at`, `view_count`, `created_at`
- Views tracked in `story_views` table (viewer_id, story_id, viewed_at)
- Privacy: Use the `can_view_story(story_user_id, story_visibility)` database function to check if the current user can see a story

**UI behavior:**
- Stories bar shows circular avatars with a purple/pink gradient ring for unviewed stories, gray ring for viewed
- Tap a story to open fullscreen viewer with: auto-progress timer bar (5s per story), tap right to skip, tap left to go back, long-press to pause, swipe left/right between users
- "+" button on your own avatar to create a story
- Story creation: pick photo/video from library, add text overlay (multiple fonts), add stickers (location tags, mentions, emoji), set privacy level, then post

**Story Highlights:**
- Users can save expired stories to permanent "Highlights" on their profile
- Tables: `story_highlights` (id, user_id, title, cover_image) and `story_highlight_items` (highlight_id, story_id)
- Display as circles below the bio on the Profile page

**Story Replies:**
- Viewers can reply to stories — replies go to DM conversation with that user
- Table: `story_replies` (id, story_id, user_id, message, created_at)

---

## 2. LIVE FRIENDS BAR

Below the Stories bar on the Explore screen, show a horizontal scrollable bar of friends who are currently active or at events.

**How it works:**
- Query `friend_activity` table for recent activity (last 2 hours)
- Show small avatars with a green dot indicating "live" status
- Below each avatar, show what they're doing: "At Szimpla Kert", "Browsing events", "Going to Rooftop Party"
- Tap a friend to view their profile or the event they're attending

**Data source:**
- `friend_activity` table: `user_id`, `activity_type` (rsvp/save/check_in/browse), `event_id`, `club_id`, `created_at`
- `user_connections` table to determine who the current user follows (follower_id = current user)
- Only show activity from people the user follows

---

## 3. XP & STREAK WIDGETS (Gamification)

Add compact widget cards on the Explore home feed (between Stories bar and Featured events).

### XP Level Card:
- Show current XP level, progress bar to next level, and total XP
- Formula: `level = floor(sqrt(total_xp / 50))`
- Table: `user_xp` — fields: `user_id`, `total_xp`, `current_level`, `xp_this_week`, `xp_this_month`
- XP is awarded server-side via `add_user_xp(user_id, amount)` function
- Display: circular level badge + "Level 7 • 350 XP" with progress bar

### Streak Widget:
- Show current attendance streak (consecutive days attending events)
- Table: `user_streaks` — fields: `user_id`, `current_streak`, `longest_streak`, `last_activity_date`, `total_events_attended`, `events_this_month`
- Display: flame icon + "🔥 5 day streak" with milestone badges at 3, 7, 14, 30 days
- Streaks update automatically via the `record_rsvp_activity()` trigger when users RSVP

---

## 4. DIRECT MESSAGES (E2E Encrypted)

Build a full messaging system accessible from the Profile tab or a dedicated messages icon.

**Architecture:**
- Conversations table: `dm_conversations` (id, participant_1, participant_2, created_at, updated_at)
- Messages table: `direct_messages` — each message has TWO encrypted copies: `encrypted_content_sender` + `nonce_sender` (for sender to read their own message) and `encrypted_content_recipient` + `nonce_recipient` (for recipient to decrypt)
- Encryption: ECDH P-256 key exchange + AES-256-GCM symmetric encryption
- Key pairs stored: public key in `user_encryption_keys` table, private key in device Keychain (iOS) or secure local storage

**Features to implement:**
- Inbox list showing all conversations, sorted by `dm_conversations.updated_at` desc
- Unread badge count (messages where `read_at IS NULL` and `sender_id != current_user`)
- Real-time updates via Supabase Realtime subscription on `direct_messages` table
- Typing indicators: `dm_typing_indicators` table (conversation_id, user_id, is_typing, updated_at) — subscribe via Realtime
- Message reactions: `dm_message_reactions` table (message_id, user_id, emoji)
- File/image sharing: upload to `documents` storage bucket, store URL in `file_url` field
- Read receipts: update `read_at` timestamp when message is viewed
- Message types: text, image, file, reply (field: `message_type`)
- Edit/delete: soft delete via `is_deleted` flag, edit updates `edited_at` timestamp

**UI:**
- Apple Messages-style chat bubbles (purple for sent, dark gray for received)
- Long-press message for reaction menu (❤️ 😂 👍 😮 😢 🔥)
- Swipe right on message to reply
- "New Message" sheet to start conversation by searching users

---

## 5. EVENT CHAT (Real-time per event)

On each Event Details page, add a "Chat" tab with real-time messaging for all attendees.

**How it works:**
- Table: `event_messages` (id, event_id, user_id, message, is_host_message, created_at)
- Subscribe to Supabase Realtime channel for `event_messages` filtered by `event_id`
- Host messages get a special badge/highlight (is_host_message validated by `validate_event_message_host_flag()` trigger)
- Any authenticated user who has RSVPed can send messages
- Display sender avatar + display_name from `profiles` table

---

## 6. TICKETS & QR CODES

Add ticket purchasing and QR code check-in to Event Details.

**Tables:**
- `event_tickets`: id, event_id, name, price_cents, currency, quantity_total, quantity_sold, description, sale_starts_at, sale_ends_at
- `ticket_purchases`: id, ticket_id, user_id, qr_code (auto-generated by `generate_ticket_qr()` trigger), purchased_at, scanned_at, scanned_by

**User flow:**
1. Event host creates ticket tiers when creating event (e.g., "Early Bird 2000 HUF", "Regular 3500 HUF")
2. Users tap "Buy Ticket" on Event Details → select tier → purchase (via StoreKit on iOS)
3. After purchase, a QR code is generated and shown in the user's "My Tickets" section on Profile
4. At the event, host scans QR code using `scan_ticket(qr_code, scanner_id)` database function
5. Function validates ticket hasn't been scanned before, marks as scanned, returns success/error

**QR Display:**
- Generate QR code image client-side from the `qr_code` string (format: "LATEN-" + random hex)
- Show ticket details: event name, date, ticket tier, QR code

---

## 7. TONIGHT MODE

Add a "Tonight Mode" toggle/widget on the Explore screen that switches to a real-time "what's happening NOW" view.

**How it works:**
- Calls the `tonights-picks` Edge Function which returns events happening tonight, sorted by heat/popularity
- Shows only events where `start_time` is today and event is active
- Each event card shows real-time "heat" level from `event_heat` table (current_attendees, heat_level 0-100)
- Heat level visualized as a fire intensity indicator (🔥 with glow effect)
- "X friends going" badge by cross-referencing `event_rsvps` with `user_connections`
- Tap to view event details with directions

**UI:**
- Floating pill button "🔥 Tonight Mode" that activates an overlay
- Dark mode with extra neon glow effects
- Events sorted by heat_level descending
- Real-time updates via Supabase Realtime subscription on `event_heat` table

---

## 8. EVENT LORE (Collaborative Event Stories)

On Event Details, add an "Event Lore" section — a collaborative story feed where attendees post short clips/photos during or after the event.

**Table:** `event_lore_clips` — id, event_id, user_id, media_url, media_type (photo/video), caption, view_count, expires_at (24h after event ends), is_active, created_at

**How it works:**
- Any RSVP'd attendee can add a "lore clip" — a photo or short video with optional caption
- Clips display in a vertical feed or horizontal carousel on the event page
- All clips auto-expire 24 hours after the event's `end_time`
- View count incremented when someone watches a clip
- Upload media to `stories` storage bucket (shared with regular stories)

---

## 9. SAFETY BUDDY

Add a Safety section to the Profile/Settings and a floating safety button during Tonight Mode.

**How it works:**
- User designates 1-3 "safety buddies" from their friends
- Creates a shareable check-in link that buddies can use to see the user's last known event/location
- Manual "I'm safe" check-in button that timestamps and notifies buddies
- If no check-in after X hours (configurable), buddies get a push notification

**Implementation:**
- Store buddy selections in local preferences or a `safety_buddies` table
- Check-in creates a record with timestamp
- Push notification via the `send-notification` Edge Function to buddy's `push_tokens`

---

## 10. ICEBREAKER ROOMS

A social matching feature for events — temporary group chats for people attending the same event.

**Tables:**
- `party_match_groups`: id, event_id, group_name, max_members, is_active, expires_at, created_at
- `party_connections`: id, event_id, user_id, partner_id, connection_type (icebreaker/vibe_match), status, expires_at

**How it works:**
- Before an event, users can opt into "Icebreaker" matching
- System groups 3-5 people attending the same event with similar music preferences
- Creates a temporary group chat that expires 24 hours after the event
- Users can "connect" with people they vibed with, creating a permanent follow connection
- Cleanup via `cleanup_expired_connections()` database function

---

## 11. PARTY QUESTS & ACHIEVEMENTS

Gamification system with weekly challenges and permanent badges.

**Tables:**
- `party_quests`: id, title, description, quest_type, objective_type, objective_count, xp_reward, starts_at, ends_at, is_active
- `user_quest_progress`: id, user_id, quest_id, current_progress, completed_at
- `achievements`: id, name, description, icon, category, requirement_type, requirement_value, xp_reward, is_secret
- `user_achievements`: id, user_id, achievement_id, earned_at

**Quest examples:**
- "Weekend Warrior" — Attend 3 events this weekend (+50 XP)
- "Social Butterfly" — RSVP to events in 3 different cities (+100 XP)
- "Lore Master" — Post 5 Event Lore clips (+75 XP)
- "Streak King" — Maintain a 7-day streak (+200 XP)

**Achievement examples:**
- "First Night Out" — Attend your first event (badge: 🌙)
- "Century Club" — Reach 100 reputation (badge: 💯)
- "Legend Status" — Reach 5000 reputation (badge: 👑)

**UI:**
- Quest card on home feed showing active quest + progress bar
- Tap to expand into full quest list (bottom sheet)
- Achievements grid on Profile page with locked/unlocked states
- Confetti animation when completing a quest or earning an achievement

---

## 12. CO-HOSTS SYSTEM

Allow event creators to add co-hosts who can manage the event.

**Table:** `event_cohosts` — id, event_id, host_id, role (cohost/moderator), added_by, added_at

**How it works:**
- During event creation or editing, host can search for other verified hosts by name
- Co-hosts can: edit event details, manage RSVPs, send host messages in event chat, scan tickets
- Co-hosts appear on the event page with a "Co-host" badge
- Host must be verified in `hosts` table (is_verified = true) to be added as co-host

---

## 13. VENUE CLAIMING

Allow business owners to claim their venue on Laten.

**Table:** `club_claims` — id, club_id, user_id, business_name, business_email_encrypted, business_phone_encrypted, verification_documents, status (pending/approved/rejected), admin_notes, reviewed_by, reviewed_at

**Flow:**
1. On Club Details page, show "Claim this venue" button (only if not already claimed)
2. User fills form: business name, email, phone, uploads verification documents
3. Sensitive fields (email, phone) are encrypted before storage
4. Admin reviews in admin panel, approves/rejects
5. On approval, `clubs.owner_id` is set to the claiming user's ID
6. Owner gets access to venue analytics dashboard (views, clicks, directions, shares from `club_analytics` table)

---

## 14. REPUTATION SYSTEM

Social status progression based on real-world event attendance.

**Table:** `user_reputation` — user_id, total_rep, reputation_level, events_attended, events_ghosted, violations_count, updated_at

**Levels:** newcomer (0) → regular (100) → trusted (500) → elite (2000) → legend (5000)

**Earning rep:**
- QR code check-in at event: +10 rep (via `award_checkin_rep()` trigger)
- Positive vibe rating from others: +1 to +5 rep
- Completing quests: variable

**Losing rep:**
- Ghosting (RSVP but no check-in): -25 rep (via `record_ghost()` function)
- Being reported: -10 rep
- Violations: tracked in `reputation_violations` table

**Display:**
- Rep badge next to username everywhere (color-coded by level)
- Rep level gates certain features: elite+ users see mystery event locations early
- Profile shows rep score, level, and rank

---

## 15. WEEKLY RECAP

Auto-generated "Wrapped"-style summary card delivered weekly.

**Edge Function:** `weekly-recap` — runs on schedule, generates recap data

**Content:**
- Events attended this week
- Total time spent at events
- New friends made
- XP earned
- Streak status
- "Top venue" of the week
- Shareable card with stats (like Spotify Wrapped)

**UI:**
- Push notification on Monday: "Your weekly recap is ready!"
- Card appears at top of Explore feed
- Tap to view full recap with animations
- Share button generates an image card for social media

---

## 16. MAP HEATMAP OVERLAY

Add a toggleable heatmap layer to the Map view showing event density and venue popularity.

**How it works:**
- Generate GeoJSON data from `clubs` table (lat/lng) and `events` table (location_lat/location_lng)
- Weight by: number of active events at venue, event heat_level, RSVP count
- Featured venues (`is_featured = true`) get higher weight
- Use Mapbox/MapKit heatmap layer with purple→pink gradient (matching brand colors)
- Toggle button in map controls: "Show Heatmap"

---

## 17. EVENT PRIVACY CONTROLS

For private events (house_party, university), hide exact address until user RSVPs.

**Implementation:**
- Database function `can_view_event_location(event_row)` already exists — returns true for public events, requires RSVP/host status for private events
- On Event Details: show neighborhood/area name instead of exact address for private events
- After RSVP: reveal full address + "Get Directions" button
- Host can toggle "Hide address until RSVP" during event creation
- View with privacy: use `events_with_privacy` database view

---

## 18. ADMOB INTEGRATION

Non-personalized ads only (App Store compliant).

**App ID:** `ca-app-pub-4192366585858201~8396389324`

**Placement:**
- Native ad card in Explore feed (every 5-7 event cards)
- Interstitial ad after viewing 3+ event details in a session
- Banner ad on Map view (bottom, above tab bar)
- NEVER show ads to users with active subscriptions

**Config:**
- Set `npa=1` (non-personalized ads) flag on all ad requests
- No ATT prompt needed since no tracking occurs

---

## 19. STOREKIT 2 / IN-APP PURCHASES

Subscription-gated features for professionals and hosts.

**Product IDs (auto-renewable subscriptions):**
- `com.laten.dj.sub` — DJ marketplace listing (4000 HUF/month)
- `com.laten.bartender.sub` — Bartender marketplace listing
- `com.laten.pro.sub` — Unified professional listing
- `com.laten.party.boost` — Event boost (consumable, one-time)

**Flow:**
1. User taps "Subscribe" on their professional profile dashboard
2. StoreKit 2 purchase sheet appears with Apple payment
3. On successful purchase, send receipt to `verify-ios-receipt` Edge Function
4. Edge Function validates with Apple, creates/updates subscription record in database
5. `apple-subscription-webhook` Edge Function handles renewals/cancellations/expirations
6. Check subscription status: query `dj_subscriptions` / `bartender_subscriptions` / `professional_subscriptions` tables where `status = 'active'` and `expires_at > now()`

**Gating:**
- Professionals without active subscription: hidden from marketplace search results
- Use `has_active_dj_subscription(profile_id)`, `has_active_bartender_subscription(profile_id)`, `has_active_professional_subscription(profile_id)` database functions to check status

---

## DESIGN NOTES FOR ALL FEATURES

- **Color palette:** Primary #8B5CF6 (purple), Accent #EC4899 (pink), Background #0A0A0F, Cards #1A1A2E
- **Animations:** Spring animations (stiffness: 380, damping: 35) for all transitions
- **Touch targets:** Minimum 44pt on all interactive elements
- **Typography:** SF Pro (system font on iOS)
- **Glow effects:** Add subtle purple glow (`shadow` with #8B5CF6 at 30% opacity) on interactive elements
- **Empty states:** Always show a helpful illustration + CTA button when a list is empty
- **Loading:** Use skeleton loaders (pulsing gray shapes) instead of spinners
- **Haptics:** Light haptic feedback on button taps, medium on successful actions, heavy on destructive actions

---

## SUPABASE CONNECTION REFERENCE

```
URL: https://huigwbyctzjictnaycjj.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aWd3YnljdHpqaWN0bmF5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjY0NjYsImV4cCI6MjA4MDQ0MjQ2Nn0.q9WSajU3VpAGr4N2woiKO9zHIc8koJyRjkGs8aSHhFg
```

All tables mentioned above already exist in the database. All Edge Functions are already deployed. All storage buckets are configured. Just connect and build the UI + logic.
