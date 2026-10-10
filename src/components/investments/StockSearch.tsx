"use client";

import { CircleAlert, Search } from "lucide-react";
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsClient } from "@/hooks/useIsClient";
import { getClientInvestmentsIndex } from "@/lib/investmentsClientData";
import type { InvestmentIndexEntry, InvestmentsIndex } from "@/types/investment";

interface Props {
  value: string;
  onChange: (symbol: string) => void;
}

const VALID_SYMBOL_PATTERN = /^[A-Z0-9.-]{1,10}$/;

function normalizeQuery(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreEntry(entry: InvestmentIndexEntry, query: string): number | null {
  const symbol = entry.symbol.toLowerCase();
  const shortName = entry.shortName.toLowerCase();
  const longName = entry.longName.toLowerCase();
  const searchText = entry.searchText.toLowerCase();

  if (symbol === query) return 0;
  if (symbol.startsWith(query)) return 1;
  if (shortName === query || longName === query) return 2;
  if (shortName.startsWith(query) || longName.startsWith(query)) return 3;
  if (query.length >= 2 && searchText.includes(query)) return 4;
  return null;
}

export function StockSearch({ value, onChange }: Props) {
  const [input, setInput] = useState(value);
  const [index, setIndex] = useState<InvestmentsIndex | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  // Hydration flag: a one-shot setState inside the first passive effect gets
  // dropped after hydration on this tree (React 19.2 + Next 16), which left
  // the portal permanently unrendered.
  const mounted = useIsClient();

  const debouncedInput = useDebounce(input, 200);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getClientInvestmentsIndex()
      .then((data) => {
        setIndex(data);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mirror controlled prop value into local input state when external value changes
    setInput(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const listbox = document.getElementById("stock-search-listbox");
      const target = e.target as Node;
      const insideInput = containerRef.current?.contains(target) ?? false;
      const insideDropdown = listbox?.contains(target) ?? false;

      if (!insideInput && !insideDropdown) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const normalizedQuery = normalizeQuery(debouncedInput);
  const upperSymbolCandidate = debouncedInput.trim().toUpperCase();
  const hasInput = normalizedQuery.length > 0;
  const entries = useMemo(() => index?.entries ?? [], [index]);

  const suggestions = useMemo(
    () =>
      normalizedQuery.length >= 1 && index
        ? [...entries]
            .map((entry) => ({
              entry,
              score: scoreEntry(entry, normalizedQuery),
            }))
            .filter(
              (item): item is { entry: InvestmentIndexEntry; score: number } =>
                item.score !== null
            )
            .sort((a, b) => {
              if (a.score !== b.score) return a.score - b.score;
              if (a.entry.symbol.length !== b.entry.symbol.length) {
                return a.entry.symbol.length - b.entry.symbol.length;
              }
              return a.entry.symbol.localeCompare(b.entry.symbol);
            })
            .map((item) => item.entry)
            .slice(0, 6)
        : [],
    [entries, index, normalizedQuery]
  );

  const exactSymbolEntry =
    entries.find((entry) => entry.symbol === upperSymbolCandidate) ?? null;

  const isSeededSymbol = !!exactSymbolEntry;

  const shouldShowCuratedOnlyHint =
    hasInput && index !== null && !isSeededSymbol && suggestions.length === 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset highlighted suggestion when the suggestion list changes
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();

    setDropdownStyle({
      position: "fixed",
      top: Math.round(rect.bottom + 6),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      // Above the terminal's sticky cells (z-index 4 at most), below the site overlays (55 and up).
      zIndex: 10,
    });
  }, []);

  useLayoutEffect(() => {
    if (!showDropdown) return;
    updateDropdownPosition();
  }, [showDropdown, suggestions.length, updateDropdownPosition]);

  useEffect(() => {
    if (!showDropdown) return;

    const handleReposition = () => updateDropdownPosition();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [showDropdown, updateDropdownPosition]);

  function selectEntry(entry: InvestmentIndexEntry) {
    setInput(entry.symbol);
    setShowDropdown(false);
    onChange(entry.symbol);
  }

  function submit(queryOverride?: string) {
    const candidate = (queryOverride ?? input).trim().toUpperCase();
    const highlightedSuggestion =
      activeIndex >= 0 && activeIndex < suggestions.length ? suggestions[activeIndex] : null;
    const exactCandidateEntry =
      entries.find((entry) => entry.symbol === candidate) ?? null;

    if (highlightedSuggestion) {
      selectEntry(highlightedSuggestion);
      return;
    }

    if (!candidate || !VALID_SYMBOL_PATTERN.test(candidate) || !exactCandidateEntry) {
      setInput(queryOverride ?? input);
      setShowDropdown(false);
      return;
    }

    setInput(candidate);
    setShowDropdown(false);
    onChange(candidate);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setShowDropdown(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (e.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      setShowDropdown(true);
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      submit(input);
      return;
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <label htmlFor="stock-search" className="sr-only">
        Search stock symbol
      </label>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--c97-label)]"
          style={{ left: "var(--c97-sp-2)" }}
        />

        <input
          ref={inputRef}
          id="stock-search"
          name="stock-search"
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            setTimeout(() => setShowDropdown(false), 100);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search symbol or company…"
          autoComplete="off"
          spellCheck={false}
          className="box-border w-full border-0 border-b border-[var(--c97-ink-2)] bg-[var(--c97-panel)] text-sm text-[var(--c97-ink)] transition placeholder:text-[var(--c97-label)] focus:border-[var(--c97-accent)]" style={{ minHeight: 44, paddingBlock: "var(--c97-sp-1)", paddingLeft: "var(--c97-sp-4)", paddingRight: "var(--c97-sp-2)" }}
          // aria-expanded and aria-activedescendant are only allowed on a combobox, not a plain textbox.
          role="combobox"
          aria-label="Search stock symbol"
          aria-autocomplete="list"
          aria-controls="stock-search-listbox"
          aria-activedescendant={
            showDropdown && activeIndex >= 0
              ? `stock-search-option-${suggestions[activeIndex]?.symbol}`
              : undefined
          }
          aria-expanded={showDropdown && suggestions.length > 0}
        />
      </div>

      {mounted &&
        showDropdown &&
        suggestions.length > 0 &&
        createPortal(
          // Portalled into the page root, not document.body, because the
          // --c97-* tokens only resolve inside it. The contents-only wrapper
          // gives the list paper tokens without painting a box of its own.
          <div data-c97-surface="paper" style={{ display: "contents" }}>
            <ul
              id="stock-search-listbox"
              role="listbox"
              aria-label="Symbol suggestions"
              style={dropdownStyle}
              className="m-0 list-none p-0 box-border overflow-hidden border border-[var(--c97-rule)] bg-[var(--c97-panel)]"
            >
            {suggestions.map((entry, indexPosition) => (
              <li key={entry.symbol} role="presentation">
                <button
                  id={`stock-search-option-${entry.symbol}`}
                  role="option"
                  aria-selected={indexPosition === activeIndex}
                  onMouseDown={() => selectEntry(entry)}
                  style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}
                  className={`flex min-h-[52px] w-full flex-col items-start justify-center text-left text-sm transition ${
                    indexPosition === activeIndex
                      ? "bg-[color-mix(in_srgb,var(--c97-accent)_14%,var(--c97-panel))] text-[var(--c97-ink)]"
                      : "text-[var(--c97-ink)] hover:bg-[color-mix(in_srgb,var(--c97-ink)_6%,var(--c97-panel))]"
                  }`}
                >
                  <span className="font-semibold">{entry.symbol}</span>
                  <span className="text-xs text-[var(--c97-ink-2)]">
                    {entry.longName !== entry.symbol ? entry.longName : entry.shortName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          </div>,
          document.querySelector(".c97-page") ?? document.body
        )}

      {shouldShowCuratedOnlyHint && (
        <p className="flex items-center text-xs text-[var(--c97-warning)]" style={{ gap: "var(--c97-sp-0)", marginTop: "var(--c97-sp-0)" }}>
          <CircleAlert size={13} />
          <span>
            My data covers a curated set of tickers only, so pick one from the suggestions.
          </span>
        </p>
      )}
    </div>
  );
}