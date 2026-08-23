"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import Link from "next/link";
import type { DraftPick, Player, RedraftLineupSettings, ScoringFormat } from "@/types";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { FANTASY_SCORING_LABELS, scoringFormatToRouteScoring } from "@/lib/fantasy";
import {
  FASCIA_TOP_CLASS,
  HEADER_CHIP_CLASS,
  MONO_LABEL_CLASS,
  PILL_BUTTON_CLASS,
  PILL_BUTTON_STYLE,
  SHELL_CLASS,
  WARNING_CARD_STYLE,
  assignLineupSlots,
  formatAdp,
  formatPickDelta,
  formatRankValue,
  formatUpdatedAt,
  getConsensusAvg,
  getFantasyAdpFreshness,
  getNflRegularSeasonWeek,
  getPositionTone,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  getTierRailIntensity,
  hasReliableAdpSample,
  shortName,
  withTierBreaks,
  withoutPlayerAdp,
} from "@/lib/fantasyUtils";
import { classifyPickValue, getPickDelta, isPlayerValueAtPick } from "@/lib/draftAnalytics";
import { REDRAFT_LINEUP_PRESETS } from "@/lib/redraftLineup";
import {
  PositionFilterBar,
  type PositionFilterOption,
} from "@/components/fantasy/PositionFilterBar";
import type { MockDraftTemper } from "@/lib/mockDraft";
import {
  DEFAULT_MOCK_DRAFT_SETTINGS,
  getMockDraftStorageKey,
  useMockDraftState,
} from "./hooks/useMockDraftState";

/** Ink-filled action pill (the template's "Draft" / "Start mock" buttons). */
const SOLID_BUTTON_CLASS =
  "inline-flex min-h-touch items-center justify-center rounded-full border px-4 font-mono text-2xs uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-50";

const SOLID_BUTTON_STYLE: CSSProperties = {
  borderColor: "var(--home-ink)",
  background: "var(--home-ink)",
  color: "var(--home-paper)",
};

const WARNING_CHIP_TONE: CSSProperties = {
  background: "color-mix(in srgb, var(--home-warning) 18%, var(--home-paper))",
  borderColor: "color-mix(in srgb, var(--home-warning) 32%, var(--home-rule))",
  color: "var(--home-ink)",
};

const SCORING_OPTIONS: { value: ScoringFormat; label: string }[] = [
  { value: "PPR", label: "PPR" },
  { value: "HALF_PPR", label: "Half" },
  { value: "STANDARD", label: "Std" },
];

const ORDER_OPTIONS: { value: "snake" | "linear"; label: string }[] = [
  { value: "snake", label: "Snake" },
  { value: "linear", label: "Linear" },
];

const TEMPER_OPTIONS: { value: MockDraftTemper; label: string }[] = [
  { value: "faithful", label: "Faithful" },
  { value: "normal", label: "Normal" },
  { value: "chaotic", label: "Chaotic" },
];

const TEMPER_NOTES: Record<MockDraftTemper, string> = {
  faithful: "Rooms track the board tightly, so few surprises.",
  normal: "Board order with human wobble, including the occasional reach.",
  chaotic: "Wide windows and real reaches that stress-test your plan.",
};

const TEMPER_LABELS: Record<MockDraftTemper, string> = {
  faithful: "Faithful",
  normal: "Normal",
  chaotic: "Chaotic",
};

const TEAM_OPTIONS = [8, 10, 12, 14];
const ROUND_OPTIONS = [3, 4, 5, 6];

type BoardPositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DST";

const FLEX_POSITIONS = new Set(["RB", "WR", "TE"]);

const POSITION_FILTER_OPTIONS: PositionFilterOption<BoardPositionFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "QB", label: "QB", position: "QB" },
  { value: "RB", label: "RB", position: "RB" },
  { value: "WR", label: "WR", position: "WR" },
  { value: "TE", label: "TE", position: "TE" },
  { value: "FLEX", label: "Flex" },
  { value: "K", label: "K", position: "K" },
  { value: "DST", label: "DST", position: "DST" },
];

/** Keep the mounted board below the large-list threshold; search reaches the rest. */
const VISIBLE_BOARD_ROWS = 40;

/** The tape shows at most this many room picks since the user's last turn. */
const TAPE_LENGTH = 12;

/** Three-digit room label off the seed; a display label, not an identifier. */
function roomLabel(seed: number): string {
  return String(seed % 1000).padStart(3, "0");
}

/** "1QB 2RB 2WR 1TE 1FLX K DST" for the setup summary line. */
function lineupShort(lineup: RedraftLineupSettings): string {
  const parts = [`${lineup.QB}QB`, `${lineup.RB}RB`, `${lineup.WR}WR`, `${lineup.TE}TE`];
  if (lineup.FLEX) parts.push(`${lineup.FLEX}FLX`);
  if (lineup.K) parts.push("K");
  if (lineup.DST) parts.push("DST");
  return parts.join(" ");
}

function sameLineup(left: RedraftLineupSettings, right: RedraftLineupSettings): boolean {
  return (Object.keys(left) as (keyof RedraftLineupSettings)[]).every(
    (position) => left[position] === right[position]
  );
}

/**
 * The signed gap between the current pick and a player's market ADP. Strictly
 * market-based: no reliable ADP sample means no reading, matching the live
 * value badge on the draft tracker rather than inventing a number.
 */
function deltaAtPick(
  player: Player,
  pickNumber: number,
  round: number
): { text: string; color: string; title: string } | null {
  if (typeof player.adp !== "number" || !Number.isFinite(player.adp)) return null;
  if (!hasReliableAdpSample(player)) return null;
  const delta = pickNumber - player.adp;
  const magnitude = Math.abs(Math.round(delta * 10) / 10);
  if (isPlayerValueAtPick(player, pickNumber, round)) {
    return {
      text: formatPickDelta(delta),
      color: "var(--home-positive)",
      title: `Still on the board ${magnitude} picks past his market ADP`,
    };
  }
  return {
    text: formatPickDelta(delta),
    color: "var(--home-ink-muted)",
    title:
      delta < 0
        ? `Rooms usually take him about ${magnitude} picks after #${pickNumber}`
        : `Near his market price at this pick`,
  };
}

