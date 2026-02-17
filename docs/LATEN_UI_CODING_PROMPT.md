# LATEN — Complete UI Coding Prompt

> A comprehensive design & UI implementation guide for building Laten, a native iOS nightlife discovery app for Gen-Z in Hungary. This document covers every screen, component, animation, and design token needed to replicate the full experience.

---

## 1. Design System Foundation

### 1.1 Color Palette (HSL Only)

```
Background:          hsl(240, 20%, 4%)    → #0A0A0F (Near-black)
Surface:             hsl(240, 15%, 8%)    → Cards, modals
Surface Elevated:    hsl(240, 15%, 10%)   → Popovers, sheets
Surface Grouped:     hsl(240, 15%, 12%)   → Grouped list backgrounds

Primary:             hsl(270, 91%, 65%)   → #8B5CF6 (Electric Purple)
Primary Glow:        hsl(270, 91%, 75%)   → Hover/active states
Secondary:           hsl(180, 100%, 50%)  → #00FFFF (Cyan/Turquoise)
Accent Pink:         hsl(330, 100%, 65%)  → #EC4899 (Neon Pink)
Accent Gold:         hsl(45, 100%, 55%)   → Bartender tier accent

Foreground:          hsl(0, 0%, 98%)      → Primary text (near-white)
Muted Foreground:    hsl(240, 5%, 65%)    → Secondary/caption text
Separator:           hsl(240, 5%, 25%)    → 0.5px divider lines

Destructive:         hsl(0, 84%, 60%)     → Error states, destructive actions
Success:             hsl(142, 76%, 45%)   → Confirmations, online indicators
Warning:             hsl(38, 92%, 50%)    → Caution states
```

### 1.2 Gradients

```
Neon Gradient:       linear-gradient(135deg, hsl(270,91%,65%) 0%, hsl(330,100%,65%) 50%, hsl(180,100%,50%) 100%)
Purple Gradient:     linear-gradient(135deg, hsl(270,91%,65%) 0%, hsl(280,100%,55%) 100%)
Surface Gradient:    linear-gradient(180deg, hsl(240,15%,10%) 0%, hsl(240,20%,4%) 100%)
Glass Gradient:      linear-gradient(135deg, hsla(270,91%,65%,0.1) 0%, hsla(180,100%,50%,0.05) 100%)
Gold Gradient:       linear-gradient(135deg, hsl(45,100%,55%) 0%, hsl(30,100%,50%) 100%)
Cyan Gradient:       linear-gradient(135deg, hsl(180,100%,50%) 0%, hsl(200,100%,55%) 100%)
```

### 1.3 Shadows & Glows

```
Glow Purple:         0 0 30px hsla(270, 91%, 65%, 0.5)
Glow Cyan:           0 0 30px hsla(180, 100%, 50%, 0.5)
Glow Pink:           0 0 30px hsla(330, 100%, 65%, 0.5)
Shadow Card:         0 8px 32px hsla(0, 0%, 0%, 0.4)
Shadow Elevated:     0 20px 60px hsla(0, 0%, 0%, 0.5)
Shadow iOS:          0 3px 12px hsla(0, 0%, 0%, 0.15)
Neon Text Shadow:    0 0 20px hsla(270, 91%, 65%, 0.8), 0 0 40px hsla(270, 91%, 65%, 0.4)
```

### 1.4 Typography

```
Font Stack:          -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif
Display Font:        'Outfit', sans-serif (headings, hero text)
Body Font:           'DM Sans', sans-serif (body copy alternative)

iOS Large Title:     34px / bold / -0.02em tracking / tight leading
iOS Title:           17px / semibold
Section Header:      20px / bold / -0.01em tracking
Body:                17px / regular / 1.4 line-height
Caption:             13px / regular / muted-foreground color
Small:               11px / medium / uppercase / 0.05em tracking
Input Text:          16px minimum (prevents iOS Safari auto-zoom)
```

### 1.5 Spacing & Layout

```
Page Padding:        16px horizontal (mx-4)
Card Padding:        16px (p-4)
Section Gap:         24px between sections (space-y-6)
Component Gap:       12px between related items (gap-3)
Border Radius:       16px cards (rounded-2xl), 12px buttons/inputs (rounded-xl), 9999px pills (rounded-full)
Safe Area Top:       env(safe-area-inset-top)
Safe Area Bottom:    env(safe-area-inset-bottom) + 80px (for bottom nav)
```

### 1.6 Touch Targets

```
Minimum:             44px × 44px (all interactive elements)
Small Target:        36px × 36px (dense UI only, e.g., inline icons)
Button Height:       48px standard, 56px prominent
Input Height:        48px standard
```

---

## 2. Core Components

### 2.1 Glass Card

The signature Laten container. Used for event cards, profile sections, settings groups.

