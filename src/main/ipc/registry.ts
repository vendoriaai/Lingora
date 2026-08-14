/**
 * IPC registry — each domain handler imports `CHANNEL` from the contract and
 * registers `ipcMain.handle`. Failures return `Result.err`; handlers never
 * throw across the boundary (11 §1.3).
 *
 * This module registers every domain; main/index.ts calls registerAllIpc().
 */
import { ipcMain } from 'electron';

import { registerAiHandlers } from './ai';
import { registerAudioHandlers } from './audio';
import { registerCacheHandlers } from './cache';
import { registerDbHandlers } from './db';
import { registerMainHandlers } from './main';
import { registerSettingsHandlers } from './settings';
import { registerSpeechHandlers } from './speech';
import { registerWindowHandlers } from './window';

export function registerAllIpc(): void {
  for (const r of [
    registerAiHandlers,
    registerAudioHandlers,
    registerSpeechHandlers,
    registerDbHandlers,
    registerCacheHandlers,
    registerSettingsHandlers,
    registerWindowHandlers,
    registerMainHandlers,
  ]) {
    r();
  }
  ipcMain.on('client-ready', () => {/* renderer attached */});
}
