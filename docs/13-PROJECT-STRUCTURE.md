# 13 — Project Structure

The canonical layout. **Build this filesystem first** (scaffold Phase 0 in `AGENTS.md`) and place every file under one of these folders. Do not scatter scripts, HTML, or build chunks in the repo root — that was the baseline's biggest housekeeping failure and we're not repeating it.

```
Lingora/
├─ README.md
├─ AGENTS.md
├─ .env.example
├─ .env                          # gitignored
├─ .nvmrc
├─ .npmrc
├─ .gitignore
├─ .editorconfig
├─ .eslintrc.cjs
├─ .prettierrc
├─ tsconfig.json                 # project references: src/renderer, src/main, src/preload, src/shared, tests/e2e
├─ tsconfig.*;
├─ vite.config.ts                # dev server, admin-route plugin, edge-fn proxy
├─ tailwind.config.ts            # token mapping from 05-DESIGN-SYSTEM.md
├─ postcss.config.js
├─ electron-builder.yml         # packaging: win/mac/linux targets
├─ netlify.toml                  # web deploy
├─ package.json
│
├─ docs/                         # this specification set (committed)
│   └─ 00..17 *.md
│
├─ supabase/
│   ├─ config.toml
│   ├─ migrations/
│   │   └─ 0000_init.sql         # THE linearised schema from 07-DATABASE-SCHEMA.md (apply as one)
│   ├─ seed/
│   │   └─ seed.sql              # CEFR questions, badges, criteria, sample courses (dev)
│   └─ functions/
│       ├─ process-gemini-chat/{index.ts,deno.json,test.ts}
│       ├─ process-live-conversation/{index.ts,deno.json,test.ts}
│       └─ transcribe-audio/{index.ts,deno.json,test.ts}
│
├─ public/                       # static assets only (favicon, og image, chat sounds) — NO build chunks
│   ├─ icons/
│   └─ assets/
│
├─ src/
│   ├─ main/                     # Electron main process
│   │   ├─ index.ts              # bootstrap: app.whenReady → createWindow → registerIpc
│   │   ├─ window.ts             # BrowserWindow factory + flags (GPU, security, CSP)
│   │   ├─ ipc/                  # one file per domain, importing CHANNEL
│   │   │   ├─ ai.ts, audio.ts, speech.ts, db.ts, settings.ts, window.ts, main.ts
│   │   ├─ local-store/          # offline cache + sync queue (serialized writes)
│   │   │   └─ index.ts, schema.ts, sync.ts
│   │   ├─ gemini/               # server-side Gemini fallback (service-role path)
│   │   └─ permissions.ts        # mic permission flow
│   ├─ preload/
│   │   └─ index.ts              # contextBridge.exposeInMainWorld('lingoraAPI', {...})  per 11-IPC-CONTRACT.md
│   ├─ shared/                   # imports safe in main, preload, and renderer
│   │   ├─ ipc/contract.ts       # CHANNEL + LingoraAPI interface + Result
│   │   ├─ types/                # domain types (ChatReq, StreamItem, …)
│   │   ├─ env.ts                # safe env access (VITE_* surface only)
│   │   └─ util/                 # pure helpers (cefr, fk, wav, pcm, ids)
│   │
│   ├─ renderer/                 # the SPA (also the web build entry)
│   │   ├─ main.tsx              # React root; mount <App/>; Leafy providers
│   │   ├─ app/
│   │   │   ├─ App.tsx           # router + providers + bootstrap (see TDD §2.4)
│   │   │   ├─ providers/        # ThemeProvider, AuthProvider, etc. thin (Zustand-backed)
│   │   │   ├─ routes.tsx        # route table; lazy imports
│   │   │   └─ shell/            # Sidebar, Header, BottomNav, OfflineBanner, AppLayout
│   │   ├─ features/
│   │   │   ├─ auth/            { store, service, components, hooks, pages }
│   │   │   ├─ chat/            { store, service, components (Chat, EnhancedChat), hooks }
│   │   │   ├─ live/            (see 10-LIVE-CONVERSATION.md map)
│   │   │   ├─ courses/         { catalog, detail, lesson player, enrollment, list, materials }
│   │   │   ├─ vocabulary/      { list, flashcard review }
│   │   │   ├─ grammar/
│   │   │   ├─ assessment/      { start, task flow, results, proficiency }
│   │   │   ├─ progression/
│   │   │   ├─ notifications/   { inbox, realtime subscription }
│   │   │   ├─ admin/           { users, course wizard, questions, notifications, analytics }
│   │   │   ├─ profile/
│   │   │   └─ settings/
│   │   ├─ shared/               # renderer-only shared
│   │   │   ├─ ui/               # design system components (Button, Dialog, …) per 05-DESIGN-SYSTEM.md
│   │   │   ├─ api/             { supabase.ts, gemini.ts, lingora-api.ts (web/getLingoraAPI), db.types.ts }
│   │   │   ├─ stores/          zustand: auth, progress, ui, live, notifications
│   │   │   ├─ lib/             { logger, i18n, hooks, audio, analytics }
│   │   │   └─ styles/          { tokens.css, tailwind.css, motion.css }
│   │   ├─ pages/                # route components, each composes a feature
│   │   └─ env.d.ts              # import.meta.env typings
│   └─ assets/                   # **source** assets (svg, fonts config) compiled by Vite; do NOT put build chunks here
│
├─ scripts/                      # ops scripts (not committed garbage; documented with --help)
│   ├─ generate-env.ts
│   ├─ seed-cefr-questions.ts
│   └─ verify-schema.ts          # assert the live DB matches 07-DATABASE-SCHEMA.md (CI)
│
└─ tests/
    ├─ unit/                     # .test.ts co-located with sources is also fine
    ├─ integration/              # supabase-js against local Postgres; MSW for Gemini
    ├─ e2e/                      # Playwright tests (electron + web)
    └─ fixtures/
```

## conventions
- Feature folders are self-contained; cross-feature imports only via a feature's explicit `index.ts` public API.
- `shared/` and `shared/renderer` distinction: anything main/preload need lives in `src/shared`; UI helpers live in `src/renderer/shared`.
- Pages never import services directly except via `getLingoraAPI()`; state flows through stores.
- No file in the repo root except the listed top-level config/doc files. **No `admin-dashboard.html` in root** — admin is a route in the SPA under `/admin/*` like any other page.
- No committed `.js` build chunks (the baseline committed `index-*.js`, `react-vendor-*.js`, `framer-motion-*.js`, etc. — all `dist/`-bound artifacts now ignored).
- No `fix-*.js` one-off scripts; put prototyping under `scripts/` with a real purpose + `--help`, or delete it.
