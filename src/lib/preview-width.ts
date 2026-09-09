const STORAGE_KEY = 'webpro-mdx-preview-width';
export const DEFAULT_PREVIEW_WIDTH = 420;
export const MIN_PREVIEW_WIDTH = 280;
export const MIN_EDITOR_WIDTH = 360;
export const RESIZE_DIVIDER_WIDTH = 6;

export function loadPreviewWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const width = Number(stored);
      if (!Number.isNaN(width) && width >= MIN_PREVIEW_WIDTH) {
        return width;
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_PREVIEW_WIDTH;
}

export function savePreviewWidth(width: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(width)));
  } catch {
    // ignore storage errors
  }
}

export function clampPreviewWidth(width: number, workspaceWidth: number): number {
  const max = Math.max(MIN_PREVIEW_WIDTH, workspaceWidth - MIN_EDITOR_WIDTH - RESIZE_DIVIDER_WIDTH);
  return Math.min(max, Math.max(MIN_PREVIEW_WIDTH, width));
}

export function getEqualPreviewWidth(workspaceWidth: number): number {
  return clampPreviewWidth((workspaceWidth - RESIZE_DIVIDER_WIDTH) / 2, workspaceWidth);
}
