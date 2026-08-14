# 02 — Technical Architecture Document (TAD)

**Product:** Lingora. **Scope:** system-level architecture. **See also:** `03-TDD.md` (detailed design), `11-IPC-CONTRACT.md`, `07-DATABASE-SCHEMA.md`.

---

## 1. Architecture at a glance

Lingora is an **Electron** desktop app whose **renderer is a React/TS SPA**, the same SPA also served as a **web app** via Netlify. The desktop process model is the standard three: `main` (Node), `preload` (privileged bridge), `renderer` (sandboxed web). All persistent data lives in **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions). AI comes from **Google Gemini** (`@google/genai`): text/vision via REST, live realtime via WebSocket.

```
                         ┌──────────────────────────────────────┐
                         │             Lingora client            │
                         │  (Electron desktop OR web @ Netlify)  │
                         │                                       │
   native window ←────── │  ┌──────────┐   contextBridge   ┌────┴─────────┐
   file system  ←────── │  │  main.js │ ←——IPC (typed)——→ │  preload.js  │
   GPU/mic perm          │  │ handlers│                   │  = lingoraAPI │
                         │  └────┬─────┘                   └────┬─────────┘
                         │       │                              │ window.lingoraAPI
                         │       │ invokes                      │
                         │  ┌────▼──────────────────────────────▼─────┐
                         │  │            Renderer (React 18 + TS)       │
                         │  │  Zustand stores · React Router · Tailwind │
                         │  └────┬───────────────────┬─────────────────┘
                         │       │ supabase-js        │ @google/genai (live WS) · fetch (chat/TTS)
                         └───────┼───────────────────┼──────────────────────────┐
                                 │                   │                          │
              ┌──────────────────▼───┐      ┌─────────▼──────────┐      ┌───────▼────────┐
              │      Supabase        │      │  Supabase Edge     │      │  Google Gemini │
              │  Postgres (RLS)      │◄─────│  Functions (Deno)  │──────│  REST + Live WS│
              │  Auth · Storage · RT │      │ - chat  - live     │      └────────────────┘
              └──────────────────────┘      │ - transcribe       │
                                            └────────────────────┘
```

## 2. Process model (Electron)

### Main process (`src/main/`)
- Window lifecycle, GPU/cache flags, deep-link/OAuth redirect handling, native permissions (mic).
- IPC handlers grouped by domain (see `11-IPC-CONTRACT.md`): `ai.*`, `audio.*`, `db.*`, `window.*`, `speech.*`, `settings.*`, `main.*`.
- Owns the **local-store** cache (offline-first) in `app.getPath('userData')`, serialized via a write queue with backup + corruption recovery.
- Reads server-side env (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) — never sent to renderer.

### Preload (`src/preload/`)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Exposes a **single typed object** `window.lingoraAPI` via `contextBridge`. Each method maps to a named, allow-listed IPC channel. No raw `ipcRenderer` leak.
- API surface mirrors `11-IPC-CONTRACT.md` exactly; types generated from the same source so main + renderer agree.

### Renderer (`src/renderer/`)
- Same React/TS/Vite bundle used for web. Detects Electron via `typeof window.lingoraAPI`; web build uses an **adapter** implementing the same interface over `fetch` to Edge Functions (and direct Gemini where browser-safe).
- Providers/contexts wrap the app. State in Zustand stores (auth, progress, live, ui). Services are plain TS modules wrapping `supabase-js` + `@google/genai`.
- Routing via React Router; routes lazy-loaded; layout shell conditionally renders chrome (sidebar/header) for student vs admin vs auth.

### The web parity problem
In the browser there is no Electron main, so features that relied on the local file store or privileged handlers must degrade: the web build uses IndexedDB for the offline cache and the same Edge Functions for AI. The `lingoraAPI` adapter is the single seam. Design every feature against the `lingoraAPI` interface first; only when a feature genuinely needs the main process do we add a desktop-only method (and an adapter equivalent or a "desktop-only" guard).

## 3. Data flow

