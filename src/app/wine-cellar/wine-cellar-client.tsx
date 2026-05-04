"use client";

import { type FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bookmark,
  Filter,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Wine,
  X,
} from "lucide-react";
import {
  fadeInVariants,
  getReducedMotionVariants,
} from "@/components/investments/animations";
import {
  DEFAULT_WINE_FILTERS,
  WINE_TYPES,
  WINE_TYPE_LABELS,
  getTodayIsoDate,
  type WineDraft,
  type WineSortKey,
} from "@/lib/wineCellar";
import { useWineCellar } from "@/hooks/useWineCellar";
import type { WineEntry, WineType } from "@/types/wine";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

interface WineFormDraft {
  name: string;
  producer: string;
  vintage: string;
  region: string;
  varietal: string;
  type: WineType;
  price: string;
  rating: string;
  notes: string;
  tastedOn: string;
}

function createEmptyFormDraft(): WineFormDraft {
  return {
    name: "",
    producer: "",
    vintage: "",
    region: "",
    varietal: "",
    type: "red",
    price: "",
    rating: "4",
    notes: "",
    tastedOn: getTodayIsoDate(),
  };
}

function entryToFormDraft(entry: WineEntry): WineFormDraft {
  return {
    name: entry.name,
    producer: entry.producer,
    vintage: entry.vintage === null ? "" : String(entry.vintage),
    region: entry.region,
    varietal: entry.varietal,
    type: entry.type,
    price: entry.price === null ? "" : String(entry.price),
    rating: String(entry.rating),
    notes: entry.notes,
    tastedOn: entry.tastedOn,
  };
}

function parseNumberInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formDraftToWineDraft(draft: WineFormDraft): WineDraft {
  return {
    name: draft.name,
    producer: draft.producer,
    vintage: parseNumberInput(draft.vintage),
    region: draft.region,
    varietal: draft.varietal,
    type: draft.type,
    price: parseNumberInput(draft.price),
    rating: parseNumberInput(draft.rating) ?? 0,
    notes: draft.notes,
    tastedOn: draft.tastedOn,
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

const TASTED_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatTastedDate(iso: string) {
  const date = new Date(`${iso}T00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : TASTED_DATE_FORMATTER.format(date);
}

function StarRating({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  const totalStars = 5;
  const sizeClass = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div
      className="inline-flex items-center gap-0.5 text-[var(--home-haze)]"
      aria-label={`${value} out of ${totalStars} stars`}
      role="img"
    >
      {Array.from({ length: totalStars }).map((_, idx) => {
        const isFull = idx < fullStars;
        const isHalf = !isFull && idx === fullStars && hasHalf;
        return (
          <Star
            key={idx}
            aria-hidden="true"
            className={`${sizeClass} ${
              isFull
                ? "fill-current"
                : isHalf
                  ? "fill-current opacity-60"
                  : "opacity-25"
            }`}
          />
        );
      })}
    </div>
  );
}

const SORT_OPTIONS: Array<{ value: WineSortKey; label: string }> = [
  { value: "tastedOn", label: "Date tasted" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
];

const FORM_INPUT_CLASS =
  "mt-2 min-h-touch w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2";
const FORM_LABEL_CLASS =
  "text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]";

export function WineCellarClient() {
  const {
    entries,
    visibleEntries,
    summary,
    filters,
    updateFilters,
    resetFilters,
    addEntry,
    updateEntry,
    removeEntry,
    findEntry,
  } = useWineCellar();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDraft, setFormDraft] = useState<WineFormDraft>(() =>
    createEmptyFormDraft()
  );
  const shouldReduceMotion = useReducedMotion();
  const motionVariants = shouldReduceMotion
    ? getReducedMotionVariants().fadeInVariants
    : fadeInVariants;

  function resetForm() {
    setEditingId(null);
    setFormDraft(createEmptyFormDraft());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formDraft.name.trim()) return;
    const wineDraft = formDraftToWineDraft(formDraft);
    if (editingId) {
      updateEntry(editingId, wineDraft);
    } else {
      addEntry(wineDraft);
    }
    resetForm();
  }

  function handleEdit(id: string) {
    const entry = findEntry(id);
    if (!entry) return;
    setEditingId(id);
    setFormDraft(entryToFormDraft(entry));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleDelete(id: string) {
    removeEntry(id);
    if (editingId === id) resetForm();
  }

  const hasEntries = entries.length > 0;
  const hasVisibleEntries = visibleEntries.length > 0;
  const filtersAreActive =
    filters.search !== DEFAULT_WINE_FILTERS.search ||
    filters.type !== DEFAULT_WINE_FILTERS.type ||
    filters.minRating !== DEFAULT_WINE_FILTERS.minRating ||
    filters.sort !== DEFAULT_WINE_FILTERS.sort ||
    filters.sortDirection !== DEFAULT_WINE_FILTERS.sortDirection;

  const lastLoggedDate = useMemo(() => {
    if (!hasEntries) return null;
    return summary.recent[0]?.tastedOn ?? null;
  }, [hasEntries, summary.recent]);

  const recentFiveStars = useMemo(
    () =>
      [...entries]
        .filter((entry) => entry.rating >= 4.5)
        .sort((a, b) => b.tastedOn.localeCompare(a.tastedOn))
        .slice(0, 5),
    [entries]
  );

  const favoriteType = summary.typeBreakdown[0]?.type ?? null;

  const wineStatsCells: HomeStatsCell[] = [
    {
      label: "Bottles logged",
      value: hasEntries ? summary.totalWines.toLocaleString() : "—",
    },
    {
      label: "Average rating",
      value: hasEntries ? summary.averageRating.toFixed(1) : "—",
      sub: hasEntries ? "Across the cellar" : "Add a bottle to start",
    },
    {
      label: "Cellar spend",
      value: summary.totalSpend > 0 ? formatCurrency(summary.totalSpend) : "—",
    },
    {
      label: "Top region",
      value: summary.topRegion ?? "—",
    },
    {
      label: "Top varietal",
      value: summary.topVarietal ?? "—",
    },
    {
      label: "Recent five-stars",
      value: recentFiveStars.length.toLocaleString(),
      tone: recentFiveStars.length > 0 ? "good" : "default",
    },
    {
      label: "Favorite type",
      value: favoriteType ? WINE_TYPE_LABELS[favoriteType] : "—",
    },
    {
      label: "Last logged",
      value: lastLoggedDate ? formatTastedDate(lastLoggedDate) : "—",
    },
  ];

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--home-haze)_11%,transparent),transparent_30%),linear-gradient(180deg,color-mix(in_srgb,var(--home-paper-alt)_88%,var(--home-paper))_0%,var(--home-paper)_100%)]"
      aria-label="Wine cellar workspace"
      data-testid="wine-cellar-shell"
    >
      <div className="mx-auto w-full max-w-[1680px] px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 xl:px-10 2xl:px-12">
        <motion.div
          variants={motionVariants}
          initial="hidden"
          animate="visible"
          className="tool-page-stack"
        >
          <div className="tool-shell" data-testid="wine-cellar-tool-shell">
            <aside className="tool-sidebar" aria-label="Wine cellar navigation">
              <div className="tool-brand">
                <div className="tool-brand-mark" aria-hidden="true">
                  <Wine className="h-4 w-4" />
                </div>
                <div className="tool-brand-name">
                  Wine Cellar
                  <small>Personal log</small>
                </div>
              </div>

              <nav className="flex flex-col gap-1.5" aria-label="Section navigation">
                <a href="#cellar" className="tool-nav-link">
                  <Wine aria-hidden="true" />
                  Cellar
                  {hasEntries ? (
                    <span className="tool-nav-pill">{entries.length}</span>
                  ) : null}
                </a>
                <a href="#stats" className="tool-nav-link">
                  <Star aria-hidden="true" />
                  Stats
                </a>
                <a href="#filters" className="tool-nav-link">
                  <Filter aria-hidden="true" />
                  Search & filter
                </a>
              </nav>

              <div className="tool-sidebar-footer">
                <Bookmark size={16} aria-hidden="true" />
                <span>Saved in your browser</span>
              </div>
            </aside>

            <main className="tool-main" id="cellar">
              <div className="tool-topbar">
                <div>
                  <p className="tool-crumbs">
                    Wine Cellar / <strong>Cellar</strong>
                  </p>
                  <h1>Wine Cellar</h1>
                </div>

                <label className="tool-search" aria-label="Search wines">
                  <Search size={14} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search by name, region, or notes…"
                    value={filters.search}
                    onChange={(event) =>
                      updateFilters((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="tool-meta-chip" role="status" aria-live="polite">
                <span className="tool-meta-chip-dot" aria-hidden="true" />
                <span>
                  <strong>
                    {hasEntries ? entries.length : "—"}
                  </strong>{" "}
                  {hasEntries && entries.length === 1 ? "bottle" : "bottles"}
                </span>
                <span className="tool-meta-chip-divider" aria-hidden="true">
                  ·
                </span>
                <span>
                  avg rating{" "}
                  <strong>
                    {hasEntries ? summary.averageRating.toFixed(1) : "—"}
                  </strong>
                </span>
                <span className="tool-meta-chip-divider" aria-hidden="true">
                  ·
                </span>
                <span>
                  last logged{" "}
                  <strong>
                    {lastLoggedDate ? formatTastedDate(lastLoggedDate) : "—"}
                  </strong>
                </span>
                <span className="tool-meta-chip-spacer" />
                <span className="tool-meta-chip-meta">Local browser only</span>
              </div>

              <div className="mt-5 flex flex-col gap-5">
                <div id="stats" className="scroll-mt-28">
                  <HomeStatsPanel
                    id="wine-cellar-stats"
                    title="Cellar at a glance"
                    meta={lastLoggedDate ? `Last logged ${formatTastedDate(lastLoggedDate)}` : "No bottles yet"}
                    hideLiveDot
                    cells={wineStatsCells}
                    pills={[
                      { label: "All bottles", href: "#cellar" },
                      { label: "By region", href: "#filters" },
                      { label: "By varietal", href: "#filters" },
                      { label: "Reset filters", href: "#filters" },
                    ]}
                  />
                </div>

                {/* Filter / sort strip */}
                <section
                  id="filters"
                  className="tool-card scroll-mt-28"
                  aria-label="Filter tasting log"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
                    <label className="block">
                      <span className={FORM_LABEL_CLASS}>Type</span>
                      <select
                        aria-label="Filter by wine type"
                        value={filters.type}
                        onChange={(event) =>
                          updateFilters((current) => ({
                            ...current,
                            type: event.target.value as typeof current.type,
                          }))
                        }
                        className={FORM_INPUT_CLASS}
                      >
                        <option value="all">All types</option>
                        {WINE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {WINE_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className={FORM_LABEL_CLASS}>Min rating</span>
                      <select
                        aria-label="Minimum rating"
                        value={String(filters.minRating)}
                        onChange={(event) =>
                          updateFilters((current) => ({
                            ...current,
                            minRating: Number(event.target.value),
                          }))
                        }
                        className={FORM_INPUT_CLASS}
                      >
                        <option value="0">Any</option>
                        <option value="3">3+ stars</option>
                        <option value="3.5">3.5+ stars</option>
                        <option value="4">4+ stars</option>
                        <option value="4.5">4.5+ stars</option>
                        <option value="5">5 stars only</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={FORM_LABEL_CLASS}>Sort by</span>
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          aria-label="Sort by"
                          value={filters.sort}
                          onChange={(event) =>
                            updateFilters((current) => ({
                              ...current,
                              sort: event.target.value as WineSortKey,
                            }))
                          }
                          className="min-h-touch flex-1 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
                        >
                          {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          aria-label={`Sort ${filters.sortDirection === "asc" ? "ascending" : "descending"}`}
                          onClick={() =>
                            updateFilters((current) => ({
                              ...current,
                              sortDirection:
                                current.sortDirection === "asc" ? "desc" : "asc",
                            }))
                          }
                          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm font-semibold text-[var(--home-ink)] hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                        >
                          {filters.sortDirection === "asc" ? "↑" : "↓"}
                        </button>
                      </div>
                    </label>
                  </div>
                  {filtersAreActive ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-1.5 text-xs font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
                    >
                      <Filter className="h-3 w-3" />
                      Reset filters
                    </button>
                  ) : null}
                </section>

                {/* Tasting log */}
                <section
                  className="tool-card scroll-mt-28"
                  aria-label="Tasting log"
                >
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="tool-section-kicker">Cellar</p>
                      <h2 className="tool-section-title">Tasting log</h2>
                    </div>
                    {hasEntries ? (
                      <p className="rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-1 text-xs font-semibold text-[var(--home-ink-muted)]">
                        {visibleEntries.length} of {entries.length}
                      </p>
                    ) : null}
                  </div>

                  {!hasEntries ? (
                    <div className="tool-empty">
                      <Wine
                        className="mx-auto h-7 w-7 text-[var(--home-haze)]"
                        aria-hidden="true"
                      />
                      <p className="mt-3 text-sm font-semibold text-[var(--home-ink)]">
                        Your cellar is empty
                      </p>
                      <p>Add your first bottle from the rail →</p>
                    </div>
                  ) : !hasVisibleEntries ? (
                    <div className="tool-empty">
                      <p className="text-sm font-semibold text-[var(--home-ink)]">
                        No bottles match these filters
                      </p>
                      <p>Try widening your search or reset filters.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {visibleEntries.map((entry) => (
                        <li
                          key={entry.id}
                          className={`rounded-[18px] border bg-[var(--home-paper)] px-4 py-4 transition ${
                            editingId === entry.id
                              ? "border-[var(--home-haze)] shadow-[var(--shadow-sm)]"
                              : "border-[var(--home-rule)]"
                          }`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <p className="text-base font-semibold text-[var(--home-ink)]">
                                  {entry.name}
                                </p>
                                {entry.vintage ? (
                                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                                    {entry.vintage}
                                  </span>
                                ) : null}
                              </div>
                              {entry.producer ? (
                                <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
                                  {entry.producer}
                                </p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                                  {WINE_TYPE_LABELS[entry.type]}
                                </span>
                                {entry.region ? (
                                  <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                                    {entry.region}
                                  </span>
                                ) : null}
                                {entry.varietal ? (
                                  <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                                    {entry.varietal}
                                  </span>
                                ) : null}
                                <span
                                  className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]"
                                  title={entry.tastedOn}
                                >
                                  {formatTastedDate(entry.tastedOn)}
                                </span>
                                {entry.price !== null ? (
                                  <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                                    {formatCurrency(entry.price)}
                                  </span>
                                ) : null}
                              </div>
                              {entry.notes ? (
                                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--home-ink)]">
                                  {entry.notes}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex flex-col items-end gap-3 sm:min-w-[120px]">
                              <div className="flex flex-col items-end gap-1">
                                <p className="text-lg font-semibold text-[var(--home-ink)]">
                                  {entry.rating.toFixed(1)}
                                </p>
                                <StarRating value={entry.rating} />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  aria-label={`Edit ${entry.name}`}
                                  onClick={() => handleEdit(entry.id)}
                                  className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-xs font-semibold text-[var(--home-ink-muted)] hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Delete ${entry.name}`}
                                  onClick={() => handleDelete(entry.id)}
                                  className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-xs font-semibold text-[var(--home-ink-muted)] hover:border-[var(--home-ink)] hover:text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </main>

            <aside className="tool-rail" aria-label="Wine cellar side panel">
              <section id="add-tasting">
                <p className="tool-rail-label">
                  <Wine size={12} aria-hidden="true" />
                  {editingId ? "Edit bottle" : "Log a bottle"}
                </p>
                <form onSubmit={handleSubmit} className="grid gap-3">
                  <label className="block">
                    <span className={FORM_LABEL_CLASS}>Wine name</span>
                    <input
                      aria-label="Wine name"
                      required
                      type="text"
                      value={formDraft.name}
                      onChange={(event) =>
                        setFormDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="2018 Brunello di Montalcino"
                      className={FORM_INPUT_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className={FORM_LABEL_CLASS}>Producer</span>
                    <input
                      aria-label="Producer"
                      type="text"
                      value={formDraft.producer}
                      onChange={(event) =>
                        setFormDraft((current) => ({
                          ...current,
                          producer: event.target.value,
                        }))
                      }
                      placeholder="Biondi-Santi"
                      className={FORM_INPUT_CLASS}
                    />
                  </label>
                  <div className="grid gap-3 grid-cols-2">
                    <label className="block">
                      <span className={FORM_LABEL_CLASS}>Vintage</span>
                      <input
                        aria-label="Vintage"
                        type="number"
                        min="1800"
                        max="2100"
                        step="1"
                        value={formDraft.vintage}
                        onChange={(event) =>
                          setFormDraft((current) => ({
                            ...current,
                            vintage: event.target.value,
                          }))
                        }
                        placeholder="2018"
                        className={FORM_INPUT_CLASS}
                      />
                    </label>
                    <label className="block">
                      <span className={FORM_LABEL_CLASS}>Type</span>
                      <select
                        aria-label="Wine type"
                        value={formDraft.type}
                        onChange={(event) =>
                          setFormDraft((current) => ({
                            ...current,
                            type: event.target.value as WineType,
                          }))
                        }
                        className={FORM_INPUT_CLASS}
                      >
                        {WINE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {WINE_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className={FORM_LABEL_CLASS}>Region</span>
                    <input
                      aria-label="Region"
                      type="text"
                      value={formDraft.region}
                      onChange={(event) =>
                        setFormDraft((current) => ({
                          ...current,
                          region: event.target.value,
                        }))
                      }
                      placeholder="Tuscany"
                      className={FORM_INPUT_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className={FORM_LABEL_CLASS}>Varietal / grape</span>
                    <input
                      aria-label="Varietal"
                      type="text"
                      value={formDraft.varietal}
                      onChange={(event) =>
                        setFormDraft((current) => ({
                          ...current,
                          varietal: event.target.value,
                        }))
                      }
                      placeholder="Sangiovese"
                      className={FORM_INPUT_CLASS}
                    />
                  </label>
                  <div className="grid gap-3 grid-cols-2">
                    <label className="block">
                      <span className={FORM_LABEL_CLASS}>Price (USD)</span>
                      <input
                        aria-label="Price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formDraft.price}
                        onChange={(event) =>
                          setFormDraft((current) => ({
                            ...current,
                            price: event.target.value,
                          }))
                        }
                        placeholder="48"
                        className={FORM_INPUT_CLASS}
                      />
                    </label>
                    <label className="block">
                      <span className={FORM_LABEL_CLASS}>Tasted on</span>
                      <input
                        aria-label="Tasted on"
                        type="date"
                        value={formDraft.tastedOn}
                        onChange={(event) =>
                          setFormDraft((current) => ({
                            ...current,
                            tastedOn: event.target.value,
                          }))
                        }
                        className={FORM_INPUT_CLASS}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      <span>Rating</span>
                      <span className="flex items-center gap-2 text-[var(--home-ink)]">
                        {Number(formDraft.rating || 0).toFixed(1)}
                        <StarRating value={Number(formDraft.rating || 0)} />
                      </span>
                    </span>
                    <input
                      aria-label="Rating"
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={formDraft.rating}
                      onChange={(event) =>
                        setFormDraft((current) => ({
                          ...current,
                          rating: event.target.value,
                        }))
                      }
                      className="mt-3 w-full accent-[var(--home-haze)]"
                    />
                  </label>
                  <label className="block">
                    <span className={FORM_LABEL_CLASS}>Tasting notes</span>
                    <textarea
                      aria-label="Tasting notes"
                      rows={3}
                      maxLength={1000}
                      value={formDraft.notes}
                      onChange={(event) =>
                        setFormDraft((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Cherry, leather, dried herbs."
                      className="mt-2 w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-3 text-sm leading-6 text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={!formDraft.name.trim()}
                      className="inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--home-haze)] px-4 py-2.5 text-sm font-semibold text-[var(--home-paper)] shadow-[var(--shadow-sm)] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      {editingId ? "Save tasting" : "Add tasting"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-xs font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>

              {recentFiveStars.length > 0 ? (
                <section aria-label="Recent five-star bottles">
                  <p className="tool-rail-label">
                    <Star size={12} aria-hidden="true" />
                    Recent five-stars
                  </p>
                  <ul className="flex flex-col gap-2">
                    {recentFiveStars.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => handleEdit(entry.id)}
                          className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-left transition hover:border-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                          aria-label={`Edit ${entry.name}`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-[var(--home-ink)]">
                              {entry.name}
                            </span>
                            <span className="block truncate text-[11px] uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                              {formatTastedDate(entry.tastedOn)}
                            </span>
                          </span>
                          <span className="font-mono text-[12px] font-semibold tabular-nums text-[var(--home-ink)]">
                            {entry.rating.toFixed(1)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <p className="tool-rail-foot">
                <Bookmark size={14} aria-hidden="true" />
                Saved in your browser — no account, no server.
              </p>
            </aside>
          </div>

          {hasEntries ? (
            <section
              className="tool-band"
              aria-label="Cellar insights"
              id="insights"
            >
              <div className="tool-section-header">
                <div>
                  <p className="tool-section-kicker">Cellar insights</p>
                  <h2 className="tool-section-title">What you've been drinking</h2>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <div className="tool-card">
                  <h3 className="text-base font-semibold text-[var(--home-ink)]">
                    By type
                  </h3>
                  <div className="mt-4 space-y-3">
                    {summary.typeBreakdown.map((bucket) => {
                      const share =
                        summary.totalWines > 0
                          ? (bucket.count / summary.totalWines) * 100
                          : 0;
                      return (
                        <div key={bucket.type}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[var(--home-ink)]">
                              {WINE_TYPE_LABELS[bucket.type]}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                              {bucket.count} · avg {bucket.averageRating.toFixed(1)}
                            </p>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--home-paper-alt)]">
                            <div
                              className="h-full rounded-full bg-[var(--home-haze)]"
                              style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="tool-card">
                  <h3 className="text-base font-semibold text-[var(--home-ink)]">
                    Top rated
                  </h3>
                  {summary.topRated.length === 0 ? (
                    <p className="mt-3 text-sm text-[var(--home-ink-muted)]">
                      Add a few bottles to surface your favorites.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {summary.topRated.map((entry) => (
                        <li
                          key={entry.id}
                          className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--home-ink)]">
                                {entry.name}
                              </p>
                              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                                {entry.producer || WINE_TYPE_LABELS[entry.type]}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="text-sm font-semibold text-[var(--home-ink)]">
                                {entry.rating.toFixed(1)}
                              </p>
                              <StarRating value={entry.rating} />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="tool-card">
                  <h3 className="text-base font-semibold text-[var(--home-ink)]">
                    Recent pours
                  </h3>
                  {summary.recent.length === 0 ? (
                    <p className="mt-3 text-sm text-[var(--home-ink-muted)]">
                      Recent tastings will show up here.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {summary.recent.map((entry) => (
                        <li
                          key={entry.id}
                          className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--home-ink)]">
                                {entry.name}
                              </p>
                              <p
                                className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--home-ink-muted)]"
                                title={entry.tastedOn}
                              >
                                {formatTastedDate(entry.tastedOn)} ·{" "}
                                {WINE_TYPE_LABELS[entry.type]}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-[var(--home-ink)]">
                              {entry.rating.toFixed(1)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {summary.topVarietal ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-3 text-[11px] uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      Most-poured varietal:{" "}
                      <span className="font-semibold text-[var(--home-ink)]">
                        {summary.topVarietal}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
