# 18 — Stitch Prompts (Google Stitch UI generation)

This file contains the prompts to generate Lingora's UI in **Google Stitch** (the AI UI-design tool). Each generated mockup should come out consistent and on-brand.

## How to use

1. **Stitch generates one screen per prompt.** Start a new chat/design with the **Design-system preamble** (section A) so the tool internalises Lingora's look. Stitch remembers context within a session, but if you start fresh, paste the preamble again.
2. Then paste **one per-screen prompt** (section B) — each is self-contained. Generate the screen, iterate ("make the orb bigger", "add an empty-state"), then move to the next.
3. Screens are grouped student-facing → auth/onboarding → admin. The flagship is **B-04 Live Conversation** — do that one first; it carries the most brand identity.
4. After each screen, ask Stitch to also render the **dark-theme variant** ("Now produce the dark theme using the dark tokens from the preamble") and a **mobile (≤420px) variant** for student screens.
5. Keep every generated screen as Figma/HTML export; later wire them in the React build from `06-UI-UX-SPEC.md`.

> Tip: Stitch responds best to (a) concrete layout grids, (b) real microcopy not "lorem ipsum", (c) explicit color tokens, (d) a named component list, (e) named states. The prompts below use all five.

---

## A. Design-system preamble (paste first, every fresh session)

```
Design a product called Lingora — a voice-first AI language-learning app. The vibe is calm, premium-educational, a little playful but never childish; think a patient tutor in a quiet studio, not a flashcard game. Generous whitespace, soft 14px rounded corners, hairline borders, minimal shadows, an indigo + coral + violet palette. Voice/speaking is the heart of the product, so a single mic "orb" with an audio-reactive equalizer pulse is the signature interaction — surface it wherever it makes sense.

DESIGN TOKENS (use these exact values):
- Primary (brand): Indigo  #4F46E5 (light) / #6366F1 (dark); deep #4338CA / #3730A3; surface tint #EEF2FF / #1E1B4B.
- Accent (voice): Coral  #FF6B5B (light) / #FF8A7A (dark); deep #E04B3B / #FF6B5B.
- AI (tutor-generated content): Violet #7C3AED (light) / #A78BFA (dark); AI surface = translucent tint of violet.
- Success #10B981/#34D399, Warning #F59E0B/#FBBF24, Danger #E11D48/#FB7185.
- Ink (primary text) #0F172A (light) / #F1F5F9 (dark).
- Muted (secondary text) #475569 / #94A3B8.
- Surface (app bg) #FFFFFF / #0B1020.  Surface-1 (cards) #F8FAFC / #11182B.  Surface-2 (inputs) #F1F5F9 / #1A2236.
- Border (hairline) #E2E8F0 / #243149.  Primary text on Indigo and on Coral = #FFFFFF (both pass AA).
Typography:
- Display/headings/wordmark: Plus Jakarta Sans, weights 600–800, sentence-case, tight tracking at large sizes.
- UI/body/labels: Inter, weights 400–600. Type scale: 12, 13, 14, 16, 20, 24, 30, 36, 48px. Body base 14px, line-height 1.5.
- Code/logger/console chunks: JetBrains Mono 400–500.
Radius: sm 6, md 10, lg 14, xl 20, pill 999. Buttons default radius-md (10).
Shadows: cards = 0 1px 2px rgba(2,6,23,.06); popovers = 0 4px 16px rgba(2,6,23,.10); modals = 0 12px 40px rgba(2,6,23,.16). Dark theme prefers a 1px border + faint violet glow over heavy shadow.
Layout grid: 12-col at ≥1024px, 1-col below 640px. App max content width 1200px; reading column ~680px. Sidebar expanded 264px / collapsed 72px. Mobile bottom-nav 4 items.
Motion (mention where animated): 160–220ms standard easing cubic-bezier(.2,.8,.2,1); route transitions 260ms fade + 12px slide; reduced-motion flattens to opacity-only ≤150ms. The mic orb idle = a slow 2s breathing scale 1.0→1.03; active = equalizer bars rise/fall with input volume. 'AI speaking' = a soft violet glow ring expanding/contracting at ~1.2s.

COMPONENT STYLE:
- Primary button: Indigo bg, white text, radius 10, subtle shadow, scale .99 on press, 2px Indigo focus ring offset.
- Accent button (voice CTA): Coral bg, white text — used only for speak/voice actions.
- AI-reply bubble: translucent Violet surface, 1px translucent violet border, Inter 14px; user bubble: Surface-2 with Ink text.
- Cards: Surface-1, 1px Border, radius 14, padding 20–24px; interactive cards lift on hover (translateY -2px + shadow).
- Inputs: Surface-2 fill, 1px Border, radius 10, focus ring Indigo; inline helper/error text 13px Muted/Danger.
- Chips/pills: radius 999, Surface-1 fill, Muted text; active chip = Indigo surface + white text.
- Toast: top-right, Surface-1, 1px border, 4px left state-color bar; auto-dismiss 5s (errors persist).

ICONOGRAPHY: Lucide outline icons, 1.75 stroke, sized to type (16/20/24). Equalizer/mic icon for voice. Gradient (Indigo→Coral) only on the brand orb and the wordmark pulse glyph.

VOICE & TONE (for microcopy — write it like this): warm, plain, encouraging. Short sentences, second-person singular. Buttons ≤6 words imperative. Empty states: noun + one human line + a next action. Errors are calm, specific, restorable with a retry CTA. Example microcopy: "Tap to start talking."  "Small tweak: 'I have been studying.' Try that next?"  "The connection dipped — I kept your message. Tap retry."

ACCESSIBILITY (WCAG 2.1 AA): visible 2px focus ring on every interactive control; semantic landmarks (header/nav/main/aside/footer); keyboard-first; never rely on color alone for state; live regions marked for streaming/realtime; reduced-motion respected.

Render both a LIGHT theme (defaults above) and note that every screen has a DARK theme variant using the dark tokens, where cards glow faintly with a violet ring instead of dropping heavy shadows.

Branding assets to imply (don't literally draw, just evoke): a wordmark "Lingora" in Plus Jakarta Sans ExtraBold with a small 3-dot equalizer pulse in place of the second 'o', in Indigo; the brand pulse the orb uses.
```

