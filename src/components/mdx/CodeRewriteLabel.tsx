import styles from './CodeRewriteLabel.module.css';

interface Props {
  label: string;
}

export function CodeRewriteLabel({ label }: Props) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
