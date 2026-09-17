import type { ReactNode } from 'react';
import { wrapArchivoPeriods } from '../../lib/archivo';
import styles from './ClientQuote.module.css';

interface Props {
  attribution?: string;
  children?: ReactNode;
}

function quoteHtml(children: ReactNode): string {
  if (typeof children === 'string') return wrapArchivoPeriods(children);
  return wrapArchivoPeriods(String(children ?? ''));
}

export function ClientQuote({ attribution, children }: Props) {
  return (
    <blockquote className={styles.clientQuote}>
      <p
        className={styles.text}
        dangerouslySetInnerHTML={{ __html: quoteHtml(children) }}
      />
      {attribution && <div className={styles.attribution}>{attribution}</div>}
    </blockquote>
  );
}
