import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/temp',
    emptyOutDir: true,
    lib: {
      entry: resolve(process.cwd(), './src/content/epub-handler.js'),
      name: 'EpubHandler',
      fileName: 'epub-handler',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        extend: true,
        inlineDynamicImports: true
      }
    }
  }
});