### 3.1 Chat (text, streaming)
```
UI (EnhancedChat) → ChatStore.send(text)
  → lingoraAPI.ai.generateResponseStream(opts)            [desktop: IPC]
      OR fetch POST /functions/v1/process-gemini-chat     [web]
  → Edge Function: Gemini generateContentStream → SSE chunks
  → ChatStore appends tokens; UI renders partial then final
  → onComplete: lingoraAPI.db.persistConversationTurn(user, assistant) [desktop] or Edge Function insert
```
Direct fallback: if the Edge Function is unreachable, the renderer calls Gemini directly with `VITE_GEMINI_API_KEY` (browser-safe key) — see `09-AI-INTEGRATION.md` ladder.

### 3.2 Live voice (two modes)
**Direct (primary):** Renderer holds a `GenAILiveClient` (`@google/genai` WebSocket). Mic → AudioWorklet (resample to PCM16/24k) → `sendRealtimeInput`. Model audio chunks → `AudioStreamer.addPCM16()` → scheduled Web Audio playback; volume meter worklet. Barge-in stops the streamer.
**Relay (fallback):** Renderer → Edge Function `process-live-conversation` → SSE text + TTS audio blob → `playAudioFromInlineData()` (L16→WAV).

### 3.3 Courses/data
All reads/writes go through `supabase-js` with the user's session token; RLS enforces ownership. Mutations that need atomicity use Postgres functions (`create_lessons_with_materials`, `upsert_lessons_with_materials`, `admin_dispatch_notification`).

### 3.4 Offline
Renderer reads through a caching service that prefers Supabase; on failure or offline flag, reads the local store and queues writes to a sync queue. On reconnect, the queue drains to Supabase; cloud truth wins via `updated_at` optimistic-concurrency checks.

## 4. Technology choices & rationale

| Concern | Choice | Why not the alternative |
|---|---|---|
| Shell | Electron 30 | Tauri lacks the renderer-equals-web parity we want and the rich IPC + media handling; Electron + Vite is battle-tested here |
| Bundler | Vite 5 | fast HMR, React plugin, mid-server support for the admin route plugin |
| UI | React 18 + TS | team/system familiarity; TS is mandatory for the typed IPC/contract goals |
| State | Zustand | the baseline mixed providers + contexts + raw IPC; a single store model with selectors is simpler and testable; no Redux ceremony for this scale |
| Styling | Tailwind + Radix UI | the baseline used Radix + Tailwind; keep it, formalise tokens |
| Animation | Framer Motion | used in baseline; route/page transitions |
| Icons | Lucide | consistent, tree-shakeable |
| AI | `@google/genai` (unified) | baseline used both `@google/generative-ai` and `@google/genai`; consolidate on the unified SDK which covers REST + Live + tools |
| Backend | Supabase | gives Postgres+RLS, Auth, Storage, Realtime (notifications), Edge Functions in one coherent system |
| Auth | Supabase Auth (JWT) | integrates with RLS via `auth.uid()`; no separate identity service |
| Local/offline | own local-store (Electron userData) / IndexedDB (web) | OrbitDB/SQLite add weight; a small JSON store + sync queue suffices at v1 scale |
| Testing | Vitest + Testing Library + Playwright | Vitest pairs with Vite; Playwright covers Electron (via `@playwright/test` `_electron`) and web |
| Monitoring | Lightweight logger + optional Sentry | baseline had a PerformanceMonitor; keep a slim version with redaction |

## 5. Component architecture (logical layers)

```
renderer/
  app/            App shell, providers, router
  features/       one folder per capability (auth, chat, live, courses, vocabulary, grammar,
                   assessment, progression, admin, notifications, settings, profile)
     <feature>/
        store.ts        Zustand slice
        service.ts      supabase-js + lingoraAPI calls
        components/     feature UI
        hooks.ts        useX hooks
        types.ts
  shared/
     ui/            design system (Button, Card, Dialog, Toast, …)
     api/           supabase client, gemini client
     lib/           utilities, logging, i18n, audio worklets
  pages/           route components (thin: compose features)
main/
  index.js         bootstrap
  ipc/             handlers per domain (ai, audio, db, window, speech, settings)
  local-store/     offline cache + sync queue
  gemini/          server-side gemini fallback (service-role never to renderer)
preload/
  index.js         contextBridge → lingoraAPI (generated)
shared/            types shared by main/preload/renderer (the IPC contract)
```

