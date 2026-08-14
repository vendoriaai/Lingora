# 05 — Design System

Lingora's design system is token-driven, theme-aware (light/dark), accessibility-first (WCAG 2.1 AA), built on Tailwind + Radix UI primitives. Values come from `04-BRAND-GUIDELINES.md`.

---

## 1. Token architecture

Tokens live as CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark), mapped to Tailwind via `tailwind.config`. Three layers: **primitive** (raw color hex/sizings), **semantic** (role-based, theme-resolved), **component** (specific control values).

### 1.1 Color tokens (semantic, theme-resolved)
```
--bg-surface        / --bg-surface-1 / --bg-surface-2
--text-primary      / --text-muted    / --text-on-primary
--border            / --border-strong
--brand-primary     / --brand-primary-deep / --brand-primary-surface
--brand-accent      / --brand-accent-deep
--ai                / --ai-surface
--state-success / --state-warning / --state-danger
--focus-ring
```
Map to Tailwind:
```js
colors: {
  bg:        { DEFAULT: 'var(--bg-surface)', 1: 'var(--bg-surface-1)', 2: 'var(--bg-surface-2)' },
  text:      { DEFAULT: 'var(--text-primary)', muted: 'var(--text-muted)', onPrimary: 'var(--text-on-primary)' },
  border:    { DEFAULT: 'var(--border)', strong: 'var(--border-strong)' },
  brand:     { primary: 'var(--brand-primary)', 'primary-deep': 'var(--brand-primary-deep)',
               'primary-surface': 'var(--brand-primary-surface)', accent: 'var(--brand-accent)',
               'accent-deep': 'var(--brand-accent-deep)' },
  ai:        { DEFAULT: 'var(--ai)', surface: 'var(--ai-surface)' },
  // semantic state + focus
}
```

### 1.2 Spacing & layout
- Base 4px. Tokens: `--space-1..12` = 4/8/12/16/20/24/32/40/48/64/80/96. Sidebar widths: collapsed 72px, expanded 264px. Content max-width: 1200px; reading column 680px.

### 1.3 Radius
- `--radius-sm 6` / `--radius-md 10` / `--radius-lg 14` / `--radius-xl 20` / `--radius-pill 999`.

### 1.4 Elevation (shadows)
- `--shadow-1` (cards) `0 1px 2px rgba(2,6,23,.06)`
- `--shadow-2` (popovers) `0 4px 16px rgba(2,6,23,.10)`
- `--shadow-3` (modals) `0 12px 40px rgba(2,6,23,.16)`
- Dark theme shadows expressed as `0 0 0 1px var(--border)` + a faint violet glow rather than heavy black.

### 1.5 Type scale (mirrors brand doc)
12/13/14/16/20/24/30/36/48 — exposed as `text-xs..text-4xl`.

### 1.6 Motion
- `--ease-standard cubic-bezier(.2,.8,.2,1)`, durations 120/160/220/300ms.
- Reduced motion: media query zeros translate/scale; opacity ≤150ms.

### 1.7 Z-index scale
`--z-base 0, --z-sticky 100, --z-drawer 200, --z-modal 300, --z-toast 400, --z-tooltip 500`.

## 2. Component library (`shared/ui/`)

All components are Radix-primitive-wrapped, theme-token-styled, keyboard-first, and accept `className` merge (clsx) + `size`/`variant` props.

| Component | Variants / states | A11y notes |
|---|---|---|
| `Button` | primary / accent / ai / ghost / outline / danger; sizes sm/md/lg; loading | focus-ring, `aria-busy` while loading, type defaults button |
| `IconButton` | as Button + square; aria-label required | tooltip on hover/focus |
| `Card` | default / interactive (hover lift) / ai-tinted | landmark via `<section>` when titled |
| `Input` | text / search / with-leading-trailing; error; disabled | label association, `aria-invalid`, inline error text |
| `Textarea`| auto-grow option; char count | label + error |
| `Select` (Radix) | size sm/md; searchable for long lists | keyboard nav, `aria-activedescendant` |
| `DropdownMenu` (Radix) | | roving focus, Esc closes, click-outside |
| `Dialog` (Radix) | size sm/md/lg; side="right" for drawers | focus trap, restore focus, Esc, `aria-labelledby` |
| `Tabs`(Radix) | underline / pill | arrow nav, auto-activate |
| `Switch`(Radix) | on=brand-primary | labelled |
| `Slider`(Radix) | for volume/rate | min/max labels, keyboard |
| `Toast` (Radix) | title+desc+action; info/success/warning/danger | `role=status`/`alert`, auto-dismiss 5s (errors until closed) |
| `Badge` / `Pill` | brand / neutral / state / outline | text + optional dot |
| `Progress` | linear + ring; indeterminate | `role=progressbar`, `aria-valuenow` |
| `Skeleton` / `LoadingSpinner` / `LoadingScreen` | | `aria-busy`, reduced-motion static |
| `Tooltip`(Radix) | | 300ms show delay, Esc dismiss |
| `Alert` / `Banner` | inline info / warning / danger | `role=alert` when danger |
| `EmptyState` | icon + title + action | used in lists/empty pages |
| `Avatar` | src / initials / gradient fallback | `alt`, `aria-hidden` for decorative |
| `ErrorBoundary` | fallback UI + report button | dev mode stack |
| `AnimatedRoute`(framer) | fade/slide | reduced-motion aware |

