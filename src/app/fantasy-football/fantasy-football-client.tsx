"use client";

import {
  Fragment,
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Search, Shield, Star, X } from "lucide-react";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import { usePlayerNotes } from "@/hooks/usePlayerNotes";
import { useCompareTray } from "@/hooks/useCompareTray";
import {
  FANTASY_POSITION_LABELS,
  FANTASY_SCORING_LABELS,
  FantasyRoutePosition,
  FantasyRouteScoring,
  getAllFantasySnapshotPlayers,
  getFantasyPlayerSearchText,
  getFantasyWeekLabel,
} from "@/lib/fantasy";
import {
  FANTASY_AVG_RANK_TOOLTIP,
  FANTASY_CHIP_CLASS,
  FANTASY_REACH_TOOLTIP,
  FANTASY_VALUE_TOOLTIP,
  formatUpdatedAt,
  formatRankValue,
  getFantasyAdpFreshness,
  getPositionTone,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  getSourceKindLabel,
  getTierGap,
  getValueVsAdp,
  withTierBreaks,
  type FantasySnapshotStaleness,
} from "@/lib/fantasyUtils";
import {
  CompareTray,
  FantasyBoardLegend,
  PlayerDetailDrawer,
  PositionFilterBar,
  RankingsListRow,
  TierBreakdown,
  TierBreakSeparator,
  type PositionFilterOption,
} from "@/components/fantasy";
import { MetricTooltip } from "@/components/investments/MetricTooltip";
import { Player } from "@/types";
import { buildFantasyHref, FantasySearchState, normalizeFantasyState } from "./fantasy-state";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

const POSITION_OPTIONS: FantasyRoutePosition[] = ["overall", "qb", "rb", "wr", "te", "flex", "k", "dst"];
const SCORING_OPTIONS: { key: FantasyRouteScoring; label: string }[] = [
  { key: "ppr", label: "PPR" },
  { key: "half_ppr", label: "Half PPR" },
  { key: "standard", label: "Standard" },
];

/** How many list rows render before the "Load more" sentinel kicks in. */
const RANKINGS_PAGE_SIZE = 60;

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const noMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

const STALENESS_TONE: Record<FantasySnapshotStaleness, CSSProperties> = {
  fresh: {
    background: "color-mix(in srgb, var(--home-positive) 16%, var(--home-paper))",
    borderColor: "color-mix(in srgb, var(--home-positive) 30%, var(--home-rule))",
    color: "var(--home-ink)",
  },
  aging: {
    background: "color-mix(in srgb, var(--home-warning) 18%, var(--home-paper))",
    borderColor: "color-mix(in srgb, var(--home-warning) 32%, var(--home-rule))",
    color: "var(--home-ink)",
  },
  stale: {
    background: "color-mix(in srgb, var(--home-negative) 16%, var(--home-paper))",
    borderColor: "color-mix(in srgb, var(--home-negative) 30%, var(--home-rule))",
    color: "var(--home-ink)",
  },
};

/**
 * Small chip that buckets a date into fresh/aging/stale against the weekly
 * refresh cadence. Annotates the "Source updated" and "Snapshot built" dates so
 * a missed refresh reads as an explicit warning instead of a stale-looking date.
 */
function FreshnessChip({ date }: { date: string | null | undefined }) {
  const staleness = getSnapshotStaleness(date);
  return (
    <span className={FANTASY_CHIP_CLASS} style={STALENESS_TONE[staleness]}>
      {getSnapshotStalenessLabel(staleness)}
    </span>
  );
}

interface FantasyFootballClientProps {
  initialState: FantasySearchState;
}

function getPublishedBoardRank(player: Player, position: FantasyRoutePosition): string {
  const rankValue =
    position === "flex"
      ? // The flex board is re-ranked densely (1..N) into averageRank by the
        // snapshot builder; rankEcr still carries each player's overall ECR
        // (gappy, since QB/K/DST are filtered out), so use the dense flex rank.
        player.averageRank ?? player.rankEcr
      : position === "overall"
        ? player.rankEcr ?? player.averageRank
        : player.positionRank ?? player.rankEcr ?? player.averageRank;

  return formatRankValue(rankValue);
}

