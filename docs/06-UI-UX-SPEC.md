# 06 — UI / UX Specification

Detailed information architecture and per-screen spec for Lingora. Pair with `05-DESIGN-SYSTEM.md` (components) and `01-PRD.md` (stories → acceptance). Improvements vs the baseline are flagged **[Δ]**.

---

## 1. Information architecture

```
Student (authed)                          Auth (unauthed)        Admin (staff)
├── /            Dashboard                │ /auth/login          │ /admin
├── /chat        Text tutor               │ /auth/signup         │   Overview
├── /enhanced    Streaming tutor          │ /auth/callback       │   Users
├── /live        Live voice (flagship)    │                      │   Courses
├── /courses     Catalog → course detail  │                      │   Lessons/Authoring
├── /courses/:id Course detail            │                      │   Assessment Queens
│   └ /lessons/:id Lesson player          │                      │   Notifications
├── /vocabulary  Word lists + review      │                      │   Analytics
├── /grammar     Grammar lessons/ex       │                      │   Settings
├── /assessment  Placement & results      │                      │
├── /profile     Stats + certificates     │                      │
└── /settings    Theme/locale/account     │                      │
```

Navigation: collapsible left sidebar (desktop ≥768px), bottom nav bar (mobile), top Header (global). The Live page enters a **focus mode** (no sidebar chrome) — voice is the priority.

## 2. Global chrome

### Shell
- **Sidebar** items, top→bottom: Dashboard, Practice (group: Live / Chat / Enhanced), Learn (group: Courses / Vocabulary / Grammar), Assess, Profile, Settings. Collapsing collapses groups to icons; current section highlighted with brand-primary surface + left accent bar. A persistent **"Start speaking" Coral CTA** lives at the top of the sidebar, jumping straight to `/live` — the heart of the brand.
- **Header**: page title + context actions (right); global spotlight search (`/search` overlay, `Cmd/Ctrl+K`); notifications bell with unread dot; theme toggle; user menu (profile, settings, sign out). [Δ] The baseline relied on icons with no global search; Lingora adds `Cmd/K`.
- **Mobile**: header hamburger + bottom nav (Home, Live, Learn, Profile); Live always on the center, elevated Coral tab.
- **Offline banner**: thin, top of content, appears when sync is pending; collapsible to a dot.

### Motion & transitions
- Route mounts: 260ms fade + 12px y-slide (reduced-motion → fade only).
- Sidebar expand: 280ms width with `ease-standard`.
- Toast/Dialog: Radix defaults, our durations.

## 3. Per-screen spec

Format per screen: **Purpose · Layout · Key components · States · A11y · Acceptance**. [Δ] marks an improved UX vs the baseline.

### 3.1 Onboarding / Auth (`/auth/*`)
- **Purpose:** fast sign-in / sign-up; no friction before the first value moment.
- **Layout:** split — left brand panel (pulse mark + tagline + live waveform animation), right form card centered.
- **Components:** Tabs sign-in | sign-up; email + password; Google button (Supabase OAuth); "Have a code? / forgot password" links.
- **States:** inline validation; rate-limit errors mapped to friendly copy; magic-link support optional.
- **A11y:** form labels; error `aria-describedby`; focus first field.
- **Acceptance:** submitting valid credentials → `auth.users` + `user_profiles` rows; redirect to dashboard with return-path respected. [Δ] Baseline defaulted a hardcoded UUID profile when unauthenticated; Lingora never does — anonymous users go to auth.

### 3.2 Onboarding stepper (post-signup, before dashboard)
- **Purpose:** profile + preference + optional placement.
- **Steps:** (1) Target/native language + username, (2) "What's your goal?" + daily minutes, (3) Placement offer (Take now / Later).
- **A11y:** step indicator with `aria-current`; skip-to-dashboard.
- Acceptance: choices persist to `user_profiles`; taking placement navigates to assessment.

### 3.3 Dashboard (`/`)
- **Purpose:** daily orientation and one-tap action.
- **Sections**:
  - **Hero "Speak now"** — big Coral orb with pulse; cumulative minutes spoken this week, streak (amber flame), next-lesson CTA. [Δ] the baseline led with generic stat tiles; Lingora leads with the voice CTA.
  - **Progress strip** — XP bar → level, CEFR level chip, words mastered, lessons completed.
  - **Today's plan** — next lesson card + recommended live topic.
  - **Continue learning** — enrolled courses with progress rings.
  - **Recent activity** — last study sessions (timeline).
  - **Leaderboard teaser** — top-of-week if opted in.
