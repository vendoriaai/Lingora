import type { Config } from 'tailwindcss';

// Tailwind tokens map to semantic CSS variables in tokens.css (light + dark via
// [data-theme="dark"]). Values come from docs/04-BRAND-GUIDELINES + docs/05-DESIGN-SYSTEM.
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/renderer/index.html',
    './src/renderer/**/*.{ts,tsx}',
    './src/shared/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: 'var(--bg-surface)', 1: 'var(--bg-surface-1)', 2: 'var(--bg-surface-2)' },
        text: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          onPrimary: 'var(--text-on-primary)',
        },
        border: { DEFAULT: 'var(--border)', strong: 'var(--border-strong)' },
        brand: {
          primary: 'var(--brand-primary)',
          'primary-deep': 'var(--brand-primary-deep)',
          'primary-surface': 'var(--brand-primary-surface)',
          accent: 'var(--brand-accent)',
          'accent-deep': 'var(--brand-accent-deep)',
        },
        ai: { DEFAULT: 'var(--ai)', surface: 'var(--ai-surface)' },
        state: {
          success: 'var(--state-success)',
          warning: 'var(--state-warning)',
          danger: 'var(--state-danger)',
        },
        focus: 'var(--focus-ring)',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Brand 9-step type scale (1.250 ratio): 12/13/14/16/20/24/30/36/48.
        xs: ['12px', '1.5'],
        sm: ['13px', '1.4'],
        base: ['14px', '1.5'],
        lg: ['16px', '1.5'],
        xl: ['20px', '1.4'],
        '2xl': ['24px', '1.33'],
        '3xl': ['30px', '1.25'],
        '4xl': ['36px', '1.2'],
        '5xl': ['48px', '1.15'],
      },
      spacing: {
        // 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px',
        8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px', 24: '96px',
        'sidebar-collapsed': '72px',
        'sidebar-expanded': '264px',
        'content-max': '1200px',
        'reading': '680px',
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '14px', xl: '20px', pill: '999px',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
      },
      transitionTimingFunction: { standard: 'cubic-bezier(.2,.8,.2,1)' },
      transitionDuration: {
        120: '120ms', 160: '160ms', 220: '220ms', 260: '260ms', 280: '280ms', 300: '300ms',
      },
      zIndex: {
        base: '0', sticky: '100', drawer: '200', modal: '300', toast: '400', tooltip: '500',
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        'live-glow': 'radial-gradient(circle at center, rgba(255,107,91,0.35), rgba(79,70,229,0.25) 60%, transparent 80%)',
        'avatar-tile': 'linear-gradient(135deg, #4F46E5, #7C3AED)',
      },
      keyframes: {
        'orb-breathe': {
          '0%,100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.92' },
        },
        'ai-glow': {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.08)' },
        },
        'progress-indeterminate': {
          '0%': { left: '-33%', right: '100%' },
          '60%': { left: '100%', right: '-33%' },
          '100%': { left: '100%', right: '-33%' },
        },
      },
      animation: {
        'orb-breathe': 'orb-breathe 2s ease-in-out infinite',
        'ai-glow': 'ai-glow 1.2s ease-in-out infinite',
        'progress-indeterminate': 'progress-indeterminate 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
