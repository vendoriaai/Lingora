/**
 * Local store — an Electron-backed JSON cache + offline sync queue.
 * Lives in app.getPath('userData'). Serialized writes (write queue), with
 * backup + corruption recovery. The cloud is reached via supabase-js in
 * feature services directly, never proxied through IPC.
 *
 * Source: docs/02-TAD §3.4, docs/13-PROJECT-STRUCTURE §main/local-store.
 */
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { app } from 'electron';

let storePath = '';
let backupPath = '';
let queue = Promise.resolve<unknown>(undefined);
let cache: Record<string, unknown> = {};

/** Read may run synchronously at startup before the user does anything. */
export async function initLocalStore(): Promise<void> {
  const dir = app.getPath('userData');
  await mkdir(join(dir, 'lingora'), { recursive: true });
  storePath = join(dir, 'lingora', 'store.json');
  backupPath = join(dir, 'lingora', 'store.json.bak');
  await load();
}

async function load(): Promise<void> {
  try {
    const raw = await readFile(storePath, 'utf8');
    cache = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    try {
      const bak = await readFile(backupPath, 'utf8');
      cache = JSON.parse(bak) as Record<string, unknown>;
    } catch {
      cache = {};
    }
  }
}

/** All writes are serialized via a single promise chain (no contention). */
function persist(): Promise<void> {
  const next = queue.then(async () => {
    try {
      // Rotate backup before write: protects against a torn write.
      try {
        await copyFile(storePath, backupPath);
      } catch {
        /* first write — no prior store to back up */
      }
      const tmp = `${storePath}.${randomUUID()}`;
      await writeFile(tmp, JSON.stringify(cache, null, 2), 'utf8');
      await unlink(storePath).catch(() => undefined);
      await (await import('node:fs/promises')).rename(tmp, storePath);
    } catch (e) {
      console.error('[lingora:local-store] persist failed', e);
    }
  });
  queue = next; // advance the chain so subsequent writes serialize
  return next;
}

export async function readKey(key: string): Promise<unknown> {
  return cache[key];
}

export async function writeKey(key: string, value: unknown): Promise<void> {
  cache[key] = value;
  await persist();
}

export async function exportAll(): Promise<Record<string, unknown>> {
  return structuredClone(cache);
}

export async function importAll(data: Record<string, unknown>): Promise<void> {
  cache = structuredClone(data);
  await persist();
}

/** On reconnect, drain queued mutations to Supabase (cloud truth wins).
 *  Wires up in Phase 7; queue records live under `__sync_queue`. */
export function enqueueSync(job: unknown): void {
  const q = (cache['__sync_queue'] as unknown[]) ?? [];
  q.push({ job, at: Date.now() });
  cache['__sync_queue'] = q;
}
