import { isTauri } from './is-tauri';
import type {
  AppSettings,
  DraftContent,
  DraftSummary,
  DraftMeta,
  ExportResult,
} from './types';
import { slugify, todayIsoDate } from './utils';

const STORAGE_KEY = 'webpro-mdx-drafts';
const SETTINGS_KEY = 'webpro-mdx-settings';

function defaultSettings(): AppSettings {
  return {
    draftsDir: `${navigator.platform.includes('Win') ? 'Documents' : '~'}/WebproArticles (browser mode)`,
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
    return raw ? JSON.parse(raw) : defaultSettings();
  },

  async setDraftsDir(path: string): Promise<AppSettings> {
    const settings = { draftsDir: path };
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
      .sort((a, b) => b.lastEdited.localeCompare(a.lastEdited));
  },

  async createDraft(title: string, slug?: string): Promise<DraftContent> {
    const all = loadAll();
    const finalSlug = slug?.trim() || slugify(title);
    if (all[finalSlug]) throw new Error(`Draft "${finalSlug}" already exists`);
    const meta: DraftMeta = {
      slug: finalSlug,
      title,
      dek: '',
      publishDate: todayIsoDate(),
      draft: true,
      author: 'WEBPRO International Inc.',
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
    return draft;
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

  async exportDraft(slug: string, exportDir: string): Promise<ExportResult> {
    const draft = loadAll()[slug];
    if (!draft) throw new Error(`Draft "${slug}" not found`);
    // Browser mode: download .mdx file instead of writing to disk
    const frontmatter = buildFrontmatter(draft.meta);
    const blob = new Blob([`${frontmatter}\n\n${draft.body}`], { type: 'text/markdown' });
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

function buildFrontmatter(meta: DraftMeta): string {
  const lines = [
    '---',
    `title: ${JSON.stringify(meta.title)}`,
    `dek: ${JSON.stringify(meta.dek)}`,
    `publishDate: ${meta.publishDate}`,
  ];
  if (meta.description) lines.push(`description: ${JSON.stringify(meta.description)}`);
  if (meta.eyebrow) lines.push(`eyebrow: ${JSON.stringify(meta.eyebrow)}`);
  if (meta.byline) lines.push(`byline: ${JSON.stringify(meta.byline)}`);
  if (meta.updatedDate) lines.push(`updatedDate: ${meta.updatedDate}`);
  if (meta.draft) lines.push('draft: true');
  lines.push(`author: ${JSON.stringify(meta.author)}`);
  if (meta.category) lines.push(`category: ${JSON.stringify(meta.category)}`);
  if (meta.tags.length) lines.push(`tags: [${meta.tags.map((t) => JSON.stringify(t)).join(', ')}]`);
  if (meta.crescendoHeading) lines.push(`crescendoHeading: ${JSON.stringify(meta.crescendoHeading)}`);
  if (meta.crescendoBody.length) {
    lines.push('crescendoBody:');
    meta.crescendoBody.forEach((p) => lines.push(`  - ${JSON.stringify(p)}`));
  }
  lines.push('---');
  return lines.join('\n');
}

export function getApiMode(): 'tauri' | 'browser' {
  return isTauri() ? 'tauri' : 'browser';
}
