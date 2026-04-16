"use client";

import { startTransition, useEffect, useMemo, useState, type CSSProperties } from "react";
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
  FantasySnapshotSliceMetadata,
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

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const noMotion = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

interface FantasyFootballClientProps {
  initialState: FantasySearchState;
}

function formatUpdatedAt(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatRankValue(value: number | string | undefined): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "--";
    }

    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }

  return value?.trim() ? value : "--";
}

function formatRange(player: Player): string {
  if (player.minRank === undefined || player.maxRank === undefined) {
    return "--";
  }

  return `${formatRankValue(player.minRank)} to ${formatRankValue(player.maxRank)}`;
}

function formatOwnership(ownership: number | undefined): string {
  if (!Number.isFinite(ownership)) {
    return "Not listed";
  }

  return `${ownership?.toFixed(1)}% rostered`;
}

function getSourceKindLabel(sourceKind: FantasySnapshotSliceMetadata["sourceKind"] | undefined): string {
  switch (sourceKind) {
    case "overall_consensus":
      return "Overall consensus";
    case "position_consensus":
      return "Position consensus";
    case "shared_position_consensus":
      return "Shared consensus";
    case "derived_flex":
      return "Derived flex board";
    case "derived_overall":
      return "Derived overall board";
    default:
      return "Unavailable";
  }
}

function getPositionTone(position: string): CSSProperties {
  switch (position) {
    case "QB":
      return {
        background: "color-mix(in srgb, var(--home-haze) 14%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-haze) 28%, var(--home-rule))",
      };
    case "RB":
      return {
        background: "color-mix(in srgb, var(--color-success) 14%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--color-success) 24%, var(--home-rule))",
      };
    case "WR":
      return {
        background: "color-mix(in srgb, var(--home-acid) 26%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-acid) 34%, var(--home-rule))",
      };
    case "TE":
      return {
        background: "color-mix(in srgb, var(--color-warning) 18%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--color-warning) 26%, var(--home-rule))",
      };
    case "K":
      return {
        background: "color-mix(in srgb, var(--home-moss) 22%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-moss) 32%, var(--home-rule))",
      };
    case "DST":
      return {
        background: "color-mix(in srgb, var(--home-stone) 50%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-stone) 58%, var(--home-rule))",
      };
    default:
      return {
        background: "color-mix(in srgb, var(--home-paper-alt) 90%, white)",
        borderColor: "var(--home-rule)",
      };
  }
}

function getPillStyle(active: boolean, unavailable = false): CSSProperties {
  if (active) {
    return {
      borderColor: unavailable ? "var(--color-warning)" : "var(--home-ink)",
      background: unavailable
        ? "color-mix(in srgb, var(--color-warning) 12%, var(--home-paper))"
        : "var(--home-ink)",
      color: unavailable ? "var(--home-ink)" : "var(--home-paper)",
    };
  }

  if (unavailable) {
    return {
      borderColor: "color-mix(in srgb, var(--color-warning) 28%, var(--home-rule))",
      background: "color-mix(in srgb, var(--color-warning) 7%, var(--home-paper))",
      color: "var(--home-ink-muted)",
    };
  }

  return {
    borderColor: "var(--home-rule)",
    background: "color-mix(in srgb, var(--home-paper) 88%, white)",
    color: "var(--home-ink)",
  };
}

function getPublishedBoardRank(player: Player, position: FantasyRoutePosition): string {
  const rankValue =
    position === "overall" || position === "flex"
      ? player.rankEcr ?? player.averageRank
      : player.positionRank ?? player.rankEcr ?? player.averageRank;

  return formatRankValue(rankValue);
}

function getPlayerDescriptor(player: Player, position: FantasyRoutePosition): string {
  const parts = [player.team];

  if (position === "overall" || position === "flex") {
    if (player.positionRank) {
      parts.push(`${player.position}${player.positionRank}`);
    } else {
      parts.push(player.position);
    }
  } else if (Number.isFinite(player.rankAverage)) {
    parts.push(`Avg ${Number(player.rankAverage).toFixed(2)}`);
  }

  if (Number.isFinite(player.rankAverage) && (position === "overall" || position === "flex")) {
    parts.push(`Avg ${Number(player.rankAverage).toFixed(2)}`);
  }

  return parts.filter(Boolean).join(" • ");
}

