# PROMPT: Replicate Laten — Native iOS Nightlife App

Build **Laten**, a SwiftUI nightlife discovery app for Gen-Z in Hungary. Supabase backend (URL: `https://huigwbyctzjictnaycjj.supabase.co`, Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...q9WSajU3VpAGr4N2woiKO9zHIc8koJyRjkGs8aSHhFg`). Bundle ID: `com.laten.app`, Team: `6BA8ZY4ZPX`, iOS 15+. SPM: supabase-swift, mapbox-maps-ios, GoogleMobileAds, Kingfisher. MVVM with @MainActor ViewModels, async/await, dedicated service classes.

**Auth:** Apple Sign-In (ASAuthorizationController, SHA-256 hashed nonce for Apple, raw nonce for Supabase signInWithIdToken), Email/Password, Biometric login (LAContext + Keychain). On signup, trigger auto-creates profile + user role. Age verification (18+) via Didit Edge Function + webhook updating profiles.age_verified.

**Explore/Home:** Vertical feed — Stories bar, Live Friends bar, XP card, streak widget, Tonight's Picks (Edge Function), For You (personalized from user_preferences weighted: views=1, clicks=2, saves=3, shares=4, RSVPs=5), Featured/Trending events, Popular Venues from clubs table, category pills (Club🎵 HouseParty🏠 University🎓 Festival🎪 Outdoor🌙 International🌍). 20 Hungarian cities.

**Map:** Fullscreen Mapbox (dark style, token: pk.eyJ1IjoiYXJvc3NzIi...jsla7A). Glowing neon markers, heatmap overlay, city flyTo, clustering, type filtering.

**Events:** CRUD via events table. Fields: name, type, start/end_time, location (name/address/lat/lng), price, age_limit, cover_image, host_id. RSVP via event_rsvps. Real-time chat via event_messages + Supabase Realtime. Tickets via event_tickets + ticket_purchases with QR codes. Co-hosts via event_cohosts. Event Lore clips (24h expiry media). Event heat tracking (real-time popularity).

**Profiles:** Display name, avatar (avatars bucket), bio, city, reputation (newcomer→regular→trusted→elite→legend at 0/100/500/2000/5000 rep). XP system (level=floor(sqrt(xp/50))). Streaks, achievements, Party Timeline. Account deletion via delete_user_account() RPC.

**Social:** Stories (photos/videos in stories bucket, 24h expiry, privacy: public/close_friends/followers/private, can_view_story() function). E2E encrypted DMs (ECDH P-256 + AES-256-GCM, encrypted_content_sender/recipient + nonces). Follow system via user_connections. Friend activity feed. Typing indicators. Message reactions.

**Gamification:** user_xp table, party_quests with objectives, achievements/badges, attendance streaks (user_streaks), weekly leaderboards. Rep earned via QR check-ins (+10), lost via ghosting (-25). All rep changes server-side via SECURITY DEFINER functions.

**Professionals:** DJs (dj_profiles, genres, SoundCloud), Bartenders (bartender_profiles, skills), Professionals (photographers/security/etc). Each has booking requests, availability, reviews (auto-update ratings via triggers), subscription tiers gated by iOS IAP.

**Venues:** clubs table (pre-imported from Google Places backend-only). NEVER call Google Places from iOS. Photos via get-club-photo Edge Function proxy + Kingfisher caching. Venue claiming via club_claims. Analytics tracking.

**Monetization:** StoreKit 2 only on iOS. Subscription tiers for professionals/hosts. verify-ios-receipt + apple-subscription-webhook Edge Functions. Event Boosts (paid promotion with impression tracking). AdMob non-personalized ads (ID: ca-app-pub-4192366585858201~8396389324).

**Safety:** Reports table, auto-deactivate at 5 reports. Safety Buddy check-in links. Rate limiting via check_rate_limit(). Encrypted sensitive data in club_claims.

**Push:** APNs direct. Tokens in push_tokens table. send-notification Edge Function. Preferences in notification_preferences.

**Search:** Algolia (synced via triggers calling algolia-sync-single Edge Function). algolia-search Edge Function for queries.

**Design:** Dark-mode neon. Primary: #8B5CF6 (purple). Accent: #EC4899 (pink). BG: #0A0A0F. Spring animations (stiffness:380, damping:35). 44pt min touch targets. SF Pro fonts. Glowing effects on interactive elements.

See `docs/LATEN_COMPLETE_REFERENCE.md` for full schema with all columns and relationships.
