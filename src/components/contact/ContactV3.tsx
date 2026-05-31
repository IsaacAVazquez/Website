import Link from "next/link";
import styles from "@/app/contact/contact.module.css";

/**
 * ContactV3 — v3 editorial-brutalist contact surface.
 *
 * Server component: there is no interactivity, just static editorial copy
 * with `mailto:` + external links. The global `StaticHeader` and `Footer`
 * (compact variant on /contact) handle chrome — this component only renders
 * the content sections.
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
              Currently open · Available
            </span>
          </div>
          <h1 className={styles["c-wordmark"]}>
            Get in <em>touch</em>.
          </h1>
          <div className={styles["c-subline"]}>
            <p className={styles["c-tagline"]}>
              Two ways in: a working email and a LinkedIn. No form, no funnel,
              no <em>auto-responder</em>.
            </p>
            <div className={styles["c-side"]}>
              <div className={styles["c-stat-strip"]}>
                <div>
                  <span className={styles.lbl}>Reply within</span>
                  <span className={styles.val}>2 days</span>
                </div>
                <div>
                  <span className={styles.lbl}>Best for</span>
                  <span className={styles.val}>Product · Analytics</span>
                </div>
                <div>
                  <span className={styles.lbl}>Time zone</span>
                  <span className={styles.val}>PT · Berkeley</span>
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
              <span>Best for intros · roles · referrals</span>
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

      {/* Marquee band */}
      <div className={styles["c-band"]} aria-hidden="true">
        <div className={styles["c-band-inner"]}>
          <div className={styles.marquee}>
            <span className={styles.hot}>
              Currently open · Available for product work
            </span>
            <span>Based in Berkeley, CA</span>
            <span>Reply within 2 business days</span>
            <span>Best for product · analytics · fintech</span>
            <span>No form · no funnel · just email</span>
            <span className={styles.hot}>UC Berkeley Haas MBA &apos;27</span>
            <span className={styles.hot}>
              Currently open · Available for product work
            </span>
            <span>Based in Berkeley, CA</span>
            <span>Reply within 2 business days</span>
            <span>Best for product · analytics · fintech</span>
            <span>No form · no funnel · just email</span>
            <span className={styles.hot}>UC Berkeley Haas MBA &apos;27</span>
          </div>
        </div>
      </div>

      {/* Good fit / Not a fit */}
      <section className={styles["c-fit"]} data-screen-label="02 Contact / Fit">
        <div className={styles.shell}>
          <div className={styles["c-fit-head"]}>
            <span className={styles["c-fit-kicker"]}>
              <span className={styles.num}>02</span> Best conversations
            </span>
            <h2 className={styles["c-fit-title"]}>
              What I&apos;m <em>looking for</em>, and what I&apos;m not.
            </h2>
          </div>

          <div className={styles["c-fit-grid"]}>
            <div className={`${styles["c-fit-col"]} ${styles["is-yes"]}`}>
              <div className={styles.colhead}>
                <span className={styles.label}>
                  Good <em>fit</em>.
                </span>
                <span className={styles.glyph} aria-hidden="true">
                  +
                </span>
              </div>
              <ul>
                <li>
                  <span className={styles["li-num"]}>01</span>
                  <span>
                    <strong>Product, analytics, or fintech work.</strong> The
                    places where clear thinking actually changes the outcome —
                    not just the roadmap.
                  </span>
                </li>
                <li>
                  <span className={styles["li-num"]}>02</span>
                  <span>
                    <strong>AI workflows and decision tools.</strong> Especially
                    where the surface area has to survive contact with real
                    users.
                  </span>
                </li>
                <li>
                  <span className={styles["li-num"]}>03</span>
                  <span>
                    <strong>Platform reliability + product judgment.</strong>{" "}
                    Teams where the strategy and the delivery actually have to
                    connect.
                  </span>
                </li>
                <li>
                  <span className={styles["li-num"]}>04</span>
                  <span>
                    <strong>Honest scope conversations.</strong>{" "}
                    {"“"}Here is the rough budget and the actual problem
                    {"”"} beats a polished RFP every time.
                  </span>
                </li>
              </ul>
            </div>

            <div className={`${styles["c-fit-col"]} ${styles["is-no"]}`}>
              <div className={styles.colhead}>
                <span className={styles.label}>
                  Not a <em>fit</em>.
                </span>
                <span className={styles.glyph} aria-hidden="true">
                  {"−"}
                </span>
              </div>
              <ul>
                <li>
                  <span className={styles["li-num"]}>01</span>
                  <span>
                    <strong>Crypto or NFT projects.</strong> Outside what I can
                    usefully help with right now.
                  </span>
                </li>
                <li>
                  <span className={styles["li-num"]}>02</span>
                  <span>
                    <strong>Logo-only or pure marketing site work.</strong>{" "}
                    Other studios will serve you better than I will.
                  </span>
                </li>
                <li>
                  <span className={styles["li-num"]}>03</span>
                  <span>
                    <strong>
                      {"“"}Build me a clone of X.{"”"}
                    </strong>{" "}
                    Happy to talk about the actual product instead —
                    that&apos;s where the work is.
                  </span>
                </li>
                <li>
                  <span className={styles["li-num"]}>04</span>
                  <span>
                    <strong>Unpaid speculative work.</strong> Including{" "}
                    {"“"}free pilot, paid if it goes well{"”"}{" "}
                    framings.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Side details */}
      <section
        className={styles["c-details"]}
        data-screen-label="03 Contact / Details"
      >
        <div className={styles.shell}>
          <div className={styles["c-details-head"]}>
            <h2>
              The <em>practical</em> details.
            </h2>
          </div>
          <div className={styles["c-detail-grid"]}>
            <div className={styles["c-detail"]}>
              <span className={styles.lbl}>Location</span>
              <span className={styles.val}>
                Berkeley, <em>CA</em>
              </span>
              <span className={styles.sub}>Bay Area · PT</span>
            </div>
            <div className={styles["c-detail"]}>
              <span className={styles.lbl}>Status</span>
              <span className={styles.val}>
                Currently <em>open</em>
              </span>
              <span className={styles.sub}>For product roles · 2026</span>
            </div>
            <div className={styles["c-detail"]}>
              <span className={styles.lbl}>Response</span>
              <span className={styles.val}>
                Within <em>2 days</em>
              </span>
              <span className={styles.sub}>Business days · PT</span>
            </div>
            <div className={styles["c-detail"]}>
              <span className={styles.lbl}>Background</span>
              <span className={styles.val}>
                Haas <em>MBA</em> &apos;27
              </span>
              <span className={styles.sub}>Civic tech · SaaS · Investments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Closing pull-quote */}
      <section
        className={styles["c-quote"]}
        data-screen-label="04 Contact / Quote"
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
                Especially analytics, fintech, and workflow products — places
                where clear strategy and reliable delivery are connected.
              </p>
              <div className={styles["c-quote-sig"]}>
                Isaac Vazquez · Berkeley, CA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick action footer */}
      <section
        className={styles["c-actions"]}
        data-screen-label="05 Contact / Actions"
      >
        <div className={styles.shell}>
          <div className={styles["c-actions-row"]}>
            <a
              className={styles["c-action"]}
              href="mailto:IsaacVazquez@berkeley.edu"
            >
              <span className={styles.lbl}>Action · 01</span>
              <span className={styles.head}>
                Send <em>email</em>
              </span>
              <span className={styles.foot}>
                <span>IsaacVazquez@berkeley.edu</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </a>
            <a
              className={styles["c-action"]}
              href="https://www.linkedin.com/in/isaac-vazquez"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.lbl}>Action · 02</span>
              <span className={styles.head}>
                Connect on <em>LinkedIn</em>
              </span>
              <span className={styles.foot}>
                <span>in/isaac-vazquez</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </a>
            <Link className={styles["c-action"]} href="/portfolio">
              <span className={styles.lbl}>Action · 03</span>
              <span className={styles.head}>
                Browse the <em>work</em>
              </span>
              <span className={styles.foot}>
                <span>22 projects · 21 live</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
