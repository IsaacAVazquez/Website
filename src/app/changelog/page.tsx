import { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import {
  getAllChangelogEntries,
  getLatestChangelogEntryDate,
} from "@/lib/changelog";
import { publishedDateFormatter } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const latest = getLatestChangelogEntryDate();
  const interfaceUpdatedAt = "2026-07-23";
  return constructMetadata({
    title: "Changelog",
    description:
      "A running log of what I've shipped on this site, including new features, fixes, essays, data updates, and the experiments I kept or retired.",
    canonicalUrl: "https://isaacvazquez.com/changelog",
    dateModified:
      latest && latest > interfaceUpdatedAt ? latest : interfaceUpdatedAt,
  });
}

export default async function ChangelogPage() {
  const entries = await getAllChangelogEntries();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Changelog", url: "/changelog" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as {
            itemListElement: object[];
          }).itemListElement,
        }}
      />

      {/* Hero */}
      <section
        className="c97-band"
        data-c97-surface="paper"
        aria-label="Changelog"
      >
        <div className="c97-shell">
          <p className="c97-kicker">Changelog</p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
            What shipped, in order.
          </h1>
          <p
            className="c97-lead"
            style={{
              marginTop: "var(--c97-sp-3)",
              maxWidth: "var(--c97-measure-wide)",
            }}
          >
            A running log of changes to this site. Features, fixes, writing,
            and the occasional cleanup. Built in public on purpose. For the
            current focus, see the{" "}
            <Link href="/now" className="c97-link">
              /now page
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Entries */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          {entries.length === 0 ? (
            <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
              No entries yet. Check back soon.
            </p>
          ) : (
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {entries.map((entry) => (
                <li key={entry.slug}>
                  <article
                    id={entry.slug}
                    className="c97-row c97-row-stack-sm"
                    style={{
                      scrollMarginTop: "var(--c97-sp-6)",
                      borderTop: "1px solid var(--c97-rule)",
                      paddingBlock: "var(--c97-sp-4)",
                    }}
                  >
                    <div>
                      <p className="c97-meta">
                        <span>{entry.category}</span>
                        {entry.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="c97-chip">
                            {tag}
                          </span>
                        ))}
                      </p>

                      <h2
                        className="c97-serif c97-h2"
                        style={{ marginTop: "var(--c97-sp-2)" }}
                      >
                        {/*
                          `.c97-link` for the hover shift to accent; the
                          inline text-decoration takes its underline off, since
                          a heading is not inline prose.
                        */}
                        <Link
                          href={`/changelog#${entry.slug}`}
                          className="c97-link"
                          style={{ textDecoration: "none" }}
                        >
                          {entry.title}
                        </Link>
                      </h2>

                      <p
                        className="c97-prose"
                        style={{ marginTop: "var(--c97-sp-2)" }}
                      >
                        {entry.summary}
                      </p>

                      <div
                        className="c97-article"
                        style={{
                          marginTop: "var(--c97-sp-2)",
                          color: "var(--c97-ink-2)",
                        }}
                        dangerouslySetInnerHTML={{ __html: entry.html }}
                      />
                    </div>
                    <time dateTime={entry.publishedAt} className="c97-meta">
                      {publishedDateFormatter.format(
                        new Date(entry.publishedAt)
                      )}
                    </time>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Closing line */}
      <section className="c97-band" data-c97-surface="bone">
        <div className="c97-shell">
          <p className="c97-meta">
            <span>
              Want to see what&apos;s coming next? The{" "}
              <Link href="/now" className="c97-link">
                /now page
              </Link>{" "}
              is the best place to look.
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