```
Background:          linear-gradient(135deg, hsla(240,15%,12%,0.85) 0%, hsla(240,15%,8%,0.95) 100%)
Backdrop Filter:     blur(20px) saturate(180%)
Border:              1px solid hsla(240,15%,18%,0.4)
Border Radius:       16px
Box Shadow:          0 4px 24px hsla(0,0%,0%,0.2), inset 0 1px 0 hsla(255,100%,100%,0.03)
```

Elevated variant adds stronger shadow: `0 8px 32px hsla(0,0%,0%,0.3)`

Interactive variant on hover:
```
Border Color:        hsla(270,91%,65%,0.4)
Transform:           translateY(-2px)
Box Shadow:          0 8px 24px hsla(0,0%,0%,0.15)
Transition:          all 200ms ease-out
```

### 2.2 Buttons

**Primary (Neon):**
```
Background:          Purple Gradient
Box Shadow:          Glow Purple
Border Radius:       12px
Padding:             12px 24px
Font:                semibold
Hover:               translateY(-2px), intensified glow (0 0 40px)
Active:              translateY(0), scale(0.98)
Disabled:            opacity 50%, pointer-events none
```

**Ghost Neon:**
```
Background:          hsla(270,91%,65%,0.1)
Border:              1px solid hsla(270,91%,65%,0.5)
Hover:               border becomes solid primary, bg becomes 0.2 opacity
```

**Social Login Button:**
```
Height:              56px
Background:          hsla(240,15%,8%,0.6) with backdrop-blur
Border:              1px solid hsla(240,15%,18%,0.5)
Border Radius:       12px
Icon + Label:        centered with 12px gap
Active:              scale(0.98)
```

### 2.3 Inputs

```
Height:              48px
Background:          hsl(240,15%,12%) (--input token)
Border:              1px solid hsla(240,15%,18%,0.5)
Border Radius:       12px
Padding:             12px 16px
Font Size:           16px (CRITICAL — prevents iOS auto-zoom)
Placeholder Color:   hsla(240,5%,65%,0.6)
Focus Ring:          0 0 0 3px hsla(270,91%,65%,0.15), 0 0 0 1px primary
Focus Border:        hsla(270,91%,65%,0.6)
Transition:          all 200ms ease-out
```

### 2.4 iOS Grouped List

Used for Settings, Profile details, form sections.

```
Container:           rounded-xl, overflow hidden, bg surface-elevated
Item:                px-4 py-3, flex between
Separator:           0.5px solid hsl(240,5%,25%) — NOT between last item
Active State:        bg muted
Chevron:             16px, muted-foreground color, right-aligned
```

### 2.5 iOS Segmented Control

```
Container:           rounded-lg, p-0.5, bg muted
Segment:             flex-1, py-1.5 px-3, text 13px medium, rounded-md
Active Segment:      bg card, foreground color, shadow-sm
Transition:          all 200ms
```

### 2.6 Bottom Sheet / Drawer

```
Background:          hsl(240,15%,10%)
Handle:              40px × 4px, rounded-full, bg muted-foreground/30, centered, mt-3
Border Radius:       24px top-left/right
Backdrop:            hsla(0,0%,0%,0.6) with backdrop-blur(4px)
Animation:           spring(stiffness: 380, damping: 35) slide up from bottom
Safe Area:           respect bottom inset
```

### 2.7 Badges & Pills

**Category Pill:**
```
Padding:             8px 16px
Border:              1px solid hsla(240,15%,18%,0.5)
Background:          hsla(240,15%,8%,0.5)
Border Radius:       9999px
Font:                13px medium
Selected:            border primary, bg primary/20%, glow 0 0 15px hsla(270,91%,65%,0.3)
```

**Featured Badge:**
```
Background:          Neon Gradient
Padding:             4px 12px
Border Radius:       9999px
Font:                11px bold uppercase
Color:               white
```

**Notification Badge:**
```
Size:                18px circle (min), auto-width for 2+ digits
Background:          hsl(0,84%,60%) (destructive red)
Font:                11px bold white
Position:            absolute, -4px top, -4px right
```

---

## 3. Screen-by-Screen Specifications

### 3.1 Launch / Splash Screen

```
Layout:              Full screen, centered content
Background:          hsl(240,20%,4%)
Glows:               - Radial purple glow (center-top, 400px radius, 30% opacity)
                     - Radial pink glow (bottom-right, 300px radius, 20% opacity)
Logo:                Laten logo centered, 120px width
Animation:           - Logo fades in (0 → 1 opacity, 600ms, ease-out)
                     - Logo pulses subtly (scale 1.0 ↔ 1.02, 2s loop)
                     - Three-dot loading indicator below logo, sequential fade
Duration:            2-3 seconds before transition
Transition:          Fade out to Auth or Home (300ms)
```

