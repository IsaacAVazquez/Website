"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Slot } from "./Catalog97Primitives";
import type { BlogPostPreview } from "@/lib/blog";
import { BLOG_TOPIC_PAGES } from "@/lib/blog-config";

interface SectionSummary {
  id: string;
  label: string;
  description: string;
  count: number;
}

export interface Catalog97WritingProps {
  posts: BlogPostPreview[];
  clusters: SectionSummary[];
  buckets: SectionSummary[];
  totalEssays: number;
  totalNotes: number;
  earliestDate?: string;
}

const ALL = "all";
// Two length-based filters sit between the curated clusters and the topical
// archive buckets. They are derived from reading time rather than frontmatter,
// using the same five-minute cut the page uses for its totals.
const NOTES = "notes";
const ESSAYS = "essays";
type SortMode = "newest" | "shortest" | "longest";

/** The two flat fields the design alternates across the featured pair. */
const FEATURED_FIELDS = ["tobacco", "stone"] as const;

/**
 * The cover to lay over a featured field, or nothing.
 *
 * `coverImage` holds one of two things. Most posts point at a real photograph
 * under `/images/`, which is what the design wants in this position. The rest
 * point at `/writing/<slug>/opengraph-image`, the generated editorial card that
 * exists for posts too abstract to photograph. That card is built for link
 * unfurls at a fixed 1200x630 with type baked into it, so dropping it into a
 * 3:2 field would crop the type and read as a screenshot of a share preview
 * rather than as photography. Those keep the flat field the design specifies.
 */
function featuredCover(post: BlogPostPreview): string | undefined {
  return post.coverImage?.startsWith("/images/") ? post.coverImage : undefined;
}

