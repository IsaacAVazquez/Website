interface RouteLoadingStateProps {
  /** Surface label rendered in the heading ("the NFL dashboard", "investments", etc.). */
  surfaceName?: string;
  /** Number of skeleton cards to render in the grid. Defaults to 6. */
  cardCount?: number;
}

/**
 * Editorial-styled loading skeleton for snapshot-driven dashboard routes.
 *
 * Mirrors the shell used by {@link RouteErrorBoundary} so the loading and error
 * states share a layout. Rendered by per-route `loading.tsx` files, it gives
 * client-side navigation an instant fallback while the server component streams.
 *
 * Pure markup (no client JS); the `.skeleton` shimmer is disabled automatically
 * for `prefers-reduced-motion` users via the global rule in `globals.css`.
 */
export function RouteLoadingState({
  surfaceName,
  cardCount = 6,
}: RouteLoadingStateProps) {
  return (
    <section
      className="home-page min-h-screen"
      role="status"
      aria-live="polite"
      aria-label={surfaceName ? `Loading ${surfaceName}` : "Loading"}
    >
      <div className="home-shell home-section space-y-8" aria-hidden="true">
        {/* Header band: kicker + title + lede */}
        <div className="space-y-3">
          <div className="skeleton h-3 w-28 rounded-full" />
          <div className="skeleton h-9 w-2/3 max-w-md rounded-lg" />
          <div className="skeleton h-4 w-full max-w-xl rounded-full" />
        </div>

        {/* Stat row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="home-card space-y-3 p-5">
              <div className="skeleton h-3 w-20 rounded-full" />
              <div className="skeleton h-7 w-16 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Content card grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cardCount }, (_, i) => (
            <div key={i} className="home-card space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-3/4 rounded-full" />
                  <div className="skeleton h-2.5 w-1/2 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="skeleton h-3 w-full rounded-full" />
                <div className="skeleton h-3 w-5/6 rounded-full" />
                <div className="skeleton h-3 w-2/3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
