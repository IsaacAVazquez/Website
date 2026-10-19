import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { profile } from "@/lib/profile";
import styles from "./Catalog97Contact.module.css";

/** The day the card was last set. The page's metadata and the stamp both read it. */
export const CONTACT_DATE_MODIFIED = "2026-10-19";

// A 44px tap height for the address links without moving them off their line,
// the same padding and cancelling margin the header wordmark uses.
const touchTarget = {
  display: "inline-block",
  paddingBlock: "var(--c97-touch-y)",
  marginBlock: "calc(-1 * var(--c97-touch-y))",
} as const;

/**
 * Contact, as a reply card (2026-10-19).
 *
 * One postal card on one paper band. The message is the left half, with the
 * headline that `e2e/footer-cta.spec.ts` pins and the reply time at the foot,
 * and the address is the right half, the stamp top right and the four address
 * lines at the bottom with the email as the largest. One sentence under the
 * card points at the résumé and the Work page.
 *
 * There is no form backend in this repo, so there is no form, since shipping
 * the markup would look right and silently drop every message sent through it.
 */
export function Catalog97Contact() {
  return (
    <Catalog97Shell>
      <section className="c97-band" data-c97-surface="paper">
        <div className={`c97-shell ${styles.post}`}>
          <div className={styles.offset}>
            <div className={styles.card} data-card data-c97-object>
              <div className={styles.message}>
                <h1 className={`c97-poster ${styles.headline}`}>
                  I&rsquo;d like to hear from you.
                </h1>
                <p className={styles.body}>
                  I&rsquo;m looking for a full-time product role that starts
                  after I graduate from Haas in May 2027, and I&rsquo;m always
                  glad to compare notes on product, analytics, or fintech. If
                  something on this site looks wrong to you, I want to hear
                  about that too.
                </p>
                <p className={styles.aside}>
                  Name the project in the subject line so I can pull up the
                  details before I reply.
                </p>
                <p className={`c97-kicker ${styles.reply}`}>
                  Reply within two working days · if it&rsquo;s been longer,
                  send it again
                </p>
              </div>

              <div className={styles.rule} aria-hidden="true" />

              <div className={styles.address}>
                <div className={styles.stamp} data-stamp aria-hidden="true">
                  <div className={styles.stampInk} data-c97-surface="ink-blue">
                    Isaac Vazquez
                    <small>Berkeley · CA · {CONTACT_DATE_MODIFIED.slice(0, 4)}</small>
                  </div>
                </div>
                <dl className={styles.lines}>
                  <div className={styles.line}>
                    <dt className="c97-kicker">To</dt>
                    <dd>Isaac Vazquez, Berkeley, CA</dd>
                  </div>
                  <div className={`${styles.line} ${styles.email}`}>
                    <dt className="c97-kicker">Email</dt>
                    <dd>
                      <a href={`mailto:${profile.email}`} style={touchTarget}>
                        {profile.email}
                      </a>
                    </dd>
                  </div>
                  <div className={styles.line}>
                    <dt className="c97-kicker">LinkedIn</dt>
                    <dd>
                      <a
                        href={profile.sameAs.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn, isaac-vazquez, opens in a new tab"
                        style={touchTarget}
                      >
                        isaac-vazquez
                      </a>
                    </dd>
                  </div>
                  <div className={styles.line}>
                    <dt className="c97-kicker">GitHub</dt>
                    <dd>
                      <a
                        href={profile.sameAs.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub, IsaacAVazquez, opens in a new tab"
                        style={touchTarget}
                      >
                        IsaacAVazquez
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <p className={styles.after}>
            The <Link className="c97-link" href="/resume">résumé</Link> has the
            short version of my background, and the{" "}
            <Link className="c97-link" href="/portfolio">Work page</Link> has the
            longer one.
          </p>
        </div>
      </section>
    </Catalog97Shell>
  );
}
