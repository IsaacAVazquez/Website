"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconSearch,
} from "@tabler/icons-react";
import { useTablistKeyboard } from "@/hooks/useTablistKeyboard";
import { useTrackedListingSearch } from "@/hooks/useTrackedListingSearch";
import { trackListingFilter } from "@/lib/analytics";
import { BLOG_TOPIC_PAGES } from "@/lib/blog-config";
import { publishedDateFormatter } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
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

const PAGE_SIZE = 15;

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

export function WritingInstrument({
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

  // Featured = first post in the filtered list, ledger = the rest. This makes
  // the featured block respond to chip clicks, search input, and sort changes.
  const featured = filtered[0];
  const archive = useMemo(() => filtered.slice(1), [filtered]);

  // Roving keyboard navigation across filter chips (WAI-ARIA tablist).
  const handleChipKeyDown = useTablistKeyboard(filterChips, (chip) =>
    setActiveFilter(chip.id),
  );

  const totalPages = Math.max(1, Math.ceil(archive.length / PAGE_SIZE));
  const visible = archive.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = archive.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, archive.length);

  const sinceLabel = useMemo(() => {
    if (!earliestDate) return "—";
    const d = new Date(earliestDate);
    if (Number.isNaN(d.getTime())) return earliestDate;
    return d
      .toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      .replace(" ", " '");
  }, [earliestDate]);

  return (
    <div className={styles.page}>
      {/* Masthead */}
      <section className={styles.masthead} aria-labelledby="wr-masthead-title">
        <div className={styles.shell}>
          <p className={styles.kicker}>Writing · essays and notes</p>
          <div className={styles.mastheadGrid}>
            <h1 id="wr-masthead-title" className={styles.mastheadTitle}>
              Notes on <em>product</em>, AI &amp; judgment.
            </h1>
            <div className={styles.sidecol}>
              <label className={styles.search} aria-label="Search posts">
                <IconSearch size={16} aria-hidden="true" />
                <input
                  type="search"
                  placeholder={`Search ${posts.length} posts`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className={styles.statStrip}>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Essays</span>
                  <span className={styles.statVal}>{totalEssays}</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Notes</span>
                  <span className={styles.statVal}>{totalNotes}</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLbl}>Since</span>
                  <span className={styles.statVal}>{sinceLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter band */}
      <div className={styles.filterBand}>
        <div className={styles.shell}>
          <div
            className={styles.filterRow}
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
                  className={`${styles.chip} ${isOn ? styles.chipOn : ""}`}
                >
                  <span>{chip.label}</span>
                  <span className={styles.chipNum}>{chip.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured */}
      {featured ? (
        <div className={styles.shell}>
          <section className={styles.featured} aria-labelledby="wr-feat-title">
            <div className={styles.featNumeral} aria-hidden="true">
              01
            </div>
            <div>
              <span className={styles.featKicker}>Most recent match</span>
              <div className={styles.featByline}>
                <span>{postKind(featured)}</span>
                <span aria-hidden="true">·</span>
                <span>{featured.readingTime}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {publishedDateFormatter.format(new Date(featured.publishedAt))}
                </span>
              </div>
              <h2 id="wr-feat-title" className={styles.featTitle}>
                {featured.title}
              </h2>
              <p className={styles.featDek}>{featured.excerpt}</p>
              <div className={styles.featActions}>
                <span className={styles.tag}>{categoryLabel(featured)}</span>
                <Link
                  className={styles.readLink}
                  href={`/writing/${featured.slug}`}
                >
                  Read full {postKind(featured).toLowerCase()}
                  <IconArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {/* Archive ledger */}
      <div className={styles.shell}>
        <section className={styles.archive} aria-labelledby="wr-archive-title">
          <div className={styles.archiveHead}>
            <div className={styles.archiveTitleWrap}>
              <h2 id="wr-archive-title" className={styles.archiveTitle}>
                The ledger
              </h2>
              <span className={styles.archiveCount}>
                Showing {showingFrom}–{showingTo} of {archive.length}
              </span>
            </div>
            <div className={styles.sortWrap}>
              <span className={styles.sortLbl}>Sort</span>
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
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>
                No articles match that filter yet.
              </p>
              <p className={styles.emptyBody}>
                Try a different category or clear the search. The archive grows
                weekly.
              </p>
            </div>
          ) : (
            <>
              <ul className={styles.archiveGrid}>
                {visible.map((post) => (
                  <li key={post.slug}>
                    <Link href={`/writing/${post.slug}`} className={styles.card}>
                      <div className={styles.cardMeta}>
                        <span>
                          {publishedDateFormatter.format(
                            new Date(post.publishedAt),
                          )}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{postKind(post)}</span>
                        <span aria-hidden="true">·</span>
                        <span className={styles.cardCategory}>
                          {categoryLabel(post)}
                        </span>
                      </div>
                      <h3 className={styles.cardTitle}>{post.title}</h3>
                      <p className={styles.cardExcerpt}>{post.excerpt}</p>
                      <div className={styles.cardFoot}>
                        <span className={styles.cardTime}>
                          <IconClock size={14} aria-hidden="true" />
                          {post.readingTime}
                        </span>
                        {post.tags && post.tags.length > 0 ? (
                          <div className={styles.cardTags}>
                            {post.tags.slice(0, 2).map((tag) => (
                              <Chip key={tag}>{tag}</Chip>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 ? (
                <nav className={styles.pager} aria-label="Article pagination">
                  <span className={styles.pageInfo}>
                    Page {page} of {totalPages}
                  </span>
                  <div className={styles.pages}>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <IconChevronLeft size={14} aria-hidden="true" />
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          className={n === page ? styles.pageOn : ""}
                          aria-current={n === page ? "page" : undefined}
                        >
                          {String(n).padStart(2, "0")}
                        </button>
                      ),
                    )}
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
            </>
          )}
        </section>
      </div>

      {/* Topics */}
      <section className={styles.topics} aria-labelledby="writing-topic-pages">
        <div className={styles.shell}>
          <span className={styles.topicsKicker}>Browse by topic</span>
          <h2 id="writing-topic-pages" className={styles.topicsTitle}>
            Follow one thread through the archive.
          </h2>
          <p className={styles.topicsDek}>
            Each topic page keeps the full set of related articles in one
            crawlable place, with the newest work first.
          </p>
          <div className={styles.topicsGrid}>
            {BLOG_TOPIC_PAGES.map((topic) => (
              <Link
                key={topic.slug}
                href={`/writing/topics/${topic.slug}`}
                className={styles.topicCell}
              >
                <span className={styles.topicLabel}>{topic.label}</span>
                <span className={styles.topicGo}>
                  Browse articles
                  <IconArrowRight size={13} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / RSS CTA */}
      <section className={styles.cta} aria-labelledby="wr-cta-title">
        <div className={styles.shell}>
          <div className={styles.ctaGrid}>
            <div>
              <span className={styles.ctaKicker}>The newsletter</span>
              <h2 id="wr-cta-title" className={styles.ctaTitle}>
                One essay a month, when it&rsquo;s <em>worth</em> sending.
              </h2>
              <p className={styles.ctaCopy}>
                No roundups, no SEO bait. Just the long-form work, the
                occasional memo template, and an honest note about what
                I&rsquo;m wrong about lately.
              </p>
            </div>
            {/* No managed-list yet — point readers at the RSS feed and the
                direct contact channel. Both are real, working, and don't
                pretend a newsletter pipeline exists where it doesn't. */}
            <div className={styles.ctaActions}>
              <a
                href="/api/rss"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaBtn}
              >
                Subscribe via RSS
                <IconArrowRight size={14} aria-hidden="true" />
              </a>
              <a
                href="mailto:IsaacVazquez@berkeley.edu?subject=Hello"
                className={`${styles.ctaBtn} ${styles.ctaBtnGhost}`}
              >
                Email me directly
                <IconArrowRight size={14} aria-hidden="true" />
              </a>
              <div className={styles.ctaMeta}>
                <span>{posts.length} posts</span>
                <span>Open RSS</span>
                <span>No managed list</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
