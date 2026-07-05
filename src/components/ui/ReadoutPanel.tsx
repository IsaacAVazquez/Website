import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./ReadoutPanel.module.css";

export interface ReadoutRow {
  label: string;
  /** Rendered in mono tabular figures — pass a node (e.g. a count-up) or a pre-formatted string. */
  value: ReactNode;
}

export interface ReadoutPanelProps {
  /** Cap-row left slot (label, optionally paired with a live indicator). Default "Live index". */
  label?: ReactNode;
  /** Cap-row right slot — e.g. a clock and/or a freshness stamp. */
  stamp?: ReactNode;
  /** Readout rows: label + big mono tabular value. Keep it to 3-5 rows. */
  rows?: ReadoutRow[];
  /** Optional chart/graphic slot rendered below the rows, above the footer. Renders as-is (bring your own styling). */
  children?: ReactNode;
  /** Optional footer line rendered at the panel's foot. Renders as-is (bring your own dot/styling). */
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * ReadoutPanel — the signature "live index" instrument: a paper panel capped
 * with a 3px signal bezel, a mono cap row (left label / right stamp), a
 * stack of readout rows (label + big mono tabular value), an optional chart
 * slot, and an optional footer line.
 *
 * Colors resolve through --hp-* custom properties so an ancestor "plate"
 * wrapper can rebind them to invert the panel for its context (see the
 * module CSS doc comment); standalone use falls back to the plain --home-*
 * tokens.
 */
export function ReadoutPanel({
  label = "Live index",
  stamp,
  rows = [],
  children,
  footer,
  className,
  style,
}: ReadoutPanelProps) {
  return (
    <div className={cn(styles.panel, className)} style={style}>
      <div className={styles.cap}>
        <span className={styles.capLabel}>{label}</span>
        {stamp ? <span className={styles.capRight}>{stamp}</span> : null}
      </div>

      {rows.map((row, index) => (
        <div className={styles.row} key={`${row.label}-${index}`}>
          <span className={styles.rowLabel}>{row.label}</span>
          <span className={styles.rowValue}>{row.value}</span>
        </div>
      ))}

      {children}
      {footer}
    </div>
  );
}
