export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'inj-pass-welcome-theme';
export const LIGHT_THEME_START_HOUR = 7;
export const LIGHT_THEME_END_HOUR = 19;

export function getTimeBasedThemeMode(date = new Date()): ThemeMode {
  const hour = date.getHours();

  return hour >= LIGHT_THEME_START_HOUR && hour < LIGHT_THEME_END_HOUR
    ? 'light'
    : 'dark';
}

export function readStoredThemeMode(
  storage: Pick<Storage, 'getItem'> | null | undefined
): ThemeMode | null {
  if (!storage) {
    return null;
  }

  const storedTheme = storage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'dark' || storedTheme === 'light'
    ? storedTheme
    : null;
}

export function resolveThemeMode(
  storage: Pick<Storage, 'getItem'> | null | undefined,
  date = new Date()
): { mode: ThemeMode; hasOverride: boolean } {
  const storedTheme = readStoredThemeMode(storage);

  if (storedTheme) {
    return {
      mode: storedTheme,
      hasOverride: true,
    };
  }

  return {
    mode: getTimeBasedThemeMode(date),
    hasOverride: false,
  };
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = mode;
  document.body.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}
