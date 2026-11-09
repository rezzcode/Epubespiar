// Each entry has a matching CSS import in ../index.css.
export const themes = Object.freeze([
  { id: 'light', label: 'Light', appearance: 'light' },
  { id: 'green', label: 'Green', appearance: 'dark' },
  { id: 'dark', label: 'Dark', appearance: 'dark' },
]);

export const themeOptions = Object.freeze([
  { id: 'auto', label: 'System' },
  ...themes,
]);

export function normalizeTheme(value) {
  return themeOptions.some(theme => theme.id === value) ? value : 'auto';
}

export function resolveTheme(value, prefersDark) {
  const preference = normalizeTheme(value);
  return preference === 'auto' ? (prefersDark ? 'dark' : 'light') : preference;
}

export function getThemeAppearance(value) {
  return themes.find(theme => theme.id === value)?.appearance || 'light';
}
