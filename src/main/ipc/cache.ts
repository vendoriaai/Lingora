import { ipcMain } from 'electron';
import { CHANNEL, err, ok } from '@shared/ipc/contract';
import { exportAll, importAll, readKey, writeKey } from '../local-store';

export function registerCacheHandlers(): void {
  ipcMain.handle(CHANNEL.cache_read, async (_evt, key: string) => ok(await readKey(key)));
  ipcMain.handle(CHANNEL.cache_write, async (_evt, key: string, value: unknown) => {
    await writeKey(key, value);
    return ok(undefined);
  });
  ipcMain.handle(CHANNEL.cache_export, async () =>
    ok({ version: 1 as const, exportedAt: new Date().toISOString(), data: await exportAll() }),
  );
  ipcMain.handle(CHANNEL.cache_import, async (_evt, blob: unknown) => {
    const b = blob as { data: Record<string, unknown> };
    if (!b?.data) return err('bad_args', 'cache.import expects { data }');
    await importAll(b.data);
    return ok(undefined);
  });
}