- **States:** empty (no enrollments → discovery CTA); offline → cached last-known with banner.
- **A11y:** landmarks; live region announces streak changes.
- Acceptance: hydrates from `getDashboard()` ≤ 2s warm; tapping the orb opens `/live`.

### 3.4 Live Conversation (`/live`) — flagship
- **Purpose:** low-friction voice practice; a mood, not a form.
- **Layout (focus mode):** full-bleed; central **orb** (mic/speak button) within a coral→indigo radial halo; transcript timeline below (role-tagged bubbles: user neutral, AI violet-tinted); partial/streaming AI line above the input; bottom **Control Tray**: mic toggle, disconnect, settings, transcript toggle, clear, mode badge; right **Side Panel** (collapsible): session insights, volume meter, logger (dev).
- **Components:** `StatusBadge` (Idle / Connecting / Connected / Connected via relay / Listening); `AudioPulse` (equalizer bound to input volume worklet); `ControlTray`; `SettingsDialog` (voice, response modality, language, focus area); `InsightsCharts` (turns, words, engagement); `SidePanel`/`Logger` (dev).
- **States:**
  - **Idle:** orb breathing; prompt "Tap to start talking".
  - **Connecting:** spinner in orb; ≤3s direct, then auto relay with badge update.
  - **Connected (you speak):** Coral halo + equalizer rising with voice.
  - **AI speaks:** halo softens to violet glow; transcript streams; barge-in button highlighted.
  - **STT missing:** banner "speech not available in this mode — type instead"; input stays usable. [Δ] baseline silently degraded.
  - **Relay mode fallback:** badge "Connected via relay"; behavior identical; audio plays as a whole TTS blob vs direct streaming chunks.
  - **Error:** toast + inline; transcript preserved.
- **Inputs:** mic (STT) and text box (always available); send on Enter; "interrupt" on tap while AI speaks.
- **A11y:** `aria-live` for status + transcript; a "Press Space to talk" keyboard affordance; full transcript visible/scrollable; reduced-motion: pulse replaces breathing with slow opacity fade.
- **Acceptance (PRD L-set):** start ≤3s direct / ≤4s relay; barge-in stops audio; typing always works; session persists (turns + duration) on end.

### 3.5 Chat / EnhancedChat (`/chat`, `/enhanced-chat`)
- **Purpose:** text + TTS tutor with focus areas. (Built as one component with a `streaming` flag.)
- **Layout:** conversation thread (max-width reading column) + composer; right rail with focus-area chips (Conversation/Grammar/Vocabulary/Writing/Testing) and level pill; history drawer.
- **Components:** streaming bubble with cursor; TTS "play" affordance per assistant message; quick suggestion chips for beginner prompts; "copy / regenerate".
- **States:** streaming partial, blocked→canned neutral, failed→retry inline; empty-state with example prompts.
- **A11y:** `aria-live=polite` streaming region; per-message actions labelled.
- Acceptance: first token < 800 ms (warm); focus area changes the system prompt; history persists to `conversation_history`.

### 3.6 Courses catalog (`/courses`)
- **Layout:** filter rail (language, CEFR, category, "my courses") + responsive card grid. Course card: cover, level chip, duration, rating, price (free if 0), enroll/wishlist. [Δ] unified filter state preserved in URL.
- **Acceptance:** filters update query; enroll creates `course_enrollments`; rating shown only with approved reviews.

### 3.7 Course detail (`/courses/:id`)
- **Tabs:** Overview, Curriculum (terms→lessons tree with prerequisite locks), Reviews, Q&A.
- **Actions:** Enroll / Continue / Wishlist / Share.
- **Acceptance:** curriculum tree reflects prerequisites via `evaluateModuleAccess`; locked lessons are non-clickable with a tooltip listing what's missing. [Δ] baseline locked-state was inconsistent.

### 3.8 Lesson player (`/lessons/:id`)
- **Layout:** material viewer (audio/video player, pdf highlighter, text, quiz, image gallery) + right toc/material list. Player controls; "Mark complete" only available after quiz pass / all materials viewed.
- **Features:** PDF word highlight → vocabulary save (page+position metadata); audio with speed control; quiz with feedback.
- **States:** progress saved; resume to last position; offline cached lessons render from local store.
- **A11y:** player keyboard controls; transcripts for audio/video; quiz answers with `aria-live`.
- **Acceptance:** completion records `user_lesson_progress` + xp; unlocks next lessons via progression engine.

