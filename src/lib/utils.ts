import { stripHtmlTags } from './html-text';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slug from a hero title that may contain `<span class="accent">` markup. */
export function slugifyPlainTitle(input: string): string {
  return slugify(stripHtmlTags(input));
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
