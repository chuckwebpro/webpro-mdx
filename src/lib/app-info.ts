import pkg from '../../package.json';
import { getApiMode } from './browser-api';

export const APP_NAME = 'Webpro MDX Editor';

export function formatAppTitle(version: string): string {
  return `${APP_NAME} v${version}`;
}

/** Sync document title in browser mode (Tauri sets the native title bar in Rust). */
export function syncBrowserTitle(): void {
  if (getApiMode() !== 'browser') return;
  document.title = formatAppTitle(pkg.version);
}
