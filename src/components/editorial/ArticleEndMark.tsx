"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * The "-30-" at the end of a post, the old newsroom sign that a story is
 * over. It is a button, and pressing it explains the sign, says how long the
 * reader took from the page loading to pressing it by this tab's own clock,
 * and names the next post. Listed in docs/EASTER_EGGS.md.
 */

export interface ArticleEndMarkProps {
  /** The post to read next, when there is one. */
  next: { href: string; title: string } | null;
}

/** How long the page has been open, in the reader's own words. */
export function describeTimeOnPage(elapsedMs: number): string {
  const minutes = Math.round(elapsedMs / 60_000);
  if (minutes < 1) return "under a minute";
  if (minutes === 1) return "about a minute";
  if (minutes < 60) return `about ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "about an hour" : `about ${hours} hours`;
}

export function ArticleEndMark({ next }: ArticleEndMarkProps) {
  const [elapsed, setElapsed] = useState<number | null>(null);
  const open = elapsed !== null;
  return (
    <>
      <button
        type="button"
        className="c97-article-mark"
        aria-label={open ? "Close the note on the end mark" : "What the end mark means"}
        aria-expanded={open}
        onClick={() => setElapsed(open ? null : performance.now())}
      >
        <span aria-hidden="true">‑30‑</span>
      </button>
      <div role="status" className="c97-article-mark-note">
        {open ? (
          <p>
            That&apos;s -30-, the sign a newsroom put at the end of a story so the desk knew it was
            over. You reached it {describeTimeOnPage(elapsed)} after the page loaded, by this
            tab&apos;s clock.
            {next ? (
              <>
                {" "}
                The next one is{" "}
                <Link href={next.href} className="c97-link">
                  {next.title}
                </Link>
                .
              </>
            ) : (
              " This is the newest one, so there's nothing after it yet."
            )}
          </p>
        ) : null}
      </div>
    </>
  );
}
