import { invoke } from '@tauri-apps/api/core';
import { getApiMode } from './browser-api';

export async function formatPublishableMdx(rawMdx: string): Promise<string> {
  if (getApiMode() === 'tauri') {
    return invoke<string>('format_mdx', { rawMdx });
  }
  // Browser preview mode skips Prettier — use the desktop app for CI-ready output.
  return rawMdx;
}

export async function preparePublishableMdx(
  meta: Parameters<typeof import('./build-publishable-mdx').buildPublishableMdx>[0],
  body: string,
  assetFilenames: string[],
): Promise<string> {
  const { buildPublishableMdx } = await import('./build-publishable-mdx');
  const raw = buildPublishableMdx(meta, body, assetFilenames);
  return formatPublishableMdx(raw);
}
