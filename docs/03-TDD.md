# 03 — Technical Design Document (TDD)

**Product:** Lingora. **Scope:** module-level design, contracts, algorithms, data structures.
**See also:** `02-TAD.md` (system), `07-DATABASE-SCHEMA.md` (data), `08`/`09`/`10`/`11` (detailed contracts).

This document specifies *how* the thing works. It points to the dedicated contract docs rather than duplicating their tables.

---

## 1. Module map

| Module | Owner doc | Purpose |
|---|---|---|
| Electron main + preload | `11-IPC-CONTRACT.md` | lifecycle, IPC handlers, local store, secrets |
| supabase-js + adapters | here §3 | the single DB client + offline cache |
| Supabase schema & RLS | `07-DATABASE-SCHEMA.md` | tables, functions, policies |
| Edge Functions | `08-SUPABASE-EDGE-FUNCTIONS.md` | chat / live / transcribe |
| AI integration | `09-AI-INTEGRATION.md` | Gemini text/live/TTS, prompts, ladder |
| Live voice subsystem | `10-LIVE-CONVERSATION.md` | modes, audio pipeline, session persistence |
| Design system | `05-DESIGN-SYSTEM.md` | tokens + components |
| UI/UX | `06-UI-UX-SPEC.md` | IA + screens |

## 2. Renderer application design

### 2.1 Directory responsibilities
`features/<name>/{store,service,hooks,components,types}.{ts,tsx}` — each feature is self-contained and exposes only a thin public API + a default-mounted page. Pages compose features; pages contain no business logic. `shared/ui` contains dumb components only. `shared/api` wraps supabase and gemini. `shared/lib` holds cross-cutting utilities.

### 2.2 Public feature APIs ( behavioural contract )
| Module | Surface (for consumers) | Notes |
|---|---|---|
| auth | `useAuth()`, `signIn`, `signOut`, `requireRole(role)` | provider-wrapped; hooks read AuthStore |
| progress | `useProgress()`, `awardXp(n)`, `bumpStreak()`, `getDashboard()` | mutations funnel XP/streak into one store |
| chat | `useChat(opts)`, autofocus focusArea | streaming; see §4 |
| live | `useLiveConversation(opts)` | see `10-LIVE-CONVERSATION.md` |
| courses | `useCourses(filters)`, `useCourse(id)`, `enroll(id)`, `useLessonProgress(id)` | reads via supabase-js |
| assessment | `startAssessment(type)`, `submitTask(...)`, `useProficiency()` | orchestrates sessions + tasks |
| progression | `evaluateModuleAccess(userId, moduleId)` | uses progression rules |
| vocabulary | `addWord`, `dueReview()`, `markReviewed(id, correct)` | spaced review |
| admin | `useAdminUsers`, `useAdminCourses`, `broadcastNotification`, `courseWizard()` | role-guarded |
| notifications | `useNotifications()` + Realtime subscription | in-app inbox |

### 2.3 Routing
- `/` Dashboard; `/chat`; `/enhanced-chat`; `/live`; `/courses`; `/courses/:id`; `/lessons/:id`; `/vocabulary`; `/grammar`; `/assessment`; `/assessment/test`; `/profile`; `/settings`.
- `/auth/login|signup|callback`; `/admin/*` (separate chrome: no student sidebar).
- `<ProtectedRoute role>` wraps private routes; redirects to `/auth/login` with return path; admin routes require `instructor+`.

### 2.4 App bootstrap
1. `AppConfig.validate()` — warn (not crash) on missing env; never hard-fail so offline still works.
2. Hydrate UI store (theme, locale) → `document.documentElement` classes.
3. `supabase.auth.getSession()` → AuthStore. If unauthenticated and on private route → redirect.
4. If session present → fetch `user_profiles` (call `create_missing_user_profile()` if 404/empty) → ProgressStore hydrate (DB or offline fallback).
5. Subscribe Realtime for notifications.
6. `setReady(true)` (≤ 1.5s minimum loader for UX).

## 3. Data access layer

### 3.1 Supabase client (single)
`shared/api/supabase.ts` exports one `supabase` client built from `import.meta.env.VITE_SUPABASE_URL/ANON_KEY`, auth session auto-injected. All feature services import this. **No service-role key ever** in the renderer. Edge Functions hold the service-role key.

### 3.2 Local store (offline-first)
- Desktop: main process owns `local-storage.json` in `userData`; renderer calls via `lingoraAPI.cache.*`. Serialized writes (queue + lock + backup + corruption repair) — pattern retained from the baseline and improved (no global JSON sanitisation that strips quotes indiscriminately; instead, validate with a schema on read).
- Web: adapter over IndexedDB (Dexie) implementing the same `lingoraAPI.cache.*` interface.
- Default structure: `{ profiles, progress, sessions, vocabulary, conversations, settings, syncQueue, lastSync, version }`.
- Sync service: drain `syncQueue` with retry (exponential, 3 attempts); conflicts resolved by `updated_at` (cloud wins; if local newer, server upserts). Live ("soft") plurality: never block reads on offline state; show a subtle "offline" banner.

