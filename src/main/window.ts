/**
 * BrowserWindow factory — Lingora.
 * contextIsolation:true, nodeIntegration:false, sandbox:true (02 §2, 16 §1).
 * Production sets a strict CSP; dev relaxes it for the Vite/HMR origin.
 */
import { join } from 'node:path';

import { app, BrowserWindow, shell, session } from 'electron';

import { registerAllIpc } from './ipc/registry';
import { initLocalStore } from './local-store';
import { attachPermissionHandler } from './permissions';

const DEV_SERVER = `http://localhost:${process.env.VITE_DEV_PORT ?? '5173'}`;
const isDev = !app.isPackaged;

let mainWin: BrowserWindow | null = null;

const PROD_CSP = [
  "default-src 'self'",
  // Supabase (REST/RT) + Gemini REST/Live WS + preflight.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com",
  "media-src blob: 'self' https://*.supabase.co",
  // Avatars + course covers + supplier previews.
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
].join('; ');

const DEV_CSP = [
  "default-src 'self'",
  // Allow Vite HMR + eval source maps in dev.
  "connect-src 'self' http://localhost:* ws://localhost:* https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com",
  "media-src blob: 'self' https://*.supabase.co",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "script-src 'self' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
].join('; ');

export async function createWindow(): Promise<BrowserWindow> {
  // GPU bypass for machines where hw-accel crashes (12 §5).
  if (process.env.DISABLE_GPU === 'true') app.disableHardwareAcceleration();

  await initLocalStore();
  attachPermissionHandler(null as never); // wired per-window in Phase 5

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 768,
    minHeight: 600,
    show: false,
    backgroundColor: '#0B1020',
    title: 'Lingora',
    autoHideMenuBar: true,
    // Security (16 §1): contextIsolation on, nodeIntegration off, sandbox on.
    webPreferences: {
      preload: join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      // Limit permissions we don't need: geolocation, camera by default off;
      // mic requested explicitly via ensureMicPermission (Phase 5).
      safeDialogs: true,
    },
  });

  registerAllIpc();

  // Strict CSP on the default session.
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [isDev ? DEV_CSP : PROD_CSP],
      },
    });
  });

  // External links open in the OS browser, never in-app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    await win.loadURL(DEV_SERVER);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    await win.loadFile(join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    if (mainWin === win) mainWin = null;
  });
  mainWin = win;
  return win;
}

export function getMainWin(): BrowserWindow | null {
  return mainWin;
}