### 3.2 Authentication Screen

```
Layout:              Full screen, safe-area-aware, vertically centered content
Background:          hsl(240,20%,4%) with two radial glows:
                     - Purple glow: top-center, 500px, 25% opacity
                     - Cyan glow: bottom-left, 400px, 15% opacity

Header:              
  - Logo: 80px width, centered, mb-8
  - Title: "Welcome to Laten" — 28px bold, foreground
  - Subtitle: "Discover the night" — 15px, muted-foreground

Social Login Stack (gap: 12px):
  - "Continue with Apple" — Apple icon + label, 56px height
  - "Continue with Google" — Google icon + label, 56px height
  - "Continue with Facebook" — Facebook icon + label, 56px height (optional)

Divider:             "or" label centered between two 1px lines, text 12px uppercase muted

Email Form:
  - Email input: 48px, 16px font
  - Password input: 48px, 16px font, show/hide toggle icon
  - "Sign In" primary button: full width, 48px
  - "Forgot password?" link: 14px, primary color, right-aligned

Footer:
  - "Don't have an account? Sign Up" — 14px, muted + primary color link
  - Biometric button (Face ID / Touch ID icon): 44px circle, ghost style
  - Terms/Privacy links: 12px, muted-foreground

Animation:           Staggered fade-in from bottom (each element 50ms delay, 300ms duration)
```

### 3.3 Onboarding Flow (Post-Signup)

**Step 1 — Age Verification:**
```
Title:               "Verify Your Age" — large title style
Subtitle:            "You must be 18+ to use Laten" — muted
Action:              "Verify with Didit" primary button → launches Didit SDK
Skip:                Not allowed — mandatory gate
Status:              Shows verification pending/success/failed states
```

**Step 2 — Interests Selection:**
```
Title:               "What's your vibe?" — large title
Subtitle:            "Pick at least 3 genres" — muted
Grid:                Flex wrap, gap-3
Chips:               Interest pills (see 2.7), multi-select
                     Labels: Techno, House, Hip-Hop, EDM, R&B, Latin, Pop, Rock, Jazz, Drum & Bass, Trance, Afrobeats, Reggaeton, K-Pop, Indie
Selection Feedback:  Spring scale(1.05) on select, border + glow animate in
Continue Button:     Disabled until 3+ selected, sticky bottom with safe area
```

**Step 3 — Location Permission:**
```
Title:               "Find parties near you" — large title
Illustration:        Map icon or city illustration, 200px, centered
Subtitle:            "We use your location to show nearby events" — muted
Buttons:             "Allow Location" primary, "Maybe Later" ghost
City Fallback:       If denied, show city picker dropdown with 20 Hungarian cities
```

**Step 4 — Notification Permission:**
```
Title:               "Never miss a party" — large title
Illustration:        Bell icon with neon glow, centered
Subtitle:            "Get notified about events and friend activity" — muted
Buttons:             "Enable Notifications" primary, "Not Now" ghost
```

**Progress Indicator:**
```
Position:            Top, below safe area
Style:               4 dots or thin progress bar
Active:              Primary color with glow
Inactive:            Muted/20% opacity
```

### 3.4 Home / Explore Screen

```
Layout:              Vertical scrolling feed, safe-top, safe-bottom (for nav)
Pull-to-Refresh:     Native iOS rubber-band, primary color spinner

Navigation Bar:
  - Style: iOS blur material (saturate 180%, blur 20px, 72% opacity bg)
  - Left: "Explore" large title (34px bold), collapses to 17px on scroll
  - Right: Search icon (magnifying glass) + Notification bell with badge
  - Border Bottom: 0.5px separator

Content Sections (in order, each with section header):

1. Stories Bar:
   - Horizontal scroll, no-scrollbar, px-4
   - Items: 68px circle avatar + 12px name below
   - First item: "+" add story button with dashed purple border
   - Unread: 2px purple ring around avatar
   - Viewed: 2px muted ring
   - Spacing: 12px between items

2. Live Friends Bar:
   - Horizontal scroll, px-4
   - Items: 40px avatar with green dot (bottom-right, 10px)
   - Label: "at [Venue Name]" — 11px, muted, truncated
   - Background: glass card style, full width

3. XP & Level Card:
   - Glass card, mx-4
   - Left: Level number in circle with neon gradient border
   - Center: Progress bar (primary color fill, muted bg, 6px height, rounded)
   - Right: XP count + "to next level" caption
   - Tap: Navigate to full gamification profile

4. Streak Widget:
   - Compact glass card, mx-4
   - Flame emoji + streak count + "day streak" label
   - Calendar dots row: last 7 days, filled = attended, empty = missed

5. Tonight's Picks Section:
   - Header: "🔥 Tonight's Picks" + "See All" link
   - Horizontal scroll of event cards (280px wide)
   - Each card: cover image (160px height, rounded-t-xl), gradient overlay bottom
   - Event name (16px semibold), venue (13px muted), time (13px primary)
   - "TONIGHT" badge: small pill, destructive red bg

6. For You Section:
   - Header: "✨ For You" (personalized)
   - Vertical list of event cards (full width, mx-4)
   - Cards: 120px image left, content right, glass card style
   - Shows: name, type pill, time, venue, RSVP count
   - Tap: Navigate to event details

7. Featured Events:
   - Header: "⭐ Featured"
   - Large hero cards, horizontal scroll, 300px wide
   - Gradient overlay with Featured badge
   - Parallax-like image on scroll (subtle)

8. Category Pills:
   - Horizontal scroll row, sticky below nav on scroll
   - Pills: 🎵 Club, 🏠 House Party, 🎓 University, 🎪 Festival, 🌙 Outdoor, 🌍 International
   - Selected: filled primary style
   - Tapping filters the feed below

9. Popular Venues:
   - Header: "📍 Popular Venues"
   - Horizontal scroll, 200px wide cards
   - Venue photo (full card bg), name overlay, rating stars, music genre pills

10. Community Events:
    - Remaining events in vertical list
    - Standard event card layout
    - Infinite scroll with skeleton loaders
```

