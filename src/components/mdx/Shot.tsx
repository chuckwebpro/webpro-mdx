import { useEffect, useState } from 'react';
import { isDraftAssetPath, resolveDraftAssetUrl } from '../../lib/draft-assets';
import { useDraftEditorSlugOptional } from '../../lib/draft-editor-context';
import styles from './Shot.module.css';

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
      <figure className={styles.shot}>
        <div className={styles.placeholder}>Image URL required</div>
        {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className={styles.shot}>
      <div className={styles.frame}>
        <img src={resolvedSrc} alt={alt} loading="lazy" decoding="async" className={styles.img} />
        {rank !== undefined && <span className={styles.rank}>#{rank}</span>}
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
