<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="reader-settings"
      aria-labelledby="reader-settings-title"
      @close="emit('close')"
      @click="closeOnBackdrop"
      @keydown.stop
      @keyup.stop
      @touchstart.stop
      @touchend.stop
    >
      <div class="settings-shell">
        <!-- Header -->
        <header class="settings-header">
          <h2 id="reader-settings-title">Reader Settings</h2>
          <button
            @click="dialog.close()"
            class="close-button"
            autofocus
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
          </button>
        </header>

        <!-- Tabs -->
        <div class="settings-tabs-bar">
          <button
            v-if="tabsOverflow"
            class="tab-scroll-button"
            type="button"
            aria-label="Scroll settings tabs left"
            :disabled="!canScrollLeft"
            @click="scrollTabs(-1)"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <nav
            ref="tabList"
            class="settings-tabs"
            role="tablist"
            aria-label="Settings sections"
            @scroll="updateTabScroll"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :id="`tab-${tab.id}`"
              role="tab"
              type="button"
              class="tab-button"
              :class="{ active: activeTab === tab.id }"
              :aria-selected="activeTab === tab.id"
              :aria-controls="`panel-${tab.id}`"
              :tabindex="activeTab === tab.id ? 0 : -1"
              @click="selectTab(tab.id, $event.currentTarget)"
              @keydown="onTabKeydown($event, tab.id)"
            >
              {{ tab.label }}
            </button>
          </nav>
          <button
            v-if="tabsOverflow"
            class="tab-scroll-button"
            type="button"
            aria-label="Scroll settings tabs right"
            :disabled="!canScrollRight"
            @click="scrollTabs(1)"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="settings-body">
          <!-- Appearance -->
          <div
            v-if="activeTab === 'appearance'"
            :id="`panel-appearance`"
            role="tabpanel"
            :aria-labelledby="`tab-appearance`"
            class="settings-panel"
          >
            <section>
              <div class="theme-grid" role="group" aria-label="Reader theme">
                <button
                  v-for="theme in themeOptions"
                  :key="theme.id"
                  class="theme-option"
                  :class="{ selected: currentTheme === theme.id }"
                  :aria-pressed="currentTheme === theme.id"
                  @click="setTheme(theme.id)"
                >
                  <span class="theme-preview" :class="`preview-${theme.id}`" aria-hidden="true">
                    <span>Aa</span>
                    <i></i>
                    <i></i>
                  </span>
                  {{ theme.id === 'auto' ? 'Auto' : theme.label }}
                  <span v-if="currentTheme === theme.id" aria-hidden="true"> ✓</span>
                </button>
              </div>
              <p class="hint">Choose the colour theme you prefer above.</p>
            </section>
          </div>

          <!-- Typography -->
          <div
            v-else-if="activeTab === 'typography'"
            :id="`panel-typography`"
            role="tabpanel"
            :aria-labelledby="`tab-typography`"
            class="settings-panel"
          >
            <section>
              <div class="field-heading">
                <label for="settings-font-size">Font size</label>
                <output for="settings-font-size">{{ fontSize }}px</output>
              </div>
              <div class="slider-row">
                <span aria-hidden="true">A</span>
                <input
                  id="settings-font-size"
                  type="range"
                  min="14"
                  max="30"
                  step="2"
                  v-model.number="fontSize"
                />
                <span class="large-a" aria-hidden="true">A</span>
              </div>

              <div class="select-grid">
                <div>
                  <label for="settings-font-family">Font family</label>
                  <select id="settings-font-family" v-model="fontFamily">
                    <option v-for="[value, label] in fontFamilies" :key="value" :value="value">
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label for="settings-font-weight">Font weight</label>
                  <select id="settings-font-weight" v-model="fontWeight">
                    <option v-for="[value, label] in weights" :key="value" :value="value">
                      {{ label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="field-heading zoom-heading">
                <span id="zoom-label">Zoom</span>
                <output>{{ Math.round(zoomLevel * 100) }}%</output>
              </div>
              <div class="zoom-grid" role="group" aria-labelledby="zoom-label">
                <button
                  v-for="zoom in [75, 100, 125, 150, 175, 200]"
                  :key="zoom"
                  :aria-pressed="Math.round(zoomLevel * 100) === zoom"
                  :class="{ selected: Math.round(zoomLevel * 100) === zoom }"
                  @click="zoomLevel = zoom / 100"
                >
                  {{ zoom }}%
                </button>
              </div>
            </section>
          </div>

          <!-- Behavior -->
          <div
            v-else-if="activeTab === 'behavior'"
            :id="`panel-behavior`"
            role="tabpanel"
            :aria-labelledby="`tab-behavior`"
            class="settings-panel"
          >
            <section>
              <label class="switch-row">
                <span>
                  <strong>Auto-open EPUBs</strong>
                  <small>Intercept EPUB downloads and open them in the reader.</small>
                </span>
                <input type="checkbox" v-model="interceptDownloads" role="switch" />
                <span class="switch-track" aria-hidden="true"></span>
              </label>
              <label class="switch-row">
                <span>
                  <strong>Toolbar zoom &amp; font controls</strong>
                  <small>Keep reading adjustments within easy reach.</small>
                </span>
                <input type="checkbox" v-model="showInlineControls" role="switch" />
                <span class="switch-track" aria-hidden="true"></span>
              </label>
            </section>
          </div>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useTheme } from '../../../composables/useTheme.js';
import { useBrowserLocalStorage } from '../../../composables/useBrowserStorage.js';
import { fontFamilies } from '../../../composables/reader/useReaderSettings.js';

const fontSize = defineModel('fontSize', {
  type: Number,
  default: 16,
});
const zoomLevel = defineModel('zoomLevel', {
  type: Number,
  default: 1,
});
const fontWeight = defineModel('fontWeight', {
  type: String,
  default: '400',
});
const fontFamily = defineModel('fontFamily', {
  type: String,
  default: 'default',
});
const showInlineControls = defineModel('showInlineControls', {
  type: Boolean,
  default: true,
});
const emit = defineEmits(['close']);
const { currentTheme, themeOptions, setTheme } = useTheme();
const { data: interceptDownloads } = useBrowserLocalStorage('interceptDownloads', false);
const weights = [
  ['300', 'Light'],
  ['400', 'Normal'],
  ['500', 'Medium'],
  ['600', 'Semi-Bold'],
  ['700', 'Bold'],
];
const dialog = ref(null);
const activeTab = ref('appearance');
const tabList = ref(null);
const tabsOverflow = ref(false);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
let tabResizeObserver;

const updateTabScroll = () => {
  const list = tabList.value;
  if (!list) {
    return;
  }

  const availableWidth = list.clientWidth + (tabsOverflow.value ? 64 : 0);
  tabsOverflow.value = list.scrollWidth > availableWidth + 1;
  canScrollLeft.value = list.scrollLeft > 1;
  canScrollRight.value = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
};

const scrollTabs = direction => {
  tabList.value.scrollBy({
    left: direction * tabList.value.clientWidth * 0.75,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
  });
};

const selectTab = (id, button) => {
  activeTab.value = id;
  button.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
  });
};