### 3.5 Event Card Component

```
Variants:

A) Compact (horizontal scroll):
   Width:            280px
   Image:            160px height, rounded-t-xl, object-cover
   Overlay:          linear-gradient(transparent 40%, hsl(240,20%,4%) 100%)
   Content:          p-3
   Name:             16px semibold, 2-line clamp
   Venue:            13px muted, 1-line truncate
   Time:             13px, primary color
   Price:            Badge — "Free" green or "€XX" muted
   RSVP Count:       13px muted, people icon + count
   Tap:              Navigate to EventDetails

B) Full Width (vertical list):
   Layout:           Horizontal, 120px image left + content right
   Image:            120px × 100%, rounded-l-xl
   Content:          p-3, flex-col justify-between
   Type Pill:        Top-right of content area
   Friends Going:    Avatar stack (3 max) + "+N more" text

C) Hero (featured):
   Width:            300px
   Image:            200px height, full bleed
   Overlay:          Neon gradient overlay (10% opacity)
   Featured Badge:   Top-left
   Content:          Bottom, over gradient overlay
   Glow Effect:      Subtle purple glow on hover/focus
```

### 3.6 Event Details Screen

```
Layout:              Full screen, scrollable, no bottom nav

Hero Section:
  - Cover image: full width, 300px height (or 40% screen)
  - Parallax: image moves at 0.5× scroll speed
  - Gradient overlay: transparent top → background bottom
  - Back button: 44px circle, glass bg, top-left, safe-area aware
  - Share button: 44px circle, glass bg, top-right
  - Save/Bookmark: 44px circle, glass bg, next to share

Event Info (below hero, px-4):
  - Name: 28px bold, foreground
  - Type pill + Age limit pill (side by side)
  - Host row: Avatar (36px) + host name + verified checkmark + "Follow" button
  - Date/Time: Calendar icon + formatted date + clock icon + time range
  - Location: Map pin icon + venue name + address (tappable → opens map)
  - Price: Tag icon + price or "Free" badge
  - RSVP count: People icon + "X going" + friend avatars if applicable

Action Buttons (sticky or prominent):
  - "RSVP" or "Get Tickets": Full-width primary button, 48px
  - If already RSVP'd: "Going ✓" success state, tap to cancel

Description:
  - Expandable text, 4-line clamp with "Read more" link
  - 15px, foreground/90% opacity, 1.6 line-height

Tabs Section (iOS Segmented Control):
  - "Details" | "Chat" | "Q&A" | "Lore"

  Details Tab:
    - Dress code, safety rules, wellness tags
    - Map preview (200px height, rounded-xl, Mapbox static)
    - Co-hosts list

  Chat Tab:
    - Real-time message feed (Supabase Realtime)
    - Messages: avatar + name + timestamp + bubble
    - Host messages: highlighted with primary border-left
    - Input: bottom-fixed, 48px, with send button

  Q&A Tab:
    - Questions list with answer count
    - Host answers highlighted
    - "Ask a Question" input at bottom

  Lore Tab:
    - Grid of user-uploaded photos/videos (24h expiry)
    - Tap to view fullscreen with swipe navigation
    - "Add to Lore" floating button
```

### 3.7 Map View Screen

