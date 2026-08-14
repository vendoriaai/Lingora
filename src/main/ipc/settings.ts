import { ipcMain } from 'electron';
import { CHANNEL, ok } from '@shared/ipc/contract';
import { readKey, writeKey } from '../local-store';
import type { Theme } from '@shared/types';

export function registerSettingsHandlers(): void {
  ipcMain.handle(CHANNEL.settings_setTheme, async (_evt, theme: Theme) => {
    await writeKey('theme', theme);
    return ok(undefined);
  });
  ipcMain.handle(CHANNEL.settings_getTheme, async () =>
    ok(((await readKey('theme')) as Theme | null) ?? 'system'),
  );
  ipcMain.handle(CHANNEL.settings_set, async (_evt, userId: string, key: string, value: unknown) => {
    await writeKey(`settings:${userId}:${key}`, value);
    return ok(undefined);
  });
  ipcMain.handle(CHANNEL.settings_get, async (_evt, key: string) => ok(await readKey(key)));
  ipcMain.handle(CHANNEL.settings_getAi, async () =>
    ok({
      textModel: process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash',
      liveModel: process.env.GEMINI_LIVE_MODEL ?? 'gemini-2.5-flash-exp',
      ttsModel: process.env.GEMINI_TTS_MODEL ?? 'gemini-2.5-flash-preview-tts',
      sttProvider: (process.env.STT_PROVIDER as 'browser') ?? 'browser',
      focusArea: 'default',
    }),
  );
}
