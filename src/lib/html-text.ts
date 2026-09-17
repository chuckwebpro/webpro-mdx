/** Remove HTML tags and collapse whitespace (for slugs, labels, SEO plain text). */
export function stripHtmlTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Page/hero title may include markup; `<title>` and slugs use plain text only. */
export function plainTitle(input: string): string {
  return stripHtmlTags(input);
}
