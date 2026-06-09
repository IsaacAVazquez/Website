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
  const [text, setText] = useState(() => String(asPercent ? value * 100 : value));
  const [syncedValue, setSyncedValue] = useState(value);

  // Reflect *external* value changes (reset, portfolio seed) during render
  // without clobbering in-progress typing such as a trailing decimal point.
  if (value !== syncedValue) {
    setSyncedValue(value);
    const parsed = asPercent ? Number(text) / 100 : Number(text);
    if (Number.isNaN(parsed) || Math.abs(parsed - value) > 1e-9) {
      setText(String(asPercent ? value * 100 : value));
    }
  }

  function commit(raw: string) {
    setText(raw);
    if (raw.trim() === "" || raw === "-") return;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    let next = asPercent ? parsed / 100 : parsed;
    if (min !== undefined) next = Math.max(asPercent ? min / 100 : min, next);
    if (max !== undefined) next = Math.min(asPercent ? max / 100 : max, next);
    onChange(next);
  }

  return (
    <label className="invest-retire-field" htmlFor={id}>
      <span className="invest-retire-field-label">{label}</span>
      <span className="invest-retire-input-wrap">
        {prefix ? <span className="invest-retire-affix">{prefix}</span> : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={text}
          min={min}
          max={max}
          step={step}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setText(String(asPercent ? value * 100 : value))}
        />
        {suffix ? <span className="invest-retire-affix invest-retire-affix-suffix">{suffix}</span> : null}
      </span>
      {hint ? <span className="invest-retire-field-hint">{hint}</span> : null}
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
