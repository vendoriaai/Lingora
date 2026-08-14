import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Lingora renderer — the SAME bundle is the Electron renderer and the web SPA.
// Vite serves on :5173 (web dev). In Electron dev, main waits on this port.
const DEV_PORT = Number(process.env.VITE_DEV_PORT ?? 5173);
const isElectronBuild = process.env.BUILD_TARGET === 'electron';

export default defineConfig({
  plugins: [react()],
  // Renderer source is the SPA root; main/preload are bundled separately.
  // Setting root lets the dev server serve index.html at / and resolve
  // ./main.tsx relative to src/renderer.
  root: resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  // Renderer code is browser-bound; the Electron main/preload are bundled separately.
  build: {
    // outDir is resolved relative to `root`, so pin it to the project root.
    outDir: resolve(__dirname, isElectronBuild ? 'dist-electron/renderer' : 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html'),
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          radix: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-toast',
          ],
        },
      },
    },
  },
  server: {
    port: DEV_PORT,
    strictPort: true,
    // Edge Function proxy: in web dev, /functions/v1/* forwards to local Supabase
    // (supabase functions serve) or to the linked cloud project.
    proxy: {
      '/functions/v1': {
        target: process.env.SUPABASE_URL ?? 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/functions\/v1/, '/functions/v1'),
      },
    },
  },
  define: {
    'process.env.IS_ELECTRON': JSON.stringify(isElectronBuild),
  },
  worker: { format: 'es' },
});