---

## B. Per-screen prompts

### B-01 — Auth: Sign in / Sign up (`/auth/login`, `/auth/signup`)

```
Screen: authentication — split layout, full viewport.
Left half (60%): brand panel. Deep Indigo→Violet diagonal gradient (#4F46E5 → #7C3AED). Centered: the Lingora wordmark in white Plus Jakarta Sans ExtraBold (~36px) with a small white 3-dot equalizer pulse replacing the second 'o'. Below it, the tagline "Speak the world into fluency." in Inter 20px, 80% white opacity. Below that, a large live audio-reactive equalizer (5–7 vertical bars) in white blending Indigo→Coral tips, subtly animating to imply a voice conversation in progress. Subtle floating translucent orbs (violet/coral) for depth, very faint. No buttons here.
Right half (40%): centered form card on white Surface, max-width 420px, padding 40px, 1px Border.
  - Top: small Lingora pulse icon (Indigo) + "Welcome back" headline in Plus Jakarta 28px.
  - A 2-tab segmented control: "Sign in" | "Create account" (active = Indigo underline 2px).
  - Sign-in (active): inputs for Email and Password (Inter 14px, Surface-2 fill, 1px Border, radius 10, 12px padding, inline helper text). Field labels 13px Muted above. Primary Indigo button full-width: "Continue". Below, a ghost "Continue with Google" button with the Google 'G' logo centered. A muted 13px link row: "Forgot password?"  ·  "Don't have an account? Sign up".
  - Sign-up variant: Name + Email + Password + a 3-pill row of target language ("English" preselected, "Spanish", "French"); primary button "Create account"; Google button below.
  - Inline copy example under the title (Muted 13px): "Your patient tutor is ready. Sign in to keep talking."
States to also render, stacked below the main design as labelled variants:
  - Field-error state: red-amber border + "Enter a valid email." helper text in Danger.
  - Loading state on the button: spinner replacing label, "Connecting…" with faint Indigo shimmer.
  - Error toast top-right: "Couldn't reach Lingora. Check your connection and retry." with a Retry action.
Mobile variant (≤420): full-screen single column; brand panel collapses to a gradient header band (160px) with the wordmark + pulse; form below.
Dark theme: left panel darkens to #1E1B4B→#0B1020; form card becomes #11182B with #243149 borders.
```

### B-02 — Onboarding stepper (post-signup)

```
Screen: 3-step onboarding wizard, full-screen Surface, centered card max-width 560px on desktop; ← back chevron top-left; "Skip for now" 13px Muted top-right.
Top: a 3-dot step indicator with the active step as a filled Indigo pill (1 of 3 — "About you"), the others small Muted dots.
Step 1 — "About you":
  Headline Plus Jakarta 26px: "Let's make your tutor feel like yours."
  Sub Muted 14px: "Three quick picks. You can change them anytime."
  Form: Preferred learning language (select chip row — English/Spanish/French). Username input with a live check chip "Available" (Success) or "Taken" (Danger) to the right. Daily-minutes goal pill group: 5 / 15 (selected, Indigo) / 30 / 60 min.
  Footer: right-aligned primary Indigo "Continue" (disabled until username valid → soft gray).
Step 2 — "What's your goal?" (render as second labelled variant): a single big textarea "I want to…" prefilled placeholder "…order coffee confidently on my next trip." with 3 example chips below to autofill ("Pass a job interview", "Travel with confidence", "Watch movies without subtitles"). Plus a small motivational line: "Even one sentence a day compounds — we'll keep count."
Step 3 — "Ready to place your level?" (third variant): a centered illustration block — the Lingora mic orb (Indigo→Coral radial halo, three Coral equalizer dots, breathing-scale look) about 220px. Headline "Take a 6-minute placement chat." Sub Muted: "We'll figure out your CEFR level so content matches you. Skip anytime."
  Two large buttons side-by-side: Accent Coral "Start placement" (with mic icon) and ghost "I'll do it later — take me to my dashboard".
States: empty input / loading ("Finding best time…" disabled) / inline helper error.
Dark theme: card #11182B; orb halo brighter coral against #0B1020.
Mobile: full-screen, card padding 20px, no fixed width.
```

### B-03 — Dashboard (`/`)  ⭐ lead screen

