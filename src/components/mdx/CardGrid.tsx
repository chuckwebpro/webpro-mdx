import type { ReactNode } from 'react';
import styles from './CardGrid.module.css';

export function CardGrid({ children }: { children?: ReactNode }) {
  return <div className={styles.cardGrid}>{children}</div>;
}

interface GridCardProps {
  n: number | string;
  title: string;
  children?: ReactNode;
}

export function GridCard({ n, title, children }: GridCardProps) {
  const num = String(n).padStart(2, '0');
  return (
    <article className={styles.gridCard}>
      <p className={styles.num}>{num}</p>
      <p className={styles.title}>{title}</p>
      <div className={styles.body}>{children}</div>
    </article>
  );
}
