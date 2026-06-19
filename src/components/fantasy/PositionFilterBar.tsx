"use client";

import type { CSSProperties } from "react";

import { getPositionTone } from "@/lib/fantasyUtils";

export interface PositionFilterOption<T extends string> {
  value: T;
  label: string;
  /** Snapshot position (e.g. "QB") used to tint the active pill; omit for "All". */
  position?: string;
  /** When false the pill is rendered disabled with a muted "NA" hint. */
  available?: boolean;
  /** Optional short reason shown in the title attribute when unavailable. */
  unavailableLabel?: string;
}

interface PositionFilterBarProps<T extends string> {
  options: PositionFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * The position pill row shared by the rankings board and the draft board. It was
 * duplicated (with near-identical styling) in both surfaces; consolidating keeps
 * the tones, touch targets, and a11y semantics from forking. On narrow screens
 * the row scroll-snaps horizontally instead of wrapping to three stacked rows.
 */
export function PositionFilterBar<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: PositionFilterBarProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const isUnavailable = option.available === false;
        const isDisabled = disabled || isUnavailable;

        let style: CSSProperties;
        if (isActive) {
          style = {
            borderColor: "var(--home-ink)",
            background: "var(--home-ink)",
            color: "var(--home-paper)",
          };
        } else if (isUnavailable) {
          style = {
            borderColor: "color-mix(in srgb, var(--color-warning) 30%, var(--home-rule))",
            background: "color-mix(in srgb, var(--color-warning) 8%, var(--home-paper))",
            color: "var(--home-ink-muted)",
          };
        } else {
          style = {
            borderColor: "var(--home-rule)",
            background: "color-mix(in srgb, var(--home-paper-alt) 52%, var(--home-elev-mix))",
            color: "var(--home-ink)",
            // A faint position tint on the inactive pill ties the control to the board.
            boxShadow: option.position
              ? `inset 0 0 0 999px ${getPositionTone(option.position).background as string}`
              : undefined,
          };
        }

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={
              isUnavailable
                ? `${option.label} — ${option.unavailableLabel ?? "not available"}`
                : option.label
            }
            title={isUnavailable ? option.unavailableLabel : undefined}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(option.value)}
            className="inline-flex min-h-touch shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
            style={style}
          >
            <span>{option.label}</span>
            {isUnavailable && (
              <span className="text-2xs font-semibold uppercase tracking-[0.12em] opacity-80">
                NA
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
