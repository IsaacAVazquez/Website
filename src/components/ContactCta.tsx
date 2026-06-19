import Link from "next/link";
import styles from "./ContactCta.module.css";

function MailIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
      <path d="M3 7l9 6l9 -6" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M8 11l0 5" />
      <path d="M8 8l0 .01" />
      <path d="M12 16l0 -5" />
      <path d="M16 16v-3a2 2 0 0 0 -4 0" />
    </svg>
  );
}

/**
 * The site-wide closing contact CTA. Mirrors the updated CTA at the bottom of
 * the home page so every full-footer page surfaces the same call to action.
 */
export function ContactCta() {
  return (
    <section className={styles.cta} id="contact" aria-labelledby="home-cta-heading">
      <div className={styles.shell}>
        <div className={styles.grid}>
          <div>
            <span className={styles.kicker}>Contact &middot; Currently open</span>
            <h2 id="home-cta-heading" className={styles.heading}>
              Building something that needs <em>judgment</em> and follow-through?
            </h2>
            <p className={styles.copy}>
              Especially interested in product, analytics, fintech, and workflow tools where
              clear thinking has to survive real delivery.
            </p>
          </div>
          <div className={styles.actions}>
            <a
              className={`${styles.btn} ${styles.btnAcid}`}
              href="mailto:IsaacVazquez@berkeley.edu"
            >
              Send email
              <MailIcon />
            </a>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href="/resume">
              View r&eacute;sum&eacute;
              <DocIcon />
            </Link>
            <a
              className={`${styles.btn} ${styles.btnGhost}`}
              href="https://www.linkedin.com/in/isaac-vazquez/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
              <LinkedInIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
