"use client";
/* eslint-disable react-refresh/only-export-components -- co-located constants are intentional */

import React from "react";
import { createPortal } from "react-dom";

export const METRIC_DEFINITIONS: Record<string, string> = {
  // Valuation — all label variants
  "P/E TTM": "Price-to-Earnings (trailing 12 months). How much investors pay per $1 of profit. Lower generally means cheaper.",
  "P/E (TTM)": "Price-to-Earnings (trailing 12 months). How much investors pay per $1 of profit. Lower generally means cheaper.",
  "EPS TTM": "Earnings Per Share (trailing 12 months). Net profit divided by shares outstanding.",
  "EPS (TTM)": "Earnings Per Share (trailing 12 months). Net profit divided by shares outstanding.",
  "P/S": "Price-to-Sales. Market cap divided by annual revenue. Useful when a company isn't yet profitable.",
  "P/S Ratio": "Price-to-Sales. Market cap divided by annual revenue. Useful when a company isn't yet profitable.",
  "P/B": "Price-to-Book. Market cap relative to net assets on the balance sheet. Under 1 may signal undervaluation.",
  "P/B Ratio": "Price-to-Book. Market cap relative to net assets on the balance sheet. Under 1 may signal undervaluation.",
  "PEG": "Price/Earnings-to-Growth. P/E adjusted for expected growth rate. Under 1 is often considered attractive.",
  "PEG Ratio": "Price/Earnings-to-Growth. P/E adjusted for expected growth rate. Under 1 is often considered attractive.",

  // Market & capital
  "Market Cap": "Total market value of all outstanding shares, equal to price multiplied by shares outstanding.",
  "52W Range": "The stock's highest and lowest closing price over the trailing 52 weeks.",

  // Risk
  "Beta 5Y": "5-year beta measures volatility relative to the broader market. 1.0 = moves with the market. Above 1 = more volatile.",
  "Beta (5Y)": "5-year beta measures volatility relative to the broader market. 1.0 = moves with the market. Above 1 = more volatile.",

  // Margins & returns
  "Net Margin": "Percentage of revenue that becomes net profit after all expenses and taxes.",
  "FCF Margin": "Free Cash Flow margin. Cash generated after capital expenditures, as a percentage of revenue.",
  "Gross Margin": "Revenue minus cost of goods sold, as a percentage of revenue.",
  "Operating Margin": "Operating profit as a percentage of revenue, before interest and taxes.",
  "EBITDA Margin": "Earnings before interest, taxes, depreciation, and amortization, as a percentage of revenue.",
  "ROIC": "Return on Invested Capital. Measures how efficiently the company converts invested capital into profit. Above 10% is generally strong.",
  "Return on Inv. Capital": "Return on Invested Capital. Measures how efficiently the company converts invested capital into profit. Above 10% is generally strong.",
  "ROE": "Return on Equity. Net income as a percentage of shareholder equity.",
  "Return on Equity (ROE)": "Net income as a percentage of shareholder equity. Measures how effectively management uses equity to generate profit.",
  "ROA": "Return on Assets. Net income relative to total assets, a measure of asset efficiency.",
  "Return on Assets (ROA)": "Net income relative to total assets. Measures how efficiently the company uses its assets to generate earnings.",
  "Asset Turnover": "Revenue divided by total assets. Shows how efficiently the company generates revenue from its asset base.",
  "Equity Multiplier": "Total assets divided by shareholder equity. A higher value indicates more financial leverage.",

  "WACC": "Weighted Average Cost of Capital. The estimated blended cost of equity and debt, used as a hurdle rate in valuation and capital allocation.",

  // Growth
  "YoY": "Year-over-Year. The percentage change compared to the same period a year ago.",
  "QoQ": "Quarter-over-Quarter. The percentage change compared to the immediately preceding quarter.",
  "TTM": "Trailing Twelve Months. A rolling 12-month window of the most recent available data.",
};

interface Props {
  term: string;
  definition?: string;
  /**
   * Renders this as the hover trigger instead of the "?" chip, for headers and
   * labels where an icon would crowd the row. A text trigger is hover-only and
   * not focusable, so it stays valid inside a decorative `aria-hidden` header
   * whose per-row cells already carry the same wording for screen readers.
   */
  children?: React.ReactNode;
  /**
   * @deprecated Positioning is now automatic and viewport-aware — the bubble
   * renders in a body-level portal, centers on the trigger, clamps to the
   * viewport, and flips above/below based on available room. Kept only so
   * existing call sites still type-check; the value is ignored.
   */
  align?: "left" | "right";
}

const BUBBLE_WIDTH = 208; // px — the resting bubble width (clamped to viewport)
const VIEWPORT_PAD = 8; // px — keep the bubble this far off any viewport edge
const TRIGGER_GAP = 8; // px — gap between the trigger and the bubble

interface BubblePosition {
  left: number;
  top: number;
  placement: "top" | "bottom";
  arrowLeft: number;
}

