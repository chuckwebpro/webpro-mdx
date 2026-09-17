import { getApiMode } from './browser-api';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings, ImportWebproResult, WebproArticleSummary } from './types';

async function tauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return invoke(cmd, args);
}

function requireDesktop(feature: string): void {
  if (getApiMode() === 'browser') {
    throw new Error(`${feature} requires the desktop app (npm run tauri:dev)`);
  }
}

export async function setWebproLocalPath(path: string): Promise<AppSettings> {
  requireDesktop('Import from webpro');
  return tauri('set_webpro_local_path', { path });
}

export async function listWebproArticles(): Promise<WebproArticleSummary[]> {
  requireDesktop('Import from webpro');
  return tauri('list_webpro_articles');
}

export async function listWebproArticlesLocal(webproRoot: string): Promise<WebproArticleSummary[]> {
  requireDesktop('Import from webpro');
  return tauri('list_webpro_articles_local', { webproRoot });
}

export async function importWebproArticlesFromGithub(slugs: string[]): Promise<ImportWebproResult> {
  requireDesktop('Import from webpro');
  return tauri('import_webpro_articles_from_github', { slugs });
}

export async function importWebproArticlesLocal(
  webproRoot: string,
  slugs: string[],
): Promise<ImportWebproResult> {
  requireDesktop('Import from webpro');
  return tauri('import_webpro_articles_local', { webproRoot, slugs });
}
