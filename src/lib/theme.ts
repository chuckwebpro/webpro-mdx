export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'webpro-mdx-theme';

export function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore storage errors
  }
  return 'dark';
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
}
