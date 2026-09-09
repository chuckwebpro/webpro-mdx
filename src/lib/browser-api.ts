import { isTauri } from './is-tauri';
import type {
  AppSettings,
  DraftContent,
  DraftSummary,
  DraftMeta,
  ExportResult,
} from './types';
import { buildByline } from './byline';
import {
  DEFAULT_BYLINE_AUTHOR,
  DEFAULT_BYLINE_COMPANY,
  DEFAULT_BYLINE_LOCATION,
  DEFAULT_CRESCENDO_BOOK_SUBTITLE,
  DEFAULT_CRESCENDO_BOOK_TITLE,
  DEFAULT_CRESCENDO_EYEBROW,
  DEFAULT_CRESCENDO_PRIMARY_CTA_HREF,
  DEFAULT_CRESCENDO_PRIMARY_CTA_LABEL,
  DEFAULT_CRESCENDO_SECONDARY_CTA_HREF,
  DEFAULT_CRESCENDO_SECONDARY_CTA_LABEL,
  DEFAULT_DEK,
  DEFAULT_EYEBROW,
  effectiveEyebrow,
} from './types';
import { normalizeDraftContent } from './normalize-draft';
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
      dek: DEFAULT_DEK,
      eyebrow: DEFAULT_EYEBROW,
      publishDate: todayIsoDate(),
      draft: false,
      author: DEFAULT_BYLINE_AUTHOR,
      company: DEFAULT_BYLINE_COMPANY,
      location: DEFAULT_BYLINE_LOCATION,
      tags: [],
      crescendoEyebrow: DEFAULT_CRESCENDO_EYEBROW,
      crescendoBody: [],
      crescendoBookTitle: DEFAULT_CRESCENDO_BOOK_TITLE,
      crescendoBookSubtitle: DEFAULT_CRESCENDO_BOOK_SUBTITLE,
      crescendoPrimaryCtaLabel: DEFAULT_CRESCENDO_PRIMARY_CTA_LABEL,
      crescendoPrimaryCtaHref: DEFAULT_CRESCENDO_PRIMARY_CTA_HREF,
      crescendoPrimaryCtaNewTab: true,
      crescendoSecondaryCtaLabel: DEFAULT_CRESCENDO_SECONDARY_CTA_LABEL,
      crescendoSecondaryCtaHref: DEFAULT_CRESCENDO_SECONDARY_CTA_HREF,
      crescendoSecondaryCtaNewTab: true,
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
  lines.push(`eyebrow: ${JSON.stringify(effectiveEyebrow(meta))}`);
  lines.push(`byline: ${JSON.stringify(buildByline(meta))}`);
  if (meta.updatedDate) lines.push(`updatedDate: ${meta.updatedDate}`);
  if (meta.draft) lines.push('draft: true');
  lines.push(`author: ${JSON.stringify(meta.company || DEFAULT_BYLINE_COMPANY)}`);
  if (meta.category) lines.push(`category: ${JSON.stringify(meta.category)}`);
  if (meta.tags.length) lines.push(`tags: [${meta.tags.map((t) => JSON.stringify(t)).join(', ')}]`);
  if (meta.crescendoEyebrow) lines.push(`crescendoEyebrow: ${JSON.stringify(meta.crescendoEyebrow)}`);
  if (meta.crescendoHeading) lines.push(`crescendoHeading: ${JSON.stringify(meta.crescendoHeading)}`);
  if (meta.crescendoBody.length) {
    lines.push('crescendoBody:');
    meta.crescendoBody.forEach((p) => lines.push(`  - ${JSON.stringify(p)}`));
  }
  if (meta.crescendoBookTitle) lines.push(`crescendoBookTitle: ${JSON.stringify(meta.crescendoBookTitle)}`);
  if (meta.crescendoBookSubtitle) {
    lines.push(`crescendoBookSubtitle: ${JSON.stringify(meta.crescendoBookSubtitle)}`);
  }
  if (meta.crescendoPrimaryCtaLabel) {
    lines.push(`crescendoPrimaryCtaLabel: ${JSON.stringify(meta.crescendoPrimaryCtaLabel)}`);
  }
  if (meta.crescendoPrimaryCtaHref) {
    lines.push(`crescendoPrimaryCtaHref: ${JSON.stringify(meta.crescendoPrimaryCtaHref)}`);
  }
  if (meta.crescendoPrimaryCtaNewTab === false) {
    lines.push('crescendoPrimaryCtaNewTab: false');
  }
  if (meta.crescendoSecondaryCtaLabel) {
    lines.push(`crescendoSecondaryCtaLabel: ${JSON.stringify(meta.crescendoSecondaryCtaLabel)}`);
  }
  if (meta.crescendoSecondaryCtaHref) {
    lines.push(`crescendoSecondaryCtaHref: ${JSON.stringify(meta.crescendoSecondaryCtaHref)}`);
  }
  if (meta.crescendoSecondaryCtaNewTab === false) {
    lines.push('crescendoSecondaryCtaNewTab: false');
  }
  lines.push('---');
  return lines.join('\n');
}

export function getApiMode(): 'tauri' | 'browser' {
  return isTauri() ? 'tauri' : 'browser';
}
