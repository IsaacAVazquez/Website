"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Search, Shield, Users } from "lucide-react";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import {
  FANTASY_POSITION_LABELS,
  FANTASY_SCORING_LABELS,
  FantasyRoutePosition,
  FantasyRouteScoring,
  FantasySnapshotRangeKind,
  getFantasyPlayerSearchText,
  getFantasyWeekLabel,
} from "@/lib/fantasy";
import { Player } from "@/types";
import { buildFantasyHref, FantasySearchState, normalizeFantasyState } from "./fantasy-state";

const POSITION_OPTIONS: FantasyRoutePosition[] = ["overall", "qb", "rb", "wr", "te", "flex", "k", "dst"];
const SCORING_OPTIONS: { key: FantasyRouteScoring; label: string }[] = [
  { key: "ppr", label: "PPR" },
  { key: "half_ppr", label: "Half PPR" },
  { key: "standard", label: "Standard" },
];

interface FantasyFootballClientProps {
  initialState: FantasySearchState;
}

function formatUpdatedAt(timestamp: string | undefined): string {
  if (!timestamp) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatProjectedPoints(points: number | undefined): string {
  if (!Number.isFinite(points)) {
    return "--";
  }

  return `${Math.round(points ?? 0)}`;
}

function getRangeLabel(rangeKind: FantasySnapshotRangeKind | undefined): string {
  switch (rangeKind) {
    case "position":
      return "Position range";
    case "overall":
      return "Overall range";
    default:
      return "Range";
  }
}

function getPositionTone(position: string): string {
  switch (position) {
    case "QB":
      return "bg-sky-500/15 text-sky-300 ring-sky-500/30";
    case "RB":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
    case "WR":
      return "bg-amber-500/15 text-amber-300 ring-amber-500/30";
    case "TE":
      return "bg-rose-500/15 text-rose-300 ring-rose-500/30";
    case "K":
      return "bg-violet-500/15 text-violet-300 ring-violet-500/30";
    case "DST":
      return "bg-slate-400/15 text-slate-200 ring-slate-300/20";
    default:
      return "bg-white/10 text-white ring-white/10";
  }
}

function getPublishedBoardRank(player: Player, position: FantasyRoutePosition): string {
  const rankValue =
    position === "overall" || position === "flex"
      ? player.averageRank
      : player.positionRank ?? player.averageRank;

  if (typeof rankValue === "number") {
    return Number.isFinite(rankValue) ? rankValue.toString() : "--";
  }

  return rankValue?.trim() ? rankValue : "--";
}

export function FantasyFootballClient({ initialState }: FantasyFootballClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const hasManagedParams = searchParams.get("position") !== null || searchParams.get("scoring") !== null;
  const routeState = useMemo<FantasySearchState>(
    () => (hasManagedParams ? normalizeFantasyState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

  useEffect(() => {
    if (
      searchParams.get("position") === routeState.position &&
      searchParams.get("scoring") === routeState.scoring
    ) {
      return;
    }

    startTransition(() => {
      router.replace(buildFantasyHref(routeState, searchParams), { scroll: false });
    });
  }, [routeState, router, searchParams]);

  function updateRouteState(nextState: Partial<FantasySearchState>) {
    const nextRouteState = {
      ...routeState,
      ...nextState,
    };

    startTransition(() => {
      router.push(buildFantasyHref(nextRouteState, searchParams), { scroll: false });
    });
  }

  const { players, metadata, sliceMetadata, sliceMetadataMap, isLoading, error } = useFantasySnapshot({
    position: routeState.position,
    scoring: routeState.scoring,
  });

  const currentSliceUnavailable = Boolean(sliceMetadata && !sliceMetadata.available);
  const selectedScoringLabel = FANTASY_SCORING_LABELS[routeState.scoring];

  const filteredPlayers = useMemo(() => {
    if (currentSliceUnavailable) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return players;
    }

    return players.filter((player) => getFantasyPlayerSearchText(player).includes(query));
  }, [currentSliceUnavailable, players, searchQuery]);

  const tierSummaries = useMemo(() => {
    const tierCounts = new Map<number, number>();

    for (const player of players) {
      if (!player.tier) {
        continue;
      }

      tierCounts.set(player.tier, (tierCounts.get(player.tier) ?? 0) + 1);
    }

    return Array.from(tierCounts.entries())
      .sort((left, right) => left[0] - right[0])
      .slice(0, 4);
  }, [players]);

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(77,182,255,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_24%),linear-gradient(180deg,#09111f_0%,#0c1424_55%,#08111c_100%)] text-white"
      aria-label="Fantasy football rankings"
      data-testid="fantasy-football-shell"
    >
      <div className="mx-auto w-full max-w-[1520px] px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 xl:px-10">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur"
        >
          <div className="grid gap-8 border-b border-white/10 px-6 py-7 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1.4fr)_320px] xl:items-end">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/85">
                Fantasy Football
              </p>
              <h1 className="mt-3 max-w-[15ch] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Rankings first. Draft utility second.
              </h1>
              <p className="mt-4 max-w-[66ch] text-sm leading-7 text-slate-300 sm:text-[0.98rem]">
                I publish weekly snapshots that power both the public board and the draft tracker.
                Your rankings, best-available lists, and timestamps always agree because they come from the same source.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {metadata ? `${metadata.season} ${getFantasyWeekLabel(metadata.week)}` : "Loading snapshot"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Updated {formatUpdatedAt(metadata?.generatedAt)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {selectedScoringLabel} scoring
                </span>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              )}
            </div>

            <div className="grid gap-3 rounded-[28px] border border-white/10 bg-[#0d1728]/80 p-4">
              <Link
                href="/fantasy-football/draft-tracker"
                className="flex min-h-[52px] items-center justify-between rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-300/40 hover:bg-sky-300/10"
              >
                <span>Open Draft Assistant</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Board
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{filteredPlayers.length} players visible</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Source
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{metadata?.source ?? "Published snapshot"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:items-start">
            <div className="grid gap-5">
              <div className="rounded-[28px] border border-white/10 bg-[#08111f]/80 p-4 sm:p-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Position
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Fantasy positions">
                      {POSITION_OPTIONS.map((position) => {
                        const active = routeState.position === position;
                        const positionSliceMetadata = sliceMetadataMap?.[position];
                        const unavailable = positionSliceMetadata ? !positionSliceMetadata.available : false;
                        return (
                          <button
                            key={position}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            aria-disabled={unavailable}
                            onClick={() => {
                              if (!unavailable) {
                                updateRouteState({ position });
                              }
                            }}
                            title={unavailable ? positionSliceMetadata?.reason : undefined}
                            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition ${
                              active && unavailable
                                ? "border border-amber-300/40 bg-amber-300/15 text-amber-100"
                                : active
                                  ? "bg-white text-slate-950"
                                  : unavailable
                                    ? "cursor-not-allowed border border-amber-300/20 bg-amber-300/5 text-amber-100/75"
                                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span>{FANTASY_POSITION_LABELS[position]}</span>
                            {unavailable && <span className="ml-2 text-[11px] uppercase tracking-[0.14em]">NA</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Search
                    </p>
                    <label className="relative mt-3 block">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        disabled={currentSliceUnavailable}
                        placeholder={`Search ${FANTASY_POSITION_LABELS[routeState.position].toLowerCase()} board`}
                        className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {SCORING_OPTIONS.map((option) => {
                    const active = routeState.scoring === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateRouteState({ scoring: option.key })}
                        className={`min-h-[44px] rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
                            : "border-white/10 bg-transparent text-slate-300 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-4 sm:p-5">
                <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Rankings Board
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {FANTASY_POSITION_LABELS[routeState.position]} rankings
                    </h2>
                  </div>
                  <p className="text-sm text-slate-400">
                    {isLoading
                      ? "Loading players..."
                      : currentSliceUnavailable
                        ? "Unavailable"
                        : `${filteredPlayers.length} players`}
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div
                        key={`loading-${index}`}
                        className="h-[88px] animate-pulse rounded-[24px] border border-white/10 bg-white/[0.035]"
                      />
                    ))
                  ) : currentSliceUnavailable ? (
                    <div className="rounded-[24px] border border-amber-300/20 bg-amber-300/10 px-5 py-12 text-center">
                      <p className="text-lg font-semibold text-white">
                        {selectedScoringLabel} {FANTASY_POSITION_LABELS[routeState.position]} rankings are unavailable.
                      </p>
                      <p className="mt-2 text-sm text-amber-100/85">
                        {sliceMetadata?.reason ??
                          "This scoring-position combination is not published in the current snapshot."}
                      </p>
                    </div>
                  ) : filteredPlayers.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.035] px-5 py-12 text-center">
                      <p className="text-lg font-semibold text-white">No matching players</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Clear the search or switch the board to see more names.
                      </p>
                    </div>
                  ) : (
                    filteredPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.035] px-4 py-4 sm:grid-cols-[72px_minmax(0,1.4fr)_120px_120px_110px] sm:items-center"
                      >
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Rank
                          </p>
                          <p className="mt-1 text-2xl font-semibold text-white">
                            {getPublishedBoardRank(player, routeState.position)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-white">{player.name}</p>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${getPositionTone(player.position)}`}>
                              {player.position}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">
                            {player.team}
                            {player.positionRank ? ` • ${player.position} rank ${player.positionRank}` : ""}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Tier
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">Tier {player.tier ?? "--"}</p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Proj. Pts
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {formatProjectedPoints(player.projectedPoints)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {getRangeLabel(sliceMetadata?.rangeKind)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {player.minRank ?? "--"} to {player.maxRank ?? "--"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <aside className="grid gap-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-sky-300" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Freshness
                    </p>
                    <p className="text-sm font-semibold text-white">Published snapshot</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  This board reads the published snapshot timestamp directly. The public app stays
                  snapshot-backed, scoring switches reuse static files, and board updates only land
                  when the source data is rebuilt.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Tier Snapshot
                    </p>
                    <p className="text-sm font-semibold text-white">Where the breaks sit right now</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  {currentSliceUnavailable ? (
                    <p className="text-sm text-slate-400">
                      Tier summaries are unavailable for this scoring-position combination.
                    </p>
                  ) : tierSummaries.length === 0 ? (
                    <p className="text-sm text-slate-400">Tier summaries will appear when the snapshot loads.</p>
                  ) : (
                    tierSummaries.map(([tier, count]) => (
                      <div
                        key={`tier-${tier}`}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-white">Tier {tier}</span>
                        <span className="text-sm text-slate-400">{count} players</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-emerald-300/12 to-sky-300/12 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                  Draft Assistant
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">Track the room without leaving the board.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Use the same snapshot rankings inside the draft assistant, log picks manually, and keep
                  your best available list synced to the scoring format you care about.
                </p>
                <Link
                  href="/fantasy-football/draft-tracker"
                  className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Launch draft assistant
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FantasyFootballClient;
