import type { ReactNode } from 'react';
import styles from './Verdict.module.css';

interface Props {
  label?: string;
  children?: ReactNode;
}

export function Verdict({ label = 'The Truth', children }: Props) {
  return (
    <div className={styles.verdict}>
      <div className={styles.verdictLabel}>{label}</div>
      <div className={styles.verdictText}>{children}</div>
    </div>
  );
}
