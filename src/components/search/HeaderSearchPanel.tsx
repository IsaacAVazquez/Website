"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "@/components/ui/ServerIcons";
import { useDebounce } from "@/hooks/useDebounce";
import { trackNavigationClick } from "@/lib/analytics";

interface HeaderSearchResult {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  type: "post" | "project" | "page";
  category?: string;
}

interface HeaderSearchPanelProps {
  /** Called to dismiss the panel. The panel is mounted only while open, so the
   *  parent controls visibility by conditionally rendering this component. */
  onClose: () => void;
}

const TYPE_LABELS: Record<HeaderSearchResult["type"], string> = {
  project: "Project",
  post: "Writing",
  page: "Page",
};

const RESULT_LIMIT = 6;

/**
 * The in-header search dropdown. Typing runs a debounced query against
 * /api/search and shows the top results inline; Enter (or "View all results")
 * hands off to the dedicated /search page, which remains the full-results
 * fallback. Opened by the header's search buttons and the ⌘K / "/" shortcuts.
 */
export function HeaderSearchPanel({ onClose }: HeaderSearchPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HeaderSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebounce(query.trim(), 220);
  const hasQuery = debouncedQuery.length > 0;

  // Focus the input once the panel mounts.
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, []);

  // Fetch logic lives in a callback so the effect body only invokes it (keeps
  // the data-fetch setState out of the effect body itself).
  const runSearch = useCallback(async (term: string, signal: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(term)}&limit=${RESULT_LIMIT}`,
        { signal }
      );
      if (!response.ok) throw new Error(`search failed: ${response.status}`);
      const data: { results?: HeaderSearchResult[]; total?: number } = await response.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setActiveIndex(-1);
    } catch (error) {
      if ((error as { name?: string })?.name !== "AbortError") {
        setResults([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasQuery) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Debounced search on query change; runSearch updates loading/results state internally
    runSearch(debouncedQuery, controller.signal);
    return () => controller.abort();
  }, [hasQuery, debouncedQuery, runSearch]);

  const allResultsHref = useMemo(
    () => (hasQuery ? `/search?q=${encodeURIComponent(debouncedQuery)}` : "/search"),
    [hasQuery, debouncedQuery]
  );

  const goToAllResults = useCallback(() => {
    trackNavigationClick({
      link_text: "View all results",
      link_url: allResultsHref,
      nav_location: "header_search_view_all",
    });
    router.push(allResultsHref);
    onClose();
  }, [allResultsHref, onClose, router]);

  const goToResult = useCallback(
    (result: HeaderSearchResult) => {
      trackNavigationClick({
        link_text: result.title,
        link_url: result.url,
        nav_location: "header_search_result",
      });
      router.push(result.url);
      onClose();
    },
    [onClose, router]
  );

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setQuery(next);
    if (!next.trim()) {
      setResults([]);
      setTotal(0);
      setActiveIndex(-1);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (results.length ? (current + 1) % results.length : -1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current - 1 + results.length) % results.length : -1
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        goToResult(results[activeIndex]);
      } else if (hasQuery) {
        goToAllResults();
      }
    }
  };

  return (
    <div className="absolute inset-x-0 top-full z-50">
      {/* Click-catcher closes the panel; the panel sits above it. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 -z-10 cursor-default bg-[var(--home-overlay)]"
      />
      <div className="page-shell">
        <div
          className="mt-2 overflow-hidden rounded-2xl border header-home-menu"
          role="dialog"
          aria-label="Site search"
        >
          <div className="flex items-center gap-2 border-b px-3" style={{ borderColor: "var(--home-rule)" }}>
            <Search className="h-4 w-4 shrink-0 text-[var(--home-ink-muted)]" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder="Search projects, writing, tools…"
              aria-label="Search the site"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={listboxId}
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
              }
              autoComplete="off"
              className="min-h-[48px] w-full bg-transparent py-3 text-base outline-none placeholder:text-[var(--home-ink-muted)]"
              style={{ color: "var(--home-ink)" }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--home-paper-alt)]"
              style={{ color: "var(--home-ink-muted)" }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {hasQuery && loading && results.length === 0 && (
              <p className="px-4 py-6 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                Searching…
              </p>
            )}

            {hasQuery && !loading && results.length === 0 && (
              <p className="px-4 py-6 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                No results for “{debouncedQuery}”.
              </p>
            )}

            {!hasQuery && (
              <p className="px-4 py-6 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                Search projects, writing, and tools. Press Esc to close.
              </p>
            )}

            {results.length > 0 && (
              <ul id={listboxId} role="listbox" aria-label="Search results" className="py-1">
                {results.map((result, index) => (
                  <li
                    key={result.id}
                    role="option"
                    id={`${listboxId}-option-${index}`}
                    aria-selected={index === activeIndex}
                  >
                    <Link
                      href={result.url}
                      onClick={() => goToResult(result)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                      style={
                        index === activeIndex
                          ? { background: "color-mix(in srgb, var(--home-acid) 18%, var(--home-paper))" }
                          : undefined
                      }
                    >
                      <span
                        className="shrink-0 rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-[0.08em]"
                        style={{
                          borderColor: "var(--home-rule)",
                          color: "var(--home-ink-muted)",
                          background: "var(--home-paper-alt)",
                        }}
                      >
                        {TYPE_LABELS[result.type]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold" style={{ color: "var(--home-ink)" }}>
                          {result.title}
                        </span>
                        {result.category && (
                          <span className="block truncate text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                            {result.category}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {hasQuery && (
              <button
                type="button"
                onClick={goToAllResults}
                className="flex w-full items-center justify-between border-t px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--home-paper-alt)]"
                style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
              >
                <span>View all results{total > results.length ? ` (${total})` : ""}</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
