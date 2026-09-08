import { useState } from 'react';
import { getApiMode } from '../../lib/browser-api';
import { normalizeImageSrc } from '../../lib/shot-snippet';
import { pickImageFile, copyImageToDraft } from '../../lib/tauri';
import type { ShotFields } from '../../lib/shot-snippet';

type Tab = 'url' | 'file';

interface Props {
  slug: string;
  open: boolean;
  onClose: () => void;
  onInsert: (fields: ShotFields) => void;
}

export function InsertImageDialog({ slug, open, onClose, onInsert }: Props) {
  const [tab, setTab] = useState<Tab>('url');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [rank, setRank] = useState('');
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setUrl('');
    setAlt('');
    setCaption('');
    setRank('');
    setFileLabel(null);
    setFileSrc(null);
    setError(null);
    setTab('url');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickFile = async () => {
    setError(null);
    const path = await pickImageFile();
    if (!path) return;
    setBusy(true);
    try {
      const assetPath = await copyImageToDraft(slug, path);
      setFileSrc(assetPath);
      setFileLabel(path.split(/[/\\]/).pop() ?? path);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const altText = alt.trim();
    if (!altText) {
      setError('Alt text is required.');
      return;
    }

    let src: string;
    if (tab === 'file') {
      if (!fileSrc) {
        setError('Choose an image file first.');
        return;
      }
      src = fileSrc;
    } else {
      const normalized = normalizeImageSrc(url);
      if (!normalized) {
        setError('Enter an image URL or path.');
        return;
      }
      src = normalized;
    }

    const rankNum = rank.trim() ? Number(rank) : undefined;

    onInsert({
      src,
      alt: altText,
      caption: caption.trim() || undefined,
      rank: rankNum !== undefined && !Number.isNaN(rankNum) ? rankNum : undefined,
    });
    reset();
    onClose();
  };

  const isBrowser = getApiMode() === 'browser';

  return (
    <div className="dialog-backdrop" onClick={handleClose}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="insert-image-title"
      >
        <header className="dialog-header">
          <h2 id="insert-image-title">Insert image</h2>
          <button type="button" className="btn btn-icon dialog-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="dialog-tabs">
          <button
            type="button"
            className={`dialog-tab${tab === 'url' ? ' active' : ''}`}
            onClick={() => setTab('url')}
          >
            URL / path
          </button>
          <button
            type="button"
            className={`dialog-tab${tab === 'file' ? ' active' : ''}`}
            onClick={() => setTab('file')}
            disabled={isBrowser}
            title={isBrowser ? 'File pick requires desktop app' : undefined}
          >
            Local file
          </button>
        </div>

        <form className="dialog-body" onSubmit={handleSubmit}>
          {tab === 'url' ? (
            <div className="form-row">
              <label htmlFor="image-url">Image URL or path</label>
              <input
                id="image-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/images/seo-insights/screenshot.png"
                autoFocus
              />
              <p className="field-hint">
                Use a webpro public path (<code>/images/seo-insights/…</code>), full URL, or a filename
                (auto-prefixed).
              </p>
            </div>
          ) : (
            <div className="form-row">
              <label>Image file</label>
              <div className="file-pick-row">
                <button type="button" className="btn" onClick={handlePickFile} disabled={busy}>
                  {busy ? 'Copying…' : 'Choose file…'}
                </button>
                {fileLabel && <span className="file-pick-label">{fileLabel}</span>}
              </div>
              <p className="field-hint">
                Copied into draft <code>assets/</code>; exported to webpro on publish.
              </p>
            </div>
          )}

          <div className="form-row">
            <label htmlFor="image-alt">Alt text *</label>
            <input
              id="image-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for accessibility"
            />
          </div>

          <div className="form-row">
            <label htmlFor="image-caption">Caption</label>
            <input
              id="image-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption below the image"
            />
          </div>

          <div className="form-row">
            <label htmlFor="image-rank">SERP rank badge</label>
            <input
              id="image-rank"
              type="number"
              min={1}
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              placeholder="e.g. 3"
            />
          </div>

          {error && <p className="dialog-error">{error}</p>}

          <footer className="dialog-footer">
            <button type="button" className="btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Insert
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
