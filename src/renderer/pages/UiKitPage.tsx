// UiKitPage — /dev/ui-kit. Dev-only (gated on VITE_APP_ENV in App).
// Phase 0: route exists + renders light/dark toggle as the smoke test. The full
// variant grid from docs/05-DESIGN-SYSTEM mounts here once shared/ui lands.
import { useTheme } from '@renderer/app/providers/ThemeProvider';

export default function UiKitPage() {
  const { theme, setTheme, resolved } = useTheme();

  return (
    <main id="main" className="bg-bg text-text min-h-screen p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight">UI Kit</h1>
          <p className="text-text-muted text-sm">
            Design-system registry · resolved theme: <code className="text-brand-primary">{resolved}</code>
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Theme">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={
                'rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ' +
                (theme === t
                  ? 'border-brand-primary bg-brand-primary text-text-onPrimary'
                  : 'border-border text-text-muted hover:text-text')
              }
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <p className="text-text-muted text-sm">
        The variant grid (Button, Card, Input, Dialog, …) will mount here once the
        shared/ui component library lands. This route already proves the design
        tokens flip correctly between light and dark.
      </p>
    </main>
  );
}