### 3.9 Vocabulary (`/vocabulary`)
- **Layout:** list + add modal; review-mode toggle (spaced flashcards). Search/filter by language & difficulty.
- **Components:** word rows with mastery stars, example sentence, "review now"; flashcard flip; category SVG.
- **Acceptance:** due cards surface from spaced formula; marking correct advances mastery +1; review scheduled `(mastery+1)` days.

### 3.10 Grammar (`/grammar`)
- **Layout:** leveled lesson list + lesson page (explanation, examples, exercises). Tagged filters.
- **Acceptance:** exercises score → progress; explanations level-adapted via `unifiedLevelService`.

### 3.11 Assessment (`/assessment`, `/assessment/test`)
- **Layout:** start screen (type select, target language) → multi-task flow (timer per task, audio/written responses) → results page.
- **Results:** CEFR level, IELTS-equivalent, per-skill bar charts, strengths/weaknesses chips, recommended path CTA, next-assessment date.
- **Acceptance:** submitting completes the session; trigger upserts `user_proficiency_profiles` + updates profile placement.

### 3.12 Profile (`/profile`)
- **Sections:** header (avatar, level, username, goal), stats (studied time, words, sessions), certificates, achievements/badges, proficiency history, data export. Edit profile inline.

### 3.13 Settings (`/settings`)
- **Tabs:** Appearance (theme, font scale), Language & region, Audio & voice (input/output device, TTS voice, rate), Notifications (study reminders), Account (email, password, sessions, delete account), Advanced (env status, logs, export). [Δ] the baseline scattered settings; Lingora consolidates.

### 3.14 Admin (`/admin/*`)
- **Shell:** separate layout (no student sidebar); left nav; role-gated routes.
- **Pages:** Overview (KPIs), Users (table, role assign, suspend), Courses (list + wizard), Lessons (authoring within course context), Assessment Questions (CRUD, filtered by skill+CEFR), Notifications (compose + broadcast + template管理), Analytics (enrollments/completions/engagement), Settings (system flags).
- **Course wizard:** Details → Syllabus → Terms → Lessons → Materials (drop to Storage) → Review → Publish. Lesson supports `upsert_lessons_with_materials`. [Δ] guided/stepped instead of one long form.
- **A11y:** table sortable via keyboard; bulk actions with confirm; destructive actions have a typed confirmation.
- **Acceptance:** role `instructor+` required; `admin/super_admin` manage users/notifications; super_admin manages roles.

## 4. Key user flows

### F1 — First live session (T0→speaking < 90s)
1. Onboarding → "Try speaking now" CTA → `/live`.
2. Mic permission prompt → granted.
3. Orb auto-connects (direct or relay within 4s); pulse teaser.
4. Tutor greeting (15–30 words) ends with a question.
5. User speaks; transcript appears; AI responds; barge-in available.
6. End → session card on dashboard updates minutes + streak.

### F2 — Placement → personalized path
1. Onboarding step 3 → "/assessment" → 6-task flow → results.
2. Proficiency profile upsert → dashboard recommends path.
3. First lesson unlocked; CEFR chip reflects band.

### F3 — Course completion → certificate
1. Final lesson passed → progression engine detects course completion.
2. `certificates` lookup + `user_certificates` issued with verification code.
3. Toast + certificate in Profile; share-link copied.

### F4 — Offline lesson
1. Connectivity drops → banner.
2. Cached lesson loads from local store; viewing + drafting chat allowed.
3. Reconnect → progress + new words drained from sync queue → Supabase.

## 5. UX improvements vs the baseline (summary [Δ]s)

- Voice-first dashboard hero instead of stat-tile dashboard.
- A single global `Cmd/K` search and notifications with realtime push.
- Live mode clearly communicates relay fallback; never silently degrades; typing is always available.
- Consolidated Settings; consolidated admin shell with a guided course wizard.
- Lock-state prerequisites are explicit (tooltip says what's missing).
- Streaming errors are inline-restorable rather than silent.
- Empty/offline/loading states are first-class with next actions.
- Accessibility landmarks, focus-visible, live regions, transcripts, reduced motion throughout.
- Mirrored font scale + font family consistency (no random Google-font mixes).

## 6. Copy & microcopy rules (refer to `04-BRAND-GUIDELINES.md` §6)

- Buttons ≤6 words, imperative. Empty titles noun + one human line.
- Errors: calm, specific, restorable, with a retry CTA when transient.
- AI tutors correct one thing, gently, with a proposed rephrase and a next prompt.
