import type { ReactNode } from 'react';
import styles from './PullQuote.module.css';

export function PullQuote({ children }: { children?: ReactNode }) {
  return <blockquote className={styles.pullQuote}>{children}</blockquote>;
}
