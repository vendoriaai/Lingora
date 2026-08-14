import { ipcMain } from 'electron';
import { CHANNEL, err } from '@shared/ipc/contract';

export function registerAudioHandlers(): void {
  ipcMain.handle(CHANNEL.audio_analyze, async () =>
    err('not-implemented', 'audio.analyze stub — Phase 2'),
  );
  ipcMain.handle(CHANNEL.audio_playNative, async () =>
    err('not-implemented', 'audio.playNative stub — Phase 2'),
  );
}
