import styles from './Crescendo.module.css';

interface Props {
  eyebrow: string;
  heading?: string;
  body?: string[];
  bodyFallback?: string;
  bookTitle: string;
  bookSubtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  primaryCtaNewTab: boolean;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaNewTab: boolean;
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

function CtaButton({
  label,
  href,
  variant,
  newTab,
}: {
  label: string;
  href: string;
  variant: 'primary' | 'ghost';
  newTab: boolean;
}) {
  const className = `${styles.cta} ${variant === 'primary' ? styles.ctaPrimary : styles.ctaGhost}`;
  if (href) {
    return (
      <a
        className={className}
        href={href}
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    );
  }
  return <span className={className}>{label}</span>;
}

export function InsightsCrescendo({
  eyebrow,
  heading,
  body = [],
  bodyFallback,
  bookTitle,
  bookSubtitle,
  primaryCtaLabel,
  primaryCtaHref,
  primaryCtaNewTab,
  secondaryCtaLabel,
  secondaryCtaHref,
  secondaryCtaNewTab,
}: Props) {
  return (
    <section className={styles.crescendo} aria-label="Crescendo">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {body.map((para, i) => (
          <p key={i} className={styles.body}>
            {para}
          </p>
        ))}
        {!heading && body.length === 0 && bodyFallback && (
          <p className={styles.body}>{bodyFallback}</p>
        )}
        <div className={styles.bookTitle}>{renderBookTitle(bookTitle)}</div>
        <p className={styles.bookSub}>{bookSubtitle}</p>
        <div className={styles.ctaRow}>
          <CtaButton
            label={primaryCtaLabel}
            href={primaryCtaHref}
            variant="primary"
            newTab={primaryCtaNewTab}
          />
          <CtaButton
            label={secondaryCtaLabel}
            href={secondaryCtaHref}
            variant="ghost"
            newTab={secondaryCtaNewTab}
          />
        </div>
      </div>
    </section>
  );
}
