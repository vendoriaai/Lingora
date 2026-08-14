---
name: Lingora
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#ae3026'
  on-secondary: '#ffffff'
  secondary-container: '#fc6959'
  on-secondary-container: '#690003'
  tertiary: '#5c00ca'
  on-tertiary: '#ffffff'
  tertiary-container: '#7531e6'
  on-tertiary-container: '#e4d4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4aa'
  on-secondary-fixed: '#410001'
  on-secondary-fixed-variant: '#8c1712'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  h1-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 20px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style
The design system for this voice-first AI language tutor is rooted in a **Calm Modernism** aesthetic, blending the precision of a high-end educational tool with the approachability of a personal mentor. It avoids gamified tropes in favor of a "quiet studio" atmosphere—spacious, focused, and intellectually stimulating.

The visual language utilizes **Minimalism** with subtle **Glassmorphism** specifically for AI-generated content to differentiate human-like interactions from static UI. The interface prioritizes focus through generous whitespace and a rhythmic use of indigo and coral to guide the user's attention between navigation and active speaking.

## Colors
The palette is lead by **Indigo**, representing the stability and depth of learning. **Coral** is reserved exclusively for "Voice" and active participation moments, acting as a high-energy call to action. **Violet** serves as the signature color for AI-driven tutor responses, often applied to translucent surfaces to suggest the ethereal nature of the assistant.

For Dark Mode, tokens shift to a deep navy foundation (`#0B1020`). Use Indigo `#6366F1` and Coral `#FF8A7A` to maintain vibrance against dark backgrounds. Ensure the AI surface remains translucent (`rgba(167, 139, 250, 0.12)`) to preserve the layering effect.

## Typography
The system employs a dual-typeface strategy. **Plus Jakarta Sans** provides a friendly yet sophisticated character for headlines, utilizing its soft terminals to keep the brand approachable. **Inter** is used for all functional UI elements, body copy, and transcriptions due to its exceptional legibility at small sizes.

Line heights are intentionally generous to improve readability for learners. When displaying foreign language text alongside translations, use `body-lg` for the target language and `label-md` in a neutral tint for the translation to establish clear hierarchy.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a focus on vertical rhythm. 

- **Mobile:** 4-column grid with 20px margins.
- **Tablet/Desktop:** 12-column centered grid with a maximum content width of 1040px to ensure line lengths remain optimal for reading.

Use "Safe Zones" for the primary voice activation button (The Orb) at the bottom of the screen, ensuring it is always reachable with the thumb. Vertical spacing between different "speakers" in a conversation should use the `xl` (48px) token to represent the natural pauses in a quiet studio environment.

## Elevation & Depth
This design system utilizes **Low-contrast Outlines** and **Tonal Layers** rather than heavy shadows.

- **Level 0 (Base):** The main application background.
- **Level 1 (Cards/Sheet):** Surface-1 with a 1px hairline border (`#E2E8F0`). No shadow.
- **Level 2 (Active/Floating):** Use a very soft, diffused shadow (`0 10px 30px rgba(15, 23, 42, 0.05)`) only for elements that temporarily float above the UI, like tooltips or pronunciation pop-overs.
- **AI Layers:** AI response bubbles use backdrop-blur (12px) and a tinted border to feel "digitally present" compared to the solid learner cards.

## Shapes
The shape language is defined by "Soft Precision."
- **Standard Cards & Containers:** Use the `lg` (14px) radius to create a warm, non-threatening container for educational content.
- **Interactive Elements (Buttons/Inputs):** Use the `md` (10px) radius to provide a sharper, more functional appearance.
- **Voice Indicators:** The Mic button and AI "Orb" are always `pill` shaped to reinforce the organic, fluid nature of voice.

## Components

### Buttons
- **Primary:** Indigo background with white text. 10px radius. Use for "Continue" or "Start Lesson."
- **Voice CTA:** Coral background. Reserved for the main microphone activation.
- **Secondary/Ghost:** Hairline border with Indigo text. Use for secondary actions like "View Transcript."

### AI Conversation Bubbles
- **Learner Bubble:** Solid Surface-1, right-aligned, 14px radius (bottom-right corner is 4px to point to user).
- **Tutor Bubble:** Translucent Violet surface (`ai-surface`), 1px tinted border, left-aligned.

### Cards
- Standard containers for lesson selection or stats. Background: `Surface-1`. Border: 1px `E2E8F0`. Radius: 14px.

### Iconography
- Use **Lucide** outline icons. 
- Stroke width: 1.75px for a refined, premium feel. 
- Icons should be tinted Indigo for UI actions and Coral for voice-related features.

### The Brand Orb
- A central component for the AI's state. It features a linear gradient from Indigo (#4F46E5) to Coral (#FF6B5B). When active, it pulses slightly using a scale transform.

### Accessibility
- **Focus Rings:** 2px solid Indigo with a 2px offset.
- **Motion:** Use subtle fades rather than rapid slides. Respect `prefers-reduced-motion` by removing the Orb's pulse animation.