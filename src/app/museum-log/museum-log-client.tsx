"use client";

import { startTransition, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  Check,
  Clock,
  Compass,
  Filter,
  Heart,
  HelpCircle,
  Layers,
  ListPlus,
  MapPin,
  NotebookPen,
  Plus,
  Search,
  Star,
  Ticket,
  Trash2,
  Wallet,
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
import {
  buildMuseumHref,
  MUSEUM_VIEW_LABELS,
  normalizeMuseumState,
} from "./museum-log-state";
import {
  averageRating,
  filterMuseums,
  formatAdmission,
  formatDate,
  formatRuntime,
  formatShortDate,
  formatUpdated,
  ratingBadgeStyle,
  REGION_FILTER_OPTIONS,
  REGION_LABEL,
  SORT_LABEL,
  SORT_OPTIONS,
  sortMuseums,
  starFractions,
  TYPE_FILTER_OPTIONS,
  TYPE_LABEL,
} from "./museum-log-helpers";
import { HomeStatsPanel } from "@/components/home/HomeStatsPanel";

interface Props {
  initialState: MuseumRouteState;
  snapshot: MuseumSnapshot;
}

// ─── Primitives ────────────────────────────────────────────────────────────────

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const stars = starFractions(rating);
  return (
    <span
      className="inline-flex items-center gap-0.5"
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
          <Star size={size} className="absolute inset-0 text-[var(--home-stone)]" strokeWidth={1.4} />
          {fill > 0 && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: fill === 0.5 ? "50%" : "100%" }}
            >
              <Star
                size={size}
                className="text-[var(--home-ink)]"
                fill="currentColor"
                strokeWidth={1.4}
              />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

function RatingPill({ rating, label }: { rating: number; label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={ratingBadgeStyle(rating)}
    >
      <StarRow rating={rating} size={12} />
      <span>{rating.toFixed(1)}</span>
      {label && <span className="opacity-70">· {label}</span>}
    </span>
  );
}

function TagChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-2.5 py-0.5 text-2xs font-medium uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
      {children}
    </span>
  );
}