```
Screen: student Dashboard, 12-col grid, desktop. Left = expanded sidebar 264px; main content area max 1200px.
SIDEBAR (consistent across app; include it): Surface #F8FAFC, 1px right Border. Top = Lingora wordmark (Indigo) + collapse chevron. A prominent Coral "Start speaking" button full-width near the top with a mic icon (this app's voice CTA — make it visually the loudest item). Nav groups with 14px Muted section labels:
  PRACTICE › Live · Chat · Enhanced Chat
  LEARN   › Courses · Vocabulary · Grammar
  ASSESS  › Placement
  ACCOUNT › Profile · Settings
  Active item = Indigo text + 3px Indigo left accent bar + Indigo surface tint row.
  Bottom: small user card — gradient avatar (initials "MK" on Indigo→Violet), "Maya K." + 13px Muted "B1 · Intermediate".
HEADER: sticky, 64px tall, white on light. Left: page title "Today" Plus Jakarta 20px. Right cluster: a pill search "Search lessons, words…" with ⌘K hint, a bell icon with an Indigo unread dot, a sun/moon theme toggle, the user avatar (40px) opening a menu.
MAIN (12-col, 24px gap):
  Row 1 — HERO "Speak now" card, spans cols 1–8, height ~260px:
    Background: radial gradient Indigo→Coral halo in the upper-left corner fading to Surface, 1px Border, radius 16. Left half: a Coral mic orb (~120px) with three vertical equalizer bars rising — the brand pulse (make it the visual center of gravity). Above-right of the orb: a small Pill "READY" in Success. To the right (cols across): headline Plus Jakarta 30px "Tap to start talking." Sub 16px Muted: "A 5-minute chat keeps your streak alive." Two CTAs side-by-side: Accent Coral "Start a live session" (mic icon, 16px tall icon) and ghost Indigo-outline "Pick a topic". Below the CTAs, a single line of three 13px inline stats separated by middots: "12 min spoken this week · 7-day streak · Next: Past tenses".
  Row 1 right (cols 9–12) — PROGRESS strip card:
    Surface-1, radius 14, 1px Border. Top: "Your level" 12px Muted label + a big "B1" Plus Jakarta 36px Indigo + "Intermediate" 13px Muted under it. A horizontal XP bar (Indigo fill on Surface-2 track) with "1,240 / 2,000 XP to B2" 13px right-aligned. Three mini-stats stacked below: "Lessons 18", "Words 312", "Cert: 1".
  Row 2 — "Today's plan" card (cols 1–7): header row with title + Muted "Edit plan". One prominent lesson card inside: thumbnail (warm travel photo) 96px, title "Past Simple in Real Life", subtitle Muted "Lesson 3 · 12 min", a small Indigo progress ring 40% on the right, and an Indigo "Continue" button. A tiny "Recommended live topic: Travel stories" line at the bottom with a ghost "Start" button.
  Row 2 right (cols 8–12) — "Keep practicing" card: a 2-row stack of enrolled courses, each row = 40px square cover + title + "B1 · 60% complete" + small linear progress bar.
  Row 3 — "Recent activity" timeline (cols 1–7): 4 timeline rows, each = a small circular dot (Indigo on live, Violet on chat, Success on lesson), a 14px line "Mastered 8 food words" / "Live session · 14 min" / "Chat about Hobbies" and a 12px Muted timestamp on the right.
  Row 3 right (cols 8–12) — "Leaderboard teaser": "This week · Top 12%" Plus Jakarta 16px, then 3 rows of usernames with their XP and small rank badges; a 13px Muted "Opted in · turn off in Settings".
EMPTY-STATE VARIANT (stack below): when the user has no enrollments — render row 2 as a single centered EmptyState (illustration + "Nothing in progress yet." + Indigo "Browse courses" + Coral "Practice speaking").
OFFLINE VARIANT: a thin top amber banner "Offline — changes will sync when you're back." with a dismiss X. Cards show cached timestamps (Muted 12px "last synced 4m ago").
Accessibility: live region announcing streak updates; orb button has aria-label "Start a live voice session"; keyboard activates the orb with Space.
Mobile (≤420): no sidebar; bottom-nav with 4 icons (Home / Live-center elevated Coral / Learn / Profile). Hero shrinks; stats become horizontal scroll chips.
Dark theme: sidebar/bg #0B1020, cards #11182B with violet-glow borders, Coral orb pops brighter.
```

### B-04 — Live Conversation (`/live`)  ⭐⭐ FLAGSHIP — do this first

