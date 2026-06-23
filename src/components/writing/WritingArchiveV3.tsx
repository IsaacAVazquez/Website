"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";
import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";
import { useTrackedListingSearch } from "@/hooks/useTrackedListingSearch";
import { trackListingFilter } from "@/lib/analytics";
import { BLOG_TOPIC_PAGES } from "@/lib/blog-config";
import { publishedDateFormatter } from "@/lib/utils";
import styles from "@/app/writing/writing.module.css";

export interface WritingArchivePost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: string;
  category: string;
  cluster?: string;
  archiveBucket?: string;
  coverImage?: string;
  tags?: string[];
}

interface FilterChip {
  id: string;
  label: string;
  count: number;
  match?: (post: WritingArchivePost) => boolean;
}

interface Props {
  posts: WritingArchivePost[];
  clusters: { id: string; label: string; description?: string; count: number }[];
  buckets: { id: string; label: string; description?: string; count: number }[];
  totalEssays: number;
  totalNotes: number;
  earliestDate?: string;
}

const PAGE_SIZE = 12;
const COVER_VARIANTS = [
  "wr-cov-aurora",
  "wr-cov-portrait",
  "wr-cov-machine",
  "wr-cov-acid",
  "wr-cov-paper",
  "wr-cov-dark",
] as const;