/**
 * A "?" affordance that reveals a definition on hover, keyboard focus, or tap.
 *
 * The bubble renders in a portal on `document.body` so it escapes any ancestor
 * with `overflow: hidden`/`clip` (dense list rows, dashboard cards) that would
 * otherwise clip it, and it is positioned in viewport coordinates: centered on
 * the trigger, clamped to the viewport horizontally, and flipped below the
 * trigger when there isn't room above. That makes it clip-proof regardless of
 * where the trigger sits — near a screen edge, deep in a scroll container, or
 * inside a transformed row.
 */
export function MetricTooltip({ term, definition, children }: Props) {
  const text = definition ?? METRIC_DEFINITIONS[term];

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const bubbleRef = React.useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [pos, setPos] = React.useState<BubblePosition | null>(null);
  const reactId = React.useId();
  const bubbleId = `metric-tip-${reactId}`;
  const open = hovered || focused;
  const portalTarget = typeof document === "undefined" ? null : document.body;

  const reposition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;
    const tr = trigger.getBoundingClientRect();
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const vw = document.documentElement.clientWidth;

    const triggerCenter = tr.left + tr.width / 2;
    const left = Math.max(
      VIEWPORT_PAD,
      Math.min(triggerCenter - bw / 2, vw - bw - VIEWPORT_PAD)
    );

    const placement: "top" | "bottom" =
      tr.top >= bh + TRIGGER_GAP + VIEWPORT_PAD ? "top" : "bottom";
    const top = placement === "top" ? tr.top - bh - TRIGGER_GAP : tr.bottom + TRIGGER_GAP;

    // Keep the arrow pointing at the trigger even after the bubble is clamped.
    const arrowLeft = Math.max(10, Math.min(triggerCenter - left, bw - 10));

    setPos({ left, top, placement, arrowLeft });
  }, []);

  // Measure once the bubble is in the DOM, and keep it pinned to the trigger
  // while open as the page scrolls or resizes (capture:true catches scrolls in
  // any nested container). useEffect (not useLayoutEffect) keeps this SSR-safe;
  // the bubble stays invisible until `pos` is set, so there's no flash.
  React.useEffect(() => {
    if (!open) return;

    reposition();
    const handle = () => reposition();
    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [open, reposition]);

  if (!text) return null;

  // The trigger often sits inside a larger clickable row, so clicks/keys are
  // stopped from bubbling to that parent.
  const swallow = (event: { stopPropagation: () => void }) => event.stopPropagation();

  const bubble =
    portalTarget && open
      ? createPortal(
          <span
            ref={bubbleRef}
            role="tooltip"
            id={bubbleId}
            style={{
              position: "fixed",
              left: pos ? pos.left : 0,
              top: pos ? pos.top : 0,
              width: `min(${BUBBLE_WIDTH}px, calc(100vw - ${VIEWPORT_PAD * 2}px))`,
              opacity: pos ? 1 : 0,
            }}
            className="pointer-events-none z-[100] rounded-[var(--radius-sm)] bg-[var(--home-ink)] px-3 py-2.5 text-2xs leading-snug text-[var(--home-paper)] shadow-[var(--shadow-md)] motion-safe:transition-opacity motion-safe:duration-150"
          >
            {text}
            {pos && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: pos.arrowLeft,
                  transform: "translateX(-50%)",
                  ...(pos.placement === "top" ? { top: "100%" } : { bottom: "100%" }),
                }}
                className={
                  pos.placement === "top"
                    ? "border-4 border-transparent border-t-[var(--home-ink)]"
                    : "border-4 border-transparent border-b-[var(--home-ink)]"
                }
              />
            )}
          </span>,
          portalTarget
        )
      : null;

  if (children !== undefined) {
    return (
      <>
        <span
          ref={(element) => {
            triggerRef.current = element;
          }}
          className="cursor-help underline decoration-dotted decoration-from-font underline-offset-[3px]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setPos(null);
          }}
        >
          {children}
        </span>
        {bubble}
      </>
    );
  }

  return (
    <span className="relative ml-0.5 inline-flex h-4 w-4 items-center align-middle">
      <button
        ref={(element) => {
          triggerRef.current = element;
        }}
        type="button"
        aria-label={`What is ${term}?`}
        aria-describedby={open ? bubbleId : undefined}
        onClick={swallow}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          if (!focused) setPos(null);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (!hovered) setPos(null);
        }}
        onKeyDown={(event) => {
          swallow(event);
          if (event.key === "Escape") {
            triggerRef.current?.blur();
          }
        }}
        className="pointer-events-auto absolute left-1/2 top-1/2 flex min-h-touch min-w-touch -translate-x-1/2 -translate-y-1/2 cursor-help items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-ink)]"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--home-paper-alt)] text-3xs font-bold leading-none text-[var(--home-ink-muted)] ring-1 ring-[var(--home-rule)]">
          ?
        </span>
      </button>
      {bubble}
    </span>
  );
}
