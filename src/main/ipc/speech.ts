// speech.* — native mic capture only when Web Speech is unavailable.
import { ipcMain } from 'electron';

import { CHANNEL, err } from '@shared/ipc/contract';

export function registerSpeechHandlers(): void {
  ipcMain.handle(CHANNEL.speech_startRec, async () =>
    err('not-implemented', 'speech.startRecording stub — Phase 5'),
  );
  ipcMain.handle(CHANNEL.speech_stopRec, async () =>
    err('not-implemented', 'speech.stopRecording stub — Phase 5'),
  );
}
