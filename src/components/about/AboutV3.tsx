import Link from "next/link";
import styles from "@/app/about/about.module.css";
import { profile } from "@/lib/profile";

/**
 * AboutV3 — v3 editorial-brutalist About surface.
 *
 * Server component: no interactivity, just static editorial copy backed by
 * `@/lib/profile`. The global `StaticHeader` and `Footer` (full variant on
 * /about) handle chrome — this component only renders the content sections.
 *
 * Bio narrative + track-record metrics come from the existing About.tsx
 * (Civitech, Open Progress, $4M / 35% / 60% / 50M etc.) — that's brand
 * voice and intentionally lives in JSX rather than being derived from data.
 */

// Distribute color variants across the 12-cell "knows about" wall in the
// same rhythm as the prototype (acid at 1, ink at 6, acid at 11).
const KNOWS_VARIANTS: Record<number, "is-acid" | "is-ink"> = {
  0: "is-acid",
  5: "is-ink",
  10: "is-acid",
};

// Render strings like "Product Management" with the second word italicised
// in the editorial serif. Some entries are single-word and render plain.
function knowsLabel(value: string) {
  const parts = value.split(" ");
  if (parts.length === 1) {
    return <>{value}</>;
  }
  const [first, ...rest] = parts;
  return (
    <>
      {first} <em>{rest.join(" ")}</em>
    </>
  );
}

