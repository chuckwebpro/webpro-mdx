import { buildByline } from './byline';
import type { DraftMeta } from './types';
import { DEFAULT_BYLINE_COMPANY, effectiveEyebrow } from './types';

function yamlScalar(value: string): string {
  if (
    value.includes('\n') ||
    value.includes('"') ||
    value.includes("'") ||
    value.includes(':') ||
    value.includes('#') ||
    value.includes('<') ||
    value.includes('>')
  ) {
    return JSON.stringify(value);
  }
  if (/^[a-zA-Z0-9_./ -]+$/.test(value)) {
    return value;
  }
  return JSON.stringify(value);
}

/** Build YAML frontmatter matching webpro seo-insights export rules. */
export function buildFrontmatter(meta: DraftMeta): string {
  const lines = [
    '---',
    `title: ${yamlScalar(meta.title)}`,
    `dek: ${yamlScalar(meta.dek)}`,
    `publishDate: ${meta.publishDate}`,
  ];

  if (meta.description?.trim()) {
    lines.push(`description: ${yamlScalar(meta.description.trim())}`);
  }
  lines.push(`eyebrow: ${yamlScalar(effectiveEyebrow(meta))}`);
  lines.push(`byline: ${yamlScalar(buildByline(meta))}`);
  if (meta.updatedDate) {
    lines.push(`updatedDate: ${meta.updatedDate}`);
  }
  if (meta.draft) {
    lines.push('draft: true');
  }
  lines.push(`author: ${yamlScalar(meta.company?.trim() || DEFAULT_BYLINE_COMPANY)}`);
  if (meta.category?.trim()) {
    lines.push(`category: ${yamlScalar(meta.category.trim())}`);
  }
  if (meta.tags.length) {
    lines.push(`tags: [${meta.tags.map((t) => yamlScalar(t)).join(', ')}]`);
  }
  if (meta.crescendoHeading?.trim()) {
    lines.push(`crescendoHeading: ${yamlScalar(meta.crescendoHeading.trim())}`);
  }
  if (meta.crescendoBody.length) {
    lines.push('crescendoBody:');
    meta.crescendoBody.forEach((para) => {
      lines.push(`  - ${yamlScalar(para)}`);
    });
  }

  lines.push('---');
  return lines.join('\n');
}

export function rewriteImagePaths(body: string, assetFilenames: string[]): string {
  let exported = body;
  for (const filename of assetFilenames) {
    const publicPath = `/images/seo-insights/${filename}`;
    exported = exported.split(`assets/${filename}`).join(publicPath);
    exported = exported.split(`./assets/${filename}`).join(publicPath);
  }
  return exported;
}

export function buildPublishableMdx(
  meta: DraftMeta,
  body: string,
  assetFilenames: string[],
): string {
  const exportedBody = rewriteImagePaths(body, assetFilenames).trim();
  return `${buildFrontmatter(meta)}\n\n${exportedBody}`;
}
