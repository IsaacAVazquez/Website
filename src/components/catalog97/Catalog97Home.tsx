import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Plate, Catalog97Slot } from "./Catalog97Primitives";
import {
  getProjectCardSummary,
  type CaseStudyData,
} from "@/constants/caseStudies";
import type { LiveToolGroup } from "@/constants/toolCategories";
import type { BlogPostPreview } from "@/lib/blog";
import type { HomeLiveFeedData } from "@/components/home/HomeLiveFeed";

export interface Catalog97HomeProps {
  featuredProjects: CaseStudyData[];
  recentPosts: BlogPostPreview[];
  heroIndex: {
    projectCount: number;
    essayCount: number;
    liveToolCount: number;
  };
  liveToolGroups: LiveToolGroup[];
  liveFeed: HomeLiveFeedData;
}

/**
 * Home, in the Catalog 97 language.
 *
 * The longest of the seven routes, per the design, and the one that carries
 * the full sequence of Anton plate numerals from 01 through 05. Band order is
 * paper, pine, chocolate, bone, tobacco, which holds the two rules that govern
 * every route here: at least two full-width brown bands, and never two pine
 * bands back to back. Selected work took Pine over the dashboards table
 * because it is the heavier of the two, and the route needed the weight.
 *
 * The hero carries the 35mm photograph the design puts there, over the tobacco
 * field rather than instead of it, so the band keeps its color while the image
 * decodes. The design's own HomePage source names this exact asset
 * (`public/images/headshot-home.webp`) in that position.
 */
