import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, 'server_subscription'),
  mode: 'development',
  server: {
    host: '0.0.0.0',
    port: '9081',
  },
  plugins: [react()],
});
