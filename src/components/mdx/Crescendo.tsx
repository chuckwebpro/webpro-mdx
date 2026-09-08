import styles from './Crescendo.module.css';

interface Props {
  heading?: string;
  body?: string[];
}

export function InsightsCrescendo({ heading, body = [] }: Props) {
  return (
    <section className={styles.crescendo} aria-label="About Scroogled">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>The bigger picture</p>
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {body.map((para, i) => (
          <p key={i} className={styles.body}>
            {para}
          </p>
        ))}
        {!heading && body.length === 0 && (
          <p className={styles.body}>
            The pattern behind every false alarm, the strategy that beats it, and the playbook for
            winning organic search in spite of it all.
          </p>
        )}
        <div className={styles.bookTitle}>
          Scroogled<span className={styles.dot}>.</span>
        </div>
        <p className={styles.bookSub}>
          SEO Survival. How Google Killed the Internet, and How You Can Win.
        </p>
        <div className={styles.ctaRow}>
          <span className={`${styles.cta} ${styles.ctaPrimary}`}>Visit scroogled.io</span>
          <span className={`${styles.cta} ${styles.ctaGhost}`}>Read it on Amazon</span>
        </div>
      </div>
    </section>
  );
}
