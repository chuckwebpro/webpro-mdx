import { z } from 'zod';
import {
  DEFAULT_BYLINE_AUTHOR,
  DEFAULT_BYLINE_COMPANY,
  DEFAULT_BYLINE_LOCATION,
} from './types';

export const articleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  dek: z.string().min(1, 'Subtitle is required'),
  description: z.string().optional(),
  eyebrow: z.string().optional(),
  byline: z.string().optional(),
  publishDate: z.string().min(1, 'Publish date is required'),
  updatedDate: z.string().optional(),
  draft: z.boolean().default(false),
  author: z.string().default(DEFAULT_BYLINE_AUTHOR),
  company: z.string().optional().default(DEFAULT_BYLINE_COMPANY),
  location: z.string().optional().default(DEFAULT_BYLINE_LOCATION),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  crescendoEyebrow: z.string().optional(),
  crescendoHeading: z.string().optional(),
  crescendoBody: z.array(z.string()).default([]),
  crescendoBookTitle: z.string().optional(),
  crescendoBookSubtitle: z.string().optional(),
  crescendoPrimaryCtaLabel: z.string().optional(),
  crescendoPrimaryCtaHref: z.string().optional(),
  crescendoPrimaryCtaNewTab: z.boolean().optional(),
  crescendoSecondaryCtaLabel: z.string().optional(),
  crescendoSecondaryCtaHref: z.string().optional(),
  crescendoSecondaryCtaNewTab: z.boolean().optional(),
  lastEdited: z.string(),
});

import type { DraftMeta } from './types';

export type ArticleMeta = z.infer<typeof articleSchema>;

export function validateForExport(meta: DraftMeta): string[] {
  const result = articleSchema.safeParse(meta);
  if (result.success) return [];
  return result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
}
