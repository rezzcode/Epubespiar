<template>
  <div ref="host" class="chapter-content-host"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  bookStyles: { type: String, default: '' },
  contentHtml: { type: String, default: '' },
  fontSize: { type: Number, default: 16 }
});

const host = ref(null);
let shadowRootRef = null;
const isDarkMode = ref(false);
let themeObserver = null;
let darkModeMediaQuery = null;
const handleThemeChange = () => {
  isDarkMode.value = detectDarkMode();
};

const detectDarkMode = () => {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const renderShadowContent = () => {
  if (!host.value) return;
  if (!shadowRootRef) {
    shadowRootRef = host.value.attachShadow({ mode: 'open' });
  }

  const darkModeStyles = isDarkMode.value
    ? `
      /** Notes: This would make hylights made not to be visible
       * I would figure something better though, now it does not trade colors in light mode.
      **/
      .chapter-content * {
          background-color: transparent !important;
      }
      .chapter-content,
      .chapter-content p,
      .chapter-content span,
      .chapter-content div,
      .chapter-content li,
      .chapter-content td,
      .chapter-content th,
      .chapter-content h1,
      .chapter-content h2,
      .chapter-content h3,
      .chapter-content h4,
      .chapter-content h5,
      .chapter-content h6 {
        color: var(--text-color, #f5f5f5) !important;
      }

      .chapter-content a {
        color: var(--epub-text-color, #e89c30) !important;
      }

      .chapter-content .syntax-comment {
        color: var(--text-color, #f5f5f5) !important;
      }

      .chapter-content .syntax-string {
        color: var(--text-color, #f5f5f5) !important;
      }

      .chapter-content .syntax-number {
        color: var(--text-color, #f5f5f5) !important;
      }

      .chapter-content .syntax-keyword {
        color: var(--text-color, #f5f5f5) !important;
      }

      .chapter-content .syntax-builtin {
        color: var(--text-color, #f5f5f5) !important;
      }
    `
    : `
      .chapter-content .syntax-comment {
        color: #6a737d;
        font-style: italic;
      }

      .chapter-content .syntax-string {
        color: #0a7d45;
      }

      .chapter-content .syntax-number {
        color: #005cc5;
      }

      .chapter-content .syntax-keyword {
        color: #d73a49;
        font-weight: 600;
      }

      .chapter-content .syntax-builtin {
        color: #6f42c1;
      }
    `;

  const baseStyles = `
    <style>
      .chapter-content {
        font-size: ${props.fontSize}px;
        line-height: 1.7;
      }

      .chapter-content h1,
      .chapter-content h2,
      .chapter-content h3,
      .chapter-content h4,
      .chapter-content h5,
      .chapter-content h6 {
        margin-top: 1.6em;
        margin-bottom: 0.7em;
      }

      .chapter-content p {
        margin-bottom: 1em;
      }

      .chapter-content img,
      .chapter-content svg,
      .chapter-content video,
      .chapter-content canvas {
        max-width: 100%;
        height: auto;
      }

      .chapter-content table {
        width: 100%;
        overflow-x: auto;
        display: block;
      }

      .chapter-content a {
        color: var(--epub-text-color, #10b981);
        text-decoration: none;
      }

      .chapter-content pre {
        padding: 12px 16px;
        border-radius: 6px;
        overflow-x: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.9em;
        margin: 1.2em 0;
        line-height: 1.5;
        background-color: var(--background-color, #f6f8fa);
        border: 1px solid var(--border-color, #d1d5db);
      }

      .chapter-content code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.9em;
        padding: 2px 4px;
        background-color: rgba(175, 184, 193, 0.2);
        border-radius: 4px;
      }

      .chapter-content pre code {
        padding: 0;
        background-color: transparent;
        border-radius: 0;
      }

      ${darkModeStyles}
    </style>
  `;

  shadowRootRef.innerHTML = `${baseStyles}${props.bookStyles || ''}<div class="chapter-content">${props.contentHtml || ''}</div>`;
};

onMounted(() => {
  isDarkMode.value = detectDarkMode();
  darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', handleThemeChange);

  themeObserver = new MutationObserver(handleThemeChange);

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  renderShadowContent();
});

onUnmounted(() => {
  themeObserver?.disconnect();
  darkModeMediaQuery?.removeEventListener('change', handleThemeChange);
});

watch(
  () => [props.bookStyles, props.contentHtml, props.fontSize, isDarkMode.value],
  () => {
    renderShadowContent();
  }
);
</script>

<style scoped>
.chapter-content-host {
  display: block;
}
</style>