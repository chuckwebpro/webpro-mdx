import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { browserApi, getApiMode } from './browser-api';
import { normalizeDraftContent } from './normalize-draft';
import type {
  AppSettings,
  DraftContent,
  DraftSummary,
  ExportResult,
} from './types';

async function tauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return invoke(cmd, args);
}

export async function getSettings(): Promise<AppSettings> {
  if (getApiMode() === 'browser') return browserApi.getSettings();
  return tauri('get_settings');
}

export async function setDraftsDir(path: string): Promise<AppSettings> {
  if (getApiMode() === 'browser') return browserApi.setDraftsDir(path);
  return tauri('set_drafts_dir', { path });
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

export async function exportDraft(slug: string, exportDir: string): Promise<ExportResult> {
  if (getApiMode() === 'browser') return browserApi.exportDraft(slug, exportDir);
  return tauri('export_draft', { slug, exportDir });
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
    window.alert(`${options?.title ?? 'Webpro MDX Editor'}\n\n${text}`);
    return;
  }
  const { message } = await import('@tauri-apps/plugin-dialog');
  await message(text, { title: options?.title, kind: options?.kind });
}
