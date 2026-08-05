import Image from "next/image";
import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { careerTimeline } from "@/constants/personal";

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
}

/*
 * Carried over from the previous resume page. Same roles, same dates, same
 * metrics — only the layout changes. Date ranges are unhyphenated per the
 * site's writing voice ("Jan 2022 to Jan 2025").
 */
const experience: Entry[] = [
  {
    role: "Innovation Consultant Team Lead",
    company: "Haas@Work",
    when: "Jan 2026 to now",
    kind: "Part time",
    description:
      "Leads client engagement for a global mobility technology company, managing stakeholder communication, workflow execution, and alignment across a cross-functional consulting team.",
  },
  {
    role: "Quality Assurance Engineer",
    company: "Civitech",
    when: "Feb to Aug 2025",
    kind: "Full time",
    description:
      "Translated leadership and user feedback into product requirements for RunningMate, a campaign management platform, aligning engineering and product teams. Redesigned onboarding tutorials and first-time user flows after analyzing clickstream data, lifting activation 25%, and built AI-powered QA and workflow automation that cut bug triage time 40%. Standardized manual and automated testing across two core products, moving releases from monthly to biweekly and cutting release validation time 30%.",
  },
  {
    role: "Quality Assurance Analyst",
    company: "Civitech",
    when: "Jan 2022 to Jan 2025",
    kind: "Full time",
    description:
      "Owned product vision for a peer-to-peer texting platform, prioritizing features from direct customer conversations and quantitative impact assessments that drove a 35% increase in engagement. Led a cross-functional pricing strategy across engineering, sales, and finance that generated $4M in additional revenue, and pushed release standards to 99.999% uptime, cutting critical defects 90% and improving release efficiency 50%.",
  },
  {
    role: "Client Services Manager",
    company: "Open Progress",
    when: "Jan to Dec 2021",
    kind: "Full time",
    description:
      "Led client digital and communication strategy, building messaging validation and audience sampling frameworks that lifted response rates 20% while scaling outreach to 50M+ voters. Analyzed voter behavior and campaign performance to brief clients on high-impact opportunities, and delivered 80+ client campaigns on time by aligning cross-functional teams around clear milestones.",
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
 * Résumé, in the Catalog 97 language.
 *
 * The design runs experience on paper with the date range in a fixed-width
 * column to the left, then a chocolate download band, a pine capabilities
 * grid, and a camel closing row. That order is kept.
 *
 * The mockup's education, certifications, and reference copy is fictional and
 * does not ship; everything below is the real record. There is no
 * certifications column because there are no certifications to list.
 */
export function Catalog97Resume() {
  return (
    <Catalog97Shell>
      {/* Hero */}
      <section className="c97-band" data-c97-surface="paper">
        {/*
          Flex with wrap rather than `grid: 1fr auto`, which is what the other
          hero rows use. Their second cell is a plate numeral about 70px wide,
          which always fits. This one is a 160px button that cannot shrink,
          because `.c97-btn` is nowrap with 22px of padding a side and a 48px
          floor. At a 320px viewport the shell is 249px, the button kept its
          160px inside a 52.8px track, and the page scrolled sideways to 385px.
          The download band lower down already solves the same pairing this way.
        */}
        <div
          className="c97-shell"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--c97-sp-5)",
            alignItems: "end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 260px" }}>
            <p className="c97-kicker">Résumé</p>
            <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
              Product work, with a quality engineering habit.
            </h1>
          </div>
          <a className="c97-btn" href={RESUME_PDF} download>
            Download PDF
          </a>
        </div>
      </section>

      {/* Experience */}
      <section
        className="c97-band c97-band-continues"
        data-c97-surface="paper"
      >
        <div className="c97-shell">
          {/*
            Every section heading on this route was an h2 carrying
            `c97-kicker`, so all five rendered at 11px while their children ran
            at 26px or 22px. --c97-fs-h2 is 32px against both and clamps to
            24px against 20px or 19px on a phone. Do not reach for
            --c97-fs-h3 here; it collapses to within a pixel of --c97-fs-lead
            once both clamps bottom out, which was measured on /portfolio.
          */}
          <h2 className="c97-serif c97-h2">Experience</h2>
          <div
            style={{
              display: "grid",
              gap: "var(--c97-sp-4)",
              marginTop: "var(--c97-sp-3)",
            }}
          >
            {experience.map((entry) => (
              <article
                key={`${entry.company}-${entry.role}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "var(--c97-sp-4)",
                  alignItems: "baseline",
                }}
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
                    <span>{entry.kind}</span>
                  </p>
                  <p
                    className="c97-prose"
                    style={{ marginTop: "var(--c97-sp-2)" }}
                  >
                    {entry.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Download band */}
      <section className="c97-band" data-c97-surface="chocolate">
        <div
          className="c97-shell"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--c97-sp-3)",
            alignItems: "end",
            justifyContent: "space-between",
          }}
        >
          <p
            className="c97-serif c97-h2"
            style={{ maxWidth: "var(--c97-measure-tight)" }}
          >
            Two pages, no summary paragraph, and the numbers are all checkable.
          </p>
          <a className="c97-btn c97-btn-invert" href={RESUME_PDF} download>
            Download PDF
          </a>
        </div>
      </section>

      {/* Capabilities */}
      <section className="c97-band c97-band-tall" data-c97-surface="pine">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">Capabilities</h2>
          <div
            className="c97-columns"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 200px),1fr))",
              gap: "var(--c97-sp-4)",
              marginTop: "var(--c97-sp-4)",
            }}
          >
            {capabilities.map((group) => (
              <div key={group.category}>
                <h3 className="c97-serif c97-lead">{group.category}</h3>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    lineHeight: "var(--c97-lh-loose)",
                    color: "var(--c97-ink-2)",
                  }}
                >
                  {group.skills}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Education, outside work, references */}
      <section className="c97-band" data-c97-surface="camel">
        <div
          className="c97-shell c97-columns"
          style={{
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 220px),1fr))",
            gap: "var(--c97-sp-4)",
          }}
        >
          <div>
            {/*
              Education, Outside work and References are the three columns of
              one camel band, so they move together. Education is the only one
              with heading children and so the only strict inversion, but
              leaving the other two at 11px beside a 32px sibling would put
              three mismatched headers in one row.
            */}
            <h2 className="c97-serif c97-h2">Education</h2>
            {education.map((entry) => (
              <div key={entry.company} style={{ marginTop: "var(--c97-sp-2)" }}>
                <h3 className="c97-serif c97-lead">{entry.role}</h3>
                <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--c97-sp-1)",
                    }}
                  >
                    <Catalog97CompanyMark company={entry.company} />
                    {entry.company}
                  </span>{" "}
                  · {entry.when}
                </p>
                {entry.description ? (
                  <p
                    className="c97-prose"
                    style={{
                      marginTop: "var(--c97-sp-1)",
                      maxWidth: "var(--c97-measure-body)",
                    }}
                  >
                    {entry.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div>
            <h2 className="c97-serif c97-h2">Outside work</h2>
            <p
              className="c97-prose"
              style={{
                marginTop: "var(--c97-sp-2)",
                lineHeight: "var(--c97-lh-loose)",
                maxWidth: "var(--c97-measure-body)",
              }}
            >
              {interests}
            </p>
          </div>

          <div>
            <h2 className="c97-serif c97-h2">References</h2>
            <p
              className="c97-prose"
              style={{
                marginTop: "var(--c97-sp-2)",
                maxWidth: "var(--c97-measure-body)",
              }}
            >
              Available on request, and I am happy to walk through any project
              on this site line by line.
            </p>
            <Link
              className="c97-btn-ghost"
              href="/contact"
              style={{ marginTop: "var(--c97-sp-2)" }}
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </Catalog97Shell>
  );
}