export function Catalog97Home({
  featuredProjects,
  recentPosts,
  heroIndex,
  liveToolGroups,
  liveFeed,
}: Catalog97HomeProps) {
  // Flattened across groups so the dashboards table shows breadth rather than
  // four rows of the same category.
  const dashboardTools = liveToolGroups.flatMap((group) =>
    group.tools.map((tool) => ({ ...tool, groupLabel: group.label })),
  );

  const [leadPost, ...followingPosts] = recentPosts;

  return (
    <Catalog97Shell>
      {/* 01 — Hero */}
      <section
        className="c97-band"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-6)" }}
      >
        {/*
          The pitch and the field sit side by side above roughly 790px and stack
          below it, and the pitch is first in the DOM either way.

          They were one centered column before, with the field between the
          kicker and the h1. Measured at 1440x900, that put the h1 1207px down
          the page, so the whole first screen was the plate, one 11px kicker,
          and 775px of flat tobacco, which is 86% of the viewport, while the
          headline, the paragraph and both buttons sat below the fold. At 390
          the headline started at 775px in an 844px screen, which is the same
          defect. The field itself is not the problem and keeps its position and
          proportions. What was wrong is that a route in Persuade mode led with
          it and buried the argument underneath it.
        */}
        <div
          className="c97-shell"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "var(--c97-sp-5)",
            alignItems: "start",
          }}
        >
          <div>
            <Catalog97Plate value="01" />
            <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-2)" }}>
              Portfolio · Product and analytics
            </p>

            <div
              className="c97-hairline"
              style={{ marginTop: "var(--c97-sp-4)" }}
            />
            <h1
              className="c97-display"
              style={{
                marginTop: "var(--c97-sp-3)",
                lineHeight: "var(--c97-lh-display)",
                textWrap: "balance",
              }}
            >
              I build tools that make hard problems easier to act on.
            </h1>
            <div
              className="c97-hairline"
              style={{
                width: "min(100%,448px)",
                marginTop: "var(--c97-sp-3)",
              }}
            />

            <p
              className="c97-prose"
              style={{
                marginTop: "var(--c97-sp-4)",
                maxWidth: "var(--c97-measure-body)",
              }}
            >
              Product manager and builder, Berkeley Haas MBA &rsquo;27. What
              you&rsquo;re looking at is a survey of the work, and all{" "}
              {heroIndex.liveToolCount} tools in it are live in production right
              now, running on real data that refreshes itself.
            </p>

            <div
              style={{
                display: "flex",
                gap: "var(--c97-sp-2)",
                marginTop: "var(--c97-sp-3)",
                flexWrap: "wrap",
              }}
            >
              <Link className="c97-btn" href="/portfolio">
                See the work
              </Link>
              <Link className="c97-btn-ghost" href="/contact">
                Start a conversation
              </Link>
            </div>
          </div>

          {/*
            The caption goes through the slot's own `caption` prop, which is
            what sets it under the field in the label step. It used to render as
            a loose sibling below the h1, where it split the headline from the
            paragraph that supports it and read as a third piece of the pitch
            rather than as a note about the picture.
          */}
          <Catalog97Slot
            surface="tobacco"
            ratio="4 / 5"
            src="/images/headshot-home.webp"
            alt="Isaac Vazquez"
            priority
            caption="One dominant image per view · warm 35mm, natural light, a little grain"
          />
        </div>
      </section>

      {/* 02 — Selected work */}
      <section className="c97-band c97-band-tall" data-c97-surface="pine">
        <div
          className="c97-shell"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--c97-sp-5)",
          }}
        >
          <div style={{ flex: "0 1 190px" }}>
            <Catalog97Plate value="02" />
            <h2
              className="c97-serif c97-h2"
              style={{
                marginTop: "var(--c97-sp-2)",
                color: "var(--c97-ink)",
              }}
            >
              Selected work
            </h2>
            <Link
              href="/portfolio"
              className="c97-sectionlink"
              style={{ marginTop: "var(--c97-sp-1)" }}
            >
              All {heroIndex.projectCount} projects
            </Link>
          </div>

          <div
            style={{
              flex: "1 1 460px",
              display: "grid",
              gap: "var(--c97-sp-4)",
            }}
          >
            {featuredProjects.map((project, index) => (
              <article key={project.slug} className="c97-row c97-row-numbered">
                <div
                  className="c97-kicker c97-tabular"
                  aria-hidden="true"
                  style={{ color: "var(--c97-ink-2)" }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="c97-serif c97-h3">
                    <Link
                      href={`/portfolio/${project.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      {project.title}
                    </Link>
                  </h3>
                  <p
                    className="c97-prose"
                    style={{
                      marginTop: "var(--c97-sp-1)",
                      color: "var(--c97-ink-2)",
                    }}
                  >
                    {getProjectCardSummary(project)}
                  </p>
                </div>
                <div
                  className="c97-kicker"
                  style={{ color: "var(--c97-ink-2)" }}
                >
                  {project.timeline}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — Live dashboards */}
      <section className="c97-band c97-band-tall" data-c97-surface="chocolate">
        <div className="c97-shell">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-2) var(--c97-sp-4)",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 className="c97-serif c97-h2">Live dashboards</h2>
              <Link href="/dashboards" className="c97-sectionlink">
                All {dashboardTools.length}
              </Link>
            </div>
            <Catalog97Plate value="03" />
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              marginTop: "var(--c97-sp-3)",
            }}
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  className="c97-kicker"
                  style={{
                    width: "38%",
                    fontWeight: 400,
                    padding: "0 var(--c97-sp-3) var(--c97-sp-2) 0",
                  }}
                >
                  Dashboard
                </th>
                <th
                  scope="col"
                  className="c97-kicker"
                  style={{
                    fontWeight: 400,
                    padding: "0 0 var(--c97-sp-2)",
                  }}
                >
                  What it holds
                </th>
              </tr>
            </thead>
            <tbody>
              {dashboardTools.slice(0, 5).map((tool) => (
                <tr key={tool.slug}>
                  <th
                    scope="row"
                    className="c97-serif c97-h3"
                    style={{
                      fontWeight: 400,
                      textAlign: "left",
                      verticalAlign: "baseline",
                      padding:
                        "var(--c97-sp-2) var(--c97-sp-3) var(--c97-sp-2) 0",
                    }}
                  >
                    {tool.isExternal ? (
                      <a
                        href={tool.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        {tool.title}
                      </a>
                    ) : (
                      <Link href={tool.href} style={{ textDecoration: "none" }}>
                        {tool.title}
                      </Link>
                    )}
                  </th>
                  <td
                    className="c97-prose"
                    style={{
                      color: "var(--c97-ink-2)",
                      verticalAlign: "baseline",
                      padding: "var(--c97-sp-2) 0",
                    }}
                  >
                    {tool.groupLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/*
            The three live readouts. Each fails soft to null upstream, so a
            missing snapshot drops its column rather than rendering an empty
            slot or an invented number.
          */}
          <div
            className="c97-columns"
            style={{ marginTop: "var(--c97-sp-5)" }}
          >
            <div>
              <div
                className="c97-serif c97-tabular"
                style={{
                  fontSize: "var(--c97-fs-h1)",
                  lineHeight: "var(--c97-lh-display)",
                }}
              >
                {heroIndex.liveToolCount}
              </div>
              <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-2)" }}>
                Live tools in production
              </p>
            </div>

            {liveFeed.quake ? (
              <div>
                <div
                  className="c97-serif c97-tabular"
                  style={{
                    fontSize: "var(--c97-fs-h1)",
                    lineHeight: "var(--c97-lh-display)",
                  }}
                >
                  M{liveFeed.quake.magnitude.toFixed(1)}
                </div>
                <p
                  className="c97-kicker"
                  style={{ marginTop: "var(--c97-sp-2)" }}
                >
                  Latest quake · {liveFeed.quake.agoLabel}
                </p>
              </div>
            ) : null}

            {liveFeed.market ? (
              <div>
                <div
                  className="c97-serif c97-tabular"
                  style={{
                    fontSize: "var(--c97-fs-h1)",
                    lineHeight: "var(--c97-lh-display)",
                  }}
                >
                  {liveFeed.market.delta}
                </div>
                <p
                  className="c97-kicker"
                  style={{ marginTop: "var(--c97-sp-2)" }}
                >
                  {liveFeed.market.symbol} day move ·{" "}
                  {liveFeed.market.changePct.toFixed(2)}%
                </p>
              </div>
            ) : null}

            {liveFeed.launch ? (
              <div>
                <div
                  className="c97-serif"
                  style={{
                    fontSize: "var(--c97-fs-h3)",
                    lineHeight: "var(--c97-lh-tight)",
                  }}
                >
                  {liveFeed.launch.mission}
                </div>
                <p
                  className="c97-kicker"
                  style={{ marginTop: "var(--c97-sp-2)" }}
                >
                  Next launch · {liveFeed.launch.vehicle}
                </p>
              </div>
            ) : null}
          </div>

          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-4)" }}>
            {liveFeed.sourceNote}
          </p>
        </div>
      </section>

      {/* 04 — Recent writing */}
      {leadPost ? (
        <section className="c97-band c97-band-tall" data-c97-surface="bone">
          <div className="c97-shell">
            <h2 className="c97-serif c97-h2">Recent writing</h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: "var(--c97-sp-4)",
                marginTop: "var(--c97-sp-3)",
              }}
            >
              <Catalog97Plate value="04" style={{ flex: "none" }} />
              {/*
                This carried `c97-display`, which resolves to --c97-fs-h1, so
                an h3 rendered at 52px under a 32px h2 and tied the page h1
                exactly. On a Persuade route the h1 is the value proposition and
                a blog post title should not draw level with it.

                --c97-fs-h3 is the step, not --c97-fs-h2, because h2 is what the
                rubric above it uses and matching it would put the child exactly
                on its parent, which is the same defect one step over. There is
                nothing between 32px and 52px to reach for: the scale is frozen
                at 9 steps and --c97-fs-display, the only value in that gap at
                74px, has no consumer anywhere in the codebase, so adding one
                would be a typographic decision for the whole world rather than
                a fix for this band.

                26px is also what bands 02 and 03 give their items, so every
                rubric on this route is 32px now and every item under one is
                26px. The lead keeps its tier over the two posts below it,
                which drop to --c97-fs-lead, and it keeps the plate beside it.
              */}
              <h3
                className="c97-serif c97-h3"
                style={{ flex: "1 1 380px" }}
              >
                <Link
                  href={`/writing/${leadPost.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  {leadPost.title}
                </Link>
              </h3>
            </div>

            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-3)" }}>
              {leadPost.excerpt}
            </p>
            <p className="c97-meta" style={{ marginTop: "var(--c97-sp-2)" }}>
              <span className="c97-tabular">{leadPost.readingTime}</span>
              <span>{leadPost.category}</span>
            </p>

            {followingPosts.map((post) => (
              <div
                key={post.slug}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "var(--c97-sp-1) var(--c97-sp-4)",
                  marginTop: "var(--c97-sp-5)",
                }}
              >
                <div style={{ flex: "1 1 420px" }}>
                  {/* --c97-fs-lead, so the lead post above keeps its tier. */}
                  <h3 className="c97-serif c97-lead">
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
              </div>
            ))}

            <Link
              href="/writing"
              className="c97-sectionlink"
              style={{ marginTop: "var(--c97-sp-3)" }}
            >
              All writing
            </Link>
          </div>
        </section>
      ) : null}

      {/* 05 — Closing. Tobacco, so nothing here is smaller than --c97-fs-h2. */}
      <section className="c97-band c97-band-tall" data-c97-surface="tobacco">
        <div
          className="c97-shell"
          style={{ display: "grid", justifyItems: "end", textAlign: "right" }}
        >
          <div className="c97-hairline" style={{ background: "var(--c97-ink)" }} />
          {/*
            A p rather than an h2, which is what the closing statement is on
            every other Catalog 97 route. As an h2 it rendered at 52px and tied
            the page h1 exactly, the same defect just fixed one band above, and
            it is not a section rubric with anything under it. Dropping the
            heading also drops this band as a landmark, which matches the CTA
            bands on /dashboards, /writing and /portfolio, none of which carry a
            heading either. The size does not change.
          */}
          <p
            className="c97-display"
            style={{
              marginTop: "var(--c97-sp-3)",
              color: "var(--c97-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            If you have a thing that needs proving, I would like to hear about
            it.
          </p>
          <div
            className="c97-hairline"
            style={{
              width: "min(100%,448px)",
              marginTop: "var(--c97-sp-3)",
              background: "var(--c97-ink)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "var(--c97-sp-4)",
              marginTop: "var(--c97-sp-3)",
            }}
          >
            <Link className="c97-btn-outline" href="/contact">
              Get in touch
            </Link>
            <Catalog97Plate value="05" />
          </div>
        </div>
      </section>
    </Catalog97Shell>
  );
}
