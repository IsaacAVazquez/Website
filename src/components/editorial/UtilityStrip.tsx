import type { ReactNode } from "react";

interface UtilityStripProps {
  children: ReactNode;
}

/**
 * Thin container used for meta/status strips above or below a section (e.g.
 * "Last refreshed...", "N items across M sources"). Paired with the editorial
 * palette so it blends into any Catalog 97 page.
 */
export function UtilityStrip({ children }: UtilityStripProps) {
  return (
    <div
      className="px-4 py-2.5"
      style={{
        background: "var(--c97-panel)",
        border: "1px solid var(--c97-rule)",
      }}
    >
      <p
        className="mb-0 text-sm leading-6"
        style={{ fontFamily: "var(--c97-font-body)", color: "var(--c97-ink-2)" }}
      >
        {children}
      </p>
    </div>
  );
}
