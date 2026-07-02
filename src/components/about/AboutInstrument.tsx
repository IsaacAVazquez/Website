import Link from "next/link";
import styles from "@/app/about/about.module.css";
import { profile } from "@/lib/profile";
import { getPortfolioProjects } from "@/constants/caseStudies";
import { getAllBlogPostPreviews } from "@/lib/blog";

/**
 * AboutInstrument — Working Instrument About surface.
 *
 * Server component: no interactivity, just the real bio backed by
 * `@/lib/profile` plus computed project/writing counts so the numbers stay
 * true as content ships (the old surface hand-coded "21 live tools" and
 * drifted). The global `StaticHeader` and `Footer` (full variant on /about)
 * handle chrome — this component only renders the content sections.
 *
 * Bio narrative + track-record metrics come from the previous About surface
 * (Civitech, Open Progress, $4M / 35% / 60% / 50M etc.) — that's brand voice
 * and intentionally lives in JSX rather than being derived from data.
 */
export function AboutInstrument() {
  const haas = profile.education[0];
  const fsu = profile.education[1];
  const haasName = haas?.name ?? "UC Berkeley Haas School of Business";
  const haasDegree = haas?.degree ?? "Master of Business Administration";
  const fsuName = fsu?.name ?? "Florida State University";
  const location = `${profile.location.locality}, ${profile.location.region}`;

  // Live counts, same definitions the homepage index uses.
  const projects = getPortfolioProjects();
  const projectCount = projects.length;
  const liveToolCount = projects.filter((p) => Boolean(p.link)).length;
  const pieceCount = getAllBlogPostPreviews().length;

  return (
    <div className={styles.page}>
      {/* Masthead */}
      <section className={styles.masthead} aria-labelledby="about-heading">
        <div className={styles.shell}>
          <p className={styles.kicker}>About · QA → product</p>
          <div className={styles.mastheadGrid}>
            <h1 id="about-heading" className={styles.mastheadTitle}>
              Six years across QA, analytics &amp; <em>product</em>.
            </h1>
            <div className={styles.sideblock}>
              <p className={styles.blurb}>{profile.description}</p>
              <div className={styles.statStrip}>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Experience</span>
                  <span className={styles.statVal}>6+ yrs</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Voters reached</span>
                  <span className={styles.statVal}>50M+</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Revenue led</span>
                  <span className={styles.statVal}>$4M</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Live tools</span>
                  <span className={styles.statVal}>{liveToolCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Identity meta band */}
      <div className={styles.metaBand}>
        <div className={styles.shell}>
          <div className={styles.metaCells}>
            <div className={styles.metaCell}>
              <span className={styles.cellLbl}>Title</span>
              <p className={styles.cellVal}>Product manager &amp; builder</p>
              <span className={styles.cellSub}>QA → product · civic tech alum</span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.cellLbl}>Currently</span>
              <p className={styles.cellVal}>MBA Candidate &rsquo;27</p>
              <span className={styles.cellSub}>UC Berkeley Haas · Consortium Fellow</span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.cellLbl}>Based</span>
              <p className={styles.cellVal}>{location}</p>
              <span className={styles.cellSub}>SF Bay Area · PT</span>
            </div>
            <div className={styles.metaCell}>
              <span className={styles.cellLbl}>Building</span>
              <p className={styles.cellVal}>Investment research</p>
              <span className={styles.cellSub}>Fintech · decision tools · AI workflows</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio long-form */}
      <section className={styles.section} aria-labelledby="about-bio-heading">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.sectionKicker}>The overview</span>
              <h2 id="about-bio-heading" className={styles.sectionTitle}>
                A QA background actually teaches you to distrust your own{" "}
                <em>assumptions</em>.
              </h2>
            </div>
          </div>

          <div className={styles.bioGrid}>
            <div className={styles.prose}>
              <p className={styles.lead}>
                I&apos;m a full-time MBA Candidate at UC Berkeley Haas with a
                background in QA and analytics. Before business school, I spent
                six years at two companies in civic technology, starting in
                campaign analytics and working into quality engineering and
                product ownership.
              </p>
              <p>
                I don&apos;t write product requirements by imagining how users
                will behave. I look at what the system is doing, find where the
                gaps are, and work from there. I&apos;m comfortable with{" "}
                <strong>automation, SQL, and APIs</strong>, and I lean on them
                because they keep my product decisions connected to how things
                actually work, not how I imagine they do.
              </p>
              <p>
                At <strong>Civitech</strong>, I started in QA owning reliability
                for SaaS platforms that reached millions of voters. Over three
                years the role grew into something closer to product management,
                running user interviews, translating cross-functional feedback
                into requirements, and shipping biweekly instead of monthly.
              </p>
              <p>
                Before that, I ran client services at{" "}
                <strong>Open Progress</strong>, managing 80+ digital programs
                that reached over 50 million voters, and building the ETL
                pipelines and dashboards that turned campaign analytics into
                something teams could actually use to make decisions.
              </p>
              <p>
                Right now I&apos;m building investment research and fintech
                tools because I&apos;m genuinely curious about how product
                design and decision support come together. That curiosity is
                why I ended up in product work in the first place, and
                it&apos;s what keeps me building things outside of class.
              </p>
              <p className={styles.closer}>
                I&apos;m most interested in products at the intersection of
                analytics, trust, and clear user decision-making.
              </p>
            </div>

            <aside className={styles.aside} aria-label="Operating principles">
              <span className={styles.asideKicker}>At a glance</span>
              <h3>Operating principles</h3>
              <ul>
                <li>
                  <span>Distrust your assumptions</span>
                  <strong>P · 01</strong>
                </li>
                <li>
                  <span>Stay close to the system</span>
                  <strong>P · 02</strong>
                </li>
                <li>
                  <span>Data checks judgment, doesn&apos;t replace it</span>
                  <strong>P · 03</strong>
                </li>
                <li>
                  <span>Ship biweekly, learn weekly</span>
                  <strong>P · 04</strong>
                </li>
                <li>
                  <span>Tradeoffs legible, scope honest</span>
                  <strong>P · 05</strong>
                </li>
                <li>
                  <span>Build the tool you wish existed</span>
                  <strong>P · 06</strong>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* Track record */}
      <section className={styles.section} aria-labelledby="about-track-heading">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.sectionKicker}>Track record</span>
              <h2 id="about-track-heading" className={styles.sectionTitle}>
                Numbers that came out of <em>real</em> shipping.
              </h2>
            </div>
            <span className={styles.sectionMeta}>4 chapters · 2018 → present</span>
          </div>

          <div className={styles.trackGrid}>
            <article className={styles.role}>
              <div>
                <div className={styles.topnum}>
                  <span>№ 01</span>
                  <span>Current</span>
                </div>
                <h3 className={styles.org}>
                  UC Berkeley <em>Haas</em>
                </h3>
                <p className={styles.titles}>
                  MBA Candidate · Class of &apos;27
                  <br />
                  Consortium Fellow · MLT PD Fellow
                </p>
                <span className={styles.roleSpan}>2025 → 2027 · Berkeley, CA</span>
              </div>
              <div>
                <span className={styles.reskick}>In progress</span>
                <div className={styles.res}>
                  <span className={styles.metric}>{liveToolCount}</span>
                  <span className={styles.resCopy}>
                    <strong>Live tools shipped outside class.</strong>{" "}
                    Investment research, decision lab, fintech analyzers, built
                    to keep product judgment sharp during the program.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>2nd</span>
                  <span className={styles.resCopy}>
                    <strong>Year in product clubs &amp; case work.</strong>{" "}
                    Concentrating on AI workflows, fintech product, and
                    decision support.
                  </span>
                </div>
              </div>
            </article>

            <article className={styles.role}>
              <div>
                <div className={styles.topnum}>
                  <span>№ 02</span>
                  <span>3 yrs</span>
                </div>
                <h3 className={styles.org}>Civitech</h3>
                <p className={styles.titles}>
                  Quality engineering → product ownership
                  <br />
                  SaaS platforms reaching millions of voters
                </p>
                <span className={styles.roleSpan}>2022 → 2025 · Austin, TX</span>
              </div>
              <div>
                <span className={styles.reskick}>Highlights</span>
                <div className={styles.res}>
                  <span className={styles.metric}>$4M</span>
                  <span className={styles.resCopy}>
                    <strong>
                      Pricing strategy I led brought in new revenue.
                    </strong>{" "}
                    Made tradeoffs legible across legal, finance, and GTM.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>35%</span>
                  <span className={styles.resCopy}>
                    <strong>
                      Engagement increase on peer-to-peer texting platform
                    </strong>{" "}
                    I owned product vision for.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>60%</span>
                  <span className={styles.resCopy}>
                    <strong>Faster client onboarding</strong> after I built a
                    real-time event system in Google Cloud.
                  </span>
                </div>
              </div>
            </article>

            <article className={styles.role}>
              <div>
                <div className={styles.topnum}>
                  <span>№ 03</span>
                  <span>3 yrs</span>
                </div>
                <h3 className={styles.org}>
                  Open <em>Progress</em>
                </h3>
                <p className={styles.titles}>
                  Client services · Analytics &amp; ETL
                  <br />
                  Civic tech digital programs
                </p>
                <span className={styles.roleSpan}>2018 → 2022 · Remote</span>
              </div>
              <div>
                <span className={styles.reskick}>Highlights</span>
                <div className={styles.res}>
                  <span className={styles.metric}>80+</span>
                  <span className={styles.resCopy}>
                    <strong>Digital programs managed</strong> across campaigns,
                    advocacy, and party committees.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>50M+</span>
                  <span className={styles.resCopy}>
                    <strong>Voters reached</strong> through the programs my
                    team ran.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>ETL</span>
                  <span className={styles.resCopy}>
                    <strong>Built the pipelines and dashboards</strong> that
                    turned campaign analytics from manual reporting into a real
                    decision surface for the team.
                  </span>
                </div>
              </div>
            </article>

            <article className={styles.role}>
              <div>
                <div className={styles.topnum}>
                  <span>№ 04</span>
                  <span>BA</span>
                </div>
                <h3 className={styles.org}>
                  Florida <em>State</em>
                </h3>
                <p className={styles.titles}>
                  BA · Political Science
                  <br />
                  &amp; International Affairs
                </p>
                <span className={styles.roleSpan}>2014 → 2018 · Tallahassee, FL</span>
              </div>
              <div>
                <span className={styles.reskick}>Foundations</span>
                <div className={styles.res}>
                  <span className={styles.metric}>2018</span>
                  <span className={styles.resCopy}>
                    <strong>First-generation graduate</strong>; campaign work
                    in Florida the year I graduated.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>→</span>
                  <span className={styles.resCopy}>
                    <strong>Path into civic tech</strong> ran straight from
                    undergrad work into Open Progress, and from there into
                    product.
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Knows about */}
      <section className={styles.section} aria-labelledby="about-knows-heading">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.sectionKicker}>Working range</span>
              <h2 id="about-knows-heading" className={styles.sectionTitle}>
                What I <em>know</em> about.
              </h2>
            </div>
          </div>
          <div className={styles.knowsGrid}>
            {profile.knowsAbout.map((entry, index) => (
              <div key={entry} className={styles.knowsCell}>
                <span className={styles.knowsNum}>
                  № {String(index + 1).padStart(2, "0")}
                </span>
                <p className={styles.knowsVal}>{entry}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials & education */}
      <section className={styles.section} aria-label="Credentials and education">
        <div className={styles.shell}>
          <div className={styles.credsGrid}>
            <div className={styles.credsCol}>
              <div className={styles.colhead}>
                <span className={styles.colheadLabel}>
                  Recognition &amp; fellowships
                </span>
                <span className={styles.colheadNum}>03</span>
              </div>
              <ul>
                <li>
                  <span className={styles.who}>Consortium Fellow</span>
                  <span className={styles.when}>Haas &apos;25 → &apos;27</span>
                  <span className={styles.what}>
                    For graduate study and the Consortium&apos;s commitment to
                    advancing inclusive practice in business.
                  </span>
                </li>
                <li>
                  <span className={styles.who}>
                    MLT Professional Development Fellow
                  </span>
                  <span className={styles.when}>2024 → &apos;25</span>
                  <span className={styles.what}>
                    Management Leadership for Tomorrow PD fellowship. Career
                    coaching, programming, and community ahead of the MBA.
                  </span>
                </li>
                <li>
                  <span className={styles.who}>Civitech · Cross-functional</span>
                  <span className={styles.when}>2022 → &apos;25</span>
                  <span className={styles.what}>
                    Promoted from QA into product ownership; led pricing, owned
                    a peer-to-peer product, built infra that cut onboarding 60%.
                  </span>
                </li>
              </ul>
            </div>

            <div className={styles.credsCol}>
              <div className={styles.colhead}>
                <span className={styles.colheadLabel}>Education</span>
                <span className={styles.colheadNum}>02</span>
              </div>
              <ul>
                <li>
                  <span className={styles.who}>
                    {haasName.replace(" School of Business", "")} MBA
                  </span>
                  <span className={styles.when}>2025 → 2027</span>
                  <span className={styles.what}>
                    {haasDegree}. Concentration on product, AI workflows, and
                    decision-support tools.
                  </span>
                </li>
                <li>
                  <span className={styles.who}>{fsuName}</span>
                  <span className={styles.when}>2018</span>
                  <span className={styles.what}>
                    Bachelor of Arts · Political Science and International
                    Affairs. Path into civic tech, analytics, and from there
                    into product.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Closing statement */}
      <section className={styles.quote} aria-label="Closing statement">
        <div className={styles.shell}>
          <p className={styles.quoteText}>
            I&apos;m most interested in products at the intersection of
            analytics, trust, and clear user decision-making. Places where
            clear strategy and reliable delivery are connected.
          </p>
          <span className={styles.quoteSig}>
            {profile.name} · {location}
          </span>
        </div>
      </section>

      {/* Closing actions */}
      <section className={styles.actions} aria-label="Where to go next">
        <div className={styles.shell}>
          <div className={styles.actionsRow}>
            <Link className={styles.action} href="/portfolio">
              <span className={styles.actionLbl}>Action · 01</span>
              <span className={styles.actionHead}>See the work</span>
              <span className={styles.actionFoot}>
                <span>
                  {projectCount} projects · {liveToolCount} live
                </span>
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
            <Link className={styles.action} href="/writing">
              <span className={styles.actionLbl}>Action · 02</span>
              <span className={styles.actionHead}>Read the writing</span>
              <span className={styles.actionFoot}>
                <span>{pieceCount} essays and notes</span>
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
            <Link className={styles.action} href="/contact">
              <span className={styles.actionLbl}>Action · 03</span>
              <span className={styles.actionHead}>Get in touch</span>
              <span className={styles.actionFoot}>
                <span>Email or LinkedIn</span>
                <span aria-hidden="true">↗</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
