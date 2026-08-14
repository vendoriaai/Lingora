// db.* goes to local-storage cache (NOT cloud). Cloud is reached directly via
// supabase-js in feature services (11 §1.6). Persist + progress land in Phase 2.
import { ipcMain } from 'electron';
import { CHANNEL, err } from '@shared/ipc/contract';
import { readKey, writeKey } from '../local-store';

export function registerDbHandlers(): void {
  ipcMain.handle(CHANNEL.db_persistTurn, async (_evt, payload: unknown) => {
    const q = (await readKey('__turn_queue')) as unknown[] | undefined;
    await writeKey('__turn_queue', [...(q ?? []), payload]);
    return err('not-implemented', 'db.persistConversationTurn queued — Edge Function persistence lands in Phase 2');
  });
  ipcMain.handle(CHANNEL.db_updateProgress, async (_evt, _userId: unknown, _patch: unknown) =>
    err('not-implemented', 'db.updateUserProgress stub — Phase 2'),
  );
  ipcMain.handle(CHANNEL.db_getProgress, async (_evt, _userId: unknown) =>
    err('not-implemented', 'db.getUserProgress stub — Phase 2'),
  );
}