### 3.3 Service functions (signatures)
```ts
// shared/api/progress.ts
getDashboard(): Promise<Dashboard>                       // aggregates xp, streak, current course, recent sessions
awardXp(userId: string, amount: number): Promise<void>
bumpStreak(userId: string): Promise<void>
updateUserProgress(userId: string, patch: ProgressPatch): Promise<void>

// shared/api/courses.ts
listCourses(filters: CourseFilters): Promise<Course[]>
getCourse(id: string): Promise<Course | null>
enroll(courseId: string): Promise<Enrollment>
getLessonProgress(lessonId: string): Promise<LessonProgress>
completeLesson(lessonId, { score, timeSpentMin, xp }): Promise<void>

// shared/api/assessment.ts
startAssessment(type: 'initial'|'periodic'|'placement', language: string): Promise<AssessmentSessionId>
submitTask(taskId, { response?, audioUrl? }): Promise<TaskResult>
finalizeAssessment(sessionId): Promise<ProficiencyProfile>

// shared/api/vocabulary.ts
addWord(w: VocabIn): Promise<Vocab>
dueReview(limit=20): Promise<Vocab[]>
markReviewed(id, correct): Promise<void>           // mastery += correct?1:0; last_reviewed=now
```

### 3.4 Domain algorithm — CEFR leveling & content adaptation
Used by chat and content delivery to keep outputs at the learner's band:
```
cefrLevels = ['A1','A2','B1','B2','C1','C2']
fk  = FleschKincaid(text)                       // 0..100, higher = easier
currentCEFR = fk>=90?A1 : fk>=80?A2 : fk>=70?B1 : fk>=60?B2 : fk>=30?C1 : C2
if currentCEFR > target: simplifyText(text, target)   // AI-backed w/ text_simplifications cache
```
`unifiedLevelService` (TS port of the baseline) implements `calculateFleschKincaid`, `determineCEFRLevel`, `simplifyText`. Real simplification (sentence-splitting + synonym substitution) is AI-assisted and cached in `text_simplifications(original_text_hash, target_cefr_level)`. In v1 the naive fallback is acceptable; the AI path is the upgrade.

### 3.5 Progression engine
`evaluateModuleAccess(userId, moduleId)`:
1. Fetch module + `progression_rules` where `target_module_id = moduleId` and `is_active`.
2. Fetch user's `user_module_progress` for the module's `prerequisites` (all must be `completed`).
3. For each rule dispatch by `rule_type`:
   - `prerequisite` → each listed module's `completion_percentage ≥ min` (default 100).
   - `score_threshold` → previous module's `best_score ≥ min_score`.
   - `conversation_requirement` → recent `conversation_engagement` sums to `min_turns` and avg `engagement_score ≥ min`.
   - `time_gate` → days-since-enrollment ≥ min and total study hours ≥ min.
4. Return `{ allowed, unmet: Rule[] }`; on allowed, flip the locked module to `available`.

### 3.6 Gamification math
- `level = floor(total_xp / 100) + 1`; thresholds at 100·(n−1).
- Streak: `if last_activity_date == today−1 → +1; == today → unchanged; else → 1`. Keep one sequencer (the `sync_user_progress_columns` trigger pattern) to avoid the dual-column drift the baseline had — **do not maintain two parallel column sets**; pick `current_level`/`total_xp`/`daily_streak` and drop the aliases.

## 4. Chat service design

```ts
type ChatStreamItem = { chunk?: string; fullResponse?: string; audioData?: AudioBlob; done: boolean }
interface ChatService {
  send(text: string, opts: { focusArea; userLevel; language; sessionId }): Promise<{
    success: boolean; stream?: AsyncIterable<ChatStreamItem>; response?: string; error?: string; provider: string
  }>
}
```
Implementation order against `09-AI-INTEGRATION.md`:
1. Edge Function `process-gemini-chat` (streaming SSE) — preferred (server holds key, runs RLS-scoped persistence).
2. On network failure → direct `@google/genai` streaming in renderer with `VITE_GEMINI_API_KEY`.
3. On Gemini error/prohibited → canned safe response; surface provider in UI.
Persistence of each assistant turn → `conversation_history` (must exist; baseline wrote to a phantom table).

## 5. Live voice subsystem design
Summarised here, fully spec'd in `10-LIVE-CONVERSATION.md`:
- `GenAILiveClient` wraps `@google/genai` `live.connect`; emits `open/content/audio/interrupted/turncomplete/error/close`.
- `useLiveAPI` owns the client + `AudioStreamer` (Web Audio, PCM16 24kHz queue, 50ms initial buffer) + volume worklet.
- `useLiveConversation` is the public hook: modes `direct | relay`; `sendUtterance(text)`; `startListening/stopListening` (STT).
- Direct playback: model PCM chunks → `AudioStreamer.addPCM16` → scheduled buffers. Relay: TTS blob → L16→WAV → `Audio()`.
- Session persistence: start session on connect (insert `live_conversation_sessions`), write turns to `live_conversation_messages`, finalize (ended_at + duration trigger) on disconnect.

