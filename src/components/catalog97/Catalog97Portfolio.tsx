"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Plate } from "./Catalog97Primitives";
import {
  getProjectCardSummary,
  type CaseStudyData,
} from "@/constants/caseStudies";
import {
  classifyToolSlug,
  TOOL_CATEGORY_DEFS,
  type ToolCategoryId,
} from "@/constants/toolCategories";

export interface Catalog97PortfolioProps {
  projects: CaseStudyData[];
}

const ALL = "all";

/** How many entries lead the index at full weight before the ledger takes over. */
const LEAD_COUNT = 4;

/**
 * The work index, in the Catalog 97 language.
 *
 * The design leads with a small camel band of full-weight entries and drops
 * everything else into a pine ledger below it, which is the same two-tier
 * shape the writing index uses. That proportion is what keeps camel to its
 * share of the page rather than letting a thirty-row list turn the whole route
 * tan.
 *
 * The design's category filter is drawn as a row of links. It is wired up here
 * against the repo's real category buckets rather than rendered as links that
 * go nowhere, and every project in `caseStudies.ts` is bucketed, so no entry
 * disappears when a filter is on.
 */
export function Catalog97Portfolio({ projects }: Catalog97PortfolioProps) {
  const [active, setActive] = useState<string>(ALL);

  const tabs = useMemo(() => {
    const counts = new Map<ToolCategoryId, number>();
    for (const project of projects) {
      const id = classifyToolSlug(project.slug);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [
      { id: ALL, label: "All", count: projects.length },
      ...TOOL_CATEGORY_DEFS.filter((def) => counts.has(def.id)).map((def) => ({
        id: def.id as string,
        label: def.label,
        count: counts.get(def.id) ?? 0,
      })),
    ];
  }, [projects]);

  const filtered = useMemo(
    () =>
      active === ALL
        ? projects
        : projects.filter((project) => classifyToolSlug(project.slug) === active),
    [projects, active],
  );

  const lead = filtered.slice(0, LEAD_COUNT);
  const ledger = filtered.slice(LEAD_COUNT);

  return (
    <Catalog97Shell>
      {/* Hero */}
      <section
        className="c97-band"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-4)" }}
      >
        <div
          className="c97-shell"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "var(--c97-sp-5)",
            alignItems: "end",
          }}
        >
          <div>
            <p className="c97-kicker">Work</p>
            <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
              Everything I&rsquo;ve shipped, and the decisions behind it.
            </h1>
          </div>
          <Catalog97Plate value={String(projects.length)} />
        </div>
      </section>

      {/* Filter row */}
      <section
        className="c97-band c97-band-continues"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-3)" }}
      >
        <div
          className="c97-shell"
          role="tablist"
          aria-label="Filter projects by category"
          /*
            Row gap sp-5, not sp-3. `.c97-microlink` hit boxes are 50px tall,
            and sp-3 clamps to 22px on a phone, which puts wrapped rows 39px
            apart and overlaps them. Measured on the identical control on
            /dashboards, that was eight overlapping pairs at 320. Keep the two
            axes separate.
          */
          style={{
            display: "flex",
            columnGap: "var(--c97-sp-3)",
            rowGap: "var(--c97-sp-5)",
            flexWrap: "wrap",
          }}
        >
          {tabs.map((tab) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(tab.id)}
                className="c97-microlink"
                style={{
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: "var(--c97-sp-1)",
                  color: selected ? "var(--c97-ink)" : "var(--c97-label)",
                }}
              >
                <span>{tab.label}</span>
                <span className="c97-tabular">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Lead entries */}
      <section className="c97-band" data-c97-surface="camel">
        <div
          className="c97-shell"
          style={{ display: "grid", gap: "var(--c97-sp-4)" }}
        >
          {lead.map((project) => (
            <article key={project.slug} className="c97-row">
              <div>
                <h2 className="c97-serif c97-h2">
                  <Link
                    href={`/portfolio/${project.slug}`}
                    style={{ textDecoration: "none" }}
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
                <p className="c97-meta" style={{ marginTop: "var(--c97-sp-2)" }}>
                  <span>{project.role}</span>
                  {project.tools.slice(0, 2).map((tool) => (
                    <span key={tool}>{tool}</span>
                  ))}
                </p>
              </div>
              <div className="c97-kicker c97-tabular">{project.timeline}</div>
            </article>
          ))}
        </div>
      </section>

      {/* The rest of the index */}
      <section className="c97-band c97-band-tall" data-c97-surface="pine">
        <div className="c97-shell">
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "var(--c97-sp-2)",
              flexWrap: "wrap",
            }}
          >
            {/*
              This was `c97-kicker`, so an h2 rendered at 11px directly above
              22px children while its four sibling h2s in the camel band ran at
              32px.

              --c97-fs-h3 was tried first, on the reasoning that the ledger is
              the quiet tier and its header should stay quiet. It does not
              survive mobile. Both steps clamp down at 390px, h3 to 20px and
              lead to 19px, so the header landed one pixel above its own
              children and the nesting went invisible, which is the same defect
              one step over. --c97-fs-h2 clamps to 24px against the same 19px,
              and at 1440 it is 32px against 22px. It also matches the four
              sibling h2s in the camel band, so every h2 on the route now draws
              at one size.
            */}
            <h2 className="c97-serif c97-h2">The rest of the index</h2>
            <p className="c97-kicker c97-tabular">
              {filtered.length} {filtered.length === 1 ? "project" : "projects"}
            </p>
          </div>

          {ledger.length > 0 ? (
            /*
              Two columns above roughly 780px, one below.

              As a single full-width column each row was a 1fr title track and
              an auto date track inside the 1080px shell, so a title of about
              250px sat roughly 850px away from its own date with nothing
              between them. Reading across that gap is the scanning problem a
              ledger exists to avoid, and there are 29 rows of it. Halving the
              column width halves the distance, and it takes the pine band from
              1940px to about half that.

              A hairline per row would also bridge the gap and the design owns
              that device, but proximity solves it without adding 29 rules.
            */
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                columnGap: "var(--c97-sp-5)",
                rowGap: "var(--c97-sp-3)",
                marginTop: "var(--c97-sp-4)",
              }}
            >
              {ledger.map((project) => (
                <div key={project.slug} className="c97-row">
                  {/*
                    An h3 rather than a div. These 29 are the same kind of thing
                    as the four in the camel band, which are h2, so as divs they
                    were 29 of the 33 projects unreachable by heading
                    navigation. The level mirrors the two-tier split the design
                    already makes visually, and `c97-lead` keeps the size.
                  */}
                  <h3 className="c97-serif c97-lead">
                    <Link
                      href={`/portfolio/${project.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      {project.title}
                    </Link>
                  </h3>
                  <div className="c97-kicker c97-tabular">
                    {project.timeline}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="c97-prose"
              style={{
                marginTop: "var(--c97-sp-4)",
                color: "var(--c97-ink-2)",
                maxWidth: "var(--c97-measure-body)",
              }}
            >
              Everything under this filter is already above.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
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
            className="c97-serif c97-h3"
            style={{ maxWidth: "var(--c97-measure-tight)" }}
          >
            Each project write-up leads with the problem, and puts the stack
            last.
          </p>
          <Link className="c97-btn c97-btn-invert" href="/contact">
            Ask about one
          </Link>
        </div>
      </section>
    </Catalog97Shell>
  );
}
