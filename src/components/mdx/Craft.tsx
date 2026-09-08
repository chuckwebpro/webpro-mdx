import type { ReactNode } from 'react';
import styles from './Craft.module.css';

export function CraftGrid({ children }: { children?: ReactNode }) {
  return <div className={styles.craftGrid}>{children}</div>;
}

interface CraftRowProps {
  n: string;
  label: string;
  children?: ReactNode;
}

export function CraftRow({ n, label, children }: CraftRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.n}>{n}</span>
      <div className={styles.body}>
        <h4 className={styles.label}>{label}</h4>
        {children}
      </div>
    </div>
  );
}
