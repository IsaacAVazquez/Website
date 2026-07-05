import Link from "next/link";
import { Mail, BrandLinkedin, Article } from "@/components/ui/ServerIcons";
import styles from "@/app/contact/contact.module.css";

/**
 * ContactInstrument — Working Instrument contact surface.
 *
 * Server component: there is no interactivity, just static copy with
 * `mailto:` + external links. The global `StaticHeader` and `Footer`
 * (compact variant on /contact) handle chrome — this component only renders
 * the content sections.
 *
 * Each fact lives in exactly one place: status in the kicker, the quick
 * facts in the stat strip, contact methods in the channel cards, and the
 * explore-more links in the closing actions.
 */
export function ContactInstrument() {
  return (
    <div className={styles.page}>
      {/* Masthead */}
      <section className={styles.masthead} aria-labelledby="contact-heading">
        <div className={styles.shell}>
          <p className={styles.kicker}>Contact · currently open · product roles</p>
          <div className={styles.mastheadGrid}>
            <div>
              <h1 id="contact-heading" className={styles.mastheadTitle}>
                Get in <em>touch</em>.
              </h1>
              <p className={styles.tagline}>
                There are two ways in, a working email and a LinkedIn. No form,
                no funnel, no auto-responder.
              </p>
            </div>
            <div className={styles.statStrip}>
              <div className={styles.statCell}>
                <span className={styles.statLbl}>Response</span>
                <span className={styles.statVal}>2 business days</span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLbl}>Best for</span>
                <span className={styles.statVal}>Product · Analytics</span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLbl}>Based in</span>
                <span className={styles.statVal}>Berkeley · PT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <div className={styles.channelBand}>
        <div className={styles.shell}>
          <div className={styles.channels}>
            <a
              className={`${styles.channel} ${styles.channelPrimary}`}
              href="mailto:IsaacVazquez@berkeley.edu"
            >
              <span className={styles.channelIcon} aria-hidden="true">
                <Mail size={18} />
              </span>
              <div className={styles.topline}>
                <span>Primary</span>
                <span>№ 01</span>
              </div>
              <p className={styles.channelVal}>
                IsaacVazquez<wbr />@berkeley.edu
              </p>
              <div className={styles.footline}>
                <span>Email · best for everything</span>
                <span aria-hidden="true">↗</span>
              </div>
            </a>
            <a
              className={styles.channel}
              href="https://www.linkedin.com/in/isaac-vazquez/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.channelIcon} aria-hidden="true">
                <BrandLinkedin size={18} />
              </span>
              <div className={styles.topline}>
                <span>Secondary</span>
                <span>№ 02</span>
              </div>
              <p className={styles.channelVal}>
                linkedin.com/<wbr />in/isaac-vazquez
              </p>
              <div className={styles.footline}>
                <span>Intros · roles · referrals</span>
                <span aria-hidden="true">↗</span>
              </div>
            </a>
            <Link className={styles.channel} href="/writing">
              <span className={styles.channelIcon} aria-hidden="true">
                <Article size={18} />
              </span>
              <div className={styles.topline}>
                <span>Tertiary</span>
                <span>№ 03</span>
              </div>
              <p className={styles.channelVal}>Read the writing first</p>
              <div className={styles.footline}>
                <span>Often the fastest answer</span>
                <span aria-hidden="true">↗</span>
              </div>
            </Link>
          </div>
          <p className={styles.status}>
            <span className={styles.statusDot} aria-hidden="true" />
            Based in Berkeley, CA · usually replies within a day
          </p>
        </div>
      </div>

      {/* What I'm looking for */}
      <section className={styles.section} aria-labelledby="contact-fit-heading">
        <div className={styles.shell}>
          <span className={styles.sectionKicker}>Best conversations</span>
          <h2 id="contact-fit-heading" className={styles.sectionTitle}>
            What I&apos;m <em>looking for</em>.
          </h2>

          <div className={styles.fitGrid}>
            <div className={styles.fitItem}>
              <span className={styles.fitNum}>01</span>
              <p>
                <strong>Product, analytics, or fintech work.</strong> The places
                where clear thinking actually changes the outcome, not just the
                roadmap.
              </p>
            </div>
            <div className={styles.fitItem}>
              <span className={styles.fitNum}>02</span>
              <p>
                <strong>AI workflows and decision tools.</strong> Especially
                where the surface area has to survive contact with real users.
              </p>
            </div>
            <div className={styles.fitItem}>
              <span className={styles.fitNum}>03</span>
              <p>
                <strong>Platform reliability and product judgment.</strong>{" "}
                Teams where the strategy and the delivery actually have to
                connect.
              </p>
            </div>
            <div className={styles.fitItem}>
              <span className={styles.fitNum}>04</span>
              <p>
                <strong>Honest scope conversations.</strong> {"“"}Here is the
                rough budget and the actual problem{"”"} beats a polished RFP
                every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing statement */}
      <section className={styles.quote} aria-label="Closing statement">
        <div className={styles.shell}>
          <p className={styles.quoteText}>
            I&apos;m looking for product work where the thinking and the
            delivery both have to be good. Especially analytics, fintech, and
            workflow products, the places where clear strategy and reliable
            delivery are connected.
          </p>
          <span className={styles.quoteSig}>
            Isaac Vazquez · UC Berkeley Haas MBA &apos;27 · Berkeley, CA
          </span>
        </div>
      </section>

      {/* Explore more */}
      <section className={styles.actions} aria-label="Explore more">
        <div className={styles.shell}>
          <div className={styles.actionsRow}>
            <Link className={styles.action} href="/portfolio">
              <span className={styles.actionLbl}>Explore · 01</span>
              <span className={styles.actionHead}>Browse the work</span>
              <span className={styles.actionFoot}>
                <span>Product · analytics · reliability</span>
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
            <Link className={styles.action} href="/resume">
              <span className={styles.actionLbl}>Explore · 02</span>
              <span className={styles.actionHead}>Read the résumé</span>
              <span className={styles.actionFoot}>
                <span>Background · experience</span>
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
            <Link className={styles.action} href="/about">
              <span className={styles.actionLbl}>Explore · 03</span>
              <span className={styles.actionHead}>More about me</span>
              <span className={styles.actionFoot}>
                <span>Who I am · how I work</span>
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
