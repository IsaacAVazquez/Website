"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Star, X } from "lucide-react";
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
import { WineCork } from "@/components/discoveries/WineCork";
import { WineInventory } from "./WineInventory";
import { openInventoryBottle, type InventoryBottle } from "@/lib/wineInventory";

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

function StarRating({ value }: { value: number }) {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  return (
    <span className="wc-stars" aria-label={`${value} out of 5 stars`} role="img">
      {Array.from({ length: 5 }).map((_, idx) => {
        const isFull = idx < fullStars;
        const isHalf = !isFull && idx === fullStars && hasHalf;
        return (
          <Star
            key={idx}
            aria-hidden="true"
            className={`h-4 w-4 ${isFull ? "fill-current" : isHalf ? "fill-current opacity-60" : "opacity-25"}`}
          />
        );
      })}
    </span>
  );
}

/** A small circle mark for a wine type, filled for most types and a hollow ring for the one that reuses a chart step. */
function TypeSwatch({ type }: { type: WineType }) {
  const mark = WINE_TYPE_MARK[type];
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="wc-swatch">
      <circle
        cx={6}
        cy={6}
        r={5}
        fill={mark.hollow ? "none" : `var(${mark.token})`}
        stroke={mark.hollow ? `var(${mark.token})` : "none"}
        strokeWidth={2}
      />
    </svg>
  );
}

