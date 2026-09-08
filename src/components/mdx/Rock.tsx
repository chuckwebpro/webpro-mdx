import type { ReactNode } from 'react';
import styles from './Rock.module.css';

export function RockGrid({ children }: { children?: ReactNode }) {
  return <ol className={styles.rockGrid}>{children}</ol>;
}

interface RockProps {
  n: number | string;
  label: string;
  meta?: string;
  children?: ReactNode;
}

export function Rock({ n, label, meta, children }: RockProps) {
  const num = String(n).padStart(2, '0');
  return (
    <li className={styles.rock}>
      <span className={styles.num}>{num}</span>
      <div className={styles.body}>
        {meta && <span className={styles.meta}>{meta}</span>}
        <h4 className={styles.label}>{label}</h4>
        {children}
      </div>
    </li>
  );
}
