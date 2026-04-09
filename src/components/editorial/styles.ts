import type { CSSProperties } from "react";

/**
 * Shared inline style used for inset panels in the editorial system.
 * Uses the --home-* palette so it automatically follows light/dark mode.
 */
export const insetPanelStyle: CSSProperties = {
  background: "color-mix(in srgb, var(--home-paper-alt) 78%, white)",
  border: "1px solid var(--home-rule)",
};
