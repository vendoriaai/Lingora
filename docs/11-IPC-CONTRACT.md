# 11 — Electron IPC Contract

The single, typed surface the renderer is allowed to use on the desktop build. Forbidden: any raw `ipcRenderer`, any `require`, `process`, or filesystem access in the renderer. The web build implements the **same** `LingoraAPI` interface via an adapter (fetch → Edge Functions, IndexedDB → cache). Features must be designed against this interface, not against Electron.

---

## 1. Source of truth

A generated TypeScript module `shared/ipc/contract.ts` declares both:
1. The `LingoraAPI` interface (what the renderer imports).
2. The frozen channel-name map `CHANNEL` (what `ipcMain.handle` registers and what `contextBridge` invokes).

Build step: an ESLint rule forbids literal channel strings outside this module. Main + preload import the same names so renames typecheck-break.

```ts
// shared/ipc/contract.ts
export const CHANNEL = {
  ai_generateStream:  'ai:generateResponseStream',
  ai_liveStart:        'ai:startLiveSession',
  ai_liveSend:         'ai:sendLiveMessage',
  audio_analyze:       'audio:analyze',
  audio_playNative:    'audio:playNative',
  speech_startRec:     'speech:startRecording',
  speech_stopRec:      'speech:stopRecording',
  db_persistTurn:      'db:persistConversationTurn',
  db_updateProgress:   'db:updateUserProgress',
  db_getProgress:      'db:getUserProgress',
  cache_read:          'cache:read',
  cache_write:         'cache:write',
  cache_export:        'cache:export',
  cache_import:        'cache:import',
  settings_setTheme:   'settings:setTheme',
  settings_getTheme:   'settings:getTheme',
  settings_set:        'settings:set',
  settings_get:        'settings:get',
  settings_getAi:      'settings:getAiSettings',
  window_min:          'window:minimize',
  window_max:          'window:maximize',
  window_close:        'window:close',
  window_toggleMax:    'window:toggleMaximize',
  main_version:        'app:getVersion',
  main_publicEnv:      'app:getPublicEnv',
} as const;

export type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };
```

Every channel asserts on arguments via a zod schema on the main side (skippable only when the cost is provably negligible); failures return `{ ok:false, error:{code:'bad_args', message} }`. Never throw across the boundary.

## 2. `LingoraAPI` interface (renderer-facing)