### Variant mapping examples
- Primary button: `bg-brand-primary text-white hover:bg-brand-primary-deep active:scale-[.99] focus-visible:ring-2 ring-offset-2 rounded-md shadow-1`.
- AI reply bubble: `bg-ai-surface text-text-primary border border-[color-mix(in_srgb,var(--ai)_30%,transparent)] rounded-lg`.
- Danger button: `bg-state-danger/10 text-state-danger border border-state-danger/30`.
- Live orb (the signature): concentric Coral→Indigo radial, ringed by an `AudioPulse` worklet-fed equalizer; Coral means "you speak", Violet (AI) means "AI speaks".

## 3. Theming implementation

- `ThemeProvider` sets `data-theme` on `<html>` and persists choice (`system|light|dark`) via `lingoraAPI.settings.setTheme` (desktop) / localStorage (web). A `matchMedia('(prefers-color-scheme: dark)')` listener updates when `system`.
- All components read tokens — **no hard-coded hex** outside the token file. Lint rule (stylelint/custom) blocks raw hex usage in components.

## 4. Accessibility (WCAG 2.1 AA)

- **Color contrast:** text≥4.5:1 (≥3:1 for ≥18px/bold and UI graphics). Verified pairs recorded in a storybook-style checklist.
- **Keyboard:** every interactive control reachable; visible focus ring (`:focus-visible`); logical tab order; skip-to-content link on shell. Modals trap & restore focus.
- **Screen readers:** semantic landmarks (`header/nav/main/aside/footer`), `aria-label` where visual-only, live regions for streaming chat (`aria-live=polite`) and for live-session status (`aria-live=polite/assertive` for errors), `aria-busy` on streaming containers.
- **Motion:** `@media (prefers-reduced-motion)` flattens transitions; the AudioPulse idle breathing pauses.
- **Names:** buttons have text or `aria-label`; icons-only never rely on meaning.
- **Forms:** inline errors with `aria-describedby`; no color-only validation.
- **Captions/transcripts:** TTS audio has an on-screen transcript fallback; transcripts for voice sessions saved.

## 5. Layout & grid

- App shell: collapsing sidebar (desktop), bottom nav (mobile ≤768px). Header sticky with global search + notifications + theme.
- Content region scrollable; page header pattern (title + subtitle + primary action) consistent.
- Grid: 12-col at ≥1024px; 1-col at <640px; cards wrap.
- Live page is full-bleed (no sidebar chrome) with a control tray at bottom — mirror a phone-call UI to emphasise voice primacy.

## 6. Forms

- Field pattern: `Label` (top) → `Input` with optional leading/trailing → helper text → inline error. Buttons left-aligned with primary right-most.
- Validation: inline on blur, on submit, optimistic for client checks; server errors map to fields by name.
- Save/discard model for admin authoring; autosave-tick for lesson authoring.

## 7. Loading, empty, error states

- **Skeletons** for lists/cards; **spinner** for inline quick waits; **LoadingScreen** for app bootstrap only.
- **Empty states** always offer a next action (e.g., "No live sessions yet — start one").
- **Errors** context-specific (inline) + a toast for transient; never raw `alert`. Network/offline errors include a retry CTA.

## 8. Internationalization considerations

- Mirror layouts for RTL are **not** required for v1 but components use `ps`/`pe` (logical) Tailwind utilities, not `pl`/`pr`, to keep the door open.
- Text wrapping assumed variable; buttons allow up to 2 lines at ≤540px; never truncate a CTA label.
- Numerals latinise; commas remain locale-aware only via `Intl`.

## 9. Tone in components

Microcopy lives in the i18n catalog, never inline string literals. Buttons: imperative verb (Start, Continue, Save, Retry). Empty titles: noun + 1-line human lead.

## 10. Storybook / visual tests

- Ship the design system with a minimal visual test page (`/dev/ui-kit`) gated to `VITE_APP_ENV !== 'production'`, mounting every variant. Used by Playwright to snapshot base components in light + dark for regression.
- axe assertions are part of the kit page E2E; zero violations baseline.
