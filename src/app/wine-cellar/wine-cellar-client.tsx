"use client";

import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import {
  DEFAULT_WINE_FILTERS,
  WINE_CELLAR_STORAGE_KEY,
  WINE_TYPES,
  WINE_TYPE_LABELS,
  getTodayIsoDate,
  type WineDraft,
  type WineSortKey,
} from "@/lib/wineCellar";
import { useWineCellar } from "@/hooks/useWineCellar";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import { DATE_ONLY_TIME_ZONE } from "@/lib/date-formatters";
import type { WineEntry, WineType } from "@/types/wine";
import { WINE_TYPE_MARK, wineRack, type WineRackRow } from "./wineRack";
import "./wine-cellar.css";
import { formatDollars } from "@/lib/utils";

const WINE_ROUTE = "/wine-cellar";

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

// `tastedOn` defaults to "today," which depends on the visitor's own clock
// and zone, so a caller rendering this during SSR or the initial hydration
// pass must pass "" instead of the real default (see the mount effect below).
function createEmptyFormDraft(tastedOn: string = getTodayIsoDate()): WineFormDraft {
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
    tastedOn,
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

// tastedOn is a date-only string ("2026-06-15"), which parses as UTC midnight,
// so pinning the formatter to the same zone prints the day that was logged on
// the server and on the client regardless of either one's own zone.
const TASTED_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: DATE_ONLY_TIME_ZONE,
});

function formatTastedDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : TASTED_DATE_FORMATTER.format(date);
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
      className="inline-flex items-center"
      style={{ gap: 2, color: "var(--c97-accent)" }}
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
              isFull ? "fill-current" : isHalf ? "fill-current opacity-60" : "opacity-25"
            }`}
          />
        );
      })}
    </div>
  );
}

/** A small circle mark for a wine type, filled for most types and a hollow ring for the one that reuses a chart step. */
function TypeSwatch({ type }: { type: WineType }) {
  const mark = WINE_TYPE_MARK[type];
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="c97-wine-swatch"
      style={{ width: 12, height: 12, display: "inline-block", flexShrink: 0 }}
    >
      <circle
        cx={6}
        cy={6}
        r={5}
        fill={mark.hollow ? "none" : `var(${mark.token})`}
        stroke={mark.hollow ? `var(${mark.token})` : "var(--c97-surface)"}
        strokeWidth={mark.hollow ? 2 : 1}
      />
    </svg>
  );
}

function wineTypeBarStyle(type: WineType): CSSProperties {
  const mark = WINE_TYPE_MARK[type];
  return mark.hollow
    ? { background: "transparent", border: `2px solid var(${mark.token})` }
    : { background: `var(${mark.token})` };
}

const SORT_OPTIONS: Array<{ value: WineSortKey; label: string }> = [
  { value: "tastedOn", label: "Date tasted" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
];

/* -------------------------------------------------------------------------
 * The rack signature. One cubby per region, a lattice of cells with one
 * bottle end per bottle, coloured by type, and the region named beneath.
 * A busy region grows by whole rows, so no mark shrinks.
 * ---------------------------------------------------------------------- */

/** Cubbies per rack row. A region's cubby is padded to whole rows so it reads as a rack. */
const RACK_COLUMNS = 4;

function RackCubby({ label, slots, marked }: { label: string; slots: WineRackRow["slots"]; marked?: boolean }) {
  const cells = Math.max(RACK_COLUMNS, Math.ceil(slots.length / RACK_COLUMNS) * RACK_COLUMNS);
  return (
    <figure className="c97-wine-cubby">
      <div className="c97-wine-cubby-grid" aria-hidden="true">
        {Array.from({ length: cells }, (_, i) => {
          const slot = slots[i];
          if (!slot) {
            return <span key={i} className="c97-wine-cell" data-first={marked && i === 0 ? "true" : undefined} />;
          }
          const mark = WINE_TYPE_MARK[slot.type];
          return (
            <span key={slot.id} className="c97-wine-cell" title={`${slot.producer ? `${slot.producer}, ` : ""}${slot.name}`}>
              <span
                className="c97-wine-end"
                data-hollow={mark.hollow ? "true" : undefined}
                style={{ ["--wine-mark" as string]: `var(${mark.token})` }}
              />
            </span>
          );
        })}
      </div>
      <figcaption className="c97-wine-cubby-label">
        {label}
        {slots.length > 0 ? <span className="c97-mono"> · {slots.length}</span> : null}
      </figcaption>
    </figure>
  );
}

function WineRackMarks({ rows }: { rows: WineRackRow[] }) {
  const totalBottles = rows.reduce((sum, row) => sum + row.slots.length, 0);
  return (
    <div
      className="c97-wine-rack"
      role="img"
      aria-label={`The cellar rack. ${totalBottles} bottle${totalBottles === 1 ? "" : "s"} across ${rows.length} region${
        rows.length === 1 ? "" : "s"
      }, one bottle end per bottle, grouped by region and coloured by type.`}
    >
      {rows.map((row) => (
        <RackCubby key={row.region} label={row.region} slots={row.slots} />
      ))}
    </div>
  );
}

function EmptyWineRack() {
  return (
    <div className="c97-wine-rack-empty">
      <RackCubby label="Your rack is empty" slots={[]} marked />
      <a href="#add-tasting" className="c97-wine-rack-empty-link c97-microlink">
        Log your first bottle
      </a>
    </div>
  );
}

function WineTypeLegend() {
  return (
    <ul className="c97-wine-rack-legend" aria-label="Wine type legend">
      {WINE_TYPES.map((type) => (
        <li key={type} className="c97-wine-rack-legend-item">
          <TypeSwatch type={type} />
          <span>{WINE_TYPE_LABELS[type]}</span>
        </li>
      ))}
    </ul>
  );
}

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
  const reduceMotion = useReducedMotion();
  const persistenceStatus = useLocalStoragePersistenceStatus(WINE_CELLAR_STORAGE_KEY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDraft, setFormDraft] = useState<WineFormDraft>(() => createEmptyFormDraft(""));
  const [nameMissing, setNameMissing] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fill "today" in after mount: the server's UTC calendar day and the
  // visitor's local one can disagree, so the initial render leaves the field
  // blank and only the client sets it, once, to its own local today.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time default fill after mount
    setFormDraft((current) => (current.tastedOn ? current : { ...current, tastedOn: getTodayIsoDate() }));
  }, []);

  function resetForm() {
    setEditingId(null);
    setNameMissing(false);
    setFormDraft(createEmptyFormDraft());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formDraft.name.trim()) {
      setNameMissing(true);
      nameInputRef.current?.focus();
      return;
    }
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
    setNameMissing(false);
    setFormDraft(entryToFormDraft(entry));
    nameInputRef.current?.focus({ preventScroll: true });
    document
      .getElementById("add-tasting")
      ?.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
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

  const recentTopRated = useMemo(
    () =>
      [...entries]
        .filter((entry) => entry.rating >= 4.5)
        .sort((a, b) => b.tastedOn.localeCompare(a.tastedOn))
        .slice(0, 5),
    [entries]
  );

  const rack = useMemo(() => wineRack(entries), [entries]);
  const lead = PROJECT_PRESS[WINE_ROUTE].lead;
  const standfirst =
    "I wanted somewhere to log each bottle, from the producer and vintage to what I actually thought of it, and each one you log becomes a slot in the rack below, grouped by region and colored by type.";

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Wine Cellar"
        standfirst={standfirst}
        readouts={
          hasEntries
            ? [
                { label: "Bottles logged", value: summary.totalWines.toLocaleString("en-US") },
                { label: "Average rating", value: summary.averageRating.toFixed(1) },
                { label: "Top region", value: summary.topRegion ?? "—" },
              ]
            : []
        }
      >
        <div
          data-c97-surface="paper"
          className="c97-offset c97-wine-rack-plate"
          style={{ padding: "var(--c97-sp-3)" }}
        >
          {hasEntries ? <WineRackMarks rows={rack} /> : <EmptyWineRack />}
          <WineTypeLegend />
        </div>
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell">
          {persistenceStatus === "memory-only" ? (
            <p
              className="c97-prose"
              style={{ fontSize: "var(--c97-fs-small)", marginBottom: "var(--c97-sp-3)" }}
              role="status"
            >
              Your cellar is available in this tab, but browser storage is unavailable, so
              entries may not remain after you close it.
            </p>
          ) : null}

          <div className="grid xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]" style={{ gap: "var(--c97-sp-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-3)" }}>
              <div className="flex flex-wrap items-end justify-between" style={{ gap: "var(--c97-sp-2)" }}>
                <h2 className="c97-poster-sm">Tasting log</h2>
                {hasEntries ? (
                  <p className="c97-meta c97-tabular" style={{ margin: 0 }}>
                    {visibleEntries.length} of {entries.length}
                  </p>
                ) : null}
              </div>

              {/* Search, filters, and sorting arrive with the first bottle, when there is something to organize. */}
              {hasEntries ? (
                <>
                <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
                  <label className="c97-wine-search">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" style={{ color: "var(--c97-ink-2)" }} />
                    <input
                      type="search"
                      aria-label="Search wines"
                      placeholder="Search by name, region, or notes…"
                      value={filters.search}
                      onChange={(event) =>
                        updateFilters((current) => ({ ...current, search: event.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="c97-kicker">Type</span>
                    <select
                      aria-label="Filter by wine type"
                      value={filters.type}
                      onChange={(event) =>
                        updateFilters((current) => ({
                          ...current,
                          type: event.target.value as typeof current.type,
                        }))
                      }
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)" }}
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
                    <span className="c97-kicker">Min rating</span>
                    <select
                      value={String(filters.minRating)}
                      onChange={(event) =>
                        updateFilters((current) => ({
                          ...current,
                          minRating: Number(event.target.value),
                        }))
                      }
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    >
                      <option value="0">Any</option>
                      <option value="3">3+ stars</option>
                      <option value="3.5">3.5+ stars</option>
                      <option value="4">4+ stars</option>
                      <option value="4.5">4.5+ stars</option>
                      <option value="5">5 stars only</option>
                    </select>
                  </label>
                  <div className="block">
                    <span id="wine-sort-label" className="c97-kicker">Sort by</span>
                    <div className="flex items-center" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                      <select
                        aria-labelledby="wine-sort-label"
                        value={filters.sort}
                        onChange={(event) =>
                          updateFilters((current) => ({
                            ...current,
                            sort: event.target.value as WineSortKey,
                          }))
                        }
                        className="c97-field"
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
                            sortDirection: current.sortDirection === "asc" ? "desc" : "asc",
                          }))
                        }
                        className="c97-wine-icon-btn"
                      >
                        {filters.sortDirection === "asc" ? "↑" : "↓"}
                      </button>
                    </div>
                  </div>
                </div>

                {filtersAreActive ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="c97-btn-ghost"
                    style={{ gap: "var(--c97-sp-1)", alignSelf: "flex-start" }}
                  >
                    <Filter className="h-3 w-3" aria-hidden="true" />
                    Reset filters
                  </button>
                ) : null}
                </>
              ) : null}

              <section aria-label="Tasting log">
                {!hasEntries ? (
                  <p className="c97-prose">No bottles logged yet. The Log a bottle form adds your first one.</p>
                ) : !hasVisibleEntries ? (
                  <p className="c97-prose">
                    No bottles match these filters. Try widening your search or reset filters.
                  </p>
                ) : (
                  <ul className="c97-wine-log">
                    {visibleEntries.map((entry) => (
                      <li
                        key={entry.id}
                        data-c97-surface="paper"
                        className="c97-wine-log-row c97-offset"
                        aria-current={editingId === entry.id ? "true" : undefined}
                      >
                        <p className="c97-wine-label-producer">{entry.producer || "Unknown producer"}</p>
                        <p className="c97-serif c97-wine-label-name">{entry.name}</p>
                        <p className="c97-mono c97-wine-label-vintage">{entry.vintage ?? "NV"}</p>
                        <p className="c97-wine-label-meta">
                          {[entry.region, entry.varietal].filter(Boolean).join(" · ")}
                          <span className="c97-wine-type">
                            <TypeSwatch type={entry.type} />
                            {WINE_TYPE_LABELS[entry.type]}
                          </span>
                        </p>
                        <div className="c97-wine-label-rating">
                          <StarRating value={entry.rating} />
                          <span className="c97-mono">{entry.rating.toFixed(1)}</span>
                        </div>
                        {entry.notes ? <p className="c97-prose c97-wine-label-notes">{entry.notes}</p> : null}
                        <p className="c97-wine-label-foot">
                          <span title={entry.tastedOn}>{formatTastedDate(entry.tastedOn)}</span>
                          {entry.price !== null ? <span>{formatDollars(entry.price)}</span> : null}
                        </p>
                        <div className="c97-wine-log-actions">
                          <button
                            type="button"
                            aria-label={`Edit ${entry.name}`}
                            onClick={() => handleEdit(entry.id)}
                            className="c97-btn-ghost"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${entry.name}`}
                            onClick={() => handleDelete(entry.id)}
                            className="c97-btn-ghost"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <aside
              aria-label="Wine cellar side panel"
              // In an empty cellar the form is the first thing in the band on a phone.
              className={`xl:sticky xl:top-[var(--c97-sp-3)]${hasEntries ? "" : " order-first xl:order-none"}`}
              style={{ alignSelf: "start", display: "flex", flexDirection: "column", gap: "var(--c97-sp-3)" }}
            >
              <div className="c97-panel" id="add-tasting">
                <p
                  className="c97-kicker"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--c97-sp-1)",
                    marginBottom: "var(--c97-sp-3)",
                  }}
                >
                  <Wine className="h-3 w-3" aria-hidden="true" />
                  {editingId ? "Edit bottle" : "Log a bottle"}
                </p>
                <form onSubmit={handleSubmit} className="grid" style={{ gap: "var(--c97-sp-2)" }}>
                  <label className="block">
                    <span className="c97-kicker">Wine name</span>
                    <input
                      ref={nameInputRef}
                      required
                      type="text"
                      value={formDraft.name}
                      onChange={(event) => {
                        setNameMissing(false);
                        setFormDraft((current) => ({ ...current, name: event.target.value }));
                      }}
                      onInvalid={(event) => {
                        // Swap the browser's bubble for the inline message below.
                        event.preventDefault();
                        setNameMissing(true);
                        event.currentTarget.focus();
                      }}
                      aria-invalid={nameMissing || undefined}
                      aria-describedby={nameMissing ? "wine-name-error" : undefined}
                      placeholder="2018 Brunello di Montalcino"
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    />
                  </label>
                  {nameMissing ? (
                    <p
                      id="wine-name-error"
                      role="alert"
                      className="c97-prose"
                      style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-negative)" }}
                    >
                      Give the bottle a name to log it.
                    </p>
                  ) : null}
                  <label className="block">
                    <span className="c97-kicker">Producer</span>
                    <input
                      type="text"
                      value={formDraft.producer}
                      onChange={(event) =>
                        setFormDraft((current) => ({ ...current, producer: event.target.value }))
                      }
                      placeholder="Biondi-Santi"
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    />
                  </label>
                  <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
                    <label className="block">
                      <span className="c97-kicker">Vintage</span>
                      <input
                        type="number"
                        min="1800"
                        max="2100"
                        step="1"
                        value={formDraft.vintage}
                        onChange={(event) =>
                          setFormDraft((current) => ({ ...current, vintage: event.target.value }))
                        }
                        placeholder="2018"
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      />
                    </label>
                    <label className="block">
                      <span className="c97-kicker">Type</span>
                      <select
                        aria-label="Wine type"
                        value={formDraft.type}
                        onChange={(event) =>
                          setFormDraft((current) => ({
                            ...current,
                            type: event.target.value as WineType,
                          }))
                        }
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
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
                    <span className="c97-kicker">Region</span>
                    <input
                      type="text"
                      value={formDraft.region}
                      onChange={(event) =>
                        setFormDraft((current) => ({ ...current, region: event.target.value }))
                      }
                      placeholder="Tuscany"
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    />
                  </label>
                  <label className="block">
                    <span className="c97-kicker">Varietal / grape</span>
                    <input
                      type="text"
                      value={formDraft.varietal}
                      onChange={(event) =>
                        setFormDraft((current) => ({ ...current, varietal: event.target.value }))
                      }
                      placeholder="Sangiovese"
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    />
                  </label>
                  <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
                    <label className="block">
                      <span className="c97-kicker">Price (USD)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formDraft.price}
                        onChange={(event) =>
                          setFormDraft((current) => ({ ...current, price: event.target.value }))
                        }
                        placeholder="48"
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      />
                    </label>
                    <label className="block">
                      <span className="c97-kicker">Tasted on</span>
                      <input
                        type="date"
                        value={formDraft.tastedOn}
                        onChange={(event) =>
                          setFormDraft((current) => ({ ...current, tastedOn: event.target.value }))
                        }
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span
                      className="c97-kicker"
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span>Rating</span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--c97-sp-1)",
                          color: "var(--c97-ink)",
                          textTransform: "none",
                          letterSpacing: "normal",
                        }}
                      >
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
                        setFormDraft((current) => ({ ...current, rating: event.target.value }))
                      }
                      className="c97-range"
                      style={{ marginTop: "var(--c97-sp-2)" }}
                    />
                  </label>
                  <label className="block">
                    <span className="c97-kicker">Tasting notes</span>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={formDraft.notes}
                      onChange={(event) =>
                        setFormDraft((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Cherry, leather, dried herbs."
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    />
                  </label>
                  <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)", paddingTop: "var(--c97-sp-1)" }}>
                    <button
                      type="submit"
                      className="c97-btn c97-offset flex-1"
                      style={{ justifyContent: "center", gap: "var(--c97-sp-1)" }}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      {editingId ? "Save tasting" : "Add tasting"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="c97-btn-ghost"
                        style={{ gap: "var(--c97-sp-1)" }}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>

              {recentTopRated.length > 0 ? (
                <div className="c97-panel">
                  <p
                    className="c97-kicker"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--c97-sp-1)",
                      marginBottom: "var(--c97-sp-2)",
                    }}
                  >
                    <Star className="h-3 w-3" aria-hidden="true" />
                    Recent 4.5+ stars
                  </p>
                  <ul className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
                    {recentTopRated.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => handleEdit(entry.id)}
                          aria-label={`Edit ${entry.name}`}
                          className="c97-wine-recent-row"
                        >
                          <span className="min-w-0">
                            <span
                              className="block truncate c97-serif"
                              style={{ fontSize: "var(--c97-fs-body)" }}
                            >
                              {entry.name}
                            </span>
                            <span className="c97-meta" style={{ margin: 0 }}>
                              {formatTastedDate(entry.tastedOn)}
                            </span>
                          </span>
                          <span className="c97-mono" style={{ color: "var(--c97-ink)" }}>
                            {entry.rating.toFixed(1)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <p
                className="c97-prose"
                style={{
                  fontSize: "var(--c97-fs-small)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--c97-sp-1)",
                }}
              >
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                Your bottles are saved in this browser only, with no account or server behind them.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {hasEntries ? (
        <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
          <div className="c97-shell">
            <h2 className="c97-poster-sm">What you&apos;ve been drinking</h2>
            <div className="c97-panel" style={{ marginTop: "var(--c97-sp-4)", maxWidth: "36rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
                {summary.typeBreakdown.map((bucket) => {
                  const share =
                    summary.totalWines > 0 ? (bucket.count / summary.totalWines) * 100 : 0;
                  return (
                    <div key={bucket.type}>
                      <div className="flex items-center justify-between" style={{ gap: "var(--c97-sp-2)" }}>
                        <span className="c97-wine-type">
                          <TypeSwatch type={bucket.type} />
                          {WINE_TYPE_LABELS[bucket.type]}
                        </span>
                        <span className="c97-meta c97-tabular" style={{ margin: 0 }}>
                          {bucket.count} · avg {bucket.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="c97-wine-bar-track" style={{ marginTop: "var(--c97-sp-1)" }}>
                        <div
                          className="c97-wine-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, share))}%`,
                            ...wineTypeBarStyle(bucket.type),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
