import { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

/*
 * Every claim here points at code. Analytics is `src/components/analytics/*`
 * and `src/lib/analytics.ts` (GA4 loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID
 * is set, which it is in production), the tools' storage is
 * `src/lib/browserStorage.ts` and the hooks that call it, the signup is
 * `src/app/api/newsletter/subscribe/route.ts`, and the digest is
 * `src/app/api/mba-jobs/email/route.ts`. Change this page when any of those
 * change what they collect or where they send it.
 */

const UPDATED = "2026-10-02";

const privacyDescription =
  "What this site collects and where it goes, from Google Analytics, to the tools that save your entries in your own browser, to the two forms that send an email address.";

export const metadata: Metadata = constructMetadata({
  title: "Privacy | Isaac Vazquez",
  description: privacyDescription,
  canonicalUrl: "/privacy",
  dateModified: UPDATED,
});

const storedTools = [
  "the investments dashboard and its retirement planner",
  "the budget planner and the rent versus buy calculator",
  "the fantasy football rankings, draft trackers, mock draft, and trade calculator",
  "the fantasy Formula 1 lineup",
  "Score Pools",
  "the MBA internship tracker",
  "the travel planner and the travel deal lab",
  "the wine cellar, the museum log, and the recipe finder's pantry",
  "the arcade's high score",
];

const secondaryProseStyle = {
  marginTop: "var(--c97-sp-2)",
  color: "var(--c97-ink-2)",
} as const;

const proseStyle = { marginTop: "var(--c97-sp-2)" } as const;

export default function PrivacyPage() {
  return (
    <>
      <StructuredData
        type="WebPage"
        data={{
          title: "Privacy",
          description: privacyDescription,
          url: "https://isaacvazquez.com/privacy",
          dateModified: UPDATED,
        }}
      />
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData([
              { name: "Home", url: "/" },
              { name: "Privacy", url: "/privacy" },
            ]) as { itemListElement: object[] }
          ).itemListElement,
        }}
      />

      <section className="c97-band" data-c97-surface="paper" aria-label="Privacy">
        <div className="c97-shell">
          <p className="c97-kicker">Privacy · Updated October 2, 2026</p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
            What this site keeps track of, and where it goes.
          </h1>
          <p
            className="c97-lead"
            style={{
              marginTop: "var(--c97-sp-3)",
              maxWidth: "var(--c97-measure-wide)",
            }}
          >
            This is a personal site, so I try to keep what it collects small. Everything on this
            page is what the code behind the site actually does, and when that changes I update it
            here.
          </p>
        </div>
      </section>

      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">Analytics</h2>
          <p className="c97-prose" style={proseStyle}>
            I use Google Analytics 4 to see which pages people read. Its script loads from
            googletagmanager.com, and the site sends Google a page view each time a page opens.
          </p>
          <p className="c97-prose" style={proseStyle}>
            On top of page views, the site sends a few events of its own, which are clicks on the
            header and search result links, filter changes on the search page, copying a code
            sample out of an article, how far down a long page you scroll (at 25, 50, 75, and 100
            percent), and a newsletter signup. The signup event carries the page it happened on and
            not your email address.
          </p>
          <p className="c97-prose" style={secondaryProseStyle}>
            I don&apos;t run session recordings or heatmaps on this site.
          </p>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">Cookies and browser storage</h2>
          <p className="c97-prose" style={proseStyle}>
            The site&apos;s own code doesn&apos;t set any cookies. Google Analytics sets its own
            cookies so it can tell a first visit from a return visit, and if you block them every
            page here still works.
          </p>
          <p className="c97-prose" style={proseStyle}>
            A number of the tools save what you enter in your browser&apos;s local storage, so it is
            still there when you come back. That covers
          </p>
          <ul className="c97-list" style={proseStyle}>
            {storedTools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
          <p className="c97-prose" style={proseStyle}>
            The light or dark theme you pick is saved the same way. All of it stays in your
            browser, and none of it is sent to a server I run, with one exception, which is that
            the investments dashboard sends the ticker symbols you hold to this site&apos;s server
            to look up their prices. Clearing your browser&apos;s data for isaacvazquez.com
            removes everything the tools saved.
          </p>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="deckle">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">Email addresses you send</h2>
          <p className="c97-prose" style={proseStyle}>
            Two forms send an email address off the page. The newsletter signup on the{" "}
            <Link href="/agent-build-index" className="c97-link">
              agent build index
            </Link>{" "}
            sends the address you type to Resend, the service I use for email, which adds it to my
            list. To slow down spam, the server counts signup attempts from each IP address over an
            hour and keeps that count only in memory.
          </p>
          <p className="c97-prose" style={proseStyle}>
            The MBA internship tracker can email a digest of listings, and it sends those listings
            and the address you enter to Resend so the email can go out.
          </p>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">Hosting</h2>
          <p className="c97-prose" style={proseStyle}>
            Netlify hosts the site, and requests reach it through Cloudflare. Both of them handle
            every request the way any web host does, which includes seeing your IP address.
          </p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-5)" }}>
            Questions
          </h2>
          <p className="c97-prose" style={proseStyle}>
            If you have a question about any of this, you can reach me through the{" "}
            <Link href="/contact" className="c97-link">
              contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
