import { z } from 'zod';

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
  author: z.string().default('WEBPRO International Inc.'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  crescendoHeading: z.string().optional(),
  crescendoBody: z.array(z.string()).default([]),
  lastEdited: z.string(),
});

export type ArticleMeta = z.infer<typeof articleSchema>;

export function validateForExport(meta: ArticleMeta): string[] {
  const result = articleSchema.safeParse(meta);
  if (result.success) return [];
  return result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
}
