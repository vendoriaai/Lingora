import { ipcMain, BrowserWindow } from 'electron';

import { CHANNEL, err, ok } from '@shared/ipc/contract';

function win(evt: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(evt.sender);
}

export function registerWindowHandlers(): void {
  ipcMain.handle(CHANNEL.window_min, async (evt) => {
    win(evt)?.minimize();
    return ok(undefined);
  });
  ipcMain.handle(CHANNEL.window_max, async (evt) => {
    const w = win(evt);
    if (!w) return err('no-window', 'no BrowserWindow');
    if (!w.isMaximized()) w.maximize(); else w.unmaximize();
    return ok(undefined);
  });
  ipcMain.handle(CHANNEL.window_toggleMax, async (evt) => {
    const w = win(evt);
    if (!w) return err('no-window', 'no BrowserWindow');
    if (w.isMaximized()) w.unmaximize(); else w.maximize();
    return ok(undefined);
  });
  ipcMain.handle(CHANNEL.window_close, async (evt) => {
    win(evt)?.close();
    return ok(undefined);
  });
}