```
Screen: Live Voice Conversation — the heart of Lingora. Full-bleed focus mode: NO student sidebar, NO header chrome; a small top bar with only the Lingora pulse mark left and a Settings gear + Disconnect icon right. Dark, ambient background: deep Indigo-to-black radial (Indigo #1E1B4B→#0B1020 center-out) so the orb glows — this screen should feel like walking into a quiet booth.
Center (≈60% viewport height): the orb — a circular Coral→Indigo radial gradient disc ~200px with a soft pulsing outer halo (Coral when user speaks, Violet glow when AI speaks). When idle: three equalizer dots in a column, gently breathing; show the halo in a slow expanding/contract ring ~1.2s. Around the orb, four cardinal ghost icons animate-in on hover: top Settings (gear), right Mode badge, bottom Disconnect, left Transcript toggle. Above the orb: a StatusBadge pill — three variants to render side by side:
  - "Idle" (Muted dot)
  - "Connecting…" (amber spinner)
  - "Connected via relay" (Success dot, Muted text — note this variant explicitly as the fallback mode the user must be able to see)
  - "Listening" (Coral dot pulse).
Below the orb (forms a phone-call bottom Control Tray, floating translucent bar, radius pill, Surface-1 @ 92% opacity, 1px Border):
  Three large circular ghost buttons left-to-right:
    - Mic toggle (Lucide mic-off when muted — show this muted variant too)
    - Big central ACCENT Coral circular button (88px) = "Tap to talk" / "Tap to send" — labeled under it 12px Muted
    - Disconnect (white X on Indigo-only red)
  To the right of the row, a small "Settings" gear chip and a "Transcript" chip.
Transcript timeline (under the orb, within reading column 720px, max-height 40vh scroll): role-tagged bubbles.
  - User speech: Surface-2 bubble, right-aligned, Muted role label "You" 12px, with the live interim transcript shown slightly fainter above the committed one.
  - Assistant speech: translucent Violet bubble (#7C3AED @10%), left-aligned, role label "Tutor" with the violet dot, the partial streaming line in regular weight and the committed line settles to 14px; a tiny "▶ Play" affordance on the right of each assistant bubble (for TTS re-play). Top-right of the most recent AI bubble: a small "Regenerate" ghost icon.
  - A streaming indicator: a thin Indigo→Violet gradient progress bar (1px) above the input box when the AI is replying.
Right collapsible Side Panel (default open on desktop, icon-only toggle on mobile): "Session insights" header + four stat cards: Turns "12 · 4 you", Words spoken "182", Engagement "78" with a small horizontal gauge filled Violet, Minutes "6". Below them: small line chart of input volume over the last 30s (Violet line on translucent Indigo axis). A bottom mini-section "Logger" (collapsed by default) — JetBrains Mono 12px faint lines.
INPUT area (always available — typing works when mic fails): a pill-shaped composer at the bottom inside the focus area: a textarea placeholder "Type if you can't talk…" + a Coral paper-plane send icon at right. Above it a thin info banner (amber) only in the STT-unavailable variant: "Speech recognition isn't available here — type your messages." with a tiny help link on the right.
EMPTY VARIANT (before first connect): centered orb (idle), a single line: "Tap to start talking." plus below it 13px Muted "Recommended: today's topic — 'Travel stories'." A ghost "Suggested prompts" row of 3 chips.
ERROR VARIANT: orb greyscale + a centered inline error card "Couldn't open a live channel. Switched to text mode — your session is saved." with Retry (Indigo) and "Open settings" (ghost).
Accessibility: status badge uses aria-live polite; transcript container aria-live polite; orb reachable with keyboard (Space to talk); reduced-motion: pulse replaced by a slow opacity fade.
Mobile: orb centered, transcript scrolls above, control tray pinned to bottom; side panel hidden behind a chip.
Dark theme: this entire screen IS dark; the coral orb is brightest element.
```

### B-05 — Chat (`/chat`), also covers EnhancedChat

```
Screen: AI text tutor Chat — 3-region layout on desktop (sidebar comes from app-wide template).
Main column (max-width 820px centered): a conversation thread.
  - Empty-state first message area: a friendly centered block — small Violet tutor orb (gradient avatar initials "AI"), "What would you like to practice today?" Plus Jakarta 22px, a row of 4 suggestion chips ("Order food at a restaurant", "Past simple vs Present perfect", "5 travel words", "Correct my paragraph") each Surface-1 pill with Indigo text on hover.
  - Sample conversation bubbles after the user picks one:
    - User bubble: right-aligned, Surface-2, 14px Ink, "I goed to the store yesterday."
    - Tutor bubble: AI-Violet translucent bubble left-aligned, small "Tutor" avatar + label; content "Small tweak: 'go' is irregular — its past is 'went'. Try: 'I went to the store yesterday.' What did you buy?" → render the suggested rewrite in slightly bolder Ink on a 1px Indigo-outlined inline pill. End with the question sentence, so the conversation naturally invites a reply.
    - Per assistant bubble action row (right): 🔁 Regenerate, ▶ Play (TTS), 📋 Copy, 👍/👎 — all 13px ghost icon buttons.
  - Streaming state: a tutor bubble with a 1px Indigo→Violet gradient progress bar above its text, text typed char-by-char with an Indigo caret; cursor at end while streaming.
RIGHT RAIL (240px): a violet-tinted panel with a "Focus" header; 5 pill chips vertical (Conversation selected=Indigo, Grammar, Vocabulary, Writing, Testing). Below: a "Level" pill B1. Below: a "History" drawer-trigger showing last 4 conversation titles with timestamps.
COMPOSER (bottom, sticky, max-width 820px): Surface-1 card, 1px Border, radius 14; a textarea placeholder "Write to your tutor…" + a small focus-area dropdown chip and a Coral paper-plane send button (disabled state when empty). On the left of the input, a tiny mic icon to dictate (with a pulsing-Coral ring when active).
STATES to also render as labelled variants stacked below: (a) streaming, (b) blocked-content canned reply ("Hm, I rewrote that — want another angle?" in muted tone with no copy of the blocked text), (c) failed-with-retry inline error, (d) history drawer open showing dates as section headers, (e) mobile single-column without the right rail (focus chips collapse into a top segmented control).
Accessibility: streaming region aria-live polite; enter-key behavior explained ("Enter to send, Shift+Enter for newline") as a 12px Muted helper under the composer.
Dark theme: cards #11182B AI bubbles brighter violet; rail #1E1B4B.
```

