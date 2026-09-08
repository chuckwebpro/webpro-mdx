import type { ReactNode } from 'react';
import styles from './SourceNote.module.css';

export function SourceNote({ children }: { children?: ReactNode }) {
  return <aside className={styles.sourceNote}>{children}</aside>;
}
