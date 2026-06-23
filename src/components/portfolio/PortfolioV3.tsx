"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type CaseStudyData,
  getProjectCardSummary,
} from "@/constants/caseStudies";
import {
  TOOL_CATEGORY_DEFS as CATEGORY_DEFS,
  classifyToolSlug as classify,
  type ToolCategory as Category,
  type ToolCategoryId,
} from "@/constants/toolCategories";
import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";
import styles from "@/app/portfolio/portfolio.module.css";

interface Props {
  projects: CaseStudyData[];
}

type SortMode = "newest" | "alpha" | "live";

type CategoryId = "all" | ToolCategoryId;

interface CardMeta {
  category: Exclude<CategoryId, "all">;
  categoryLabel: string;
  tone: ToneVariant;
  isLive: boolean;
  isExternal: boolean;
  href: string;
}

type ToneVariant = "is-acid" | "is-haze" | "is-paper" | "is-outline";

const CAT_TONE: Record<ToolCategoryId, ToneVariant> = {
  fintech: "is-acid",
  pulse: "is-haze",
  sports: "is-outline",
  ai: "is-haze",
  decision: "is-paper",
  civic: "is-outline",
  lifestyle: "is-outline",
};

const COVERS = [
  "covAurora",
  "covPortrait",
  "covMachine",
  "covAcid",
  "covPaper",
  "covDark",
  "covChart",
] as const;

const PAGE_SIZE = 12;

function getMeta(study: CaseStudyData): CardMeta {
  const category = classify(study.slug);
  const categoryLabel =
    CATEGORY_DEFS.find((c) => c.id === category)?.label ?? "Project";
  const tone = CAT_TONE[category];
  const link = study.link ?? "";
  const isExternal = Boolean(link) && /^https?:\/\//i.test(link);
  const isLive = Boolean(link);
  // Internal site routes (e.g. /investments) are live tools; case-study
  // detail pages live at /portfolio/{slug}.
  const isLiveTool = isLive && (link.startsWith("/") || isExternal);
  const href = isLiveTool ? link : `/portfolio/${study.slug}`;
  return {
    category,
    categoryLabel,
    tone,
    isLive: isLiveTool,
    isExternal,
    href,
  };
}

function timelineYear(timeline: string): number {
  // Parses the first 4-digit year out of a timeline like "2024–2025" or "2026"
  const match = timeline.match(/(\d{4})/g);
  if (!match || match.length === 0) return 0;
  // Use the latest year so multi-year ranges sort by recency.
  return Math.max(...match.map((y) => parseInt(y, 10)));
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l14 0" />
      <path d="M13 18l6 -6" />
      <path d="M13 6l6 6" />
    </svg>
  );
}

function ChevronLeft({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 6l-6 6l6 6" />
    </svg>
  );
}

function ChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6l-6 6" />
    </svg>
  );
}

function SearchGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35 -4.35" />
    </svg>
  );
}