function MuseumCoverArt({ museum }: { museum: Museum }) {
  // Procedural cover — initials + a deterministic hue based on type.
  const hueByType: Record<Museum["type"], string> = {
    art: "var(--home-acid)",
    history: "var(--home-haze)",
    science: "var(--home-paper-alt)",
    "natural-history": "var(--home-stone)",
    design: "var(--home-acid)",
    photography: "var(--home-haze)",
    specialty: "var(--home-stone)",
  };
  const initials = museum.name
    .replace(/^The\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("");

  return (
    <div
      className="relative flex aspect-[3/4] w-full items-end overflow-hidden rounded-2xl border border-[var(--home-rule)]"
      style={{
        background: `linear-gradient(160deg, color-mix(in srgb, ${hueByType[museum.type]} 65%, var(--home-paper)) 0%, var(--home-paper-alt) 100%)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute left-3 top-3 text-3xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]"
      >
        {TYPE_LABEL[museum.type]}
      </span>
      <span
        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--home-paper)] px-2 py-0.5 text-3xs font-semibold text-[var(--home-ink)]"
        style={{ border: "1px solid var(--home-rule)" }}
      >
        <Star size={10} fill="currentColor" strokeWidth={0} />
        {museum.curatorRating.toFixed(1)}
      </span>
      <span
        className="m-3 inline-flex items-center justify-center rounded-xl bg-[var(--home-ink)] px-3 py-2 text-2xl font-bold tracking-[-0.04em] text-[var(--home-paper)]"
        style={{ fontFamily: "var(--font-home-serif)" }}
      >
        {initials}
      </span>
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
  size?: "sm" | "md";
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
  size = "md",
}: QuickActionsProps) {
  const isVisited = Boolean(visit);
  const dim = size === "sm" ? 16 : 18;
  const padClass = size === "sm" ? "min-h-[36px] px-2.5 py-1.5 text-xs" : "min-h-[44px] px-3 py-2 text-sm";

  function pillStyle(active: boolean, accent: string) {
    if (active) {
      return {
        background: `color-mix(in srgb, ${accent} 32%, var(--home-paper))`,
        borderColor: `color-mix(in srgb, ${accent} 50%, var(--home-rule))`,
        color: "var(--home-ink)",
      } as const;
    }
    return {
      background: "var(--home-paper)",
      borderColor: "var(--home-rule)",
      color: "var(--home-ink-muted)",
    } as const;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={`Actions for ${museum.name}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isVisited) onClearVisit();
          else onLogQuickVisit();
        }}
        aria-pressed={isVisited}
        aria-label={isVisited ? `Mark ${museum.name} as not visited` : `Log a visit to ${museum.name}`}
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 ${padClass}`}
        style={pillStyle(isVisited, "var(--home-acid)")}
      >
        {isVisited ? <Check size={dim} /> : <Plus size={dim} />}
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
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 ${padClass}`}
        style={pillStyle(isWatchlisted, "var(--home-haze)")}
      >
        {isWatchlisted ? <BookmarkCheck size={dim} /> : <Bookmark size={dim} />}
        {isWatchlisted ? "Saved" : "Watchlist"}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLiked();
        }}
        aria-pressed={isLiked}
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 ${padClass}`}
        style={pillStyle(isLiked, "var(--home-acid)")}
      >
        <Heart
          size={dim}
          fill={isLiked ? "var(--home-acid)" : "none"}
          stroke={isLiked ? "var(--home-ink)" : "currentColor"}
        />
        {isLiked ? "Liked" : "Like"}
      </button>
    </div>
  );
}

// ─── Museum card (used in catalog + lists) ───────────────────────────────────

interface MuseumCardProps {
  museum: Museum;
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
    <article
      className="home-card flex flex-col gap-4"
      style={{ padding: "1rem 1rem 1.25rem" }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="text-left"
        aria-label={`Open ${museum.name} detail`}
      >
        <MuseumCoverArt museum={museum} />
      </button>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onOpen}
          className="text-left text-base font-semibold leading-snug text-[var(--home-ink)] hover:underline"
        >
          {museum.name}
        </button>
        <p className="flex items-center gap-1.5 text-xs text-[var(--home-ink-muted)]">
          <MapPin size={12} />
          {museum.city}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RatingPill rating={museum.curatorRating} label="curator" />
        {visit && <RatingPill rating={visit.rating} label="you" />}
      </div>

      <p className="text-sm leading-6 text-[var(--home-ink-muted)] line-clamp-3">{museum.blurb}</p>

      <QuickActions
        museum={museum}
        visit={visit}
        isWatchlisted={isWatchlisted}
        isLiked={isLiked}
        onToggleWatchlist={onToggleWatchlist}
        onToggleLiked={onToggleLiked}
        onLogQuickVisit={onLogQuickVisit}
        onClearVisit={onClearVisit}
        size="sm"
      />
    </article>
  );
}

// ─── Discover view ──────────────────────────────────────────────────────────

interface DiscoverViewProps {
  snapshot: MuseumSnapshot;
  state: MuseumRouteState;
  query: string;
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
  query,
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-4 py-3 shadow-[var(--shadow-sm)]">
        <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
          <Filter size={12} /> Filters
        </span>

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

        <span className="ml-auto inline-flex items-center gap-2 text-2xs text-[var(--home-ink-muted)]">
          Sort
          <div className="flex gap-1 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] p-1">
            {SORT_OPTIONS.map((sortKey) => {
              const active = state.sort === sortKey;
              return (
                <button
                  key={sortKey}
                  type="button"
                  onClick={() => onChangeFilter({ sort: sortKey as MuseumSort })}
                  aria-pressed={active}
                  className="rounded-full px-3 py-1 text-2xs font-semibold transition-colors"
                  style={{
                    background: active ? "var(--home-ink)" : "transparent",
                    color: active ? "var(--home-paper)" : "var(--home-ink-muted)",
                  }}
                >
                  {SORT_LABEL[sortKey]}
                </button>
              );
            })}
          </div>
        </span>
      </div>

      <p className="text-[12.5px] text-[var(--home-ink-muted)]">
        {sorted.length} {sorted.length === 1 ? "museum" : "museums"} in the catalog
        {state.type !== "all" && ` · ${TYPE_LABEL[state.type]}`}
        {state.region !== "all" && ` · ${REGION_LABEL[state.region]}`}
        {query.trim() && ` · matching "${query.trim()}"`}
      </p>

      {sorted.length === 0 ? (
        <div className="tool-empty">
          <p className="text-sm font-semibold text-[var(--home-ink)]">No museums match the current filters.</p>
          <p>Adjust type, region, or your search to see more.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((museum) => {
            const visit = visitByMuseumId[museum.id];
            return (
              <MuseumCard
                key={museum.id}
                museum={museum}
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
    <label
      htmlFor={id}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-1.5 text-xs font-semibold text-[var(--home-ink-muted)]"
    >
      <span className="uppercase tracking-[0.14em]">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-semibold text-[var(--home-ink)] focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ─── Journal view (curator reviews + visit log timeline) ─────────────────────

function JournalView({
  snapshot,
  museumBySlug,
  museumById,
  onOpenMuseum,
}: {
  snapshot: MuseumSnapshot;
  museumBySlug: Record<string, Museum>;
  museumById: Record<string, Museum>;
  onOpenMuseum: (slug: string) => void;
}) {
  const sortedReviews = useMemo(
    () =>
      [...snapshot.reviews].sort((a, b) => b.dateVisited.localeCompare(a.dateVisited)),
    [snapshot.reviews],
  );
  const sortedLog = useMemo(
    () => [...snapshot.visitLog].sort((a, b) => b.date.localeCompare(a.date)),
    [snapshot.visitLog],
  );
  void museumBySlug; // referenced from outer scope only — kept for future links

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <section className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
        <header className="border-b border-[var(--home-rule)] pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            Reviews
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">
            {snapshot.curatorName}'s reviews
          </h2>
          <p className="mt-1 text-sm text-[var(--home-ink-muted)]">{snapshot.curatorBio}</p>
        </header>

        <ol className="mt-5 space-y-5">
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

      <aside className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
        <header className="border-b border-[var(--home-rule)] pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            Diary
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">
            Recent visits
          </h2>
          <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
            Quick-hit log of every museum visit.
          </p>
        </header>
        <ol className="mt-5 space-y-3">
          {sortedLog.map((entry) => {
            const museum = museumById[entry.museumId];
            if (!museum) return null;
            return (
              <DiaryEntry
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
    <li className="rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] p-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <button
          type="button"
          onClick={onOpenMuseum}
          className="text-left text-lg font-semibold text-[var(--home-ink)] hover:underline"
        >
          {museum.name}
        </button>
        <span className="text-xs text-[var(--home-ink-muted)]">{museum.city}</span>
        <span className="ml-auto text-xs text-[var(--home-ink-muted)]">
          {formatDate(review.dateVisited)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StarRow rating={review.rating} size={16} />
        <span className="text-sm font-semibold text-[var(--home-ink)]">{review.rating.toFixed(1)}</span>
        {review.liked && <Heart size={14} fill="var(--home-acid)" stroke="var(--home-ink)" aria-label="Liked" />}
        {review.exhibitTitle && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--home-ink-muted)]">
            <Ticket size={12} /> {review.exhibitTitle}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-base font-semibold text-[var(--home-ink)]">{review.headline}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--home-ink-muted)]">{review.body}</p>
      {review.recommendedFor && (
        <p className="mt-3 text-xs italic text-[var(--home-ink-muted)]">
          Recommended for: {review.recommendedFor}
        </p>
      )}
      {review.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <TagChip key={tag}>{tag}</TagChip>
          ))}
        </div>
      )}
    </li>
  );
}

function DiaryEntry({
  entry,
  museum,
  onOpenMuseum,
}: {
  entry: VisitLogEntry;
  museum: Museum;
  onOpenMuseum: () => void;
}) {
  return (
    <li className="rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenMuseum}
          className="text-left text-sm font-semibold text-[var(--home-ink)] hover:underline"
        >
          {museum.name}
        </button>
        <span className="text-xs text-[var(--home-ink-muted)]">{formatShortDate(entry.date)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--home-ink-muted)]">
        <StarRow rating={entry.rating} size={12} />
        <span>{entry.rating.toFixed(1)}</span>
        {entry.exhibitTitle && <span>· {entry.exhibitTitle}</span>}
      </div>
      {entry.note && (
        <p className="mt-1.5 text-xs italic text-[var(--home-ink-muted)]">"{entry.note}"</p>
      )}
    </li>
  );
}

// ─── Lists view ──────────────────────────────────────────────────────────────

interface ListsViewProps {
  snapshot: MuseumSnapshot;
  museumById: Record<string, Museum>;
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
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => onSelectList(null)}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
        >
          ← All lists
        </button>
        <header className="home-card" style={{ padding: "1.5rem" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            List · {museums.length} museums
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--home-ink)]">{selectedList.title}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--home-ink-muted)]">
            {selectedList.description}
          </p>
          <p className="mt-3 text-xs text-[var(--home-ink-muted)]">
            Curated by {selectedList.curator} · Updated {formatShortDate(selectedList.updatedAt)}
          </p>
        </header>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {museums.map((museum) => (
            <MuseumCard
              key={museum.id}
              museum={museum}
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
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
  const museums = list.museumIds
    .map((id) => museumById[id])
    .filter((m): m is Museum => Boolean(m));
  const previewInitials = museums.slice(0, 4).map((m) => {
    const initials = m.name
      .replace(/^The\s+/i, "")
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("");
    return { id: m.id, initials, type: m.type };
  });
  const hueByType: Record<Museum["type"], string> = {
    art: "var(--home-acid)",
    history: "var(--home-haze)",
    science: "var(--home-paper-alt)",
    "natural-history": "var(--home-stone)",
    design: "var(--home-acid)",
    photography: "var(--home-haze)",
    specialty: "var(--home-stone)",
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="home-card flex h-full flex-col gap-4 text-left"
      style={{ padding: "1.25rem" }}
      aria-label={`Open list ${list.title}`}
    >
      <div className="grid grid-cols-4 gap-1.5">
        {previewInitials.map((p) => (
          <div
            key={p.id}
            className="flex aspect-square items-center justify-center rounded-lg text-2xs font-bold tracking-tight text-[var(--home-ink)]"
            style={{
              background: `linear-gradient(160deg, color-mix(in srgb, ${hueByType[p.type]} 60%, var(--home-paper)), var(--home-paper-alt))`,
              border: "1px solid var(--home-rule)",
            }}
          >
            {p.initials}
          </div>
        ))}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-[var(--home-ink)]">{list.title}</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--home-paper)] px-2 py-0.5 text-3xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]" style={{ border: "1px solid var(--home-rule)" }}>
          <ListPlus size={10} /> {list.museumIds.length}
        </span>
      </div>
      <p className="text-sm leading-6 text-[var(--home-ink-muted)] line-clamp-3">{list.description}</p>
      <p className="mt-auto text-2xs text-[var(--home-ink-muted)]">
        Updated {formatShortDate(list.updatedAt)}
      </p>
    </button>
  );
}

// ─── Museum detail view ──────────────────────────────────────────────────────

interface MuseumDetailViewProps {
  museum: Museum;
  snapshot: MuseumSnapshot;
  visit?: UserVisit;
  isWatchlisted: boolean;
  isLiked: boolean;
  onBack: () => void;
  onToggleWatchlist: () => void;
  onToggleLiked: () => void;
  onLogVisit: (visit: UserVisit) => void;
  onClearVisit: () => void;
  onOpenList: (slug: string) => void;
}

function MuseumDetailView({
  museum,
  snapshot,
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
  const review = snapshot.reviews.find((r) => r.museumId === museum.id);
  const inLists = snapshot.lists.filter((l) => l.museumIds.includes(museum.id));
  const visitLogEntries = snapshot.visitLog
    .filter((v) => v.museumId === museum.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
      >
        ← Back to catalog
      </button>

      <section className="home-card" style={{ padding: "1.5rem" }}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
          <div className="max-w-[200px]">
            <MuseumCoverArt museum={museum} />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
              {TYPE_LABEL[museum.type]} · {REGION_LABEL[museum.region]}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: "-0.045em",
                color: "var(--home-ink)",
              }}
            >
              {museum.name}
            </h1>
            <p className="flex flex-wrap items-center gap-3 text-sm text-[var(--home-ink-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {museum.city}, {museum.country}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={14} /> Founded {museum.founded}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} /> {formatRuntime(museum.visitMinutesAvg)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={14} /> {formatAdmission(museum.admissionUSD)}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <RatingPill rating={museum.curatorRating} label="curator" />
              {visit && <RatingPill rating={visit.rating} label="you" />}
            </div>
            <p className="text-base leading-7 text-[var(--home-ink)]">{museum.blurb}</p>
            <QuickActions
              museum={museum}
              visit={visit}
              isWatchlisted={isWatchlisted}
              isLiked={isLiked}
              onToggleWatchlist={onToggleWatchlist}
              onToggleLiked={onToggleLiked}
              onLogQuickVisit={() =>
                onLogVisit({
                  museumId: museum.id,
                  date: new Date().toISOString().slice(0, 10),
                  rating: museum.curatorRating,
                })
              }
              onClearVisit={onClearVisit}
            />
            {museum.websiteUrl && (
              <p className="text-xs text-[var(--home-ink-muted)]">
                <a
                  className="underline decoration-dotted"
                  href={museum.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit official site →
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          {review && (
            <section className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
              <header className="border-b border-[var(--home-rule)] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                  Curator review
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <StarRow rating={review.rating} size={18} />
                  <span className="text-sm font-semibold text-[var(--home-ink)]">
                    {review.rating.toFixed(1)} / 5
                  </span>
                  <span className="text-xs text-[var(--home-ink-muted)]">
                    Visited {formatDate(review.dateVisited)}
                  </span>
                  {review.liked && (
                    <Heart size={14} fill="var(--home-acid)" stroke="var(--home-ink)" aria-label="Liked" />
                  )}
                </div>
                <h2 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">
                  {review.headline}
                </h2>
              </header>
              <p className="mt-4 text-base leading-7 text-[var(--home-ink-muted)]">{review.body}</p>
              {review.recommendedFor && (
                <p className="mt-3 text-sm italic text-[var(--home-ink-muted)]">
                  Recommended for: {review.recommendedFor}
                </p>
              )}
              {review.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {review.tags.map((tag) => (
                    <TagChip key={tag}>{tag}</TagChip>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
            <header className="border-b border-[var(--home-rule)] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Highlights
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--home-ink)]">
                What to actually see
              </h2>
            </header>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {museum.highlights.map((h) => (
                <li
                  key={h}
                  className="rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm text-[var(--home-ink)]"
                >
                  {h}
                </li>
              ))}
            </ul>
          </section>

          {museum.exhibits.length > 0 && (
            <section className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
              <header className="border-b border-[var(--home-rule)] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                  Now on view
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--home-ink)]">
                  Current exhibitions
                </h2>
              </header>
              <ol className="mt-4 space-y-3">
                {museum.exhibits.map((ex) => (
                  <li
                    key={ex.id}
                    className="rounded-xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] p-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-base font-semibold text-[var(--home-ink)]">{ex.title}</p>
                      <span className="text-xs text-[var(--home-ink-muted)]">
                        {formatShortDate(ex.startDate)} –{" "}
                        {ex.endDate ? formatShortDate(ex.endDate) : "Permanent"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--home-ink-muted)]">{ex.blurb}</p>
                    {ex.ticketed && (
                      <p className="mt-2 inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                        <Ticket size={12} /> Timed entry / extra ticket
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
            <header className="border-b border-[var(--home-rule)] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                Your activity
              </p>
            </header>
            <div className="mt-4 space-y-3 text-sm">
              {visit ? (
                <>
                  <p className="text-[var(--home-ink)]">
                    <span className="font-semibold">Visited</span> on {formatDate(visit.date)}
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRow rating={visit.rating} size={16} />
                    <span className="text-sm font-semibold text-[var(--home-ink)]">
                      {visit.rating.toFixed(1)}
                    </span>
                  </div>
                  {visit.note && (
                    <p className="text-xs italic text-[var(--home-ink-muted)]">"{visit.note}"</p>
                  )}
                  <button
                    type="button"
                    onClick={onClearVisit}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-1.5 text-xs font-semibold text-[var(--home-ink-muted)]"
                  >
                    <Trash2 size={12} /> Remove visit
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-[var(--home-ink-muted)]">
                    No visit logged yet. Use the buttons above to mark this one done, save it for later, or like it.
                  </p>
                  <RateAndLogForm
                    initialRating={museum.curatorRating}
                    onSubmit={(rating, note) =>
                      onLogVisit({
                        museumId: museum.id,
                        date: new Date().toISOString().slice(0, 10),
                        rating,
                        note: note || undefined,
                      })
                    }
                  />
                </>
              )}
            </div>
          </section>

          {visitLogEntries.length > 0 && (
            <section className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
              <header className="border-b border-[var(--home-rule)] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                  Curator history
                </p>
                <h2 className="mt-2 text-base font-semibold text-[var(--home-ink)]">
                  Past visits
                </h2>
              </header>
              <ol className="mt-3 space-y-2 text-sm">
                {visitLogEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Calendar size={12} className="text-[var(--home-ink-muted)]" />
                      <span className="text-[var(--home-ink-muted)]">
                        {formatShortDate(entry.date)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <StarRow rating={entry.rating} size={12} />
                      <span className="text-xs font-semibold text-[var(--home-ink)]">
                        {entry.rating.toFixed(1)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {inLists.length > 0 && (
            <section className="home-card" style={{ padding: "1.25rem 1.5rem" }}>
              <header className="border-b border-[var(--home-rule)] pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
                  Appears in
                </p>
              </header>
              <ul className="mt-3 space-y-2">
                {inLists.map((list) => (
                  <li key={list.id}>
                    <button
                      type="button"
                      onClick={() => onOpenList(list.slug)}
                      className="w-full rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-left text-sm font-semibold text-[var(--home-ink)] hover:bg-[var(--home-paper-alt)]"
                    >
                      {list.title}
                      <span className="ml-1 text-xs font-normal text-[var(--home-ink-muted)]">
                        · {list.museumIds.length} museums
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function RateAndLogForm({
  initialRating,
  onSubmit,
}: {
  initialRating: number;
  onSubmit: (rating: number, note: string) => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [note, setNote] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(rating, note.trim());
      }}
      className="space-y-3"
      aria-label="Rate and log this museum visit"
    >
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={rating * 2}
          onChange={(e) => setRating(Number(e.target.value) / 2)}
          aria-label="Your rating, 0 to 5 stars"
          className="flex-1"
        />
        <span className="inline-flex items-center gap-1.5">
          <StarRow rating={rating} size={14} />
          <span className="text-xs font-semibold text-[var(--home-ink)]">
            {rating.toFixed(1)}
          </span>
        </span>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (private to your browser)"
        rows={2}
        className="w-full rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm text-[var(--home-ink)] placeholder:text-[var(--home-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--home-acid)]"
      />
      <button
        type="submit"
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[var(--home-ink)] px-4 py-2 text-sm font-semibold text-[var(--home-paper)]"
      >
        <Check size={16} /> Log visit
      </button>
    </form>
  );
}

// ─── Main client component ───────────────────────────────────────────────────

export function MuseumLogClient({ initialState, snapshot }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const currentHref = `/museum-log${currentQuery ? `?${currentQuery}` : ""}`;

  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("museum") !== null ||
    searchParams.get("list") !== null ||
    searchParams.get("sort") !== null ||
    searchParams.get("type") !== null ||
    searchParams.get("region") !== null;
  const routeState = hasManagedParams ? normalizeMuseumState(searchParams) : initialState;

  const desiredHref = buildMuseumHref(routeState, searchParams);

  useEffect(() => {
    if (currentHref === desiredHref) return;
    startTransition(() => {
      router.replace(desiredHref, { scroll: false });
    });
  }, [currentHref, desiredHref, router]);

  function navigate(nextState: MuseumRouteState) {
    const href = buildMuseumHref(nextState, searchParams);
    if (href === currentHref) return;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function handleViewChange(view: MuseumView) {
    navigate({ ...routeState, view, museum: null, list: view === "lists" ? routeState.list : null });
  }

  function handleOpenMuseum(slug: string) {
    navigate({ ...routeState, view: "museum", museum: slug });
  }

  function handleOpenList(slug: string) {
    navigate({ ...routeState, view: "lists", list: slug, museum: null });
  }

  function handleBackFromMuseum() {
    navigate({ ...routeState, view: "discover", museum: null });
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
    isWatchlisted,
    isLiked,
    findVisit,
    toggleWatchlist,
    toggleLiked,
    logVisit,
    removeVisit,
  } = useMuseumLog();

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
  const averageUserRating = useMemo(() => {
    if (userState.visited.length === 0) return null;
    return averageRating(userState.visited.map((v) => v.rating));
  }, [userState.visited]);
  const lastVisitedDate = useMemo(() => {
    if (userState.visited.length === 0) return null;
    return [...userState.visited].sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? null;
  }, [userState.visited]);

  function logQuickVisit(museum: Museum) {
    logVisit({
      museumId: museum.id,
      date: new Date().toISOString().slice(0, 10),
      rating: museum.curatorRating,
    });
  }

  // ─── Filter (search) state — UI-only, not deep-linked ────────────────────
  const [query, setQuery] = useState("");

  // ─── Resolve detail entity ────────────────────────────────────────────────
  const selectedMuseum = routeState.museum ? museumBySlug[routeState.museum] : null;

  // ─── Rail data: recently visited + top liked ─────────────────────────────
  const recentlyVisited = useMemo(() => {
    const userVisits = [...userState.visited]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((v) => ({ museum: museumById[v.museumId], date: v.date }))
      .filter((row): row is { museum: Museum; date: string } => Boolean(row.museum));
    if (userVisits.length > 0) return userVisits;
    // Fallback to curator visit log so the rail isn't empty pre-hydration.
    return [...snapshot.visitLog]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((v) => ({ museum: museumById[v.museumId], date: v.date }))
      .filter((row): row is { museum: Museum; date: string } => Boolean(row.museum));
  }, [userState.visited, snapshot.visitLog, museumById]);

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

  // For detail view: contextual rail (other museums in same region).
  const contextualMuseums = useMemo(() => {
    if (!selectedMuseum) return [];
    return snapshot.museums
      .filter((m) => m.id !== selectedMuseum.id && m.region === selectedMuseum.region)
      .sort((a, b) => b.curatorRating - a.curatorRating)
      .slice(0, 5);
  }, [selectedMuseum, snapshot.museums]);

  // Active sidebar view — detail view treats Discover as active.
  const activeView: MuseumView =
    routeState.view === "museum" ? "discover" : routeState.view;

  const visitedCount = hydrated ? userState.visited.length : 0;

  const navItems: Array<{
    id: MuseumView;
    label: string;
    icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
    pill?: string;
  }> = [
    { id: "discover", label: "Discover", icon: Compass },
    {
      id: "journal",
      label: "Journal",
      icon: NotebookPen,
      pill: visitedCount > 0 ? String(visitedCount) : undefined,
    },
    { id: "lists", label: "Lists", icon: Layers },
  ];

  const currentViewLabel =
    routeState.view === "museum" && selectedMuseum
      ? selectedMuseum.name
      : MUSEUM_VIEW_LABELS[activeView];

  return (
    <section
      className="home-page min-h-screen"
      data-testid="museum-log-shell"
    >
      <div className="home-shell home-section">
        <div className="flex flex-col gap-6">
          {/* In-page section nav (replaces sidebar) */}
          <nav className="flex flex-wrap gap-2" aria-label="Section navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeView;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleViewChange(item.id)}
                  aria-current={isActive ? "true" : undefined}
                  aria-pressed={isActive}
                  className="inline-flex min-h-touch items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-[border-color,background-color,color] duration-200 ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                  style={{
                    borderColor: isActive ? "var(--home-ink)" : "var(--home-rule)",
                    background: isActive
                      ? "var(--home-ink)"
                      : "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
                    color: isActive ? "var(--home-paper)" : "var(--home-ink-muted)",
                    fontFamily: "var(--font-home-sans)",
                  }}
                >
                  <Icon size={16} aria-hidden />
                  {item.label}
                  {item.pill ? (
                    <span
                      className="ml-1 rounded-full px-2 py-0.5 text-2xs font-bold tracking-[0.04em]"
                      style={{
                        background: isActive
                          ? "color-mix(in srgb, var(--home-paper) 22%, transparent)"
                          : "color-mix(in srgb, var(--home-acid) 40%, transparent)",
                        color: isActive ? "var(--home-paper)" : "var(--home-ink)",
                      }}
                    >
                      {item.pill}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="tool-topbar">
              <div>
                <p className="tool-crumbs">
                  Museum Log / <strong>{currentViewLabel}</strong>
                </p>
                <h1>Museum Log</h1>
              </div>

              <label className="tool-search" aria-label="Filter museums">
                <Search size={14} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Filter museums…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>

            <div className="tool-meta-chip" role="status" aria-live="polite">
              <span className="tool-meta-chip-dot" aria-hidden="true" />
              <span>
                <strong>Curated catalog</strong> · {snapshot.museums.length}{" "}
                {snapshot.museums.length === 1 ? "museum" : "museums"}
              </span>
              <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
              <span>
                {snapshot.reviews.length}{" "}
                {snapshot.reviews.length === 1 ? "review" : "reviews"}
              </span>
              <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
              <span>
                {snapshot.visitLog.length} visits logged
              </span>
              <span className="tool-meta-chip-spacer" />
              <span className="tool-meta-chip-meta">Updated {lastUpdated}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
              <div className="space-y-5">
              <HomeStatsPanel
                id="museum-log-stats"
                title="Your log at a glance"
                meta={`Updated ${lastUpdated}`}
                hideLiveDot
                cells={[
                  {
                    label: "Visited",
                    value: hydrated ? userState.visited.length.toLocaleString() : "—",
                    sub: hydrated && userState.visited.length === 0 ? "Log your first" : undefined,
                  },
                  {
                    label: "Watchlist",
                    value: hydrated ? userState.watchlist.length.toLocaleString() : "—",
                  },
                  {
                    label: "Liked",
                    value: hydrated ? userState.liked.length.toLocaleString() : "—",
                  },
                  {
                    label: "Average rating",
                    value:
                      hydrated && averageUserRating !== null
                        ? `${averageUserRating.toFixed(1)} ★`
                        : "—",
                    sub:
                      hydrated && averageUserRating !== null
                        ? "Across logged visits"
                        : "Rate visits to see",
                  },
                  {
                    label: "Catalog size",
                    value: snapshot.museums.length.toLocaleString(),
                    sub: "Museums in dataset",
                  },
                  {
                    label: "Reviews",
                    value: snapshot.reviews.length.toLocaleString(),
                    sub: "Curator reviews",
                  },
                  {
                    label: "Visits logged",
                    value: snapshot.visitLog.length.toLocaleString(),
                    sub: "Includes repeats",
                  },
                  {
                    label: "Last visited",
                    value:
                      hydrated && lastVisitedDate ? formatShortDate(lastVisitedDate) : "—",
                  },
                ]}
                pills={[
                  { label: "Discover", href: "/museum-log?view=discover" },
                  { label: "Journal", href: "/museum-log?view=journal" },
                  { label: "Lists", href: "/museum-log?view=lists" },
                ]}
              />

              {activeView === "discover" && (
                <DiscoverView
                  snapshot={snapshot}
                  state={routeState}
                  query={query}
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
                <JournalView
                  snapshot={snapshot}
                  museumBySlug={museumBySlug}
                  museumById={museumById}
                  onOpenMuseum={handleOpenMuseum}
                />
              )}

              {activeView === "lists" && (
                <ListsView
                  snapshot={snapshot}
                  museumById={museumById}
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
            </div>

          <aside
            aria-label="Museum Log side panel"
            className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_74%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
          >
            {selectedMuseum ? (
              <section>
                <p className="tool-rail-label">
                  Other museums in {REGION_LABEL[selectedMuseum.region]}
                </p>
                {contextualMuseums.length === 0 ? (
                  <p className="text-[12px] text-[var(--home-ink-muted)]">
                    No other museums catalogued in this region yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {contextualMuseums.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => handleOpenMuseum(m.slug)}
                          className="grid w-full grid-cols-[1fr_auto] items-baseline gap-2 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-[var(--home-rule)] hover:bg-[var(--home-paper)]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-[var(--home-ink)]">
                              {m.name}
                            </span>
                            <span className="block truncate text-[11.5px] text-[var(--home-ink-muted)]">
                              {m.city} · {TYPE_LABEL[m.type]}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--home-ink)] tabular-nums">
                            <Star size={10} fill="currentColor" strokeWidth={0} />
                            {m.curatorRating.toFixed(1)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : (
              <>
                <section>
                  <p className="tool-rail-label">
                    <Clock size={12} aria-hidden /> Recently visited
                  </p>
                  {recentlyVisited.length === 0 ? (
                    <p className="text-[12px] text-[var(--home-ink-muted)]">
                      No visits logged yet — log one from any museum card.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {recentlyVisited.map((row) => (
                        <li key={`${row.museum.id}-${row.date}`}>
                          <button
                            type="button"
                            onClick={() => handleOpenMuseum(row.museum.slug)}
                            className="grid w-full grid-cols-[1fr_auto] items-baseline gap-2 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-[var(--home-rule)] hover:bg-[var(--home-paper)]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold text-[var(--home-ink)]">
                                {row.museum.name}
                              </span>
                              <span className="block truncate text-[11.5px] text-[var(--home-ink-muted)]">
                                {row.museum.city}
                              </span>
                            </span>
                            <span className="text-2xs text-[var(--home-ink-muted)] tabular-nums">
                              {formatShortDate(row.date)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <p className="tool-rail-label">
                    <Heart size={12} aria-hidden /> Top liked
                  </p>
                  {topLiked.length === 0 ? (
                    <p className="text-[12px] text-[var(--home-ink-muted)]">
                      Heart a museum to surface it here.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {topLiked.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => handleOpenMuseum(m.slug)}
                            className="grid w-full grid-cols-[1fr_auto] items-baseline gap-2 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-[var(--home-rule)] hover:bg-[var(--home-paper)]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold text-[var(--home-ink)]">
                                {m.name}
                              </span>
                              <span className="block truncate text-[11.5px] text-[var(--home-ink-muted)]">
                                {TYPE_LABEL[m.type]} · {m.city}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--home-ink)] tabular-nums">
                              <Star size={10} fill="currentColor" strokeWidth={0} />
                              {m.curatorRating.toFixed(1)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}

            <p className="tool-rail-foot">
              <HelpCircle size={14} aria-hidden="true" />
              Visits, watchlist, and likes live only in your browser — no logins, no cloud sync.
            </p>
          </aside>
        </div>

        {/* Detail view sits below the shell as a full-width band so the
            grid above stays in context. Mirrors the /investments research band. */}
        {routeState.view === "museum" && selectedMuseum && (
          <section className="tool-band" aria-label={`${selectedMuseum.name} detail`}>
            <MuseumDetailView
              museum={selectedMuseum}
              snapshot={snapshot}
              visit={findVisit(selectedMuseum.id)}
              isWatchlisted={isWatchlisted(selectedMuseum.id)}
              isLiked={isLiked(selectedMuseum.id)}
              onBack={handleBackFromMuseum}
              onToggleWatchlist={() => toggleWatchlist(selectedMuseum.id)}
              onToggleLiked={() => toggleLiked(selectedMuseum.id)}
              onLogVisit={logVisit}
              onClearVisit={() => removeVisit(selectedMuseum.id)}
              onOpenList={handleOpenList}
            />
          </section>
        )}

        {routeState.view === "museum" && !selectedMuseum && (
          <section className="tool-band" aria-label="Museum not found">
            <p className="text-sm text-[var(--home-ink-muted)]">
              Museum not found.
              <button
                type="button"
                onClick={handleBackFromMuseum}
                className="ml-2 underline decoration-dotted"
              >
                Back to catalog
              </button>
            </p>
          </section>
        )}
        </div>
      </div>
    </section>
  );
}
