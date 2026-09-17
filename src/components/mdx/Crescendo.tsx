import styles from './Crescendo.module.css';

/** Fixed crescendo chrome — matches webpro `InsightsCrescendo.astro` / `scroogled` config. */
const CRESCENDO_EYEBROW = 'The bigger picture';
const CRESCENDO_BOOK_TITLE = 'Scroogled.';
const CRESCENDO_BOOK_SUBTITLE = 'How Google Killed the Internet and How You Can Win';
const CRESCENDO_PRIMARY_CTA_LABEL = 'Visit scroogled.io';
const CRESCENDO_PRIMARY_CTA_HREF = 'https://www.scroogled.io/';
const CRESCENDO_SECONDARY_CTA_LABEL = 'Read it on Amazon';
const CRESCENDO_SECONDARY_CTA_HREF = 'https://www.amazon.com/dp/B0H9H6VVBQ';
const CRESCENDO_BODY_FALLBACK =
  'The pattern behind every false alarm, the strategy that beats it, and the playbook for winning organic search in spite of it all.';

interface Props {
  heading?: string;
  body?: string[];
}

function renderBookTitle(title: string) {
  if (title.endsWith('.')) {
    return (
      <>
        {title.slice(0, -1)}
        <span className={styles.dot}>.</span>
      </>
    );
  }
  return title;
}

export function InsightsCrescendo({ heading, body = [] }: Props) {
  return (
    <section className={styles.crescendo} aria-label="About Scroogled">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{CRESCENDO_EYEBROW}</p>
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {body.map((para, i) => (
          <p key={i} className={styles.body}>
            {para}
          </p>
        ))}
        {!heading && body.length === 0 && (
          <p className={styles.body}>{CRESCENDO_BODY_FALLBACK}</p>
        )}
        <div className={styles.bookTitle}>{renderBookTitle(CRESCENDO_BOOK_TITLE)}</div>
        <p className={styles.bookSub}>{CRESCENDO_BOOK_SUBTITLE}</p>
        <div className={styles.ctaRow}>
          <a
            className={`${styles.cta} ${styles.ctaPrimary}`}
            href={CRESCENDO_PRIMARY_CTA_HREF}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CRESCENDO_PRIMARY_CTA_LABEL}
          </a>
          <a
            className={`${styles.cta} ${styles.ctaGhost}`}
            href={CRESCENDO_SECONDARY_CTA_HREF}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CRESCENDO_SECONDARY_CTA_LABEL}
          </a>
        </div>
      </div>
    </section>
  );
}