// The ADP value/reach signal as a compact chip. Lives next to "Avg" in the
// row descriptor (see getPlayerDescriptor) so the two ADP-relative reads sit
// together instead of being split across the row.
function ValueReachBadge({ player }: { player: Player }) {
  const value = getValueVsAdp(player);
  if (!value?.signal) return null;

  const isValue = value.signal === "value";
  return (
    <span className="inline-flex items-center">
      <span
        className={FANTASY_CHIP_CLASS}
        style={
          isValue
            ? {
                borderColor: "color-mix(in srgb, var(--home-positive) 28%, var(--home-rule))",
                background: "color-mix(in srgb, var(--home-positive) 10%, var(--home-paper))",
              }
            : {
                borderColor: "color-mix(in srgb, var(--home-warning) 30%, var(--home-rule))",
                background: "color-mix(in srgb, var(--home-warning) 12%, var(--home-paper))",
              }
        }
      >
        {isValue ? "Value" : "Reach"} {value.delta > 0 ? `+${value.delta}` : value.delta}
      </span>
      <MetricTooltip
        term={isValue ? "Value" : "Reach"}
        definition={isValue ? FANTASY_VALUE_TOOLTIP : FANTASY_REACH_TOOLTIP}
      />
    </span>
  );
}

function getPlayerDescriptor(
  player: Player,
  position: FantasyRoutePosition,
  adpAvailable: boolean
): ReactNode {
  const parts: ReactNode[] = [player.team];
  const isOverallView = position === "overall" || position === "flex";

  // Overall/flex boards lead with the player's position rank (e.g. "RB3");
  // position boards skip it because the column already implies the position.
  if (isOverallView) {
    parts.push(player.positionRank ? `${player.position}${player.positionRank}` : player.position);
  }

  if (Number.isFinite(player.rankAverage)) {
    parts.push(
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center">
          Avg {Number(player.rankAverage).toFixed(2)}
          <MetricTooltip term="Average rank" definition={FANTASY_AVG_RANK_TOOLTIP} />
        </span>
        {/* Value/Reach compares consensus rank to overall ADP, so it's only valid
            where rankEcr is on the overall scale — the overall and flex boards. On
            a position board rankEcr is the position rank (QB9), not comparable to
            an overall ADP, so suppress the chip there. */}
        {adpAvailable && isOverallView && <ValueReachBadge player={player} />}
      </span>
    );
  }

  // Render the parts inline, separated by bullets, so the "Avg" segment can
  // carry its own explanatory tooltip instead of being flattened into a string.
  return parts.filter(Boolean).map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? " • " : ""}
      {part}
    </Fragment>
  ));
}

type FantasyBoardDensity = "comfortable" | "compact";

const FANTASY_DENSITY_STORAGE_KEY = "fantasy-board-density";

// The list density is a client-only preference backed by localStorage. We read
// it through useSyncExternalStore (matching useBudgetPlanner / useWineCellar) so
// the server and first client paint agree on the default, then the real value
// resolves on the client without a hydration mismatch.
const densityListeners = new Set<() => void>();

