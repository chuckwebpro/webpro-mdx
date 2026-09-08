import type { ReactNode } from 'react';
import styles from './SpecimenTag.module.css';

export function SpecimenTag({ children }: { children?: ReactNode }) {
  return <span className={styles.tag}>{children}</span>;
}
