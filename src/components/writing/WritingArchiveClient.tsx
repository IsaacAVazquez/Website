"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { publishedDateFormatter } from "@/lib/utils";
import { Article, FileText, Mail } from "@/components/ui/ServerIcons";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

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

function pickCoverVariant(post: WritingArchivePost, index: number): "acid" | "haze" | "ink" | null {
  // Sprinkle image-led card variants every ~5th card so the grid breathes,
  // matching the design's visual breakpoints.
  if (post.coverImage) return null;
  if (index % 5 === 1) return "acid";
  if (index % 5 === 3) return "haze";
  if (index % 11 === 7) return "ink";
  return null;
}

export function WritingArchiveClient({
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset pagination cursor when filter or sort changes
    setPage(1);
  }, [activeFilter, sort]);

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
  }, [posts, filterChips, activeFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filtered.length);

  // Featured row uses the first three posts (most recent) — big + 2 stacked.
  const [featBig, featSmallA, featSmallB] = posts;

  const sinceLabel = useMemo(() => {
    if (!earliestDate) return "—";
    const d = new Date(earliestDate);
    if (Number.isNaN(d.getTime())) return earliestDate;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }, [earliestDate]);

  // "Archive at a glance" dashboard panel — sits between the page head and the
  // featured row. Mirrors the homepage "Practice at a glance" pattern from the
  // investments dashboard idiom.
  const totalPieces = posts.length;
  const longestRead = useMemo(() => {
    return posts.reduce(
      (acc, p) => Math.max(acc, readingMinutes(p.readingTime) || 0),
      0,
    );
  }, [posts]);
  const latestPost = posts[0];
  const latestCategory = latestPost
    ? latestPost.cluster ?? latestPost.archiveBucket ?? latestPost.category
    : undefined;
  const latestPostDate = latestPost
    ? publishedDateFormatter.format(new Date(latestPost.publishedAt))
    : undefined;
  const totalCategories = clusters.length;

  const archiveCells: HomeStatsCell[] = [
    {
      label: "Essays",
      tooltip: "Long-form pieces (over 5 min reading time)",
      value: totalEssays,
      sub: "Long-form, deep focus",
    },
    {
      label: "Notes",
      tooltip: "Shorter pieces under 5 minutes",
      value: totalNotes,
      sub: "Quick takes and field notes",
    },
    {
      label: "Total pieces",
      tooltip: "Everything published in the archive",
      value: totalPieces,
      sub: `Since ${sinceLabel}`,
    },
    {
      label: "Topics",
      tooltip: "Curated clusters across the archive",
      value: totalCategories,
      sub: `${clusters
        .slice(0, 3)
        .map((c) => c.label)
        .join(" · ")}${totalCategories > 3 ? " · …" : ""}`,
    },
    {
      label: "Most recent",
      tooltip: "Last published essay or note",
      value: latestPost ? latestPost.title : "Coming soon",
      sub: latestPostDate,
    },
    {
      label: "Latest topic",
      tooltip: "Cluster of the most recent piece",
      value: latestCategory ?? "—",
      sub: latestPost ? `${postKind(latestPost)} · ${latestPost.readingTime}` : undefined,
    },
    {
      label: "Longest read",
      tooltip: "The longest essay currently in the archive",
      value: longestRead ? `${longestRead} min` : "—",
      sub: "Deep dive territory",
    },
    {
      label: "Practice age",
      tooltip: "How long this writing practice has been running",
      value: sinceLabel,
      sub: "Continuously published",
    },
  ];

  return (
    <div className="wp-page">
      <section className="wp-pagehead">
        <div>
          <p className="wp-pagehead-kicker">The archive</p>
          <h1 className="wp-pagehead-title">
            Writing on <em>product</em>, AI, and judgment.
          </h1>
        </div>
        <div className="wp-pagehead-stats">
          <div>
            <span className="wp-stat-label">Essays</span>
            <span className="wp-stat-value">{totalEssays}</span>
          </div>
          <div>
            <span className="wp-stat-label">Notes</span>
            <span className="wp-stat-value">{totalNotes}</span>
          </div>
          <div>
            <span className="wp-stat-label">Since</span>
            <span className="wp-stat-value">{sinceLabel}</span>
          </div>
        </div>
      </section>

      <div className="wp-archive-stats-wrap">
        <HomeStatsPanel
          id="archive-stats"
          title="Archive at a glance"
          meta={latestPostDate ? `Last shipped ${latestPostDate}` : "Updated weekly"}
          cells={archiveCells}
          pills={[
            { label: "All articles", href: "#article-grid", icon: Article },
            { label: "Newsletter", href: "/contact", icon: Mail },
            { label: "RSS feed", href: "/api/rss", icon: FileText, external: true },
          ]}
        />
      </div>

      {featBig ? (
        <section className="wp-featured">
          <Link href={`/writing/${featBig.slug}`} className="wp-feat-big group">
            <div className="wp-feat-topline">
              <span className="wp-feat-pill">Most recent</span>
              <span className="wp-feat-meta">
                {postKind(featBig)} · {featBig.readingTime}
              </span>
            </div>
            <h2 className="wp-feat-big-title">{featBig.title}</h2>
            <p className="wp-feat-dek">{featBig.excerpt}</p>
            <div className="wp-feat-footrow">
              <div className="wp-feat-byline">
                <div className="wp-feat-avatar" aria-hidden="true">IV</div>
                <span>
                  <span className="wp-feat-byline-name">Isaac Vazquez</span>
                  {" · "}
                  {publishedDateFormatter.format(new Date(featBig.publishedAt))}
                </span>
              </div>
              <span className="wp-feat-readlink">
                Read essay <IconArrowRight size={14} aria-hidden="true" />
              </span>
            </div>
          </Link>

          <div className="wp-feat-stack">
            {featSmallA ? (
              <Link
                href={`/writing/${featSmallA.slug}`}
                className="wp-feat-small wp-feat-small--dark"
              >
                <div className="wp-feat-topline">
                  <span className="wp-feat-pill">New · this week</span>
                  <span className="wp-feat-meta wp-feat-meta--dark">
                    {postKind(featSmallA)} · {featSmallA.readingTime}
                  </span>
                </div>
                <h3 className="wp-feat-small-title">{featSmallA.title}</h3>
                <div className="wp-feat-small-footrow wp-feat-small-footrow--dark">
                  <span>{publishedDateFormatter.format(new Date(featSmallA.publishedAt))}</span>
                  <span className="wp-feat-small-readlink">
                    Read {postKind(featSmallA).toLowerCase()} <IconArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ) : null}
            {featSmallB ? (
              <Link href={`/writing/${featSmallB.slug}`} className="wp-feat-small">
                <div className="wp-feat-topline">
                  <span className="wp-feat-pill wp-feat-pill--editor">Editor's pick</span>
                  <span className="wp-feat-meta">
                    {postKind(featSmallB)} · {featSmallB.readingTime}
                  </span>
                </div>
                <h3 className="wp-feat-small-title">{featSmallB.title}</h3>
                <div className="wp-feat-small-footrow">
                  <span>{publishedDateFormatter.format(new Date(featSmallB.publishedAt))}</span>
                  <span className="wp-feat-small-readlink">
                    Read {postKind(featSmallB).toLowerCase()} <IconArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="wp-archive-section" id="article-grid">
        <div className="wp-archive-head">
          <h2 className="wp-archive-title">All articles</h2>
          <span className="wp-archive-count">
            Showing {showingFrom}–{showingTo} of {filtered.length}
          </span>
        </div>

        <div className="wp-filter-row" role="tablist" aria-label="Filter articles">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`wp-chip ${activeFilter === chip.id ? "wp-chip--on" : ""}`}
            >
              {chip.label}
              <span className="wp-chip-count">{chip.count}</span>
            </button>
          ))}
          <span className="wp-sort">
            <span className="wp-sort-label">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              aria-label="Sort articles"
            >
              <option value="newest">Newest first</option>
              <option value="shortest">Shortest first</option>
              <option value="longest">Longest first</option>
            </select>
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="wp-empty">
            <p className="wp-empty-title">No articles match that filter yet.</p>
            <p className="wp-empty-body">
              Try a different category or check back later — the archive grows weekly.
            </p>
          </div>
        ) : (
          <ul className="wp-grid">
            {visible.map((post, i) => {
              const coverVariant = pickCoverVariant(post, i);
              const cardClass = coverVariant
                ? `wp-card wp-card--has-image wp-card--var-${coverVariant}`
                : "wp-card";
              return (
                <li key={post.slug}>
                  <Link href={`/writing/${post.slug}`} className={cardClass}>
                    {coverVariant ? (
                      <div className="wp-card-img">
                        <span className="wp-card-img-pill">{postKind(post)}</span>
                      </div>
                    ) : null}
                    <div className={coverVariant ? "wp-card-body" : "wp-card-body wp-card-body--noimg"}>
                      <div className="wp-card-topline">
                        <span className="wp-card-cat">{postKind(post)}</span>
                        <span className="wp-card-dot" aria-hidden="true" />
                        <span>{post.readingTime}</span>
                        <span className="wp-card-dot" aria-hidden="true" />
                        <span>{publishedDateFormatter.format(new Date(post.publishedAt))}</span>
                      </div>
                      <h3 className="wp-card-title">{post.title}</h3>
                      <p className="wp-card-dek">{post.excerpt}</p>
                      <div className="wp-card-footrow">
                        <span>{categoryLabel(post)}</span>
                        <span className="wp-card-readlink">
                          Read <IconArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav className="wp-pager" aria-label="Article pagination">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="wp-pager-btn"
            >
              <IconChevronLeft size={14} aria-hidden="true" />
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`wp-pager-btn ${n === page ? "wp-pager-btn--on" : ""}`}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="wp-pager-btn"
            >
              Next
              <IconChevronRight size={14} aria-hidden="true" />
            </button>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