```
Layout:              Full screen Mapbox map, overlays on top

Map Configuration:
  - Style: Dark (mapbox://styles/mapbox/dark-v11 or custom)
  - Token: Configured via environment variable
  - Initial: Fly to user location or selected city
  - Controls: Zoom buttons bottom-right (glass style), compass top-right

Event Markers:
  - Default: 16px circle, neon gradient fill, animated pulse
  - Clustered: Larger circle with count number, scale by count
  - Selected: 24px, intensified glow, bounces up
  - Tap: Shows preview card at bottom

Heatmap Layer:
  - Overlay showing event density
  - Colors: purple (low) → pink (medium) → cyan (high)
  - Opacity: 40-60%
  - Toggle: Button in top toolbar

Top Toolbar (over map):
  - Glass material bg, safe-area top
  - City selector dropdown (left)
  - Category filter pills (horizontal scroll, center)
  - List/Map toggle (right)

Bottom Preview Card (on marker tap):
  - Glass card, mx-4, mb-safe-bottom
  - Compact event info: image + name + time + venue
  - "View Details" button
  - Swipeable if multiple nearby events
  - Drag up to expand to full details

Overlay Gradient:
  - Top: 80px fade from background (for status bar readability)
  - Bottom: 120px fade from background (for nav + preview card)
```

### 3.8 Profile Screen

```
Layout:              Scrollable, safe-area aware

Header Section:
  - Avatar: 100px circle, centered, border 3px neon gradient
  - Name: 24px bold, below avatar
  - Username/handle: 15px muted, below name
  - Bio: 15px, foreground/80%, 3-line max
  - City: Pin icon + city name, 13px muted

Stats Row (horizontal, evenly spaced):
  - Events Attended | Following | Followers | Rep Score
  - Number: 20px bold
  - Label: 11px muted
  - Tap: Navigate to respective list

Reputation Badge:
  - Glass card, full width
  - Level icon + title (Newcomer/Regular/Trusted/Elite/Legend)
  - Progress bar to next level
  - Color matches rep tier

Action Buttons:
  - "Edit Profile" ghost button (own profile)
  - "Follow" primary button + "Message" ghost (other profiles)

Tabs (Segmented Control):
  - "Events" | "Achievements" | "Timeline"

  Events Tab:
    - Sub-segments: "Upcoming" | "Past" | "Hosting"
    - Grid or list of event cards
    - Empty state: illustration + "No events yet"

  Achievements Tab:
    - Grid of badges (60px icons)
    - Earned: full color + checkmark
    - Locked: grayscale + lock icon
    - Tap: Sheet with achievement details + progress

  Timeline Tab:
    - Vertical timeline, left-aligned line
    - Nodes: event attendance, achievements earned, level ups
    - Each node: date + event name + XP earned

Settings (gear icon, top-right):
  - iOS grouped list navigation
  - Sections: Account, Preferences, Notifications, Privacy, Support, Legal
  - Destructive: "Delete Account" at bottom, red text
```

### 3.9 Create Event Screen

```
Layout:              Full screen, wizard/stepper flow

Progress:            
  - Top bar: 4-step progress (Basics → Details → Location → Review)
  - Thin line, primary color fill, animated width transition

Step 1 — Basics:
  - Event Name: Text input, max 100 chars
  - Event Type: Horizontal scroll pills (6 types with emoji)
  - Cover Image: Upload zone (dashed border, camera icon, 200px height)
  - Date Picker: iOS-native date picker or custom calendar
  - Time Range: Start + End time pickers

Step 2 — Details:
  - Description: Textarea, 150px min height, max 1000 chars
  - Price: Number input + currency selector + "Free event" toggle
  - Age Limit: Stepper or segmented (18+ / 21+ / All Ages)
  - Expected Attendance: Number input
  - Dress Code: Optional text input
  - Safety Rules: Optional textarea

Step 3 — Location:
  - Venue Name: Text input with autocomplete
  - Address: Text input
  - Map Pin: Interactive Mapbox map (200px) — tap to set location
  - City: Auto-detected or dropdown

Step 4 — Review:
  - Preview card showing how event will appear
  - All details summary in grouped list
  - Edit buttons next to each section → navigate back to step
  - "Create Event" primary button, full width, prominent

Navigation:
  - "Back" and "Next" buttons, bottom-fixed
  - Next disabled until required fields filled
  - Haptic feedback on step completion
```

### 3.10 Direct Messages Screen