/** Fused segmented control: aria-pressed buttons inside one hairline frame. */
function SegmentedButtons<Value extends string>({
  options,
  value,
  onSelect,
}: {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onSelect: (value: Value) => void;
}) {
  return (
    <div
      className="inline-flex overflow-hidden rounded border"
      style={{ borderColor: "var(--home-rule)" }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className="min-h-touch flex-1 px-2.5 font-mono text-2xs uppercase tracking-[0.06em]"
            style={
              active
                ? { background: "var(--home-ink)", color: "var(--home-paper)" }
                : { background: "transparent", color: "var(--home-ink)" }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface SetupFormState {
  totalTeams: number;
  /** 0 means a random slot, resolved when the room starts. */
  slot: number;
  rounds: number;
  draftType: "snake" | "linear";
  temper: MockDraftTemper;
  lineup: RedraftLineupSettings;
}

/**
 * The mock draft rehearsal room. One route-level surface with three screens:
 * a setup card, the live room (the simulated teams pick around the user, so
 * they are always on the clock), and the recap with the board grid and the
 * value report. Opponent picks come from the seeded engine, so a room is
 * reproducible and resumable from localStorage.
 */
export function MockDraftClient() {
  const [scoringSelection, setScoringSelection] = useState<ScoringFormat>(
    DEFAULT_MOCK_DRAFT_SETTINGS.scoringFormat
  );
  const [setupForm, setSetupForm] = useState<SetupFormState>({
    totalTeams: DEFAULT_MOCK_DRAFT_SETTINGS.totalTeams,
    slot: DEFAULT_MOCK_DRAFT_SETTINGS.userTeam,
    rounds: DEFAULT_MOCK_DRAFT_SETTINGS.rounds,
    draftType: DEFAULT_MOCK_DRAFT_SETTINGS.draftType,
    temper: DEFAULT_MOCK_DRAFT_SETTINGS.temper,
    lineup: DEFAULT_MOCK_DRAFT_SETTINGS.lineup,
  });
  const [roomSetupOpen, setRoomSetupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<BoardPositionFilter>("ALL");
  // Every pick unmounts the row or quick pick that took the click, so focus has
  // somewhere stable to land: the panel that owns the next turn.
  const onClockRef = useRef<HTMLElement>(null);

  // A persisted room decides which scoring board to fetch, so a saved
  // Standard room resumes onto Standard ranks after a reload. The hook
  // itself refuses to hydrate until the matching board arrives.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(getMockDraftStorageKey());
      if (!raw) return;
      const saved = (JSON.parse(raw) as { settings?: { scoringFormat?: unknown } })
        ?.settings?.scoringFormat;
      if (saved === "PPR" || saved === "HALF_PPR" || saved === "STANDARD") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-mount read of the persisted room's scoring
        setScoringSelection(saved);
      }
    } catch {
      // Ignore: an unreadable save just means a fresh setup card.
    }
  }, []);

  const routeScoring = scoringFormatToRouteScoring(scoringSelection);
  const { snapshot, metadata, isLoading, error, retry } = useFantasySnapshot({
    scoring: routeScoring,
  });

  // Same rule as the draft tracker: nothing that models or logs a pick may
  // use a board from another scoring format, including the one-render-stale
  // value the snapshot hook keeps while switching.
  const snapshotMatches = snapshot?.scoringFormat === scoringSelection;
  const overallMeta = snapshotMatches ? (snapshot?.sliceMetadata?.overall ?? null) : null;
  const boardReady = Boolean(
    !isLoading &&
      !error &&
      snapshotMatches &&
      snapshot &&
      overallMeta?.available !== false &&
      snapshot.overall.length > 0
  );
  const boardUpdatedAt =
    overallMeta?.updatedAt ?? (snapshotMatches ? metadata?.upstreamUpdatedAt : null);
  const boardStaleness = getSnapshotStaleness(boardUpdatedAt);
  const adpFreshness = getFantasyAdpFreshness(
    snapshotMatches ? metadata?.adpSource?.asOf : null,
    snapshotMatches ? metadata?.season : null
  );
  const adpAvailable =
    Boolean(snapshotMatches && metadata?.adpSource) && adpFreshness === "current";
  const adpStatusLabel = adpFreshness === "prior-season"
    ? "Prior-season ADP excluded"
    : "ADP unavailable, consensus only";
  const board = useMemo(
    () =>
      boardReady && snapshot
        ? snapshot.overall.map((player) =>
            adpAvailable ? player : withoutPlayerAdp(player)
          )
        : [],
    [adpAvailable, boardReady, snapshot]
  );

  const simulationAvailable = boardReady && boardStaleness !== "stale";
  const room = useMockDraftState(board, scoringSelection, simulationAvailable);
  const { state, availablePlayers, currentPick } = room;
  const settings = state.settings;
  const totalPicks = settings.totalTeams * settings.rounds;
  const currentRound = Math.min(settings.rounds, Math.ceil(currentPick / settings.totalTeams));

  const showSetup = state.status === "setup" || roomSetupOpen;
  const isLive = !showSetup && state.status === "on-clock";
  const isRecap = !showSetup && state.status === "complete";

  const userPicks = useMemo(
    () => state.picks.filter((pick) => pick.teamNumber === settings.userTeam),
    [settings.userTeam, state.picks]
  );
  const hasUserPick = userPicks.length > 0;

  const picksSinceUserTurn = useMemo(() => {
    let lastUserIndex = -1;
    for (let index = state.picks.length - 1; index >= 0; index -= 1) {
      if (state.picks[index].teamNumber === settings.userTeam) {
        lastUserIndex = index;
        break;
      }
    }
    return state.picks.slice(lastUserIndex + 1);
  }, [settings.userTeam, state.picks]);
  const tapePicks = useMemo(
    () => picksSinceUserTurn.slice(-TAPE_LENGTH).reverse(),
    [picksSinceUserTurn]
  );

  const lineupAssignment = useMemo(
    () =>
      assignLineupSlots(
        settings.lineup,
        userPicks.map((pick) => pick.player)
      ),
    [settings.lineup, userPicks]
  );

  // --- quick picks: the template's "Best left / Fills X / Value" shortcuts ---
  const quickPicks = useMemo(() => {
    if (!isLive || !simulationAvailable || availablePlayers.length === 0) return [];
    const used = new Set<string>();
    const picks: { key: string; tag: string; player: Player; sub: string; title: string }[] = [];
    const describe = (player: Player) => {
      const rank = formatRankValue(player.rankEcr ?? player.averageRank);
      const tier = Number.isFinite(player.tier) ? ` · T${player.tier}` : "";
      return `#${rank}${tier} · ${player.position}`;
    };

    const best = availablePlayers[0];
    used.add(best.id);
    picks.push({
      key: "best",
      tag: "Best left",
      player: best,
      sub: describe(best),
      title: `Top of the remaining board: ${best.name}`,
    });

    const needOrder = ["RB", "WR", "TE", "QB", "K", "DST"].filter(
      (position) => lineupAssignment.openExact[position]
    );
    let fill: Player | undefined;
    let fillSlot = "";
    for (const position of needOrder) {
      fill = availablePlayers.find(
        (player) => player.position === position && !used.has(player.id)
      );
      if (fill) {
        const lineupCount = settings.lineup[position as keyof RedraftLineupSettings] || 0;
        fillSlot = `${position}${lineupCount - (lineupAssignment.openExact[position] ?? 0) + 1}`;
        break;
      }
    }
    if (!fill && lineupAssignment.flexOpen) {
      fill = availablePlayers.find(
        (player) => FLEX_POSITIONS.has(player.position) && !used.has(player.id)
      );
      fillSlot = "FLX";
    }
    if (fill) {
      used.add(fill.id);
      picks.push({
        key: "fill",
        tag: `Fills ${fillSlot}`,
        player: fill,
        sub: describe(fill),
        title: `Best fit for your open ${fillSlot} spot: ${fill.name}`,
      });
    }

    if (adpAvailable) {
      let value: Player | undefined;
      let valueDelta = 0;
      for (const player of availablePlayers.slice(0, 40)) {
        if (used.has(player.id)) continue;
        if (!isPlayerValueAtPick(player, currentPick, currentRound)) continue;
        const delta = currentPick - (player.adp as number);
        if (delta > valueDelta) {
          valueDelta = delta;
          value = player;
        }
      }
      if (value) {
        picks.push({
          key: "value",
          tag: "Value",
          player: value,
          sub: `${formatPickDelta(valueDelta)} past ADP · ${value.position}`,
          title: `${value.name} usually goes about ${Math.round(valueDelta)} picks earlier`,
        });
      }
    }
    return picks;
  }, [
    adpAvailable,
    availablePlayers,
    currentPick,
    currentRound,
    isLive,
    lineupAssignment,
    settings.lineup,
    simulationAvailable,
  ]);

  // --- the live board, filtered then grouped into tier plates ---
  const filteredAvailable = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availablePlayers.filter((player) => {
      if (positionFilter === "FLEX") {
        if (!FLEX_POSITIONS.has(player.position)) return false;
      } else if (positionFilter !== "ALL" && player.position !== positionFilter) {
        return false;
      }
      if (!query) return true;
      return (
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query)
      );
    });
  }, [availablePlayers, positionFilter, searchQuery]);
  const windowedPlayers = useMemo(
    () => filteredAvailable.slice(0, VISIBLE_BOARD_ROWS),
    [filteredAvailable]
  );
  const tierGroups = useMemo(() => {
    const groups: { tier: number | null; rows: Player[] }[] = [];
    for (const { player, tier, startsTier } of withTierBreaks(windowedPlayers)) {
      const current = groups[groups.length - 1];
      if (!current || startsTier || (tier === null) !== (current.tier === null)) {
        groups.push({ tier, rows: [player] });
      } else {
        current.rows.push(player);
      }
    }
    return groups;
  }, [windowedPlayers]);

  // --- recap: pick judgments against the shared ADP-or-consensus baseline ---
  const recap = useMemo(() => {
    const judged = userPicks
      .map((pick) => ({ pick, delta: getPickDelta(pick) }))
      .filter((entry): entry is { pick: DraftPick; delta: number } => entry.delta !== null);
    const total = judged.reduce((sum, entry) => sum + entry.delta, 0);
    const average = judged.length > 0 ? total / judged.length : null;
    const grade =
      average === null
        ? null
        : average >= 3
          ? "A"
          : average >= 1.5
            ? "A−"
            : average >= 0.5
              ? "B+"
              : average >= -0.5
                ? "B"
                : average >= -2
                  ? "B−"
                  : "C+";
    const bestPick = judged.slice().sort((a, b) => b.delta - a.delta)[0] ?? null;
    let biggestReach: { pick: DraftPick; delta: number } | null = null;
    for (const pick of state.picks) {
      if (classifyPickValue(pick) !== "reach") continue;
      const delta = getPickDelta(pick);
      if (delta !== null && (!biggestReach || delta < biggestReach.delta)) {
        biggestReach = { pick, delta };
      }
    }
    const shapeCounts: Partial<Record<string, number>> = {};
    for (const pick of userPicks) {
      shapeCounts[pick.player.position] = (shapeCounts[pick.player.position] ?? 0) + 1;
    }
    const shape = ["RB", "WR", "TE", "QB", "K", "DST"]
      .filter((position) => shapeCounts[position])
      .map((position) => `${shapeCounts[position]}${position}`)
      .join(" · ");
    return { judged, total, grade, bestPick, biggestReach, shape };
  }, [state.picks, userPicks]);

  const gridRows = useMemo(() => {
    if (!isRecap) return [];
    const byNumber = new Map(state.picks.map((pick) => [pick.pickNumber, pick]));
    const teams = settings.totalTeams;
    return Array.from({ length: settings.rounds }, (_, roundIndex) => {
      const round = roundIndex + 1;
      return {
        round,
        cells: Array.from({ length: teams }, (_, slotIndex) => {
          const slot = slotIndex + 1;
          const pickNumber =
            settings.draftType === "snake" && round % 2 === 0
              ? round * teams - slot + 1
              : (round - 1) * teams + slot;
          return { slot, pickNumber, pick: byNumber.get(pickNumber) ?? null };
        }),
      };
    });
  }, [isRecap, settings.draftType, settings.rounds, settings.totalTeams, state.picks]);

  const openSetup = () => {
    setSetupForm({
      totalTeams: settings.totalTeams,
      slot: settings.userTeam,
      rounds: settings.rounds,
      draftType: settings.draftType,
      temper: settings.temper,
      lineup: settings.lineup,
    });
    setRoomSetupOpen(true);
  };

  const startRoom = () => {
    const slot =
      setupForm.slot === 0
        ? 1 + Math.floor(Math.random() * setupForm.totalTeams)
        : Math.min(setupForm.slot, setupForm.totalTeams);
    room.startDraft({
      totalTeams: setupForm.totalTeams,
      rounds: setupForm.rounds,
      userTeam: slot,
      scoringFormat: scoringSelection,
      draftType: setupForm.draftType,
      temper: setupForm.temper,
      lineup: setupForm.lineup,
    });
    setRoomSetupOpen(false);
    setSearchQuery("");
    setPositionFilter("ALL");
  };

  const draftPlayer = (player: Player) => {
    if (!room.makeUserPick(player)) return;
    setSearchQuery("");
    // The clicked control leaves the DOM with the pick, so move focus to the
    // on-the-clock panel rather than letting it fall back to the document.
    onClockRef.current?.focus();
  };

  const scoringLabel = FANTASY_SCORING_LABELS[routeScoring];
  const kicker = showSetup
    ? "Mock room · Setup"
    : isRecap
      ? "Mock room · Recap"
      : `Mock room · Live · Pick #${currentPick}`;

  const chipSettings = state.status === "setup"
    ? {
        teams: setupForm.totalTeams,
        draftType: setupForm.draftType,
        rounds: setupForm.rounds,
      }
    : { teams: settings.totalTeams, draftType: settings.draftType, rounds: settings.rounds };
  const headerChips: { label: string; tone?: CSSProperties }[] = [
    ...(state.status !== "setup" ? [{ label: `Room #${roomLabel(state.seed)}` }] : []),
    { label: `${chipSettings.teams}-team ${chipSettings.draftType}` },
    { label: `${scoringLabel} scoring` },
    { label: `${chipSettings.rounds}-round rep` },
    ...(boardReady
      ? [
          {
            label: `Board ${getSnapshotStalenessLabel(boardStaleness)} · ${formatUpdatedAt(boardUpdatedAt)}`,
            tone: boardStaleness === "stale" ? WARNING_CHIP_TONE : undefined,
          },
        ]
      : []),
    ...(boardReady && !adpAvailable
      ? [{ label: adpStatusLabel, tone: WARNING_CHIP_TONE }]
      : []),
  ];

  const boardStatusLine = error
    ? "The published rankings snapshot failed to load."
    : isLoading || !snapshotMatches
      ? "Loading the rankings board."
    : !boardReady
      ? "The published snapshot did not include any players."
      : !simulationAvailable
        ? "The ranking source is stale, so simulated picks are paused until the published board refreshes."
      : null;

  // Four different conditions gate simulationAvailable, so a paused room names
  // the one that actually applies (boardStatusLine above) and then the recovery
  // that is actually available. Refetching only helps when a request is not
  // already in flight and the board itself is the problem.
  const boardReloadable = !boardReady && (Boolean(error) || (!isLoading && snapshotMatches));
  const pauseRecovery = !boardReady
    ? boardReloadable
      ? "Your picks stay saved, and simulated picks resume once the board loads."
      : "Your picks stay saved, and simulated picks resume once the board arrives."
    : "Your picks stay saved, and nothing here is lost while you wait.";

  // The pick loop re-renders the board and the quick picks with no other signal
  // that a pick landed, so a screen reader gets the outcome and the next turn.
  const lastUserPick = userPicks.length > 0 ? userPicks[userPicks.length - 1] : null;
  const draftAnnouncement = useMemo(() => {
    if (showSetup) return "";
    if (isRecap) return "The room is finished. The value report and the board are below.";
    if (!lastUserPick) return "";
    const roomPicks = picksSinceUserTurn.length;
    return `You drafted ${lastUserPick.player.name} at pick #${lastUserPick.pickNumber}. ${roomPicks} room pick${
      roomPicks === 1 ? "" : "s"
    } since. You are on the clock at pick #${currentPick}, round ${currentRound} of ${settings.rounds}.`;
  }, [
    currentPick,
    currentRound,
    isRecap,
    lastUserPick,
    picksSinceUserTurn.length,
    settings.rounds,
    showSetup,
  ]);

  const footerLinks = (
    <span className="inline-flex gap-4">
      <Link href="/fantasy-football" className="inline-flex min-h-touch items-center text-sm font-semibold no-underline">
        Rankings board <span aria-hidden="true">↗</span>
      </Link>
      <Link href="/fantasy-football/draft-tracker" className="inline-flex min-h-touch items-center text-sm font-semibold no-underline">
        Draft tracker <span aria-hidden="true">↗</span>
      </Link>
    </span>
  );

  interface FasciaCell {
    key: string;
    label: string;
    value: string;
    sub: string;
    valueColor?: string;
    background?: string;
  }

  const fasciaCells: FasciaCell[] = [
    {
      key: "pick",
      label: "Pick",
      value: `#${currentPick} / ${totalPicks}`,
      sub: `Round ${currentRound} of ${settings.rounds}`,
    },
    {
      key: "clock",
      label: "On the clock",
      value: "You",
      sub: `slot ${settings.userTeam} of ${settings.totalTeams} · ${settings.draftType}`,
      // Signal mixed toward ink clears 4.5:1 on the signal wash in both themes.
      valueColor: "color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))",
      background: "color-mix(in srgb, var(--home-signal) 8%, var(--home-paper))",
    },
    {
      key: "between",
      label: "Between turns",
      value: `${picksSinceUserTurn.length} room pick${picksSinceUserTurn.length === 1 ? "" : "s"}`,
      sub: hasUserPick ? "since your last · tape below" : "before your first turn",
    },
    {
      key: "pool",
      label: "Pool",
      value: `${availablePlayers.length} left`,
      sub: `of ${board.length} ranked`,
    },
  ];

  // The simulator drafts off the preseason board, so once the season starts it is
  // rehearsing a market that no longer exists. Name the season rather than letting
  // it read as current.
  const seasonalWeek = getNflRegularSeasonWeek(metadata?.season ?? 0);

  return (
    <section
      className="home-page home-dash min-h-screen"
      aria-label="Fantasy football mock draft"
      data-testid="fantasy-mock-draft-shell"
    >
      <header
        className={`${SHELL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 pb-3.5 pt-7`}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <span
            className="inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.1em]"
            style={{ color: "var(--home-ink-muted)" }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--home-signal)" }}
              aria-hidden="true"
            />
            {kicker}
          </span>
          <h1
            className="m-0 font-semibold leading-none"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.125rem)", letterSpacing: "-0.05em" }}
          >
            Mock{" "}
            <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 500 }}>
              Draft
            </em>
          </h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {headerChips.map((chip) => (
            <span
              key={chip.label}
              className={HEADER_CHIP_CLASS}
              style={
                chip.tone ?? {
                  borderColor: "var(--home-rule)",
                  background: "var(--home-paper-alt)",
                  color: "var(--home-ink-muted)",
                }
              }
            >
              {chip.label}
            </span>
          ))}
        </div>
      </header>

      <p role="status" aria-live="polite" className="sr-only">
        {draftAnnouncement}
      </p>

        {seasonalWeek >= 1 ? (
          <SeasonalScopeNote season={metadata?.season ?? 0} week={seasonalWeek}>
            The room drafts off the preseason consensus board, which stops refreshing once real
            games start, so rehearsing a draft here in November rehearses August. I have left it
            running rather than hiding it, because the practice is still practice. Ranks that
            still move are on the <Link href="/fantasy-football/weekly" className="underline decoration-[var(--home-signal)] underline-offset-4">weekly board</Link>.
          </SeasonalScopeNote>
        ) : null}

      {showSetup && (
        <div className="mx-auto w-full max-w-[780px] px-[clamp(1rem,4vw,2.5rem)] pb-12 pt-1">
          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-raised)" }}
          >
            <div
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b px-4 py-3.5"
              style={{ borderColor: "var(--home-rule)" }}
            >
              <div className="min-w-0">
                <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--home-ink-muted)" }}>
                  Room setup
                </p>
                <h2 className="m-0 mt-1 text-xl font-semibold tracking-[-0.04em]">
                  Rep the rounds that decide leagues.
                </h2>
              </div>
              {roomSetupOpen && state.status !== "setup" && (
                <button
                  type="button"
                  onClick={() => setRoomSetupOpen(false)}
                  className={PILL_BUTTON_CLASS}
                  style={PILL_BUTTON_STYLE}
                >
                  Back to room <span aria-hidden="true">→</span>
                </button>
              )}
            </div>

            <div
              className="grid gap-x-4 gap-y-3.5 px-4 py-4"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}
            >
              <label className="grid content-start gap-1.5">
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  Teams
                </span>
                <select
                  value={setupForm.totalTeams}
                  onChange={(event) => {
                    const totalTeams = Number(event.target.value);
                    setSetupForm((form) => ({
                      ...form,
                      totalTeams,
                      slot: form.slot === 0 ? 0 : Math.min(form.slot, totalTeams),
                    }));
                  }}
                  className="min-h-touch rounded border px-2.5 font-mono text-xs"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "var(--home-paper)",
                    color: "var(--home-ink)",
                  }}
                >
                  {TEAM_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} teams
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid content-start gap-1.5">
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  Your slot
                </span>
                <select
                  value={setupForm.slot}
                  onChange={(event) =>
                    setSetupForm((form) => ({ ...form, slot: Number(event.target.value) }))
                  }
                  className="min-h-touch rounded border px-2.5 font-mono text-xs"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "var(--home-paper)",
                    color: "var(--home-ink)",
                  }}
                >
                  <option value={0}>Random slot</option>
                  {Array.from({ length: setupForm.totalTeams }, (_, index) => index + 1).map(
                    (slot) => (
                      <option key={slot} value={slot}>
                        Pick {slot}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="grid content-start gap-1.5">
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  Rounds · early rep
                </span>
                <select
                  value={setupForm.rounds}
                  onChange={(event) =>
                    setSetupForm((form) => ({ ...form, rounds: Number(event.target.value) }))
                  }
                  className="min-h-touch rounded border px-2.5 font-mono text-xs"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "var(--home-paper)",
                    color: "var(--home-ink)",
                  }}
                >
                  {ROUND_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} rounds
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid content-start gap-1.5">
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  Scoring
                </span>
                <SegmentedButtons
                  options={SCORING_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={scoringSelection}
                  onSelect={setScoringSelection}
                />
              </div>

              <div className="grid content-start gap-1.5">
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  Draft order
                </span>
                <SegmentedButtons
                  options={ORDER_OPTIONS}
                  value={setupForm.draftType}
                  onSelect={(draftType) => setSetupForm((form) => ({ ...form, draftType }))}
                />
              </div>

              <div className="grid content-start gap-1.5">
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                  Room temper
                </span>
                <SegmentedButtons
                  options={TEMPER_OPTIONS}
                  value={setupForm.temper}
                  onSelect={(temper) => setSetupForm((form) => ({ ...form, temper }))}
                />
                <p className="m-0 font-mono text-3xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                  {TEMPER_NOTES[setupForm.temper]}
                </p>
              </div>
            </div>

            <div className="px-4 pb-4">
              <p className={`m-0 mb-2 ${MONO_LABEL_CLASS}`} style={{ color: "var(--home-ink-muted)" }}>
                Starting lineup
              </p>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}
              >
                {REDRAFT_LINEUP_PRESETS.map((preset) => {
                  const active = sameLineup(preset.lineup, setupForm.lineup);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setSetupForm((form) => ({ ...form, lineup: { ...preset.lineup } }))
                      }
                      className="min-h-[56px] rounded border px-3 py-2 text-left"
                      style={
                        active
                          ? {
                              borderColor: "var(--home-ink)",
                              background: "var(--home-ink)",
                              color: "var(--home-paper)",
                            }
                          : {
                              borderColor: "var(--home-rule)",
                              background: "var(--home-paper)",
                              color: "var(--home-ink)",
                            }
                      }
                    >
                      <span className="block text-sm font-semibold tracking-[-0.01em]">
                        {preset.label}
                      </span>
                      <span
                        className="mt-0.5 block font-mono text-3xs tracking-[0.04em]"
                        style={{
                          color: active
                            ? "color-mix(in srgb, var(--home-paper) 75%, transparent)"
                            : "var(--home-ink-muted)",
                        }}
                      >
                        {lineupShort(preset.lineup)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-t px-4 py-3.5"
              style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
            >
              <p className="m-0 font-mono text-2xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                {`${setupForm.totalTeams}-team ${setupForm.draftType} · ${
                  setupForm.slot === 0 ? "random slot" : `slot ${setupForm.slot}`
                } · ${setupForm.rounds}-round rep · ${scoringLabel} · ${lineupShort(setupForm.lineup)}`}
              </p>
              <button
                type="button"
                onClick={startRoom}
                disabled={!simulationAvailable}
                className={SOLID_BUTTON_CLASS}
                style={SOLID_BUTTON_STYLE}
              >
                Start mock
              </button>
            </div>
          </div>

          {boardStatusLine && (
            <p
              role="status"
              aria-live="polite"
              className="mx-0.5 mt-3.5 text-sm leading-6"
              style={{ color: "var(--home-ink-muted)" }}
            >
              {boardStatusLine}
              {error && (
                <button
                  type="button"
                  onClick={retry}
                  className="ml-2 inline-flex min-h-touch items-center font-semibold underline"
                >
                  Retry
                </button>
              )}
            </p>
          )}
          <p className="mx-0.5 mt-3.5 font-mono text-2xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
            The room drafts around you, so you are on the clock every turn. Each run is a fresh
            seeded room with the same settings, and nothing here is a projection of season
            outcomes.
          </p>
        </div>
      )}

      {isLive && (
        <>
          <section
            aria-label="Live mock draft status"
            className={`sticky ${FASCIA_TOP_CLASS} z-30 border-y`}
            style={{
              borderColor: "var(--home-rule)",
              background: "color-mix(in srgb, var(--home-paper) 90%, transparent)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div className={SHELL_CLASS}>
              <div
                className="grid gap-px border-x"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(148px, 30vw), 1fr))",
                  background: "var(--home-rule)",
                  borderColor: "var(--home-rule)",
                }}
              >
                {fasciaCells.map((cell) => (
                  <div
                    key={cell.key}
                    className="min-w-0 px-3 py-2"
                    style={{ background: cell.background ?? "var(--home-paper)" }}
                  >
                    <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--home-ink-muted)" }}>
                      {cell.label}
                    </p>
                    <p
                      className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-lg leading-tight tabular-nums"
                      style={{ color: cell.valueColor ?? "var(--home-ink)" }}
                    >
                      {cell.value}
                    </p>
                    <p
                      className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-3xs"
                      style={{ color: "var(--home-ink-muted)" }}
                    >
                      {cell.sub}
                    </p>
                  </div>
                ))}
                <div
                  className="flex min-w-0 flex-wrap content-center items-center gap-1.5 px-3 py-2"
                  style={{ background: "var(--home-paper)" }}
                >
                  <button
                    type="button"
                    onClick={() => room.undoUserPick()}
                    disabled={!hasUserPick}
                    aria-label={hasUserPick ? "Take back your last pick" : "Take back (no picks yet)"}
                    className={PILL_BUTTON_CLASS}
                    style={PILL_BUTTON_STYLE}
                  >
                    ↶ Take back
                  </button>
                  {/*
                    Take back is reversible and this is not, so it does not wear
                    the same quiet pill: the warning tone and the accessible name
                    both say the room ends here.
                  */}
                  <button
                    type="button"
                    onClick={() => room.simToEnd()}
                    disabled={!simulationAvailable}
                    aria-label="Sim to end, which finishes the room with no take back"
                    title="The engine finishes every remaining pick, including yours, and the room goes straight to the recap. Nothing takes that back."
                    className={PILL_BUTTON_CLASS}
                    style={{ ...PILL_BUTTON_STYLE, ...WARNING_CARD_STYLE }}
                  >
                    Sim to end <span aria-hidden="true">⇥</span>
                  </button>
                  <button
                    type="button"
                    onClick={openSetup}
                    className={PILL_BUTTON_CLASS}
                    style={{ ...PILL_BUTTON_STYLE, color: "var(--home-ink-muted)" }}
                  >
                    New mock
                  </button>
                </div>
              </div>
            </div>
          </section>

          {!simulationAvailable && (
            <div className={`${SHELL_CLASS} pt-2.5`}>
              <div
                role="alert"
                className="rounded border px-3.5 py-2.5 text-sm leading-6"
                style={WARNING_CARD_STYLE}
              >
                {boardStatusLine} {pauseRecovery}
                {boardReloadable && (
                  <button
                    type="button"
                    onClick={retry}
                    className="ml-2 inline-flex min-h-touch items-center font-semibold underline"
                  >
                    Reload the board
                  </button>
                )}
              </div>
            </div>
          )}

          {tapePicks.length > 0 && (
            <div
              aria-label="Room picks since your last turn"
              className={`${SHELL_CLASS} flex items-center gap-2 overflow-x-auto pt-2.5`}
            >
              <span className={`${MONO_LABEL_CLASS} flex-none`} style={{ color: "var(--home-ink-muted)" }}>
                Since your last pick
              </span>
              {tapePicks.map((pick) => (
                <span
                  key={`tape-${pick.pickNumber}`}
                  className="inline-flex flex-none items-baseline gap-1.5 rounded-[2px] border px-2 py-0.5 font-mono text-2xs"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "var(--home-paper-raised)",
                    color: "var(--home-ink)",
                  }}
                >
                  <span style={{ color: "var(--home-ink-muted)" }}>#{pick.pickNumber}</span>
                  <span className="font-sans text-xs font-semibold tracking-[-0.01em]">
                    {shortName(pick.player)}
                  </span>
                  <span style={{ color: "var(--home-ink-muted)" }}>
                    {pick.player.position} · S{pick.teamNumber}
                  </span>
                </span>
              ))}
            </div>
          )}

          <section
            aria-label="Your roster"
            className={`${SHELL_CLASS} flex flex-wrap items-center gap-1.5 pt-2.5`}
          >
            <span className={`${MONO_LABEL_CLASS} flex-none`} style={{ color: "var(--home-ink-muted)" }}>
              Your roster
            </span>
            {lineupAssignment.slots.map((slot, index) => (
              <span
                key={`slot-${slot.slot}-${index}`}
                className="inline-flex items-baseline gap-1.5 rounded-[2px] border px-1.5 py-0.5 font-mono text-3xs uppercase tracking-[0.06em]"
                style={
                  slot.player
                    ? {
                        borderStyle: "solid",
                        borderColor: "var(--home-rule)",
                        background: "var(--home-paper-raised)",
                        color: "var(--home-ink-muted)",
                      }
                    : {
                        borderStyle: "dashed",
                        borderColor: "color-mix(in srgb, var(--home-rule) 80%, transparent)",
                        background: "transparent",
                        color: "var(--home-ink-muted)",
                      }
                }
              >
                {slot.slot}
                {slot.player ? (
                  <span
                    className="font-sans text-xs font-semibold normal-case tracking-[-0.01em]"
                    style={{ color: "var(--home-ink)" }}
                  >
                    {shortName(slot.player)}
                  </span>
                ) : (
                  <span className="normal-case">open</span>
                )}
              </span>
            ))}
            {lineupAssignment.bench > 0 && (
              <span className="font-mono text-3xs" style={{ color: "var(--home-ink-muted)" }}>
                +{lineupAssignment.bench} bench
              </span>
            )}
          </section>

          <section
            ref={onClockRef}
            tabIndex={-1}
            aria-label="You are on the clock"
            className={`${SHELL_CLASS} mt-3.5`}
          >
            <div
              className="overflow-hidden rounded-lg border"
              style={{
                borderColor: "color-mix(in srgb, var(--home-signal) 45%, var(--home-rule))",
                background: "color-mix(in srgb, var(--home-signal) 7%, var(--home-paper))",
              }}
            >
              <div
                className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 border-b px-3.5 py-2"
                style={{ borderColor: "color-mix(in srgb, var(--home-signal) 28%, var(--home-rule))" }}
              >
                <span
                  className="inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em]"
                  style={{ color: "color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))" }}
                >
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: "var(--home-signal)" }}
                    aria-hidden="true"
                  />
                  You&apos;re up
                </span>
                <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                  {`Pick #${currentPick} · round ${currentRound} of ${settings.rounds} · the room resumes the moment you draft`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2.5">
                {quickPicks.map((quick) => (
                  <button
                    key={quick.key}
                    type="button"
                    onClick={() => draftPlayer(quick.player)}
                    title={quick.title}
                    className="inline-flex min-h-touch items-center gap-2 rounded-full border px-3.5 font-mono text-2xs"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "var(--home-paper)",
                      color: "var(--home-ink)",
                    }}
                  >
                    <span
                      className="text-3xs uppercase tracking-[0.1em]"
                      style={{ color: "var(--home-signal)" }}
                    >
                      {quick.tag}
                    </span>
                    <span className="font-sans text-xs font-semibold tracking-[-0.01em]">
                      {shortName(quick.player)}
                    </span>
                    <span style={{ color: "var(--home-ink-muted)" }}>{quick.sub}</span>
                  </button>
                ))}
                <span className="font-mono text-3xs" style={{ color: "var(--home-ink-muted)" }}>
                  or draft from the board <span aria-hidden="true">↓</span>
                </span>
              </div>
            </div>
          </section>

          <div className={`${SHELL_CLASS} pb-11 pt-4`}>
            <h2 className="sr-only">Available players</h2>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 pb-3">
              <PositionFilterBar
                ariaLabel="Filter available players by position"
                options={POSITION_FILTER_OPTIONS}
                value={positionFilter}
                onChange={setPositionFilter}
              />
              <label htmlFor="mock-draft-search" className="sr-only">
                Search available players
              </label>
              <input
                id="mock-draft-search"
                name="mock-draft-search"
                value={searchQuery}
                maxLength={80}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoComplete="off"
                placeholder="Search player or team"
                className="min-h-touch w-[190px] rounded-[4px] border px-2.5 font-mono text-xs placeholder:text-[var(--home-ink-muted)]"
                style={{
                  borderColor: "var(--home-rule)",
                  background: "var(--home-paper-raised)",
                  color: "var(--home-ink)",
                }}
              />
              <span
                className="ml-auto whitespace-nowrap font-mono text-2xs"
                style={{ color: "var(--home-ink-muted)" }}
              >
                {filteredAvailable.length} of {availablePlayers.length} available
              </span>
            </div>

            {windowedPlayers.length > 0 && adpAvailable && (
              <div
                aria-hidden="true"
                className={`flex items-center gap-x-3.5 px-3.5 pb-1.5 ${MONO_LABEL_CLASS}`}
                style={{ color: "var(--home-ink-muted)" }}
              >
                <span className="w-[34px]" />
                <span className="min-w-0 flex-1">Player</span>
                <span className="w-11 text-right">ADP</span>
                <span className="w-14 text-right">At #{currentPick}</span>
                <span className="w-[74px]" />
              </div>
            )}

            {tierGroups.map((group, index) => {
              const railTone =
                group.tier !== null
                  ? `color-mix(in srgb, var(--home-signal) ${getTierRailIntensity(group.tier)}%, var(--home-rule))`
                  : "var(--home-rule)";
              let cliff = 0;
              if (index > 0) {
                const previous = tierGroups[index - 1];
                const previousAvg = getConsensusAvg(previous.rows[previous.rows.length - 1]);
                const nextAvg = getConsensusAvg(group.rows[0]);
                if (previousAvg !== null && nextAvg !== null) {
                  cliff = Math.max(0, Number((nextAvg - previousAvg).toFixed(1)));
                }
              }
              const marginTop =
                index === 0 ? 0 : Math.round(Math.min(48, Math.max(14, cliff * 9))) || 18;

              return (
                <section
                  key={`tier-${group.tier ?? "untiered"}-${group.rows[0].id}`}
                  aria-label={
                    group.tier !== null ? `Tier ${group.tier}` : "Players with no published tier"
                  }
                  style={{ marginTop }}
                >
                  {index > 0 && cliff > 0 && (
                    <div aria-hidden="true" className="flex items-center gap-3 px-0.5 pb-2">
                      <span
                        className="flex-1 border-t border-dashed"
                        style={{ borderColor: "color-mix(in srgb, var(--home-ink) 24%, transparent)" }}
                      />
                      <span
                        className="whitespace-nowrap font-mono text-3xs uppercase tracking-[0.12em]"
                        style={{ color: "var(--home-signal)" }}
                      >
                        ↓ {cliff.toFixed(1)} avg-rank cliff
                      </span>
                      <span
                        className="flex-1 border-t border-dashed"
                        style={{ borderColor: "color-mix(in srgb, var(--home-ink) 24%, transparent)" }}
                      />
                    </div>
                  )}
                  <div
                    className="overflow-hidden rounded-lg border border-l-[3px]"
                    style={{
                      borderColor: "var(--home-rule)",
                      borderLeftColor: railTone,
                      background: "var(--home-paper-raised)",
                    }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 px-3.5 pb-1.5 pt-2">
                      <span className="text-2xl font-bold leading-none tracking-[-0.04em] tabular-nums">
                        {group.tier !== null ? String(group.tier).padStart(2, "0") : "—"}
                      </span>
                      <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                        {group.tier !== null ? "Tier" : "No published tier"}
                      </span>
                      <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                        {group.rows.length} left
                      </span>
                      <span className="ml-auto font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                        R{formatRankValue(group.rows[0].rankEcr ?? group.rows[0].averageRank)}–R
                        {formatRankValue(
                          group.rows[group.rows.length - 1].rankEcr ??
                            group.rows[group.rows.length - 1].averageRank
                        )}
                      </span>
                    </div>
                    <ul className="m-0 list-none p-0">
                      {group.rows.map((player) => {
                        const delta = adpAvailable
                          ? deltaAtPick(player, currentPick, currentRound)
                          : null;
                        const positionTone = getPositionTone(player.position);
                        return (
                          <li
                            key={player.id}
                            className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t px-3.5 py-1.5"
                            style={{
                              borderColor: "color-mix(in srgb, var(--home-rule) 60%, transparent)",
                            }}
                          >
                            <span
                              className="w-[34px] shrink-0 text-right font-mono text-sm font-medium"
                              title="Overall board rank"
                            >
                              {formatRankValue(player.rankEcr ?? player.averageRank)}
                            </span>
                            <div className="flex min-w-0 flex-1 basis-44 items-baseline gap-2">
                              <span className="truncate text-sm font-semibold tracking-[-0.02em]">
                                {player.name}
                              </span>
                              <span
                                className="inline-flex shrink-0 items-center rounded-[2px] border px-1.5 py-0.5 font-mono text-3xs tracking-[0.06em]"
                                style={positionTone}
                              >
                                {player.position}
                                {player.positionRank ?? ""}
                              </span>
                              <span
                                className="shrink-0 font-mono text-3xs uppercase tracking-[0.06em]"
                                style={{ color: "var(--home-ink-muted)" }}
                              >
                                {player.team}
                                {player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}
                              </span>
                            </div>
                            <div className="flex flex-none items-center gap-x-3.5">
                              {adpAvailable && (
                                <>
                                  <span
                                    className="w-11 text-right font-mono text-xs"
                                    style={{ color: "var(--home-ink-muted)" }}
                                    title="Average draft position in mock rooms"
                                  >
                                    {formatAdp(player.adp)}
                                  </span>
                                  <span
                                    className="w-14 text-right font-mono text-xs"
                                    style={{ color: delta?.color ?? "var(--home-ink-muted)" }}
                                    title={delta?.title ?? "No reliable market sample for this player"}
                                  >
                                    {delta?.text ?? "—"}
                                  </span>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => draftPlayer(player)}
                                disabled={!simulationAvailable}
                                aria-label={`Draft ${player.name}`}
                                className={SOLID_BUTTON_CLASS}
                                style={SOLID_BUTTON_STYLE}
                              >
                                Draft
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              );
            })}

            {filteredAvailable.length === 0 && (
              <div
                className="rounded-lg border border-dashed px-6 py-8 text-center"
                style={{ borderColor: "var(--home-rule)" }}
              >
                <p className="m-0 mb-3.5 font-mono text-xs" style={{ color: "var(--home-ink-muted)" }}>
                  No available players match on this board.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPositionFilter("ALL");
                  }}
                  className={SOLID_BUTTON_CLASS}
                  style={SOLID_BUTTON_STYLE}
                >
                  Clear search
                </button>
              </div>
            )}
            {filteredAvailable.length > VISIBLE_BOARD_ROWS && (
              <p className="mt-3 font-mono text-3xs" style={{ color: "var(--home-ink-muted)" }}>
                Showing the top {VISIBLE_BOARD_ROWS} of {filteredAvailable.length} available
                players. Search or filter to reach the rest.
              </p>
            )}

            <div
              className="mt-6 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 border-t pt-3.5"
              style={{ borderColor: "var(--home-rule)" }}
            >
              <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                Take a pick back and the same room replays · sim to end finishes the room and
                cannot be taken back · nothing leaves this device
              </span>
              {footerLinks}
            </div>
          </div>
        </>
      )}

      {isRecap && (
        <div className={`${SHELL_CLASS} pb-11 pt-1`}>
          <section
            aria-label="Value report"
            className="mt-2.5 flex flex-wrap overflow-hidden rounded-lg border"
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-raised)" }}
          >
            <div
              className="w-full border-b p-4 sm:w-[200px] sm:border-b-0 sm:border-r"
              style={{
                borderColor: "var(--home-rule)",
                background: "color-mix(in srgb, var(--home-signal) 6%, var(--home-paper))",
              }}
            >
              <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--home-ink-muted)" }}>
                Draft grade
              </p>
              <p
                className="m-0 mt-1.5 text-5xl font-bold leading-none tracking-[-0.05em]"
                style={{ color: "var(--home-signal)" }}
              >
                {recap.grade ?? "—"}
              </p>
              <p className="m-0 mt-2 font-mono text-2xs" style={{ color: "var(--home-ink)" }}>
                {recap.judged.length > 0
                  ? `${formatPickDelta(recap.total)} vs the draft baseline`
                  : "no judged picks"}
              </p>
              <p className="m-0 mt-1 font-mono text-3xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                {recap.judged.length > 0
                  ? `summed pick delta vs the ADP-or-consensus baseline across ${recap.judged.length} of your ${userPicks.length} picks`
                  : "no pick had a market or consensus baseline to score against"}
              </p>
            </div>
            <div
              className="grid min-w-0 flex-1 basis-[340px] gap-px"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                background: "var(--home-rule)",
              }}
            >
              {[
                recap.bestPick
                  ? {
                      label: "Your best pick",
                      value: shortName(recap.bestPick.pick.player),
                      sub: `${formatPickDelta(recap.bestPick.delta)} vs baseline at #${recap.bestPick.pick.pickNumber}`,
                      subColor:
                        classifyPickValue(recap.bestPick.pick) === "steal"
                          ? "var(--home-positive)"
                          : "var(--home-ink-muted)",
                    }
                  : {
                      label: "Your best pick",
                      value: "—",
                      sub: "no judged picks",
                      subColor: "var(--home-ink-muted)",
                    },
                recap.biggestReach
                  ? {
                      label: "Biggest room reach",
                      value: shortName(recap.biggestReach.pick.player),
                      sub: `${
                        recap.biggestReach.pick.teamNumber === settings.userTeam
                          ? "you"
                          : `slot ${recap.biggestReach.pick.teamNumber}`
                      } · ${formatPickDelta(recap.biggestReach.delta)} vs baseline`,
                      subColor: "var(--home-warning)",
                    }
                  : {
                      label: "Biggest room reach",
                      value: "None",
                      sub: "no pick cleared the reach threshold",
                      subColor: "var(--home-ink-muted)",
                    },
                {
                  label: "Your shape",
                  value: recap.shape || "—",
                  sub: `${userPicks.length} picks · ${
                    lineupAssignment.bench > 0
                      ? `${lineupAssignment.bench} to bench`
                      : "all starters"
                  }`,
                  subColor: "var(--home-ink-muted)",
                },
                {
                  label: "Room temper",
                  value: TEMPER_LABELS[settings.temper],
                  sub: `seeded room #${roomLabel(state.seed)}`,
                  subColor: "var(--home-ink-muted)",
                },
              ].map((fact) => (
                <div
                  key={fact.label}
                  className="min-w-0 px-3.5 py-3"
                  style={{ background: "var(--home-paper-raised)" }}
                >
                  <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--home-ink-muted)" }}>
                    {fact.label}
                  </p>
                  <p className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold tracking-[-0.02em]">
                    {fact.value}
                  </p>
                  <p
                    className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-2xs"
                    style={{ color: fact.subColor }}
                  >
                    {fact.sub}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-label="Draft board grid"
            className="mt-3.5 overflow-hidden rounded-lg border"
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-raised)" }}
          >
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 px-3.5 py-2.5">
              <h2 className="m-0 text-base font-semibold tracking-[-0.03em]">The board</h2>
              <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                {`room #${roomLabel(state.seed)} · ${settings.draftType} order · your column outlined`}
              </span>
            </div>
            {/*
              A real table, not a grid of divs. The grid version handed a screen
              reader a flat run of "#3 · RB", "Ja'Marr Chase" with no way to
              tell which round row or team column a pick belonged to — the same
              anti-pattern CompareModal already fixed. table-fixed with a
              colgroup keeps the team columns equal the way minmax(88px, 1fr)
              did, and the table's own min-width carries the 88px floor.
            */}
            <div
              className="overflow-x-auto"
              role="region"
              tabIndex={0}
              aria-label="Draft board, scrolls horizontally"
            >
              <table
                className="w-full table-fixed border-collapse border-t"
                style={{
                  borderColor: "var(--home-rule)",
                  minWidth: `${34 + 88 * settings.totalTeams}px`,
                }}
              >
                <colgroup>
                  <col style={{ width: "34px" }} />
                  {Array.from({ length: settings.totalTeams }, (_, index) => (
                    <col
                      key={`col-${index + 1}`}
                      style={{ width: `calc((100% - 34px) / ${settings.totalTeams})` }}
                    />
                  ))}
                </colgroup>
                <caption className="sr-only">
                  Every pick by round and draft slot. Rounds run down, draft slots run across, and
                  your slot's column is outlined.
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="border-t p-0" style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}>
                      <span className="sr-only">Round</span>
                    </th>
                    {Array.from({ length: settings.totalTeams }, (_, index) => {
                      const slot = index + 1;
                      const isUser = slot === settings.userTeam;
                      return (
                        <th
                          key={`hdr-${slot}`}
                          scope="col"
                          aria-label={isUser ? "Your slot" : `Slot ${slot}`}
                          className="whitespace-nowrap border-l border-t px-2 py-1.5 text-center font-mono text-3xs font-normal uppercase tracking-[0.1em]"
                          style={{
                            borderColor: "var(--home-rule)",
                            background: isUser
                              ? "color-mix(in srgb, var(--home-signal) 10%, var(--home-paper))"
                              : "var(--home-paper)",
                            color: isUser
                              ? "color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))"
                              : "var(--home-ink-muted)",
                          }}
                        >
                          {isUser ? "You" : `S${slot}`}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {gridRows.map((row) => (
                    <tr key={`round-${row.round}`}>
                      <th
                        scope="row"
                        aria-label={`Round ${row.round}`}
                        className="border-t text-center align-middle font-mono text-3xs font-normal tracking-[0.08em]"
                        style={{
                          borderColor: "var(--home-rule)",
                          background: "var(--home-paper)",
                          color: "var(--home-ink-muted)",
                        }}
                      >
                        R{row.round}
                      </th>
                      {row.cells.map((cell) => (
                        <td
                          key={`cell-${cell.pickNumber}`}
                          className="min-w-0 border-l border-t px-2 py-1.5 align-top"
                          style={{
                            borderColor: "var(--home-rule)",
                            background: cell.pick
                              ? (getPositionTone(cell.pick.player.position).background as string)
                              : "var(--home-paper)",
                            boxShadow:
                              cell.slot === settings.userTeam
                                ? "inset 0 0 0 1px color-mix(in srgb, var(--home-signal) 55%, transparent)"
                                : undefined,
                          }}
                        >
                          <p
                            className="m-0 font-mono text-3xs tracking-[0.04em]"
                            style={{ color: "var(--home-ink-muted)" }}
                          >
                            #{cell.pickNumber} · {cell.pick?.player.position ?? "—"}
                          </p>
                          <p
                            className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold tracking-[-0.01em]"
                            style={{ color: cell.pick ? "var(--home-ink)" : "var(--home-ink-muted)" }}
                          >
                            {cell.pick ? shortName(cell.pick.player) : "—"}
                          </p>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5" aria-label="Your haul">
            <span className={`${MONO_LABEL_CLASS} flex-none`} style={{ color: "var(--home-ink-muted)" }}>
              Your haul
            </span>
            {userPicks.map((pick) => {
              const delta = getPickDelta(pick);
              const verdict = classifyPickValue(pick);
              return (
                <span
                  key={`haul-${pick.pickNumber}`}
                  className="inline-flex items-baseline gap-1.5 rounded-[2px] border px-2 py-0.5 font-mono text-2xs"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "var(--home-paper-raised)",
                    color: "var(--home-ink)",
                  }}
                >
                  <span style={{ color: "var(--home-ink-muted)" }}>#{pick.pickNumber}</span>
                  <span className="font-sans text-xs font-semibold tracking-[-0.01em]">
                    {shortName(pick.player)}
                  </span>
                  {delta !== null && (
                    <span
                      style={{
                        color:
                          verdict === "steal"
                            ? "var(--home-positive)"
                            : verdict === "reach"
                              ? "var(--home-warning)"
                              : "var(--home-ink-muted)",
                      }}
                    >
                      {formatPickDelta(delta)}
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {!simulationAvailable && (
            <p
              id="mock-rerun-blocked"
              role="status"
              className="m-0 mt-4 rounded border px-3.5 py-2.5 text-sm leading-6"
              style={WARNING_CARD_STYLE}
            >
              {boardStatusLine} Run it back turns back on once the published board is ready, and
              this recap stays exactly as it is.
              {boardReloadable && (
                <button
                  type="button"
                  onClick={retry}
                  className="ml-2 inline-flex min-h-touch items-center font-semibold underline"
                >
                  Reload the board
                </button>
              )}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => room.startDraft(settings)}
              disabled={!simulationAvailable}
              aria-describedby={simulationAvailable ? undefined : "mock-rerun-blocked"}
              className={SOLID_BUTTON_CLASS}
              style={SOLID_BUTTON_STYLE}
            >
              Run it back <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={openSetup}
              className={PILL_BUTTON_CLASS}
              style={PILL_BUTTON_STYLE}
            >
              Change setup
            </button>
            <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              same settings, fresh room · grades score every pick against the same baseline
            </span>
          </div>

          <div
            className="mt-6 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 border-t pt-3.5"
            style={{ borderColor: "var(--home-rule)" }}
          >
            <span className="font-mono text-2xs" style={{ color: "var(--home-ink-muted)" }}>
              Practice reps, not predictions · rooms stay on this device
            </span>
            {footerLinks}
          </div>
        </div>
      )}
    </section>
  );
}
