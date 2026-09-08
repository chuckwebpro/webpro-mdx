export interface ShotFields {
  src: string;
  alt: string;
  caption?: string;
  rank?: number;
}

export function buildShotSnippet({ src, alt, caption, rank }: ShotFields): string {
  const lines = ['<Shot', `  src="${escapeAttr(src)}"`, `  alt="${escapeAttr(alt)}"`];
  if (rank !== undefined && !Number.isNaN(rank)) {
    lines.push(`  rank={${rank}}`);
  }
  if (caption?.trim()) {
    lines.push(`  caption="${escapeAttr(caption.trim())}"`);
  }
  lines.push('/>');
  return `\n${lines.join('\n')}\n`;
}

function escapeAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Normalize user URL input for webpro export compatibility */
export function normalizeImageSrc(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (!trimmed.includes('/')) {
    return `/images/seo-insights/${trimmed}`;
  }
  return trimmed;
}
