"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";

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
 * the tones, touch targets, and a11y semantics from forking.
 *
 * The row wraps at every width. It used to scroll horizontally below `sm` with
 * its scrollbar suppressed, which put Flex, K, and DST off screen at 390px with
 * no fade and no chevron, so three of eight boards were undiscoverable. Eight
 * 44px pills wrap into two rows at 390px, which removes the discovery problem
 * outright and needs no scroll state.
 */
export function PositionFilterBar<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: PositionFilterBarProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledIndexes = options
    .map((option, index) => (!disabled && option.available !== false ? index : -1))
    .filter((index) => index >= 0);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const tabStopIndex = enabledIndexes.includes(selectedIndex) ? selectedIndex : enabledIndexes[0];

  function handleRadioKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }
    if (enabledIndexes.length === 0) return;

    event.preventDefault();
    const currentEnabledIndex = enabledIndexes.indexOf(currentIndex);
    const fallbackIndex = currentEnabledIndex >= 0 ? currentEnabledIndex : 0;
    let nextEnabledIndex: number;

    if (event.key === "Home") nextEnabledIndex = 0;
    else if (event.key === "End") nextEnabledIndex = enabledIndexes.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextEnabledIndex = (fallbackIndex + 1) % enabledIndexes.length;
    } else {
      nextEnabledIndex = (fallbackIndex - 1 + enabledIndexes.length) % enabledIndexes.length;
    }

    const nextIndex = enabledIndexes[nextEnabledIndex];
    const nextOption = options[nextIndex];
    buttonRefs.current[nextIndex]?.focus();
    onChange(nextOption.value);
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="-mx-1 flex flex-wrap gap-2 px-1 pb-1 sm:mx-0 sm:px-0 sm:pb-0"
    >
      {options.map((option, index) => {
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
            borderColor: "color-mix(in srgb, var(--home-warning) 30%, var(--home-rule))",
            background: "color-mix(in srgb, var(--home-warning) 8%, var(--home-paper))",
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
                ? `${option.label}, ${option.unavailableLabel ?? "not available"}`
                : option.label
            }
            title={isUnavailable ? option.unavailableLabel : undefined}
            disabled={isDisabled}
            tabIndex={index === tabStopIndex ? 0 : -1}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            onClick={() => !isDisabled && onChange(option.value)}
            onKeyDown={(event) => handleRadioKeyDown(event, index)}
            className="inline-flex min-h-touch min-w-touch shrink-0 items-center justify-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
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