```ts
export interface LingoraAPI {
  ai: {
    generateResponseStream(req: ChatReq): Promise<Result<StreamHandle>>;   // stream handle with async-iterable + cancel()
    startLiveSession(opts: LiveSessionOpts): Promise<Result<{ sessionId: string }>>;
    sendLiveMessage(sessionId: string, message: string): Promise<Result<void>>;
  };
  audio: {
    analyze(audioData: ArrayBuffer, targetText: string): Promise<Result<PronReport>>;
    playNative(url: string): Promise<Result<void>>;
  };
  speech: {
    startRecording(): Promise<Result<void>>;
    stopRecording(): Promise<Result<Blob>>;
  };
  db: {
    persistConversationTurn(payload: PersistTurn): Promise<Result<void>>;
    updateUserProgress(userId: string, patch: ProgressPatch): Promise<Result<void>>;
    getUserProgress(userId: string): Promise<Result<UserProgress>>;
  };
  cache: {
    read<T>(key: string): Promise<Result<T | null>>;
    write<T>(key: string, value: T): Promise<Result<void>>;
    export(): Promise<Result<BackupBlob>>;
    import(blob: BackupBlob): Promise<Result<void>>;
  };
  settings: {
    setTheme(theme: 'system'|'light'|'dark'): Promise<Result<void>>;
    getTheme(): Promise<Result<'system'|'light'|'dark'>>;
    set(userId: string, key: string, value: unknown): Promise<Result<void>>;
    get<T>(key: string): Promise<Result<T | null>>;
    getAiSettings(): Promise<Result<AiSettings>>;
  };
  window: {
    minimize(): Promise<Result<void>>;
    maximize(): Promise<Result<void>>;
    toggleMaximize(): Promise<Result<void>>;
    close(): Promise<Result<void>>;
  };
  main: {
    getVersion(): Promise<Result<string>>;
    getPublicEnv(): Promise<Result<Record<string,string>>>;   // ONLY VITE_-prefixed values
  };
  // event listeners (push) — renderer subscribes; preload attaches ipcRenderer.on
  on: {
    themeChanged(cb: (t: 'light'|'dark') => void): Unsubscribe;
    notification(cb: (n: NotificationInboxItem) => void): Unsubscribe;
  };
}
```
`Unsubscribe = () => void`. Push channels use dedicated event names (`event:themeChanged`, `event:notification`) and a sanitised callback bridge (no objects crossing that aren't ours).

```ts
type ChatReq = {
  message: string; sessionId?: string;
  userLevel?: string; focusArea?: FocusArea; language?: string;
  history?: Array<{ role: 'user'|'assistant'; content: string }>;
  streaming?: boolean;
}
type StreamHandle = { stream: AsyncIterable<StreamItem>; cancel(): void; sessionId: string }
type StreamItem = { chunk?: string; fullResponse?: string; audioData?: AudioBlob; done: boolean }
type LiveSessionOpts = { userLevel?: string; focusArea?: FocusArea; language?: string; mode?: 'direct'|'relay'; voice?: string }
type PersistTurn = { userId: string; sessionId?: string; role: 'user'|'assistant'|'system'; content: string; focusArea?: FocusArea; metadata?: Record<string, unknown> }
```

## 3. Preload implementation (exact pattern)

```ts
import { contextBridge, ipcRenderer } from 'electron';
import { CHANNEL, Result } from '../shared/ipc/contract';
import { z } from 'zod';

const invoke = <T>(ch: string, ...args: unknown[]) => ipcRenderer.invoke(ch, ...args) as Promise<Result<T>>;

contextBridge.exposeInMainWorld('lingoraAPI', {
  ai: {
    generateResponseStream: (req) => invoke(CHANNEL.ai_generateStream, req),
    startLiveSession:  (opts) => invoke(CHANNEL.ai_liveStart, opts),
    sendLiveMessage:  (sid, msg) => invoke(CHANNEL.ai_liveSend, sid, msg),
  },
  audio: {
    analyze: (d, t) => invoke(CHANNEL.audio_analyze, d, t),
    playNative: (url) => invoke(CHANNEL.audio_playNative, url),
  },
  speech: {
    startRecording:  () => invoke(CHANNEL.speech_startRec),
    stopRecording:   () => invoke(CHANNEL.speech_stopRec),
  },
  db: {
    persistConversationTurn: (p) => invoke(CHANNEL.db_persistTurn, p),
    updateUserProgress:      (u, patch) => invoke(CHANNEL.db_updateProgress, u, patch),
    getUserProgress:         (u) => invoke(CHANNEL.db_getProgress, u),
  },
  cache: {
    read:  (k) => invoke(CHANNEL.cache_read, k),
    write: (k, v) => invoke(CHANNEL.cache_write, k, v),
    export: () => invoke(CHANNEL.cache_export),
    import: (b) => invoke(CHANNEL.cache_import, b),
  },
  settings: {
    setTheme: (t) => invoke(CHANNEL.settings_setTheme, t),
    getTheme: () => invoke(CHANNEL.settings_getTheme),
    set: (uid, k, v) => invoke(CHANNEL.settings_set, uid, k, v),
    get: <T>(k: string) => invoke<T|null>(CHANNEL.settings_get, k),
    getAiSettings: () => invoke(CHANNEL.settings_getAi),
  },
  window: {
    minimize: () => invoke(CHANNEL.window_min),
    maximize: () => invoke(CHANNEL.window_max),
    toggleMaximize: () => invoke(CHANNEL.window_toggleMax),
    close: () => invoke(CHANNEL.window_close),
  },
  main: {
    getVersion: () => invoke(CHANNEL.main_version),
    getPublicEnv: () => invoke(CHANNEL.main_publicEnv),
  },
  on: {
    themeChanged: (cb) => {
      const h = (_e: unknown, t: 'light'|'dark') => cb(t);
      ipcRenderer.on('event:themeChanged', h);
      return () => ipcRenderer.off('event:themeChanged', h);
    },
    notification: (cb) => {
      const h = (_e: unknown, n: any) => cb(n);
      ipcRenderer.on('event:notification', h);
      return () => ipcRenderer.off('event:notification', h);
    },
  },
} satisfies LingoraAPI);
```

## 4. Main-side handler shape

```ts
import { ipcMain, app, BrowserWindow } from 'electron';
import { CHANNEL } from '../shared/ipc/contract';

ipcMain.handle(CHANNEL.ai_generateStream, async (evt, req: ChatReq) => {
  try { checkSchema(req); /* stream via service-role Gemini */; return { ok:true, data: StreamHandle }; }
  catch (e) { return { ok:false, error: { code: codeOf(e), message: msg(e) } }; }
});
```
Each handler validates with zod, performs the privileged work (server-side Gemini, local-store IO, native window controls), and returns `Result<T>`. PII/keys never logged. Service-role key only here.

### Handler groups (`src/main/ipc/`)
- `src/main/ipc/ai.ts` — direct-call fallback (server-side) when renderer's bearer fallback is suppressively disabled; reads `GEMINI_API_KEY`. (The renderer usually does its own direct fallback; this is for cases where a server-side path is preferred, e.g., no browser-safe key at all.)
- `main/ipc/audio.ts` — pronunciation analysis (compute similarity vs targetText), native audio playback fallback.
- `main/ipc/speech.ts` — native mic capture when browser STT denied (writes WAV to temp dir).
- `main/ipc/db.ts` + `main/local-store/` — the offline cache; the calls in `db.*` and `cache.*` actually go to local-storage, not the cloud (the cloud is reached via supabase-js in feature services directly — do not proxy Postgres through IPC).
- `main/ipc/settings.ts` — theme persists to local store; env get returns only `VITE_*` values.
- `main/ipc/window.ts` — wrap `BrowserWindow` controls.

## 5. Web adapter (parity)

`shared/api/lingora-api.web.ts` implements `LingoraAPI`:
- `ai.generateResponseStream` → `fetch('/functions/v1/process-gemini-chat', {stream})` returning an async-iterable SSE reader.
- `cache.*` → Dexie/IndexedDB with the same key model.
- `settings.setTheme/getTheme` → localStorage.
- `main.getPublicEnv` → `import.meta.env`.
- `window.*`, `audio.playNative`, `speech.*` → fall back to no-ops / browser equivalents (the browser can do its own `speechSynthesis`/`SpeechRecognition`; no native window chrome).

Detection: `const isElectron = typeof (window as any).lingoraAPI !== 'undefined';`. If present, use it; else use the web adapter. A single `getLingoraAPI(): LingoraAPI` helper returns the right one.

## 6. New-handler checklist (the gate an AI/PR must pass)

1. Add the channel name to `CHANNEL` (typed constant).
2. Add the method to the `LingoraAPI` interface.
3. Implement it in preload (call sites use `CHANNEL.x`).
4. Register `ipcMain.handle(CHANNEL.x, ...)` with zod validation + `Result`.
5. Implement adapter equivalent in the web adapter (or document why desktop-only — add a `// desktop-only` marker + a clear degraded web state).
6. Add a test: main-handler unit (returns `ok:false` on bad input; `ok:true` on a mock).

## 7. Security / hardening

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity` true in production.
- Channel allow-list enforced both sides (preload only invokes names from `CHANNEL`; main only handles names from `CHANNEL`).
- `main.getPublicEnv()` surfaces **only** key names starting with `VITE_`; everything else (service-role, `GEMINI_API_KEY`) stays in main.
- No object graphs cross with functions / prototypes — only JSON-serialisable payloads. Never `remote` or `enableRemoteModule` (removed in modern Electron anyway).
- CSP in production tighten `child-src`/`connect-src` to Supabase + Gemini origins; dev relaxes for HMR.