```
Inbox View:
  - iOS Large Title: "Messages"
  - Search bar: Below title, glass input style
  - Conversation List:
    - Avatar (48px) + Name + Last message preview + Timestamp
    - Unread: Bold name, blue dot indicator (left), unread count badge
    - Online: Green dot on avatar
    - Typing: "typing..." in italics replacing preview
  - Floating "New Message" button: 56px circle, primary, bottom-right
  - Edit Mode: iOS-style swipe-to-delete or multi-select
  - Empty State: illustration + "No messages yet" + "Start a conversation"

Chat View:
  - Nav Bar: Avatar (32px) + Name + Online status dot
  - Message Bubbles:
    - Sent: Primary gradient bg, white text, right-aligned, rounded-2xl (sharp bottom-right)
    - Received: Surface elevated bg, foreground text, left-aligned, rounded-2xl (sharp bottom-left)
    - Max width: 75% of screen
    - Timestamp: 11px muted, below bubble, shown on tap or time gap
  - Read Receipts: Double checkmark, primary color when read
  - Reactions: Long-press → floating emoji picker (6 quick reactions)
  - Input Bar:
    - Bottom-fixed, safe-area aware
    - Attachment button (left) → camera/photo/file options
    - Text input (expanding, max 4 lines)
    - Send button (right) — primary icon, disabled when empty
  - Typing Indicator: Three animated dots in a received-style bubble
```

### 3.11 DJ / Bartender / Professional Marketplace

```
Layout:              Scrollable feed with filter bar

Filter Bar (sticky below nav):
  - City dropdown
  - Genre/Skill pills (horizontal scroll)
  - Price range (optional)
  - Sort: Rating / Price / Nearest

Professional Card:
  - Glass card, full width, mx-4
  - Photo: 80px circle, left-aligned (or full-width header image)
  - Name: 18px semibold
  - Specialty pills: genre/skill tags, small pills
  - Rating: Stars (filled primary, empty muted) + review count
  - Price range: "€XX – €XX" or "From €XX"
  - Availability indicator: green/red dot + "Available" / "Busy"
  - "Book Now" primary button (small)
  - Tap card: Navigate to full profile

Professional Profile:
  - Hero: Full-width photo or carousel
  - Name + Verified badge
  - Bio text
  - Specialties grid
  - Portfolio: Photo grid (3-column)
  - Reviews: Star average + list of written reviews
  - Availability calendar: Monthly view, colored day cells
  - "Book This DJ/Bartender" sticky bottom button
  - External links: SoundCloud, Instagram icons

Booking Sheet (Bottom Sheet):
  - Event type selector
  - Date picker
  - Location input
  - Budget range (min-max inputs)
  - Message textarea
  - "Send Request" primary button
```

### 3.12 Paywall / Subscription Screen

```
Layout:              Full screen, vertically scrollable

Background:          hsl(240,20%,4%) with layered radial glows:
                     - Purple: top-center, 500px, 20% opacity
                     - Pink: center-right, 400px, 15% opacity
                     - Cyan: bottom-left, 350px, 10% opacity
                     - Floating particle/grain effect (subtle)

Header:
  - "Go Premium" or "Unlock Laten Pro" — 28px bold
  - "Elevate your nightlife game" — 15px muted
  - Centered, mt safe-area + 24px

Subscription Cards (horizontal scroll, snap, 280px wide):

  1. DJ Spotlight:
     Accent:          Electric Purple (hsl(270,91%,65%))
     Icon:            Turntable / music disc
     Border:          1px purple, glows on focus
     Features:        ✓ Marketplace visibility, ✓ Direct bookings, ✓ Client chat, ✓ Verified reviews, ✓ Portfolio links

  2. Bartender Pro:
     Accent:          Amber/Gold (hsl(45,100%,55%))
     Icon:            Cocktail glass
     Border:          1px gold
     Features:        ✓ Private event bookings, ✓ Skills showcase (15 max), ✓ Availability calendar, ✓ Event type filtering

  3. Professional Plus:
     Accent:          Cyan (hsl(180,100%,50%))
     Icon:            Portfolio briefcase
     Border:          1px cyan
     Features:        ✓ Multi-profession listing, ✓ Visual portfolio, ✓ Unified marketplace, ✓ Priority search ranking

  4. Party Boost:
     Accent:          Pink-to-Purple gradient
     Icon:            Rocket
     Border:          1px gradient (neon)
     Features:        ✓ Priority feed ranking, ✓ Featured badges, ✓ Push to nearby users, ✓ Real-time analytics, ✓ Tonight's Picks eligibility

Each Card:
  - Glass card container with accent-colored top border (3px)
  - Icon: 48px, accent-colored, centered top
  - Tier name: 20px bold
  - Feature list: Checkmark (accent) + 14px text, left-aligned
  - CTA Button: Full-width, accent gradient bg, "Subscribe" text, 48px
  - Shimmer animation on idle CTA (subtle light sweep)

Focused/Selected Card:
  - Scale: 1.02
  - Border glow intensifies
  - Shadow deepens

Footer:
  - "Restore Purchases" text link, 14px, primary color
  - Legal: "Subscriptions auto-renew. Cancel anytime." — 12px muted
  - Terms + Privacy links
```

### 3.13 Stories System

