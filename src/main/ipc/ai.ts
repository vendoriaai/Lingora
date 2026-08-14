// ai.* handlers. Direct Gemini client used as server-side fallback only;
// normally the renderer calls the Edge Function (which is RLS+JWT-verified).
import { ipcMain } from 'electron';

import { CHANNEL, err, ok } from '@shared/ipc/contract';

export function registerAiHandlers(): void {
  ipcMain.handle(CHANNEL.ai_generateStream, async (_evt, req: unknown) => {
    // Phase 2 implements streaming SSE from this handler as a server-side edge fallback.
    // For Phase 0 we expose a minimal noop so the renderer can mount the UI.
    void req;
    return err('not-implemented', 'ai.generateResponseStream stub — Phase 2');
  });
  ipcMain.handle(CHANNEL.ai_liveStart, async (_evt, _opts: unknown) =>
    err('not-implemented', 'ai.startLiveSession stub — Phase 5'),
  );
  ipcMain.handle(CHANNEL.ai_liveSend, async (_evt, _sessionId: unknown, _message: unknown) => {
    void ok; // shape parity with other handlers
    return err('not-implemented', 'ai.sendLiveMessage stub — Phase 5');
  });
}