function subscribeDensityChange(listener: () => void) {
  densityListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === FANTASY_DENSITY_STORAGE_KEY) {
      listener();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    densityListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getDensitySnapshot(): FantasyBoardDensity {
  if (typeof window === "undefined") return "comfortable";
  return window.localStorage.getItem(FANTASY_DENSITY_STORAGE_KEY) === "compact"
    ? "compact"
    : "comfortable";
}

function persistDensity(next: FantasyBoardDensity) {
  try {
    window.localStorage.setItem(FANTASY_DENSITY_STORAGE_KEY, next);
  } catch {
    // Persistence is best-effort (private mode, blocked storage); the listener
    // notification below still updates this tab's UI even if the write fails.
  }
  densityListeners.forEach((listener) => listener());
}

/** A compact segmented control used for the scoring format and view toggles. */
function SegmentedToggle<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  disabled = false,
}: {
  ariaLabel: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex rounded-full border p-1 text-sm font-semibold"
      style={{
        borderColor: "var(--home-rule)",
        background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className="inline-flex min-h-[44px] items-center rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            style={active ? { background: "var(--home-ink)", color: "var(--home-paper)" } : { color: "var(--home-ink-muted)" }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function FantasyFootballClient({ initialState }: FantasyFootballClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;
  const [searchQuery, setSearchQuery] = useState("");
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [visibleCount, setVisibleCount] = useState(RANKINGS_PAGE_SIZE);
  const [queueClearArmed, setQueueClearArmed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );

  const queue = usePlayerQueue();
  const notes = usePlayerNotes();
  const compare = useCompareTray();

  const density = useSyncExternalStore(
    subscribeDensityChange,
    getDensitySnapshot,
    () => "comfortable" as FantasyBoardDensity
  );

  useEffect(() => {
    if (!queueClearArmed) return;
    const timeout = window.setTimeout(() => setQueueClearArmed(false), 5_000);
    return () => window.clearTimeout(timeout);
  }, [queueClearArmed]);

  const hasManagedParams = searchParams.get("position") !== null || searchParams.get("scoring") !== null;
  const routeState = useMemo<FantasySearchState>(
    () => (hasManagedParams ? normalizeFantasyState(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );

  useEffect(() => {
    const urlViewMatches =
      (searchParams.get("view") === "tiers" && routeState.view === "tiers") ||
      (searchParams.get("view") !== "tiers" && routeState.view === "list");

    if (
      searchParams.get("position") === routeState.position &&
      searchParams.get("scoring") === routeState.scoring &&
      urlViewMatches
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

  const { players, snapshot, metadata, sliceMetadata, sliceMetadataMap, isLoading, error, retry } = useFantasySnapshot({
    position: routeState.position,
    scoring: routeState.scoring,
  });
  // Every position hook receives the normalized full snapshot. Reuse it for
  // cross-board queue and compare lookups instead of creating a second data
  // subscription for the same scoring file.
  const allBoardPlayers = useMemo(
    () => (snapshot ? getAllFantasySnapshotPlayers(snapshot) : players),
    [players, snapshot]
  );

  const playerLookup = useMemo(() => {
    const map = new Map<string, Player>();
    for (const player of allBoardPlayers) map.set(player.id, player);
    for (const player of players) if (!map.has(player.id)) map.set(player.id, player);
    return map;
  }, [allBoardPlayers, players]);

  const currentSliceUnavailable = Boolean(sliceMetadata && !sliceMetadata.available);
  const localToolsMemoryOnly =
    queue.persistenceStatus === "memory-only" ||
    notes.persistenceStatus === "memory-only" ||
    compare.persistenceStatus === "memory-only";
  const adpSource = metadata?.adpSource ?? null;
  const adpAvailable = Boolean(adpSource);
  const adpFreshness = getFantasyAdpFreshness(adpSource?.asOf, metadata?.season);
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

  const maxTier = useMemo(() => {
    let max = 0;
    for (const player of players) {
      if (player.tier && player.tier > max) {
        max = player.tier;
      }
    }
    return max;
  }, [players]);

  // Reset the window whenever the board, scoring, view, or search changes so a
  // narrowed list never starts deep into a stale offset.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on filter change
    setVisibleCount(RANKINGS_PAGE_SIZE);
  }, [routeState.position, routeState.scoring, routeState.view, searchQuery]);

  const windowedPlayers =
    routeState.view === "list" ? filteredPlayers.slice(0, visibleCount) : filteredPlayers;
  const hasMore = routeState.view === "list" && visibleCount < filteredPlayers.length;

  useEffect(() => {
    if (!hasMore || typeof IntersectionObserver === "undefined") return;
    // On narrow screens the supporting rail sits below the rankings card.
    // Auto-extending the list while someone scrolls toward that rail can keep
    // moving the queue and freshness sections away from them, so mobile uses
    // the explicit Load more control instead.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + RANKINGS_PAGE_SIZE, filteredPlayers.length));
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filteredPlayers.length]);

  const queuedPlayers = useMemo(
    () =>
      queue.queue
        .map((id) => playerLookup.get(id))
        .filter((player): player is Player => Boolean(player)),
    [queue.queue, playerLookup]
  );

  const snapshotWeekLabel = metadata
    ? `${metadata.season} ${getFantasyWeekLabel(metadata.week)}`
    : "Loading…";

  const fantasyStatsCells: HomeStatsCell[] = [
    {
      label: "Players visible",
      tooltip: "Players on this board after the position, scoring, and search filters.",
      value: currentSliceUnavailable ? "—" : filteredPlayers.length.toLocaleString(),
      sub: currentSliceUnavailable ? "Board unavailable" : "After filters",
    },
    {
      label: "Active position",
      tooltip: "The position board currently in view.",
      value: FANTASY_POSITION_LABELS[routeState.position],
      sub: "Switch via pills",
    },
    {
      label: "Scoring format",
      tooltip: "Scoring rules behind the consensus ranks on this board.",
      value: selectedScoringLabel,
    },
    {
      label: "Tier count",
      tooltip: "Highest tier number FantasyPros publishes for this board.",
      value: maxTier > 0 ? maxTier : "—",
      sub: maxTier > 0 ? "Highest tier in view" : "Not published",
    },
    {
      label: "Queued",
      tooltip: "Players you have starred to your browser-local watchlist.",
      value: queue.queue.length,
      sub: "On your watchlist",
    },
    {
      label: "Snapshot week",
      tooltip: "Season and week the published snapshot covers.",
      value: snapshotWeekLabel,
    },
    {
      label: "Source updated",
      tooltip: "When FantasyPros last refreshed the source consensus.",
      value: formatUpdatedAt(currentSourceUpdatedAt),
      sub: currentSourceKindLabel,
    },
    {
      label: "Built",
      tooltip: "When this site last rebuilt its committed snapshot from the source.",
      value: formatUpdatedAt(metadata?.generatedAt),
      sub: "Snapshot generated",
    },
  ];

  const isCompact = density === "compact";
  const skeletonHeightClass = isCompact ? "h-[68px]" : "h-[84px]";

  const positionOptions: PositionFilterOption<FantasyRoutePosition>[] = POSITION_OPTIONS.map((position) => {
    const meta = sliceMetadataMap?.[position];
    return {
      value: position,
      label: FANTASY_POSITION_LABELS[position],
      position: position === "overall" || position === "flex" ? undefined : position.toUpperCase(),
      available: meta ? meta.available : true,
      unavailableLabel: meta?.reason,
    };
  });

  // Build the list view rows with labeled tier separators wherever the published
  // rank crosses a tier boundary. A running rank lets each break annotate the
  // cliff to the prior tier.
  function renderListRows(): ReactNode {
    const tierRows = withTierBreaks(windowedPlayers);
    const items: ReactNode[] = [];
    let previousRank: number | null = null;

    for (const { player, tier, startsTier } of tierRows) {
      const publishedRank = getPublishedBoardRank(player, routeState.position);
      const numericRank = Number.parseFloat(publishedRank);

      if (startsTier && tier !== null) {
        items.push(
          <TierBreakSeparator
            key={`tier-${tier}-${player.id}`}
            tier={tier}
            gap={
              previousRank !== null && Number.isFinite(numericRank)
                ? getTierGap(previousRank, numericRank)
                : undefined
            }
          />
        );
      }

      const inCompare = compare.inCompare(player.id);
      items.push(
        <RankingsListRow
          key={player.id}
          player={player}
          publishedRank={publishedRank}
          descriptor={getPlayerDescriptor(player, routeState.position, adpAvailable)}
          adpAvailable={adpAvailable}
          compact={isCompact}
          isQueued={queue.isQueued(player.id)}
          hasNote={notes.hasNote(player.id)}
          inCompare={inCompare}
          compareDisabled={!inCompare && compare.isFull}
          onOpenDetail={() => setDetailPlayer(player)}
          onToggleQueue={() => queue.toggle(player.id)}
          onToggleCompare={() => compare.toggle(player.id)}
        />
      );

      if (Number.isFinite(numericRank)) {
        previousRank = numericRank;
      }
    }

    return items;
  }

  return (
    <section
      className="home-page home-dash min-h-screen"
      aria-label="Fantasy football rankings"
      data-testid="fantasy-football-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <div className="home-shell home-shell-wide home-section space-y-4 sm:space-y-5">
        <motion.div className="space-y-4 pt-2" variants={variants} initial="hidden" animate="visible">
          <div className="space-y-3">
            <p className="home-kicker mb-0">Fantasy Football</p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2rem, 4.4vw, 3.3rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 0.98,
                maxWidth: "18ch",
              }}
            >
              Rankings first. Draft utility second.
            </h1>
            <p className="max-w-[60ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
              A snapshot-backed FantasyPros consensus board with explicit freshness, a shared watchlist, and a
              side-by-side compare — feeding the same data into the draft assistant.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/fantasy-football/draft-tracker"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
              >
                Launch draft assistant
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setShowStats((open) => !open)}
                aria-expanded={showStats}
                aria-controls="fantasy-football-stats"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold"
                style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }}
              >
                Board at a glance
                <ChevronDown
                  className="h-4 w-4 motion-safe:transition-transform"
                  style={{ transform: showStats ? "rotate(180deg)" : "none" }}
                />
              </button>
              <button
                type="button"
                onClick={() => setShowLegend((open) => !open)}
                aria-expanded={showLegend}
                aria-controls="fantasy-board-legend"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold"
                style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }}
              >
                How to read the board
                <ChevronDown
                  className="h-4 w-4 motion-safe:transition-transform"
                  style={{ transform: showLegend ? "rotate(180deg)" : "none" }}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {showStats && (
          <HomeStatsPanel
            id="fantasy-football-stats"
            title="Board at a glance"
            meta={`Updated ${formatUpdatedAt(currentSourceUpdatedAt)}`}
            cells={fantasyStatsCells}
          />
        )}

        {showLegend && <FantasyBoardLegend id="fantasy-board-legend" />}

        {localToolsMemoryOnly ? (
          <div
            role="status"
            className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 55%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            }}
          >
            <p className="font-semibold">Browser storage is unavailable.</p>
            <p className="mt-1" style={{ color: "var(--home-ink-muted)" }}>
              Queue, notes, and compare still work in this tab, but they will not survive a reload.
            </p>
          </div>
        ) : null}

        {error && (
          <article className="home-card p-5 sm:p-6" style={{ borderColor: "var(--home-negative)" }}>
            <p className="font-semibold" style={{ color: "var(--home-negative)" }}>
              {error}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
              Check your connection and try loading the published snapshot again.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-semibold"
              style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
            >
              Retry rankings
            </button>
          </article>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,22rem)] min-[1440px]:grid-cols-[minmax(0,1.2fr)_minmax(20rem,26rem)]">
          <article className="home-card scroll-mt-28 p-5 sm:p-6" aria-labelledby="rankings-board-heading">
            <div
              className="z-20 -mx-5 flex flex-col gap-3 border-b px-5 pb-4 pt-1 sm:sticky sm:top-20 sm:-mx-6 sm:flex-row sm:items-end sm:justify-between sm:px-6"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
              }}
            >
              <div>
                <p className="home-kicker mb-1">Rankings Board</p>
                <h2 id="rankings-board-heading" className="text-2xl font-semibold">
                  {FANTASY_POSITION_LABELS[routeState.position]} rankings
                </h2>
              </div>
              <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
                {routeState.view === "list" && (
                  <SegmentedToggle
                    ariaLabel="List density"
                    options={[
                      { value: "comfortable", label: "Comfortable" },
                      { value: "compact", label: "Compact" },
                    ]}
                    value={density}
                    onChange={(value) => persistDensity(value)}
                    disabled={currentSliceUnavailable}
                  />
                )}
                <SegmentedToggle
                  ariaLabel="Rankings view"
                  options={[
                    { value: "list", label: "List" },
                    { value: "tiers", label: "Tiers" },
                  ]}
                  value={routeState.view}
                  onChange={(value) => updateRouteState({ view: value })}
                  disabled={currentSliceUnavailable}
                />
                <p
                  aria-live="polite"
                  className="text-sm sm:min-w-[9.5rem] sm:text-right"
                  style={{ color: "var(--home-ink-muted)" }}
                >
                  {isLoading
                    ? "Loading players…"
                    : currentSliceUnavailable
                      ? "Board unavailable"
                      : routeState.view === "list" && hasMore
                        ? `${windowedPlayers.length} of ${filteredPlayers.length} shown`
                        : `${filteredPlayers.length} players shown`}
                </p>
              </div>
            </div>

            {/* Controls: position, scoring, search */}
            <div className="mt-4 grid gap-3">
              <PositionFilterBar
                ariaLabel="Position board"
                options={positionOptions}
                value={routeState.position}
                onChange={(position) => updateRouteState({ position })}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Scoring is a toggle-button group (aria-pressed), distinct from
                    the position radiogroup, so each format reads as an independent
                    on/off rather than a single-select. */}
                <div role="group" aria-label="Scoring format" className="flex flex-wrap gap-2">
                  {SCORING_OPTIONS.map((option) => {
                    const active = routeState.scoring === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateRouteState({ scoring: option.key })}
                        className="inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                        style={
                          active
                            ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                            : {
                                borderColor: "var(--home-rule)",
                                background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                                color: "var(--home-ink)",
                              }
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <div className="relative sm:max-w-[18rem] sm:flex-1">
                  <label htmlFor="fantasy-search" className="sr-only">
                    Search the current rankings board
                  </label>
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
                    placeholder={`Search ${FANTASY_POSITION_LABELS[routeState.position].toLowerCase()} board…`}
                    className="min-h-[48px] w-full rounded-[var(--radius-3xl)] border px-11 pr-10 text-sm transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-[var(--home-ink-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                      color: "var(--home-ink)",
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-0 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center"
                    >
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border"
                        style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
                      >
                        <X size={14} aria-hidden="true" />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={`loading-${index}`}
                      className={`${skeletonHeightClass} motion-safe:animate-pulse rounded-[var(--radius-3xl)] border`}
                      style={{
                        borderColor: "var(--home-rule)",
                        background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                      }}
                    />
                  ))}
                </div>
              ) : currentSliceUnavailable ? (
                <div
                  className="rounded-[var(--radius-3xl)] border px-5 py-12 text-center"
                  style={{
                    borderColor: "color-mix(in srgb, var(--home-warning) 32%, var(--home-rule))",
                    background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
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
                  className="rounded-[var(--radius-3xl)] border px-5 py-12 text-center"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                  }}
                >
                  <p className="text-lg font-semibold">No matching players</p>
                  <p className="mt-2 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                    Clear the search or switch the board to see more names.
                  </p>
                </div>
              ) : routeState.view === "tiers" ? (
                <TierBreakdown
                  players={filteredPlayers}
                  position={routeState.position}
                  getPublishedRank={(player) => getPublishedBoardRank(player, routeState.position)}
                  onSelectPlayer={setDetailPlayer}
                  isQueued={(id) => queue.isQueued(id)}
                  onToggleQueue={(id) => queue.toggle(id)}
                />
              ) : (
                <>
                  <ul role="list" className="grid gap-2.5">
                    {renderListRows()}
                  </ul>
                  {hasMore && (
                    <div ref={sentinelRef} className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCount((count) => Math.min(count + RANKINGS_PAGE_SIZE, filteredPlayers.length))
                        }
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 text-sm font-semibold"
                        style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
                      >
                        Load more ({filteredPlayers.length - windowedPlayers.length} left)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </article>

          <aside className="grid gap-5 lg:sticky lg:top-24 lg:self-start">
            <article className="home-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" style={{ color: "var(--home-signal)" }} aria-hidden="true" />
                <div>
                  <p className="home-kicker mb-0">Freshness</p>
                  <p className="text-sm font-semibold">{currentSourceKindLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <div
                  className="rounded-[var(--radius-3xl)] border px-4 py-3"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                  }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="home-kicker mb-0">Source updated</p>
                    <FreshnessChip date={currentSourceUpdatedAt} />
                  </div>
                  <p className="text-sm font-semibold">{formatUpdatedAt(currentSourceUpdatedAt)}</p>
                </div>
                <div
                  className="rounded-[var(--radius-3xl)] border px-4 py-3"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                  }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="home-kicker mb-0">Snapshot built</p>
                    <FreshnessChip date={metadata?.generatedAt} />
                  </div>
                  <p className="text-sm font-semibold">{formatUpdatedAt(metadata?.generatedAt)}</p>
                </div>
                {adpSource && (
                  <div
                    className="rounded-[var(--radius-3xl)] border px-4 py-3"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="home-kicker mb-0">ADP source</p>
                      {adpFreshness === "prior-season" && (
                        <span className={FANTASY_CHIP_CLASS} style={STALENESS_TONE.aging}>
                          Prior season
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold">{adpSource.provider}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                      {adpSource.asOf ? `As of ${formatUpdatedAt(adpSource.asOf)}` : "Sample date not published"}
                      {adpSource.sampleSize
                        ? ` from ${adpSource.sampleSize.toLocaleString()} mock drafts`
                        : ""}
                    </p>
                    {adpFreshness === "prior-season" && (
                      <p className="mt-2 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                        {`${metadata?.season ?? ""} mock drafts have not started yet, so this carries last season's final ADP. It refreshes automatically once new drafts post.`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </article>

            {/* Watchlist — shared with the draft assistant via the browser. */}
            <article className="home-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5" style={{ color: "var(--home-signal)" }} fill="currentColor" aria-hidden="true" />
                  <div>
                    <p className="home-kicker mb-0">My Queue</p>
                    <p className="text-sm font-semibold">{queue.queue.length} starred</p>
                  </div>
                </div>
                {queue.queue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (queueClearArmed) {
                        queue.clear();
                        setQueueClearArmed(false);
                        return;
                      }
                      setQueueClearArmed(true);
                    }}
                    aria-label={queueClearArmed ? "Confirm clear queue" : "Clear queue"}
                    className="inline-flex min-h-touch items-center rounded-full px-3 text-xs font-semibold"
                    style={{ color: queueClearArmed ? "var(--home-negative)" : "var(--home-ink-muted)" }}
                  >
                    {queueClearArmed ? "Confirm clear" : "Clear queue"}
                  </button>
                )}
              </div>
              <div className="mt-4 grid gap-2">
                {queuedPlayers.length === 0 ? (
                  <p className="text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                    Star players from the board to build a watchlist. It travels with you into the draft assistant.
                  </p>
                ) : (
                  queuedPlayers.slice(0, 12).map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 rounded-[var(--radius-3xl)] border px-3 py-2"
                      style={{
                        borderColor: "var(--home-rule)",
                        background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setDetailPlayer(player)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className={FANTASY_CHIP_CLASS} style={getPositionTone(player.position)}>
                          {player.position}
                        </span>
                        <span className="min-w-0 truncate text-sm font-semibold">{player.name}</span>
                        <span className="ml-auto shrink-0 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                          {player.team}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => queue.remove(player.id)}
                        aria-label={`Remove ${player.name} from queue`}
                        className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center"
                      >
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border"
                          style={{ borderColor: "var(--home-rule)" }}
                        >
                          <X size={13} aria-hidden="true" />
                        </span>
                      </button>
                    </div>
                  ))
                )}
                {queuedPlayers.length > 12 && (
                  <p className="text-xs" style={{ color: "var(--home-ink-muted)" }}>
                    +{queuedPlayers.length - 12} more on your watchlist
                  </p>
                )}
              </div>
            </article>

            <article
              className="home-card p-5 sm:p-6"
              style={{
                background:
                  "linear-gradient(145deg, color-mix(in srgb, var(--home-signal) 12%, var(--home-paper)) 0%, color-mix(in srgb, var(--home-signal) 14%, var(--home-paper)) 100%)",
              }}
            >
              <p className="home-kicker mb-1">Draft Assistant</p>
              <h3 className="text-xl font-semibold">Track the room without leaving the board.</h3>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                Use the same snapshot inside the draft assistant, log picks manually, and let it flag steals,
                reaches, and position runs against the same attributed ADP shown here.
              </p>
              <Link
                href="/fantasy-football/draft-tracker"
                className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
              >
                Launch draft assistant
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          </aside>
        </div>
      </div>

      <PlayerDetailDrawer
        player={detailPlayer}
        publishedRank={detailPlayer ? getPublishedBoardRank(detailPlayer, routeState.position) : undefined}
        boardTierCount={maxTier > 0 ? maxTier : undefined}
        adpAvailable={adpAvailable}
        valueSignalAvailable={routeState.position === "overall" || routeState.position === "flex"}
        onClose={() => setDetailPlayer(null)}
      />
      <CompareTray
        resolvePlayer={(id) => playerLookup.get(id)}
        publishedRank={(player) => getPublishedBoardRank(player, routeState.position)}
        valueSignalAvailable={routeState.position === "overall" || routeState.position === "flex"}
      />
    </section>
  );
}

export default FantasyFootballClient;
