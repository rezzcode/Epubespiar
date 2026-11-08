import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, dirname } from 'path';
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copyHtmlToRoot() {
  return {
    name: 'copy-html-to-root',
    closeBundle() {
      const browser = process.env.BROWSER || 'chrome';
      const distRoot = resolve(__dirname, `dist/${browser}`);

      const mappings = [
        {
          src: resolve(distRoot, 'src/ui/reader/index.html'),
          dest: resolve(distRoot, 'reader.html'),
        },
        {
          src: resolve(distRoot, 'src/ui/side-panel/index.html'),
          dest: resolve(distRoot, 'side_panel.html'),
        },
      ];

      mappings.forEach(({ src, dest }) => {
        if (!existsSync(src)) {
          console.warn(`⚠️ Skipped: source HTML not found: ${src}`);
          return;
        }

        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(src, dest);
      });

      // Cleanup step — remove /src/ui folder safely
      const uiDir = resolve(distRoot, 'src/ui');
      try {
        rmSync(uiDir, { recursive: true, force: true });
      } catch (err) {
        console.warn(`⚠️ Cleanup skipped: ${err.message}`);
      }
    },
  };
}

const NEW_FUNCTION_COERCION = /new Function\(""\s*\+\s*([A-Za-z_$][\w$]*)\)/g;

function patchJszipEval() {
  return {
    name: 'patch-jszip-eval',
    transform(code, id) {
      const normalizedId = id.replace(/\\/g, '/');
      if (!/jszip\/dist\/jszip(\.min)?\.js$/.test(normalizedId)) return null;
      if (!code.includes('new Function')) return null;

      const patched = code.replace(NEW_FUNCTION_COERCION, 'String($1)');
      if (patched.includes('new Function')) {
        this.error(
          'jszip still contains `new Function` after patching — review patchJszipEval() in vite.config.js.'
        );
      }
      return { code: patched, map: null };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const browser = process.env.BROWSER || 'chrome';

  return {
    plugins: [vue(), copyHtmlToRoot(), patchJszipEval()],
    build: {
      outDir: `dist/${browser}`,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          background: resolve(__dirname, './src/background/index.js'),
          side_panel: resolve(__dirname, './src/ui/side-panel/index.html'),
          reader: resolve(__dirname, './src/ui/reader/index.html'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background') return 'src/background.js';
            return 'src/[name].js';
          },
          chunkFileNames: (chunk) => {
            const name = chunk.name.replace('_', 'helper-');
            return `src/${name}.js`;
          },
          assetFileNames: 'assets/[name].[ext]',
          format: 'es',
          inlineDynamicImports: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@assets': resolve(__dirname, './assets'),
      },
    },
  };
});
