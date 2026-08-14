// SignInPage — Phase 0 empty sign-in form (exit criterion).
// Phase 1 replaces this stub with the real Supabase Auth flow
// (email + Google), AuthStore wiring, and redirect to /dashboard.
import { useState } from 'react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phase 1: wire to AuthStore → supabase.auth.signInWithPassword / signUp,
  // then navigate('/dashboard'). For Phase 0 this is a controlled empty form.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // no-op until Phase 1
    void email; void password;
  };

  return (
    <main
      id="main"
      className="bg-bg text-text flex min-h-screen items-center justify-center p-6"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl tracking-tight">Lingora</h1>
          <p className="text-text-muted mt-2 text-sm">
            Voice-first English, powered by AI.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-bg-1 border border-border rounded-2xl p-6 space-y-4 shadow-2"
          aria-label="Sign in"
        >
          <label className="block">
            <span className="text-text-muted text-sm">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-bg-2 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            />
          </label>
          <label className="block">
            <span className="text-text-muted text-sm">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-bg-2 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            />
          </label>
          <button
            type="submit"
            className="bg-brand-primary hover:bg-brand-primary-deep text-text-onPrimary w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            Sign in
          </button>
          <p className="text-text-muted text-center text-xs">
            Auth wiring lands in Phase 1.
          </p>
        </form>
      </div>
    </main>
  );
}
