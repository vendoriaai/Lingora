/**
 * Web adapter — implements the same `LingoraAPI` interface the Electron
 * preload exposes, but backed by Edge Function calls + IndexedDB + localStorage.
 * Use wherever the desktop build uses IPC; the renderer doesn't know which.
 *
 * Source: docs/11-IPC-CONTRACT.md §14 (web adapter parity) and docs/02-TAD §2.
 */
import { CHANNEL, err, ok, type LingoraAPI, type Result } from '@shared/ipc/contract';

import type {
  AiSettings,
  BackupBlob,
  ChatReq,
  LiveSessionOpts,
  PersistTurn,
  PronReport,
  ProgressPatch,
  StreamHandle,
  StreamItem,
  Theme,
  UserProgress,
} from '@shared/types';

/** Fail-soft SSE fetch wrapper — re-used by ai.generateResponseStream + live. */
async function callEdge(functionPath: string, body: unknown, signal?: AbortSignal) {
  const base = import.meta.env.VITE_SUPABASE_URL ?? '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  const url = `${base.replace(/\/$/, '')}/functions/v1/${functionPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify(body),
    signal,
  });
  return res;
}

/** Parse a text/event-stream response body into an async iterable of StreamItem. */
async function* sseStream(res: Response, sessionId: string): AsyncIterable<StreamItem> {
  if (!res.body) {
    yield { done: true, fullResponse: '' };
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        yield { chunk: '', fullResponse: full, done: true };
        return;
      }
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const event = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const dataLine = event
          .split('\n')
          .find((l) => l.startsWith('data:'));
        if (!dataLine) continue;
        const payload = dataLine.slice(5).trim();
        try {
          const obj = JSON.parse(payload) as Partial<StreamItem> & { content?: string };
          const chunk = obj.chunk ?? obj.content ?? '';
          if (chunk) full += chunk;
          yield { chunk, fullResponse: full, done: !!obj.done };
        } catch {
          // Non-JSON SSE chunk; treat as a raw text piece.
          full += payload;
          yield { chunk: payload, fullResponse: full, done: false };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Minimal IndexedDB KV store used by cache.* — a single object store. */
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('lingora-cache', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('kv');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => rejectIdbError(req.error, reject, 'open');
  });
}

/** Wrap a DOMException (the IDB error type) in an Error so Promise rejections
 *  carry a real Error without losing the original `name`/`message`. */
function rejectIdbError(
  err: DOMException | null,
  reject: (e: Error) => void,
  op: string,
): void {
  const wrapped = new Error(`idb ${op} failed: ${err?.message ?? 'unknown error'}`);
  wrapped.name = err?.name ?? 'IDBError';
  if (err) (wrapped as Error & { cause?: unknown }).cause = err;
  reject(wrapped);
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readonly');
    const r = tx.objectStore('kv').get(key);
    r.onsuccess = () => resolve((r.result as T) ?? null);
    r.onerror = () => rejectIdbError(r.error, reject, 'get');
  });
}
async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => rejectIdbError(tx.error, reject, 'put');
  });
}

