import { computed, readonly, ref } from "vue";
import {
  themes,
  themeOptions,
  normalizeTheme,
  resolveTheme,
  getThemeAppearance,
} from "../ui/reader/styles/themes/registry.js";

const preference = ref("auto");
const resolvedTheme = ref("light");
const isLoading = ref(true);
let initialization;
let mediaQuery;

function readLocalPreference() {
  try {
    const stored = localStorage.getItem("reader-theme");
    if (stored !== null) return normalizeTheme(stored);
    const devStored =
      localStorage.getItem("local_reader-theme") ||
      localStorage.getItem("local_mode");
    if (devStored !== null) return normalizeTheme(JSON.parse(devStored));
    return normalizeTheme(localStorage.getItem("vueuse-color-scheme"));
  } catch {
    return "auto";
  }
}

function applyTheme() {
  resolvedTheme.value = resolveTheme(preference.value, mediaQuery.matches);
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme.value;
  root.dataset.appearance = getThemeAppearance(resolvedTheme.value);
  try {
    // Synchronous mirror prevents a flash while extension storage loads next time.
    localStorage.setItem("reader-theme", preference.value);
  } catch {
    /* The theme still works when storage is unavailable. */
  }
}

export function initializeTheme() {
  if (initialization) return initialization;
  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  preference.value = readLocalPreference();
  applyTheme();
  mediaQuery.addEventListener("change", () => {
    if (preference.value === "auto") applyTheme();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "reader-theme") {
      preference.value = normalizeTheme(event.newValue);
      applyTheme();
    }
  });

  const storage = globalThis.chrome?.storage;
  initialization = new Promise((resolve) => {
    if (!storage?.local) {
      isLoading.value = false;
      resolve();
      return;
    }
    storage.local.get(["reader-theme", "mode"], (result) => {
      const error = globalThis.chrome?.runtime?.lastError;
      if (!error) {
        // Only migrate legacy mode when a saved reader theme does not exist.
        preference.value = normalizeTheme(
          result?.["reader-theme"] ?? result?.mode ?? preference.value,
        );
        applyTheme();
      }
      isLoading.value = false;
      resolve();
    });
    storage.onChanged?.addListener((changes, area) => {
      if (area === "local" && changes["reader-theme"]) {
        preference.value = normalizeTheme(changes["reader-theme"].newValue);
        applyTheme();
      }
    });
  });
  return initialization;
}

function setTheme(value) {
  preference.value = normalizeTheme(value);
  applyTheme();
  const storage = globalThis.chrome?.storage;
  storage?.local?.set({ "reader-theme": preference.value });
}

export function useTheme() {
  initializeTheme();
  const isDark = computed(
    () => getThemeAppearance(resolvedTheme.value) === "dark",
  );
  return {
    themes,
    themeOptions,
    currentTheme: readonly(preference),
    resolvedTheme: readonly(resolvedTheme),
    colorSchema: readonly(preference),
    isDark,
    isLoading: readonly(isLoading),
    setTheme,
    toggleDark: () => setTheme(isDark.value ? "light" : "dark"),
    cycleTheme: () => {
      const index = themes.findIndex(
        (theme) => theme.id === resolvedTheme.value,
      );
      setTheme(themes[(index + 1) % themes.length].id);
    },
  };
}
