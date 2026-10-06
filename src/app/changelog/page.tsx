import { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import {
  getAllChangelogEntries,
  getLatestChangelogEntryDate,
} from "@/lib/changelog";
import { publishedDateFormatter } from "@/lib/utils";

type ChangelogEntry = Awaited<ReturnType<typeof getAllChangelogEntries>>[number];

/** How many of the newest entries print in full. The rest fold their body away. */
const OPEN_ENTRY_COUNT = 8;

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * One dated entry. An older one keeps its title, summary, and anchor on the
 * page and folds only the body, so a link to `#slug` still lands on it.
 */
function ChangelogRow({
  entry,
  collapsed,
}: {
  entry: ChangelogEntry;
  collapsed: boolean;
}) {
  const body = (
    <div
      className="c97-article"
      style={{
        marginTop: "var(--c97-sp-2)",
        color: "var(--c97-ink-2)",
      }}
      dangerouslySetInnerHTML={{ __html: entry.html }}
    />
  );

  return (
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
          <Link
            href={`/changelog#${entry.slug}`}
            className="c97-link-heading"
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

        {collapsed ? (
          <details className="c97-disclosure">
            <summary className="c97-sectionlink">
              <span data-when="closed">Show the full entry</span>
              <span data-when="open">Hide the full entry</span>
            </summary>
            {body}
          </details>
        ) : (
          body
        )}
      </div>
      <time dateTime={entry.publishedAt} className="c97-meta">
        {publishedDateFormatter.format(
          new Date(entry.publishedAt)
        )}
      </time>
    </article>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const latest = getLatestChangelogEntryDate();
  const interfaceUpdatedAt = "2026-07-23";
  return constructMetadata({
    title: "Changelog",
    description:
      "A running log of what I've shipped on this site, including new features, fixes, essays, data updates, and the experiments I kept or retired.",
    canonicalUrl: "/changelog",
    dateModified:
      latest && latest > interfaceUpdatedAt ? latest : interfaceUpdatedAt,
  });
}

export default async function ChangelogPage() {
  const entries = await getAllChangelogEntries();
  const latest = getLatestChangelogEntryDate();
  const interfaceUpdatedAt = "2026-07-23";
  const dateModified =
    latest && latest > interfaceUpdatedAt ? latest : interfaceUpdatedAt;

  const recent = entries.slice(0, OPEN_ENTRY_COUNT);
  // Entries arrive newest first, so each month's run is already contiguous.
  const olderByMonth: [string, ChangelogEntry[]][] = [];
  for (const entry of entries.slice(OPEN_ENTRY_COUNT)) {
    const month = monthFormatter.format(new Date(entry.publishedAt));
    const last = olderByMonth[olderByMonth.length - 1];
    if (last?.[0] === month) last[1].push(entry);
    else olderByMonth.push([month, [entry]]);
  }

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
      <StructuredData
        type="WebPage"
        data={{
          title: "Changelog",
          description:
            "A running log of shipped features, fixes, essays, data updates, and experiments on isaacvazquez.com.",
          url: "https://isaacvazquez.com/changelog",
          dateModified,
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
            A running log of changes to this site, from features and fixes to
            writing and the occasional cleanup, and I keep it in public on
            purpose. For the current focus, see the{" "}
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
            <>
              <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {recent.map((entry) => (
                  <li key={entry.slug}>
                    <ChangelogRow entry={entry} collapsed={false} />
                  </li>
                ))}
              </ol>
              {/*
                All 59 bodies open made a 53,307px phone page. Older entries
                group under their month and keep the title and summary showing.
              */}
              {olderByMonth.map(([month, monthEntries]) => (
                <div key={month}>
                  <p
                    className="c97-kicker c97-tabular"
                    style={{
                      borderTop: "1px solid var(--c97-rule)",
                      paddingTop: "var(--c97-sp-4)",
                    }}
                  >
                    {month} · {monthEntries.length}{" "}
                    {monthEntries.length === 1 ? "entry" : "entries"}
                  </p>
                  <ol
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      marginTop: "var(--c97-sp-3)",
                    }}
                  >
                    {monthEntries.map((entry) => (
                      <li key={entry.slug}>
                        <ChangelogRow entry={entry} collapsed />
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Closing line */}
      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
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
