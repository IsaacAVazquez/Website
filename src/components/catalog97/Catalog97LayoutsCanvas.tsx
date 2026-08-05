import { catalog97NavLinks } from "@/constants/catalog97Nav";

/**
 * The Catalog 97 layouts canvas: every designed route stacked in one scroll,
 * behind route labels, with the layout rules the set is held to.
 *
 * This is the local implementation of
 * `templates/catalog-pages/CatalogPages.dc.html` in the Working Instrument
 * design project. That template is a composition rather than a new surface. It
 * `dc-import`s the seven page templates, stacks them behind chocolate route
 * labels so the whole application can be reviewed in one pass, and closes on
 * the layout rules the set has to hold.
 *
 * Each route renders in an iframe, which is the honest analogue of the design's
 * `dc-import`, because an import there is its own document and so is a frame
 * here. Rendering the page components inline instead would put seven
 * `Catalog97Shell` instances on one page, which is seven headers, seven
 * footers, seven `main` landmarks, and seven page-level `h1`s. The frames keep
 * each route's own shell and heading structure intact and leave this page with
 * the single `h1` the repo requires.
 *
 * The routes come from `catalog97NavLinks` rather than being listed again here,
 * so a route added to the design language shows up on the canvas without a
 * second registration, which is what that file already claims for itself.
 */

/**
 * Per-route review captions and frame heights, keyed by route.
 *
 * The captions are the design's own canvas wording, which is deliberately more
 * descriptive than the nav label: the nav says "Work" where the canvas says
 * "Work index", because the canvas is naming the layout rather than the
 * destination.
 *
 * The heights are the `hint-size` values the design puts on each import. They
 * are review scaffolding rather than a layout contract, so a route that grows
 * past its frame scrolls inside it rather than being clipped.
 */
const ROUTE_VIEWS: Record<string, { caption: string; height: number }> = {
  "/": { caption: "Home", height: 3800 },
  "/portfolio": { caption: "Work index", height: 3200 },
  "/writing": { caption: "Writing archive", height: 3400 },
  "/dashboards": { caption: "Dashboard index", height: 3200 },
  "/about": { caption: "About", height: 3300 },
  "/resume": { caption: "Résumé", height: 3300 },
  "/contact": { caption: "Contact", height: 2700 },
};

/** The rules panel, one column per grouping in the design. */
const RULE_COLUMNS: { heading: string; rules: string[] }[] = [
  {
    heading: "Shell",
    rules: [
      "the editorial column is --container at 1080px, side margins are --gutter, and every other step comes from --sp-1 through --sp-7",
      "nine type steps, --fs-label through --fs-plate, four line heights, and three measures plus the container",
      "header is Paper with no rule, active route in Espresso and the rest in muted ink",
      "footer opens with the Pine wordmark band and closes on the Espresso colophon",
    ],
  },
  {
    heading: "Fields",
    rules: [
      "each section declares its paper as Paper or Pine, then holds seventy twenty ten inside it",
      "on Pine the ink scale is Paper, Bone, Sage for small labels, Camel for action",
      "Tobacco bands carry Paper ink at --fs-h2 and up, never smaller, because Paper on Tobacco measures 4.36 and only clears once the text is large",
      "image slots are flat Stone or Tobacco fields with the caption underneath",
    ],
  },
  {
    heading: "Rhythm",
    rules: [
      "never two Pine sections adjacent, and a brown band makes the transition into green",
      "Pine sections are the tall ones, which is where the extra air goes",
      "the script wordmark is one SVG lockup, once per route, on the Pine footer band",
      "Anton is for numerals only, at the display and plate steps, never for running text or headings",
      "Contact is deliberately the shortest route, Home the longest",
    ],
  },
];

interface Catalog97LayoutsCanvasProps {
  /** The chocolate band naming each route. On by default, as in the design. */
  showRouteLabels?: boolean;
  /** The closing panel of layout rules. On by default, as in the design. */
  showRules?: boolean;
}

type Catalog97RouteView = { caption: string; height: number };

