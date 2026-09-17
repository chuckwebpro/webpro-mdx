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
  crescendoHeading?: string;
  crescendoBody: string[];
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
