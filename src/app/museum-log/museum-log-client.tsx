"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Check,
  Compass,
  Heart,
  HelpCircle,
  Layers,
  NotebookPen,
  Plus,
  Search,
  Star,
  Ticket,
  Trash2,
} from "lucide-react";
import type {
  CuratorReview,
  CuratedList,
  Museum,
  MuseumRouteState,
  MuseumSnapshot,
  MuseumSort,
  MuseumRegionFilter,
  MuseumTypeFilter,
  MuseumView,
  UserVisit,
  VisitLogEntry,
} from "@/types/museum";
import { useMuseumLog } from "@/hooks/useMuseumLog";
import { buildMuseumHref, normalizeMuseumState } from "./museum-log-state";
import {
  admissionStub,
  filterMuseums,
  formatDate,
  formatRuntime,
  formatShortDate,
  formatUpdated,
  getMuseumExhibitStatus,
  REGION_FILTER_OPTIONS,
  REGION_LABEL,
  SORT_LABEL,
  SORT_OPTIONS,
  sortMuseums,
  starFractions,
  TYPE_FILTER_OPTIONS,
  TYPE_LABEL,
  visitStamp,
} from "./museum-log-helpers";
import { toLocalDateKey } from "@/lib/date-formatters";
import "./museum-log.css";
import { useRouteSync } from "@/hooks/useRouteSync";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  initialState: MuseumRouteState;
  snapshot: MuseumSnapshot;
}

const subscribeToLocalDate = () => () => {};
const getServerLocalDate = () => null;

// The width from which the title and the strip of last visits fit one row of
// the shell (see .mlog-head .mlog-strip-wrap). It reads the viewport, so a
// scrollbar that takes room can still wrap the strip for a few pixels past it.
const STRIP_BESIDE_TITLE = "(min-width: 1173px)";