## 6. Electron main design

### 6.1 Handler domains (`src/main/ipc/`)
- `ai.*` — generateResponseStream, startLiveSession, sendLiveMessage (server-side fallback only; renderer usually calls Gemini directly).
- `audio.*` — analyze (pronunciation), play (native).
- `speech.*` — startRecording/stopRecording (native mic capture when browser STT denied).
- `db.*` — cache reads/writes, persistConversationTurn, updateUserProgress, getSettings.
- `window.*` — minimize/maximize/close; `main.*` — get version/getEnv('public').
- `settings.*` — theme, persisted via local store.

### 6.2 Local store service
`LocalStoreService` (Node): `initialize`, `read`, `write` (queued+locked), `getStats`, `export/import`, `addToSyncQueue`. Same interface shape as the web adapter.

### 6.3 Secrets handling
`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` loaded from `.env` in main only. Never serialized to renderer. Methods that need server-side AI (`ai.*` fallbacks) use them here.

## 7. Preload bridge design
- `contextBridge.exposeInMainWorld('lingoraAPI', { ... })`. Methods listed in `11-IPC-CONTRACT.md`.
- Each method `(channel, ...args) => ipcRenderer.invoke(channel, ...args)`; channels are a frozen allow-list.
- One generated TypeScript file in `shared/` declares both `LingoraAPI` interface and the channel name map; main's `ipcMain.handle` and preload's invoke import the same names.

## 8. Edge function design
Each function in `08-SUPABASE-EDGE-FUNCTIONS.md`. Common shape:
```
OPTIONS → 204 (reflect Origin, allow methods/headers)
POST  → body → verify auth (Supabase JWT via authorization header) → call Gemini → respond SSE or JSON
        on error → structured { ok:false, error, code } with appropriate HTTP status
```
- `process-gemini-chat` — REST Gemini; persists to `conversation_history` via service-role (verified auth → resolve user_id).
- `process-live-conversation` — SDK streaming + parallel TTS; SSE.
- `transcribe-audio` — provider STT (Google/Deepgram/AssemblyAI) with browser fallback noted.

## 9. Admin/authoring design
- Course wizard: multi-step (details → syllabus → terms → lessons → materials → publish). Server action: `upsert_lessons_with_materials(course_id, lessons)` SECURITY DEFINER (atomic material upsert).
- Notifications: `admin_dispatch_notification(...)` to fan out to all/course/user, with Realtime broadcast on the user channel.
- Role gating: `user_roles` table; check via helper `hasRole(user, role)` backed by a Postgres function `is_admin()/has_role()`.

## 10. i18n design
- Catalogs per locale under `shared/i18n/{en,es,fr}.ts`.
- `t(key, vars?)` with ICU `{name}` interpolation; `useLocale()` hook backed by UIStore.
- Server strings (AI prompts) are parameterised, not translated.
- The `lang` attribute on `<html>` updates with locale; live voice `speechConfig` language follows locale where supported.

## 11. Theming
- Tokens (see `05-DESIGN-SYSTEM.md`) written as CSS variables on `:root` and `[data-theme=dark]`. Tailwind extends the same tokens. Toggle persists via `settings.theme` (default `system` → resolve to light/dark + `prefers-color-scheme` listener).

## 12. Error & logging design
- Renderer logger: `log.{debug,info,warn,error}` with redaction of JWTs/keys; levels gated by `VITE_APP_ENV`.
- All IPC handlers return `{ ok, data?, error? }`; renderer surfaces errors via Toast store + in-context messages (never `alert`).
- Sentry/OTel optional, behind a flag; PII scrubbed.

## 13. Testing surfaces (cross-ref `14-TESTING-STRATEGY.md`)
- Unit: services, stores, pure functions (cefr/inference, progression, audio helpers).
- Integration: supabase-js against a local Postgres/Supabase container (seeded) for services; MSW for Gemini HTTP in chat tests.
- Component: RTL on design system + key feature components; axe assertions on shell.
- E2E: Playwright (`_electron` for desktop, web for deploy) — signup → assessment → chat → lesson → live(text path) → certificate.

## 14. Type & code conventions
- `strict: true`; `noUncheckedIndexedAccess`; no `any` (with `// reason:` exception).
- Route handlers/services are async; errors thrown are typed (`AppError(code, message)`).
- DB row types generated from the schema via `supabase gen types` into `shared/api/db.types.ts`; services use them.
- Tailwind utility-first; complex rules become a component with a token mapping, not arbitrary values.

## 15. Sequence: feature complete-definition (reference)

```
A learner finishes a lesson, then a live session:
  completeLesson(id,{score,time,xp}) ->
     PATCH user_lesson_progress (RLS) -> if status=completed -> progressionService.unlockNext ->
     awardXp -> ProgressStore hydrate -> Realtime notif "Lesson complete"
  startLive() -> insert live_conversation_sessions (is_active=true) -> direct connect -> turns -
     Whenever model turn completes, insert live_conversation_messages(type=assistant)
  endLive() -> update session(ended_at) -> duration trigger fires -> ProgressStore.sync
```
