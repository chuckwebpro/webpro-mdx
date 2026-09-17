import type { ReactNode } from 'react';
import { ArchivoHtml } from './ArchivoHtml';
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
        {subjectFlag && <ArchivoHtml as="span" className={styles.flag} html={subjectFlag} />}
        <ArchivoHtml as="span" html={subject} />
      </p>
      {children}
    </div>
  );
}
