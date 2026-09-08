import styles from './CodeBlock.module.css';

interface Props {
  label?: string;
  html: string;
}

export function CodeBlock({ label, html }: Props) {
  return (
    <div className={styles.codeBlock}>
      {label && <p className={styles.label}>{label}</p>}
      <div className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