## 6. State management

- **AuthStore** — session, user, role; subscribes to `supabase.auth.onAuthStateChange`.
- **ProgressStore** — xp, level, streak, current course/lesson; hydrated from DB + offline store.
- **ChatStore** — messages, partial, isStreaming, focusArea, send().
- **LiveStore** — mode (direct/relay/idle), connected, messages, partial, volume, config (voice/modality/language), session metrics.
- **UICStore** — theme, locale, sidebar collapsed, toasts.
- Stores use a `persist` middleware backed by localStorage (web) or `lingoraAPI.settings` (desktop). Cross-store effects via subscriptions, not deep nesting.

## 7. Security boundaries

- Renderer is **sandboxed**; can only do what `lingoraAPI` exposes. No Node APIs.
- The preload allow-list is the complete IPC surface; new channels require contract update + review.
- Main process holds secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) and performs privileged DB writes only through SECURITY DEFINER functions or service-role calls — never relaying raw powers to the renderer.
- All Supabase queries from the renderer use the **anon key + user JWT** and are RLS-scoped.
- Edge Functions verify the Supabase JWT and enforce coarse auth (see `08-SUPABASE-EDGE-FUNCTIONS.md`, `16-SECURITY.md`); they use the service-role key only for cross-user/admin actions after verifying admin role.
- CSP for the web build restricts script/style origins; desktop build runs a strict CSP in production (dev relaxes it).

## 8. Inter-process & network contracts

- **IPC:** typed, allow-listed channels per `11-IPC-CONTRACT.md`. Request/response with error envelope `{ ok: false, error }` for failures.
- **Edge Functions:** HTTP(S); REST-shaped; JSON in/SSE or JSON out; per-function specs in `08-SUPABASE-EDGE-FUNCTIONS.md`.
- **Gemini Live:** WSS to `generativelanguage.googleapis.com`; message schema per `@google/genai` `LiveConnectConfig` (systemInstruction, tools, responseModalities, speechConfig).
- **Supabase Realtime:** subscriptions on `notifications` (user channel) and lesson/course deltas; resubscribed on reconnect.

## 9. Scalability & performance

- Postgres indexes on hot paths (user_id, status, created_at, last_study_date, cefr_level, is_active) — see schema doc.
- Realtime subscriptions pooled; only the views the current page needs.
- Code-split by route; design-system components lazy where heavy (charts, PDF viewer).
- Gemini requests sized: live systemInstruction constrains to 15–30 words; text chat maxOutputTokens bounded per focus area; cache `text_simplifications` to avoid repeat levelling calls.
- Local-store writes are serialized to avoid contention (the baseline's write-queue pattern is retained and improved).

## 10. Reliability & failure modes

| Failure | Behavior |
|---|---|
| Gemini down (chat) | Edge retry → direct client → canned safe message; UI shows "having trouble" with resend |
| Gemini Live WS fails/blocked | auto-switch to relay mode; status badge updates; typing still works |
| STT unavailable | typing always available; banner explains; no crash |
| Supabase transient error | retry with backoff (3 attempts); queue locally if offline; sync later |
| Mic permission denied | UI shows guidance to allow mic; text path active |
| Edge function returns prohibited content | show neutral canned response; log to telemetry |
| Profile missing | `create_missing_user_profile()` call backfills before gating actions |

## 11. Observability

- A slim logger (redacts PII/keys) writes to console in dev and to a rotating file (desktop) / a collector endpoint (web, opt-in).
- Performance marks: chat first-token, live-connect-time, lesson-load-time.
- One telemetry event budget per session to avoid noise; failures are always sent.

## 12. Open architecture decisions (resolved here)

- **One DB client:** supabase-js + RLS, no PostgREST MCP bridge.
- **State library:** Zustand (not Redux, not just context).
- **Live mode default:** try direct, fall back to relay.
- **STT:** provider-pluggable, browser fallback.
- **i18n:** in-repo message catalogs ( ICU-ish); no anonymous external CDN.
