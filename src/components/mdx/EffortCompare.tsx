import type { ReactNode } from 'react';
import styles from './EffortCompare.module.css';

export function EffortCompare({ children }: { children?: ReactNode }) {
  return <div className={styles.compare}>{children}</div>;
}

interface EffortColProps {
  variant: 'low' | 'high';
  title: string;
  items: string[];
}

export function EffortCol({ variant, title, items }: EffortColProps) {
  const icon = variant === 'low' ? '✗' : '✓';
  const isLow = variant === 'low';

  return (
    <div className={`${styles.col} ${isLow ? styles.colLow : ''}`}>
      <div className={`${styles.head} ${isLow ? styles.headLow : styles.headHigh}`}>
        {icon} {title}
      </div>
      {items.map((item) => (
        <div key={item} className={styles.item}>
          {item}
        </div>
      ))}
    </div>
  );
}
