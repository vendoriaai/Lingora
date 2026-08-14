/**
 * Preload — Lingora. Exposes ONE typed object `window.lingoraAPI` via
 * contextBridge. Each method maps to a named, allow-listed IPC channel from
 * the contract. No raw `ipcRenderer` ever escapes the sandbox.
 *
 * Source: docs/11-IPC-CONTRACT.md, docs/02-TAD §2.
 */
import { contextBridge, ipcRenderer } from 'electron';

import { CHANNEL, EVENT, type LingoraAPI } from '@shared/ipc/contract';

import type { NotificationInboxItem } from '@shared/types';

/** Marshals an async IPC channel into a `Promise<Result<T>>`. */
function invoke<T = unknown>(channel: string): (...args: unknown[]) => Promise<T> {
  return (...args: unknown[]) => ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const api: LingoraAPI = {
  ai: {
    generateResponseStream: invoke(CHANNEL.ai_generateStream),
    startLiveSession: invoke(CHANNEL.ai_liveStart),
    sendLiveMessage: invoke(CHANNEL.ai_liveSend),
  },
  audio: {
    analyze: invoke(CHANNEL.audio_analyze),
    playNative: invoke(CHANNEL.audio_playNative),
  },
  speech: {
    startRecording: invoke(CHANNEL.speech_startRec),
    stopRecording: invoke(CHANNEL.speech_stopRec),
  },
  db: {
    persistConversationTurn: invoke(CHANNEL.db_persistTurn),
    updateUserProgress: invoke(CHANNEL.db_updateProgress),
    getUserProgress: invoke(CHANNEL.db_getProgress),
  },
  cache: {
    read: invoke(CHANNEL.cache_read),
    write: invoke(CHANNEL.cache_write),
    export: invoke(CHANNEL.cache_export),
    import: invoke(CHANNEL.cache_import),
  },
  settings: {
    setTheme: invoke(CHANNEL.settings_setTheme),
    getTheme: invoke(CHANNEL.settings_getTheme),
    set: invoke(CHANNEL.settings_set),
    get: invoke(CHANNEL.settings_get),
    getAiSettings: invoke(CHANNEL.settings_getAi),
  },
  window: {
    minimize: invoke(CHANNEL.window_min),
    maximize: invoke(CHANNEL.window_max),
    toggleMaximize: invoke(CHANNEL.window_toggleMax),
    close: invoke(CHANNEL.window_close),
  },
  main: {
    getVersion: invoke(CHANNEL.main_version),
    getPublicEnv: invoke(CHANNEL.main_publicEnv),
  },
  on: {
    themeChanged(cb) {
      const listener = (_e: unknown, t: 'light' | 'dark') => cb(t);
      ipcRenderer.on(EVENT.themeChanged, listener);
      return () => ipcRenderer.off(EVENT.themeChanged, listener);
    },
    notification(cb) {
      const listener = (_e: unknown, n: NotificationInboxItem) => cb(n);
      ipcRenderer.on(EVENT.notification, listener);
      return () => ipcRenderer.off(EVENT.notification, listener);
    },
  },
};

contextBridge.exposeInMainWorld('lingoraAPI', api);
