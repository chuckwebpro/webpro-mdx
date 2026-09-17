import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { APP_NAME } from './app-info';
import { browserApi, getApiMode } from './browser-api';
import { normalizeAppSettings, normalizeDraftContent } from './normalize-draft';
import type {
  AppSettings,
  DraftContent,
  DraftSummary,
  ExportResult,
  GitHubConnectionStatus,
  GitHubSettingsUpdate,
  PublishDraftRequest,
  PublishResult,
} from './types';

async function tauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return invoke(cmd, args);
}

export async function getSettings(): Promise<AppSettings> {
  if (getApiMode() === 'browser') return normalizeAppSettings(await browserApi.getSettings());
  return normalizeAppSettings(await tauri<AppSettings>('get_settings'));
}

export async function setDraftsDir(path: string): Promise<AppSettings> {
  if (getApiMode() === 'browser') return browserApi.setDraftsDir(path);
  return tauri('set_drafts_dir', { path });
}

export async function setGithubSettings(update: GitHubSettingsUpdate): Promise<AppSettings> {
  if (getApiMode() === 'browser') {
    throw new Error('GitHub publish requires the desktop app (npm run tauri:dev)');
  }
  return tauri('set_github_settings', { update });
}

export async function setGithubToken(token: string): Promise<void> {
  if (getApiMode() === 'browser') {
    throw new Error('GitHub publish requires the desktop app (npm run tauri:dev)');
  }
  return tauri('set_github_token', { token });
}

export async function disconnectGithub(): Promise<AppSettings> {
  if (getApiMode() === 'browser') {
    throw new Error('GitHub publish requires the desktop app (npm run tauri:dev)');
  }
  return tauri('disconnect_github');
}

export async function getGithubTokenConfigured(): Promise<boolean> {
  if (getApiMode() === 'browser') return false;
  return tauri('get_github_token_configured');
}

export async function testGithubConnection(): Promise<GitHubConnectionStatus> {
  if (getApiMode() === 'browser') {
    throw new Error('GitHub publish requires the desktop app (npm run tauri:dev)');
  }
  return tauri('test_github_connection');
}

export async function listDraftAssets(slug: string): Promise<string[]> {
  if (getApiMode() === 'browser') return [];
  return tauri('list_draft_assets', { slug });
}

export async function listDrafts(): Promise<DraftSummary[]> {
  if (getApiMode() === 'browser') return browserApi.listDrafts();
  return tauri('list_drafts');
}

export async function createDraft(title: string, slug?: string): Promise<DraftContent> {
  if (getApiMode() === 'browser') return browserApi.createDraft(title, slug);
  return tauri('create_draft', { title, slug });
}

export async function loadDraft(slug: string): Promise<DraftContent> {
  const draft =
    getApiMode() === 'browser'
      ? await browserApi.loadDraft(slug)
      : await tauri<DraftContent>('load_draft', { slug });
  return normalizeDraftContent(draft);
}

export async function saveDraft(content: DraftContent): Promise<DraftContent> {
  if (getApiMode() === 'browser') return browserApi.saveDraft(content);
  return tauri('save_draft', { content });
}

export async function deleteDraft(slug: string): Promise<void> {
  if (getApiMode() === 'browser') return browserApi.deleteDraft(slug);
  return tauri('delete_draft', { slug });
}

export async function exportDraft(
  slug: string,
  exportDir: string,
  formattedMdx: string,
): Promise<ExportResult> {
  if (getApiMode() === 'browser') return browserApi.exportDraft(slug, exportDir, formattedMdx);
  return tauri('export_draft', { slug, exportDir, formattedMdx });
}

export async function publishDraft(request: PublishDraftRequest): Promise<PublishResult> {
  if (getApiMode() === 'browser') {
    throw new Error('Publish requires the desktop app (npm run tauri:dev)');
  }
  return tauri('publish_draft', { ...request });
}

export async function importMdx(filePath: string): Promise<DraftContent> {
  if (getApiMode() === 'browser') return browserApi.importMdx(filePath);
  return tauri('import_mdx', { filePath });
}

export async function copyImageToDraft(slug: string, sourcePath: string): Promise<string> {
  if (getApiMode() === 'browser') return browserApi.copyImageToDraft(slug, sourcePath);
  return tauri('copy_image_to_draft', { slug, sourcePath });
}

export async function pickMdxFile(): Promise<string | null> {
  if (getApiMode() === 'browser') return browserApi.pickMdxFile();
  const result = await open({
    multiple: false,
    filters: [{ name: 'MDX', extensions: ['mdx', 'md'] }],
  });
  return typeof result === 'string' ? result : null;
}

export async function pickImageFile(): Promise<string | null> {
  if (getApiMode() === 'browser') return browserApi.pickImageFile();
  const result = await open({
    multiple: false,
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
  });
  return typeof result === 'string' ? result : null;
}

export async function pickExportFolder(): Promise<string | null> {
  if (getApiMode() === 'browser') return browserApi.pickExportFolder();
  const result = await open({ directory: true, multiple: false });
  return typeof result === 'string' ? result : null;
}

export async function pickDraftsFolder(): Promise<string | null> {
  if (getApiMode() === 'browser') return browserApi.pickDraftsFolder();
  const result = await open({ directory: true, multiple: false });
  return typeof result === 'string' ? result : null;
}

export async function showMessage(
  text: string,
  options?: { title?: string; kind?: 'info' | 'error' },
): Promise<void> {
  if (getApiMode() === 'browser') {
    window.alert(`${options?.title ?? APP_NAME}\n\n${text}`);
    return;
  }
  const { message } = await import('@tauri-apps/plugin-dialog');
  await message(text, { title: options?.title, kind: options?.kind });
}
