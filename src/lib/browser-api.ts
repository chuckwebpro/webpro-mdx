import { isTauri } from './is-tauri';
import type {
  AppSettings,
  DraftContent,
  DraftSummary,
  DraftMeta,
  ExportResult,
} from './types';
import {
  DEFAULT_BYLINE_AUTHOR,
  DEFAULT_BYLINE_COMPANY,
  DEFAULT_BYLINE_LOCATION,
  DEFAULT_DEK,
  DEFAULT_EYEBROW,
} from './types';
import { normalizeAppSettings, normalizeDraftContent } from './normalize-draft';
import { slugifyPlainTitle, todayIsoDate } from './utils';

const STORAGE_KEY = 'webpro-mdx-drafts';
const SETTINGS_KEY = 'webpro-mdx-settings';

function defaultSettings(): AppSettings {
  return {
    draftsDir: `${navigator.platform.includes('Win') ? 'Documents' : '~'}/WebproArticles (browser mode)`,
    githubOwner: 'chuckwebpro',
    githubRepo: 'webpro',
    githubBranch: 'main',
  };
}

function loadAll(): Record<string, DraftContent> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(drafts: Record<string, DraftContent>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

function nowIso() {
  return new Date().toISOString();
}

export const browserApi = {
  async getSettings(): Promise<AppSettings> {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return normalizeAppSettings(raw ? JSON.parse(raw) : defaultSettings());
  },

  async setDraftsDir(path: string): Promise<AppSettings> {
    const settings = normalizeAppSettings({ ...(await this.getSettings()), draftsDir: path });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  },

  async listDrafts(): Promise<DraftSummary[]> {
    return Object.values(loadAll())
      .map((d) => ({
        slug: d.meta.slug,
        title: d.meta.title,
        publishDate: d.meta.publishDate,
        draft: d.meta.draft,
        lastEdited: d.meta.lastEdited,
      }))
      .sort(
        (a, b) =>
          b.publishDate.localeCompare(a.publishDate) || a.slug.localeCompare(b.slug),
      );
  },

  async createDraft(title: string, slug?: string): Promise<DraftContent> {
    const all = loadAll();
    const finalSlug = slug?.trim() || slugifyPlainTitle(title);
    if (all[finalSlug]) throw new Error(`Draft "${finalSlug}" already exists`);
    const meta: DraftMeta = {
      slug: finalSlug,
      title,
      dek: DEFAULT_DEK,
      eyebrow: DEFAULT_EYEBROW,
      publishDate: todayIsoDate(),
      draft: false,
      author: DEFAULT_BYLINE_AUTHOR,
      company: DEFAULT_BYLINE_COMPANY,
      location: DEFAULT_BYLINE_LOCATION,
      tags: [],
      crescendoBody: [],
      lastEdited: nowIso(),
    };
    const draft: DraftContent = { meta, body: '' };
    all[finalSlug] = draft;
    saveAll(all);
    return draft;
  },

  async loadDraft(slug: string): Promise<DraftContent> {
    const draft = loadAll()[slug];
    if (!draft) throw new Error(`Draft "${slug}" not found`);
    return normalizeDraftContent(draft);
  },

  async saveDraft(content: DraftContent): Promise<DraftContent> {
    const all = loadAll();
    const next = {
      ...content,
      meta: { ...content.meta, lastEdited: nowIso() },
    };
    all[next.meta.slug] = next;
    saveAll(all);
    return next;
  },

  async deleteDraft(slug: string): Promise<void> {
    const all = loadAll();
    delete all[slug];
    saveAll(all);
  },

  async exportDraft(slug: string, exportDir: string, formattedMdx: string): Promise<ExportResult> {
    const draft = loadAll()[slug];
    if (!draft) throw new Error(`Draft "${slug}" not found`);
    const blob = new Blob([formattedMdx], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.mdx`;
    a.click();
    URL.revokeObjectURL(url);
    return {
      exportDir: exportDir || 'downloads',
      mdxPath: `${slug}.mdx`,
      imageCount: 0,
    };
  },

  async importMdx(_filePath: string): Promise<DraftContent> {
    throw new Error('Import requires the desktop app (npm run tauri:dev)');
  },

  async copyImageToDraft(_slug: string, _sourcePath: string): Promise<string> {
    throw new Error('Image insert requires the desktop app (npm run tauri:dev)');
  },

  async pickMdxFile(): Promise<string | null> {
    return null;
  },

  async pickImageFile(): Promise<string | null> {
    return null;
  },

  async pickExportFolder(): Promise<string | null> {
    return 'browser-downloads';
  },

  async pickDraftsFolder(): Promise<string | null> {
    return null;
  },
};

export function getApiMode(): 'tauri' | 'browser' {
  return isTauri() ? 'tauri' : 'browser';
}
