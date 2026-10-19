import Image from "next/image";
import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { careerTimeline } from "@/constants/personal";
import styles from "./Catalog97Resume.module.css";

/**
 * The institution marks, keyed by company.
 *
 * The logos already sit one per entry in `personal.ts`, which is the site's
 * career data, so they are read from there rather than restated here and cannot
 * drift from it.
 *
 * The key is lowercased deliberately. That file writes Civitech as CIVITECH
 * while this résumé writes it as Civitech, so an exact match would drop that one
 * mark silently rather than fail in a way anyone would notice.
 */
const COMPANY_LOGOS = new Map(
  careerTimeline
    .filter((entry) => Boolean(entry.logo))
    .map((entry) => [entry.company.toLowerCase(), entry.logo] as const),
);

/**
 * A quiet institution mark for a résumé line.
 *
 * Decorative on purpose, because the company name sits immediately beside it
 * and announcing the logo as well would just say the name twice. It is sized in
 * `em` off the line it sits on rather than in pixels, so it tracks the meta step
 * at every viewport instead of drifting against it, and `width: auto` keeps a
 * wordmark that is not square from being squashed into one.
 *
 * Most entries have no mark, and those render nothing at all rather than a gap.
 */
function Catalog97CompanyMark({ company }: { company: string }) {
  const logo = COMPANY_LOGOS.get(company.toLowerCase());
  if (!logo) return null;

  return (
    <Image
      src={logo}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      style={{
        height: "1.15em",
        width: "auto",
        objectFit: "contain",
      }}
    />
  );
}

interface Entry {
  role: string;
  company: string;
  when: string;
  kind: string;
  description: string;
  /** The long-form write-up of this job under /writing, where one exists. */
  writeUp?: string;
}

/*
 * Roles, dates, and metrics match the PDF résumé except the Haas@Work title and
 * dates and the Juno internship, which postdates the PDF. Haas@Work ended in May
 * 2026 (Isaac, 2026-09-29). Some wording is plainer for the web. Date ranges are
 * unhyphenated per the site's writing voice ("Jan 2022 to Jan 2025").
 */
const experience: Entry[] = [
  {
    role: "MBA Growth Intern",
    company: "Juno",
    when: "May to Aug 2026",
    kind: "Internship",
    description:
      "Growth intern on the MBA team at a fintech marketplace that negotiates group student loan rates. Reverse-engineered the production dashboard's SQL until it matched to the dollar and automated it into an hourly-refreshing 33-tab dashboard and executive view, turned on the first GA4 conversion events and shipped four Google Tag Manager releases, and audited the Customer.io lifecycle program across 233 campaigns and 2,071 broadcasts, which led to running the SMS program. Replaced a naive meeting-conversion lift with a matched-cohort estimate and designed a pre-registered experiment with a power analysis.",
    writeUp: "/writing/juno-mba-growth-internship",
  },
  {
    role: "Innovation Consultant Team Lead",
    company: "Haas@Work",
    when: "Jan to May 2026",
    kind: "Part time",
    description:
      "Led a student consulting team on an operations scaling project for a global rideshare technology company, running communication with the client and the team's day to day execution.",
  },
  {
    role: "Quality Assurance Engineer",
    company: "Civitech",
    when: "Feb to Aug 2025",
    kind: "Full time",
    description:
      "Translated leadership and user feedback into product requirements for RunningMate, a campaign management platform, aligning engineering and product teams. Redesigned onboarding tutorials and first-time user flows after analyzing clickstream data, lifting activation 25%, and built AI-powered QA and workflow automation that cut bug triage time 40%. Standardized manual and automated testing across two core products, moving releases from monthly to biweekly and cutting release validation time 30%. Built a real-time event system in Google Cloud that moved clients to self-service and cut onboarding time 60%.",
    writeUp: "/writing/civitech-quality-and-product-work",
  },
  {
    role: "Quality Assurance Analyst",
    company: "Civitech",
    when: "Jan 2022 to Jan 2025",
    kind: "Full time",
    description:
      "Owned product vision for a peer-to-peer texting platform, prioritizing features from direct customer conversations and quantitative impact assessments that drove a 35% increase in engagement. Led a cross-functional pricing strategy across engineering, sales, and finance that generated $4M in additional revenue in 2024, and worked with engineering and DevOps on new deployment rules and test plans across two products that held uptime at 99.999%, cut critical defects 90%, and improved release efficiency 50%.",
  },
  {
    role: "Client Services Manager",
    company: "Open Progress",
    when: "Jan to Dec 2021",
    kind: "Full time",
    description:
      "Led client digital and communication strategy, building messaging validation and audience sampling frameworks that lifted response rates 20% while scaling outreach to 50M+ voters. Analyzed voter behavior and campaign performance and briefed clients on what it meant for their targeting. Delivered all 80+ client campaigns on time by setting clear milestones for cross-functional teams.",
  },
  {
    role: "Digital and Data Associate",
    company: "Open Progress",
    when: "Sep 2019 to Dec 2020",
    kind: "Full time",
    description:
      "Automated ETL and reporting pipelines, replacing manual spreadsheets with nightly data drops and interactive dashboards in Sisense and Tableau and cutting analysis time 40%. Used behavior analytics to sharpen segmentation and targeting across 20+ campaigns, improving conversion 25% and supporter efficiency 15%, and built multichannel creative and A/B tests that lifted response rates 30%.",
  },
  {
    role: "Digital and Communications Intern",
    company: "Open Progress",
    when: "Jun to Aug 2019",
    kind: "Internship",
    description:
      "Built a data-driven acquisition strategy with personalized email campaigns and A/B testing that grew the user base 5x and lifted conversion 50% across client platforms.",
  },
];

