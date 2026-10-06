import type { ReactNode } from "react";
import type { RisoInk } from "@/constants/projectPress";

export interface Catalog97Readout {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

/** A hero carries at most three numbers, so four is a type error. */
type AtMostThree<T> = [] | [T] | [T, T] | [T, T, T];

interface Catalog97ProjectHeroProps {
  ink: RisoInk;
  title: string;
  standfirst?: ReactNode;
  /** The as-of, source, or disclosure line the route already shows. */
  meta?: ReactNode;
  /**
   * One direct action into the route's working area, printed ahead of the
   * figures so it lands in the opening phone view. Keep it to a link or two.
   */
  action?: ReactNode;
  readouts?: AtMostThree<Catalog97Readout>;
  /** The route's signature visual. */
  children?: ReactNode;
}

/**
 * The hero's figures. The hero prints them ahead of its children, so a route
 * whose inputs drive the figures passes no `readouts` and prints this itself
 * after those inputs, which keeps the first field a screen higher on a phone.
 */
export function Catalog97HeroReadouts({ readouts }: { readouts: Catalog97Readout[] }) {
  return (
    <dl className="c97-project-hero-readouts">
      {readouts.map((readout) => (
        <div key={readout.label} className="c97-stat">
          <dt className="c97-stat-label">{readout.label}</dt>
          <dd className="c97-stat-value">{readout.value}</dd>
          {readout.detail ? <dd className="c97-stat-delta">{readout.detail}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

/**
 * A project route's headline sheet. It prints only the headline, the numbers
 * that matter, and a slot, because the signature each route passes in is what
 * makes the page its own.
 */
export function Catalog97ProjectHero({
  ink,
  title,
  standfirst,
  meta,
  action,
  readouts = [],
  children,
}: Catalog97ProjectHeroProps) {
  return (
    <section data-c97-surface={`ink-${ink}`} className="c97-band c97-sheet c97-project-hero">
      <div className="c97-shell">
        <h1 className="c97-poster">{title}</h1>
        {standfirst ? (
          <p
            className="c97-lead"
            style={{ marginTop: "var(--c97-sp-3)", maxWidth: "var(--c97-measure-wide)" }}
          >
            {standfirst}
          </p>
        ) : null}
        {meta ? (
          <p className="c97-meta" style={{ marginTop: "var(--c97-sp-2)" }}>
            {meta}
          </p>
        ) : null}
        {action ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "var(--c97-sp-2)",
              marginTop: "var(--c97-sp-3)",
            }}
          >
            {action}
          </div>
        ) : null}
        {readouts.length > 0 ? <Catalog97HeroReadouts readouts={readouts} /> : null}
        {children ? <div className="c97-project-hero-signature">{children}</div> : null}
      </div>
    </section>
  );
}
