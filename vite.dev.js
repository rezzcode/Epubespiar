import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Development configuration for serving the UI with hot reload
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: './src/ui/reader',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@assets': resolve(__dirname, './assets')
    }
  },
  server: {
    port: 8080,
    open: true
  }
});
