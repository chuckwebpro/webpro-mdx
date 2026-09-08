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
  publishDate: string;
  updatedDate?: string;
  draft: boolean;
  author: string;
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
  'Client Report',
  'Press Release',
  'Content Governance',
] as const;

// Re-export component catalog from components module
export {
  COMPONENT_TEMPLATES,
  COMPONENT_CATALOG,
  DRAG_MIME,
  getComponentTemplate,
  type ComponentId,
  type ComponentCatalogItem,
} from './components';
