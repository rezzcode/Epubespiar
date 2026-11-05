<template>
  <Teleport to="body">
    <dialog ref="dialog" class="reader-settings" aria-labelledby="reader-settings-title" @close="emit('close')" @click="closeOnBackdrop" @keydown.stop @keyup.stop @touchstart.stop @touchend.stop>
      <div class="settings-shell">
        <header class="settings-header">
          <div><span class="eyebrow">MAKE IT YOURS</span><h2 id="reader-settings-title">Reader settings</h2><p>A comfortable space for every chapter.</p></div>
          <button class="close-button" aria-label="Close settings" autofocus @click="dialog.close()">✕</button>
        </header>
        <div class="settings-content">
          <section aria-labelledby="appearance-title">
            <h3 id="appearance-title">Appearance</h3>
            <div class="theme-grid" role="group" aria-label="Reader theme">
              <button v-for="theme in themeOptions" :key="theme.id" class="theme-option" :class="{ selected: currentTheme === theme.id }" :aria-pressed="currentTheme === theme.id" @click="setTheme(theme.id)">
                <span class="theme-preview" :class="`preview-${theme.id}`" aria-hidden="true"><span>Aa</span><i></i><i></i></span>
                {{ theme.id === 'auto' ? 'Auto' : theme.label }}<span v-if="currentTheme === theme.id" aria-hidden="true"> ✓</span>
              </button>
            </div>
            <p class="hint">Auto follows your system’s appearance.</p>
          </section>
          <section aria-labelledby="typography-title">
            <h3 id="typography-title">Typography</h3>
            <div class="field-heading"><label for="settings-font-size">Font size</label><output for="settings-font-size">{{ fontSize }}px</output></div>
            <div class="slider-row"><span aria-hidden="true">A</span><input id="settings-font-size" type="range" min="14" max="30" step="2" v-model.number="fontSize" /><span class="large-a" aria-hidden="true">A</span></div>
            <div class="select-grid">
              <div><label for="settings-font-family">Font family</label><select id="settings-font-family" v-model="fontFamily"><option v-for="[value, label] in fontFamilies" :key="value" :value="value">{{ label }}</option></select></div>
              <div><label for="settings-font-weight">Font weight</label><select id="settings-font-weight" v-model="fontWeight"><option v-for="[value, label] in weights" :key="value" :value="value">{{ label }}</option></select></div>
            </div>
            <div class="field-heading zoom-heading"><span id="zoom-label">Zoom</span><output>{{ Math.round(zoomLevel * 100) }}%</output></div>
            <div class="zoom-grid" role="group" aria-labelledby="zoom-label"><button v-for="zoom in [75, 100, 125, 150, 175, 200]" :key="zoom" :aria-pressed="Math.round(zoomLevel * 100) === zoom" :class="{ selected: Math.round(zoomLevel * 100) === zoom }" @click="zoomLevel = zoom / 100">{{ zoom }}%</button></div>
          </section>
          <section aria-labelledby="behavior-title">
            <h3 id="behavior-title">Behavior</h3>
            <label class="switch-row"><span><strong>Auto-open EPUBs</strong><small>Intercept EPUB downloads and open them in the reader.</small></span><input type="checkbox" v-model="interceptDownloads" role="switch" /><span class="switch-track" aria-hidden="true"></span></label>
            <label class="switch-row"><span><strong>Toolbar zoom &amp; font controls</strong><small>Keep reading adjustments within easy reach.</small></span><input type="checkbox" v-model="showInlineControls" role="switch" /><span class="switch-track" aria-hidden="true"></span></label>
          </section>
        </div>
        <footer><span>Changes save automatically</span><button class="done-button" @click="dialog.close()">Done</button></footer>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useTheme } from '../../../composables/useTheme.js';
