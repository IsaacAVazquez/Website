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
  return constructMetadata({
    title: "Changelog",
    description:
      "A running log of what's shipped on this site — new features, fixes, writing, and experiments.",
    canonicalUrl: "https://isaacavazquez.com/changelog",
    dateModified: latest || undefined,
  });
}

const sectionTitleStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
} as const;

const bodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink-muted)",
} as const;

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

      <section
        className="home-page home-section min-h-screen"
        aria-label="Changelog"
      >
        <div className="home-shell home-shell-tight space-y-10">
          <header className="space-y-4">
            <p className="home-kicker mb-0">Changelog</p>
            <h1
              className="mb-0"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
                fontWeight: 600,
                lineHeight: 0.95,
                letterSpacing: "-0.06em",
                color: "var(--home-ink)",
              }}
            >
              What shipped, in order.
            </h1>
            <p className="home-body max-w-[52rem]">
              A running log of changes to this site — features, fixes, writing,
              and the occasional cleanup. Built in public on purpose. For the
              current focus, see the{" "}
              <Link
                href="/now"
                className="underline underline-offset-2"
                style={{ color: "var(--home-haze)" }}
              >
                /now page
              </Link>
              .
            </p>
          </header>

          {entries.length === 0 ? (
            <article className="home-card p-6 sm:p-8">
              <p className="mb-0 text-base leading-7" style={bodyStyle}>
                No entries yet. Check back soon.
              </p>
            </article>
          ) : (
            <ol className="space-y-6">
              {entries.map((entry) => (
                <li key={entry.slug}>
                  <article
                    id={entry.slug}
                    className="home-card p-6 sm:p-8 space-y-4 scroll-mt-28"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="home-kicker mb-0">
                          {entry.category}
                        </span>
                        {entry.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="resume-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <time
                        dateTime={entry.publishedAt}
                        className="home-meta mb-0"
                      >
                        {publishedDateFormatter.format(
                          new Date(entry.publishedAt)
                        )}
                      </time>
                    </div>

                    <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
                      <Link
                        href={`/changelog#${entry.slug}`}
                        className="transition-colors hover:opacity-70"
                      >
                        {entry.title}
                      </Link>
                    </h2>

                    <p
                      className="mb-0 text-base leading-7"
                      style={{
                        fontFamily: "var(--font-home-sans)",
                        color: "var(--home-ink)",
                      }}
                    >
                      {entry.summary}
                    </p>

                    <div
                      className="changelog-prose text-base leading-7"
                      style={{
                        fontFamily: "var(--font-home-sans)",
                        color: "var(--home-ink-muted)",
                      }}
                      dangerouslySetInnerHTML={{ __html: entry.html }}
                    />
                  </article>
                </li>
              ))}
            </ol>
          )}

          <footer
            className="pt-6 text-center text-sm leading-6"
            style={{
              ...bodyStyle,
              borderTop: "1px solid var(--home-rule)",
            }}
          >
            Want to see what&apos;s coming next? The{" "}
            <Link
              href="/now"
              className="underline underline-offset-2"
              style={{ color: "var(--home-haze)" }}
            >
              /now page
            </Link>{" "}
            is the best place to look.
          </footer>
        </div>
      </section>
    </>
  );
}
