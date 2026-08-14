# 15 — Deployment

Three target surfaces: **Electron desktop** (Win/macOS/Linux), **web app** (Netlify), and the **Supabase backend** (DB + Auth + Storage + Realtime + Edge Functions). The renderer is the same code for desktop and web; differences are behind `getLingoraAPI()` and a couple of env vars.

## 1. Supabase backend

1. Create/select a Supabase project; set the region nearest to users.
2. Apply the schema: `supabase db push` with `supabase/migrations/0000_init.sql` (the linearised file from `07-DATABASE-SCHEMA.md`). Run `seed.sql` only in dev.
3. Storage: create buckets `course-assets` (public) and `avatars` (private, path-scoped) and verify the storage policies are applied (they ship in the migration).
4. Auth: enable Email + Google OAuth. Configure Redirect URLs:
   - Web: `https://<netlify-domain>/auth/callback`.
   - Desktop: `Lingora://auth/callback` (register the custom protocol on install — see `electron-builder` `protocols`) plus, if unavailable on a platform, an out-of-band/PKCE web redirect landing page.
5. Deploy Edge Functions: `supabase functions deploy process-gemini-chat process-live-conversation transcribe-audio`. Set secrets: `GEMINI_API_KEY`, `STT_PROVIDER`, `STT_API_KEY`.
6. Realtime: ensure `notifications` table realtime is enabled (Supabase dashboard or `alter publication supabase_realtime add table public.notifications`).
7. Rate limits: tune function invocations + realtime concurrency on the dashboard; set a per-user AI token budget in `system_settings` (`daily_ai_token_budget`).

## 2. Web build (Netlify)

- Build: `npm run build:web` → `dist/`.
- `netlify.toml`:
  - `build.command = "npm run build:web"`
  - `publish = "dist"`
  - SPA redirect: `/*  /index.html  200`
  - Env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`, `VITE_GOOGLE_CLIENT_ID`, `VITE_PUBLIC_ORIGIN`) injected by Netlify (CLI or dashboard — flagged for branch).
  - Headers: a strict CSP `default-src 'self'; connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com; media-src blob: https://*.supabase.co; img-src 'self' data: https://*.supabase.co; script-src 'self'; style-src 'self' 'unsafe-inline';`.
- Provision a preview deploy per PR; the E2E web job runs against the preview.
- Domain + HTTPS via Netlify; add the canonical origin to Supabase Auth Redirect URLs and `VITE_PUBLIC_ORIGIN`.

## 3. Electron desktop

- `electron-builder.yml`:
  - `appId`, product name `Lingora`, branded icons (`build/icons/`), the **`protocols`** entry for `Lingora://`.
  - Targets: `nsis` (Win), `dmg`+`zip` (mac — notarize), `AppImage`+`deb` (Linux).
  - `asar: true`, `asarUnpack` only for native deps if needed. Context isolation stays on.
- Build: `npm run build` (Vite build then `electron-builder`).
- Code-sign & notarize: per-platform via secrets (`CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`). Unsigned/`ad-hoc` for internal test builds only.
- Auto-update: wire `electron-updater` (GitHub Releases as the update host) — optional for v1 but spec'd: `app.on('ready')` → `autoUpdater.setFeedURL({ provider:'github', owner, repo })`; publish on tag.
- Telemetry: opt-in only; redact PII; endpoint configurable.
- The packaged build must set `webSecurity:true` (production) — no `--disable-web-security` shipped.

## 4. Versioning & release

- SemVer; tag `vMAJOR.MINOR.PATCH`. Electron auto-update feed reads tags.
- Chelog: keep a single `CHANGELOG.md`; auto-update notes pulled from there.
- Release run (Actions): build matrix → sign/notarize → upload artifacts → create Release → if Electron auto-update enabled, attach `latest.yml` and block-mapped assets.

## 5. Environments

| Env | Supabase | Gemini | Domain |
|---|---|---|---|
| Local dev | local Supabase stack | test/limited key | `localhost:5173` |
| Preview (per PR) | staging Supabase project | test key | Netlify preview subdomain |
| Production | prod Supabase project | production key (rate budgeted) | canonical domain + Electron signed releases |

Never share secrets across envs; CI injects per env from encrypted secrets.

## 6. Rollback & runbooks

- Schema: additive-forward migrations only going forward; an emergency revert is a new migration `0001_revert_xxx.sql`. `0000_init.sql` is the contract; it is not replayed on top of an existing data-bearing DB without care.
- Edge Functions: Supabase Functions support deploying a specific version; pin a known-good hash in CI and reroll only via `supabase functions deploy`.
- Web: Netlify instant rollback to a previous deploy.
- Electron: ship a rollback through `electron-updater` pointing at a prior release asset.

## 7. Smoke-after-deploy

- Prod Supabase: run `scripts/verify-schema.ts` (the contract check).
- Web: open `/auth/login`, sign in, open Live in text mode, send a turn, see reply persisted.
- Desktop: install the fresh build, sign in, run the voice smoke (`14-TESTING-STRATEGY.md` §7).
- Monitor error log + the per-user AI token-budget counter for runaway costs.