const education = [
  {
    role: "MBA Candidate",
    company: "UC Berkeley Haas",
    when: "2025 to 2027",
    description:
      "Consortium Fellow · MLT Professional Development Fellow · MLT Ambassador. VP of Marketing (Haas Tech Club), VP of Admissions (Consortium), and active in the Product Management, AI, and Fintech clubs.",
  },
  {
    role: "BA, Political Science and International Affairs",
    company: "Florida State University",
    when: "2018",
    description: "",
  },
];

const capabilities = [
  {
    category: "Product analytics",
    skills: "Google Analytics, Hotjar, Looker Studio",
  },
  { category: "Data and SQL", skills: "SQL, PostgreSQL, MS SQL Server" },
  { category: "Cloud", skills: "Google Cloud Platform, Microsoft Azure" },
  {
    category: "AI and automation",
    skills:
      "ChatGPT Codex, Claude Code, Copilot, Google Gemini, Bolt, Lovable, n8n, Zapier",
  },
  {
    category: "Product development",
    skills: "Agile, Asana, Figma, Jira, Linear, Miro",
  },
  {
    category: "Design and prototyping",
    skills: "Canva, Lightroom, Magic Patterns, Photoshop",
  },
  {
    category: "Productivity",
    skills: "Cursor, Excel, Gamma, Loom, Notion, PowerPoint",
  },
];

const interests =
  "FC Barcelona · Ferrari (F1) · Big foodie · Film and TV buff · Travel and cultural immersion · Digital photography";

const RESUME_PDF = "/Isaac_Vazquez_Resume.pdf";

/**
 * Résumé, as one set document (2026-10-18).
 *
 * One paper sheet, the way the printed one-pager reads. The hero is the word
 * in poster type, one line naming the role, and the Download PDF button
 * beside them, once. Experience starts within the first screen and keeps its
 * subgrid date column and company marks, and education, capabilities, and
 * outside work follow under hairline rules. The chocolate download band, the
 * blue capabilities grid, the saffron three-column band, and "References
 * available on request" are gone. The page ends on the sentence about walking
 * through any project line by line, with the Get in touch link that
 * `e2e/resume.spec.ts` measures on paper.
 *
 * Everything below is the real record. There is no certifications section
 * because there are no certifications to list.
 */
function Rule() {
  return (
    <hr
      aria-hidden="true"
      style={{
        border: 0,
        borderTop: "1px solid var(--c97-rule)",
        margin: "var(--c97-sp-5) 0 var(--c97-sp-4)",
      }}
    />
  );
}

