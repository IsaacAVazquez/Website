import type { ReactNode } from "react";
import { SHELL_CLASS } from "@/lib/fantasyUtils";

/**
 * The compact board header every fantasy route opens on: the title on the
 * title ramp, one orienting sentence, and the source dates as one muted line.
 * It replaced the poster hero, its lead-ink sheet, and the plate of chips on
 * 2026-10-12, so the board, the form, or the desk starts right under it.
 * `aside` sits to the right from md up (the trade calculator's model tag and
 * rankings link), and `children` is a full-width row under the three lines
 * (the best ball contest switch).
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
    <header
      className={`${className} flex flex-col`}
      style={{ paddingTop: "var(--c97-sp-3)", paddingBottom: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}
    >
      <div className="flex flex-wrap items-end justify-between" style={{ columnGap: "var(--c97-sp-3)", rowGap: "var(--c97-sp-1)" }}>
        <div className="flex min-w-0 flex-col" style={{ gap: "var(--c97-sp-1)" }}>
          <h1
            className="m-0 font-semibold leading-none"
            style={{
              fontFamily: "var(--c97-font-body)",
              fontSize: "clamp(1.55rem, 1.3rem + 1.25vw, 2.1rem)",
              letterSpacing: "-0.04em",
              color: "var(--c97-ink)",
            }}
          >
            {title}
          </h1>
          {lead ? (
            <p className="m-0 text-sm leading-6" style={{ maxInlineSize: "68ch", color: "var(--c97-ink-2)" }}>
              {lead}
            </p>
          ) : null}
          {freshness ? (
            <p className="m-0 font-mono text-2xs uppercase leading-relaxed tracking-[0.08em]" style={{ color: "var(--c97-ink-2)" }}>
              {freshness}
            </p>
          ) : null}
        </div>
        {aside ? <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>{aside}</div> : null}
      </div>
      {children}
    </header>
  );
}

/** Newsreader italic on the last word of a title, as the compact header had it. */
export function TitleAccent({ children }: { children: ReactNode }) {
  return (
    <em style={{ fontFamily: "var(--c97-font-display)", fontStyle: "italic", fontWeight: 500 }}>{children}</em>
  );
}

/** One muted freshness line from labelled parts, with a status colour on the parts that carry one. */
export function FreshnessParts({
  parts,
}: {
  parts: { label: string; shortLabel?: string; tone?: "warning" | "negative" }[];
}) {
  return (
    <>
      {parts.map((part, index) => (
        <span key={part.label}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          <span style={part.tone ? { color: `var(--c97-${part.tone})` } : undefined}>
            {part.shortLabel ? (
              <>
                <span className="md:hidden">{part.shortLabel}</span>
                <span className="hidden md:inline">{part.label}</span>
              </>
            ) : (
              part.label
            )}
          </span>
        </span>
      ))}
    </>
  );
}
