/**
 * Electron main — Lingora bootstrap.
 * Source: docs/02-TAD §2, docs/13-PROJECT-STRUCTURE.
 */
import { app, BrowserWindow } from 'electron';

import { createWindow } from './window';

// Single-instance lock so opening a second Lingora .exe focuses the running one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  for (const w of BrowserWindow.getAllWindows()) {
    if (w.isMinimized()) w.restore();
    w.focus();
  }
});

// Lingora:// deep link — OAuth redirect scheme registered in electron-builder.
app.setAsDefaultProtocolClient('Lingora');
app.on('open-url', (e, url) => {
  e.preventDefault();
  // Wired in Phase 1 to forward the auth callback to the renderer.
  void url;
});

app.whenReady().then(() => {
  void createWindow().catch((e) => {
    console.error('[lingora:main] window creation failed', e);
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
}).catch((e) => console.error('[lingora:main] whenReady failed', e));

app.on('window-all-closed', () => {
  // macOS convention: stay alive until explicit Cmd+Q.
  if (process.platform !== 'darwin') app.quit();
});