const SORT_OPTIONS: Array<{ value: WineSortKey; label: string }> = [
  { value: "tastedOn", label: "Date tasted" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
];

/**
 * One line of the cellar book: the vintage in the margin, producer over the
 * wine's name, where it is from, and the rating, date, and price at the right.
 * The example on a first visit draws the same line with no actions.
 */
function BottleLine({ entry, actions }: { entry: WineEntry; actions?: ReactNode }) {
  return (
    <>
      <p className="wc-vintage">{entry.vintage ?? "NV"}</p>
      <div className="wc-line-main">
        <p className="wc-producer">{entry.producer || "Unknown producer"}</p>
        <p className="wc-name">{entry.name}</p>
        <p className="wc-origin">
          {entry.region ? <span>{entry.region}</span> : null}
          {entry.region && entry.varietal ? " · " : null}
          {entry.varietal ? <span>{entry.varietal}</span> : null}
          <span className="wc-type">
            <TypeSwatch type={entry.type} />
            {WINE_TYPE_LABELS[entry.type]}
          </span>
        </p>
        {entry.notes ? <p className="wc-notes">{entry.notes}</p> : null}
      </div>
      <div className="wc-line-side">
        <p className="wc-rating">
          <StarRating value={entry.rating} />
          <span className="wc-figure">{entry.rating.toFixed(1)}</span>
        </p>
        <p className="wc-when">
          <span title={entry.tastedOn}>{formatTastedDate(entry.tastedOn)}</span>
          {entry.price !== null ? <span className="wc-figure">{formatDollars(entry.price)}</span> : null}
        </p>
        {actions}
      </div>
    </>
  );
}

const EXAMPLE_BOTTLE: WineEntry = {
  id: "example",
  name: "Brunello di Montalcino",
  producer: "Biondi-Santi",
  vintage: 2018,
  region: "Tuscany",
  varietal: "Sangiovese",
  type: "red",
  price: 120,
  rating: 4.5,
  notes: "Cherry, leather, dried herbs. Wants another five years.",
  tastedOn: "2026-09-20",
  createdAt: "2026-09-20T00:00:00.000Z",
};

/*
 * The title row's one sentence. A region is named only when the data supports
 * the claim: the one bottle's region, a single region holding every bottle, or
 * a region that leads outright. A tie for the lead names no region.
 */
function cellarSummary(entries: WineEntry[], rack: WineRackRow[], averageRating: number) {
  const named = rack.filter((row) => entries.some((entry) => entry.region.trim() === row.region));
  const [top, next] = named;
  if (entries.length === 1) {
    return `1 bottle logged, rated ${averageRating.toFixed(1)} stars${top ? `, from ${top.region}` : ""}.`;
  }
  const lead = `${entries.length.toLocaleString("en-US")} bottles logged, averaging ${averageRating.toFixed(1)} stars`;
  if (!top) return `${lead}.`;
  if (top.slots.length === entries.length) return `${lead}, all from ${top.region}.`;
  if (!next || top.slots.length > next.slots.length) return `${lead}, with ${top.region} the most logged region.`;
  return `${lead}, across ${named.length} regions.`;
}

/* The rack, compact: one strip of cells per region, one bottle end per bottle, coloured by type. */
const RACK_COLUMNS = 6;

function WineRack({ rows }: { rows: WineRackRow[] }) {
  const totalBottles = rows.reduce((sum, row) => sum + row.slots.length, 0);
  return (
    <div
      className="wc-rack"
      style={{ ["--wc-cols" as string]: RACK_COLUMNS }}
      role="img"
      aria-label={`The cellar rack. ${totalBottles} bottle${totalBottles === 1 ? "" : "s"} across ${rows.length} region${
        rows.length === 1 ? "" : "s"
      }, one bottle end per bottle, grouped by region and coloured by type.`}
    >
      {rows.map((row) => {
        const cells = Math.ceil(row.slots.length / RACK_COLUMNS) * RACK_COLUMNS;
        return (
          <figure key={row.region} className="wc-cubby">
            <span className="wc-cubby-grid" aria-hidden="true">
              {Array.from({ length: cells }, (_, i) => {
                const slot = row.slots[i];
                if (!slot) return <span key={i} className="wc-cell" />;
                const mark = WINE_TYPE_MARK[slot.type];
                return (
                  <span key={slot.id} className="wc-cell" title={`${slot.producer ? `${slot.producer}, ` : ""}${slot.name}`}>
                    <span
                      className="wc-end"
                      data-hollow={mark.hollow ? "true" : undefined}
                      style={{ ["--wc-mark" as string]: `var(${mark.token})` }}
                    />
                  </span>
                );
              })}
            </span>
            <figcaption className="wc-cubby-label">
              {row.region} <span className="wc-figure">{row.slots.length}</span>
            </figcaption>
          </figure>
        );
      })}
    </div>
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
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openingError, setOpeningError] = useState("");
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
    setOpeningId(null);
    setOpeningError("");
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
    if (openingId) {
      if (!openInventoryBottle(openingId, wineDraft)) {
        setOpeningError("This bottle is no longer on the shelf. Cancel this opening or log it as a separate tasting.");
        return;
      }
    } else if (editingId) {
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
    setOpeningId(null);
    setOpeningError("");
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

  function beginOpening(bottle: InventoryBottle) {
    setOpeningId(bottle.id);
    setEditingId(null);
    setOpeningError("");
    setFormDraft(entryToFormDraft({ ...bottle, rating: 4, notes: "", tastedOn: getTodayIsoDate(), createdAt: "" }));
    nameInputRef.current?.focus({ preventScroll: true });
    document.getElementById("add-tasting")?.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  const hasEntries = entries.length > 0;
  const filtersAreActive =
    filters.search !== DEFAULT_WINE_FILTERS.search ||
    filters.type !== DEFAULT_WINE_FILTERS.type ||
    filters.minRating !== DEFAULT_WINE_FILTERS.minRating ||
    filters.sort !== DEFAULT_WINE_FILTERS.sort ||
    filters.sortDirection !== DEFAULT_WINE_FILTERS.sortDirection;

  const rack = useMemo(() => wineRack(entries), [entries]);
  const formHeading = editingId ? "Edit bottle" : hasEntries ? "Log a bottle" : "Log your first bottle";

  return (
    <div className="wc-root" data-empty={hasEntries ? undefined : "true"}>
      <div className="c97-shell c97-frame wc-page">
        <header className="wc-head">
          <div className="wc-title">
            <h1>Wine Cellar</h1>
            <WineCork />
            <p className="wc-lede">
              A cellar book for the bottles you open, one line each, with the producer, the vintage, and what
              you actually thought of it.
            </p>
            {hasEntries ? (
              <p className="wc-summary">{cellarSummary(entries, rack, summary.averageRating)}</p>
            ) : null}
          </div>
          {hasEntries ? (
            <div className="wc-rack-wrap">
              <WineRack rows={rack} />
              <ul className="wc-legend" aria-label="Wine type legend">
                {summary.typeBreakdown.map(({ type }) => (
                  <li key={type} className="wc-type">
                    <TypeSwatch type={type} />
                    {WINE_TYPE_LABELS[type]}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </header>

        <WineInventory onOpen={beginOpening} />
        <div className="wc-book">
          <div className="wc-list-col">
            <div className="wc-list-head">
              <h2>Tasting log</h2>
              {hasEntries && filtersAreActive ? (
                <p className="wc-count">
                  {visibleEntries.length} of {entries.length} shown
                </p>
              ) : null}
            </div>

            {/* Search, filters, and sorting arrive with the first bottle, when there is something to organize. */}
            {hasEntries ? (
              <div className="wc-toolbar">
                <label className="wc-search">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Search wines"
                    placeholder="Search by name, producer, region, grape, or notes"
                    value={filters.search}
                    onChange={(event) => updateFilters((current) => ({ ...current, search: event.target.value }))}
                  />
                </label>
                <label className="wc-control">
                  <span className="wc-label">Type</span>
                  <select
                    aria-label="Filter by wine type"
                    value={filters.type}
                    onChange={(event) =>
                      updateFilters((current) => ({ ...current, type: event.target.value as typeof current.type }))
                    }
                    className="c97-field"
                  >
                    <option value="all">All types</option>
                    {WINE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {WINE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wc-control">
                  <span className="wc-label">Min rating</span>
                  <select
                    value={String(filters.minRating)}
                    onChange={(event) =>
                      updateFilters((current) => ({ ...current, minRating: Number(event.target.value) }))
                    }
                    className="c97-field"
                  >
                    <option value="0">Any</option>
                    <option value="3">3+ stars</option>
                    <option value="3.5">3.5+ stars</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                    <option value="5">5 stars only</option>
                  </select>
                </label>
                <div className="wc-control wc-control-sort">
                  <span id="wine-sort-label" className="wc-label">
                    Sort by
                  </span>
                  <span className="wc-sort">
                    <select
                      aria-labelledby="wine-sort-label"
                      value={filters.sort}
                      onChange={(event) =>
                        updateFilters((current) => ({ ...current, sort: event.target.value as WineSortKey }))
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
                      className="wc-icon-btn"
                    >
                      {filters.sortDirection === "asc" ? "↑" : "↓"}
                    </button>
                  </span>
                </div>
                {filtersAreActive ? (
                  <button type="button" onClick={resetFilters} className="c97-btn-ghost wc-reset">
                    Reset filters
                  </button>
                ) : null}
              </div>
            ) : null}

            <section aria-label="Tasting log">
              {!hasEntries ? (
                <figure className="wc-example">
                  <figcaption className="wc-example-caption">
                    A sample line, so you can see how a bottle reads once it is logged. Nothing is in your
                    cellar yet, and the first bottle you add takes its place.
                  </figcaption>
                  <div className="wc-line">
                    <BottleLine entry={EXAMPLE_BOTTLE} />
                  </div>
                </figure>
              ) : visibleEntries.length === 0 ? (
                <p className="wc-empty">No bottles match these filters. Try widening your search or reset filters.</p>
              ) : (
                <ul className="wc-lines">
                  {visibleEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="wc-line"
                      aria-current={editingId === entry.id ? "true" : undefined}
                    >
                      <BottleLine
                        entry={entry}
                        actions={
                          <p className="wc-actions">
                            <button
                              type="button"
                              aria-label={`Edit ${entry.name}`}
                              onClick={() => handleEdit(entry.id)}
                              className="c97-btn-ghost"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${entry.name}`}
                              onClick={() => handleDelete(entry.id)}
                              className="c97-btn-ghost"
                            >
                              Delete
                            </button>
                          </p>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside
            aria-label="Wine cellar side panel"
            // In an empty cellar the form comes first on a phone; from 900px up the grid places it on the right.
            className={`wc-form-col${hasEntries ? "" : " order-first"}`}
          >
            <div id="add-tasting">
              <h2>{formHeading}</h2>
              {openingId && <p className="wc-note">Saving this tasting opens one bottle from your shelf.</p>}
              {openingError && <p role="alert" className="wc-error">{openingError}</p>}
              <form onSubmit={handleSubmit} className="wc-form">
                <label className="wc-field wc-wide">
                  <span className="wc-label">Wine name</span>
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
                    placeholder="Brunello di Montalcino"
                    className="c97-field"
                  />
                </label>
                {nameMissing ? (
                  <p id="wine-name-error" role="alert" className="wc-error wc-wide">
                    Give the bottle a name to log it.
                  </p>
                ) : null}
                <label className="wc-field">
                  <span className="wc-label">Producer</span>
                  <input
                    type="text"
                    value={formDraft.producer}
                    onChange={(event) => setFormDraft((current) => ({ ...current, producer: event.target.value }))}
                    placeholder="Biondi-Santi"
                    className="c97-field"
                  />
                </label>
                <label className="wc-field">
                  <span className="wc-label">Vintage</span>
                  <input
                    type="number"
                    min="1800"
                    max="2100"
                    step="1"
                    value={formDraft.vintage}
                    onChange={(event) => setFormDraft((current) => ({ ...current, vintage: event.target.value }))}
                    placeholder="2018"
                    className="c97-field"
                  />
                </label>
                {/* A vintage past this year gets a line (docs/EASTER_EGGS.md). The draft is empty on the server, so the clock is only read after a keystroke. */}
                {(parseNumberInput(formDraft.vintage) ?? 0) > new Date().getFullYear() ? (
                  <p className="wc-note wc-wide" role="status" style={{ marginTop: 0 }}>
                    A bottle from the future. I&apos;d open it before the paradox does.
                  </p>
                ) : null}
                <label className="wc-field">
                  <span className="wc-label">Region</span>
                  <input
                    type="text"
                    value={formDraft.region}
                    onChange={(event) => setFormDraft((current) => ({ ...current, region: event.target.value }))}
                    placeholder="Tuscany"
                    className="c97-field"
                  />
                </label>
                <label className="wc-field">
                  <span className="wc-label">Varietal / grape</span>
                  <input
                    type="text"
                    value={formDraft.varietal}
                    onChange={(event) => setFormDraft((current) => ({ ...current, varietal: event.target.value }))}
                    placeholder="Sangiovese"
                    className="c97-field"
                  />
                </label>
                <label className="wc-field">
                  <span className="wc-label">Type</span>
                  <select
                    aria-label="Wine type"
                    value={formDraft.type}
                    onChange={(event) =>
                      setFormDraft((current) => ({ ...current, type: event.target.value as WineType }))
                    }
                    className="c97-field"
                  >
                    {WINE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {WINE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wc-field">
                  <span className="wc-label">Tasted on</span>
                  <input
                    type="date"
                    value={formDraft.tastedOn}
                    onChange={(event) => setFormDraft((current) => ({ ...current, tastedOn: event.target.value }))}
                    className="c97-field"
                  />
                </label>
                <label className="wc-field">
                  <span className="wc-label">Price (USD)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formDraft.price}
                    onChange={(event) => setFormDraft((current) => ({ ...current, price: event.target.value }))}
                    placeholder="120"
                    className="c97-field"
                  />
                </label>
                <label className="wc-field">
                  <span className="wc-label wc-rating-label">
                    <span>Rating</span>
                    <span className="wc-rating">
                      <StarRating value={Number(formDraft.rating || 0)} />
                      <span className="wc-figure">{Number(formDraft.rating || 0).toFixed(1)}</span>
                    </span>
                  </span>
                  <input
                    aria-label="Rating"
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={formDraft.rating}
                    onChange={(event) => setFormDraft((current) => ({ ...current, rating: event.target.value }))}
                    className="c97-range"
                  />
                </label>
                <label className="wc-field wc-wide">
                  <span className="wc-label">Tasting notes</span>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={formDraft.notes}
                    onChange={(event) => setFormDraft((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Cherry, leather, dried herbs."
                    className="c97-field"
                  />
                </label>
                <p className="wc-submit wc-wide">
                  <button type="submit" className="c97-btn wc-add">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {editingId ? "Save tasting" : "Add tasting"}
                  </button>
                  {editingId || openingId ? (
                    <button type="button" onClick={resetForm} className="c97-btn-ghost">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Cancel
                    </button>
                  ) : null}
                </p>
              </form>
              {persistenceStatus === "memory-only" ? (
                <p className="wc-note" role="status">
                  Your cellar is available in this tab, but browser storage is unavailable, so entries may not
                  remain after you close it.
                </p>
              ) : (
                <p className="wc-note">
                  Your bottles are saved in this browser only, with no account or server behind them.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
