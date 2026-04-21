import type { ReactNode } from "react";

interface UtilityStripProps {
  children: ReactNode;
}

/**
 * Thin pill-shaped container used for meta/status strips above or below a
 * section (e.g. "Last refreshed...", "N items across M sources"). Paired with
 * the editorial palette so it blends into any --home-* page.
 */
export function UtilityStrip({ children }: UtilityStripProps) {
  return (
    <div
      className="rounded-full px-4 py-2.5"
      style={{
        background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
        border: "1px solid var(--home-rule)",
      }}
    >
      <p
        className="mb-0 text-sm leading-6"
        style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
      >
        {children}
      </p>
    </div>
  );
}
