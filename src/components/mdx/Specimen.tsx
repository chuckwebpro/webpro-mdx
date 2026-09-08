import type { ReactNode } from 'react';
import styles from './Specimen.module.css';

interface Props {
  from: string;
  subject: string;
  subjectFlag?: string;
  children?: ReactNode;
}

export function Specimen({ from, subject, subjectFlag, children }: Props) {
  return (
    <div className={styles.specimen}>
      <p className={styles.from}>{from}</p>
      <p className={styles.subject}>
        {subjectFlag && <span className={styles.flag}>{subjectFlag}</span>}
        {subject}
      </p>
      {children}
    </div>
  );
}
