import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The production build is served from https://<user>.github.io/make-it-green/,
// so it needs that sub-path. Local dev stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/make-it-green/' : '/',
  plugins: [react()],
  server: { port: 5174, strictPort: true },
}));
