"use client";

import { type FormEvent, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Filter,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Wine,
  X,
} from "lucide-react";
import { WarmCard } from "@/components/ui/WarmCard";
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
          className="mb-8 overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--home-haze)_14%,var(--home-rule))] bg-[linear-gradient(135deg,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))_0%,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))_45%,color-mix(in_srgb,var(--home-paper-alt)_88%,var(--home-haze)_12%)_100%)] shadow-[var(--shadow-lg)]"
        >
          <div className="border-b border-[var(--home-rule)]/80 px-6 py-6 sm:px-8">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--home-haze)]">
              Personal Project
            </p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-[var(--home-ink)] sm:text-4xl">
                  <Wine className="h-8 w-8 text-[var(--home-haze)]" aria-hidden="true" />
                  Wine Cellar
                </h1>
                <p className="mt-3 max-w-[64ch] text-sm leading-7 text-[var(--home-ink-muted)] sm:text-[0.98rem]">
                  Log the wines you taste, score them, and keep notes you'll
                  actually revisit. Everything saves to your browser — no
                  account, no server.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 sm:px-8">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_82%,transparent)] px-4 py-4 shadow-[var(--shadow-sm)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                  Bottles logged
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--home-ink)]">
                  {summary.totalWines}
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_82%,transparent)] px-4 py-4 shadow-[var(--shadow-sm)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                  Average rating
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <p className="text-2xl font-semibold tracking-tight text-[var(--home-ink)]">
                    {summary.totalWines > 0 ? summary.averageRating.toFixed(1) : "—"}
                  </p>
                  {summary.totalWines > 0 ? (
                    <StarRating value={summary.averageRating} />
                  ) : null}
                </div>
              </div>
              <div className="rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_82%,transparent)] px-4 py-4 shadow-[var(--shadow-sm)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                  Cellar spend
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--home-ink)]">
                  {summary.totalSpend > 0 ? formatCurrency(summary.totalSpend) : "—"}
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_82%,transparent)] px-4 py-4 shadow-[var(--shadow-sm)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                  Top region
                </p>
                <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-[var(--home-ink)]">
                  {summary.topRegion ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <motion.div variants={motionVariants} initial="hidden" animate="visible">
            <WarmCard
              padding="none"
              className="overflow-hidden rounded-[30px] border-[color-mix(in_srgb,var(--home-haze)_14%,var(--home-rule))] bg-[linear-gradient(180deg,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))_0%,color-mix(in_srgb,var(--home-paper-alt)_72%,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix)))_100%)]"
            >
              <div className="border-b border-[var(--home-rule)] px-6 py-5 sm:px-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--home-haze)]">
                  {editingId ? "Edit bottle" : "Log a bottle"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--home-ink)]">
                  {editingId ? "Edit tasting" : "New tasting"}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--home-ink-muted)]">
                  Capture the bottle, the rating, and a few notes. Only the name
                  is required — fill in the rest as you remember it.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-4 px-6 py-6 sm:px-8"
              >
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                    Wine name
                  </span>
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
                    className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Producer
                    </span>
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
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Vintage
                    </span>
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
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Region
                    </span>
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
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Varietal / grape
                    </span>
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
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Type
                    </span>
                    <select
                      aria-label="Wine type"
                      value={formDraft.type}
                      onChange={(event) =>
                        setFormDraft((current) => ({
                          ...current,
                          type: event.target.value as WineType,
                        }))
                      }
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
                    >
                      {WINE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {WINE_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Price (USD)
                    </span>
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
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Tasted on
                    </span>
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
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
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
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                    Tasting notes
                  </span>
                  <textarea
                    aria-label="Tasting notes"
                    rows={4}
                    maxLength={1000}
                    value={formDraft.notes}
                    onChange={(event) =>
                      setFormDraft((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Cherry, leather, dried herbs. Long finish, would buy again."
                    className="mt-2 w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-3 text-sm leading-6 text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!formDraft.name.trim()}
                    className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--home-haze)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-initial"
                  >
                    <Plus className="h-4 w-4" />
                    {editingId ? "Save tasting" : "Add tasting"}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-5 py-3 text-sm font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
                    >
                      <X className="h-4 w-4" />
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </WarmCard>
          </motion.div>

          <motion.div variants={motionVariants} initial="hidden" animate="visible">
            <WarmCard
              padding="none"
              className="overflow-hidden rounded-[30px] border-[color-mix(in_srgb,var(--home-haze)_10%,var(--home-rule))] bg-[linear-gradient(180deg,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))_0%,color-mix(in_srgb,var(--home-paper-alt)_58%,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix)))_100%)]"
            >
              <div className="border-b border-[var(--home-rule)] px-6 py-5 sm:px-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--home-haze)]">
                      Cellar
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--home-ink)]">
                      Tasting log
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--home-ink-muted)]">
                      Search, filter, and revisit everything you've poured.
                    </p>
                  </div>
                  <p className="rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-1 text-xs font-semibold text-[var(--home-ink-muted)]">
                    {visibleEntries.length} of {entries.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 px-6 py-5 sm:px-8">
                <label className="block">
                  <span className="sr-only">Search wines</span>
                  <span className="relative flex items-center">
                    <Search
                      className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--home-haze)]"
                      aria-hidden="true"
                    />
                    <input
                      aria-label="Search wines"
                      type="search"
                      value={filters.search}
                      onChange={(event) =>
                        updateFilters((current) => ({
                          ...current,
                          search: event.target.value,
                        }))
                      }
                      placeholder="Search by name, region, or notes"
                      className="min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] py-2 pl-10 pr-3 text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    />
                  </span>
                </label>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Type
                    </span>
                    <select
                      aria-label="Filter by wine type"
                      value={filters.type}
                      onChange={(event) =>
                        updateFilters((current) => ({
                          ...current,
                          type: event.target.value as typeof current.type,
                        }))
                      }
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
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
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Min rating
                    </span>
                    <select
                      aria-label="Minimum rating"
                      value={String(filters.minRating)}
                      onChange={(event) =>
                        updateFilters((current) => ({
                          ...current,
                          minRating: Number(event.target.value),
                        }))
                      }
                      className="mt-2 min-h-[46px] w-full rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
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
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                      Sort by
                    </span>
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
                        className="min-h-[46px] flex-1 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm font-medium text-[var(--home-ink)]"
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
                        className="inline-flex min-h-[46px] min-w-[46px] items-center justify-center rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm font-semibold text-[var(--home-ink)] hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
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
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-1.5 text-xs font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
                  >
                    <Filter className="h-3 w-3" />
                    Reset filters
                  </button>
                ) : null}
              </div>

              <div className="border-t border-[var(--home-rule)] px-6 py-6 sm:px-8">
                {!hasEntries ? (
                  <div className="rounded-[22px] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-8 text-center">
                    <Wine
                      className="mx-auto h-8 w-8 text-[var(--home-haze)]"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-base font-semibold text-[var(--home-ink)]">
                      Your cellar is empty
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                      Add the first bottle from the form to start your log.
                    </p>
                  </div>
                ) : !hasVisibleEntries ? (
                  <div className="rounded-[22px] border border-dashed border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-8 text-center">
                    <p className="text-sm leading-6 text-[var(--home-ink-muted)]">
                      No bottles match these filters. Try widening your search.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {visibleEntries.map((entry) => (
                      <li
                        key={entry.id}
                        className={`rounded-[22px] border bg-[var(--home-paper)] px-4 py-4 transition ${
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
                              <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                                {WINE_TYPE_LABELS[entry.type]}
                              </span>
                              {entry.region ? (
                                <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                                  {entry.region}
                                </span>
                              ) : null}
                              {entry.varietal ? (
                                <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                                  {entry.varietal}
                                </span>
                              ) : null}
                              <span
                                className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]"
                                title={entry.tastedOn}
                              >
                                {formatTastedDate(entry.tastedOn)}
                              </span>
                              {entry.price !== null ? (
                                <span className="rounded-full bg-[var(--home-paper-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
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

                          <div className="flex flex-col items-end gap-3 sm:min-w-[140px]">
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
                                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-xs font-semibold text-[var(--home-ink-muted)] hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${entry.name}`}
                                onClick={() => handleDelete(entry.id)}
                                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-2 text-xs font-semibold text-[var(--home-ink-muted)] hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
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
              </div>
            </WarmCard>
          </motion.div>
        </div>

        {hasEntries ? (
          <motion.div
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            className="mt-6"
          >
            <WarmCard
              padding="none"
              className="overflow-hidden rounded-[30px] border-[color-mix(in_srgb,var(--home-haze)_10%,var(--home-rule))] bg-[linear-gradient(180deg,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))_0%,color-mix(in_srgb,var(--home-paper-alt)_54%,color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix)))_100%)]"
            >
              <div className="border-b border-[var(--home-rule)] px-6 py-5 sm:px-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--home-haze)]">
                  Cellar insights
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--home-ink)]">
                  What you've been drinking
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--home-ink-muted)]">
                  A quick read on your patterns — by type, by score, and by
                  what's most recent.
                </p>
              </div>

              <div className="grid gap-6 px-6 py-6 sm:px-8 xl:grid-cols-3">
                <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-4">
                  <h3 className="text-lg font-semibold text-[var(--home-ink)]">
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
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
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

                <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-4">
                  <h3 className="text-lg font-semibold text-[var(--home-ink)]">
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
                              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
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

                <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper)] p-4">
                  <h3 className="text-lg font-semibold text-[var(--home-ink)]">
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
                                className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]"
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
                    <p className="mt-4 rounded-2xl border border-dashed border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 py-3 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      Most-poured varietal:{" "}
                      <span className="font-semibold text-[var(--home-ink)]">
                        {summary.topVarietal}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </WarmCard>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
