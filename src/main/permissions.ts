/**
 * Mic permission flow — Electron/darwin permissions via the system handler.
 * On web, the browser MediaDevices permission prompt is used instead.
 * Source: docs/16-SECURITY.md, docs/10-LIVE-CONVERSATION.md.
 */
import { systemPreferences, type BrowserWindow } from 'electron';

export async function ensureMicPermission(): Promise<boolean> {
  if (process.platform === 'darwin') {
    // macOS: 'microphone' status can be inspected; we don't auto-prompt.
    const status = systemPreferences.getMediaAccessStatus('microphone');
    if (status === 'granted') return true;
    return systemPreferences.askForMediaAccess('microphone');
  }
  // Win/Linux: permissions are granted at the session level per-origin.
  return true;
}

// window arg kept for future session.setPermissionRequestHandler wiring.
export function attachPermissionHandler(_win: BrowserWindow): void {
  // Permission handler is wired by createWindow in Phase 5 with live voice.
}
