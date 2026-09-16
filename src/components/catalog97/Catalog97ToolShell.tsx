import dynamic from "next/dynamic";
import { Catalog97Shell } from "./Catalog97Shell";

const ProjectBuildNote = dynamic(() =>
  import("@/components/ProjectBuildNote").then((mod) => mod.ProjectBuildNote),
);

export interface Catalog97ToolBand {
  /** Route family, rendered as the 11px kicker above the title. */
  kicker: string;
  /** The page h1. Only pass a band on a route that does not draw its own h1. */
  title: string;
  standfirst?: string;
}

interface Catalog97ToolShellProps {
  children: React.ReactNode;
  /** The current pathname, used by the build note to look up its prose. */
  route: string;
  /**
   * Optional paper band carrying the kicker, h1, and standfirst. Omitted by
   * default because every route on the site already renders its own h1; a
   * family migration opts in when it moves a route's hero into the shell.
   */
  band?: Catalog97ToolBand;
  /** Link to the build-note write-up, from `projectBuildNoteLinks`. */
  buildNoteHref?: string;
}

/**
 * The shell for every route that is not one of the seven designed Catalog 97
 * pages. It is `Catalog97Shell` (header, the only `main`, espresso footer)
 * plus an optional title band and the build-note aside that `ConditionalLayout`
 * used to append. Because it puts the `.c97-page` scope around the route, the
 * bridge in catalog97.css repaints the route's `--home-*` consumers.
 */
export function Catalog97ToolShell({
  children,
  route,
  band,
  buildNoteHref,
}: Catalog97ToolShellProps) {
  return (
    <Catalog97Shell>
      {band ? (
        <section
          data-c97-surface="paper"
          data-c97-band="title"
          className="c97-band"
          style={{ padding: "var(--c97-band-y) var(--c97-gutter)" }}
        >
          <div className="c97-shell">
            <p className="c97-kicker">{band.kicker}</p>
            <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-2)" }}>
              {band.title}
            </h1>
            {band.standfirst ? (
              <p className="c97-lead" style={{ marginTop: "var(--c97-sp-2)" }}>
                {band.standfirst}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
      <div data-c97-surface="paper">
        {children}
        {buildNoteHref ? <ProjectBuildNote href={buildNoteHref} route={route} /> : null}
      </div>
    </Catalog97Shell>
  );
}