```
Stories Bar (Home Screen):
  - See section 3.4, item 1

Story Viewer (Fullscreen):
  - Background: black
  - Image/Video: Full screen, object-cover
  - Progress Bars: Top, below safe-area, horizontal segments
    - Active: white fill, animating (5s per photo, video duration for video)
    - Completed: white solid
    - Upcoming: white/30% opacity
    - Height: 3px, rounded, gap 4px between
  - Header: Avatar (32px) + Username + Timestamp + Close (X) button
  - Gestures:
    - Tap right 50%: Next story
    - Tap left 50%: Previous story
    - Long press: Pause
    - Swipe down: Close
    - Swipe left/right: Next/previous user
  - Reply: Bottom input bar, "Reply to [name]..." placeholder
  - Viewer count: Bottom-left, eye icon + count (own stories only)

Create Story Sheet:
  - Camera/Gallery picker
  - Capture button: 72px circle, white border, neon glow
  - Post-capture tools:
    - Text: Tap to add, draggable, multiple fonts, bg blur option
    - Stickers: Location tag, mentions, emojis (draggable)
    - Draw: Basic drawing tool
  - Privacy: Dropdown — Public, Close Friends, Followers Only, Private
  - "Share Story" primary button

Story Highlights (Profile):
  - Circular icons below bio, horizontal scroll
  - Cover image: 64px circle, thin border
  - Title: 12px below, 1-line truncate
  - Tap: Opens highlight reel in viewer
```

### 3.14 Notifications Screen

```
Layout:              iOS Large Title: "Notifications"

Notification Item:
  - Avatar (40px, left) + Content (center) + Timestamp (right)
  - Content: Bold username + action text + event/context name
  - Types:
    - RSVP: "[Name] is going to [Event]"
    - Follow: "[Name] started following you"
    - Message: "[Name] sent you a message"
    - Event Reminder: "[Event] starts in 1 hour"
    - Achievement: "You earned [Badge Name]! 🎉"
    - Booking: "[Name] wants to book you"
  - Unread: faint primary bg tint (hsla(270,91%,65%,0.05))
  - Tap: Navigate to relevant screen
  - Grouped by: "Today", "This Week", "Earlier"

Empty State:
  - Bell icon (64px, muted)
  - "All caught up!" — 18px semibold
  - "We'll notify you about events and friends" — 14px muted
```

### 3.15 Search / Global Search

```
Trigger:             Magnifying glass icon in nav bar

Layout:              Full-screen overlay or pushed screen
  - Search input: Auto-focused, 48px, glass style, with cancel button
  - Scope pills below input: "All", "Events", "People", "Venues", "DJs"

Results:
  - Grouped by type with section headers
  - Events: Compact card (image + name + date)
  - People: Avatar + name + mutual friends count
  - Venues: Photo + name + rating
  - DJs/Bartenders: Photo + name + genre pills

Recent Searches:
  - Shown when input is empty
  - Clock icon + search term + tap to re-search
  - "Clear All" button top-right

Trending:
  - Shown below recent searches
  - Trending events/venues with fire emoji
```

### 3.16 Admin Dashboard

```
Layout:              Sidebar (desktop) + main content, or tab-based (mobile)

Sidebar:
  - Logo top
  - Nav items: Dashboard, Events, Users, Hosts, DJs, Bartenders, Reports, Translations, Import
  - Each: Icon + label, active = primary bg/10%
  - Bottom: Admin user info + logout

Dashboard:
  - Stats cards grid: Total Users, Active Events, Revenue, Reports
  - Charts: Event creation trend (line), User growth (bar), Revenue (area)
  - Recent activity feed
  - Pending actions (host verifications, reports)

Tables:
  - Full-width, glass card container
  - Header: Sticky, muted bg, 13px uppercase labels
  - Rows: 48px height, hover bg muted, separator between
  - Actions: Icon buttons (edit, delete, view) right-aligned
  - Pagination: Bottom, primary styled buttons
  - Search + filter bar above table
```

---

## 4. Animation Specifications

### 4.1 Spring Animations (Global Default)

```
Config:              stiffness: 380, damping: 35
Use:                 Page transitions, card appearances, sheet presentations
Library:             framer-motion (web) / SwiftUI .spring() (native)
```

### 4.2 Micro-Interactions

```
Button Press:        scale(0.96) → scale(1.0), 100ms
Card Tap:            scale(0.98) → scale(1.0), 150ms
Toggle:              Spring switch, color transition 200ms
Like/Save:           Scale bounce 1.0 → 1.3 → 1.0 with heart fill animation
Pull-to-Refresh:     Native rubber-band, spinner uses primary color
Skeleton Loading:    Shimmer sweep (gradient slide), 1.5s loop, left-to-right
Page Transition:     Slide from right (push), fade + slide down (modal)
Sheet Present:       Slide up from bottom with spring
Tab Switch:          Cross-fade content, 200ms
Confetti:            On achievement unlock — canvas-confetti burst, 2s
```