const onTabKeydown = (event, id) => {
  const index = tabs.findIndex(tab => tab.id === id);
  let next;
  if (event.key === 'ArrowRight') {
    next = (index + 1) % tabs.length;
  } else if (event.key === 'ArrowLeft') {
    next = (index - 1 + tabs.length) % tabs.length;
  } else if (event.key === 'Home') {
    next = 0;
  } else if (event.key === 'End') {
    next = tabs.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  const button = tabList.value.querySelectorAll('[role="tab"]')[next];
  selectTab(tabs[next].id, button);
  button.focus({ preventScroll: true });
};

const tabs = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'typography', label: 'Typography' },
  { id: 'behavior', label: 'Behavior' },
];
let previousFocus;

const closeOnBackdrop = event => {
  const bounds = dialog.value.getBoundingClientRect();
  if (
    event.target === dialog.value &&
    (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
  ) {
    dialog.value.close();
  }
};

onMounted(() => {
  previousFocus = document.activeElement;
  dialog.value.showModal();
  tabResizeObserver = new ResizeObserver(updateTabScroll);
  tabResizeObserver.observe(tabList.value);
  updateTabScroll();
});

onBeforeUnmount(() => {
  tabResizeObserver?.disconnect();
  dialog.value?.close();

  if (previousFocus?.isConnected) {
    previousFocus.focus();
  }
});
</script>

<style scoped>
.reader-settings {
  --accent: var(--hover-outline-color, #10b981);
  color: var(--text-color);
  background: var(--epub-container-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin: auto;
  padding: 0;
  width: min(560px, calc(100vw - 28px));
  /* Fixed default size — no more content-driven growth */
  height: min(640px, calc(100dvh - 40px));
  max-height: calc(100dvh - 40px);
  box-shadow: 0 24px 90px #0005;
  overflow: hidden;
}

.reader-settings::backdrop {
  background: #080e1c80;
  backdrop-filter: blur(6px);
}

.settings-shell {
  display: flex;
  flex-direction: column;
  height: 100%; /* fill the fixed-height dialog */
  overflow: hidden;
}

/* ---------- Header ---------- */
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 25px 28px 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

h2 {
  font-size: 25px;
  letter-spacing: -0.04em;
  margin: 6px 0;
}

p {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
  color: inherit;
}

button,
select {
  border: 1px solid var(--border-color);
  background: var(--epub-container-bg);
  border-radius: 10px;
}

button:hover {
  border-color: var(--accent);
}

:is(button, input, select):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* ---------- Close button ---------- */
.close-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted, #6b7280);
  border-radius: 10px;
  transition: background-color 0.2s, color 0.2s;
}

.close-button:hover {
  background-color: var(--hover-bg, #f3f4f6);
  color: var(--text-color, #1f2937);
}

.close-button svg {
  transform-box: fill-box;
  transform-origin: center;
}

.close-button:hover svg {
  animation: settings-close-spin 0.6s ease-in-out;
}

@keyframes settings-close-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* ---------- Tabs ---------- */
.settings-tabs-bar {
  display: flex;
  align-items: center;
  padding: 0 28px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  min-width: 0;
}

.settings-tabs {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.settings-tabs::-webkit-scrollbar {
  display: none;
}

.tab-scroll-button {
  flex: 0 0 32px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 24px;
  line-height: 1;
}

.tab-scroll-button:disabled {
  opacity: 0.3;
  cursor: default;
}

.tab-scroll-button:focus-visible {
  outline-offset: -3px;
}

.tab-button {
  flex-shrink: 0;
  white-space: nowrap;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted, #6b7280);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.tab-button:hover {
  color: var(--text-color);
  border-color: transparent;
}

.tab-button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

/* ---------- Scrollable body ---------- */
.settings-body {
  flex: 1;
  min-height: 0; /* essential: lets the body shrink and scroll inside the flex column */
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 28px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.settings-body::-webkit-scrollbar {
  width: 8px;
}

.settings-body::-webkit-scrollbar-track {
  background: transparent;
}

.settings-body::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.settings-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted, #9ca3af);
}

/* ---------- Panels ---------- */
.settings-panel {
  padding-bottom: 21px;
}

section {
  padding: 21px 0;
}

h3 {
  margin: 0 0 15px;
  font-size: 14px;
}

/* ---------- Appearance ---------- */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;
}

.theme-option {
  padding: 6px 6px 10px;
  font-size: 12px;
}

.theme-preview {
  height: 65px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 9px;
  box-sizing: border-box;
}

.theme-preview span {
  font-family: Georgia, serif;
  font-size: 20px;
  line-height: 1;
}

.theme-preview i {
  display: block;
  height: 2px;
  width: 85%;
  background: currentColor;
  opacity: 0.3;
}

.theme-preview i:last-child {
  width: 60%;
}

.preview-light {
  background: #f4f3ed;
  color: #30312f;
}

.preview-green {
  background: #1f2937;
  color: #79d9ac;
}

.preview-dark {
  background: #35353b;
  color: #eee;
}

.preview-auto {
  background: linear-gradient(110deg, #f4f3ed 50%, #35353b 50%);
  color: #8b998f;
}

.selected {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.hint {
  font-size: 11px;
  margin-top: 10px;
}

/* ---------- Typography ---------- */
.field-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

output {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 12px 0 18px;
}

.slider-row input {
  width: 100%;
  accent-color: var(--accent);
}

.slider-row > span {
  font-family: Georgia, serif;
  font-size: 14px;
}

.slider-row .large-a {
  font-size: 24px;
}

.select-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 12px;
}

.select-grid label {
  display: block;
  font-size: 12px;
  margin-bottom: 8px;
}

select {
  width: 100%;
  padding: 10px;
  color: inherit;
  min-width: 0;
}

.zoom-heading {
  margin: 20px 0 10px;
}

.zoom-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.zoom-grid button {
  padding: 9px 2px;
  font-size: 12px;
}

/* ---------- Behavior ---------- */
.switch-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}

.switch-row + .switch-row {
  margin-top: 18px;
}

.switch-row > span:first-child {
  flex: 1;
}

.switch-row strong {
  display: block;
  font-size: 13px;
  font-weight: 500;
}

.switch-row small {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.5;
  opacity: 0.65;
}

.switch-row input {
  position: absolute;
  right: 0;
  width: 42px;
  height: 24px;
  opacity: 0;
}

.switch-track {
  width: 42px;
  height: 24px;
  border-radius: 20px;
  background: var(--border-color);
  flex-shrink: 0;
  pointer-events: none;
}

.switch-track::after {
  content: '';
  display: block;
  width: 18px;
  height: 18px;
  margin: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.15s;
}

.switch-row input:checked + .switch-track {
  background: var(--accent);
}

.switch-row input:checked + .switch-track::after {
  transform: translateX(18px);
}

.switch-row input:focus-visible + .switch-track {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* ---------- Responsive ---------- */
@media (max-width: 400px) {
  .settings-header {
    padding: 18px;
  }

  .settings-tabs-bar {
    padding: 0 18px;
  }

  .settings-body {
    padding: 0 18px;
  }

  .theme-grid {
    gap: 5px;
  }

  .zoom-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .select-grid {
    grid-template-columns: 1fr;
  }

  h2 {
    font-size: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .switch-track::after {
    transition: none;
  }

  .close-button,
  .close-button svg {
    transition: none;
  }

  .close-button:hover svg {
    animation: none;
  }
}
</style>
