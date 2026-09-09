import type { DraftMeta } from './types';
import { DEFAULT_BYLINE_AUTHOR, DEFAULT_BYLINE_COMPANY, DEFAULT_BYLINE_LOCATION } from './types';

/** WEBPRO founding date for “Years in Organic Search”. */
const FOUNDING = { year: 1994, month: 11, day: 1 };

export function yearsSinceFounded(at = new Date()): number {
  let years = at.getFullYear() - FOUNDING.year;
  const month = at.getMonth() + 1;
  const day = at.getDate();
  if (month < FOUNDING.month || (month === FOUNDING.month && day < FOUNDING.day)) {
    years -= 1;
  }
  return years;
}

export function yearsInOrganicSearchLabel(at = new Date()): string {
  return `${yearsSinceFounded(at)} Years in Organic Search`;
}

export function estimateReadTime(body: string): string {
  const text = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/[{}\[\]`]/g, ' ')
    .trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export interface BuildBylineOptions {
  /** Include estimated read time (editor preview). Omitted on export — webpro appends it. */
  includeReadTime?: boolean;
  body?: string;
}

export function buildByline(
  meta: Pick<DraftMeta, 'author' | 'company' | 'location' | 'byline'>,
  options: BuildBylineOptions = {},
): string {
  if (meta.byline?.trim()) {
    return meta.byline.trim();
  }

  const author = (meta.author || DEFAULT_BYLINE_AUTHOR).trim();
  const company = (meta.company || DEFAULT_BYLINE_COMPANY).trim();
  const location = (meta.location || DEFAULT_BYLINE_LOCATION).trim();
  const years = yearsInOrganicSearchLabel();

  const main = [author, company, years, location].filter(Boolean).join(' / ');

  if (options.includeReadTime) {
    return `${main} · ${estimateReadTime(options.body ?? '')}`;
  }

  return main;
}
