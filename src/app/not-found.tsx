import Link from "next/link";
import styles from "./not-found.module.css";

// A deliberately over-the-top 90s "GeoCities" 404 page. It intentionally
// breaks from the site's editorial design system for comedic effect; all of
// its styling is scoped to not-found.module.css so nothing leaks elsewhere.
export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <p className={styles.blink}>* ERROR 404 * PAGE NOT FOUND *</p>

        <h1 className={styles.bigError}>404</h1>

        <h2 className={styles.heading}>~*~ Oops! You Broke The Internet ~*~</h2>

        <div className={styles.marqueeBar}>
          <span className={styles.marqueeTrack}>
            Welcome 2 my homepage!!! The page u r looking 4 has wandered off
            into cyberspace... try the links below!!! &lt;3 &lt;3 &lt;3
          </span>
        </div>

        <div className={styles.construction}>
          <span className={styles.constructionInner}>
            🚧 THIS PAGE IS UNDER CONSTRUCTION 🚧
          </span>
        </div>

        <p className={styles.bodyText}>
          The URL you typed isn&apos;t on the server (or maybe it never was?).
          Don&apos;t worry though &mdash; grab a Surge, fire up Netscape
          Navigator, and pick one of these totally rad destinations:
        </p>

        <span className={styles.divider} />

        <div className={styles.linkRow}>
          <Link href="/" className={styles.retroLink}>
            🏠 Back 2 Home Page
          </Link>
          <Link href="/portfolio" className={styles.retroLink}>
            💾 My Kool Projects
          </Link>
          <Link href="/writing" className={styles.retroLink}>
            📖 Read My Web Log
          </Link>
          <Link href="/contact" className={styles.retroLink}>
            📧 E-Mail Me!
          </Link>
        </div>

        <span className={styles.divider} />

        <p className={styles.counterLabel}>You are visitor number:</p>
        <span className={styles.counter}>0000404</span>

        <p className={styles.webring}>
          [ Best viewed in Netscape Navigator 4.0 @ 800&times;600 ]
        </p>

        <p className={styles.footerNote}>
          Sign my guestbook! &middot; This site is a proud member of the
          WebRing &middot; Made with &lt;BLINK&gt; and a 56k modem
        </p>
      </div>
    </div>
  );
}
