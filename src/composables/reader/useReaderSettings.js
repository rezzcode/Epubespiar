import { computed, onScopeDispose, ref, toRaw, watch } from "vue";

export const fontFamilies = [
  ["default", "Default"],
  ["Georgia, serif", "Georgia"],
  ["'Times New Roman', serif", "Times New Roman"],
  ["Arial, sans-serif", "Arial"],
  ["Helvetica, sans-serif", "Helvetica"],
  ["'Courier New', monospace", "Courier New"],
];

export const readerDefaults = Object.freeze({
  fontSize: 16,
  zoomLevel: 1,
  fontWeight: "400",
  fontFamily: "default",
  showInlineControls: true,
});

export const readerLimits = Object.freeze({
  fontSize: Object.freeze({ min: 14, max: 30, step: 2 }),
  zoomLevel: Object.freeze({ min: 0.5, max: 2, step: 0.1 }),
});
const defaults = readerDefaults;
export function normalizeReaderSettings(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    fontSize:
      Number.isFinite(source.fontSize) &&
      source.fontSize >= readerLimits.fontSize.min &&
      source.fontSize <= readerLimits.fontSize.max
        ? Math.round(source.fontSize / readerLimits.fontSize.step) *
          readerLimits.fontSize.step
        : defaults.fontSize,
    zoomLevel:
      Number.isFinite(source.zoomLevel) &&
      source.zoomLevel >= readerLimits.zoomLevel.min &&
      source.zoomLevel <= readerLimits.zoomLevel.max
        ? Math.round(source.zoomLevel * 100) / 100
        : defaults.zoomLevel,
    fontWeight: ["300", "400", "500", "600", "700"].includes(
      String(source.fontWeight),
    )
      ? String(source.fontWeight)
      : defaults.fontWeight,
    fontFamily: fontFamilies.some(([value]) => value === source.fontFamily)
      ? source.fontFamily
      : defaults.fontFamily,
    showInlineControls:
      typeof source.showInlineControls === "boolean"
        ? source.showInlineControls
        : true,
  };
}

export function useReaderSettings() {
  const key = "readerUiSettings";
  const localKey = `local_${key}`;
  const settings = ref({ ...defaults });
  const storage = globalThis.chrome?.storage;
  let ready = false;
  const apply = (value) => {
    settings.value = normalizeReaderSettings(value);
  };
  const settingsReady = new Promise((resolve) => {
    if (storage?.local) {
      storage.local.get(key, (result) => {
        if (!globalThis.chrome?.runtime?.lastError) apply(result?.[key]);
        ready = true;
        resolve();
      });
    } else {
      try {
        apply(JSON.parse(localStorage.getItem(localKey)));
      } catch {
        /* Use defaults. */
      }
      ready = true;
      resolve();
    }
  });
  const stop = watch(
    settings,
    (value) => {
      if (!ready) return;
      try {
        if (storage?.local) storage.local.set({ [key]: toRaw(value) });
        else localStorage.setItem(localKey, JSON.stringify(value));
      } catch {
        /* Preferences remain usable when persistence is unavailable. */
      }
    },
    { deep: true, flush: "sync" },
  );
  const changed = (changes, area) => {
    if (area === "local" && changes[key]) {
      ready = false;
      apply(changes[key].newValue);
      ready = true;
    }
  };
  const localChanged = (event) => {
    if (event.key !== localKey) return;
    ready = false;
    try {
      apply(JSON.parse(event.newValue));
    } catch {
      apply();
    }
    ready = true;
  };
  storage?.onChanged?.addListener(changed);
  window.addEventListener("storage", localChanged);
  onScopeDispose(() => {
    stop();
    storage?.onChanged?.removeListener(changed);
    window.removeEventListener("storage", localChanged);
  });
  return {
    ...Object.fromEntries(
      Object.keys(defaults).map((name) => [
        name,
        computed({
          get: () => settings.value[name],
          set: (value) => {
            settings.value = normalizeReaderSettings({
              ...settings.value,
              [name]: value,
            });
          },
        }),
      ]),
    ),
    settingsReady,
  };
}