// Builds the lowercase haystack a project is searched against — title,
// description, role, tools, timeline, metrics, the editorial summary, and the
// project's category label — so a query can match on what a project *is* as
// well as what it's *called*.
function matchesQuery(study: CaseStudyData, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const categoryLabel =
    CATEGORY_DEFS.find((c) => c.id === classify(study.slug))?.label ?? "";
  const haystack = [
    study.title,
    study.description,
    study.role,
    study.timeline,
    study.metrics,
    study.overview?.summary ?? "",
    categoryLabel,
    ...study.tools,
  ]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function toneClass(tone: ToneVariant): string {
  switch (tone) {
    case "is-acid":
      return styles.tagAcid;
    case "is-haze":
      return styles.tagHaze;
    case "is-paper":
      return styles.tagPaper;
    case "is-outline":
    default:
      return styles.tagOutline;
  }
}

function coverClass(idx: number): string {
  const key = COVERS[idx % COVERS.length];
  return styles[key];
}

function ProjectCard({
  study,
  index,
  spotlight,
}: {
  study: CaseStudyData;
  index: number;
  spotlight: boolean;
}) {
  const meta = getMeta(study);
  const summary = getProjectCardSummary(study);
  // Numbering: featured (Investment Analytics) is 01, then the archive
  // grid resumes from 02 onwards. `index` here is the project's position
  // within the full filtered list.
  const id = pad2(index + 2);

  const tagToneClass = toneClass(meta.tone);
  const tag = (
    <span className={`${styles.tag} ${tagToneClass}`}>
      {meta.categoryLabel}
    </span>
  );
  const liveBadge = meta.isLive ? (
    <span className={styles.live}>Live</span>
  ) : null;

  const externalProps = meta.isExternal
    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
    : {};

  if (spotlight) {
    return (
      <Link
        href={meta.href}
        className={`${styles.card} ${styles.spotlight}`}
        {...externalProps}
      >
        <div className={styles.spotlightLeft}>
          <div>
            <div className={styles.spotKicker}>
              No. {id} · Spotlight
            </div>
            <span className={styles.bigNum}>{id}</span>
          </div>
          <div className={styles.metaMono}>
            {study.timeline} · {study.role}
          </div>
        </div>
        <div className={styles.spotlightRight}>
          <div>
            <h3 data-testid="portfolio-card-title">{study.title}</h3>
            <p style={{ marginTop: 14 }}>{summary}</p>
          </div>
          <div className={styles.cardFootRow}>
            <div className={styles.spotlightTagRow}>
              <span
                className={`${styles.tag} ${
                  meta.tone === "is-paper" || meta.tone === "is-outline"
                    ? styles.tagAcid
                    : tagToneClass
                }`}
              >
                {meta.categoryLabel}
              </span>
              {liveBadge}
            </div>
            <span className={styles.readLink}>
              Open <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={meta.href}
      className={`${styles.card} ${coverClass(index)}`}
      {...externalProps}
    >
      <div className={styles.cardTopNum}>
        <span className={styles.id}>{`№ ${id}`}</span>
        <span>{study.timeline}</span>
      </div>
      <div className={styles.cardImg} aria-hidden="true" />
      <h3 data-testid="portfolio-card-title">{study.title}</h3>
      <p>{summary}</p>
      <div className={styles.cardFootRow}>
        <div className={styles.cardTagRow}>
          {tag}
          {liveBadge}
        </div>
        <span className={styles.metaMono}>{study.role}</span>
      </div>
    </Link>
  );
}

export function PortfolioV3({ projects }: Props) {
  const [active, setActive] = useState<CategoryId>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  // Counts come from the full project list (including whatever ends up
  // featured) so the chips always show the real number of projects in each
  // bucket — not "everything except the canonical first project."
  const categoryCounts = useMemo(() => {
    const counts = new Map<CategoryId, number>();
    counts.set("all", projects.length);
    CATEGORY_DEFS.forEach((c) =>
      counts.set(c.id, projects.filter((p) => classify(p.slug) === c.id).length),
    );
    return counts;
  }, [projects]);

  const activeCategories: Category[] = useMemo(
    () => CATEGORY_DEFS.filter((c) => (categoryCounts.get(c.id) ?? 0) > 0),
    [categoryCounts],
  );

  // Filter + sort the FULL list, then split into featured (first match) and
  // archive (the rest). This makes the featured card respond to chip clicks
  // and sort changes — previously it stayed locked on projects[0] forever.
  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let list =
      active === "all"
        ? projects
        : projects.filter((p) => classify(p.slug) === active);
    if (tokens.length > 0) {
      list = list.filter((p) => matchesQuery(p, tokens));
    }
    if (sort === "alpha") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "live") {
      list = [...list].sort(
        (a, b) => Number(Boolean(b.link)) - Number(Boolean(a.link)),
      );
    } else if (sort === "newest") {
      list = [...list].sort(
        (a, b) => timelineYear(b.timeline) - timelineYear(a.timeline),
      );
    }
    return list;
  }, [projects, active, sort, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset pagination when filter, sort, or search changes
    setPage(1);
  }, [active, sort, query]);

  // Pin Investment Analytics Platform as the featured spotlight on the
  // "all" and "fintech" tabs — it's the flagship project, and burying it
  // in the grid hurts both surfaces. Other category filters fall back to
  // the first item in their filtered slice (still sort-aware).
  const featured = useMemo(() => {
    if (active === "all" || active === "fintech") {
      const pinned = filtered.find(
        (p) => p.slug === "investment-analytics-platform",
      );
      if (pinned) return pinned;
    }
    return filtered[0];
  }, [filtered, active]);
  const archive = useMemo(
    () => (featured ? filtered.filter((p) => p.slug !== featured.slug) : []),
    [filtered, featured],
  );

  // Roving keyboard navigation: "All" tab + the active categories form one
  // tablist. ←/→ wrap, Home/End jump, Enter/Space activate. Roving tabindex
  // keeps only the active chip in the tab order.
  const tabItems = useMemo(
    () =>
      [{ id: "all" as CategoryId }, ...activeCategories.map((c) => ({ id: c.id }))],
    [activeCategories],
  );
  const handleChipKeyDown = useTablistKeyboard(tabItems, (item) =>
    setActive(item.id),
  );

  const totalPages = Math.max(1, Math.ceil(archive.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const visible = archive.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = archive.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(page * PAGE_SIZE, archive.length);

  // Stat strip — total counts driven by real data.
  const totalProjects = projects.length;
  const liveToolsCount = projects.filter((p) => Boolean(p.link)).length;
  const categoryCount = activeCategories.length;
  const sinceYear = useMemo(() => {
    const years = projects
      .map((p) => timelineYear(p.timeline))
      .filter((y) => y > 0);
    if (years.length === 0) return "'24";
    const min = Math.min(...years);
    return `'${String(min).slice(-2)}`;
  }, [projects]);

  const featuredMeta = featured ? getMeta(featured) : null;
  const featuredSummary = featured ? getProjectCardSummary(featured) : "";

  return (
    <div className={styles.page}>
      {/* Masthead */}
      <section className={styles.masthead}>
        <div className={styles.shell}>
          <div className={styles.kickerRow}>
            <span className="dept">Dept. 02</span>
            <span>Selected Work</span>
            <span>—</span>
            <span>Vol. 2026</span>
          </div>
          <div className={styles.mastheadGrid}>
            <h1 className={styles.mastheadTitle}>
              All projects across product, analytics &amp;{" "}
              <em>tooling</em>.
            </h1>
            <div className={styles.sideblock}>
              <p className={styles.blurb}>
                Live tools, decision interfaces, and analytics products. Each
                one ships with a reason it exists, a tradeoff it makes, and a
                surface you can poke at directly.
              </p>
              <label className={styles.search} aria-label="Search projects">
                <SearchGlyph size={16} />
                <input
                  type="search"
                  placeholder={`Search ${pad2(totalProjects)} projects`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className={styles.statStrip}>
                <div>
                  <span className="lbl">Projects</span>
                  <span className="val">{pad2(totalProjects)}</span>
                </div>
                <div>
                  <span className="lbl">Live tools</span>
                  <span className="val">{pad2(liveToolsCount)}</span>
                </div>
                <div>
                  <span className="lbl">Categories</span>
                  <span className="val">{pad2(categoryCount)}</span>
                </div>
                <div>
                  <span className="lbl">Since</span>
                  <span className="val">{sinceYear}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter band */}
      <div className={styles.filterBand}>
        <div className={styles.shell}>
          <div className={styles.filterRow} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={active === "all"}
              tabIndex={active === "all" ? 0 : -1}
              className={`${styles.chip} ${active === "all" ? styles.chipOn : ""}`}
              onClick={() => setActive("all")}
              onKeyDown={(e) => handleChipKeyDown(e, 0)}
            >
              <span>All</span>
              <span className="num">
                {pad2(categoryCounts.get("all") ?? 0)}
              </span>
            </button>
            {activeCategories.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active === c.id}
                tabIndex={active === c.id ? 0 : -1}
                className={`${styles.chip} ${active === c.id ? styles.chipOn : ""}`}
                onClick={() => setActive(c.id)}
                onKeyDown={(e) => handleChipKeyDown(e, i + 1)}
              >
                <span>{c.label}</span>
                <span className="num">
                  {pad2(categoryCounts.get(c.id) ?? 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className={styles.shell}>
          {/* Featured */}
          {featured && featuredMeta ? (
            <section className={styles.featured}>
              <div className={styles.featNumeral}>01</div>
              <div className={styles.featBody}>
                <div className={styles.featByline}>
                  <span>{featuredMeta.categoryLabel}</span>
                  <span className="dot"></span>
                  <span>{featured.timeline}</span>
                  <span className="dot"></span>
                  <span>{featured.role}</span>
                  {featuredMeta.isLive ? (
                    <>
                      <span className="dot"></span>
                      <span className={styles.live}>Live</span>
                    </>
                  ) : null}
                </div>
                <h2 className={styles.featTitle}>
                  {featured.title}
                </h2>
                <p className={styles.featDek}>{featuredSummary}</p>
                <div className={styles.featActions}>
                  <span className={`${styles.tag} ${styles.tagAcid}`}>
                    {featuredMeta.categoryLabel}
                  </span>
                  {featured.metrics
                    ? featured.metrics
                        .split("·")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((s) => (
                          <span
                            key={s}
                            className={`${styles.tag} ${styles.tagOutline}`}
                          >
                            {s}
                          </span>
                        ))
                    : null}
                  <Link
                    className={styles.readLink}
                    href={featuredMeta.href}
                    {...(featuredMeta.isExternal
                      ? {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : {})}
                  >
                    Open project
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
              <Link
                className={styles.featImg}
                href={featuredMeta.href}
                aria-label={`Open ${featured.title}`}
                {...(featuredMeta.isExternal
                  ? {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {})}
              >
                <div className={styles.featImgInner}></div>
                <div className={styles.featImgMeta}>
                  <span>Cover · 01</span>
                  <span className="corner">{"↗"}</span>
                </div>
              </Link>
            </section>
          ) : null}
        </div>
      </div>

      <div>
        <div className={styles.shell}>
          {/* Archive */}
          <section className={styles.archive}>
            <div className={styles.archiveHead}>
              <div className="left">
                <h2>
                  The <em>Archive</em>
                </h2>
                <span className="count">
                  Showing {showingFrom}
                  {showingTo > showingFrom ? `–${showingTo}` : ""} of{" "}
                  {archive.length}
                </span>
              </div>
              <div className="right">
                <span>Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  aria-label="Sort projects"
                >
                  <option value="newest">Newest first</option>
                  <option value="alpha">A–Z</option>
                  <option value="live">Live tools first</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>
                  No projects match{" "}
                  {query.trim() ? `“${query.trim()}”` : "that filter"} yet.
                </p>
                <p className={styles.emptyBody}>
                  Try a different keyword or category.
                </p>
                {query.trim() ? (
                  <button
                    type="button"
                    className={styles.emptyClear}
                    onClick={() => setQuery("")}
                  >
                    Clear search
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {visible.map((study, i) => {
                    const absoluteIndex = pageStart + i;
                    // Spotlight every 7th card (mirrors the prototype's
                    // is-spotlight cadence on certain projects).
                    const isSpotlight =
                      absoluteIndex > 0 && absoluteIndex % 7 === 1;
                    return (
                      <ProjectCard
                        key={study.slug}
                        study={study}
                        index={absoluteIndex}
                        spotlight={isSpotlight}
                      />
                    );
                  })}
                </div>

                {/* Marquee band — sits between the project grid and the pager */}
                <div className={styles.band} aria-hidden="true">
                  <div className={styles.bandInner}>
                    <div className={styles.marquee}>
                      <span className="hot">Latest · Budget Planner ships</span>
                      <span>{liveToolsCount} live tools</span>
                      <span>Pulse dashboards · multiple surfaces</span>
                      <span>Decision Lab · 6 presets</span>
                      <span>Interchange IQ · 7 processors</span>
                      <span>Frontier Models · 7 providers</span>
                      <span>GitHub Trending · 14 segments</span>
                      <span className="hot">Snapshot-driven · deep-linkable</span>
                      <span className="hot">Latest · Budget Planner ships</span>
                      <span>{liveToolsCount} live tools</span>
                      <span>Pulse dashboards · multiple surfaces</span>
                      <span>Decision Lab · 6 presets</span>
                      <span>Interchange IQ · 7 processors</span>
                      <span>Frontier Models · 7 providers</span>
                      <span>GitHub Trending · 14 segments</span>
                      <span className="hot">Snapshot-driven · deep-linkable</span>
                    </div>
                  </div>
                </div>

                {totalPages > 1 ? (
                  <div className={styles.pager}>
                    <span className={styles.pageInfo}>
                      Page {page} of {totalPages}
                    </span>
                    <div className={styles.pages}>
                      <button
                        type="button"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft />
                        Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (n) => (
                          <button
                            key={n}
                            type="button"
                            className={n === page ? styles.pageOn : ""}
                            onClick={() => setPage(n)}
                            aria-current={n === page ? "page" : undefined}
                          >
                            {pad2(n)}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>

        {/* The closing CTA is the footer's ContactCta (full footer variant) —
            no inline CTA band here, or the page ends with two stacked,
            near-identical panels. */}
      </div>
    </div>
  );
}

