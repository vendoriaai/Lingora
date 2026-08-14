# 14 — Testing Strategy

Lingora ships tests with features. The baseline relied on scores of ad-hoc `test-*.js`/`test-*.html` debug pages and no real suite — we replace that with a layered, CI-gated plan.

## 1. Layers & coverage targets

| Layer | Tool | What | Coverage gate |
|---|---|---|---|
| Unit | Vitest (+ @testing-library/react) | pure functions, hooks, stores, components, services (mocked) | ≥ 80% lines on `src/renderer/shared`, `src/renderer/features/*/service`, `src/shared/util`, main ipc handlers |
| Integration | Vitest + MSW/Supabase local | services against a local Supabase container + MSW for Gemini HTTP; Edge Function Deno tests | critical paths (auth, chat persistence, enrollment, progression) covered |
| E2E | Playwright (`_electron` for desktop, browser for web) | signup → assessment → chat(text) → lesson complete → live(text path) → certificate | all golden paths green on every CI run |
| Visual | Playwright snapshots | `shared/ui` kit page in light + dark at mobile/desktop | zero unreviewed diffs |
| A11y | axe via Playwright | kit page + key screens | zero violations |

## 2. Unit specifics

- **Pure (`src/shared/util`):** `wav.ts` (L16 headers exact byte values), `pcm-utils` (Int16↔Float32 roundtrip), `cefr.ts`/`fk` (FK score → CEFR mapping table asserts), `progression` rule evaluator (one fixture per rule_type), `ids` generators (uniqueness within N).
- **Hooks:** `react-hooks` testing via `@testing-library/react` `renderHook`; for streaming hooks, fake an async-iterable stream.
- **Stores (Zustand):** exercise reducers/effects with seeded initial state; assert stale-cache invalidation, offline flag transitions.
- **Components:** render with theme toggles; assert focus order, keyboard handlers, `aria-*`, `prefers-reduced-motion` (jsdom media query mock).
- **Main ipc handlers:** invoke handler with valid/invalid payloads; assert `Result` shape; assert zod rejects bad input.

## 3. Integration specifics

- Spin `supabase start` in CI; apply `0000_init.sql` + seed; run service tests against it.
- Mock Gemini with MSW recording fixtures (success, blocked `SAFETY`, 429 rate-limit, network error) — assert fallback ladder, canned messages, persistence to `conversation_history`.
- Live relay: stub the Edge Function SSE with a fixture stream; assert `messages`, `partialResponse`, `done` handling, WAV creation, session row writes.
- RLS smoke: insert with anon client expecting `new row violates row level security` for cross-user access; assert owner-write succeeds.

## 4. E2E specifics

- Desktop: `@playwright/test` with `_electron` launches the packaged/dev electron; runs in headed-ish mode for mic permission grants (auto-accept).
- Web: same test specs run against a Vite preview build (and the Playwright desktop tests guard desktop-only expectations with `test.skip(!isElectron, ...)`).
- Flaky guards: network/timing-backed steps use `expect.toPass` retries; live audio E2E is **not** in CI (Gemini key + mic); a text-path live smoke is, and a manual smoke checklist documents the real-audio step.
- Golden flow: signup (Magic-link stub or test user) → onboarding → placement → dashboard → open lesson → mark complete → live text turn → certificate issuance visible in Profile.

## 5. Contracts & regression

- `scripts/verify-schema.ts` (CI): introspects the live/dev Postgres and asserts every expected table, column, RLS policy, and index exists per `07-DATABASE-SCHEMA.md` — fails the build on drift so the schema can't silently regress.
- Edge Function `test.ts` per function with golden-path + error-path Deno tests, run in CI via `deno test`.
- `npm run typecheck` and `npm run lint` are CI gates (`strict`, no `any` without `// reason:`).

## 6. CI pipeline (GitHub Actions)

```
setup-node + cache -> install -> lint -> typecheck -> typegen -> unit -> integration (Supabase box) ->
edge-fn deno tests -> build (web + electron) -> e2e (electron) -> e2e (web) -> a11y -> schema verify -> bundle-audit
```
- Secrets: Gemini keyed test key only in a dedicated job; never live-write to prod Supabase. Use a throwaway project per CI matrix.
- Target test timing budgets to catch regressions: chat first-token, lesson-load, live-connect under 4s.

## 7. Manual smoke (the real-audio path)

A documented checklist run pre-release:
1. Fresh desktop install on Win + macOS + Linux.
2. `npm run dev`, sign in, take placement, get dashboard.
3. Live voice: tap orb, speak, hear reply, barge-in, end — verify `live_conversation_sessions` row with `mode`, `duration_seconds`.
4. Trigger relay fallback by toggling `VITE_GEMINI_API_KEY=''` → badge shows "Connected via relay"; TTS plays.
5. STT denied: ensure text path active with the banner.
6. Offline: disable network mid-lesson → banner; reconnect → queue drains.
7. Admin: create course via wizard, publish, enroll as a student, complete and earn certificate.

## 8. Anti-patterns (from the baseline)

- No loose `test-*.js` debug scripts in the repo root.
- No HTML debug pages for "is the thing working" — those become Playwright tests or are deleted.
- No tests fused to production code/executed by `electron`; tests run with Vitest/Playwright.