function lightOrDark(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

export function getWebLingoraAPI(): LingoraAPI {
  const api: LingoraAPI = {
    ai: {
      async generateResponseStream(req: ChatReq): Promise<Result<StreamHandle>> {
        const sessionId = req.sessionId ?? crypto.randomUUID();
        const controller = new AbortController();
        try {
          const res = await callEdge(
            'process-gemini-chat',
            { ...req, sessionId },
            controller.signal,
          );
          if (!res.ok || !res.body) return err('ai_unreachable', `chat HTTP ${res.status}`);
          const stream = sseStream(res, sessionId);
          return ok<StreamHandle>({ stream, sessionId, cancel: () => controller.abort() });
        } catch (e) {
          return err('ai_failed', (e as Error).message);
        }
      },
      async startLiveSession(opts: LiveSessionOpts) {
        try {
          const res = await callEdge('process-live-conversation', { ...opts, start: true });
          if (!res.ok) return err('live_unreachable', `live HTTP ${res.status}`);
          const data = (await res.json()) as { sessionId: string };
          return ok(data);
        } catch (e) {
          return err('live_failed', (e as Error).message);
        }
      },
      async sendLiveMessage(sessionId, message) {
        try {
          const res = await callEdge('process-live-conversation', { sessionId, message });
          if (!res.ok) return err('live_send_failed', `HTTP ${res.status}`);
          return ok(undefined);
        } catch (e) {
          return err('live_send_failed', (e as Error).message);
        }
      },
    },
    audio: {
      // Browser Web Audio analysis is feature-work (Phase 2); stub here.
      async analyze() {
        return err('unsupported_web', 'audio.analyze is desktop-only on web');
      },
      async playNative(url) {
        new Audio(url).play().catch(() => {});
        return ok(undefined);
      },
    },
    speech: {
      // Browser fallback uses Web Speech (see 10-LIVE-CONVERSATION), not IPC.
      async startRecording() {
        return err('unsupported_web', 'Use Web Speech API on web');
      },
      async stopRecording() {
        return err('unsupported_web', 'Use Web Speech API on web');
      },
    },
    db: {
      // On web, Postgres is reached directly by feature services via
      // @supabase/supabase-js — these IPC-named methods cache-queue locally.
      async persistConversationTurn(payload: PersistTurn) {
        await idbSet(`turn:${payload.sessionId ?? 'adhoc'}:${Date.now()}`, payload);
        return ok(undefined);
      },
      async updateUserProgress(_userId: string, patch: ProgressPatch) {
        await idbSet('user_progress_patch', { patch, at: Date.now() });
        return ok(undefined);
      },
      async getUserProgress(userId: string) {
        const cached = await idbGet<UserProgress>('user_progress');
        if (cached) return ok(cached);
        return ok({
          userId,
          language: 'en',
          currentLevel: 1,
          totalXp: 0,
          dailyStreak: 0,
          cefrLevel: null,
          updatedAt: new Date(0).toISOString(),
        });
      },
    },
    cache: {
      async read<T>(key: string) {
        return ok<T | null>(await idbGet<T>(key));
      },
      async write<T>(key: string, value: T) {
        await idbSet(key, value);
        return ok(undefined);
      },
      async export() {
        return ok<BackupBlob>({
          version: 1,
          exportedAt: new Date().toISOString(),
          data: (await idbGet('kv')) ?? {},
        });
      },
      async import(blob: BackupBlob) {
        for (const [k, v] of Object.entries(blob.data)) await idbSet(k, v);
        return ok(undefined);
      },
    },
    settings: {
      async setTheme(theme: Theme) {
        localStorage.setItem('lingora:theme', theme);
        return ok(undefined);
      },
      async getTheme() {
        const t = (localStorage.getItem('lingora:theme') as Theme | null) ?? 'system';
        return ok(t);
      },
      async set(_userId: string, key: string, value: unknown) {
        localStorage.setItem(`lingora:${key}`, JSON.stringify(value));
        return ok(undefined);
      },
      async get<T>(key: string) {
        const raw = localStorage.getItem(`lingora:${key}`);
        return ok<T | null>(raw ? (JSON.parse(raw) as T) : null);
      },
      async getAiSettings() {
        return ok<AiSettings>({
          textModel: 'gemini-2.5-flash',
          liveModel: 'gemini-2.5-flash-exp',
          ttsModel: 'gemini-2.5-flash-preview-tts',
          sttProvider: 'browser',
          focusArea: 'default',
        });
      },
    },
    window: {
      async minimize() {
        return err('unsupported_web', 'window control is desktop-only');
      },
      async maximize() {
        return err('unsupported_web', 'window control is desktop-only');
      },
      async toggleMaximize() {
        return err('unsupported_web', 'window control is desktop-only');
      },
      async close() {
        return err('unsupported_web', 'window control is desktop-only');
      },
    },
    main: {
      async getVersion() {
        return ok(import.meta.env.VITE_APP_ENV ?? '0.1.0-web');
      },
      async getPublicEnv() {
        // Only VITE_-prefixed values ever escape (11 §1.4).
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(import.meta.env)) {
          if (k.startsWith('VITE_') && typeof v === 'string') out[k] = v;
        }
        return ok(out);
      },
    },
    on: {
      themeChanged(cb) {
        const obs = new MutationObserver(() => cb(lightOrDark()));
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => obs.disconnect();
      },
      notification(_cb) {
        // Realtime wiring lands with the notifications feature (Phase 6).
        return () => {};
      },
    },
  };
  return api;
}

// Silence unused-import warning for the channel-name map reference parity check.
void CHANNEL;
