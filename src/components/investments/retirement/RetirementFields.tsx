"use client";

import React, { useId, useState } from "react";

// ─── Numeric field with optional prefix/suffix ───────────────────────────────

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  /** Treat the value as a percent (display value × 100, store ÷ 100). */
  asPercent?: boolean;
}

/**
 * Render a stored value for the text buffer. Rounding strips float artifacts
 * (a stored 6.6% hydrates as 0.066, and 0.066 * 100 === 6.600000000000001)
 * without losing legitimate precision.
 */
function displayValue(value: number, asPercent: boolean): string {
  const display = asPercent ? value * 100 : value;
  return String(parseFloat(display.toFixed(6)));
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step,
  hint,
  asPercent = false,
}: NumberFieldProps) {
  const id = useId();
  // Local text buffer so the field can be cleared/typed without snapping.
  const [text, setText] = useState(() => displayValue(value, asPercent));
  const [syncedValue, setSyncedValue] = useState(value);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const parsedText = Number(text);
  const clamp = (number: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, number));
  const invalid = text.trim() === "" || !Number.isFinite(parsedText) || clamp(parsedText) !== parsedText;
  const rangeMessage = min !== undefined && max !== undefined
    ? `Enter a number from ${min} to ${max}.`
    : min !== undefined
      ? `Enter ${min} or more.`
      : max !== undefined
        ? `Enter ${max} or less.`
        : "Enter a number.";

  // Reflect *external* value changes (reset, portfolio seed) during render
  // without clobbering in-progress typing such as a trailing decimal point.
  if (value !== syncedValue) {
    setSyncedValue(value);
    const parsed = asPercent ? Number(text) / 100 : Number(text);
    if (Number.isNaN(parsed) || Math.abs(parsed - value) > 1e-9) {
      setText(displayValue(value, asPercent));
    }
  }

  function commit(raw: string) {
    setText(raw);
    if (raw.trim() === "" || raw === "-") return;
    const parsed = Number(raw);
    // A first digit can be outside the range while the finished number is valid.
    // Keep that draft until blur, without changing the saved plan mid-entry.
    if (!Number.isFinite(parsed) || clamp(parsed) !== parsed) return;
    onChange(asPercent ? parsed / 100 : parsed);
  }

  return (
    <label className="invest-retire-field" htmlFor={id}>
      <span id={`${id}-label`} className="invest-retire-field-label">{label}</span>
      <span className="invest-retire-input-wrap">
        {prefix ? <span className="invest-retire-affix">{prefix}</span> : null}
        <input
          id={id}
          aria-labelledby={`${id}-label`}
          type="number"
          inputMode="decimal"
          value={text}
          min={min}
          max={max}
          step={step}
          aria-invalid={invalid || undefined}
          aria-describedby={[hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(" ") || undefined}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => {
            if (text.trim() === "" || !Number.isFinite(parsedText)) {
              setText(displayValue(value, asPercent));
            } else if (clamp(parsedText) !== parsedText) {
              const next = asPercent ? clamp(parsedText) / 100 : clamp(parsedText);
              onChange(next);
              setText(displayValue(next, asPercent));
            } else {
              setText(displayValue(value, asPercent));
            }
          }}
        />
        {suffix ? <span className="invest-retire-affix invest-retire-affix-suffix">{suffix}</span> : null}
      </span>
      {hint ? <span id={hintId} className="invest-retire-field-hint">{hint}</span> : null}
      {invalid ? (
        <span id={errorId} className="invest-retire-field-hint" style={{ color: "var(--c97-negative)" }}>
          {text.trim() === "" ? "Enter a number, or leave the field to keep the saved value." : `${rangeMessage} It will adjust when you leave the field.`}
        </span>
      ) : null}
    </label>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <label className="invest-retire-field" htmlFor={id}>
      <span className="invest-retire-field-label">{label}</span>
      <span className="invest-retire-input-wrap">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
      {hint ? <span className="invest-retire-field-hint">{hint}</span> : null}
    </label>
  );
}

// ─── Collapsible advanced section (progressive disclosure) ───────────────────

interface CollapsibleProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Collapsible({ title, summary, defaultOpen = false, children }: CollapsibleProps) {
  return (
    <details className="invest-retire-disclose" open={defaultOpen}>
      <summary>
        <span className="invest-retire-disclose-title">{title}</span>
        {summary ? <span className="invest-retire-disclose-summary">{summary}</span> : null}
        <span className="invest-retire-disclose-chevron" aria-hidden="true">＋</span>
      </summary>
      <div className="invest-retire-disclose-body">{children}</div>
    </details>
  );
}
