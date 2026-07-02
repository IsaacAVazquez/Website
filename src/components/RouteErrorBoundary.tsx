"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  /** Surface label rendered in the heading ("the NBA dashboard", "writing", etc.). */
  surfaceName?: string;
}

export function RouteErrorBoundary({ error, reset, surfaceName }: Props) {
  useEffect(() => {
    logger.error(`${surfaceName ?? "Route"} render error`, error);
  }, [error, surfaceName]);

  return (
    <section className="home-page min-h-screen">
      <div className="home-shell home-section">
        <div className="home-card mx-auto max-w-2xl p-8">
          <p className="home-kicker mb-2">Something went wrong</p>
          <h1 className="text-2xl font-semibold text-[var(--home-ink)]">
            {surfaceName ? `Couldn't load ${surfaceName}.` : "Couldn't load this page."}
          </h1>
          <p className="mt-3 text-[var(--home-ink-muted)]">
            The page hit an unexpected error. Most failures clear up on a retry —
            if this keeps happening, the underlying data source may be down.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-[var(--home-ink-muted)]">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--home-ink)] px-5 py-2.5 text-sm font-semibold text-[var(--home-paper)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-signal)]"
          >
            Try again
          </button>
        </div>
      </div>
    </section>
  );
}