export function Catalog97Resume() {
  return (
    <div className={styles.print}>
      <Catalog97Shell>
        {/* Hero, the document's title row. */}
        <section className="c97-band c97-sheet" data-c97-surface="paper">
          {/*
            Flex with wrap rather than `grid: 1fr auto`, because `.c97-btn` is
            nowrap with a 160px floor and at a 320px viewport a grid track
            kept that width inside a 52.8px column and scrolled the page
            sideways.
          */}
          <div
            className="c97-shell"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-4)",
              alignItems: "end",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <h1 className="c97-poster">Résumé</h1>
              <p
                className="c97-lead"
                style={{
                  marginTop: "var(--c97-sp-2)",
                  maxWidth: "var(--c97-measure-wide)",
                  lineHeight: "var(--c97-lh-body)",
                }}
              >
                Second-year MBA at Berkeley Haas, after six years in campaign
                data, QA, and product work.
              </p>
            </div>
            <a className="c97-btn c97-offset" href={RESUME_PDF} download>
              Download PDF
            </a>
          </div>
        </section>

        {/* The document body, continuing the hero's paper. */}
        <section className="c97-band c97-band-continues" data-c97-surface="paper">
          <div className="c97-shell">
            <h2 className="c97-poster-sm">Experience</h2>
            <div
              className={styles.experience}
              style={{ marginTop: "var(--c97-sp-3)" }}
            >
              {experience.map((entry) => (
                <article
                  key={`${entry.company}-${entry.role}`}
                  className={styles.entry}
                >
                  <div
                    className="c97-serif c97-tabular"
                    style={{
                      fontSize: "var(--c97-fs-body)",
                      color: "var(--c97-label)",
                      minWidth: "9ch",
                    }}
                  >
                    {entry.when}
                  </div>
                  <div>
                    <h3
                      className="c97-serif c97-h3"
                      style={{ color: "var(--c97-ink-2)" }}
                    >
                      {entry.role}
                    </h3>
                    <p
                      className="c97-meta"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "var(--c97-sp-1)",
                        }}
                      >
                        <Catalog97CompanyMark company={entry.company} />
                        {entry.company}
                      </span>
                      <span>{entry.kind}</span>
                    </p>
                    <p
                      className="c97-prose"
                      style={{ marginTop: "var(--c97-sp-2)" }}
                    >
                      {entry.description}
                    </p>
                    {entry.writeUp ? (
                      <p
                        className={styles.screenOnly}
                        style={{ marginTop: "var(--c97-sp-2)" }}
                      >
                        <Link className="c97-microlink" href={entry.writeUp}>
                          Read the write-up
                          <span className="sr-only"> on my {entry.company} work</span>
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <Rule />

            <h2 className="c97-poster-sm">Education</h2>
            <div className={styles.experience} style={{ marginTop: "var(--c97-sp-3)" }}>
              {education.map((entry) => (
                <article key={entry.company} className={styles.entry}>
                  <div
                    className="c97-serif c97-tabular"
                    style={{
                      fontSize: "var(--c97-fs-body)",
                      color: "var(--c97-label)",
                      minWidth: "9ch",
                    }}
                  >
                    {entry.when}
                  </div>
                  <div>
                    <h3
                      className="c97-serif c97-h3"
                      style={{ color: "var(--c97-ink-2)" }}
                    >
                      {entry.role}
                    </h3>
                    <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "var(--c97-sp-1)",
                        }}
                      >
                        <Catalog97CompanyMark company={entry.company} />
                        {entry.company}
                      </span>
                    </p>
                    {entry.description ? (
                      <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
                        {entry.description}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <Rule />

            <h2 className="c97-poster-sm">Capabilities</h2>
            {/* A ledger, category then tools, so no group strands on a last row. */}
            <dl className={styles.ledger} style={{ marginTop: "var(--c97-sp-3)" }}>
              {capabilities.map((group) => (
                <div key={group.category} className={styles.ledgerRow}>
                  <dt className="c97-serif c97-lead">{group.category}</dt>
                  <dd
                    className="c97-prose"
                    style={{ margin: 0, color: "var(--c97-ink-2)" }}
                  >
                    {group.skills}
                  </dd>
                </div>
              ))}
            </dl>

            <Rule />

            <h2 className="c97-poster-sm">Outside work</h2>
            <p
              className="c97-prose"
              style={{
                marginTop: "var(--c97-sp-2)",
                lineHeight: "var(--c97-lh-loose)",
                maxWidth: "var(--c97-measure-wide)",
              }}
            >
              {interests}
            </p>

            <Rule />

            <p className="c97-prose" style={{ maxWidth: "var(--c97-measure-wide)" }}>
              I&rsquo;m happy to walk through any project on this site line by
              line.
            </p>
            <Link
              className="c97-btn-ghost"
              href="/contact"
              style={{ marginTop: "var(--c97-sp-2)" }}
            >
              Get in touch
            </Link>
          </div>
        </section>

        {/* Hidden on screen. Print only, the way a printer signs a job. */}
        <p className={styles.mark}>
          I set this page in Berkeley, and you printed it. The live copy is at
          isaacvazquez.com/resume.
        </p>
      </Catalog97Shell>
    </div>
  );
}
