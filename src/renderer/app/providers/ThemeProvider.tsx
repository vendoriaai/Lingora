// ThemeProvider — applies `data-theme` to <html> from the theme store.
// Phase 0 ships a minimal in-memory + localStorage variant; Phase 1 wires the
// real Zustand store to lingoraAPI.settings for desktop persistence parity.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Theme } from '@shared/types';

interface ThemeCtx {
  theme: Theme;           // resolved theme actually applied ('system' expands)
  setTheme: (t: Theme) => void;
  resolved: 'light' | 'dark';
}

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = 'lingora.theme';

function systemResolved(): 'light' | 'dark' {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? 'system';
  });
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem(STORAGE_KEY) as Theme | null) === 'light' ? 'light'
      : (localStorage.getItem(STORAGE_KEY) as Theme | null) === 'dark' ? 'dark'
      : systemResolved(),
  );

  useEffect(() => {
    const apply = () => {
      const r = theme === 'system' ? systemResolved() : theme;
      setResolved(r);
      document.documentElement.setAttribute('data-theme', r);
    };
    apply();
    if (theme !== 'system') return undefined; // no subscription needed for fixed themes
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const value = useMemo<ThemeCtx>(() => ({ theme, setTheme, resolved }), [theme, setTheme, resolved]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