### B-06 — Courses catalog (`/courses`)

```
Screen: Courses catalog. Top hero strip (60px): Plus Jakarta 24px "Courses" + 13px Muted "Find something at your level.".
Left filter rail (240px, sticky): card with sections — Language (chips: English selected, Spanish, French), CEFR level (a 6-pill A1–C2 row, B1 selected Indigo), Category (General, Travel, Business, Academic, Exam), "Show only: My courses" toggle, "Free only" toggle. A "Reset filters" Muted link at bottom.
Main: an "_results_ count" row left ("24 courses") + a sort dropdown right (Popular / Newest / Top rated).
Responsive grid of course cards, 3 cols desktop / 2 / 1.
COURSE CARD design (make it crisp): 2:1 cover image on top (warm cultural humans-in-context photos — example a market, a coffee shop). On the cover's bottom-left: a CEFR pill (Indigo, white text "B1"); top-right: a wishlist heart icon (ghost). Card body padding 16px: title Plus Jakarta 16px (2-line clamp), subtitle 13px Muted "Travel · English", a row of 13px meta with icons — ⏱ 4 weeks · 🗓 2 h/wk · 👥 12 enrolled. Linear progress bar (Indigo) if enrolled "60%". Bottom row: a star rating "4.8 (126)" with a Coral star icon, and either a Primary Indigo "Continue" button (enrolled) or an Indigo-outline "Enroll" — free courses show "Free" in Success tone instead of price.
STATES (labelled, stacked): empty-state filtered ("No courses match — try widening level or language." with Reset CTA); loading skeletons (shimmering gray blocks preserving card shape); wishlist-applied state (heart filled Coral).
Mobile: filter rail collapses into a top "Filters" sheet triggered by a chip; cards 1-col.
Dark theme: covers slightly muted; cards #11182B.
```

### B-07 — Course detail (`/courses/:id`)

```
Screen: Course detail. Top hero (240px): full-width course cover photo with a dark Indigo gradient scrim bottom→up; on top of it, left-bottom: CEFR pill "B1", title Plus Jakarta 28px white "Past Tenses for Real Life", subtitle 13px @80% white "Travel · English · 4 weeks". Right of the title: a Price/Schedule summary card floating (Surface, 1px Border, radius 14, 240px wide) — "Free" Success 20px, ⏱ 4 weeks · 🗓 2 h/wk · 📋 Max 20, an Indigo-filled "Continue course" button ("Enroll" on not-enrolled), a ghost "Add to wishlist".
Body below hero, left 8-col + right 4-col:
  TABS row (sticky): Overview (active, Indigo underline) · Curriculum · Reviews · Q&A.
  OVERVIEW tab: description paragraph; "What you'll learn" — 4 checkmark bullets in Success; "Skills focus" chips (Speaking, Listening, Grammar); instructor block (gradient avatar + name "Priya N." + 13px Muted "Cambridge CELTA · 8 years"); a small "Prerequisites" 13px Muted line ("A2 English or higher").
  CURRICULUM tab (render as separate variant): a vertical tree of 4 Terms, each term = a row with a chevron + name "Term 1: Foundations" + tiny meta "4 lessons · 1h". Expanded, lessons listed:
    - Lesson rows: a 32px rounded square left showing lesson number or a lock icon for locked ones. Title Plus Jakarta 14px. Right side: ⏱ 12 min + a small CEFR chip. Status colors: available (Indigo play icon), in-progress (Violet 60% ring), locked (gray lock + a 12px Muted tooltip explaining the missing prerequisite, e.g. "Complete Lesson 2 to unlock"). The currently-open lesson has an Indigo left-border + Indigo surface tint.
  REVIEWS tab: a summary header "4.8 ★ (126)" + 5 small bar-chart breakdown (5★→1★). Then 3 approved review cards (avatar + name + stars + body + "Helpful (·)" link).
  Right rail (4-col): "Up next" sticky card showing the next lesson with its thumbnail + a continue button; a small "Share course" link; "Get certificate on completion" — a faint certificate glyph + 13px text.
Mobile: tabs under hero as horizontal scroll-pills; right rail stacks below.
Dark theme unchanged tone.
```

### B-08 — Lesson player (`/lessons/:id`)

```
Screen: Lesson player — focused learning layout, header simplified (back chevron + lesson title + a Indigo linear progress "Lesson 3 of 8 · 40%" 320px bar + a close X right).
Left main (8-col): the active material viewer:
  - TAB variant 1 AUDIO/PODCAST: a clean audio player — square cover art (160px), title "Real-Life Past Tense", native-looking waveform with Coral progress fill, play/pause (Indigo), a rate control (1× pill cycling 1.25/1.5/2), skip ±15s, and a multiline capsule transcript below that highlights the current sentence as it plays (Indigo underline current).
  - TAB variant 2 PDF/READING: a PDF page rendered with selectable text; selected word shows a small popover "Hi" → buttons "Save to vocabulary" (Indigo chip), "Translate" (ghost), "Listen" (mic ghost). To the right of the popover a snippet of saved highlights list ("3 saved highlights" with chips of the words).
  - TAB variant 3 QUIZ: question card — "Choose the correct past form:" plus 4 radio options (one chosen Indigo), a "Check answer" Indigo button, and a feedback block below that appears after submit: Success tint with a checkmark "Correct! ✨ 'went' is irregular." or Danger tint with the explanation and "Try again". A small top-right quiz progress "1/5".
  - TAB variant 4 VIDEO: a 16:9 player with native controls and a "Captions: EN" chip toggle in the corner, and a transcript side drawer toggle.
Right rail (4-col): the lesson's material list — vertical sticky nav: each material row = small icon (podcast/video/text/quiz/pdf/image) + title + duration; the active item has an Indigo left bar. Below that, a "Mark complete" Coral button appears enabled only after all materials viewed/quiz passed (show both enabled and disabled variants). Bottom of rail: a "Send to tutor" ghost button → drafts a chat question with lesson context.
ABOVE-MATERIAL states: a thin top progress of materials (5 dots, current highlighted). Empty/failed material: a centered inline "Couldn't load this material. Retry."
Accessibility: keyboard-controllable player controls; transcripts selectable; quiz answers aria-live polite.
Mobile: rail becomes a top horizontal stepper; player full width.
```

