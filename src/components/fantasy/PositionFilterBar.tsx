"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import { scrollChildIntoViewX } from "./scrollChildIntoViewX";

export interface PositionFilterOption<T extends string> {
  value: T;
  label: string;
  /** Snapshot position (e.g. "QB"), which gives the button its foot bar and its pressed sticker; omit for "All". */
  position?: string;
  /** When false the button is rendered disabled with an "NA" hint. */
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

const POSITION_CLASSES: Record<string, string> = {
  QB: "ffb-pos-qb",
  RB: "ffb-pos-rb",
  WR: "ffb-pos-wr",
  TE: "ffb-pos-te",
  K: "ffb-pos-k",
  DST: "ffb-pos-dst",
  FLEX: "ffb-pos-flex",
};

/** The kit class for an option: its position, or the flex thirds when the option is the flex board. */
function positionClass(option: PositionFilterOption<string>): string {
  const key = (option.position ?? option.value).toUpperCase();
  return POSITION_CLASSES[key] ?? "";
}

/**
 * The kit's position switch, shared by the rankings board, the best ball
 * board, the redraft room, and the mock draft. It is also the legend: each
 * position button carries its sticker colour as a foot bar, Flex carries RB,
 * WR, and TE in thirds, and the pressed position becomes a full sticker.
 *
 * One radiogroup with a roving tab stop. On a phone the eight buttons do not
 * fit, so the row scrolls sideways off the right edge, and the checked button
 * is brought into view whenever the value changes.
 */
export function PositionFilterBar<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: PositionFilterBarProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledIndexes = options
    .map((option, index) => (!disabled && option.available !== false ? index : -1))
    .filter((index) => index >= 0);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const tabStopIndex = enabledIndexes.includes(selectedIndex) ? selectedIndex : enabledIndexes[0];

  useEffect(() => {
    const group = groupRef.current;
    const checked = buttonRefs.current[selectedIndex];
    if (group && checked) scrollChildIntoViewX(group, checked);
  }, [selectedIndex]);

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
    <div ref={groupRef} role="radiogroup" aria-label={ariaLabel} className="ffb-seg ffb-seg-pos">
      {options.map((option, index) => {
        const isActive = option.value === value;
        const isUnavailable = option.available === false;
        const isDisabled = disabled || isUnavailable;

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
            className={`ffb-seg-btn ${positionClass(option)}`.trimEnd()}
          >
            <span>{option.label}</span>
            {isUnavailable && <span className="ffb-seg-na">NA</span>}
          </button>
        );
      })}
    </div>
  );
}
