"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  /** Surface label rendered in the heading ("the NBA dashboard", "writing", etc.). */
  surfaceName?: string;
}

/**
 * The shared error state, drawn as one paper band in the Catalog 97 language.
 *
 * It renders no shell of its own. Inside a route, `Catalog97ToolShell` already
 * supplies the header, the `main`, and the footer; at the global boundary,
 * `src/app/error.tsx` decides whether to wrap it in `Catalog97Shell`.
 */
export function RouteErrorBoundary({ error, reset, surfaceName }: Props) {
  useEffect(() => {
    logger.error(`${surfaceName ?? "Route"} render error`, error);
  }, [error, surfaceName]);

  return (
    <section className="c97-band c97-band-tall" data-c97-surface="paper">
      <div className="c97-shell">
        <div
          style={{
            display: "grid",
            gap: "var(--c97-sp-3)",
            maxWidth: "var(--c97-column)",
          }}
        >
          <p className="c97-kicker">Something went wrong</p>
          <h1 className="c97-display">
            {surfaceName ? `Couldn't load ${surfaceName}.` : "Couldn't load this page."}
          </h1>
          <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
            The page hit an unexpected error. Most failures clear up on a retry.
            If this keeps happening, the underlying data source may be down.
          </p>
          {error.digest ? (
            <p className="c97-meta">
              <span className="c97-mono">Reference: {error.digest}</span>
            </p>
          ) : null}
          <div>
            <button type="button" onClick={reset} className="c97-btn">
              Try again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
