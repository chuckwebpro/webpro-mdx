import type { ReactNode } from 'react';
import styles from './CtaBlock.module.css';

interface Props {
  tag: string;
  heading: string;
  href: string;
  ctaLabel: string;
  children?: ReactNode;
}

export function CtaBlock({ tag, heading, href, ctaLabel, children }: Props) {
  return (
    <aside className={styles.block} aria-label={heading}>
      <p className={styles.tag}>{tag}</p>
      <h3 className={styles.heading}>{heading}</h3>
      <div className={styles.body}>{children}</div>
      <a className={styles.cta} href={href}>
        {ctaLabel}
      </a>
    </aside>
  );
}
