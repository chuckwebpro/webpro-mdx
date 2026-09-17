import styles from './CodeBlock.module.css';

interface Props {
  label?: string;
  html: string;
}

export function CodeBlock({ label, html }: Props) {
  return (
    <div className={styles.codeWindow}>
      {label && (
        <div className={styles.bar}>
          <span className={`${styles.dot} ${styles.dotR}`} aria-hidden="true" />
          <span className={`${styles.dot} ${styles.dotY}`} aria-hidden="true" />
          <span className={`${styles.dot} ${styles.dotG}`} aria-hidden="true" />
          <span className={styles.file}>{label}</span>
        </div>
      )}
      <div className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