function subscribeToStripRoom(onChange: () => void): () => void {
  const media = window.matchMedia(STRIP_BESIDE_TITLE);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const hasStripRoom = () => window.matchMedia(STRIP_BESIDE_TITLE).matches;
const hasStripRoomOnServer = () => false;

/** A museum name set as a serif heading that opens the museum, with a 44px hit box. */
const nameLinkStyle: React.CSSProperties = {
  background: "none",
  border: 0,
  padding: 0,
  cursor: "pointer",
  textAlign: "left",
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
};

// ─── Primitives ────────────────────────────────────────────────────────────────

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const stars = starFractions(rating);
  return (
    <span
      className="inline-flex items-center"
      style={{ gap: 2 }}
      aria-label={`Rating ${rating} out of 5`}
      role="img"
    >
      {stars.map((fill, idx) => (
        <span
          key={idx}
          className="relative inline-block"
          style={{ width: size, height: size }}
          aria-hidden="true"
        >
          <Star size={size} className="absolute inset-0" style={{ color: "var(--c97-ink-2)" }} strokeWidth={1.4} />
          {fill > 0 && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: fill === 0.5 ? "50%" : "100%" }}
            >
              <Star size={size} style={{ color: "var(--c97-ink)" }} fill="currentColor" strokeWidth={1.4} />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

function RatingPill({ rating, label }: { rating: number; label?: string }) {
  return (
    <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
      <StarRow rating={rating} size={14} />
      <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)" }}>
        {rating.toFixed(1)}
      </span>
      {label ? <span className="mlog-meta">· {label}</span> : null}
    </span>
  );
}

function TagChip({ children }: { children: ReactNode }) {
  return <span className="c97-chip">{children}</span>;
}

/**
 * The page's signature: a museum reads as its own admission ticket. A
 * perforated stub in the ticket sense of the word, printed with the name,
 * city, founding year, admission, the curator's rating, and whether an
 * exhibit is running today. Replaces the old cover-art gradient and initials.
 */
function AdmissionStub({ museum, today }: { museum: Museum; today: string | null }) {
  const stub = admissionStub(museum, today);
  return (
    <div className="mlog-stub">
      <span className="mlog-stub-admit" aria-hidden="true">
        Admit one
      </span>
      <div className="mlog-stub-body">
      <p className="c97-serif mlog-stub-name">{stub.name}</p>
      <p className="mlog-meta">
        {stub.city}
        {stub.founded ? ` · ${stub.founded}` : ""}
      </p>
      <div className="mlog-stub-tear">
        <span className="mlog-stub-price">{stub.admission}</span>
        {/* Labelled, since the hero prints this ticket for the reader's own visit and bare stars read as their rating. */}
        <RatingPill rating={stub.curatorRating} label="curator" />
      </div>
      {stub.exhibitNow ? (
        <span className="c97-chip c97-chip-positive mlog-chip-start">On view now</span>
      ) : null}
      </div>
    </div>
  );
}

/** The last three visits as a strip of ticket stubs, once there are any. It sits in the title row, or after the catalog where that row has no room. */
function VisitStrip({
  museums,
  today,
  onOpen,
}: {
  museums: Museum[];
  today: string | null;
  onOpen: (slug: string) => void;
}) {
  if (museums.length === 0) return null;
  return (
    <div className="mlog-strip-wrap">
      <p className="mlog-meta">Your last visits</p>
      <ul className="mlog-strip" aria-label="Your last visits">
        {museums.map((museum) => (
          <li key={museum.id}>
            <button
              type="button"
              onClick={() => onOpen(museum.slug)}
              className="mlog-stub-trigger"
              aria-label={`Open ${museum.name}`}
            >
              <AdmissionStub museum={museum} today={today} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Quick action buttons (watchlist / liked / visited toggles) ──────────────

interface QuickActionsProps {
  museum: Museum;
  visit?: UserVisit;
  isWatchlisted: boolean;
  isLiked: boolean;
  onToggleWatchlist: () => void;
  onToggleLiked: () => void;
  onLogQuickVisit: () => void;
  onClearVisit: () => void;
}

function QuickActions({
  museum,
  visit,
  isWatchlisted,
  isLiked,
  onToggleWatchlist,
  onToggleLiked,
  onLogQuickVisit,
  onClearVisit,
}: QuickActionsProps) {
  const isVisited = Boolean(visit);
  return (
    <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }} role="group" aria-label={`Actions for ${museum.name}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isVisited) onClearVisit();
          else onLogQuickVisit();
        }}
        aria-pressed={isVisited}
        aria-label={isVisited ? `Mark ${museum.name} as not visited` : `Log a visit to ${museum.name}`}
        className="mlog-action"
      >
        {isVisited ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
        {isVisited ? "Visited" : "Log visit"}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleWatchlist();
        }}
        aria-pressed={isWatchlisted}
        aria-label={isWatchlisted ? `Remove ${museum.name} from watchlist` : `Save ${museum.name} to watchlist`}
        className="mlog-action"
      >
        {isWatchlisted ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
        {isWatchlisted ? "Saved" : "Watchlist"}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLiked();
        }}
        aria-pressed={isLiked}
        className="mlog-action"
      >
        <Heart size={16} aria-hidden="true" fill={isLiked ? "var(--c97-ink)" : "none"} />
        {isLiked ? "Liked" : "Like"}
      </button>
    </div>
  );
}

// ─── Museum card (Discover) ───────────────────────────────────────────────────

interface MuseumCardProps {
  museum: Museum;
  today: string | null;
  visit?: UserVisit;
  isWatchlisted: boolean;
  isLiked: boolean;
  onOpen: () => void;
  onToggleWatchlist: () => void;
  onToggleLiked: () => void;
  onLogQuickVisit: () => void;
  onClearVisit: () => void;
}

function MuseumCard({
  museum,
  today,
  visit,
  isWatchlisted,
  isLiked,
  onOpen,
  onToggleWatchlist,
  onToggleLiked,
  onLogQuickVisit,
  onClearVisit,
}: MuseumCardProps) {
  return (
    <article className="mlog-card">
      <button
        type="button"
        onClick={onOpen}
        className="mlog-stub-trigger"
        aria-label={`Open ${museum.name} detail`}
      >
        <AdmissionStub museum={museum} today={today} />
      </button>

      {visit ? (
        <p className="mlog-meta">
          Your visit {formatShortDate(visit.date)} ·{" "}
          {visit.rating === undefined ? "not rated" : `${visit.rating.toFixed(1)} stars`}
        </p>
      ) : null}

      <p className="mlog-card-blurb">{museum.blurb}</p>

      <div className="mlog-card-actions">
        <QuickActions
          museum={museum}
          visit={visit}
          isWatchlisted={isWatchlisted}
          isLiked={isLiked}
          onToggleWatchlist={onToggleWatchlist}
          onToggleLiked={onToggleLiked}
          onLogQuickVisit={onLogQuickVisit}
          onClearVisit={onClearVisit}
        />
      </div>
    </article>
  );
}

// ─── Discover view ──────────────────────────────────────────────────────────

interface DiscoverViewProps {
  snapshot: MuseumSnapshot;
  state: MuseumRouteState;
  today: string | null;
  query: string;
  onQueryChange: (query: string) => void;
  onChangeFilter: (next: Partial<MuseumRouteState>) => void;
  onOpenMuseum: (slug: string) => void;
  visitDateByMuseumId: Record<string, string | undefined>;
  visitByMuseumId: Record<string, UserVisit | undefined>;
  isWatchlisted: (museumId: string) => boolean;
  isLiked: (museumId: string) => boolean;
  toggleWatchlist: (museumId: string) => void;
  toggleLiked: (museumId: string) => void;
  logQuickVisit: (museum: Museum) => void;
  removeVisit: (museumId: string) => void;
}

function DiscoverView({
  snapshot,
  state,
  today,
  query,
  onQueryChange,
  onChangeFilter,
  onOpenMuseum,
  visitDateByMuseumId,
  visitByMuseumId,
  isWatchlisted,
  isLiked,
  toggleWatchlist,
  toggleLiked,
  logQuickVisit,
  removeVisit,
}: DiscoverViewProps) {
  const filtered = useMemo(
    () => filterMuseums(snapshot.museums, state.type, state.region),
    [snapshot.museums, state.type, state.region],
  );
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.country.toLowerCase().includes(q),
    );
  }, [filtered, query]);
  const sorted = useMemo(
    () => sortMuseums(searched, state.sort, visitDateByMuseumId),
    [searched, state.sort, visitDateByMuseumId],
  );

  return (
    <div className="mlog-stack">
      <div className="mlog-toolbar" role="group" aria-label="Search and filters">
        <label className="mlog-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            aria-label="Filter museums"
            placeholder="Filter museums…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </label>
        <FilterSelect
          label="Type"
          value={state.type}
          options={TYPE_FILTER_OPTIONS}
          onChange={(value) => onChangeFilter({ type: value as MuseumTypeFilter })}
        />
        <FilterSelect
          label="Region"
          value={state.region}
          options={REGION_FILTER_OPTIONS}
          onChange={(value) => onChangeFilter({ region: value as MuseumRegionFilter })}
        />
        <div className="mlog-sort" role="group" aria-label="Sort">
          {SORT_OPTIONS.map((sortKey) => (
            <button
              key={sortKey}
              type="button"
              onClick={() => onChangeFilter({ sort: sortKey as MuseumSort })}
              aria-pressed={state.sort === sortKey}
              className="mlog-sort-btn"
            >
              {SORT_LABEL[sortKey]}
            </button>
          ))}
        </div>
      </div>

      <p className="mlog-meta mlog-count">
        {sorted.length} {sorted.length === 1 ? "museum" : "museums"} in the catalog
        {state.type !== "all" && ` · ${TYPE_LABEL[state.type]}`}
        {state.region !== "all" && ` · ${REGION_LABEL[state.region]}`}
        {query.trim() && ` · matching "${query.trim()}"`}
      </p>

      {sorted.length === 0 ? (
        <p className="mlog-empty">No museums match the current filters. Adjust type, region, or your search to see more.</p>
      ) : (
        <div className="mlog-grid">
          {sorted.map((museum) => {
            const visit = visitByMuseumId[museum.id];
            return (
              <MuseumCard
                key={museum.id}
                museum={museum}
                today={today}
                visit={visit}
                isWatchlisted={isWatchlisted(museum.id)}
                isLiked={isLiked(museum.id)}
                onOpen={() => onOpenMuseum(museum.slug)}
                onToggleWatchlist={() => toggleWatchlist(museum.id)}
                onToggleLiked={() => toggleLiked(museum.id)}
                onLogQuickVisit={() => logQuickVisit(museum)}
                onClearVisit={() => removeVisit(museum.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <label htmlFor={id} className="mlog-filter">
      <span className="c97-kicker">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="c97-field mlog-select">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ─── Journal view (curator reviews + stamped visit diary) ────────────────────

function JournalView({
  snapshot,
  museumById,
  onOpenMuseum,
}: {
  snapshot: MuseumSnapshot;
  museumById: Record<string, Museum>;
  onOpenMuseum: (slug: string) => void;
}) {
  const sortedReviews = useMemo(
    () => [...snapshot.reviews].sort((a, b) => b.dateVisited.localeCompare(a.dateVisited)),
    [snapshot.reviews],
  );
  const sortedLog = useMemo(
    () => [...snapshot.visitLog].sort((a, b) => b.date.localeCompare(a.date)),
    [snapshot.visitLog],
  );

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]" style={{ gap: "var(--c97-sp-4)" }}>
      <section>
        <p className="c97-kicker">Reviews</p>
        <h3 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
          {snapshot.curatorName}&rsquo;s reviews
        </h3>
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
          {snapshot.curatorBio}
        </p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "var(--c97-sp-4)" }}>
          {sortedReviews.map((review) => {
            const museum = museumById[review.museumId];
            if (!museum) return null;
            return (
              <ReviewCard
                key={review.id}
                review={review}
                museum={museum}
                onOpenMuseum={() => onOpenMuseum(museum.slug)}
              />
            );
          })}
        </ol>
      </section>

      <aside>
        <p className="c97-kicker">Curator&rsquo;s diary</p>
        <h3 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
          Stamped visits
        </h3>
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
          Every visit {snapshot.curatorName} logged to the diary, dated when it happened. Your own visits show on
          each museum&rsquo;s card in Discover.
        </p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "var(--c97-sp-3)" }}>
          {sortedLog.map((entry) => {
            const museum = museumById[entry.museumId];
            if (!museum) return null;
            return (
              <VisitStampCard
                key={entry.id}
                entry={entry}
                museum={museum}
                onOpenMuseum={() => onOpenMuseum(museum.slug)}
              />
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

function ReviewCard({
  review,
  museum,
  onOpenMuseum,
}: {
  review: CuratorReview;
  museum: Museum;
  onOpenMuseum: () => void;
}) {
  return (
    <li style={{ borderTop: "1px solid var(--c97-rule)", paddingBlock: "var(--c97-sp-4)" }}>
      <div className="flex flex-wrap items-baseline" style={{ gap: "var(--c97-sp-1)" }}>
        <button
          type="button"
          onClick={onOpenMuseum}
          className="c97-serif c97-h3 c97-link-heading"
          style={nameLinkStyle}
        >
          {museum.name}
        </button>
        <span className="mlog-meta">{museum.city}</span>
        <span className="mlog-meta" style={{ marginLeft: "auto" }}>
          {formatDate(review.dateVisited)}
        </span>
      </div>
      <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
        <StarRow rating={review.rating} size={16} />
        <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)" }}>
          {review.rating.toFixed(1)} / 5
        </span>
        {review.liked && <Heart size={14} aria-label="Liked" fill="var(--c97-ink)" stroke="var(--c97-ink)" />}
        {review.exhibitTitle && (
          <span className="mlog-meta" style={{ display: "inline-flex", alignItems: "center", gap: "var(--c97-sp-0)" }}>
            <Ticket size={12} aria-hidden="true" /> {review.exhibitTitle}
          </span>
        )}
      </div>
      <p className="c97-serif" style={{ fontSize: "var(--c97-fs-h3)", marginTop: "var(--c97-sp-2)" }}>
        {review.headline}
      </p>
      <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
        {review.body}
      </p>
      {review.recommendedFor && (
        <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", fontStyle: "italic", marginTop: "var(--c97-sp-2)" }}>
          Recommended for: {review.recommendedFor}
        </p>
      )}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
          {review.tags.map((tag) => (
            <TagChip key={tag}>{tag}</TagChip>
          ))}
        </div>
      )}
    </li>
  );
}

/** A stamped visit record: a rubber date stamp beside the rating and note. */
function VisitStampCard({
  entry,
  museum,
  onOpenMuseum,
}: {
  entry: VisitLogEntry;
  museum: Museum;
  onOpenMuseum: () => void;
}) {
  const stamp = visitStamp(entry.date);
  return (
    <li
      className="mlog-stamp-row"
      style={{ borderTop: "1px solid var(--c97-rule)", paddingBlock: "var(--c97-sp-3)" }}
    >
      {stamp ? (
        <time dateTime={entry.date} className="mlog-visit-stamp">
          <span className="sr-only">Visited {formatDate(entry.date)}</span>
          <span className="mlog-visit-stamp-month" aria-hidden="true">{stamp.month}</span>
          <span className="mlog-visit-stamp-day" aria-hidden="true">{stamp.day}</span>
          <span className="mlog-visit-stamp-year" aria-hidden="true">{stamp.year}</span>
        </time>
      ) : (
        <div />
      )}
      <div style={{ minWidth: 0 }}>
        <button
          type="button"
          onClick={onOpenMuseum}
          className="c97-serif c97-link-heading"
          style={{ ...nameLinkStyle, fontSize: "var(--c97-fs-h3)" }}
        >
          {museum.name}
        </button>
        <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
          <StarRow rating={entry.rating} size={12} />
          <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)" }}>
            {entry.rating.toFixed(1)}
          </span>
          {entry.exhibitTitle && <span className="mlog-meta">{entry.exhibitTitle}</span>}
        </div>
        {entry.note && (
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", fontStyle: "italic", marginTop: "var(--c97-sp-1)" }}>
            &ldquo;{entry.note}&rdquo;
          </p>
        )}
      </div>
    </li>
  );
}

// ─── Lists view (exhibition catalogues) ───────────────────────────────────────

interface ListsViewProps {
  snapshot: MuseumSnapshot;
  museumById: Record<string, Museum>;
  today: string | null;
  selectedListSlug: string | null;
  onSelectList: (slug: string | null) => void;
  onOpenMuseum: (slug: string) => void;
  visitByMuseumId: Record<string, UserVisit | undefined>;
  isWatchlisted: (museumId: string) => boolean;
  isLiked: (museumId: string) => boolean;
  toggleWatchlist: (museumId: string) => void;
  toggleLiked: (museumId: string) => void;
  logQuickVisit: (museum: Museum) => void;
  removeVisit: (museumId: string) => void;
}

function ListsView({
  snapshot,
  museumById,
  today,
  selectedListSlug,
  onSelectList,
  onOpenMuseum,
  visitByMuseumId,
  isWatchlisted,
  isLiked,
  toggleWatchlist,
  toggleLiked,
  logQuickVisit,
  removeVisit,
}: ListsViewProps) {
  const selectedList = useMemo(
    () => snapshot.lists.find((l) => l.slug === selectedListSlug) ?? null,
    [snapshot.lists, selectedListSlug],
  );

  if (selectedList) {
    const museums = selectedList.museumIds
      .map((id) => museumById[id])
      .filter((m): m is Museum => Boolean(m));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-3)" }}>
        <button type="button" onClick={() => onSelectList(null)} className="c97-btn-ghost" style={{ alignSelf: "flex-start" }}>
          ← All catalogues
        </button>
        <header>
          <p className="c97-kicker">
            Exhibition catalogue · {museums.length} {museums.length === 1 ? "museum" : "museums"}
          </p>
          <h3 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-1)" }}>
            {selectedList.title}
          </h3>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
            {selectedList.description}
          </p>
          <p className="mlog-meta" style={{ marginTop: "var(--c97-sp-2)" }}>
            Curated by {selectedList.curator} · Updated {formatShortDate(selectedList.updatedAt)}
          </p>
        </header>
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {museums.map((museum, index) => (
            <CatalogueEntry
              key={museum.id}
              index={index}
              museum={museum}
              today={today}
              visit={visitByMuseumId[museum.id]}
              isWatchlisted={isWatchlisted(museum.id)}
              isLiked={isLiked(museum.id)}
              onOpen={() => onOpenMuseum(museum.slug)}
              onToggleWatchlist={() => toggleWatchlist(museum.id)}
              onToggleLiked={() => toggleLiked(museum.id)}
              onLogQuickVisit={() => logQuickVisit(museum)}
              onClearVisit={() => removeVisit(museum.id)}
            />
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="mlog-lists">
      {snapshot.lists.map((list) => (
        <ListPreviewCard
          key={list.id}
          list={list}
          museumById={museumById}
          onOpen={() => onSelectList(list.slug)}
        />
      ))}
    </div>
  );
}

function ListPreviewCard({
  list,
  museumById,
  onOpen,
}: {
  list: CuratedList;
  museumById: Record<string, Museum>;
  onOpen: () => void;
}) {
  const count = list.museumIds.filter((id) => museumById[id]).length;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mlog-list-card"
    >
      <span className="c97-kicker">
        Exhibition catalogue · {count} {count === 1 ? "museum" : "museums"}
      </span>
      <span className="mlog-list-title">{list.title}</span>
      <span className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
        {list.description}
      </span>
      <span className="mlog-meta" style={{ marginTop: "auto" }}>
        Curated by {list.curator} · Updated {formatShortDate(list.updatedAt)}
      </span>
    </button>
  );
}

/** A numbered catalogue entry, the way a list reads as a printed exhibition catalogue. */
function CatalogueEntry({
  index,
  museum,
  today,
  visit,
  isWatchlisted,
  isLiked,
  onOpen,
  onToggleWatchlist,
  onToggleLiked,
  onLogQuickVisit,
  onClearVisit,
}: {
  index: number;
  museum: Museum;
  today: string | null;
} & Omit<QuickActionsProps, "museum" | "visit"> & { visit?: UserVisit; onOpen: () => void }) {
  const stub = admissionStub(museum, today);
  return (
    <li
      className="c97-row c97-row-numbered c97-row-stack-sm"
      style={{ borderTop: "1px solid var(--c97-rule)", paddingBlock: "var(--c97-sp-3)", rowGap: "var(--c97-sp-2)" }}
    >
      <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-label)" }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <div style={{ minWidth: 0 }}>
        <button
          type="button"
          onClick={onOpen}
          className="c97-serif c97-link-heading"
          style={{ ...nameLinkStyle, fontSize: "var(--c97-fs-h3)" }}
        >
          {stub.name}
        </button>
        <p className="mlog-meta">
          {stub.city}
          {stub.founded ? ` · ${stub.founded}` : ""} · {stub.admission}
          {stub.exhibitNow ? " · On view now" : ""}
        </p>
        <div style={{ marginTop: "var(--c97-sp-2)" }}>
          <QuickActions
            museum={museum}
            visit={visit}
            isWatchlisted={isWatchlisted}
            isLiked={isLiked}
            onToggleWatchlist={onToggleWatchlist}
            onToggleLiked={onToggleLiked}
            onLogQuickVisit={onLogQuickVisit}
            onClearVisit={onClearVisit}
          />
        </div>
      </div>
      <StarRow rating={stub.curatorRating} size={14} />
    </li>
  );
}

// ─── Museum detail view ──────────────────────────────────────────────────────

interface MuseumDetailViewProps {
  museum: Museum;
  snapshot: MuseumSnapshot;
  today: string | null;
  visit?: UserVisit;
  isWatchlisted: boolean;
  isLiked: boolean;
  onBack: () => void;
  onToggleWatchlist: () => void;
  onToggleLiked: () => void;
  onLogVisit: (visit: UserVisit) => void;
  onClearVisit: () => void;
  onOpenList: (slug: string) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

function MuseumDetailView({
  headingRef,
  museum,
  snapshot,
  today,
  visit,
  isWatchlisted,
  isLiked,
  onBack,
  onToggleWatchlist,
  onToggleLiked,
  onLogVisit,
  onClearVisit,
  onOpenList,
}: MuseumDetailViewProps) {
  const activityRef = useRef<HTMLHeadingElement>(null);
  const pendingActivityFocus = useRef(false);
  useEffect(() => {
    if (!pendingActivityFocus.current) return;
    pendingActivityFocus.current = false;
    activityRef.current?.focus();
  }, [visit]);
  const review = snapshot.reviews.find((r) => r.museumId === museum.id);
  const inLists = snapshot.lists.filter((l) => l.museumIds.includes(museum.id));
  const visitLogEntries = snapshot.visitLog
    .filter((v) => v.museumId === museum.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mlog-detail">
      <button type="button" onClick={onBack} className="c97-btn-ghost mlog-back">
        ← Back to catalog
      </button>

      <header className="mlog-detail-head">
        <div className="mlog-detail-stub">
          <AdmissionStub museum={museum} today={today} />
        </div>
        <div className="mlog-stack">
          <p className="c97-kicker">
            {TYPE_LABEL[museum.type]} · {REGION_LABEL[museum.region]}
          </p>
          <h2 ref={headingRef} tabIndex={-1} className="mlog-detail-name">
            {museum.name}
          </h2>
          <p className="mlog-meta">
            {museum.country} · {formatRuntime(museum.visitMinutesAvg)} average visit
          </p>
          <div className="mlog-row-wrap">
            <RatingPill rating={museum.curatorRating} label="curator" />
            {visit?.rating !== undefined && <RatingPill rating={visit.rating} label="you" />}
          </div>
          <p>{museum.blurb}</p>
          <QuickActions
            museum={museum}
            visit={visit}
            isWatchlisted={isWatchlisted}
            isLiked={isLiked}
            onToggleWatchlist={onToggleWatchlist}
            onToggleLiked={onToggleLiked}
            onLogQuickVisit={() => onLogVisit({ museumId: museum.id, date: toLocalDateKey() })}
            onClearVisit={onClearVisit}
          />
          {museum.websiteUrl && (
            <p className="mlog-meta">
              <a className="c97-btn-ghost" href={museum.websiteUrl} target="_blank" rel="noopener noreferrer">
                Visit official site
              </a>
            </p>
          )}
        </div>
      </header>

      {review && (
        <section className="mlog-detail-part" aria-labelledby={`mlog-review-${museum.id}`}>
          <h3 id={`mlog-review-${museum.id}`} className="mlog-part-title">Curator review</h3>
          <div className="mlog-row-wrap">
            <StarRow rating={review.rating} size={18} />
            <span className="c97-mono mlog-small">{review.rating.toFixed(1)} / 5</span>
            <span className="mlog-meta">Visited {formatDate(review.dateVisited)}</span>
            {review.liked && <Heart size={14} fill="var(--c97-ink)" stroke="var(--c97-ink)" aria-label="Liked" />}
          </div>
          <p className="mlog-review-headline">{review.headline}</p>
          <p>{review.body}</p>
          {review.recommendedFor && <p className="mlog-small mlog-italic">Recommended for: {review.recommendedFor}</p>}
          {review.tags.length > 0 && (
            <div className="mlog-row-wrap">
              {review.tags.map((tag) => (
                <TagChip key={tag}>{tag}</TagChip>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mlog-detail-part" aria-labelledby={`mlog-highlights-${museum.id}`}>
        <h3 id={`mlog-highlights-${museum.id}`} className="mlog-part-title">What to actually see</h3>
        <ul className="mlog-highlights">
          {museum.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      {museum.exhibits.length > 0 && (
        <section className="mlog-detail-part" aria-labelledby={`mlog-exhibits-${museum.id}`}>
          <h3 id={`mlog-exhibits-${museum.id}`} className="mlog-part-title">Exhibition calendar</h3>
          <ol className="mlog-ruled">
            {museum.exhibits.map((ex) => {
              const status = getMuseumExhibitStatus(ex, today);
              const chipTone =
                status === "current" ? " c97-chip-positive" : status === "upcoming" ? " c97-chip-warning" : "";
              return (
                <li key={ex.id}>
                  <div className="mlog-exhibit-head">
                    <div className="mlog-row-wrap">
                      <p className="mlog-exhibit-title">{ex.title}</p>
                      {status && <span className={`c97-chip${chipTone}`}>{status}</span>}
                    </div>
                    <span className="mlog-meta">
                      {formatShortDate(ex.startDate)} – {ex.endDate ? formatShortDate(ex.endDate) : "Permanent"}
                    </span>
                  </div>
                  <p className="mlog-small">{ex.blurb}</p>
                  {ex.ticketed && (
                    <span className="c97-chip mlog-chip-start">
                      <Ticket size={12} aria-hidden="true" /> Separate ticket
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="mlog-detail-part" aria-labelledby={`mlog-activity-${museum.id}`}>
        <h3 id={`mlog-activity-${museum.id}`} ref={activityRef} tabIndex={-1} className="mlog-part-title">
          Your activity
        </h3>
        {visit ? (
          <>
            <p>Visited on {formatDate(visit.date)}</p>
            {visit.rating !== undefined && <RatingPill rating={visit.rating} />}
            {visit.note && <p className="mlog-small mlog-italic">&ldquo;{visit.note}&rdquo;</p>}
            {visit.rating === undefined && (
              <>
                <p className="mlog-small">
                  You have not rated this visit.{" "}
                  <span className="mlog-activity-help">Move the slider to your rating and save it.</span>
                </p>
                <RateAndLogForm
                  logged
                  onSubmit={(rating, note) => {
                    pendingActivityFocus.current = true;
                    onLogVisit({ ...visit, rating, note: note || visit.note });
                  }}
                />
              </>
            )}
            <button
              type="button"
              onClick={() => {
                pendingActivityFocus.current = true;
                onClearVisit();
              }}
              className="mlog-action mlog-chip-start"
            >
              <Trash2 size={12} aria-hidden="true" /> Remove visit
            </button>
          </>
        ) : (
          <>
            <p className="mlog-small">
              No visit logged yet.{" "}
              <span className="mlog-activity-help">
                Use the buttons above to mark this one done without a rating, save it for later, or like it. To log it
                with a rating, move the slider here to your own and save.
              </span>
            </p>
            <RateAndLogForm
              onSubmit={(rating, note) => {
                pendingActivityFocus.current = true;
                onLogVisit({
                  museumId: museum.id,
                  date: toLocalDateKey(),
                  rating,
                  note: note || undefined,
                });
              }}
            />
          </>
        )}
      </section>

      {visitLogEntries.length > 0 && (
        <section className="mlog-detail-part" aria-labelledby={`mlog-history-${museum.id}`}>
          {/* Named as the curator's, since these diary rows sit right under the reader's own activity. */}
          <h3 id={`mlog-history-${museum.id}`} className="mlog-part-title">Curator&rsquo;s past visits</h3>
          <ol className="mlog-ruled">
            {visitLogEntries.map((entry) => (
              <li key={entry.id} className="mlog-history-row">
                <span className="mlog-meta mlog-row-wrap">
                  <Calendar size={12} aria-hidden="true" /> {formatShortDate(entry.date)}
                </span>
                <RatingPill rating={entry.rating} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {inLists.length > 0 && (
        <section className="mlog-detail-part" aria-labelledby={`mlog-lists-${museum.id}`}>
          <h3 id={`mlog-lists-${museum.id}`} className="mlog-part-title">Appears in</h3>
          <ul className="mlog-stack-tight">
            {inLists.map((list) => (
              <li key={list.id}>
                <button type="button" onClick={() => onOpenList(list.slug)} className="c97-btn-ghost">
                  {list.title} · {list.museumIds.length} museums
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RateAndLogForm({
  logged = false,
  onSubmit,
}: {
  /** The visit already exists and only its rating is missing. */
  logged?: boolean;
  onSubmit: (rating: number, note: string) => void;
}) {
  // No rating until the reader moves the slider, so nobody else's number
  // (the curator's, say) ever saves as theirs.
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (rating !== null) onSubmit(rating, note.trim());
      }}
      aria-label={logged ? "Rate this museum visit" : "Rate and log this museum visit"}
      className="mlog-rate-form"
    >
      <div className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={rating === null ? 0 : rating * 2}
          onChange={(e) => setRating(Number(e.target.value) / 2)}
          aria-label="Your rating, 0 to 5 stars"
          className="c97-range"
          style={{ flex: 1 }}
        />
        <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
          {rating === null ? null : <StarRow rating={rating} size={14} />}
          <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)" }}>
            {rating === null ? "Not rated" : rating.toFixed(1)}
          </span>
        </span>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (private to your browser)"
        aria-label="Visit note"
        rows={2}
        className="c97-field"
      />
      <button type="submit" className="c97-btn" disabled={rating === null} style={{ alignSelf: "flex-start" }}>
        <Check size={16} aria-hidden="true" style={{ marginRight: "var(--c97-sp-0)", display: "inline" }} /> {logged ? "Save rating" : "Log visit"}
      </button>
    </form>
  );
}

// ─── Main client component ───────────────────────────────────────────────────

export function MuseumLogClient({ initialState, snapshot }: Props) {
  const searchParams = useSearchParams();

  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("museum") !== null ||
    searchParams.get("list") !== null ||
    searchParams.get("sort") !== null ||
    searchParams.get("type") !== null ||
    searchParams.get("region") !== null;
  const routeState = hasManagedParams ? normalizeMuseumState(searchParams) : initialState;

  const desiredHref = buildMuseumHref(routeState, searchParams);

  const pushHref = useRouteSync("/museum-log", desiredHref);

  function navigate(nextState: MuseumRouteState) {
    const href = buildMuseumHref(nextState, searchParams);
    pushHref(href);
  }

  function handleViewChange(view: MuseumView) {
    navigate({ ...routeState, view, museum: null, list: view === "lists" ? routeState.list : null });
  }

  // Opening a museum or going back moves focus and the view to the new state,
  // but only after a click, never on a cold load of ?view=museum.
  const pendingFocus = useRef<"detail" | "catalog" | null>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const catalogHeadingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();

  function handleOpenMuseum(slug: string) {
    pendingFocus.current = "detail";
    navigate({ ...routeState, view: "museum", museum: slug });
  }

  function handleOpenList(slug: string) {
    navigate({ ...routeState, view: "lists", list: slug, museum: null });
  }

  function handleBackFromMuseum() {
    pendingFocus.current = "catalog";
    // A list slug rides along when a museum was opened from a catalogue, and
    // the normalizer would read it as the Lists view, so it goes too.
    navigate({ ...routeState, view: "discover", museum: null, list: null });
  }

  function handleSelectList(slug: string | null) {
    navigate({ ...routeState, view: "lists", list: slug });
  }

  function handleChangeFilter(next: Partial<MuseumRouteState>) {
    navigate({ ...routeState, ...next });
  }

  // ─── Local user state ──────────────────────────────────────────────────────
  const {
    state: userState,
    hydrated,
    persistenceStatus,
    isWatchlisted,
    isLiked,
    findVisit,
    toggleWatchlist,
    toggleLiked,
    logVisit,
    removeVisit,
  } = useMuseumLog();

  // The server snapshot stays null because its timezone can differ from the
  // visitor's. React reads the local date after hydration without an effect.
  const today = useSyncExternalStore(subscribeToLocalDate, toLocalDateKey, getServerLocalDate);

  // The strip only renders once the saved log is read. Beside the title it
  // costs the catalog a line or two, and where it cannot fit there it goes
  // after the catalog, so it never lands above what is already being read.
  const stripBesideTitle = useSyncExternalStore(subscribeToStripRoom, hasStripRoom, hasStripRoomOnServer);

  // ─── Lookups ──────────────────────────────────────────────────────────────
  const museumBySlug = useMemo(() => {
    const map: Record<string, Museum> = {};
    for (const m of snapshot.museums) map[m.slug] = m;
    return map;
  }, [snapshot.museums]);

  const museumById = useMemo(() => {
    const map: Record<string, Museum> = {};
    for (const m of snapshot.museums) map[m.id] = m;
    return map;
  }, [snapshot.museums]);

  const visitDateByMuseumId = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const v of userState.visited) map[v.museumId] = v.date;
    // Fall back to curator visit log so the "recent" sort has signal pre-login.
    for (const v of snapshot.visitLog) {
      if (!map[v.museumId]) map[v.museumId] = v.date;
    }
    return map;
  }, [userState.visited, snapshot.visitLog]);

  const visitByMuseumId = useMemo(() => {
    const map: Record<string, UserVisit | undefined> = {};
    for (const v of userState.visited) map[v.museumId] = v;
    return map;
  }, [userState.visited]);

  const lastUpdated = useMemo(() => formatUpdated(snapshot.generatedAt), [snapshot.generatedAt]);

  const exhibitsNowCount = useMemo(
    () =>
      snapshot.museums.filter((m) => m.exhibits.some((ex) => getMuseumExhibitStatus(ex, today) === "current"))
        .length,
    [snapshot.museums, today],
  );

  // A quick visit records the date only. The reader's rating comes from the detail form.
  function logQuickVisit(museum: Museum) {
    logVisit({ museumId: museum.id, date: toLocalDateKey() });
  }

  // ─── Filter (search) state, UI-only and not deep-linked ──────────────────
  const [query, setQuery] = useState("");

  // ─── Resolve detail entity ────────────────────────────────────────────────
  const selectedMuseum = routeState.museum ? museumBySlug[routeState.museum] : null;

  // ─── Title row: the last three visited museums, empty until the log has loaded and holds a visit ──
  const heroVisits = useMemo(() => {
    if (!hydrated) return [];
    // The log keeps same-day visits in the order they were logged, so it is
    // reversed before the stable sort and the latest of a day comes first.
    return [...userState.visited]
      .reverse()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map((v) => museumById[v.museumId])
      .filter((m): m is Museum => Boolean(m));
  }, [hydrated, userState.visited, museumById]);

  // ─── Rail data: top liked, or the curator's favorites as the fallback ────
  const topLiked = useMemo(() => {
    const liked = userState.liked
      .map((id) => museumById[id])
      .filter((m): m is Museum => Boolean(m))
      .slice(0, 5);
    if (liked.length > 0) return liked;
    // Fallback: highest-rated reviews flagged as liked.
    return snapshot.reviews
      .filter((r) => r.liked)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((r) => museumById[r.museumId])
      .filter((m): m is Museum => Boolean(m));
  }, [userState.liked, snapshot.reviews, museumById]);
  const likedFromCurator = hydrated && !userState.liked.some((id) => museumById[id]);

  // For detail view: contextual rail (other museums in same region).
  const contextualMuseums = useMemo(() => {
    if (!selectedMuseum) return [];
    return snapshot.museums
      .filter((m) => m.id !== selectedMuseum.id && m.region === selectedMuseum.region)
      .sort((a, b) => b.curatorRating - a.curatorRating)
      .slice(0, 5);
  }, [selectedMuseum, snapshot.museums]);

  const selectedMuseumId = selectedMuseum?.id;
  useEffect(() => {
    const target = pendingFocus.current;
    const heading = target === "detail" ? detailHeadingRef.current : target === "catalog" ? catalogHeadingRef.current : null;
    if (!heading) return;
    pendingFocus.current = null;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    // The view is a dependency for the way back from a museum the catalog does not hold, where no museum id changes.
  }, [selectedMuseumId, routeState.view, reduceMotion]);

  // Active tab, since the detail view treats Discover as active.
  const activeView: MuseumView = routeState.view === "museum" ? "discover" : routeState.view;

  const navItems: Array<{ id: MuseumView; label: string; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }> }> = [
    { id: "discover", label: "Discover", icon: Compass },
    { id: "journal", label: "Journal", icon: NotebookPen },
    { id: "lists", label: "Lists", icon: Layers },
  ];

  // A dash until the saved log is read, so the server render never states a count of zero.
  const visitedCount = hydrated ? userState.visited.length : "—";
  // The sentence at its widest, which the stylesheet sizes the real one to. Two
  // zeros at least, since the dash is wider than one figure and narrower than two.
  const widestVisitedLine = `You’ve visited ${"0".repeat(Math.max(2, String(snapshot.museums.length).length))} of the ${snapshot.museums.length}.`;
  const exhibitsLine =
    exhibitsNowCount === 0
      ? "None lists an exhibit running today."
      : exhibitsNowCount === 1
        ? "1 museum has an exhibit on view today."
        : `${exhibitsNowCount} museums have an exhibit on view today.`;

  return (
    <div className="mlog-root">
      <div className="c97-shell c97-frame mlog-page">
        <header className="mlog-head">
          <div className="mlog-title">
            <h1>Museum Log</h1>
            <p className="mlog-lede">
              A Letterboxd for museums, meaning a catalog of the ones I&rsquo;d actually recommend with curator reviews and
              themed lists, and a log of your own visits with a rating and a note.
            </p>
            <p className="mlog-meta">
              Curated by {snapshot.curatorName} · updated {lastUpdated}
            </p>
          </div>
          {stripBesideTitle && <VisitStrip museums={heroVisits} today={today} onOpen={handleOpenMuseum} />}
        </header>

        <div className="mlog-bar">
          <nav aria-label="Section navigation">
            <div className="mlog-switch">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeView;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleViewChange(item.id)}
                    className="mlog-switch-btn"
                  >
                    <Icon size={16} aria-hidden />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
          <p className="mlog-meta mlog-summary">
            {snapshot.museums.length} museums catalogued, {snapshot.reviews.length}{" "}
            {snapshot.reviews.length === 1 ? "curator review" : "curator reviews"}, and {snapshot.visitLog.length}{" "}
            {snapshot.visitLog.length === 1 ? "visit" : "visits"} in the curator&rsquo;s diary. {exhibitsLine}{" "}
            <span data-testid="museum-log-visited" className="mlog-visited" data-widest={widestVisitedLine}>
              {`You’ve visited ${visitedCount} of the ${snapshot.museums.length}.`}
            </span>{" "}
            I would verify admission and exhibitions before visiting.
          </p>
        </div>

        {persistenceStatus === "memory-only" ? (
          <p className="mlog-meta" role="status">
            Museum log changes are available in this tab, but browser storage is unavailable, so they may not remain
            after you close it.
          </p>
        ) : null}

        <div className="mlog-body">
          <div className="mlog-main">
            <h2
              id="museum-log-catalog"
              ref={catalogHeadingRef}
              tabIndex={-1}
              className={selectedMuseum || routeState.view === "museum" ? "sr-only" : "mlog-section-title"}
            >
              {navItems.find((item) => item.id === activeView)?.label}
            </h2>

            {routeState.view === "museum" && selectedMuseum ? (
              <section aria-label={`${selectedMuseum.name} detail`}>
                <MuseumDetailView
                  key={selectedMuseum.id}
                  museum={selectedMuseum}
                  snapshot={snapshot}
                  today={today}
                  visit={findVisit(selectedMuseum.id)}
                  isWatchlisted={isWatchlisted(selectedMuseum.id)}
                  isLiked={isLiked(selectedMuseum.id)}
                  onBack={handleBackFromMuseum}
                  onToggleWatchlist={() => toggleWatchlist(selectedMuseum.id)}
                  onToggleLiked={() => toggleLiked(selectedMuseum.id)}
                  onLogVisit={logVisit}
                  onClearVisit={() => removeVisit(selectedMuseum.id)}
                  onOpenList={handleOpenList}
                  headingRef={detailHeadingRef}
                />
              </section>
            ) : routeState.view === "museum" ? (
              <section aria-label="Museum not found">
                <p>
                  Museum not found.{" "}
                  <button type="button" onClick={handleBackFromMuseum} className="c97-btn-ghost">
                    Back to catalog
                  </button>
                </p>
              </section>
            ) : null}

            {activeView === "discover" && routeState.view !== "museum" && (
              <DiscoverView
                snapshot={snapshot}
                state={routeState}
                today={today}
                query={query}
                onQueryChange={setQuery}
                onChangeFilter={handleChangeFilter}
                onOpenMuseum={handleOpenMuseum}
                visitDateByMuseumId={visitDateByMuseumId}
                visitByMuseumId={visitByMuseumId}
                isWatchlisted={isWatchlisted}
                isLiked={isLiked}
                toggleWatchlist={toggleWatchlist}
                toggleLiked={toggleLiked}
                logQuickVisit={logQuickVisit}
                removeVisit={removeVisit}
              />
            )}

            {activeView === "journal" && (
              <JournalView snapshot={snapshot} museumById={museumById} onOpenMuseum={handleOpenMuseum} />
            )}

            {activeView === "lists" && (
              <ListsView
                snapshot={snapshot}
                museumById={museumById}
                today={today}
                selectedListSlug={routeState.list}
                onSelectList={handleSelectList}
                onOpenMuseum={handleOpenMuseum}
                visitByMuseumId={visitByMuseumId}
                isWatchlisted={isWatchlisted}
                isLiked={isLiked}
                toggleWatchlist={toggleWatchlist}
                toggleLiked={toggleLiked}
                logQuickVisit={logQuickVisit}
                removeVisit={removeVisit}
              />
            )}

            {!stripBesideTitle && <VisitStrip museums={heroVisits} today={today} onOpen={handleOpenMuseum} />}
          </div>

          <aside aria-label="Museum Log side panel" className="mlog-rail">
            {selectedMuseum ? (
              <section>
                <h2 className="mlog-rail-title">Other museums in {REGION_LABEL[selectedMuseum.region]}</h2>
                {contextualMuseums.length === 0 ? (
                  <p className="mlog-small">No other museums catalogued in this region yet.</p>
                ) : (
                  <ul className="mlog-rail-list">
                    {contextualMuseums.map((m) => (
                      <li key={m.id}>
                        <button type="button" onClick={() => handleOpenMuseum(m.slug)} className="mlog-rail-item">
                          <span className="mlog-rail-item-text">
                            <span className="mlog-rail-item-name">{m.name}</span>
                            <span className="mlog-meta">
                              {m.city} · {TYPE_LABEL[m.type]}
                            </span>
                          </span>
                          <span className="c97-mono mlog-small mlog-row-wrap">
                            <Star size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                            {m.curatorRating.toFixed(1)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : (
              <section>
                <h2 className="mlog-rail-title">
                  <Heart size={14} aria-hidden="true" /> Top liked
                </h2>
                {likedFromCurator && topLiked.length > 0 ? (
                  <p className="mlog-meta">You haven&rsquo;t liked a museum yet, so these are the curator&rsquo;s favorites.</p>
                ) : null}
                {topLiked.length === 0 ? (
                  <p className="mlog-small">Heart a museum to surface it here.</p>
                ) : (
                  <ul className="mlog-rail-list">
                    {topLiked.map((m) => (
                      <li key={m.id}>
                        <button type="button" onClick={() => handleOpenMuseum(m.slug)} className="mlog-rail-item">
                          <span className="mlog-rail-item-text">
                            <span className="mlog-rail-item-name">{m.name}</span>
                            <span className="mlog-meta">
                              {TYPE_LABEL[m.type]} · {m.city}
                            </span>
                          </span>
                          <span className="c97-mono mlog-small mlog-row-wrap">
                            <Star size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                            {m.curatorRating.toFixed(1)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <p className="mlog-small mlog-row-wrap mlog-storage">
              <HelpCircle size={14} aria-hidden="true" />
              Visits, watchlist, and likes live only in your browser, with no login or cloud sync behind them.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