### B-09 — Vocabulary (`/vocabulary`)

```
Screen: Vocabulary dashboard with two tabs — List and Review.
Top: a row of summary stat chips horizontal: "Words 312" + "Due today 18 (Coral)" + "Mastered 5★ 84" + "Added this week 24" + a Success pill "+6 this week".
LIST tab:
  - Add word card top-right or top of list: a 1-line composer with placeholder "Add a word + definition…" and an Indigo circular + button. On add (render the open-add-state variant), an inline modal/sheet expands with fields: word, translation, definition, example sentence, difficulty pill row (beginner/intermediate/advanced), a category SVG icon picker (family/food/travel/etc.).
  - List rows (each ~64px): left = a small category SVG icon (warm flat illustration e.g. 🍎 food); center = word title 16px + translation 13px Muted inline ("manzana · apple"), an example sentence 12px italic Muted on the second line, and 5 small mastery stars 0–5 (filled coral); right = "due in 2d" badge + star-action (mark reviewed) and edit ghost icons. Active sort: by due-soonest.
  - A small filter row above the list: search input, language chip, difficulty chip.
REVIEW tab (separate variant): a Spaced-flashcard full-screen flow. Center card (480x320, radius 20, soft shadow): gradient cover with the word "serendipity" big Plus Jakarta 36px below a small category icon; tap to flip — flip reveals definition, example, translation on the other side. Below the card two big pill buttons split 50/50: left ghost "Skip" and right Success "I knew it (→ +1 mastery)". A 3-dot top progress and a 13px Muted "12 of 18 reviewed today".
EMPTY-state: an illustration of empty cards + "No words yet. Add your first word or save them from lessons." with two CTAs "Add a word" and "Browse lessons".
Mobile: full-screen; flashcards keep the 480 width with horizontal padding.
```

### B-10 — Grammar (`/grammar`)

```
Screen: Grammar lessons library.
Header: "Grammar" Plus Jakarta 24px + a small 13px Muted "Solid foundations, one rule at a time." + a level-filter segmented control (A1/A2/B1/B2/C1/C2, B1 active).
Grid 3-col: lesson cards: top a faint SVG "rule" glyph in Indigo, title "Present Perfect", 13px Muted description, a tag chip row (+ 3 small tags like #tense, #past, #speaking), difficulty dots (1–5 Indigo dots filled), ⏱ 12 min, and an Indigo-outline "Start" button.
SELECTED-LESSON view (second variant): the rule explanation — a clean centered reading column 680px: equals Plus Jakarta 24px title, a "Rule" callout box (Indigo surface-tint, 1px Border): "Subject + have/has + past participle." A worked examples block with 3 sentence pairs — wrong (Danger line-through) → right (Success, ink). A "Common mistakes" violet-tinted box. A 3-question mini-quiz inline at the bottom with an Indigo "Submit" — show the graded variant with Success/Danger feedback inline. A Coral "Try this in conversation" CTA at the bottom that routes to live.
Loading/empty states standard.
Mobile: single column; callouts stretch full width.
```

### B-11 — Assessment (start / test / results)  3 screens