export function Catalog97LayoutsCanvas({
  showRouteLabels = true,
  showRules = true,
}: Catalog97LayoutsCanvasProps) {
  const views = catalog97NavLinks
    .map((link) => ({ link, view: ROUTE_VIEWS[link.href] }))
    .filter(
      (row): row is {
        link: (typeof catalog97NavLinks)[number];
        view: Catalog97RouteView;
      } => row.view !== undefined,
    );

  return (
    <div className="c97-page" data-c97-surface="paper">
      <section
        style={{ padding: "var(--c97-sp-5) var(--c97-gutter) var(--c97-sp-4)" }}
      >
        <div style={{ maxWidth: "var(--c97-container)", margin: "0 auto" }}>
          <p className="c97-kicker">Layouts · seven routes</p>
          <h1
            style={{
              margin: "var(--c97-sp-3) 0 0",
              fontFamily: "var(--c97-font-display)",
              fontWeight: 400,
              fontSize: "var(--c97-fs-h1)",
              lineHeight: "var(--c97-lh-tight)",
              letterSpacing: "-.015em",
              color: "var(--c97-ink-2)",
              maxWidth: "var(--c97-measure-tight)",
              textWrap: "pretty",
            }}
          >
            The whole application, laid out in the catalog language.
          </h1>
          <p
            style={{
              margin: "var(--c97-sp-2) 0 0",
              maxWidth: "var(--c97-measure-wide)",
              fontSize: "var(--c97-fs-body)",
              lineHeight: "var(--c97-lh-body)",
              color: "var(--c97-ink)",
            }}
          >
            Individual project and dashboard detail pages are out of scope here.
            Every route below declares each section&apos;s paper as either Paper
            or Pine, holds seventy twenty ten inside that paper, keeps at least
            two full-width brown bands, never runs two Pine sections back to
            back, and spends its one script wordmark in the footer.
          </p>
        </div>
      </section>

      {views.map(({ link, view }) => (
        <div key={link.href}>
          {showRouteLabels ? (
            <div
              style={{
                background: "var(--c97-band-y)",
                padding: "var(--c97-sp-2) var(--c97-gutter)",
              }}
            >
              <div
                style={{
                  maxWidth: "var(--c97-container)",
                  margin: "0 auto",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "var(--c97-sp-2)",
                  fontSize: "var(--c97-fs-label)",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "var(--c97-paper-base)",
                }}
              >
                <span>Route · {link.href}</span>
                <span>{view.caption}</span>
              </div>
            </div>
          ) : null}
          {/*
            `loading="lazy"` matters more than usual here, because without it the
            canvas fetches and renders seven full routes on first paint. The
            title is what a screen reader announces for the frame, so it names
            the route rather than repeating the caption alone.
          */}
          <iframe
            src={link.href}
            title={`${view.caption} route, ${link.href}`}
            loading="lazy"
            style={{
              display: "block",
              width: "100%",
              height: `${view.height}px`,
              border: "0",
            }}
          />
        </div>
      ))}

      {showRules ? (
        <section
          data-c97-surface="bone"
          style={{
            background: "var(--c97-surface)",
            padding: "var(--c97-sp-5) var(--c97-gutter)",
          }}
        >
          <div style={{ maxWidth: "var(--c97-container)", margin: "0 auto" }}>
            <h2 className="c97-kicker" style={{ margin: 0 }}>
              Layout rules these pages hold
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
                gap: "var(--c97-sp-5)",
                marginTop: "var(--c97-sp-3)",
              }}
            >
              {RULE_COLUMNS.map((column) => (
                <div key={column.heading}>
                  <h3 className="c97-kicker" style={{ margin: 0 }}>
                    {column.heading}
                  </h3>
                  <ul
                    style={{
                      margin: "var(--c97-sp-2) 0 0",
                      paddingLeft: "var(--c97-sp-2)",
                      fontSize: "var(--c97-fs-small)",
                      lineHeight: "var(--c97-lh-loose)",
                      color: "var(--c97-ink)",
                    }}
                  >
                    {column.rules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
