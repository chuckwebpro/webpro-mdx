import { useEffect, useState, type ComponentType } from 'react';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import type { DraftMeta } from '../../lib/types';
import { buildByline } from '../../lib/byline';
import {
  DEFAULT_CRESCENDO_BODY_FALLBACK,
  effectiveCrescendoBookSubtitle,
  effectiveCrescendoBookTitle,
  effectiveCrescendoEyebrow,
  effectiveCrescendoPrimaryCtaHref,
  effectiveCrescendoPrimaryCtaLabel,
  effectiveCrescendoPrimaryCtaNewTab,
  effectiveCrescendoSecondaryCtaHref,
  effectiveCrescendoSecondaryCtaLabel,
  effectiveCrescendoSecondaryCtaNewTab,
  effectiveEyebrow,
} from '../../lib/types';
import { mdxComponents } from '../mdx';
import { InsightsCrescendo } from '../mdx/Crescendo';

interface Props {
  meta: DraftMeta;
  body: string;
}

export function ArticlePreview({ meta, body }: Props) {
  const [Content, setContent] = useState<ComponentType<{ components?: typeof mdxComponents }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMdx() {
      if (!body.trim()) {
        setContent(null);
        setError(null);
        return;
      }

      try {
        const compiled = await compile(body, {
          outputFormat: 'function-body',
          development: false,
        });
        const { default: MdxContent } = await run(String(compiled), {
          ...runtime,
          baseUrl: import.meta.url,
        });
        if (!cancelled) {
          setContent(() => MdxContent);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setContent(null);
          setError(err instanceof Error ? err.message : 'Preview error');
        }
      }
    }

    renderMdx();
    return () => {
      cancelled = true;
    };
  }, [body]);

  const eyebrow = effectiveEyebrow(meta);
  const byline = buildByline(meta, { includeReadTime: true, body });

  return (
    <div>
      <div className="preview-pane-header">Live Preview</div>
      <header className="insight-hero">
        <div className="insight-wrap">
          <p className="insight-eyebrow">{eyebrow}</p>
          <h1
            className="insight-headline"
            dangerouslySetInnerHTML={{ __html: meta.title }}
          />
          {meta.dek && <p className="insight-dek">{meta.dek}</p>}
          <p className="insight-byline">{byline}</p>
        </div>
      </header>

      <div className="insight-article-container">
        {error && <div className="preview-error">Preview: {error}</div>}
        <div className="insights-body">
          {Content ? <Content components={mdxComponents} /> : !error && <p>Start writing to see preview…</p>}
        </div>
      </div>

      <InsightsCrescendo
        eyebrow={effectiveCrescendoEyebrow(meta)}
        heading={meta.crescendoHeading}
        body={meta.crescendoBody}
        bodyFallback={DEFAULT_CRESCENDO_BODY_FALLBACK}
        bookTitle={effectiveCrescendoBookTitle(meta)}
        bookSubtitle={effectiveCrescendoBookSubtitle(meta)}
        primaryCtaLabel={effectiveCrescendoPrimaryCtaLabel(meta)}
        primaryCtaHref={effectiveCrescendoPrimaryCtaHref(meta)}
        primaryCtaNewTab={effectiveCrescendoPrimaryCtaNewTab(meta)}
        secondaryCtaLabel={effectiveCrescendoSecondaryCtaLabel(meta)}
        secondaryCtaHref={effectiveCrescendoSecondaryCtaHref(meta)}
        secondaryCtaNewTab={effectiveCrescendoSecondaryCtaNewTab(meta)}
      />
    </div>
  );
}