### 4.3 Scroll Animations

```
Nav Bar Collapse:    Large title (34px) smoothly collapses to inline title (17px) on scroll
Parallax Hero:       Image scrolls at 0.5× speed
Sticky Elements:     Category pills stick below nav on scroll
Fade In On Scroll:   Content sections fade + slide up as they enter viewport (IntersectionObserver)
```

### 4.4 Reduced Motion

```
@media (prefers-reduced-motion: reduce):
  - All spring animations → simple 200ms fade
  - No parallax
  - No confetti
  - No shimmer animation
  - Instant state changes
```

---

## 5. Accessibility Requirements

```
Touch Targets:       44px minimum (all interactive elements, no exceptions)
Color Contrast:      WCAG AA minimum (4.5:1 for text, 3:1 for large text)
Focus Indicators:    Visible focus ring on keyboard navigation (3px primary ring)
Screen Reader:       All images have alt text, all buttons have accessible labels
Dynamic Type:        Support iOS Dynamic Type scaling (body text 14-24px range)
Haptic Feedback:     UIImpactFeedbackGenerator on button presses, tab switches
VoiceOver:           Proper accessibilityLabel, accessibilityHint, accessibilityTraits
Reduce Motion:       Respect prefers-reduced-motion (see 4.4)
```

---

## 6. Responsive & Platform Considerations

### 6.1 Mobile (Primary — 375-430px)

```
- Single column layout
- Bottom tab navigation (5 tabs)
- Full-width cards with mx-4
- Sheets/drawers from bottom
- Native-feeling interactions
```

### 6.2 Tablet (Secondary — 768-1024px)

```
- Two-column layout where appropriate
- Sidebar navigation option
- Wider cards, 2-up grid
- Split view for messages (inbox left, chat right)
```

### 6.3 Bottom Navigation Bar

```
Height:              83px (49px content + 34px safe area bottom)
Background:          Glass material (blur 20px, saturate 180%, 72% opacity bg)
Border Top:          0.5px separator
Items:               5 tabs — Home, Map, Create (+), Messages, Profile
Icons:               24px, muted-foreground inactive, primary active
Active Indicator:    4px dot below icon, primary color with glow
Create Button:       Center tab, larger (28px icon), primary gradient bg circle
Badge:               Red dot on Messages tab for unread count
Animation:           Icon scale bounce on tap, color transition 200ms
```

---

## 7. Empty States & Loading

### 7.1 Skeleton Loaders

```
Card Skeleton:       Rounded rectangles matching card layout
                     Shimmer: gradient sweep left-to-right, 1.5s loop
                     Colors: card bg → muted → card bg
Avatar Skeleton:     Circle, same shimmer
Text Skeleton:       Rounded rectangles, varied widths (100%, 75%, 50%)
```

### 7.2 Empty States

```
Pattern:             Centered illustration (64-120px) + Title (18px semibold) + Subtitle (14px muted) + Optional CTA button
Tone:                Friendly, encouraging, never blame user
Examples:
  - No events: Party popper icon, "No events yet", "Check back later or create your own!"
  - No messages: Chat bubble icon, "No messages", "Start a conversation with someone"
  - No results: Search icon, "No results found", "Try different keywords"
  - No friends: People icon, "Find your crew", "Search for friends to connect"
```

### 7.3 Error States

```
Pattern:             Warning icon (destructive color) + Error message + "Try Again" button
Toast:               Bottom-positioned, glass card, destructive accent, auto-dismiss 4s
Full Page Error:     Centered, with retry button + "Go Home" link
Network Error:       "No connection" banner, top-fixed, yellow/warning bg
```

---

## 8. Dark Mode Notes

Laten is **dark mode only**. There is no light mode variant. All designs assume the dark palette. However, ensure:
- Text remains readable on all surface levels
- Sufficient contrast between interactive and non-interactive elements
- Glows and gradients don't overpower content readability
- Images have subtle darkening overlay when text is placed over them

---

## 9. Internationalization (i18n)

```
Implementation:      All UI strings via useLanguage().t(key) hook
Languages:           Hungarian (primary), English (secondary)
RTL:                 Not required currently
Date Formats:        Locale-aware (date-fns)
Number Formats:      Locale-aware currency display
Fallback:            English if translation key missing
```

---

## 10. Performance Targets

```
First Contentful Paint:    < 1.5s
Largest Contentful Paint:  < 2.5s
Time to Interactive:       < 3.0s
Image Loading:             Lazy load below fold, blur placeholder
List Rendering:            Virtualized for 50+ items
Animation:                 60fps minimum, GPU-accelerated transforms
Bundle Size:               Code-split by route
```
