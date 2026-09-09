import { invoke } from '@tauri-apps/api/core';
import { isTauri } from './is-tauri';

const STORAGE_KEY = 'webpro-mdx-assets';

type AssetStore = Record<string, Record<string, string>>;

function loadStore(): AssetStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store: AssetStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'image.png';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image.png';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/** Normalize draft-relative asset paths from MDX (e.g. `./assets/foo.png`). */
export function normalizeDraftAssetPath(src: string): string {
  return src.trim().replace(/^\.\//, '');
}

export function isDraftAssetPath(src: string): boolean {
  const normalized = normalizeDraftAssetPath(src);
  return normalized.startsWith('assets/');
}

export async function storeBrowserImageFile(slug: string, file: File): Promise<string> {
  const filename = sanitizeFilename(file.name);
  const dataUrl = await readFileAsDataUrl(file);
  const store = loadStore();
  if (!store[slug]) store[slug] = {};
  store[slug][filename] = dataUrl;
  saveStore(store);
  return `assets/${filename}`;
}

export function getBrowserAssetDataUrl(slug: string, src: string): string | null {
  const rel = normalizeDraftAssetPath(src);
  if (!rel.startsWith('assets/')) return null;
  const filename = rel.slice('assets/'.length);
  return loadStore()[slug]?.[filename] ?? null;
}

export async function resolveDraftAssetUrl(slug: string, src: string): Promise<string> {
  const rel = normalizeDraftAssetPath(src);
  if (!rel || !rel.startsWith('assets/')) return src.trim();

  if (isTauri()) {
    try {
      return await invoke<string>('read_draft_asset_data_url', { slug, relPath: rel });
    } catch {
      return rel;
    }
  }

  return getBrowserAssetDataUrl(slug, rel) ?? rel;
}

export function defaultAltFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '');
  return stem.replace(/[-_]+/g, ' ').trim();
}
