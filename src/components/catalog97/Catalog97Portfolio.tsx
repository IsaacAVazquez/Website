import Link from "next/link";
import Image from "next/image";
import { Catalog97Shell } from "./Catalog97Shell";
import { PROJECT_PLATES } from "./projectPlates";
import {
  PROJECT_BUILD_NOTES,
  getProjectCardSummary,
  type CaseStudyData,
} from "@/constants/caseStudies";

export interface Catalog97PortfolioProps {
  projects: CaseStudyData[];
}

/** How many entries the work page shows. The rest of the inventory lives on /dashboards. */
export const WORK_LEAD_COUNT = 4;

/*
 * The two jobs the product work came from. Copy is the excerpt of each
 * write-up, so the card and the article say the same thing.
 */
const CAREER_WRITE_UPS = [
  {
    title: "Juno",
    role: "MBA Growth Intern",
    when: "May to Aug 2026",
    href: "/writing/juno-mba-growth-internship",
    summary:
      "I spent the summer of 2026 as the growth intern on Juno's MBA team. I rebuilt the team's reporting, set up conversion measurement, audited the email program, took over the SMS program, and replaced a few flattering numbers with honest ones.",
  },
  {
    title: "Civitech",
    role: "QA Analyst, then QA Engineer",
    when: "Jan 2022 to Aug 2025",
    href: "/writing/civitech-quality-and-product-work",
    summary:
      "For three and a half years I was the QA analyst and then QA engineer at Civitech, which builds campaign software in Austin, and the QA job grew into product work on TextOut, RunningMate, pricing, and client data.",
  },
] as const;

/**
 * The work page, in the Catalog 97 language.
 *
 * This is the curated story, and /dashboards is the inventory. Four full-weight
 * entries lead on saffron, the two jobs the product work came from follow on
 * blue, and one line in the hero points at /dashboards, which indexes and
 * filters all of the tools. Until 2026-10-19 this route also carried a search
 * field, a sort select, the nine-bucket category filter, and a thirty-row
 * ledger of the remaining tools, which made it the same inventory as
 * /dashboards in a second layout and buried the first project below the fold.
 */
export function Catalog97Portfolio({ projects }: Catalog97PortfolioProps) {
  const lead = projects.slice(0, WORK_LEAD_COUNT);

  return (
    <Catalog97Shell>
      {/* Hero, the proofed sheet. */}
      <section
        className="c97-band c97-sheet"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-4)" }}
      >
        <div
          className="c97-shell"
          style={{ display: "grid", gap: "var(--c97-sp-3)" }}
        >
          <h1 className="c97-poster-sm">
            The work I&rsquo;d show first, and the decisions behind it.
          </h1>
          <p className="c97-lead" style={{ maxWidth: "var(--c97-measure-body)" }}>
            Four things I built and the two jobs the product work came from.
            The full inventory, all {projects.length} tools, is on{" "}
            <Link className="c97-link" href="/dashboards">
              Dashboards
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Lead entries */}
      <section
        aria-label="Projects"
        className="c97-band c97-band-tall c97-sheet"
        data-c97-surface="ink-saffron"
        data-seam="torn"
      >
        <div
          className="c97-shell"
          style={{ display: "grid", gap: "var(--c97-sp-5)" }}
        >
          {lead.map((project) => (
            <article
              key={project.slug}
              className="c97-row c97-row-stack-sm"
              // Top-aligned: the plate column is taller than a baseline can hold.
              style={{ alignItems: "start" }}
            >
              <div>
                <h2 className="c97-serif c97-h2">
                  <Link
                    // /portfolio/<slug> only redirects to the live tool now.
                    href={project.link ?? `/portfolio/${project.slug}`}
                    className="c97-link-heading"
                  >
                    {project.title}
                  </Link>
                </h2>
                <p
                  className="c97-prose"
                  style={{ marginTop: "var(--c97-sp-1)" }}
                >
                  {getProjectCardSummary(project)}
                </p>
                <p
                  className="c97-meta"
                  style={{ marginTop: "var(--c97-sp-2)" }}
                >
                  <span>{project.role}</span>
                  {project.tools.slice(0, 2).map((tool) => (
                    <span key={tool}>{tool}</span>
                  ))}
                </p>
                {/*
                  The title opens the tool itself, so the reasoning behind it
                  gets its own link where a build note exists.
                */}
                {PROJECT_BUILD_NOTES[project.slug] ? (
                  <Link
                    href={`/writing/${PROJECT_BUILD_NOTES[project.slug]}`}
                    className="c97-sectionlink"
                    style={{ marginTop: "var(--c97-sp-1)" }}
                  >
                    How I built it
                  </Link>
                ) : null}
              </div>
              {/* A printed plate, where the project has one, pasted above its date. */}
              <div
                style={{
                  display: "grid",
                  justifyItems: "start",
                  gap: "var(--c97-sp-2)",
                }}
              >
                {PROJECT_PLATES[project.slug] ? (
                  <span
                    className="c97-offset"
                    style={{
                      position: "relative",
                      display: "block",
                      width: "clamp(160px, 18vw, 240px)",
                      aspectRatio: "3 / 2",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      loading="eager"
                      src={PROJECT_PLATES[project.slug]}
                      alt=""
                      fill
                      sizes="240px"
                      style={{ objectFit: "cover" }}
                    />
                  </span>
                ) : null}
                <div className="c97-kicker c97-tabular">{project.timeline}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* The two jobs */}
      <section
        aria-labelledby="work-where-from"
        className="c97-band c97-band-tall c97-sheet"
        data-c97-surface="ink-blue"
        data-seam="torn"
      >
        <div
          className="c97-shell"
          style={{ display: "grid", gap: "var(--c97-sp-4)" }}
        >
          <h2 id="work-where-from" className="c97-poster-sm">Where the product work came from</h2>
          {CAREER_WRITE_UPS.map((job) => (
            <article
              key={job.href}
              className="c97-row c97-row-stack-sm"
              style={{ alignItems: "start" }}
            >
              <div>
                <h3 className="c97-serif c97-h3">
                  <Link href={job.href} className="c97-link-heading">
                    {job.title}
                  </Link>
                </h3>
                <p
                  className="c97-prose"
                  style={{ marginTop: "var(--c97-sp-1)" }}
                >
                  {job.summary}
                </p>
                <p
                  className="c97-meta"
                  style={{ marginTop: "var(--c97-sp-2)" }}
                >
                  <span>{job.role}</span>
                </p>
              </div>
              <div className="c97-kicker c97-tabular">{job.when}</div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="c97-band c97-sheet"
        data-c97-surface="chocolate"
        data-seam="torn"
      >
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
          <div>
            <p className="c97-kicker">Write-ups</p>
            <p
              className="c97-poster-sm"
              style={{ maxWidth: "24ch", marginTop: "var(--c97-sp-2)" }}
            >
              Each of these has a build note in the writing archive, and I am
              happy to walk through any of them.
            </p>
          </div>
          <Link className="c97-btn c97-btn-invert c97-offset" href="/contact">
            Ask about one
          </Link>
        </div>
      </section>
    </Catalog97Shell>
  );
}