import { useBrowserLocalStorage } from '../../../composables/useBrowserStorage.js';
import { fontFamilies } from '../../../composables/reader/useReaderSettings.js';
const fontSize = defineModel('fontSize', { type: Number, default: 16 });
const zoomLevel = defineModel('zoomLevel', { type: Number, default: 1 });
const fontWeight = defineModel('fontWeight', { type: String, default: '400' });
const fontFamily = defineModel('fontFamily', { type: String, default: 'default' });
const showInlineControls = defineModel('showInlineControls', { type: Boolean, default: true });
const emit = defineEmits(['close']);
const { currentTheme, themeOptions, setTheme } = useTheme();
const { data: interceptDownloads } = useBrowserLocalStorage('interceptDownloads', false);
const weights = [['300', 'Light'], ['400', 'Normal'], ['500', 'Medium'], ['600', 'Semi-Bold'], ['700', 'Bold']];
const dialog = ref(null);
let previousFocus;
const closeOnBackdrop = event => {
  const bounds = dialog.value.getBoundingClientRect();
  if (event.target === dialog.value && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.value.close();
};
onMounted(() => { previousFocus = document.activeElement; dialog.value.showModal(); });
onBeforeUnmount(() => { dialog.value?.close(); if (previousFocus?.isConnected) previousFocus.focus(); });
</script>

<style scoped>
.reader-settings { --accent: var(--hover-outline-color, #10b981); color: var(--text-color); background: var(--toolbar-bg-color); border: 1px solid var(--border-color); border-radius: 24px; margin: auto; padding: 0; width: min(560px, calc(100vw - 28px)); max-height: min(90dvh, 900px); box-shadow: 0 24px 90px #0005; }
.reader-settings::backdrop { background: #080e1c80; backdrop-filter: blur(6px); }
.settings-shell { display: flex; flex-direction: column; max-height: inherit; }
.settings-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 25px 28px 20px; border-bottom: 1px solid var(--border-color); }
.eyebrow { color: var(--accent); font-size: 10px; font-weight: 700; letter-spacing: .16em; }
h2 { font-size: 25px; letter-spacing: -.04em; margin: 6px 0; } p { margin: 0; font-size: 13px; opacity: .7; }
button, input, select { font: inherit; } button { cursor: pointer; color: inherit; } button, select { border: 1px solid var(--border-color); background: var(--epub-container-bg); border-radius: 10px; }
button:hover { border-color: var(--accent); } :is(button, input, select):focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.close-button { width: 32px; height: 32px; flex-shrink: 0; }
.settings-content { padding: 0 28px; overflow-y: auto; overscroll-behavior: contain; }
section { padding: 21px 0; } section + section { border-top: 1px solid var(--border-color); } h3 { margin: 0 0 15px; font-size: 14px; }
.theme-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
.theme-option { padding: 6px 6px 10px; font-size: 12px; }.theme-preview { height: 65px; display: flex; flex-direction: column; align-items: flex-start; gap: 5px; border-radius: 6px; padding: 10px; margin-bottom: 9px; box-sizing: border-box; }
.theme-preview span { font-family: Georgia, serif; font-size: 20px; line-height: 1; }.theme-preview i { display: block; height: 2px; width: 85%; background: currentColor; opacity: .3; }.theme-preview i:last-child { width: 60%; }
.preview-light { background: #f4f3ed; color: #30312f; }.preview-green { background: #1f2937; color: #79d9ac; }.preview-dark { background: #35353b; color: #eee; }.preview-auto { background: linear-gradient(110deg, #f4f3ed 50%, #35353b 50%); color: #8b998f; }
.selected { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }.hint { font-size: 11px; margin-top: 10px; }
.field-heading { display: flex; justify-content: space-between; align-items: center; font-size: 13px; } output { color: var(--accent); font-variant-numeric: tabular-nums; font-weight: 600; }
.slider-row { display: flex; align-items: center; gap: 15px; margin: 12px 0 18px; }.slider-row input { width: 100%; accent-color: var(--accent); }.slider-row > span { font-family: Georgia, serif; font-size: 14px; }.slider-row .large-a { font-size: 24px; }
.select-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; }.select-grid label { display: block; font-size: 12px; margin-bottom: 8px; }select { width: 100%; padding: 10px; color: inherit; min-width: 0; }.zoom-heading { margin: 20px 0 10px; }.zoom-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }.zoom-grid button { padding: 9px 2px; font-size: 12px; }
.switch-row { position: relative; display: flex; align-items: center; gap: 16px; cursor: pointer; }.switch-row + .switch-row { margin-top: 18px; }.switch-row > span:first-child { flex: 1; }.switch-row strong { display: block; font-size: 13px; font-weight: 500; }.switch-row small { display: block; margin-top: 5px; font-size: 12px; line-height: 1.5; opacity: .65; }.switch-row input { position: absolute; right: 0; width: 42px; height: 24px; opacity: 0; }.switch-track { width: 42px; height: 24px; border-radius: 20px; background: var(--border-color); flex-shrink: 0; pointer-events: none; }.switch-track::after { content: ''; display: block; width: 18px; height: 18px; margin: 3px; background: white; border-radius: 50%; transition: transform .15s; }.switch-row input:checked + .switch-track { background: var(--accent); }.switch-row input:checked + .switch-track::after { transform: translateX(18px); }.switch-row input:focus-visible + .switch-track { outline: 2px solid var(--accent); outline-offset: 3px; }
footer { display: flex; justify-content: space-between; align-items: center; padding: 15px 28px; border-top: 1px solid var(--border-color); }footer > span { font-size: 11px; opacity: .6; }.done-button { background: var(--accent); color: var(--toolbar-bg-color); border-color: transparent; padding: 9px 24px; font-weight: 600; }
@media (max-width: 400px) { .settings-header, footer { padding: 18px; }.settings-content { padding: 0 18px; }.theme-grid { gap: 5px; }.zoom-grid { grid-template-columns: repeat(3, 1fr); }.select-grid { grid-template-columns: 1fr; }h2 { font-size: 22px; } }
@media (prefers-reduced-motion: reduce) { .switch-track::after { transition: none; } }
</style>
