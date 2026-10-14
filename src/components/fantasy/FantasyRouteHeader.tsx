import { Children, Fragment, isValidElement, type CSSProperties, type ReactNode } from "react";
import { SHELL_CLASS } from "@/lib/fantasyUtils";

const PRODUCT_NAME = "Fantasy Football";

/**
 * The product bar prints "Fantasy Football" right above the title, so a title
 * that opens with those words shows only what follows them. The words stay in
 * the h1 for assistive tech, so its accessible name does not change.
 */
function withProductNameHidden(title: ReactNode): ReactNode {
  const source =
    isValidElement<{ children?: ReactNode }>(title) && title.type === Fragment ? title.props.children : title;
  const parts = Children.toArray(source);
  let lead = "";
  let index = 0;
  while (index < parts.length && typeof parts[index] === "string") {
    lead += parts[index];
    index += 1;
  }
  const rest = parts.slice(index);
  if (!lead.startsWith(PRODUCT_NAME)) return title;
  const after = lead.slice(PRODUCT_NAME.length).trimStart();
  if (after === "" && rest.length === 0) return title;
  return (
    <>
      <span className="ffb-vh">{PRODUCT_NAME} </span>
      {after}
      {rest}
    </>
  );
}

/**
 * The kit's page head: the title, one orienting sentence, and the source
 * dates as one muted line that sits on the title's baseline from 1200px up.
 * `aside` holds page actions at the right of the lead's line (the trade
 * calculator's model tag and rankings link), and `children` is a full-width
 * row under all of it (the best ball contest switch).
 */
export function FantasyRouteHeader({
  title,
  lead,
  freshness,
  aside,
  children,
  className = SHELL_CLASS,
}: {
  title: ReactNode;
  lead?: ReactNode;
  freshness?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`${className} ffb-head`}>
      <h1 className="ffb-title">{withProductNameHidden(title)}</h1>
      {lead ? <p className="ffb-lede">{lead}</p> : null}
      {freshness ?? null}
      {aside ? <div className="ffb-head-aside">{aside}</div> : null}
      {children ? <div className="ffb-head-row">{children}</div> : null}
    </header>
  );
}

/**
 * The last word of a title. It used to set Newsreader italic. The kit's title
 * is one face, so this is now a plain wrapper the routes can keep passing.
 */
export function TitleAccent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** A section heading on the fantasy routes, in the kit's sticker type. */
export function FantasySectionHeading({
  id,
  children,
  style,
}: {
  id?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <h2 id={id} className="ffb-h2" style={style}>
      {children}
    </h2>
  );
}

export type FreshnessPart = { label: string; shortLabel?: string; tone?: "warning" | "negative" };

/**
 * One muted freshness line from labelled parts, with a status colour on the
 * parts that carry one; the label itself still says stale or aging. Keyed by
 * position, since a part can be user text (a league name) that repeats another.
 * The tone is the kit's status ink, `ffb-warn` or `ffb-bad`, on the label alone.
 *
 * Each part is one `ffb-fresh-part` that does not break from the tablet width
 * up, and its dot sits inside it after a no-break space. So a wrapped line
 * breaks only between parts, never inside a date, and never opens on a dot.
 */
export function FreshnessParts({ parts }: { parts: FreshnessPart[] }) {
  return (
    <p className="ffb-fresh">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {/* A real space between parts, outside the hidden dot, so the line can wrap here and assistive tech gets a word break. */}
          {index > 0 ? " " : null}
          <span className="ffb-fresh-part">
            <span className={part.tone === "negative" ? "ffb-bad" : part.tone === "warning" ? "ffb-warn" : undefined}>
              {part.shortLabel ? (
                <>
                  <span className="md:hidden">{part.shortLabel}</span>
                  <span className="hidden md:inline">{part.label}</span>
                </>
              ) : (
                part.label
              )}
            </span>
            {index < parts.length - 1 ? (
              <>
                {"\u00A0"}
                <span aria-hidden="true">·</span>
              </>
            ) : null}
          </span>
        </Fragment>
      ))}
    </p>
  );
}
