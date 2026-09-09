import type { DraftContent, DraftMeta } from './types';
import {
  DEFAULT_BYLINE_AUTHOR,
  DEFAULT_BYLINE_COMPANY,
  DEFAULT_BYLINE_LOCATION,
  DEFAULT_DEK,
} from './types';

export function normalizeDraftMeta(meta: DraftMeta): DraftMeta {
  return {
    ...meta,
    dek: meta.dek ?? DEFAULT_DEK,
    author: meta.author?.trim() || DEFAULT_BYLINE_AUTHOR,
    company: meta.company?.trim() || DEFAULT_BYLINE_COMPANY,
    location: meta.location?.trim() || DEFAULT_BYLINE_LOCATION,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    crescendoBody: Array.isArray(meta.crescendoBody) ? meta.crescendoBody : [],
  };
}

export function normalizeDraftContent(draft: DraftContent): DraftContent {
  return {
    meta: normalizeDraftMeta(draft.meta),
    body: typeof draft.body === 'string' ? draft.body : '',
  };
}
