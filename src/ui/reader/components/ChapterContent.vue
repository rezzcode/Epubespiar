<template>
  <div ref="host" class="chapter-content-host" :data-custom-font="fontFamily !== 'default'" :data-appearance="isDark ? 'dark' : 'light'" :style="{ '--chapter-font-size': `${fontSize}px`, '--chapter-font-weight': fontWeight, '--chapter-font-family': fontFamily === 'default' ? null : fontFamily }"></div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useTheme } from '../../../composables/useTheme.js';
import chapterStyles from '../styles/shadow-content.css?inline';

const { isDark } = useTheme();

const props = defineProps({
  bookStyles: { type: String, default: '' },
  contentHtml: { type: String, default: '' },
  fontSize: { type: Number, default: 16 },
  fontWeight: { type: String, default: '400' },
  fontFamily: { type: String, default: 'default' }
});

const host = ref(null);
let shadowRootRef = null;
const renderShadowContent = () => {
  if (!host.value) return;
  if (!shadowRootRef) {
    shadowRootRef = host.value.attachShadow({ mode: 'open' });
  }

  const fullHtml = `<style>${chapterStyles}</style>${props.bookStyles || ''}<div class="chapter-content">${props.contentHtml || ''}</div>`;
  const parsed = new DOMParser().parseFromString(fullHtml, 'text/html');
  shadowRootRef.replaceChildren(
    ...Array.from(parsed.head.childNodes),
    ...Array.from(parsed.body.childNodes)
  );
};

onMounted(renderShadowContent);

watch(
  () => [props.bookStyles, props.contentHtml],
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
