const WEBPRO_IMAGE_PREFIX = '/images/seo-insights/';

/** Discover image filenames referenced via webpro public paths in MDX body. */
export function discoverWebproImageFilenames(body: string): string[] {
  const found = new Set<string>();
  let start = 0;
  while (true) {
    const idx = body.indexOf(WEBPRO_IMAGE_PREFIX, start);
    if (idx === -1) break;
    const absIdx = idx + WEBPRO_IMAGE_PREFIX.length;
    const rest = body.slice(absIdx);
    const endMatch = rest.search(/[\s"'`)>`]/);
    const end = endMatch === -1 ? rest.length : endMatch;
    const filename = rest.slice(0, end).trim();
    if (filename && !filename.includes('/')) {
      found.add(filename);
    }
    start = absIdx + Math.max(end, 1);
  }
  return [...found].sort();
}

/** Reverse of `rewriteImagePaths` — webpro public URLs back to draft asset paths. */
export function rewriteWebproImagePathsForDraft(body: string): { body: string; filenames: string[] } {
  const filenames = discoverWebproImageFilenames(body);
  let rewritten = body;
  for (const filename of filenames) {
    const from = `${WEBPRO_IMAGE_PREFIX}${filename}`;
    const to = `assets/${filename}`;
    rewritten = rewritten.split(from).join(to);
  }
  return { body: rewritten, filenames };
}
