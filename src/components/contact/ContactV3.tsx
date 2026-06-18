import Link from "next/link";
import styles from "@/app/contact/contact.module.css";

/**
 * ContactV3 — v3 editorial-brutalist contact surface.
 *
 * Server component: there is no interactivity, just static editorial copy
 * with `mailto:` + external links. The global `StaticHeader` and `Footer`
 * (compact variant on /contact) handle chrome — this component only renders
 * the content sections.
 *
 * Each fact lives in exactly one place: status in the masthead pin, the
 * quick facts in the stat strip, contact methods in the channel ribbon,
 * and the explore-more links in the closing actions.
 */
export function ContactV3() {
  return (
    <div className={styles.page}>
      {/* Masthead */}
      <section
        className={styles["c-masthead"]}
        data-screen-label="01 Contact / Masthead"
      >
        <div className={styles.shell}>
          <div className={styles["c-kicker-row"]}>
            <span className={styles.dept}>Dept. 04</span>
            <span>The Inbox</span>
            <span>—</span>
            <span>Vol. 2026</span>
            <span className={styles["status-pin"]}>
              Currently open · Product roles
            </span>
          </div>
          <h1 className={styles["c-wordmark"]}>
            Get in <em>touch</em>.
          </h1>
          <div className={styles["c-subline"]}>
            <p className={styles["c-tagline"]}>
              There are two ways in, a working email and a LinkedIn. No form, no
              funnel, no <em>auto-responder</em>.
            </p>
            <div className={styles["c-side"]}>
              <div className={styles["c-stat-strip"]}>
                <div>
                  <span className={styles.lbl}>Response</span>
                  <span className={styles.val}>2 business days</span>
                </div>
                <div>
                  <span className={styles.lbl}>Best for</span>
                  <span className={styles.val}>Product · Analytics</span>
                </div>
                <div>
                  <span className={styles.lbl}>Based in</span>
                  <span className={styles.val}>Berkeley · PT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channel ribbon — primary contact rail */}
      <div className={styles["c-channel-band"]}>
        <div className={styles["c-channels"]}>
          <a
            className={`${styles["c-channel"]} ${styles["is-primary"]}`}
            href="mailto:IsaacVazquez@berkeley.edu"
          >
            <div className={styles.topline}>
              <span className={styles.lbl}>Primary</span>
              <span className={styles.num}>{"№"} 01</span>
            </div>
            <p className={styles.val}>
              IsaacVazquez<wbr />@berkeley.edu
            </p>
            <div className={styles.footline}>
              <span>Email · best for everything</span>
              <span className={styles.arrow}>{"↗"}</span>
            </div>
          </a>
          <a
            className={styles["c-channel"]}
            href="https://www.linkedin.com/in/isaac-vazquez"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.topline}>
              <span className={styles.lbl}>Secondary</span>
              <span className={styles.num}>{"№"} 02</span>
            </div>
            <p className={styles.val}>
              linkedin.com/<wbr />in/<em>isaac-vazquez</em>
            </p>
            <div className={styles.footline}>
              <span>Intros · roles · referrals</span>
              <span className={styles.arrow}>{"↗"}</span>
            </div>
          </a>
          <Link className={styles["c-channel"]} href="/writing">
            <div className={styles.topline}>
              <span className={styles.lbl}>Tertiary</span>
              <span className={styles.num}>{"№"} 03</span>
            </div>
            <p className={styles.val}>
              Read the <em>writing</em> first
            </p>
            <div className={styles.footline}>
              <span>Often the fastest answer</span>
              <span className={styles.arrow}>{"↗"}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* What I'm looking for */}
      <section className={styles["c-fit"]} data-screen-label="02 Contact / Fit">
        <div className={styles.shell}>
          <div className={styles["c-fit-head"]}>
            <span className={styles["c-fit-kicker"]}>
              <span className={styles.num}>02</span> Best conversations
            </span>
            <h2 className={styles["c-fit-title"]}>
              What I&apos;m <em>looking for</em>.
            </h2>
          </div>

          <div className={styles["c-fit-grid"]}>
            <div className={styles["c-fit-item"]}>
              <span className={styles["li-num"]}>01</span>
              <p>
                <strong>Product, analytics, or fintech work.</strong> The places
                where clear thinking actually changes the outcome, not just the
                roadmap.
              </p>
            </div>
            <div className={styles["c-fit-item"]}>
              <span className={styles["li-num"]}>02</span>
              <p>
                <strong>AI workflows and decision tools.</strong> Especially
                where the surface area has to survive contact with real users.
              </p>
            </div>
            <div className={styles["c-fit-item"]}>
              <span className={styles["li-num"]}>03</span>
              <p>
                <strong>Platform reliability and product judgment.</strong>{" "}
                Teams where the strategy and the delivery actually have to
                connect.
              </p>
            </div>
            <div className={styles["c-fit-item"]}>
              <span className={styles["li-num"]}>04</span>
              <p>
                <strong>Honest scope conversations.</strong> {"“"}Here is the
                rough budget and the actual problem{"”"} beats a polished RFP
                every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing pull-quote */}
      <section
        className={styles["c-quote"]}
        data-screen-label="03 Contact / Quote"
      >
        <div className={styles.shell}>
          <div className={styles["c-quote-grid"]}>
            <p className={styles["c-quote-mark"]}>{"“"}</p>
            <div className={styles["c-quote-body"]}>
              <p className={styles["c-quote-text"]}>
                <strong>
                  I&apos;m looking for product work where the thinking{" "}
                  <em>and</em> the delivery both have to be good.
                </strong>{" "}
                Especially analytics, fintech, and workflow products, the places
                where clear strategy and reliable delivery are connected.
              </p>
              <div className={styles["c-quote-sig"]}>
                Isaac Vazquez · UC Berkeley Haas MBA &apos;27 · Berkeley, CA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore more */}
      <section
        className={styles["c-actions"]}
        data-screen-label="04 Contact / Explore"
      >
        <div className={styles.shell}>
          <div className={styles["c-actions-row"]}>
            <Link className={styles["c-action"]} href="/portfolio">
              <span className={styles.lbl}>Explore · 01</span>
              <span className={styles.head}>
                Browse the <em>work</em>
              </span>
              <span className={styles.foot}>
                <span>Product · analytics · reliability</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </Link>
            <Link className={styles["c-action"]} href="/resume">
              <span className={styles.lbl}>Explore · 02</span>
              <span className={styles.head}>
                Read the <em>résumé</em>
              </span>
              <span className={styles.foot}>
                <span>Background · experience</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </Link>
            <Link className={styles["c-action"]} href="/about">
              <span className={styles.lbl}>Explore · 03</span>
              <span className={styles.head}>
                More <em>about me</em>
              </span>
              <span className={styles.foot}>
                <span>Who I am · how I work</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