function readingMinutes(rt: string): number {
  const m = rt.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function isNote(post: WritingArchivePost): boolean {
  return readingMinutes(post.readingTime) <= 5;
}

function categoryLabel(post: WritingArchivePost): string {
  return post.cluster ?? post.archiveBucket ?? post.category ?? "Other";
}

function postKind(post: WritingArchivePost): "Note" | "Essay" {
  return isNote(post) ? "Note" : "Essay";
}

function toneClassFor(post: WritingArchivePost): string {
  const tag = categoryLabel(post).toLowerCase();
  if (tag.includes("pm") || tag.includes("product")) return styles["wr-tag-acid"];
  if (tag.includes("ai") || tag.includes("agent")) return styles["wr-tag-haze"];
  if (tag.includes("fintech") || tag.includes("invest")) return styles["wr-tag-outline"];
  if (tag.includes("system") || tag.includes("quality")) return styles["wr-tag-paper"];
  return styles["wr-tag-outline"];
}

export function WritingArchiveV3({
  posts,
  clusters,
  buckets,
  totalEssays,
  totalNotes,
  earliestDate,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "shortest" | "longest">("newest");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset pagination when filters/sort/query change
    setPage(1);
  }, [activeFilter, sort, query]);

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [
      { id: "all", label: "All", count: posts.length },
    ];
    clusters.forEach((c) =>
      chips.push({
        id: `cluster:${c.id}`,
        label: c.label,
        count: c.count,
        match: (p) => p.cluster === c.id,
      }),
    );
    if (totalNotes > 0) {
      chips.push({
        id: "kind:notes",
        label: "Notes (short)",
        count: totalNotes,
        match: (p) => isNote(p),
      });
    }
    if (totalEssays > 0) {
      chips.push({
        id: "kind:essays",
        label: "Essays (long)",
        count: totalEssays,
        match: (p) => !isNote(p),
      });
    }
    buckets.forEach((b) =>
      chips.push({
        id: `bucket:${b.id}`,
        label: b.label,
        count: b.count,
        match: (p) => p.archiveBucket === b.id,
      }),
    );
    return chips.filter((c) => c.count > 0);
  }, [posts.length, clusters, buckets, totalEssays, totalNotes]);

  const filtered = useMemo(() => {
    const chip = filterChips.find((c) => c.id === activeFilter);
    let list = chip?.match ? posts.filter(chip.match) : posts;
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.excerpt.toLowerCase().includes(needle) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(needle)),
      );
    }
    if (sort === "shortest") {
      list = [...list].sort(
        (a, b) => readingMinutes(a.readingTime) - readingMinutes(b.readingTime),
      );
    } else if (sort === "longest") {
      list = [...list].sort(
        (a, b) => readingMinutes(b.readingTime) - readingMinutes(a.readingTime),
      );
    }
    return list;
  }, [posts, filterChips, activeFilter, sort, query]);

  // Report completed searches to GA4 (no-op unless analytics is enabled).
  useTrackedListingSearch("writing_archive", query, filtered.length);

  // Featured = first post in the filtered list, archive = the rest. This
  // makes the featured card respond to chip clicks, search input, and sort
  // changes — previously it stayed locked on posts[0] regardless of filter.
  const featured = filtered[0];
  const archive = useMemo(() => filtered.slice(1), [filtered]);

  // Roving keyboard navigation across filter chips (WAI-ARIA tablist).
  // ←/→ wrap, Home/End jump, Enter/Space activate. Only the active tab is
  // in the tab order so screen readers don't get N stops on one tablist.
  const handleChipKeyDown = useTablistKeyboard(filterChips, (chip) =>
    setActiveFilter(chip.id),
  );

  const totalPages = Math.max(1, Math.ceil(archive.length / PAGE_SIZE));
  const visible = archive.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = archive.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, archive.length);
  const pageStart = (page - 1) * PAGE_SIZE;

  const sinceLabel = useMemo(() => {
    if (!earliestDate) return "—";
    const d = new Date(earliestDate);
    if (Number.isNaN(d.getTime())) return earliestDate;
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", " '");
  }, [earliestDate]);

  const yearLabel = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  // Marquee items — derived from real posts so they don't drift from reality.
  const marqueeItems = useMemo(() => {
    const items: string[] = [];
    if (featured) items.push(`Latest: ${featured.title}`);
    items.push(`Vol. ${Math.max(1, new Date().getFullYear() - 2019)}`);
    items.push(`${posts.length} essays + notes`);
    items.push(`Since ${sinceLabel}`);
    if (clusters[0]) items.push(`Lead cluster: ${clusters[0].label}`);
    if (buckets[0]) items.push(`Archive: ${buckets[0].label}`);
    return items;
  }, [featured, posts.length, sinceLabel, clusters, buckets]);

  // Spotlight cadence — one spotlight per 6-card window, anchored at slot 1.
  // Within each window we slide to the nearest essay so the signature ink card
  // lands on substantial content; if the window is all notes we still spotlight
  // the anchor so the cadence (and the card) never silently disappears.
  const spotlightSlots = useMemo(() => {
    const picks = new Set<number>();
    for (let anchor = 1; anchor < visible.length; anchor += 6) {
      const windowEnd = Math.min(anchor + 6, visible.length);
      let chosen = -1;
      for (let j = anchor; j < windowEnd; j++) {
        if (!picks.has(j) && !isNote(visible[j])) {
          chosen = j;
          break;
        }
      }
      if (chosen === -1) chosen = anchor;
      picks.add(chosen);
    }
    return picks;
  }, [visible]);

  return (
    <div className={styles["wr-page"]}>
      {/* Masthead */}
      <section className={styles["wr-masthead"]} aria-labelledby="wr-masthead-title">
        <div className={styles["wr-shell"]}>
          <div className={styles["wr-kicker-row"]}>
            <span className={styles["wr-dept"]}>Dept. 03</span>
            <span>The Writing Desk</span>
            <span>—</span>
            <span>Vol. {Math.max(1, yearLabel - 2019)}, {yearLabel}</span>
          </div>
          <div className={styles["wr-masthead-grid"]}>
            <h1 id="wr-masthead-title">
              Notes on <em>product</em>, AI &amp; judgment.
            </h1>
            <div className={styles["wr-sidecol"]}>
              <label className={styles["wr-search"]} aria-label="Search posts">
                <IconSearch size={16} aria-hidden="true" />
                <input
                  type="search"
                  placeholder={`Search ${posts.length} posts`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className={styles["wr-stat-strip"]}>
                <div>
                  <span className={styles["wr-stat-lbl"]}>Essays</span>
                  <span className={styles["wr-stat-val"]}>{totalEssays}</span>
                </div>
                <div>
                  <span className={styles["wr-stat-lbl"]}>Notes</span>
                  <span className={styles["wr-stat-val"]}>{totalNotes}</span>
                </div>
                <div>
                  <span className={styles["wr-stat-lbl"]}>Since</span>
                  <span className={styles["wr-stat-val"]}>{sinceLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter band */}
      <div className={styles["wr-filter-band"]}>
        <div className={styles["wr-shell"]}>
          <div
            className={styles["wr-filter-row"]}
            role="tablist"
            aria-label="Filter articles"
          >
            {filterChips.map((chip, index) => {
              const isOn = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  role="tab"
                  aria-selected={isOn}
                  tabIndex={isOn ? 0 : -1}
                  onClick={() => {
                    trackListingFilter({
                      listing_id: "writing_archive",
                      filter_type: "topic",
                      filter_value: chip.id,
                    });
                    setActiveFilter(chip.id);
                  }}
                  onKeyDown={(e) => handleChipKeyDown(e, index)}
                  className={`${styles["wr-chip"]} ${isOn ? styles["wr-chip-on"] : ""}`}
                >
                  <span>{chip.label}</span>
                  <span className={styles["wr-chip-num"]}>{chip.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        {featured ? (
          <div className={styles["wr-shell"]}>
            <section className={styles["wr-featured"]} aria-labelledby="wr-feat-title">
              <div className={styles["wr-feat-numeral"]}>01</div>
              <div className={styles["wr-feat-body"]}>
                <div className={styles["wr-feat-byline"]}>
                  <span>{postKind(featured)}</span>
                  <span className={styles["wr-dot"]} aria-hidden="true" />
                  <span>{featured.readingTime}</span>
                  <span className={styles["wr-dot"]} aria-hidden="true" />
                  <span>
                    {publishedDateFormatter.format(new Date(featured.publishedAt))}
                  </span>
                </div>
                <h2 id="wr-feat-title" className={styles["wr-feat-title"]}>
                  {featured.title}
                </h2>
                <p className={styles["wr-feat-dek"]}>{featured.excerpt}</p>
                <div className={styles["wr-feat-actions"]}>
                  <span className={`${styles["wr-tag"]} ${toneClassFor(featured)}`}>
                    {categoryLabel(featured)}
                  </span>
                  <span className={`${styles["wr-tag"]} ${styles["wr-tag-outline"]}`}>
                    Most recent
                  </span>
                  <Link
                    className={styles["wr-read-link"]}
                    href={`/writing/${featured.slug}`}
                  >
                    Read full {postKind(featured).toLowerCase()}
                    <IconArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <Link
                className={styles["wr-feat-img"]}
                href={`/writing/${featured.slug}`}
                aria-label={`Featured cover for ${featured.title}`}
              >
                <div className={styles["wr-feat-img-inner"]} />
                <div className={styles["wr-feat-img-meta"]}>
                  <span>Cover &middot; 01</span>
                  <span className={styles["wr-corner"]}>&#8599;</span>
                </div>
              </Link>
            </section>
          </div>
        ) : null}

        {/* Marquee band */}
        <div className={styles["wr-band"]} aria-hidden="true">
          <div className={styles["wr-band-inner"]}>
            <div className={styles["wr-marquee"]}>
              {marqueeItems.map((item, i) => (
                <span key={`m1-${i}`}>{item}</span>
              ))}
              {marqueeItems.map((item, i) => (
                <span key={`m2-${i}`}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles["wr-shell"]}>
          <section
            className={styles["wr-archive"]}
            aria-labelledby="wr-archive-title"
          >
            <div className={styles["wr-archive-head"]}>
              <div className={styles["wr-archive-head-left"]}>
                <h2 id="wr-archive-title">
                  All <em>articles</em>
                </h2>
                <span className={styles["wr-archive-count"]}>
                  Showing {showingFrom}&ndash;{showingTo} of {archive.length}
                </span>
              </div>
              <div className={styles["wr-archive-head-right"]}>
                <span>Sort</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    trackListingFilter({
                      listing_id: "writing_archive",
                      filter_type: "sort",
                      filter_value: e.target.value,
                    });
                    setSort(e.target.value as typeof sort);
                  }}
                  aria-label="Sort articles"
                >
                  <option value="newest">Newest first</option>
                  <option value="shortest">Shortest first</option>
                  <option value="longest">Longest first</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className={styles["wr-empty"]}>
                <p className={styles["wr-empty-title"]}>
                  No articles match that filter yet.
                </p>
                <p className={styles["wr-empty-body"]}>
                  Try a different category or clear the search &mdash; the archive grows weekly.
                </p>
              </div>
            ) : (
              <ul className={styles["wr-grid"]}>
                {visible.map((post, i) => {
                  const idx = pageStart + i;
                  const cover = COVER_VARIANTS[idx % COVER_VARIANTS.length];
                  const id = String(idx + 2).padStart(2, "0"); // featured = 01
                  const tone = toneClassFor(post);
                  const spotlight = spotlightSlots.has(i);

                  if (spotlight) {
                    const spotTone =
                      tone === styles["wr-tag-paper"] || tone === styles["wr-tag-outline"]
                        ? styles["wr-tag-acid"]
                        : tone;
                    return (
                      <li key={post.slug}>
                        <Link
                          href={`/writing/${post.slug}`}
                          className={`${styles["wr-card"]} ${styles["wr-card-spotlight"]}`}
                        >
                          <div>
                            <div className={styles["wr-spot-kicker"]}>
                              No. {id} &middot; Spotlight
                            </div>
                            <span className={styles["wr-spot-num"]}>{id}</span>
                          </div>
                          <div className={styles["wr-spot-body"]}>
                            <div>
                              <div
                                className={styles["wr-meta-mono"]}
                                style={{ marginBottom: 12 }}
                              >
                                {postKind(post)} &middot; {post.readingTime} &middot;{" "}
                                {publishedDateFormatter.format(new Date(post.publishedAt))}
                              </div>
                              <h3>{post.title}</h3>
                            </div>
                            <div className={styles["wr-card-footrow"]}>
                              <span className={`${styles["wr-tag"]} ${spotTone}`}>
                                {categoryLabel(post)}
                              </span>
                              <span className={styles["wr-read-link"]}>
                                Read <IconArrowRight size={14} aria-hidden="true" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={post.slug}>
                      <Link
                        href={`/writing/${post.slug}`}
                        className={`${styles["wr-card"]} ${styles[cover]}`}
                      >
                        <div className={styles["wr-card-num"]}>
                          <span className={styles["wr-id"]}>&#8470; {id}</span>
                          <span>{postKind(post)}</span>
                        </div>
                        <div className={styles["wr-card-img"]} aria-hidden="true" />
                        <h3>{post.title}</h3>
                        <div className={styles["wr-card-footrow"]}>
                          <span className={`${styles["wr-tag"]} ${tone}`}>
                            {categoryLabel(post)}
                          </span>
                          <span className={styles["wr-meta-mono"]}>
                            {publishedDateFormatter.format(new Date(post.publishedAt))}{" "}
                            &middot; {readingMinutes(post.readingTime)}min
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {totalPages > 1 ? (
              <nav className={styles["wr-pager"]} aria-label="Article pagination">
                <span className={styles["wr-pageinfo"]}>
                  Page {page} of {totalPages}
                </span>
                <div className={styles["wr-pager-pages"]}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <IconChevronLeft size={14} aria-hidden="true" />
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={n === page ? styles["wr-pager-on"] : ""}
                      aria-current={n === page ? "page" : undefined}
                    >
                      {String(n).padStart(2, "0")}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <IconChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </nav>
            ) : null}
          </section>
        </div>

        <section
          className="border-t border-[var(--home-rule)] bg-[var(--home-paper-alt)] py-12"
          aria-labelledby="writing-topic-pages"
        >
          <div className={styles["wr-shell"]}>
            <p className="home-kicker mb-3">Browse by topic</p>
            <h2
              id="writing-topic-pages"
              className="mb-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--home-ink)]"
            >
              Follow one thread through the archive.
            </h2>
            <p className="home-body mb-7 max-w-3xl">
              Each topic page keeps the full set of related articles in one
              crawlable place, with the newest work first.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BLOG_TOPIC_PAGES.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/writing/topics/${topic.slug}`}
                  className="home-card group flex min-h-[120px] flex-col justify-between p-5"
                >
                  <span className="text-lg font-semibold tracking-[-0.025em] text-[var(--home-ink)]">
                    {topic.label}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--home-haze)]">
                    Browse articles
                    <IconArrowRight
                      size={14}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className={styles["wr-cta"]} aria-labelledby="wr-cta-title">
          <div className={styles["wr-shell"]}>
            <div className={styles["wr-cta-grid"]}>
              <div>
                <span className={styles["wr-cta-kicker"]}>
                  The Newsletter &middot; Vol. {Math.max(1, yearLabel - 2019)}
                </span>
                <h2 id="wr-cta-title">
                  One essay a month &mdash; when it&rsquo;s <em>worth</em> sending.
                </h2>
                <p>
                  No roundups, no SEO bait. Just the long-form work, the occasional
                  memo template, and an honest note about what I&rsquo;m wrong about
                  lately.
                </p>
              </div>
              {/* No managed-list yet — point readers at the RSS feed and the
                  direct contact channel. Both are real, working, and don't
                  pretend a newsletter pipeline exists where it doesn't. */}
              <div className={styles["wr-cta-form"]}>
                <div className={styles["wr-cta-form-row"]}>
                  <a
                    href="/api/rss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles["wr-cta-form-link"]}
                  >
                    Subscribe via RSS
                    <IconArrowRight size={14} aria-hidden="true" />
                  </a>
                  <a
                    href="mailto:IsaacVazquez@berkeley.edu?subject=Hello"
                    className={styles["wr-cta-form-link"]}
                  >
                    Email me directly
                    <IconArrowRight size={14} aria-hidden="true" />
                  </a>
                </div>
                <div className={styles["wr-cta-form-meta"]}>
                  <span>
                    <span className={styles["wr-stat-num"]}>{posts.length}</span> Posts
                  </span>
                  <span>Open RSS</span>
                  <span>No managed list</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
