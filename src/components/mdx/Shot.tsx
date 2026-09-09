import { useEffect, useState } from 'react';
import { isDraftAssetPath, resolveDraftAssetUrl } from '../../lib/draft-assets';
import { useDraftEditorSlugOptional } from '../../lib/draft-editor-context';

interface Props {
  src: string;
  alt: string;
  rank?: number | string;
  caption?: string;
}

export function Shot({ src = '', alt = '', rank, caption }: Props) {
  const slug = useDraftEditorSlugOptional();
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const safeSrc = src ?? '';

  useEffect(() => {
    let cancelled = false;

    if (!safeSrc.trim() || !isDraftAssetPath(safeSrc) || !slug) {
      setResolvedSrc(safeSrc);
      return;
    }

    void resolveDraftAssetUrl(slug, safeSrc).then((url) => {
      if (!cancelled) setResolvedSrc(url);
    });

    return () => {
      cancelled = true;
    };
  }, [safeSrc, slug]);

  if (!safeSrc.trim()) {
    return (
      <figure className="shot-block" style={{ marginBlock: '2em' }}>
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-line-base)',
            color: 'var(--color-ink-muted)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.78rem',
          }}
        >
          Image URL required
        </div>
        {caption && (
          <figcaption
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.78rem',
              color: 'var(--color-ink-muted)',
              textAlign: 'center',
              marginTop: '0.75rem',
            }}
          >
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="shot-block" style={{ marginBlock: '2em' }}>
      <div style={{ position: 'relative' }}>
        <img
          src={resolvedSrc}
          alt={alt}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-line-base)',
          }}
        />
        {rank !== undefined && (
          <span
            style={{
              position: 'absolute',
              top: '0.625rem',
              left: '0.625rem',
              background: 'var(--color-brand-500)',
              color: '#fff',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            #{rank}
          </span>
        )}
      </div>
      {caption && (
        <figcaption
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.78rem',
            color: 'var(--color-ink-muted)',
            textAlign: 'center',
            marginTop: '0.75rem',
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
