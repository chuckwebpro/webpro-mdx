import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { wrapArchivoPeriods } from '../../lib/archivo';
import styles from './ClientQuote.module.css';

interface Props {
  attribution?: string;
  children?: ReactNode;
}

function quoteHtml(children: ReactNode): string {
  if (children == null || children === false) return '';
  if (typeof children === 'string' || typeof children === 'number') {
    return wrapArchivoPeriods(String(children));
  }
  return wrapArchivoPeriods(renderToStaticMarkup(<>{children}</>));
}

export function ClientQuote({ attribution, children }: Props) {
  return (
    <blockquote className={styles.clientQuote}>
      <div
        className={styles.text}
        dangerouslySetInnerHTML={{ __html: quoteHtml(children) }}
      />
      {attribution && <div className={styles.attribution}>{attribution}</div>}
    </blockquote>
  );
}