export function FantasyFootballClient({ initialState }: FantasyFootballClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;
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
  const currentSourceUpdatedAt = sliceMetadata?.updatedAt ?? metadata?.upstreamUpdatedAt ?? null;
  const currentSourceKindLabel = getSourceKindLabel(sliceMetadata?.sourceKind);

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
      className="home-page min-h-screen"
      aria-label="Fantasy football rankings"
      data-testid="fantasy-football-shell"
    >
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        <motion.div
          className="space-y-4 pt-2"
          variants={variants}
          initial="hidden"
          animate="visible"
        >
          <div className="space-y-3">
            <p className="home-kicker mb-0">Fantasy Football</p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.7rem, 6vw, 4.9rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
                maxWidth: "15ch",
              }}
            >
              Rankings first. Draft utility second.
            </h1>
            <p
              className="max-w-[68ch] text-sm leading-7 sm:text-[1rem]"
              style={{ color: "var(--home-ink-muted)" }}
            >
              The public board is snapshot-backed and sourced from FantasyPros consensus pages. The
              page shows when the source last moved and when this repo rebuilt the snapshot, so
              freshness is explicit instead of implied.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span
              className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 font-medium"
              style={getPillStyle(false)}
            >
              {metadata ? `${metadata.season} ${getFantasyWeekLabel(metadata.week)}` : "Loading snapshot"}
            </span>
            <span
              className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 font-medium"
              style={getPillStyle(false)}
            >
              Source updated {formatUpdatedAt(currentSourceUpdatedAt)}
            </span>
            <span
              className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 font-medium"
              style={getPillStyle(false)}
            >
              Built {formatUpdatedAt(metadata?.generatedAt)}
            </span>
            <span
              className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 font-medium"
              style={getPillStyle(false)}
            >
              {selectedScoringLabel} scoring
            </span>
          </div>
        </motion.div>

        {error && (
          <article className="home-card p-5 sm:p-6" style={{ borderColor: "var(--color-error)" }}>
            <p className="font-semibold" style={{ color: "var(--color-error)" }}>
              {error}
            </p>
          </article>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,22rem)]">
          <div className="grid gap-5">
            <article className="home-card p-5 sm:p-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-4">
                  <div>
                    <p className="home-kicker mb-2">Board</p>
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Fantasy positions">
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
                            className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                            style={getPillStyle(active, unavailable)}
                          >
                            <span>{FANTASY_POSITION_LABELS[position]}</span>
                            {unavailable && <span className="ml-2 text-[11px] uppercase tracking-[0.12em]">NA</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="home-kicker mb-2">Scoring</p>
                    <div className="flex flex-wrap gap-2">
                      {SCORING_OPTIONS.map((option) => {
                        const active = routeState.scoring === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => updateRouteState({ scoring: option.key })}
                            className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                            style={getPillStyle(active)}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="grid gap-2 text-sm" htmlFor="fantasy-search">
                    <span className="home-kicker mb-0">Search</span>
                    <span className="sr-only">Search the current rankings board</span>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: "var(--home-ink-muted)" }}
                      />
                      <input
                        id="fantasy-search"
                        name="fantasy-search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        disabled={currentSliceUnavailable}
                        autoComplete="off"
                        placeholder={`Search ${FANTASY_POSITION_LABELS[routeState.position].toLowerCase()} board`}
                        className="min-h-[48px] w-full rounded-[1.2rem] border px-11 pr-4 text-sm transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-[var(--home-ink-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: "var(--home-rule)",
                          background: "color-mix(in srgb, var(--home-paper) 88%, white)",
                          color: "var(--home-ink)",
                        }}
                      />
                    </div>
                  </label>

                  <div
                    className="rounded-[1.5rem] border px-4 py-4"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper-alt) 62%, white)",
                    }}
                  >
                    <p className="home-kicker mb-1">Status</p>
                    <p className="text-base font-semibold">{currentSourceKindLabel}</p>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
                      {isLoading
                        ? "Loading the current board."
                        : currentSliceUnavailable
                          ? sliceMetadata?.reason ?? "This board is unavailable in the current snapshot."
                          : `${filteredPlayers.length} players visible from the current snapshot.`}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="home-card p-5 sm:p-6">
              <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--home-rule)" }}>
                <div>
                  <p className="home-kicker mb-1">Rankings Board</p>
                  <h2 className="text-2xl font-semibold">{FANTASY_POSITION_LABELS[routeState.position]} rankings</h2>
                </div>
                <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
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
                      className="h-[104px] animate-pulse rounded-[1.5rem] border"
                      style={{
                        borderColor: "var(--home-rule)",
                        background: "color-mix(in srgb, var(--home-paper-alt) 55%, white)",
                      }}
                    />
                  ))
                ) : currentSliceUnavailable ? (
                  <div
                    className="rounded-[1.5rem] border px-5 py-12 text-center"
                    style={{
                      borderColor: "color-mix(in srgb, var(--color-warning) 32%, var(--home-rule))",
                      background: "color-mix(in srgb, var(--color-warning) 10%, var(--home-paper))",
                    }}
                  >
                    <p className="text-lg font-semibold">
                      {selectedScoringLabel} {FANTASY_POSITION_LABELS[routeState.position]} rankings are unavailable.
                    </p>
                    <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                      {sliceMetadata?.reason ??
                        "This scoring-position combination is not published in the current snapshot."}
                    </p>
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div
                    className="rounded-[1.5rem] border px-5 py-12 text-center"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper-alt) 55%, white)",
                    }}
                  >
                    <p className="text-lg font-semibold">No matching players</p>
                    <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                      Clear the search or switch the board to see more names.
                    </p>
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="grid gap-4 rounded-[1.5rem] border px-4 py-4 sm:grid-cols-[72px_minmax(0,1.55fr)_110px_140px_140px] sm:items-center"
                      style={{
                        borderColor: "var(--home-rule)",
                        background: "color-mix(in srgb, var(--home-paper-alt) 42%, white)",
                      }}
                    >
                      <div>
                        <p className="home-kicker mb-1">Rank</p>
                        <p className="text-2xl font-semibold">{getPublishedBoardRank(player, routeState.position)}</p>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold">{player.name}</p>
                          <span
                            className="inline-flex min-h-[32px] items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                            style={getPositionTone(player.position)}
                          >
                            {player.position}
                          </span>
                        </div>
                        <p className="mt-1 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                          {getPlayerDescriptor(player, routeState.position)}
                        </p>
                      </div>

                      <div>
                        <p className="home-kicker mb-1">Tier</p>
                        <p className="text-sm font-semibold">{player.tier ? `Tier ${player.tier}` : "Not listed"}</p>
                      </div>

                      <div>
                        <p className="home-kicker mb-1">Expert range</p>
                        <p className="text-sm font-semibold">{formatRange(player)}</p>
                      </div>

                      <div>
                        <p className="home-kicker mb-1">Availability</p>
                        <p className="text-sm font-semibold">{formatOwnership(player.ownership)}</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                          {player.byeWeek ? `Bye ${player.byeWeek}` : "Bye not listed"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>

          <aside className="grid gap-5 lg:sticky lg:top-24 lg:self-start">
            <article className="home-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" style={{ color: "var(--home-haze)" }} />
                <div>
                  <p className="home-kicker mb-0">Freshness</p>
                  <p className="text-sm font-semibold">{currentSourceKindLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <div
                  className="rounded-[1.2rem] border px-4 py-3"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, white)",
                  }}
                >
                  <p className="home-kicker mb-1">Source updated</p>
                  <p className="text-sm font-semibold">{formatUpdatedAt(currentSourceUpdatedAt)}</p>
                </div>
                <div
                  className="rounded-[1.2rem] border px-4 py-3"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, white)",
                  }}
                >
                  <p className="home-kicker mb-1">Snapshot built</p>
                  <p className="text-sm font-semibold">{formatUpdatedAt(metadata?.generatedAt)}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                The board only publishes fields the source actually exposes: consensus rank, tier,
                range, ownership, and freshness.
              </p>
            </article>

            <article className="home-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" style={{ color: "var(--color-success)" }} />
                <div>
                  <p className="home-kicker mb-0">Tier Snapshot</p>
                  <p className="text-sm font-semibold">Where the breaks sit right now</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {currentSliceUnavailable ? (
                  <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    Tier summaries are unavailable for this board.
                  </p>
                ) : tierSummaries.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    Tier summaries will appear when the snapshot loads.
                  </p>
                ) : (
                  tierSummaries.map(([tier, count]) => (
                    <div
                      key={`tier-${tier}`}
                      className="flex items-center justify-between rounded-[1.2rem] border px-4 py-3"
                      style={{
                        borderColor: "var(--home-rule)",
                        background: "color-mix(in srgb, var(--home-paper-alt) 55%, white)",
                      }}
                    >
                      <span className="text-sm font-semibold">Tier {tier}</span>
                      <span className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                        {count} players
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article
              className="home-card p-5 sm:p-6"
              style={{
                background:
                  "linear-gradient(145deg, color-mix(in srgb, var(--home-haze) 12%, var(--home-paper)) 0%, color-mix(in srgb, var(--home-acid) 14%, var(--home-paper)) 100%)",
              }}
            >
              <p className="home-kicker mb-1">Draft Assistant</p>
              <h3 className="text-xl font-semibold">Track the room without leaving the board.</h3>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                Use the same snapshot inside the draft assistant, log picks manually, and keep roster
                pressure visible without pretending unsupported ADP or projection data exists.
              </p>
              <Link
                href="/fantasy-football/draft-tracker"
                className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                style={{
                  borderColor: "var(--home-ink)",
                  background: "var(--home-ink)",
                  color: "var(--home-paper)",
                }}
              >
                Launch draft assistant
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default FantasyFootballClient;
