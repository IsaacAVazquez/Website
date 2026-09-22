interface RouteLoadingStateProps {
  /** Surface label rendered in the heading ("the NFL dashboard", "investments", etc.). */
  surfaceName?: string;
  /** Number of placeholder panels to render in the grid. Defaults to 6. */
  cardCount?: number;
}

/*
 * One placeholder line. The class paints it; the height and width are the
 * dimensions of the text it stands in for, so the layout does not jump when
 * the real content streams in.
 */
function Line({ height, width }: { height: string | number; width: string | number }) {
  return <span className="c97-skeleton" style={{ height, width }} />;
}

/**
 * The loading skeleton for snapshot-driven dashboard routes, drawn as one
 * paper band in the Catalog 97 language: a title block, a stat row, and a
 * grid of panels, which is the shape most dashboards resolve into.
 *
 * Mirrors {@link RouteErrorBoundary} so the loading and error states share a
 * layout. Rendered by per-route `loading.tsx` files, it gives client-side
 * navigation an instant fallback while the server component streams.
 *
 * Pure markup with no client JS. The `.c97-skeleton` pulse is stilled for
 * `prefers-reduced-motion` by the motion rule at the end of `catalog97.css`.
 */
export function RouteLoadingState({
  surfaceName,
  cardCount = 6,
}: RouteLoadingStateProps) {
  return (
    <section
      className="c97-band"
      data-c97-surface="paper"
      role="status"
      aria-live="polite"
      aria-label={surfaceName ? `Loading ${surfaceName}` : "Loading"}
    >
      <div
        className="c97-shell"
        aria-hidden="true"
        style={{ display: "grid", gap: "var(--c97-sp-5)" }}
      >
        {/* Title block: kicker, display heading, standfirst */}
        <div style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
          <Line height="var(--c97-fs-label)" width={112} />
          <Line height="var(--c97-fs-h1)" width="min(100%, 28rem)" />
          <Line height="var(--c97-fs-body)" width="min(100%, 36rem)" />
        </div>

        {/* Stat row */}
        <div className="c97-columns">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="c97-stat">
              <Line height="var(--c97-fs-label)" width={80} />
              <Line height="var(--c97-fs-h2)" width={64} />
            </div>
          ))}
        </div>

        {/* Panel grid */}
        <div className="c97-columns" style={{ gap: "var(--c97-sp-3)" }}>
          {Array.from({ length: cardCount }, (_, i) => (
            <div
              key={i}
              className="c97-panel"
              style={{ display: "grid", gap: "var(--c97-sp-2)" }}
            >
              <Line height="var(--c97-fs-label)" width="60%" />
              <Line height="var(--c97-fs-h3)" width="80%" />
              <Line height="var(--c97-fs-body)" width="100%" />
              <Line height="var(--c97-fs-body)" width="70%" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
