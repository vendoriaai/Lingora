# 12 — Development Setup

## 1. Prerequisites
- Node 20+ (`.nvmrc` pins the version; `nvm use`).
- npm 9+ (or pnpm via corepack — choose one; npm is the default).
- A Supabase project (URL + anon + service-role keys) — use the hosted dashboard or run the local stack (`supabase start`).
- A Google Gemini API key (`aistudio.google.com/app/apikey`).
- Optional for STT: a provider key (Google Cloud Speech / Deepgram / AssemblyAI) — the default `browser` provider needs none.

## 2. Install
```bash
git clone <your-fork> Lingora && cd Lingora
cp .env.example .env          # fill in values
npm install
```
The Electron stack pulls separately: `npm install` installs dev + runtime; `electron-builder` resolves on first `dist`.

## 3. Commands
| Script | Does |
|---|---|
| `npm run dev` | concurrently: Vite (5173) + Electron (waits for `http://localhost:3002`²; uses 5173 in web) |
| `npm run web` | Vite only (web dev) |
| `npm run lint` | `eslint src --ext .ts,.tsx` |
| `npm run typecheck` | `tsc --noEmit` (project references) |
| `npm test` | Vitest (unit + integration) |
| `npm run test:e2e` | Playwright (Electron + web) |
| `npm run build` | Vite build + `electron-builder` desktop packages |
| `npm run build:web` | Vite build for Netlify |
| `npm run db:push` | apply `supabase/migrations/0000_init.sql` (the linearised schema from `07-DATABASE-SCHEMA.md`) |
| `npm run db:seed` | load `supabase/seed.sql` (dev CEFR questions, badges, criteria, sample courses) |
| `npm run db:types` | `supabase gen types typescript` → `shared/api/db.types.ts` |
| `npm run supabase` | `supabase functions serve` (run Edge Functions locally with Deno) |

> ² The dev server port: set `VITE_DEV_PORT=5173` (web) — Electron waits on `http://localhost:$VITE_DEV_PORT`. The baseline used 3002; Lingora defaults back to Vite's 5173 and only waits once.

## 4. Local Supabase (recommended for dev)
```bash
npm i -g supabase          # or use the Supabase CLI via the project MCP
supabase init
supabase start             # spins Postgres, Auth, Storage, Realtime, Functions locally
npm run db:push && npm run db:seed
npm run db:types
# Edge functions:
supabase functions serve --env-file .env
```
Point `.env` at the local stack:
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local anon from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<local service role>
```

## 5. Electron dev specifics
- `main.js` opens `loadURL('http://localhost:$VITE_DEV_PORT')` in dev, `dist/index.html` in prod.
- DevTools open detached by default; toggle via `Cmd/Ctrl+Shift+I`.
- `DISABLE_GPU=true` env works around GPU crashes on a machine.
- Deep links / OAuth redirect: `Lingora://auth/callback` scheme + a `Redirect URI` set in Supabase Auth for the desktop build; web build uses `https://<origin>/auth/callback`.

## 6. Type generation + contracts
- `npm run db:types` regenerates `shared/api/db.types.ts` after schema changes; commit it.
- `shared/ipc/contract.ts` is hand-written and the source of truth for the IPC contract; an ESLint rule bans ambient string channels.
- Design tokens: `npm run tokens` exports CSS variables (build-time check that Tailwind config matches `05-DESIGN-SYSTEM.md`).

## 7. Debug checklist (when something's off)
- Renderer hangs on verifying envs? Validate via `AppConfig.validate()` — it warns, doesn't crash. Check `.env` is loaded (`vite` loads `VITE_*`, `dotenv` loads the rest into `process.env` for main).
- Live connection obscure 403? Confirm `VITE_GEMINI_API_KEY` is present (the client refuses to connect without it).
- RLS blocks a write? Compare the policy to `07-DATABASE-SCHEMA.md`; in dev run `supabase status` and watch `rls` logs.
- Mic silent? Permission must be granted by a user gesture; see `16-SECURITY.md` §permissions.

## 8. Recommended VS Code extensions
`dbaeumer.vscode-eslint`, `bradlc.vscode-tailwindcss`, `denoland.vscode-deno` (for edge fn authoring), `ms-playwright.playwright`, `42crunch.vscode-openapi` (if you keep an OpenAPI for edge fn contracts).