function readingMinutes(readingTime: string): number {
  const match = readingTime.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/** "June 2026" — the dateline format the design uses on featured pieces. */
function monthYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The writing index, in the Catalog 97 language.
 *
 * The design draws two featured pieces on paper over flat image fields, a
 * tobacco line between them and the archive, and then the archive itself on
 * the tallest pine band in the system. That shape is kept exactly.
 *
 * What the design does not draw is a filter, because its mockup holds eight
 * pieces and this index holds closer to two hundred. The curated cluster,
 * length, and archive-bucket filter is kept, rendered in the design's own
 * filter-row treatment so nothing foreign is introduced.
 */
export function Catalog97Writing({
  posts,
  clusters,
  buckets,
  totalEssays,
  totalNotes,
  earliestDate,
}: Catalog97WritingProps) {
  /*
    The archive renders 30 rows and offers the rest behind one control.

    Unfiltered this index is 195 rows and rendered the route at 42,598px, about
    47 screens, with well over 90% of that height being the one list. The brief
    already treats the archive as unbounded and that is why it sits on Paper
    rather than Pine, but taking the field away from it does not make it
    shorter.

    Slicing rather than hiding with CSS is deliberate, because hiding leaves the
    height in place, which is the thing being fixed. Discovery does not depend
    on the rows being in the initial HTML, since every post is written into the
    sitemap by `scripts/generatePublicSitemap.mjs` at build time.
  */
  const archivePageSize = 30;
  const [active, setActive] = useState<string>(ALL);
  const [archiveLimit, setArchiveLimit] = useState(archivePageSize);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");

  const tabs = useMemo(
    () => [
      { id: ALL, label: "All", count: posts.length },
      ...clusters.map((c) => ({ id: c.id, label: c.label, count: c.count })),
      { id: NOTES, label: "Notes (short)", count: totalNotes },
      { id: ESSAYS, label: "Essays (long)", count: totalEssays },
      ...buckets.map((b) => ({ id: b.id, label: b.label, count: b.count })),
    ],
    [posts.length, clusters, buckets, totalNotes, totalEssays],
  );

  const filtered = useMemo(() => {
    let matches: BlogPostPreview[];
    if (active === ALL) {
      matches = posts;
    } else if (active === NOTES) {
      matches = posts.filter((post) => readingMinutes(post.readingTime) <= 5);
    } else if (active === ESSAYS) {
      matches = posts.filter((post) => readingMinutes(post.readingTime) > 5);
    } else {
      matches = posts.filter(
        (post) => post.cluster === active || post.archiveBucket === active,
      );
    }

    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      matches = matches.filter((post) => {
        const searchable = [
          post.title,
          post.excerpt,
          post.category,
          post.cluster ?? "",
          post.archiveBucket ?? "",
          ...post.tags,
        ]
          .join(" ")
          .toLowerCase();
        return tokens.every((token) => searchable.includes(token));
      });
    }

    return [...matches].sort((left, right) => {
      if (sort === "shortest") {
        return readingMinutes(left.readingTime) - readingMinutes(right.readingTime);
      }
      if (sort === "longest") {
        return readingMinutes(right.readingTime) - readingMinutes(left.readingTime);
      }
      return right.publishedAt.localeCompare(left.publishedAt);
    });
  }, [posts, active, query, sort]);

  const featured = filtered.slice(0, 2);
  const archive = filtered.slice(2);
  const visibleArchive = archive.slice(0, archiveLimit);
  const remainingArchive = archive.length - visibleArchive.length;

  return (
    <Catalog97Shell>
      {/* Hero */}
      <section
        className="c97-band"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-4)" }}
      >
        <div className="c97-shell">
          <p className="c97-kicker">Writing</p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
            Notes on product, measurement, and the tools I keep building.
          </h1>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
            {totalEssays} longer essays and {totalNotes} shorter notes
            {earliestDate ? `, going back to ${monthYear(earliestDate)}` : ""}.
            Long enough to be useful, and never a listicle.
          </p>
        </div>
      </section>

      {/* Filter row */}
      <section
        className="c97-band c97-band-continues"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-4)" }}
      >
        <div className="c97-shell" style={{ display: "grid", gap: "var(--c97-sp-3)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))",
              gap: "var(--c97-sp-2)",
              alignItems: "end",
            }}
          >
            <label style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
              <span className="c97-kicker">Search writing</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setArchiveLimit(archivePageSize);
                }}
                placeholder="Search writing"
                style={{
                  minHeight: 48,
                  width: "100%",
                  border: "1px solid var(--c97-rule)",
                  borderRadius: 0,
                  background: "var(--c97-surface)",
                  color: "var(--c97-ink)",
                  padding: "0 var(--c97-sp-2)",
                  font: "inherit",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
              <span className="c97-kicker">Sort writing</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortMode);
                  setArchiveLimit(archivePageSize);
                }}
                style={{
                  minHeight: 48,
                  width: "100%",
                  border: "1px solid var(--c97-rule)",
                  borderRadius: 0,
                  background: "var(--c97-surface)",
                  color: "var(--c97-ink)",
                  padding: "0 var(--c97-sp-2)",
                  font: "inherit",
                }}
              >
                <option value="newest">Newest first</option>
                <option value="shortest">Shortest first</option>
                <option value="longest">Longest first</option>
              </select>
            </label>
          </div>
          <div
            role="group"
            aria-label="Filter articles"
            /*
              Row gap sp-5, not sp-3. `.c97-microlink` hit boxes are 50px tall,
              and sp-3 clamps to 22px on a phone, which puts wrapped rows 39px
              apart and overlaps them. This list is the longest of the three
              filter rows, so it wraps at every width. Keep the two axes separate.
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
                  aria-pressed={selected}
                  onClick={() => {
                    setActive(tab.id);
                    // A new filter is a new list, so it starts at the first page.
                    setArchiveLimit(archivePageSize);
                  }}
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
        </div>
      </section>

      {/*
        Featured pair. This is the route's Pine moment rather than the archive
        below it: the featured set is bounded at two, so Pine stays a fixed
        share of the page, where an archive of ~200 posts on Pine turned the
        whole route into one green field.
      */}
      {featured.length > 0 ? (
        <section className="c97-band c97-band-tall" data-c97-surface="pine">
          <div
            className="c97-shell"
            style={{
              display: "grid",
              // min() so the 300px floor cannot exceed a narrower shell. At a
              // 320px viewport the shell is 249px and the bare floor pushed
              // this band to 328px, which was real horizontal scroll.
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%, 300px),1fr))",
              gap: "var(--c97-sp-5)",
            }}
          >
            {featured.map((post, index) => (
              <article key={post.slug}>
                <Catalog97Slot
                  surface={FEATURED_FIELDS[index % FEATURED_FIELDS.length]}
                  ratio="3 / 2"
                  src={featuredCover(post)}
                  alt={post.coverImageAlt ?? post.title}
                  sizes="(max-width: 790px) 100vw, 50vw"
                />
                <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-2)" }}>
                  Featured · {monthYear(post.publishedAt)}
                </p>
                {/*
                  --c97-fs-h2 rather than h3. The featured pair and the archive
                  rows were both drawing at --c97-fs-h3, so the two tiers of
                  this route were typographically identical and the whole
                  distinction rested on the image slot and the "Featured"
                  kicker. The band comment above says these two are the ones to
                  hand someone first, and now the type says so too. It also puts
                  every h2 on the route at one size, which is the same thing
                  /portfolio settled on.
                */}
                <h2
                  className="c97-serif c97-h2"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    color: "var(--c97-ink-2)",
                    maxWidth: "var(--c97-measure-tight)",
                  }}
                >
                  <Link
                    href={`/writing/${post.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    {post.title}
                  </Link>
                </h2>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    maxWidth: "var(--c97-measure-body)",
                  }}
                >
                  {post.excerpt}
                </p>
                <p className="c97-meta" style={{ marginTop: "var(--c97-sp-2)" }}>
                  <span className="c97-tabular">{post.readingTime}</span>
                  <span>{post.category}</span>
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Tobacco line. Nothing on this band is smaller than --c97-fs-h2. */}
      <section className="c97-band" data-c97-surface="tobacco">
        <div className="c97-shell">
          <p
            className="c97-serif c97-h2"
            style={{ maxWidth: "var(--c97-measure-tight)" }}
          >
            The two above are the ones I would hand someone first. The rest are
            below, newest at the top.
          </p>
        </div>
      </section>

      {/*
        Archive. Paper rather than Pine, because it is the one band on the site
        holding an unbounded list — at ~200 rows it is over 90% of the route's
        height, so whatever field it takes becomes the route.
      */}
      <section className="c97-band" data-c97-surface="paper">
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
              `c97-kicker` put this h2 at 11px directly above 26px h3 children.
              --c97-fs-h3 is not available as the fix, because the archive rows
              are already at that step and the header would land exactly on its
              own children. --c97-fs-h2 clears them at both ends of the clamp.
            */}
            <h2 className="c97-serif c97-h2">Archive</h2>
            <p className="c97-kicker c97-tabular">
              {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            </p>
          </div>

          {archive.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "var(--c97-sp-4)",
                marginTop: "var(--c97-sp-4)",
              }}
            >
              {visibleArchive.map((post) => (
                <article key={post.slug} className="c97-row c97-row-stack-sm">
                  <div>
                    <h3 className="c97-serif c97-h3">
                      <Link
                        href={`/writing/${post.slug}`}
                        style={{ textDecoration: "none" }}
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <p
                      className="c97-prose"
                      style={{
                        marginTop: "var(--c97-sp-1)",
                        color: "var(--c97-ink-2)",
                      }}
                    >
                      {post.excerpt}
                    </p>
                  </div>
                  <p className="c97-meta">
                    <span className="c97-tabular">{post.readingTime}</span>
                    <span>{post.category}</span>
                  </p>
                </article>
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
              {filtered.length === 0
                ? "No writing matches that search."
                : "Everything under this filter is already above."}
            </p>
          )}

          {/*
            Drawn as the same `c97-microlink` button the filter row above uses,
            so the one control that reveals rows matches the controls that
            reduce them. The count opposite the "Archive" heading keeps
            reporting the real total, so the number here is what is still
            folded away rather than a second, different total.
          */}
          {remainingArchive > 0 ? (
            <button
              type="button"
              className="c97-microlink"
              onClick={() => setArchiveLimit(archive.length)}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "baseline",
                gap: "var(--c97-sp-1)",
                marginTop: "var(--c97-sp-5)",
                color: "var(--c97-ink)",
              }}
            >
              <span>Show the rest of the archive</span>
              <span className="c97-tabular">{remainingArchive}</span>
            </button>
          ) : null}
        </div>
      </section>

      <section className="c97-band" data-c97-surface="bone">
        <div className="c97-shell">
          <p className="c97-kicker">Browse by topic</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Follow one thread through the archive.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))",
              columnGap: "var(--c97-sp-5)",
              rowGap: "var(--c97-sp-2)",
              marginTop: "var(--c97-sp-4)",
            }}
          >
            {BLOG_TOPIC_PAGES.map((topic) => (
              <Link
                key={topic.slug}
                href={`/writing/topics/${topic.slug}`}
                className="c97-row c97-microlink"
                style={{ color: "var(--c97-ink)" }}
              >
                <span>{topic.label}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="c97-band c97-band-tall" data-c97-surface="camel">
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
            style={{ maxWidth: "var(--c97-measure-body)" }}
          >
            Everything here is tagged by what it is actually about, not by
            keyword.
          </p>
          <Link className="c97-btn c97-btn-invert" href="/contact">
            Get in touch
          </Link>
        </div>
      </section>
    </Catalog97Shell>
  );
}
