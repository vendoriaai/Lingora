/**
 * Lingora IPC contract — the SINGLE source of truth for IPC.
 *
 * This module declares:
 *   1. `CHANNEL` — the frozen channel-name map registered in `ipcMain.handle`
 *      and invoked via `contextBridge`. Any channel name used elsewhere MUST
 *      come from here; an ESLint rule bans ambient string channels outside it.
 *   2. `LingoraAPI` — the interface the renderer imports (via window.lingoraAPI
 *      on desktop, the web adapter on web).
 *   3. `Result<T>` — the error envelope; nothing throws across the boundary.
 *
 * Source: docs/11-IPC-CONTRACT.md.
 */
import type {
  AiSettings,
  BackupBlob,
  ChatReq,
  LiveSessionOpts,
  NotificationInboxItem,
  PersistTurn,
  PronReport,
  ProgressPatch,
  StreamHandle,
  Theme,
  Unsubscribe,
  UserProgress,
} from '../types/index.js';

/** Frozen channel-name map. Wire names never used as ambient string literals. */
export const CHANNEL = {
  ai_generateStream: 'ai:generateResponseStream',
  ai_liveStart: 'ai:startLiveSession',
  ai_liveSend: 'ai:sendLiveMessage',

  audio_analyze: 'audio:analyze',
  audio_playNative: 'audio:playNative',

  speech_startRec: 'speech:startRecording',
  speech_stopRec: 'speech:stopRecording',

  db_persistTurn: 'db:persistConversationTurn',
  db_updateProgress: 'db:updateUserProgress',
  db_getProgress: 'db:getUserProgress',

  cache_read: 'cache:read',
  cache_write: 'cache:write',
  cache_export: 'cache:export',
  cache_import: 'cache:import',

  settings_setTheme: 'settings:setTheme',
  settings_getTheme: 'settings:getTheme',
  settings_set: 'settings:set',
  settings_get: 'settings:get',
  settings_getAi: 'settings:getAiSettings',

  window_min: 'window:minimize',
  window_max: 'window:maximize',
  window_toggleMax: 'window:toggleMaximize',
  window_close: 'window:close',

  main_version: 'app:getVersion',
  main_publicEnv: 'app:getPublicEnv',
} as const;

/** Error envelope — every IPC call returns one; never throws (11 §1.3). */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

/** Push/event listener names (dedicated event channels, not in CHANNEL). */
export const EVENT = {
  themeChanged: 'event:themeChanged',
  notification: 'event:notification',
} as const;

/** The renderer-facing API surface. main + preload + web adapter implement this. */
export interface LingoraAPI {
  ai: {
    generateResponseStream(req: ChatReq): Promise<Result<StreamHandle>>;
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
    setTheme(theme: Theme): Promise<Result<void>>;
    getTheme(): Promise<Result<Theme>>;
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
    /** Returns ONLY VITE_-prefixed env values (never secrets). */
    getPublicEnv(): Promise<Result<Record<string, string>>>;
  };
  /** Push/event subscriptions — TypedEventEmitter-like, no objects crossing
   * that aren't ours. */
  on: {
    themeChanged(cb: (t: 'light' | 'dark') => void): Unsubscribe;
    notification(cb: (n: NotificationInboxItem) => void): Unsubscribe;
  };
}

/** Convenience helpers for handlers / callers. */
export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const err = (code: string, message: string): Result<never> => ({
  ok: false,
  error: { code, message },
});
