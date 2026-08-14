import { ipcMain, app } from 'electron';
import { CHANNEL, ok } from '@shared/ipc/contract';

// Return ONLY VITE_-prefixed env values (never secrets — 11 §1.4).
function publicEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('VITE_') && typeof v === 'string') out[k] = v;
  }
  return out;
}

export function registerMainHandlers(): void {
  ipcMain.handle(CHANNEL.main_version, async () => ok(app.getVersion()));
  ipcMain.handle(CHANNEL.main_publicEnv, async () => ok(publicEnv()));
}