```
B-11a START — "Placement assessment".
Centered card 560px max: a small circular 6-dot Indigo ring roster (one task icon per skill — speaking mic, listening headphone, reading book, writing pencil, grammar λ, vocabulary Aa). Headline Plus Jakarta 26px "Place your level in 6 minutes." Sub Muted 14px "Speaking, writing, listening, reading, grammar, vocabulary — six quick tasks. Skip a task with no penalty." A 3-row meta list: ⏱ ~6 min total, 🎙 requires microphone, ⭐ result: CEFR + IELTS equivalent. Bottom: Accent Coral "Begin" (large) + ghost "Take later".
Top-right: a faint card "Next assessment due in 90 days after placement." with info icon.

B-11b TEST — running assessment.
Header: a 6-dot step indicator (current highlighted Indigo, past Success-filled check). Top-left: current skill pill "SPEAKING · Task 3 of 6" + 13px Muted countdown "02:48 remaining".
Main card 720px:
  - Speaking task: prompt Plus Jakarta 18px "Describe what you did last weekend. Try to use the past simple in at least 3 sentences." A big central circular Coral mic orb (smaller version of the Live orb) — active recording state with three equalizer bars + "Recording · 18s" label; under it a 1-line live transcript ("I went to a park and…"). Buttons: ghost "Re-record" + Indigo "Submit". On submit, show a tiny "Analyzing…" with a Violet shimmer.
  - Listening task (render as a second variant): an audio card with play button + waveform; the question "What did the speaker buy?" + 4 multiple-choice options.
  - Writing task: a textarea with a live word count "47 / recommended 80–120 words".
Footer: "Skip task →" Muted link right.
ERROR state: "Lost audio — microphone permission revoked. Re-allow to continue." with Retry (Indigo).

B-11c RESULTS.
Hero: a celebratory — large "B1" Plus Jakarta 64px Indigo + "Intermediate" 13px Muted + 13px Success "Up from A2 (placement estimate)". To the right, a card "IELTS-equivalent ≈ 5.5".
Below — a 6-bar per-skill chart (Speaking/Writing/Listening/Reading/Grammar/Vocab), each bar violet-filled with the CEFR band on top ("B1", "A2" etc.). A 2-col strengths/weaknesses row: left card Success-tint "Strengths — Listening, Vocab" with check chips; right card Violet-tint "Focus areas — Past tenses, Speaking fluency" with practice-route chips.
"Recommended path" card: a 4-week mini-path with the next lessons; an Indigo "Start my path" button. Bottom Muted 13px "Next assessment in 90 days (auto-reminders in Settings)."
Mobile: charts shrink; bars become horizontal.
```

### B-12 — Profile (`/profile`)

```
Screen: Profile — your learning story.
Header cover (160px): gradient Indigo→Violet, with the avatar (gradient round 96px, "MK" initials) overlapping the bottom, name "Maya K." Plus Jakarta 24px, username "@maya.k" 13px Muted, a Success CEFR chip "B1 · Intermediate", and a goal line "Goal: Travel with confidence · 15 min/day". Edit-profile ghost icon top-right.
TABS: Overview · Stats · Certificates · Achievements.
OVERVIEW: 4 stat cards row — "Time studied 28 h", "Lessons 18", "Words 312", "Sessions 41". A 30-day activity heatmap (calendar style; Indigo intensity squares). A small "Proficiency history" mini-chart.
CERTIFICATES tab variant: a card with a stylized certificate (Indigo border, embossed pulse mark, "Certificate of Completion · Past Tenses for Real Life", "verification code LX-7K3-2P" in Mono, "Issued Aug 1, 2026") + ghost "Download PDF" and "Copy share link".
ACHIEVEMENTS: a 5-badge grid — earned badges with Coral/gold/violet ring + name ("7-day streak", "First 50 words"); locked ones grayscale with "Reach 100 words to unlock".
Mobile: tabs as scroll-pills; heatmap horizontal scroll.
```

### B-13 — Settings (`/settings`)

```
Screen: consolidated Settings, left vertical tab nav (160px): Appearance · Language & region · Audio & Voice · Notifications · Account · Advanced.
Right panel content (max 720). Design each tab as a labelled section variant.
APPEARANCE: a 3-card visual theme picker — Light (white tile) / Dark (#0B1020 tile) / System (split half/half) each card showing a tiny preview sidebar + card. Selected has an Indigo ring + check. A "Font size" segmented control (S / M / L). A "Reduce motion" toggle.
LANGUAGE & REGION: Locale select (English/ Español/ Français). App language vs learning language (clearly separated).
AUDIO & VOICE: input device dropdown, output device dropdown, TTS voice picker (sample each with a small play button — Kore, Puck, Zephyr…), playback rate slider 0.75–1.5, "Assistant speed" slider, a "Mic test" row with the orb pulsing live meters as you speak-test.
NOTIFICATIONS: study-reminder toggles (daily/weekly) + a time picker, "Realtime in-app alerts" toggle, per-category toggles (lesson complete, certificate, streak at-risk).
ACCOUNT: email read-only, "Change password" button, sessions list with device + last active + "Sign out" per row, danger zone card with "Delete account" Danger button (with a typed-confirm dialogue mentioned as next step).
ADVANCED: environment status card (Supabase: connected ✓ / Gemini key: configured ✓ / STT provider: browser), "Open logs", "Export data", "Import data". All 13px Muted helper text.
States: a "saving…" inline note when a setting is persisted.
Mobile: tab nav becomes a horizontal scroll at top; each tab a screen.
```

### B-14 — Admin overview (`/admin`)

```
Screen: Admin Overview — a separate layout: no student sidebar; instead an admin top rail: small Lingora pulse mark + role "ADMIN @ " + a left nav (Overview · Users · Courses · Lessons · Questions · Notifications · Analytics · Settings) — make it read clearly NOT-the-student-shell (denser, more dashboard-y, Slate-tinted).
Overview content: a row of 4 KPI stat tiles — "Users 1,284 (+42 ↑)", "Active today 318", "Courses 24", "Avg completion 73%". A 2-col grid:
  - Left big card "Enrollments last 30 days" line chart (Indigo line).
  - Right card "Top courses" list with mini bars.
  - A "Live session volume" violet area chart below.
  - A "Pending moderation" card listing 3 unread course reviews awaiting approval with quick Approve/Reject buttons.
Empty-state: standard.
Dark theme: keep admin slightly cooler — Slate-tinted surfaces (#0E1626), minimal coral.
```

### B-15 — Admin: Course wizard (`/admin/courses/new`)

