"use client";

import React, { useState, useEffect, useRef } from "react";
import { IconSearch, IconAlertCircle } from "@tabler/icons-react";
import { useDebounce } from "@/hooks/useDebounce";
import type { InvestmentsIndex } from "@/types/investment";

interface Props {
  value: string;
  onChange: (symbol: string) => void;
}

export function StockSearch({ value, onChange }: Props) {
  const [input, setInput] = useState(value);
  const [index, setIndex] = useState<InvestmentsIndex | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedInput = useDebounce(input, 200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load pre-fetched index once (served directly from public/)
  useEffect(() => {
    fetch("/data/investments/index.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setIndex(data); })
      .catch(() => null);
  }, []);

  // Sync external value → input
  useEffect(() => { setInput(value); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const upper = debouncedInput.trim().toUpperCase();
  const suggestions =
    upper.length >= 1 && index
      ? index.symbols.filter((s) => s.startsWith(upper) && s !== upper).slice(0, 6)
      : [];

  const isNotFetched =
    upper.length > 0 && index !== null && !index.symbols.includes(upper);

  function submit(sym: string) {
    const s = sym.trim().toUpperCase();
    if (!s) return;
    setInput(s);
    setShowDropdown(false);
    onChange(s);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit(input);
    if (e.key === "Escape") setShowDropdown(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <label htmlFor="stock-search" className="sr-only">Search stock symbol</label>
      <div className="relative">
        <IconSearch
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
        />
        <input
          id="stock-search"
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search symbol… (e.g. AAPL)"
          autoComplete="off"
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition"
          aria-label="Search stock symbol"
          aria-autocomplete="list"
          aria-controls="stock-search-listbox"
          aria-expanded={showDropdown && suggestions.length > 0}
        />
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <ul
          id="stock-search-listbox"
          role="listbox"
          aria-label="Symbol suggestions"
          className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-elevated)] shadow-lg overflow-hidden"
        >
          {suggestions.map((sym) => (
            <li key={sym}>
              <button
                role="option"
                aria-selected={sym === upper}
                onMouseDown={() => submit(sym)}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition min-h-[44px] flex items-center"
              >
                {sym}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Not pre-fetched warning */}
      {isNotFetched && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-warning)]">
          <IconAlertCircle size={13} />
          <span>
            {upper} isn&apos;t in the research database. Available stocks: AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, BRK-B, JPM, V
          </span>
        </p>
      )}
    </div>
  );
}
