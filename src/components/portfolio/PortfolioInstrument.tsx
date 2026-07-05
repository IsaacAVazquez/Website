"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import { useTrackedListingSearch } from "@/hooks/useTrackedListingSearch";
import { trackListingFilter } from "@/lib/analytics";
import styles from "@/app/portfolio/portfolio.module.css";

interface Props {
  projects: CaseStudyData[];
}

type SortMode = "newest" | "alpha" | "live";

type CategoryId = "all" | ToolCategoryId;

interface CardMeta {
  category: Exclude<CategoryId, "all">;
  categoryLabel: string;
  isLive: boolean;
  isExternal: boolean;
  href: string;
}

const PAGE_SIZE = 12;

function getMeta(study: CaseStudyData): CardMeta {
  const category = classify(study.slug);
  const categoryLabel =
    CATEGORY_DEFS.find((c) => c.id === category)?.label ?? "Project";
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

function ProjectCard({
  study,
  index,
}: {
  study: CaseStudyData;
  index: number;
}) {
  const meta = getMeta(study);
  const summary = getProjectCardSummary(study);
  // Numbering: the featured project is 01, so the archive grid resumes from
  // 02 onwards. `index` is the project's position in the full filtered list.
  const id = pad2(index + 2);

  const externalProps = meta.isExternal
    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
    : {};

  return (
    <Link href={meta.href} className={styles.card} {...externalProps}>
      <div className={styles.cardArt} aria-hidden="true">
        <Image
          src={`/images/projects/${study.slug}.svg`}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 700px) 92vw, (max-width: 1000px) 46vw, 30vw"
        />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardNum} aria-hidden="true">
            {id}
          </span>
          <span className={styles.cardMeta}>{study.timeline}</span>
          {meta.isLive ? <span className={styles.live}>Live</span> : null}
        </div>
        <h3 data-testid="portfolio-card-title">{study.title}</h3>
        <p>{summary}</p>
        <div className={styles.cardFoot}>
          <span className={styles.tag}>{meta.categoryLabel}</span>
          <span>{study.role}</span>
        </div>
      </div>
    </Link>
  );
}

export function PortfolioInstrument({ projects }: Props) {
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
  // and sort changes.
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

  // Report completed searches to GA4 (no-op unless analytics is enabled).
  useTrackedListingSearch("portfolio", query, filtered.length);

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

  // Stat strip — totals driven by real data.
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
          <p className={styles.kicker}>Projects · live and documented</p>
          <div className={styles.mastheadGrid}>
            <h1 className={styles.mastheadTitle}>
              All projects across product, analytics &amp; <em>tooling</em>.
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
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Projects</span>
                  <span className={styles.statVal}>{pad2(totalProjects)}</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Live tools</span>
                  <span className={styles.statVal}>{pad2(liveToolsCount)}</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Categories</span>
                  <span className={styles.statVal}>{pad2(categoryCount)}</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Since</span>
                  <span className={styles.statVal}>{sinceYear}</span>
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
              onClick={() => {
                trackListingFilter({
                  listing_id: "portfolio",
                  filter_type: "category",
                  filter_value: "all",
                });
                setActive("all");
              }}
              onKeyDown={(e) => handleChipKeyDown(e, 0)}
            >
              <span>All</span>
              <span className={styles.chipNum}>
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
                onClick={() => {
                  trackListingFilter({
                    listing_id: "portfolio",
                    filter_type: "category",
                    filter_value: c.id,
                  });
                  setActive(c.id);
                }}
                onKeyDown={(e) => handleChipKeyDown(e, i + 1)}
              >
                <span>{c.label}</span>
                <span className={styles.chipNum}>
                  {pad2(categoryCounts.get(c.id) ?? 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured */}
      {featured && featuredMeta ? (
        <div className={styles.shell}>
          <section className={styles.featured} aria-label="Featured project">
            <div className={styles.featNumeral} aria-hidden="true">
              01
            </div>
            <div className={styles.featBody}>
              <span className={styles.featKicker}>Featured project</span>
              <div className={styles.featByline}>
                <span>{featuredMeta.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{featured.timeline}</span>
                <span aria-hidden="true">·</span>
                <span>{featured.role}</span>
                {featuredMeta.isLive ? (
                  <span className={styles.live}>Live</span>
                ) : null}
              </div>
              <h2 className={styles.featTitle}>{featured.title}</h2>
              <p className={styles.featDek}>{featuredSummary}</p>
              <div className={styles.featActions}>
                {featured.metrics
                  ? featured.metrics
                      .split("·")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((s) => (
                        <span key={s} className={styles.tag}>
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
            <div className={styles.featArt} aria-hidden="true">
              <Image
                src={`/images/projects/${featured.slug}.svg`}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 720px) 92vw, 30vw"
              />
            </div>
          </section>
        </div>
      ) : null}

      {/* Archive */}
      <div className={styles.shell}>
        <section className={styles.archive} aria-labelledby="portfolio-archive-heading">
          <div className={styles.archiveHead}>
            <div className={styles.archiveTitleWrap}>
              <h2 id="portfolio-archive-heading" className={styles.archiveTitle}>
                The archive
              </h2>
              <span className={styles.archiveCount}>
                Showing {showingFrom}
                {showingTo > showingFrom ? `–${showingTo}` : ""} of{" "}
                {archive.length}
              </span>
            </div>
            <div className={styles.sortWrap}>
              <span className={styles.sortLbl}>Sort</span>
              <select
                value={sort}
                onChange={(e) => {
                  trackListingFilter({
                    listing_id: "portfolio",
                    filter_type: "sort",
                    filter_value: e.target.value,
                  });
                  setSort(e.target.value as SortMode);
                }}
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
                {visible.map((study, i) => (
                  <ProjectCard
                    key={study.slug}
                    study={study}
                    index={pageStart + i}
                  />
                ))}
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
  );
}
