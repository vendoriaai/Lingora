# 04 — Brand Guidelines

**Lingora** — *lingua* (language) + *ora* (to speak). Tagline: **"Speak the world into fluency."**

---

## 1. Naming notes

- **Lingora** (lin·GOR·a). Distinct from Duolingo / Babbel / Lingoda / Lingualia / FluentU.
- Wordmark: `Lingora`. Never "LingoRa" or split. Use the registered symbol/generic ™ per legal guidance.
- Preferred short/mark: the **Lingora pulse** (see §3).

## 2. Brand essence & promise

- **Essence:** Patient, present, real-time. Learning by *talking back*.
- **Promise:** Anyone, anywhere, at any level can get fluent spoken practice — gentle, measurable, never intimidating.
- **Position:** voice-first in a category of vocabulary-flashcard apps.

## 3. Logo system

- **Primary mark — the Lingora pulse.** A single speech-bubble silhouette whose tail forms a heartbeat/equalizer pulse of 3 ascending dots, signifying *speaking that comes alive*. Drawn in the indigo→coral gradient.
- **Construction:** square safe area (mark ≈ 70% of the tile). 2px outer padding minimum. Rounded tile radius equal to the mark's outer circle.
- **Wordmark:** "Lingora" set in **Plus Jakarta Sans ExtraBold** with the "o"s (positions 5 and 6 letters? — keep it simple: the **second "o"** only) replaced by a pulse glyph matching the mark. Use the wordmark at ≥ 96px to keep the pulse legible.
- **Clear space:** at least the height of the pulse glyph around all sides.
- **Variants:**
  - Full color (indigo wordmark + coral pulse) on light.
  - Inverted (light wordmark on indigo) for dark surfaces and primary buttons.
  - Monochrome (single currentColor) for utility/lockups.
- **Don'ts:** no drop shadows, no stretched/skewed lockup, no recoloring the pulse independently of the wordmark gradient, no mark smaller than 16px (16–23px use the pulse-only glyph, not the full lockup).

## 4. Color

| Token | Light | Dark | Use |
|---|---|---|---|
| **Primary (Indigo)** | `#4F46E5` | `#6366F1` | brand fills, primary buttons, focus rings, active nav |
| Primary deep | `#4338CA` | `#3730A3` | hover/pressed |
| Primary surface | `#EEF2FF` | `#1E1B4B` | tinted backgrounds, selected rows |
| **Accent (Coral)** | `#FF6B5B` | `#FF8A7A` | voice/audio affordances, live-session glow, CTA secondary |
| Accent deep | `#E04B3B` | `#FF6B5B` | hover |
| **AI (Violet)** | `#7C3AED` | `#A78BFA` | AI-originated content (tutor replies, suggestions) |
| Success | `#10B981` | `#34D399` | completed, level-up |
| Warning | `#F59E0B` | `#FBBF24` | streak-at-risk, reminders |
| Danger | `#E11D48` | `#FB7185` | destructive actions, errors |
| Ink | `#0F172A` | `#F1F5F9` | primary text |
| Muted | `#475569` | `#94A3B8` | secondary text |
| Surface | `#FFFFFF` | `#0B1020` | app background |
| Surface-1 | `#F8FAFC` | `#11182B` | cards |
| Surface-2 | `#F1F5F9` | `#1A2236` | inputs, raised |
| Border | `#E2E8F0` | `#243149` | hairlines |

- Contrast: text on primary/accent surfaces ≥ 4.5:1 (Indigo `#4F46E5` with white passes; Coral `#FF6B5B` with white passes for ≥18px/bold).
- Gradient: primary→AI for AI moments (`linear-gradient(135deg, #4F46E5, #7C3AED)`); the *live glow* uses an indigo→coral radial behind the mic button.
- Never use EFL-brand green (duo-green associations) as the primary. Coral/indigo is what makes Lingora not-Duolingo.

## 5. Typography

| Role | Family | Weight | Tracking/size notes |
|---|---|---|---|
| Display / headings / wordmark | **Plus Jakarta Sans** | 600–800 | tight tracking on large sizes; sentence-case titles |
| UI / body / labels | **Inter** | 400–600 | base 14px / 1rem, scale 12/13/14/16/20/24/30/36 |
| Code / logger / console | **JetBrains Mono** | 400–500 | live-session log, transcripts, terminal-like widgets |

- Type scale (1.250 ratio): 12 / 13 / 14 / 16 / 20 / 24 / 30 / 36 / 48.
- Line height: 1.2 for display, 1.5 for body, 1.15 for mono.
- Always set `font-feature-settings: "ss01","cv11"` for Inter alternates (single-story `a`, disambiguated `l/1/I`).
- Minimum body size 14px. Never use under 12px text; use icons instead.

## 6. Voice & tone

- **Warm, plain, encouraging.** We are tutors, not lecturers. We celebrate small wins.
- Short sentences. Active voice. Second person ("You"), singular.
- Correction without judgment: name *one* thing, show the fix, invite a retry.
  - ✗ "Your grammar is incorrect." ✗ "You forgot the verb conjugation."
  - ✓ "Small tweak: 'I have been studying' (present perfect). Try that next?"
- Never condescending to advanced learners; never overwhelming to beginners.
- Error states: calm, specific, restorable. ("The connection dipped. Tap retry — I kept your message.")
- Microcopy ≤ ~6 words for buttons; ≤ ~12 for empty states' first line.

## 7. Iconography & imagery

- Icons: **Lucide**, 1.75 stroke, sized to type (16/20/24). Same corner radius across the set.
- Illustrations: flat, geometric, single- or two-tone (Indigo + Coral). Vocabulary categories get bespoke SVGs (family, food, travel, hello, goodbye…).
- Avatar placeholder: initials on an indigo→violet gradient tile.
- Photographic imagery used only for course covers; warm, human, culturally neutral; no stock-clinical "classroom."

## 8. Motion

- Default transitions **160–220ms**, `cubic-bezier(.2,.8,.2,1)`. Page transitions: 260ms fade + 8–12px slide.
- Respect `prefers-reduced-motion`: disable slide/parallax; keep opacity-only fades ≤ 150ms.
- **Audio pulse — signature motion:** the mic button's three dots rise/fall with input volume via the AudioWorklet volume value (never a fake animated loop). Idle: gentle 2s breathing scale (1.0 → 1.03). Active: live volume mapping.
- Live-session "AI is speaking" = soft coral glow ring expanding/contracting at ~1.2s.

## 9. Application examples (do/don't)

- ✓ Primary button = Indigo background, white text, radius 12, `shadow-sm`.
- ✓ "Start speaking" CTA uses the Coral accent surface to draw the eye to voice.
- ✓ AI tutor reply bubbles tinted with AI-Violet surface (EVEE transparent) on light; near-AI on dark.
- ✗ Do not place Coral text on Indigo (poor contrast). Use Coral for fills/icons/accents, ink for text.
- ✗ No skeuomorphic gradients or shadows beyond the stated elevation tokens.

## 10. Ownable signature moment

The **"speak now" pulse**: tapping the central mic on Live orb grows a coral→indigo radial halo; the equalizer dots animate to the user's voice; on AI turn, the halo shifts to a slow violet glow. This single interaction is the brand heartbeat — it must exist on the Live page, the empty dashboard CTA, and the app icon (idle pulsing dot).
