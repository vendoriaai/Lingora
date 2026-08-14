/**
 * Returns the LingoraAPI for the current runtime.
 * - Desktop (Electron): the typed object exposed by preload's contextBridge
 *   as `window.lingoraAPI`.
 * - Web: the adapter implementing the same interface over fetch + IndexedDB
 *   + localStorage.
 *
 * Every feature service must call `getLingoraAPI()` rather than touching
 * `window.lingoraAPI` directly — pages never import services except via it.
 */
import { getWebLingoraAPI } from './lingora-api.web';

import type { LingoraAPI } from '@shared/ipc/contract';

declare global {
  interface Window {
    lingoraAPI?: LingoraAPI;
  }
}

let cached: LingoraAPI | null = null;

export function getLingoraAPI(): LingoraAPI {
  if (cached) return cached;
  const desktop = typeof window !== 'undefined' ? window.lingoraAPI : undefined;
  cached = desktop ?? getWebLingoraAPI();
  return cached;
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.lingoraAPI !== 'undefined';
}