```
Screen: guided Course creation wizard — multi-step with a left step rail (Steps 1–6: Details · Syllabus · Terms · Lessons · Materials · Review). Current step = Indigo fill with check on completed. Right = the form area.
DETAILS (active variant): two-col form — Title, Description (textarea), Language select, Level/CEFR pill row A1–C2, Category select, Duration weeks, Hours/week, Max students, Price & currency, Start date, Enrollment deadline. An autosave chip top-right "Saved 4s ago" Success-tinted. Bottom right: Indigo "Next: Syllabus".
SYLLABUS variant: a textarea editor with the syllabus outline + bullet helpers. 
LESSONS (the richest variant, render this one prominently): a table/card list of lessons — each row editable inline: name, lesson_type dropdown (general/audio/video/text/quiz/pdf/image), level chip, order_index number, duration_minutes, difficulty, is_published toggle, required_xp. A drag handle (⠿) reorders. Right column: the currently selected lesson's materials uploader — a dropzone with dashed border, accepted file-type chips; below the dropzone, the list of uploaded materials for that lesson with a thumbnail, type icon, order handle, delete. An Indigo "Save & publish lessons" button calls the upsert-lessons-with-materials flow; show a success toast "12 lessons + 38 materials saved".
REVIEW variant: a summary card showing everything with an Indigo "Publish course" — and a warning yellow inline if `is_active=false` yet.
States: validation errors next to fields; autosave chip; loading on save (button → spinner ""); success modal on publish.
Mobile: step rail becomes a top stepper.
```

### B-16 — Admin: Users (`/admin/users`) and Assessment Questions (`/admin/questions`)

```
B-16a USERS: a wide table — columns: avatar+username+email, role badge (student gray, instructor violet, admin amber, super_admin indigo), CEFR, status (active/suspended), enrolled courses, last active. Sortable headers with chevrons. Top bar: search "Find user…" + role filter dropdown + "Add user" Indigo button + bulk-action bar appears when rows selected (with a typed-confirm dialogue note). Row actions menu: "Edit role" (opens a role-assign dialog with role select + permission tags) · "Suspend" · "Delete". Empty state + loading skeleton included.

B-16a ACEFR QUESTIONS: a filter row — skill dropdown (Grammar/Vocab/Reading/Writing/Listening/Speaking) · CEFR multi-chip (A1–C2) · difficulty chip · type chip (MCQ/Short answer/Essay…). Below: a list of question cards: each card — question text, a small "B1 · Grammar · MCQ · easy" meta chip group, the options list with a check on the correct one, and edit/duplicate/delete ghost actions. Right: a "Create question" drawer form with all fields, a live preview card of how the question appears to learners.
```

### B-17 — Admin: Notifications composer + Analytics

```
B-17a NOTIFICATIONS: a centered composer card max 720. Fields: title, content (textarea + variable hint), type (info/success/warning/danger chips), priority (low/normal/high), audience select with three radio cards ("All users", "Specific courses" — reveals a multi-select, "Specific users" — reveals a username picker). action_url optional, "Visible immediately" toggle. Live preview on the right: an exact replica of the in-app toast users will see, using the chosen type color bar. "Send" Coral button (only when audiences/required filled). Below the composer, a "Recent broadcasts" table of past sends with recipient counts and read rate.

B-17b ANALYTICS: a dashboard of 4 chart tiles (enrollments bar, completions line, dropouts area, avg satisfaction column) + a course table with rows sortable by retention, avg time, rating. A date-range pill at top. Make it feel different from the student dashboard — denser, more chartful, Slate-tinted; data-dense not narrative.
```

---

## C. Final polish prompt (run after all screens generated)

```
Across all the Lingora screens I've now designed, do an accessibility + consistency pass: verify every interactive control has a visible 2px Indigo focus ring; that every empty/loading/error state I requested is present; that the mic orb appears identically on Dashboard hero, Live page, Assessment speaking task, and Onboarding step 3; that AI/tutor content is consistently Violet-tinted; that voice/speaking CTAs are consistently Coral while other primary actions are Indigo; that the Lingora wordmark uses the 3-dot pulse replacing the second 'o'. Then produce a final component sheet page — a single screen listing one of every shared component (buttons, inputs, chips, cards, badges, dialog, toast, progress, skeleton, orb) in light + dark — as the canonical reference for engineering.
```

---

## D. Usage notes / Stitch gotchas

- Each prompt intentionally includes a labelled-variants instruction ("also render, stacked below" / "as a labelled variant") — Stitch will output the primary design plus a small panel of variants in one frame, which is far more useful than one frame per state.
- When Stitch invents copy, that's fine — the real strings come from the i18n catalogs (`shared/i18n/{en,es,fr}.ts` in the build). Don't treat generated copy as final.
- Stitch tends to oversize brand gradients; nudge it: "reduce gradient intensity to a subtle radial in the corner only."
- The Live page is intentionally dark-by-default; if Stitch renders it light, paste the italic line *"This entire screen is dark — do not use light surfaces"* and regenerate.
- For the orb: if Stitch replaces it with a generic mic button, paste: *"The orb is not a mic button — it is a circular gradient disc ~200px with an outer pulsing halo; equalizer dots animate with voice volume."*
- Prompts are screen-counted: 17 designs (B-01 through B-17) plus auth variants and the components sheet — budget ~20 Stitch runs for the full set.
