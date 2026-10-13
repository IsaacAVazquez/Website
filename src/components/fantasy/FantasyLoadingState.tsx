const ROWS = 10;

/**
 * The loading skeleton for the eight fantasy routes, in the shape the pages
 * resolve into: a head, a toolbar line, and ruled rows. It keeps the
 * `role="status"` and the "Loading …" name `RouteLoadingState` gave these
 * routes. Pure markup, and the pulse is off under reduced motion.
 */
export function FantasyLoadingState({ surfaceName }: { surfaceName?: string }) {
  return (
    <section
      className="c97-shell c97-frame ffb-loading"
      role="status"
      aria-live="polite"
      aria-label={surfaceName ? `Loading ${surfaceName}` : "Loading"}
    >
      <div className="ffb-stack" aria-hidden="true">
        <div className="ffb-head">
          <span className="ffb-skel ffb-skel-title" />
          <span className="ffb-skel ffb-skel-line ffb-lede" />
        </div>
        <div className="ffb-toolbar">
          <span className="ffb-skel ffb-skel-ctl ffb-skel-ctl-wide" />
          <span className="ffb-skel ffb-skel-ctl" />
          <span className="ffb-skel ffb-skel-ctl" />
        </div>
        <div>
          {Array.from({ length: ROWS }, (_, index) => (
            <div key={index} className="ffb-skel-row">
              <span className="ffb-skel" />
              <span className="ffb-skel" />
              <span className="ffb-skel" />
              <span className="ffb-skel" />
              <span className="ffb-skel" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