export function AboutV3() {
  const haas = profile.education[0];
  const fsu = profile.education[1];
  const haasName = haas?.name ?? "UC Berkeley Haas School of Business";
  const haasDegree = haas?.degree ?? "Master of Business Administration";
  const fsuName = fsu?.name ?? "Florida State University";
  const location = `${profile.location.locality}, ${profile.location.region}`;

  return (
    <div className={styles.page}>
      {/* Masthead */}
      <section
        className={styles["a-masthead"]}
        data-screen-label="01 About / Masthead"
      >
        <div className={styles.shell}>
          <div className={styles["a-kicker-row"]}>
            <span className={styles.dept}>Dept. 05</span>
            <span>The Person</span>
            <span>—</span>
            <span>Vol. 2026</span>
            <span className={styles.pin}>QA {"→"} Product</span>
          </div>
          <div className={styles["a-masthead-grid"]}>
            <h1>
              Six years across QA, analytics &amp; <em>product</em>.
            </h1>
            <div className={styles["a-side"]}>
              <p className={styles["a-blurb"]}>{profile.description}</p>
              <div className={styles["a-stat-strip"]}>
                <div>
                  <span className={styles.lbl}>Experience</span>
                  <span className={styles.val}>
                    6+ <em>yrs</em>
                  </span>
                </div>
                <div>
                  <span className={styles.lbl}>Voters reached</span>
                  <span className={styles.val}>50M+</span>
                </div>
                <div>
                  <span className={styles.lbl}>Revenue led</span>
                  <span className={styles.val}>$4M</span>
                </div>
                <div>
                  <span className={styles.lbl}>Live tools</span>
                  <span className={styles.val}>21</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Identity ribbon */}
      <div className={styles["a-identity-band"]}>
        <div className={styles["a-identity"]}>
          <div className={styles["a-identity-cell"]}>
            <span className={styles.lbl}>Title</span>
            <p className={styles.val}>
              Product Manager <em>&amp;</em> builder
            </p>
            <span className={styles.sub}>QA {"→"} Product · Civic tech alum</span>
          </div>
          <div className={styles["a-identity-cell"]}>
            <span className={styles.lbl}>Currently</span>
            <p className={styles.val}>
              MBA Candidate <em>&apos;27</em>
            </p>
            <span className={styles.sub}>UC Berkeley Haas · Class of &apos;27</span>
          </div>
          <div className={styles["a-identity-cell"]}>
            <span className={styles.lbl}>Based</span>
            <p className={styles.val}>
              {profile.location.locality}, <em>{profile.location.region}</em>
            </p>
            <span className={styles.sub}>SF Bay Area · PT</span>
          </div>
          <div className={styles["a-identity-cell"]}>
            <span className={styles.lbl}>Building</span>
            <p className={styles.val}>
              Investment <em>research</em>
            </p>
            <span className={styles.sub}>Fintech · decision tools · AI workflows</span>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className={styles["a-band"]} aria-hidden="true">
        <div className={styles["a-band-inner"]}>
          <div className={styles.marquee}>
            <span className={styles.hot}>
              Consortium Fellow · MLT Professional Development Fellow
            </span>
            <span>UC Berkeley Haas MBA &apos;27</span>
            <span>Florida State · BA Political Science 2018</span>
            <span>Civitech · Open Progress</span>
            <span>6+ years across QA, analytics &amp; product</span>
            <span className={styles.hot}>
              $4M revenue · 50M+ voters · 21 live tools
            </span>
            <span className={styles.hot}>
              Consortium Fellow · MLT Professional Development Fellow
            </span>
            <span>UC Berkeley Haas MBA &apos;27</span>
            <span>Florida State · BA Political Science 2018</span>
            <span>Civitech · Open Progress</span>
            <span>6+ years across QA, analytics &amp; product</span>
            <span className={styles.hot}>
              $4M revenue · 50M+ voters · 21 live tools
            </span>
          </div>
        </div>
      </div>

      {/* Bio long-form */}
      <section className={styles["a-bio"]} data-screen-label="02 About / Bio">
        <div className={styles.shell}>
          <div className={styles["a-bio-head"]}>
            <div className={styles.left}>
              <span className={styles["a-bio-kicker"]}>
                <span className={styles.num}>02</span> The overview
              </span>
              <h2 className={styles["a-bio-title"]}>
                A QA background actually teaches you to distrust your own{" "}
                <em>assumptions</em>.
              </h2>
            </div>
          </div>

          <div className={styles["a-bio-body"]}>
            <div className={styles["a-bio-numeral"]}>02</div>
            <div className={styles["a-bio-prose"]}>
              <p className={styles.lead}>
                I&apos;m a full-time MBA Candidate at UC Berkeley Haas with a
                background in QA and analytics. Before business school, I spent
                six years at two companies in <em>civic technology</em> —
                starting in campaign analytics and working into quality
                engineering and product ownership.
              </p>
              <p>
                I don&apos;t write product requirements by imagining how users
                will behave. I look at what the system is doing, find where the
                gaps are, and work from there. I&apos;m comfortable with{" "}
                <strong>automation, SQL, and APIs</strong>, and I lean on them
                because they keep my product decisions connected to how things
                work — not how I imagine they do.
              </p>
              <p>
                At <strong>Civitech</strong>, I started in QA owning reliability
                for SaaS platforms that reached millions of voters. Over three
                years the role grew into something closer to product management —
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
                Right now I&apos;m building{" "}
                <em>investment research and fintech tools</em> because I&apos;m
                genuinely curious about how product design and decision support
                come together. That curiosity is why I ended up in product work
                in the first place, and it&apos;s what keeps me building things
                outside of class.
              </p>
              <p className={styles.closer}>
                I&apos;m most interested in products at the intersection of
                analytics, trust, and clear user decision-making.
              </p>
            </div>

            <aside className={styles["a-bio-aside"]}>
              <span className={styles.akicker}>At a glance</span>
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
      <section
        className={styles["a-track"]}
        data-screen-label="03 About / Track record"
      >
        <div className={styles.shell}>
          <div className={styles["a-track-head"]}>
            <div className={styles.left}>
              <span className={styles["a-bio-kicker"]}>
                <span className={styles.num}>03</span> Track record
              </span>
              <h2 className={styles["a-bio-title"]}>
                Numbers that came out of <em>real</em> shipping.
              </h2>
            </div>
            <span className={styles.right}>4 chapters · 2018 {"→"} present</span>
          </div>

          <div className={styles["a-track-grid"]}>
            <article className={styles["a-role"]}>
              <div className={styles.meta}>
                <div className={styles.topnum}>
                  <span className={styles.id}>{"№"} 01</span>
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
                <span className={styles.span}>
                  2025 {"→"} 2027 · Berkeley, CA
                </span>
              </div>
              <div className={styles.results}>
                <span className={styles.reskick}>In progress</span>
                <div className={styles.res}>
                  <span className={styles.metric}>21</span>
                  <span className={styles.copy}>
                    <strong>Live tools shipped outside class.</strong>{" "}
                    Investment research, decision lab, fintech analyzers —
                    built to keep product judgment sharp during the program.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>
                    2<em>nd</em>
                  </span>
                  <span className={styles.copy}>
                    <strong>Year in product clubs &amp; case work.</strong>{" "}
                    Concentrating on AI workflows, fintech product, and
                    decision support.
                  </span>
                </div>
              </div>
            </article>

            <article className={styles["a-role"]}>
              <div className={styles.meta}>
                <div className={styles.topnum}>
                  <span className={styles.id}>{"№"} 02</span>
                  <span>3 yrs</span>
                </div>
                <h3 className={styles.org}>Civitech</h3>
                <p className={styles.titles}>
                  Quality engineering {"→"} product ownership
                  <br />
                  SaaS platforms reaching millions of voters
                </p>
                <span className={styles.span}>
                  2022 {"→"} 2025 · Austin, TX
                </span>
              </div>
              <div className={styles.results}>
                <span className={styles.reskick}>Highlights</span>
                <div className={styles.res}>
                  <span className={styles.metric}>$4M</span>
                  <span className={styles.copy}>
                    <strong>
                      Pricing strategy I led brought in new revenue.
                    </strong>{" "}
                    Made tradeoffs legible across legal, finance, and GTM.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>
                    35<em>%</em>
                  </span>
                  <span className={styles.copy}>
                    <strong>
                      Engagement increase on peer-to-peer texting platform
                    </strong>{" "}
                    I owned product vision for.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>
                    60<em>%</em>
                  </span>
                  <span className={styles.copy}>
                    <strong>Faster client onboarding</strong> after I built a
                    real-time event system in Google Cloud.
                  </span>
                </div>
              </div>
            </article>

            <article className={styles["a-role"]}>
              <div className={styles.meta}>
                <div className={styles.topnum}>
                  <span className={styles.id}>{"№"} 03</span>
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
                <span className={styles.span}>2018 {"→"} 2022 · Remote</span>
              </div>
              <div className={styles.results}>
                <span className={styles.reskick}>Highlights</span>
                <div className={styles.res}>
                  <span className={styles.metric}>
                    80<em>+</em>
                  </span>
                  <span className={styles.copy}>
                    <strong>Digital programs managed</strong> across campaigns,
                    advocacy, and party committees.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>
                    50M<em>+</em>
                  </span>
                  <span className={styles.copy}>
                    <strong>Voters reached</strong> through the programs my
                    team ran.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>ETL</span>
                  <span className={styles.copy}>
                    <strong>Built the pipelines and dashboards</strong> that
                    turned campaign analytics from manual reporting into a real
                    decision surface for the team.
                  </span>
                </div>
              </div>
            </article>

            <article className={styles["a-role"]}>
              <div className={styles.meta}>
                <div className={styles.topnum}>
                  <span className={styles.id}>{"№"} 04</span>
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
                <span className={styles.span}>
                  2014 {"→"} 2018 · Tallahassee, FL
                </span>
              </div>
              <div className={styles.results}>
                <span className={styles.reskick}>Foundations</span>
                <div className={styles.res}>
                  <span className={styles.metric}>2018</span>
                  <span className={styles.copy}>
                    <strong>First-generation graduate</strong>; campaign work
                    in Florida the year I graduated.
                  </span>
                </div>
                <div className={styles.res}>
                  <span className={styles.metric}>{"→"}</span>
                  <span className={styles.copy}>
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
      <section
        className={styles["a-knows"]}
        data-screen-label="04 About / Knows about"
      >
        <div className={styles.shell}>
          <div className={styles["a-knows-head"]}>
            <h2>
              What I <em>know</em> about.
            </h2>
          </div>
          <div className={styles["a-knows-grid"]}>
            {profile.knowsAbout.map((entry, index) => {
              const variant = KNOWS_VARIANTS[index];
              const cellClass = variant
                ? `${styles["a-knows-cell"]} ${styles[variant]}`
                : styles["a-knows-cell"];
              const num = String(index + 1).padStart(2, "0");
              return (
                <div key={entry} className={cellClass}>
                  <span className={styles.num}>
                    {"№"} {num}
                  </span>
                  <p className={styles.val}>{knowsLabel(entry)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credentials & education */}
      <section
        className={styles["a-creds"]}
        data-screen-label="05 About / Credentials"
      >
        <div className={styles.shell}>
          <div className={styles["a-creds-grid"]}>
            <div className={styles["a-creds-col"]}>
              <div className={styles.colhead}>
                <span className={styles.label}>
                  Recognition &amp; <em>fellowships</em>
                </span>
                <span className={styles.num}>03</span>
              </div>
              <ul>
                <li>
                  <span className={styles.who}>
                    Consortium <em>Fellow</em>
                  </span>
                  <span className={styles.when}>Haas &apos;25 {"→"} &apos;27</span>
                  <span className={styles.what}>
                    For graduate study and the Consortium&apos;s commitment to
                    advancing inclusive practice in business.
                  </span>
                </li>
                <li>
                  <span className={styles.who}>
                    MLT Professional Development <em>Fellow</em>
                  </span>
                  <span className={styles.when}>2024 {"→"} &apos;25</span>
                  <span className={styles.what}>
                    Management Leadership for Tomorrow PD fellowship — career
                    coaching, programming, and community ahead of MBA.
                  </span>
                </li>
                <li>
                  <span className={styles.who}>
                    Civitech · <em>Cross-functional</em>
                  </span>
                  <span className={styles.when}>2022 {"→"} &apos;25</span>
                  <span className={styles.what}>
                    Promoted from QA into product ownership; led pricing, owned
                    a peer-to-peer product, built infra that cut onboarding 60%.
                  </span>
                </li>
              </ul>
            </div>

            <div className={styles["a-creds-col"]}>
              <div className={styles.colhead}>
                <span className={styles.label}>
                  <em>Education</em>
                </span>
                <span className={styles.num}>02</span>
              </div>
              <ul>
                <li>
                  <span className={styles.who}>
                    {haasName.replace(" School of Business", "")}{" "}
                    <em>MBA</em>
                  </span>
                  <span className={styles.when}>2025 {"→"} 2027</span>
                  <span className={styles.what}>
                    {haasDegree}. Concentration on product, AI workflows, and
                    decision-support tools.
                  </span>
                </li>
                <li>
                  <span className={styles.who}>
                    {fsuName.replace(" University", "")}{" "}
                    <em>University</em>
                  </span>
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

      {/* Closing pull-quote */}
      <section
        className={styles["a-quote"]}
        data-screen-label="06 About / Quote"
      >
        <div className={styles.shell}>
          <div className={styles["a-quote-grid"]}>
            <p className={styles["a-quote-mark"]}>{"“"}</p>
            <div>
              <p className={styles["a-quote-text"]}>
                <strong>
                  I&apos;m most interested in products at the intersection of
                  analytics, <em>trust</em>, and clear user decision-making.
                </strong>{" "}
                Places where clear strategy and reliable delivery are connected.
              </p>
              <div className={styles["a-quote-sig"]}>
                {profile.name} · {location}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing actions */}
      <section
        className={styles["a-actions"]}
        data-screen-label="07 About / Actions"
      >
        <div className={styles.shell}>
          <div className={styles["a-actions-row"]}>
            <Link className={styles["a-action"]} href="/portfolio">
              <span className={styles.lbl}>Action · 01</span>
              <span className={styles.head}>
                See the <em>work</em>
              </span>
              <span className={styles.foot}>
                <span>22 projects · 21 live</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </Link>
            <Link className={styles["a-action"]} href="/writing">
              <span className={styles.lbl}>Action · 02</span>
              <span className={styles.head}>
                Read the <em>writing</em>
              </span>
              <span className={styles.foot}>
                <span>16 essays · 28 notes</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </Link>
            <Link className={styles["a-action"]} href="/contact">
              <span className={styles.lbl}>Action · 03</span>
              <span className={styles.head}>
                Get in <em>touch</em>
              </span>
              <span className={styles.foot}>
                <span>Email or LinkedIn</span>
                <span className={styles.arrow}>{"↗"}</span>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
