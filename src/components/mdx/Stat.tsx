import type { ReactNode } from 'react';
import styles from './Stat.module.css';

export function StatRow({ children }: { children?: ReactNode }) {
  return <div className={styles.statRow}>{children}</div>;
}

interface StatCardProps {
  value: string;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
