export interface AppSettings {
  draftsDir: string;
}

export interface DraftSummary {
  slug: string;
  title: string;
  publishDate: string;
  draft: boolean;
  lastEdited: string;
}

export interface DraftMeta {
  slug: string;
  title: string;
  dek: string;
  description?: string;
  eyebrow?: string;
  byline?: string;
  /** Person name shown first in the byline. */
  author: string;
  /** Company name in the byline; exported as webpro `author`. */
  company?: string;
  /** City, state segment of the byline. */
  location?: string;
  publishDate: string;
  updatedDate?: string;
  draft: boolean;
  category?: string;
  tags: string[];
  crescendoEyebrow?: string;
  crescendoHeading?: string;
  crescendoBody: string[];
  crescendoBookTitle?: string;
  crescendoBookSubtitle?: string;
  crescendoPrimaryCtaLabel?: string;
  crescendoPrimaryCtaHref?: string;
  crescendoPrimaryCtaNewTab?: boolean;
  crescendoSecondaryCtaLabel?: string;
  crescendoSecondaryCtaHref?: string;
  crescendoSecondaryCtaNewTab?: boolean;
  lastEdited: string;
}

export interface DraftContent {
  meta: DraftMeta;
  body: string;
}

export interface ExportResult {
  exportDir: string;
  mdxPath: string;
  imageCount: number;
}

export const CATEGORIES = [
  'White Paper',
  'SEO Scientific',
  'AI Search Measurement',
  'Client Report',
  'Press Release',
  'Content Governance',
  'Content Strategy',
] as const;

export const DEFAULT_EYEBROW = 'A WEBPRO White Paper / SEO Scientific';

export const DEFAULT_DEK =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor.';

export const DEFAULT_BYLINE_AUTHOR = 'Bennie Warshaw';
export const DEFAULT_BYLINE_COMPANY = 'WEBPRO International Inc.';
export const DEFAULT_BYLINE_LOCATION = 'Savannah, GA';

export const DEFAULT_CRESCENDO_EYEBROW = 'The bigger picture';
export const DEFAULT_CRESCENDO_BOOK_TITLE = 'Scroogled.';
export const DEFAULT_CRESCENDO_BOOK_SUBTITLE =
  'SEO Survival. How Google Killed the Internet, and How You Can Win.';
export const DEFAULT_CRESCENDO_PRIMARY_CTA_LABEL = 'Visit scroogled.io';
export const DEFAULT_CRESCENDO_PRIMARY_CTA_HREF = 'https://scroogled.io';
export const DEFAULT_CRESCENDO_SECONDARY_CTA_LABEL = 'Read it on Amazon';
export const DEFAULT_CRESCENDO_SECONDARY_CTA_HREF = 'https://www.amazon.com';

export const DEFAULT_CRESCENDO_BODY_FALLBACK =
  'The pattern behind every false alarm, the strategy that beats it, and the playbook for winning organic search in spite of it all.';

export function effectiveCrescendoEyebrow(meta: Pick<DraftMeta, 'crescendoEyebrow'>): string {
  const trimmed = meta.crescendoEyebrow?.trim();
  return trimmed || DEFAULT_CRESCENDO_EYEBROW;
}

export function effectiveCrescendoBookTitle(meta: Pick<DraftMeta, 'crescendoBookTitle'>): string {
  const trimmed = meta.crescendoBookTitle?.trim();
  return trimmed || DEFAULT_CRESCENDO_BOOK_TITLE;
}

export function effectiveCrescendoBookSubtitle(
  meta: Pick<DraftMeta, 'crescendoBookSubtitle'>,
): string {
  const trimmed = meta.crescendoBookSubtitle?.trim();
  return trimmed || DEFAULT_CRESCENDO_BOOK_SUBTITLE;
}

export function effectiveCrescendoPrimaryCtaLabel(
  meta: Pick<DraftMeta, 'crescendoPrimaryCtaLabel'>,
): string {
  const trimmed = meta.crescendoPrimaryCtaLabel?.trim();
  return trimmed || DEFAULT_CRESCENDO_PRIMARY_CTA_LABEL;
}

export function effectiveCrescendoPrimaryCtaHref(
  meta: Pick<DraftMeta, 'crescendoPrimaryCtaHref'>,
): string {
  const trimmed = meta.crescendoPrimaryCtaHref?.trim();
  return trimmed || DEFAULT_CRESCENDO_PRIMARY_CTA_HREF;
}

export function effectiveCrescendoSecondaryCtaLabel(
  meta: Pick<DraftMeta, 'crescendoSecondaryCtaLabel'>,
): string {
  const trimmed = meta.crescendoSecondaryCtaLabel?.trim();
  return trimmed || DEFAULT_CRESCENDO_SECONDARY_CTA_LABEL;
}

export function effectiveCrescendoSecondaryCtaHref(
  meta: Pick<DraftMeta, 'crescendoSecondaryCtaHref'>,
): string {
  const trimmed = meta.crescendoSecondaryCtaHref?.trim();
  return trimmed || DEFAULT_CRESCENDO_SECONDARY_CTA_HREF;
}

export function effectiveCrescendoPrimaryCtaNewTab(
  meta: Pick<DraftMeta, 'crescendoPrimaryCtaNewTab'>,
): boolean {
  return meta.crescendoPrimaryCtaNewTab ?? true;
}

export function effectiveCrescendoSecondaryCtaNewTab(
  meta: Pick<DraftMeta, 'crescendoSecondaryCtaNewTab'>,
): boolean {
  return meta.crescendoSecondaryCtaNewTab ?? true;
}

export function effectiveEyebrow(meta: Pick<DraftMeta, 'eyebrow'>): string {
  const trimmed = meta.eyebrow?.trim();
  return trimmed || DEFAULT_EYEBROW;
}

// Re-export component catalog from components module
export {
  COMPONENT_TEMPLATES,
  COMPONENT_CATALOG,
  DRAG_MIME,
  getComponentTemplate,
  type ComponentId,
  type ComponentCatalogItem,
} from './components';
