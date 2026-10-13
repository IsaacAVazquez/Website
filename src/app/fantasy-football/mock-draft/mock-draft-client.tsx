"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import { FreshnessParts } from "@/components/fantasy/FantasyRouteHeader";
import {
  DraftLastPicks,
  DraftPickGrid,
  DraftRoster,
  DraftScorebug,
  DraftScorebugCell,
} from "@/components/fantasy/DraftRoomParts";
import { positionClass } from "@/components/fantasy/positionClass";
import type { DraftPick, Player, RedraftLineupSettings, ScoringFormat } from "@/types";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { readBrowserStorageString, readValidatedBrowserStorage } from "@/lib/browserStorage";
import { FANTASY_SCORING_LABELS, scoringFormatToRouteScoring } from "@/lib/fantasy";
import {
  SHELL_CLASS,
  assignLineupSlots,
  canPracticeWithArchivedDraftBoard,
  formatAdp,
  formatPickDelta,
  formatRankValue,
  getConsensusAvg,
  getFantasyAdpFreshness,
  getNflRegularSeasonWeek,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  hasReliableAdpSample,
  shortName,
  withTierBreaks,
  withoutPlayerAdp,
} from "@/lib/fantasyUtils";
import { classifyPickValue, getPickDelta, isPlayerValueAtPick } from "@/lib/draftAnalytics";
import { REDRAFT_LINEUP_PRESETS, sameRedraftLineup } from "@/lib/redraftLineup";
import {
  PositionFilterBar,
  type PositionFilterOption,
} from "@/components/fantasy/PositionFilterBar";
import type { MockDraftTemper } from "@/lib/mockDraft";
import { calculateDraftOrder } from "@/app/fantasy-football/draft-tracker/hooks/useDraftState";
import {
  DEFAULT_MOCK_DRAFT_SETTINGS,
  getMockDraftStorageKey,
  useMockDraftState,
} from "./hooks/useMockDraftState";
import "@/components/fantasy/fantasy-mock.css";

/**
 * The page's orienting sentence. Static on purpose, and worded to hold whether
 * or not the ADP is in use, so it never swaps when the snapshot loads. The
 * setup head prints it as the lede, and a running room prints it as the page's
 * last line, since the running head is one compact line.
 */
const LEAD =
  "A seeded practice room for rehearsing a draft, where the simulated teams pick from the published consensus board, and from market ADP when a current sample is published.";

/**
 * Date-only stamp pinned to UTC, so the board and ADP dates in the freshness
 * line and the scope note match the upstream's own date in every zone instead
 * of drifting a day for viewers west of UTC.
 */
function formatStampDate(timestamp: string | null | undefined): string {
  if (!timestamp) return "undated";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "undated";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

/** Which control opened or restored the current turn, for the live region. */
type RoomTransition = "open" | "rerun" | "undo" | null;

/** `shortLabel` is what a phone prints, where the full names do not fit a third of a field. */
const SCORING_OPTIONS: { value: ScoringFormat; label: string; shortLabel?: string }[] = [
  { value: "PPR", label: "PPR" },
  { value: "HALF_PPR", label: "Half PPR", shortLabel: "Half" },
  { value: "STANDARD", label: "Standard", shortLabel: "Std" },
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

function matchesPosition(player: Player, filter: BoardPositionFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "FLEX") return FLEX_POSITIONS.has(player.position);
  return player.position === filter;
}

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

/**
 * The signed gap between the current pick and a player's market ADP. Strictly
 * market-based: no reliable ADP sample means no reading, matching the live
 * value badge on the draft tracker rather than inventing a number.
 */
function deltaAtPick(
  player: Player,
  pickNumber: number,
  round: number
): { text: string; isValue: boolean; title: string } | null {
  if (typeof player.adp !== "number" || !Number.isFinite(player.adp)) return null;
  if (!hasReliableAdpSample(player)) return null;
  const delta = pickNumber - player.adp;
  const magnitude = Math.abs(Math.round(delta * 10) / 10);
  if (isPlayerValueAtPick(player, pickNumber, round)) {
    return {
      text: formatPickDelta(delta),
      isValue: true,
      title: `Still on the board ${magnitude} picks past his market ADP`,
    };
  }
  return {
    text: formatPickDelta(delta),
    isValue: false,
    title:
      delta < 0
        ? `Rooms usually take him about ${magnitude} picks after #${pickNumber}`
        : `Near his market price at this pick`,
  };
}

/**
 * The kit's segmented switch: aria-pressed buttons in one frame, as wide as
 * the field it sits in. An option with a `shortLabel` prints it on a phone and
 * keeps the long form as its accessible name.
 */
function SegmentedButtons<Value extends string>({
  options,
  value,
  onSelect,
  labelledBy,
}: {
  options: readonly { value: Value; label: string; shortLabel?: string }[];
  value: Value;
  onSelect: (value: Value) => void;
  /** Id of the visible label, so each segment is announced with its group. */
  labelledBy: string;
}) {
  return (
    <div role="group" aria-labelledby={labelledBy} className="ffb-seg ffb-mk-field-seg">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          aria-label={option.shortLabel ? option.label : undefined}
          onClick={() => onSelect(option.value)}
          className="ffb-seg-btn"
        >
          {option.shortLabel ? (
            <>
              <span className="ffb-only-phone">{option.shortLabel}</span>
              <span className="ffb-not-phone">{option.label}</span>
            </>
          ) : (
            option.label
          )}
        </button>
      ))}
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
  const scoringLabelId = useId();
  const orderLabelId = useId();
  const temperLabelId = useId();
  const [setupForm, setSetupForm] = useState<SetupFormState>({
    totalTeams: DEFAULT_MOCK_DRAFT_SETTINGS.totalTeams,
    slot: DEFAULT_MOCK_DRAFT_SETTINGS.userTeam,
    rounds: DEFAULT_MOCK_DRAFT_SETTINGS.rounds,
    draftType: DEFAULT_MOCK_DRAFT_SETTINGS.draftType,
    temper: DEFAULT_MOCK_DRAFT_SETTINGS.temper,
    lineup: DEFAULT_MOCK_DRAFT_SETTINGS.lineup,
  });
  const [roomSetupOpen, setRoomSetupOpen] = useState(false);
  const [archiveConsent, setArchiveConsent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<BoardPositionFilter>("ALL");
  // Every pick unmounts the row or quick pick that took the click, so focus has
  // somewhere stable to land: the panel that owns the next turn.
  const onClockRef = useRef<HTMLElement>(null);
  // The pinned scorebug above the on-the-clock panel is one row on a desktop
  // and two on a phone, so the margin that keeps the panel clear of it when
  // focus() scrolls it into view is read off the bar rather than fixed in CSS.
  const stripRef = useRef<HTMLElement>(null);
  const focusClock = useCallback(() => {
    const panel = onClockRef.current;
    if (!panel) return;
    panel.style.scrollMarginTop = `${stripRef.current?.offsetHeight ?? 0}px`;
    panel.focus();
  }, []);
  // Sim to end unmounts the whole live room, so the recap's value report is
  // the panel that takes focus there.
  const valueReportRef = useRef<HTMLElement>(null);
  // Start mock, Run it back and Sim to end all remove the control that took
  // the click, and the panel that should hold focus next mounts on the
  // following render, so the move waits for that render (see the effect below).
  // New mock and Change setup swap the room for the setup screen, and Back to
  // room swaps it back, so those wait for the next render the same way. Setup
  // lands on its heading, and a room that comes back lands on the scorebug's
  // on-the-clock cell, or on the value report when the room is finished.
  const pendingFocusRef = useRef<"clock" | "recap" | "setup" | "room" | null>(null);
  const setupHeadingRef = useRef<HTMLHeadingElement>(null);
  const onClockCellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLElement>(null);
  // Retry and Reload the board leave the screen once the request is under
  // way, so the effect below watches for the button going and catches the focus.
  const reloadFocusRef = useRef(false);
  const roomIds = useId();
  const [transition, setTransition] = useState<RoomTransition>(null);

  // A persisted room decides which scoring board to fetch, so a saved
  // Standard room resumes onto Standard ranks after a reload. The hook
  // itself refuses to hydrate until the matching board arrives.
  useEffect(() => {
    const saved = readValidatedBrowserStorage<ScoringFormat | null>(
      getMockDraftStorageKey(),
      (value) => {
        const scoring = (value as { settings?: { scoringFormat?: unknown } })?.settings
          ?.scoringFormat;
        return scoring === "PPR" || scoring === "HALF_PPR" || scoring === "STANDARD"
          ? scoring
          : undefined;
      },
      () => null
    ).value;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-mount read of the persisted room's scoring
    if (saved) setScoringSelection(saved);
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

  const archiveEligible = boardReady && boardStaleness === "stale"
    && canPracticeWithArchivedDraftBoard(boardUpdatedAt, metadata?.season);
  const archiveIdentity = `${scoringSelection}:${metadata?.season}:${boardUpdatedAt}`;
  const archivedPractice = archiveEligible && archiveConsent === archiveIdentity;
  const simulationAvailable = boardReady && (boardStaleness !== "stale" || archivedPractice);
  const room = useMockDraftState(board, scoringSelection, simulationAvailable);
  const { state, availablePlayers, currentPick } = room;
  const settings = state.settings;
  // The room writes itself to storage after every pick. When the browser
  // refuses, the room lives in this tab only, and nothing here may say "saved".
  // This runs after the hook's own write, so it reads that write's outcome.
  const [storageBlocked, setStorageBlocked] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the storage layer's status once the room's write has run
    setStorageBlocked(
      readBrowserStorageString(getMockDraftStorageKey()).persistenceStatus === "memory-only"
    );
  }, [state]);
  const totalPicks = settings.totalTeams * settings.rounds;
  const currentRound = Math.min(settings.rounds, Math.ceil(currentPick / settings.totalTeams));

  const showSetup = state.status === "setup" || roomSetupOpen;
  const isLive = !showSetup && state.status === "on-clock";
  const isRecap = !showSetup && state.status === "complete";

  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    if (pending === "clock" && isLive && onClockRef.current) {
      pendingFocusRef.current = null;
      focusClock();
    } else if (pending === "recap" && isRecap && valueReportRef.current) {
      pendingFocusRef.current = null;
      valueReportRef.current.focus();
    } else if (pending === "setup" && showSetup && setupHeadingRef.current) {
      pendingFocusRef.current = null;
      setupHeadingRef.current.focus();
    } else if (pending === "room" && !showSetup) {
      pendingFocusRef.current = null;
      // The cell is pinned, so nothing needs to scroll to show it.
      if (isLive) onClockCellRef.current?.focus({ preventScroll: true });
      else valueReportRef.current?.focus();
    }
  }, [currentPick, focusClock, isLive, isRecap, showSetup]);

  // The scorebug is two rows on a phone and three under 360px, so the board's
  // bar and the rail pin under its measured height. The board's bar wraps where
  // the list column is narrow, so the two together are what a focused row has
  // to clear, and the kit's scroll margin reads that sum.
  const boardbarRef = useRef<HTMLDivElement>(null);
  const [bugHeight, setBugHeight] = useState(0);
  const [boardbarHeight, setBoardbarHeight] = useState(0);
  useEffect(() => {
    const bug = stripRef.current;
    if (!bug || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      setBugHeight(bug.offsetHeight);
      setBoardbarHeight(boardbarRef.current?.offsetHeight ?? 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bug);
    if (boardbarRef.current) observer.observe(boardbarRef.current);
    return () => observer.disconnect();
  }, [isLive]);

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
    // "#" is a pick number everywhere else in the room, so the rank is spelled out.
    const describe = (player: Player) =>
      `${player.position}${player.positionRank ?? ""} · Rank ${formatRankValue(
        player.rankEcr ?? player.averageRank
      )}`;

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
          sub: `${value.position}${value.positionRank ?? ""} · ${formatPickDelta(valueDelta)} past ADP`,
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
      if (!matchesPosition(player, positionFilter)) return false;
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

  const isSearching = searchQuery.trim().length > 0;
  // Who is already gone from each tier, under the position filter in force.
  const goneByTier = useMemo(() => {
    const drafted = new Set(state.picks.map((pick) => pick.player.id));
    const gone = new Map<number, string[]>();
    for (const player of board) {
      if (!drafted.has(player.id) || !matchesPosition(player, positionFilter)) continue;
      if (typeof player.tier !== "number" || !Number.isFinite(player.tier)) continue;
      gone.set(player.tier, [...(gone.get(player.tier) ?? []), shortName(player)]);
    }
    return gone;
  }, [board, positionFilter, state.picks]);

  const slotForPick = useCallback(
    (pickNumber: number) => calculateDraftOrder(pickNumber, settings.totalTeams, settings.draftType),
    [settings.draftType, settings.totalTeams]
  );
  // The user's turn after this one, or 0 on their last. The board marks where
  // it falls if every pick until then follows the board, which a filter or a
  // search breaks, so the line only shows on the whole board.
  const nextUserPick = useMemo(() => {
    for (let pick = currentPick + 1; pick <= totalPicks; pick += 1) {
      if (slotForPick(pick) === settings.userTeam) return pick;
    }
    return 0;
  }, [currentPick, settings.userTeam, slotForPick, totalPicks]);
  const turnPlayerId =
    nextUserPick > 0 && positionFilter === "ALL" && !isSearching
      ? windowedPlayers[nextUserPick - currentPick]?.id
      : undefined;

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
    pendingFocusRef.current = "setup";
  };

  const backToRoom = () => {
    setRoomSetupOpen(false);
    pendingFocusRef.current = "room";
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
    setTransition("open");
    pendingFocusRef.current = "clock";
  };

  const rerunRoom = () => {
    room.startDraft(settings);
    setTransition("rerun");
    pendingFocusRef.current = "clock";
  };

  const takeBackPick = () => {
    if (!room.undoUserPick()) return;
    // Undoing the only pick disables the button that took the click, which
    // drops focus to the document, so the on-the-clock panel takes it.
    setTransition("undo");
    pendingFocusRef.current = "clock";
  };

  const finishRoom = () => {
    room.simToEnd();
    setTransition(null);
    pendingFocusRef.current = "recap";
  };

  const draftPlayer = (player: Player) => {
    if (!room.makeUserPick(player)) return;
    setSearchQuery("");
    setTransition(null);
    // The clicked control leaves the DOM with the pick, so move focus to the
    // on-the-clock panel rather than letting it fall back to the document.
    focusClock();
  };

  const scoringLabel = FANTASY_SCORING_LABELS[routeScoring];
  const parkedRoom = roomSetupOpen && state.status !== "setup";
  // The running head describes the room, so it reads the room's own settings
  // and not the form, which a parked room's setup screen can change.
  const roomScoring = SCORING_OPTIONS.find((option) => option.value === settings.scoringFormat);
  const roomLineParts = [
    { key: "room", text: `Room #${roomLabel(state.seed)}` },
    { key: "teams", text: `${settings.totalTeams}-team ${settings.draftType}` },
    // A phone holds the room line to one row, so the scoring takes its short form there.
    {
      key: "scoring",
      text: `${roomScoring?.label ?? settings.scoringFormat} scoring`,
      short: roomScoring?.shortLabel ?? roomScoring?.label,
    },
    { key: "rounds", text: `${settings.rounds}-round rep` },
  ];
  const freshnessParts: { label: string; tone?: "warning" }[] = [
    ...(archivedPractice ? [{ label: "Dated preseason practice", tone: "warning" as const }] : []),
    ...(boardReady
      ? [
          {
            label: `Board ${getSnapshotStalenessLabel(boardStaleness)} · ${formatStampDate(boardUpdatedAt)}`,
            tone: boardStaleness === "stale" ? "warning" as const : undefined,
          },
        ]
      : []),
    ...(boardReady && !adpAvailable
      ? [{ label: adpStatusLabel, tone: "warning" as const }]
      : []),
  ];

  const boardStatusLine = error
    ? "The published rankings snapshot failed to load."
    : isLoading || !snapshotMatches
      ? "Loading the rankings board."
    : !boardReady
      ? "The published snapshot did not include any players."
      : !simulationAvailable
        ? boardUpdatedAt
          ? `The published board is dated ${formatStampDate(boardUpdatedAt)}, which is past its freshness window, so simulated picks are paused.${
              archiveEligible ? " Choose dated preseason practice above to use it anyway." : ""
            }`
          : "The published board carries no date, so simulated picks are paused."
      : null;

  // Four different conditions gate simulationAvailable, so a paused room names
  // the one that actually applies (boardStatusLine above) and then the recovery
  // that is actually available. Refetching only helps when a request is not
  // already in flight and the board itself is the problem. Eligible opening
  // boards can resume with explicit consent to dated preseason practice.
  const boardReloadable = !boardReady && (Boolean(error) || (!isLoading && snapshotMatches));
  const kept = (sentence: string) =>
    storageBlocked ? sentence.replace(/\b(stays?) saved\b/, "$1 until this tab closes") : sentence;
  const pauseRecovery = kept(!boardReady
    ? boardReloadable
      ? "Your picks stay saved, and simulated picks resume once the board loads."
      : "Your picks stay saved, and simulated picks resume once the board arrives."
    : archiveEligible
      ? "Your picks stay saved. Choose dated preseason practice above to resume with this board."
      : "Your picks stay saved, and the room resumes only if a newer board publishes.");
  const rerunRecovery = kept(!boardReady
    ? "Run it back turns back on once the published board loads, and this recap stays exactly as it is."
    : archiveEligible
      ? "Choose dated preseason practice above to run it back. This recap stays saved."
      : "Run it back turns back on only if a newer board publishes, and this recap stays exactly as it is.");

  // The reload button shows on setup only after a failed request, and in a room
  // whenever the board is the problem and no request is in flight.
  const reloadShown = showSetup ? Boolean(error) : boardReloadable;
  const reloadBoard = () => {
    reloadFocusRef.current = true;
    retry();
  };
  useEffect(() => {
    if (!reloadFocusRef.current || reloadShown) return;
    reloadFocusRef.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const target = showSetup
      ? setupHeadingRef.current
      : isLive
        ? onClockCellRef.current
        : valueReportRef.current;
    target?.focus({ preventScroll: true });
  }, [isLive, reloadShown, showSetup]);

  // A keyboard gets a way past forty rows of Draft buttons. Where the rail is
  // not a box (the kit sets display: contents under 1200px), the first block
  // after the list takes the focus instead.
  const skipToRail = () => {
    const rail = railRef.current;
    if (!rail) return;
    rail.focus();
    if (document.activeElement === rail) return;
    const firstAfterList = rail.querySelector<HTMLElement>(":scope > :not(.ffb-rail-lead)");
    if (!firstAfterList) return;
    firstAfterList.tabIndex = -1;
    firstAfterList.focus();
  };

  // The pick loop re-renders the board and the quick picks with no other signal
  // that a pick landed, so a screen reader gets the outcome and the next turn.
  // Start mock, Run it back and Take back each get a sentence too, since all
  // three remove or disable the control that took the click.
  const lastUserPick = userPicks.length > 0 ? userPicks[userPicks.length - 1] : null;
  const draftAnnouncement = useMemo(() => {
    if (showSetup) return "";
    if (isRecap) return "The room is finished. The value report and the board are below.";
    const roomPicks = picksSinceUserTurn.length;
    const roomPickPhrase = `${roomPicks} room pick${roomPicks === 1 ? "" : "s"}`;
    const turn = `at pick #${currentPick}, round ${currentRound} of ${settings.rounds}.`;
    if (transition === "undo") {
      const kept = lastUserPick
        ? ` ${lastUserPick.player.name} at pick #${lastUserPick.pickNumber} is still yours.`
        : "";
      return `Your last pick is taken back. You are on the clock again ${turn}${kept}`;
    }
    if (!lastUserPick) {
      const opener =
        transition === "rerun"
          ? `Fresh room #${roomLabel(state.seed)} open with the same settings.`
          : `Room #${roomLabel(state.seed)} open.`;
      return `${opener} You are on the clock ${turn} ${roomPickPhrase} before your first turn.`;
    }
    return `You drafted ${lastUserPick.player.name} at pick #${lastUserPick.pickNumber}. ${roomPickPhrase} since. You are on the clock ${turn}`;
  }, [
    currentPick,
    currentRound,
    isRecap,
    lastUserPick,
    picksSinceUserTurn.length,
    settings.rounds,
    showSetup,
    state.seed,
    transition,
  ]);

  // The simulator drafts off the preseason board, so once the season starts it is
  // rehearsing a market that no longer exists. Name the season rather than letting
  // it read as current.
  const seasonalWeek = getNflRegularSeasonWeek(metadata?.season ?? 0);
  const showScopeNote = seasonalWeek >= 1;
  // The freshness line reads the freshness gate, so the stamp line has to as well:
  // an ADP that has a date but is past its window is dated and unused, and the
  // line says both so the two do not disagree a few lines apart.
  const adpStampLabel = (() => {
    if (!snapshotMatches || !metadata?.adpSource) return "ADP unavailable";
    const dated = `ADP dated ${formatStampDate(metadata.adpSource.asOf)}`;
    if (adpAvailable) return dated;
    if (adpFreshness === "prior-season") {
      return `${dated}, from the prior season, so the room runs on consensus`;
    }
    return `${dated}, past its window, so the room runs on consensus`;
  })();

  const betweenTurns = picksSinceUserTurn.length;
  const summary = `${setupForm.totalTeams}-team ${setupForm.draftType} · ${
    setupForm.slot === 0 ? "random slot" : `slot ${setupForm.slot}`
  } · ${setupForm.rounds}-round rep · ${scoringLabel} · ${lineupShort(setupForm.lineup)}`;
  const reportHeadingId = `${roomIds}-report`;
  const haulHeadingId = `${roomIds}-haul`;
  const boardHeadingId = `${roomIds}-board`;

  return (
    <section
      className="relative min-h-dvh overflow-x-clip"
      aria-label="Fantasy football mock draft"
      data-testid="fantasy-mock-draft-shell"
    >
      <div className={`${SHELL_CLASS} ffb-mk-col`}>
        {/* Setup keeps a headline and the pitch. A running room gets one compact line. */}
        <header className={showSetup ? "ffb-head ffb-head-setup" : "ffb-head ffb-head-run"}>
          <h1 className="ffb-title">Mock Draft</h1>
          {showSetup ? (
            <p className="ffb-lede">{LEAD}</p>
          ) : (
            <p className="ffb-lede">
              {roomLineParts.map((part, index) => (
                <Fragment key={part.key}>
                  {index > 0 ? (
                    <>
                      {" "}
                      <span aria-hidden="true">·</span>{" "}
                    </>
                  ) : null}
                  {part.short ? (
                    <span>
                      <span className="ffb-only-phone">{part.short}</span>
                      <span className="ffb-not-phone">{part.text}</span>
                    </span>
                  ) : (
                    <span>{part.text}</span>
                  )}
                </Fragment>
              ))}
            </p>
          )}
          {freshnessParts.length > 0 ? <FreshnessParts parts={freshnessParts} /> : null}
        </header>

        {/* The room's one announcement. A live room's scorebug carries it, so
            this paragraph stands in on setup, where it is empty, and on the
            recap. */}
        {isLive ? null : (
          <p role="status" aria-live="polite" className="sr-only">
            {draftAnnouncement}
          </p>
        )}

        {/* The paused messages point to the practice checkbox as "above", so
            the note that holds it stays first on all three screens. */}
        {showScopeNote ? (
          <SeasonalScopeNote season={metadata?.season ?? 0} week={seasonalWeek}>
            This is a preseason draft practice room. I keep the source dates visible, and the room pauses simulated picks
            if the published board goes stale. You can choose dated preseason practice to use the archived consensus board.
            Current in-season ranks are on the <Link href="/fantasy-football/weekly">weekly board</Link>.
            <span className="ffb-mk-stamp">
              {boardReady
                ? `Board dated ${formatStampDate(boardUpdatedAt)} · ${adpStampLabel}`
                : "Board and ADP dates arrive with the board"}
            </span>
            {archiveEligible ? (
              <label className="ffb-check ffb-mk-consent">
                <input
                  type="checkbox"
                  checked={archivedPractice}
                  onChange={(event) => setArchiveConsent(event.target.checked ? archiveIdentity : null)}
                />
                {/* The input covers the whole label, so the label is the checkbox's
                    44px target on a phone, and this draws the box. */}
                <span className="ffb-mk-consent-box" aria-hidden="true" />
                Practice with the dated preseason board
              </label>
            ) : null}
          </SeasonalScopeNote>
        ) : null}

        {showSetup ? (
          <div className="ffb-mk-setup">
            <div
              className={`ffb-sechead ffb-sechead-lg ffb-mk-setup-head${parkedRoom ? " ffb-sechead-ctl" : ""}`}
            >
              <h2 ref={setupHeadingRef} tabIndex={-1} className="ffb-h2">
                Rep the rounds that decide leagues.
              </h2>
              {parkedRoom ? (
                <button type="button" onClick={backToRoom} className="ffb-btn">
                  Back to room <span aria-hidden="true">→</span>
                </button>
              ) : null}
            </div>

            {/* The room summary and Start come before the fields in the
                document, so the default room starts without a trip through its
                settings. The summary reads the form, so it follows every change
                made in the fields. From 1024px the stylesheet moves this block
                to a rail at the right, where it stays in view. */}
            <div className="ffb-mk-start">
              <div className="ffb-sechead ffb-mk-start-head">
                <h3 className="ffb-h3">Room setup</h3>
              </div>
              <p className="ffb-mk-start-summary">{summary}</p>
              {/* Why Start is paused, kept against the button it explains. */}
              {boardStatusLine ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={
                    error
                      ? "ffb-notice ffb-notice-bad"
                      : isLoading || !snapshotMatches
                        ? "ffb-notice"
                        : "ffb-notice ffb-notice-warn"
                  }
                >
                  <p>{boardStatusLine}</p>
                  {error ? (
                    <div className="ffb-notice-actions">
                      <button type="button" onClick={reloadBoard} className="ffb-btn">
                        Retry
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={startRoom}
                disabled={!simulationAvailable}
                className="ffb-btn ffb-btn-primary ffb-btn-lg ffb-btn-block"
              >
                Start mock
              </button>
            </div>

            <div className="ffb-mk-setup-main">
              <div className="ffb-mk-fields">
                <label className="ffb-field">
                  <span className="ffb-field-label">Teams</span>
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
                    className="ffb-select"
                  >
                    {TEAM_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} teams
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ffb-field">
                  <span className="ffb-field-label">Your slot</span>
                  <select
                    value={setupForm.slot}
                    onChange={(event) =>
                      setSetupForm((form) => ({ ...form, slot: Number(event.target.value) }))
                    }
                    className="ffb-select"
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

                <label className="ffb-field">
                  <span className="ffb-field-label">Rounds · early rep</span>
                  <select
                    value={setupForm.rounds}
                    onChange={(event) =>
                      setSetupForm((form) => ({ ...form, rounds: Number(event.target.value) }))
                    }
                    className="ffb-select"
                  >
                    {ROUND_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} rounds
                      </option>
                    ))}
                  </select>
                </label>

                <div className="ffb-field">
                  <span id={scoringLabelId} className="ffb-field-label">
                    Scoring
                  </span>
                  <SegmentedButtons
                    labelledBy={scoringLabelId}
                    options={SCORING_OPTIONS}
                    value={scoringSelection}
                    onSelect={setScoringSelection}
                  />
                </div>

                <div className="ffb-field">
                  <span id={orderLabelId} className="ffb-field-label">
                    Draft order
                  </span>
                  <SegmentedButtons
                    labelledBy={orderLabelId}
                    options={ORDER_OPTIONS}
                    value={setupForm.draftType}
                    onSelect={(draftType) => setSetupForm((form) => ({ ...form, draftType }))}
                  />
                </div>

                <div className="ffb-field">
                  <span id={temperLabelId} className="ffb-field-label">
                    Room temper
                  </span>
                  <SegmentedButtons
                    labelledBy={temperLabelId}
                    options={TEMPER_OPTIONS}
                    value={setupForm.temper}
                    onSelect={(temper) => setSetupForm((form) => ({ ...form, temper }))}
                  />
                  <span className="ffb-field-hint">{TEMPER_NOTES[setupForm.temper]}</span>
                </div>
              </div>

              <fieldset className="ffb-mk-fieldset">
                <legend className="ffb-field-label">Starting lineup</legend>
                <div className="ffb-choices ffb-mk-lineups">
                  {REDRAFT_LINEUP_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={sameRedraftLineup(preset.lineup, setupForm.lineup)}
                      onClick={() =>
                        setSetupForm((form) => ({ ...form, lineup: { ...preset.lineup } }))
                      }
                      className="ffb-choice"
                    >
                      <span className="ffb-choice-title">{preset.label}</span>{" "}
                      <span className="ffb-choice-note">{lineupShort(preset.lineup)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <p className="ffb-method ffb-method-ruled ffb-mk-setup-foot">
              The room drafts around you, so you are on the clock every turn. Each run is a fresh
              seeded room with the same settings, and nothing here is a projection of season
              outcomes.
            </p>
          </div>
        ) : null}

        {isLive ? (
          <>
            {/* The scorebug's cells are this room's four readouts, each with its
                second line as the cell's note. The user is on the clock at every
                stop, so the highlighter cell always reads "You". Below 1024px
                the bar takes its short forms and leaves the pool to the board's
                own count, which keeps it to one row down to 768px and to two on
                a phone. */}
            <DraftScorebug
              label="Live mock draft status"
              sectionRef={stripRef}
              announcement={draftAnnouncement}
              className="ffb-mk-bug"
              actions={
                <>
                  <button
                    type="button"
                    onClick={takeBackPick}
                    disabled={!hasUserPick}
                    aria-label={hasUserPick ? "Take back your last pick" : "Take back (no picks yet)"}
                    title="Take back your last pick"
                    className="ffb-bug-btn"
                  >
                    <Undo2 size={15} aria-hidden="true" />
                    <span className="ffb-mk-wide">Take back</span>
                  </button>
                  <button type="button" onClick={openSetup} className="ffb-bug-btn ffb-bug-btn-quiet">
                    New mock
                  </button>
                  {/* Take back is reversible and this is not, so it sits last,
                      behind a rule, and says so on the button itself. */}
                  <button
                    type="button"
                    onClick={finishRoom}
                    disabled={!simulationAvailable}
                    aria-label="Sim to end, which finishes the room with no take back"
                    title="The engine finishes every remaining pick, including yours, and the room goes straight to the recap. Nothing takes that back."
                    className="ffb-bug-btn ffb-mk-sim"
                  >
                    Sim to end <small className="ffb-bug-long">no take back</small>
                  </button>
                </>
              }
            >
              <DraftScorebugCell
                label="Pick"
                className="ffb-mk-cell-pick"
                note={`Round ${currentRound} of ${settings.rounds}`}
              >
                <span className="ffb-only-phone">{`#${currentPick}/${totalPicks}`}</span>
                <span className="ffb-not-phone">{`#${currentPick} / ${totalPicks}`}</span>
              </DraftScorebugCell>
              <DraftScorebugCell
                label="On the clock"
                live
                ref={onClockCellRef}
                tabIndex={-1}
                note={
                  <>
                    <span className="ffb-mk-narrow">{`slot ${settings.userTeam}/${settings.totalTeams}`}</span>
                    <span className="ffb-mk-wide">{`slot ${settings.userTeam} of ${settings.totalTeams}`}</span>
                  </>
                }
              >
                You
              </DraftScorebugCell>
              <DraftScorebugCell
                label="Between turns"
                className="ffb-mk-cell-between"
                note={
                  <>
                    <span className="ffb-mk-narrow">{hasUserPick ? "since yours" : "before you"}</span>
                    <span className="ffb-mk-wide">
                      {hasUserPick ? "since your last pick" : "before your first turn"}
                    </span>
                  </>
                }
              >
                {betweenTurns} <small>{betweenTurns === 1 ? "pick" : "picks"}</small>
              </DraftScorebugCell>
              <DraftScorebugCell
                label="Pool"
                className="ffb-mk-wide ffb-mk-cell-pool"
                note={`of ${board.length} ranked`}
              >
                {availablePlayers.length} <small>left</small>
              </DraftScorebugCell>
            </DraftScorebug>

            {!simulationAvailable ? (
              <div role="alert" className="ffb-notice ffb-notice-warn">
                <p>
                  {boardStatusLine} {pauseRecovery}
                </p>
                {boardReloadable ? (
                  <div className="ffb-notice-actions">
                    <button type="button" onClick={reloadBoard} className="ffb-btn">
                      Reload the board
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* The page goes from the h1 to the room's h3 headings with nothing
                between, so name the room here, as the redraft room does. */}
            <h2 className="sr-only">Your mock room</h2>

            <DraftLastPicks
              picks={tapePicks}
              userTeam={settings.userTeam}
              heading="Since your last pick"
            />

            {/* The scorebug's measured height is where the board's bar and the rail
                pin, and the two bars together are what a focused row clears. */}
            <div
              className="ffb-work ffb-work-split"
              style={
                {
                  "--ffb-sticky-top": `${bugHeight}px`,
                  "--ffb-pinned-top": `${bugHeight + boardbarHeight + 8}px`,
                } as CSSProperties
              }
            >
              <div>
                {/* focusClock sets this region's scroll margin to the scorebug's
                    measured height before it calls focus(), so the region lands
                    under the pinned bar and not behind it. */}
                <section
                  ref={onClockRef}
                  tabIndex={-1}
                  aria-label="You are on the clock"
                  className="ffb-block"
                >
                  <div className="ffb-strip-head">
                    <h3 className="ffb-turn-tab">You&apos;re up</h3>
                    {/* A phone's quick picks drop the word "Draft" to sit two to a
                        row, so the note there says what a press does. */}
                    {simulationAvailable ? (
                      <p className="ffb-mk-turn-note">
                        <span className="ffb-only-phone">Select one to draft it</span>
                        <span className="ffb-not-phone">The room resumes the moment you draft</span>
                      </p>
                    ) : null}
                  </div>
                  {quickPicks.length > 0 ? (
                    <div className="ffb-mk-quicks">
                      {quickPicks.map((quick) => (
                        <button
                          key={quick.key}
                          type="button"
                          onClick={() => draftPlayer(quick.player)}
                          title={quick.title}
                          className={`ffb-sticker ${positionClass(quick.player.position)} ffb-mk-quick`}
                        >
                          <span className="ffb-sticker-meta">
                            <span>{quick.tag}</span> <span>{quick.sub}</span>
                          </span>{" "}
                          <span className="ffb-sticker-name">{shortName(quick.player)}</span>{" "}
                          <span className="ffb-mk-quick-go">Draft</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>

                <a
                  href="#mock-your-draft"
                  onClick={(event) => {
                    event.preventDefault();
                    skipToRail();
                  }}
                  className="ffb-btn ffb-mk-skip"
                >
                  Skip to your roster
                </a>

                <section
                  aria-label="Available players"
                  className={`ffb-board ffb-board-room ffb-board-log ffb-mk-board${
                    adpAvailable ? " ffb-mk-has-adp" : ""
                  }`}
                >
                  {/* The filter, the search, the count, and the column labels
                      hold their place under the scorebug while the list scrolls.
                      On a phone the scorebug already pins two rows, so the
                      stylesheet lets this bar scroll with the list there. */}
                  <div ref={boardbarRef} className="ffb-sticky ffb-mk-boardbar">
                    <div className="ffb-toolbar">
                      <PositionFilterBar
                        ariaLabel="Filter available players by position"
                        options={POSITION_FILTER_OPTIONS}
                        value={positionFilter}
                        onChange={setPositionFilter}
                      />
                      <label htmlFor="mock-draft-search" className="sr-only">
                        Search available players
                      </label>
                      {/* A label, so the icon and the field's padding focus the
                          input too. It adds no text, so the field's name is
                          still the one above. */}
                      <label className="ffb-search">
                        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
                          <circle cx="8.5" cy="8.5" r="5.5" />
                          <path d="M12.8 12.8L17 17" />
                        </svg>
                        <input
                          ref={searchRef}
                          id="mock-draft-search"
                          name="mock-draft-search"
                          value={searchQuery}
                          maxLength={80}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          autoComplete="off"
                          placeholder="Search player or team"
                          className="ffb-search-input"
                        />
                      </label>
                      <span className="ffb-count">
                        {filteredAvailable.length} of {availablePlayers.length} available
                      </span>
                    </div>

                    {windowedPlayers.length > 0 ? (
                      <div aria-hidden="true" className="ffb-colhead ffb-mk-colhead hidden md:grid">
                        <span className="ffb-h-num ffb-is-sorted">Rk</span>
                        <span className="ffb-h-pos">Pos</span>
                        <span>Player</span>
                        <span>Team</span>
                        <span className="ffb-h-num">Bye</span>
                        {adpAvailable ? (
                          <>
                            <span className="ffb-h-num">ADP</span>
                            <span className="ffb-h-num">At #{currentPick}</span>
                          </>
                        ) : null}
                        <span />
                      </div>
                    ) : null}
                  </div>

                  {tierGroups.map((group, index) => {
                    const firstRank = formatRankValue(group.rows[0].rankEcr ?? group.rows[0].averageRank);
                    const lastRow = group.rows[group.rows.length - 1];
                    const lastRank = formatRankValue(lastRow.rankEcr ?? lastRow.averageRank);
                    let cliff = 0;
                    if (index > 0) {
                      const previous = tierGroups[index - 1];
                      const previousAvg = getConsensusAvg(previous.rows[previous.rows.length - 1]);
                      const nextAvg = getConsensusAvg(group.rows[0]);
                      if (previousAvg !== null && nextAvg !== null) {
                        cliff = Math.max(0, Number((nextAvg - previousAvg).toFixed(1)));
                      }
                    }
                    // The gap above a break grows with the cliff, in 4px steps from 8 to 28px.
                    const gap = Math.min(28, Math.max(8, Math.round((cliff * 6) / 4) * 4));
                    // The cliff mark in the head is hidden from assistive tech, so its size rides in the label.
                    const tierLabel = [
                      group.tier !== null ? `Tier ${group.tier}` : "Players with no published tier",
                      `${group.rows.length} ${group.rows.length === 1 ? "player" : "players"}`,
                      firstRank === lastRank ? `rank ${firstRank}` : `ranks ${firstRank} to ${lastRank}`,
                      index > 0 && cliff > 0 ? `${cliff.toFixed(1)} average-rank cliff above` : null,
                    ]
                      .filter(Boolean)
                      .join(", ");
                    // The window can split a tier across two groups, so the line prints with the first.
                    const gone =
                      group.tier !== null &&
                      !isSearching &&
                      tierGroups.findIndex((candidate) => candidate.tier === group.tier) === index
                        ? goneByTier.get(group.tier)
                        : undefined;

                    return (
                      <section
                        key={`tier-${group.tier ?? "untiered"}-${group.rows[0].id}`}
                        className="ffb-tier"
                        aria-label={tierLabel}
                        style={{ "--ffb-gap": `${gap}px` } as CSSProperties}
                      >
                        <header className="ffb-tier-head">
                          <h3 className="ffb-tier-name">
                            {/* The spaces keep the three parts apart when the heading is read as one string. */}
                            <span className="ffb-tier-tab">
                              {group.tier !== null
                                ? `Tier ${String(group.tier).padStart(2, "0")}`
                                : "No published tier"}
                            </span>{" "}
                            <span className="ffb-tier-count">{group.rows.length} left</span>{" "}
                            {/* A tier down to its last player has one rank, not a range. */}
                            <span className="ffb-tier-range">
                              {firstRank === lastRank ? `Rank ${firstRank}` : `Ranks ${firstRank}–${lastRank}`}
                            </span>
                          </h3>
                          {index > 0 && cliff > 0 ? (
                            <p className="ffb-tier-cliff" aria-hidden="true">
                              <span className="ffb-cliff-mark" />
                              <b>{cliff.toFixed(1)}</b> <span className="ffb-not-phone">avg-rank </span>cliff
                            </p>
                          ) : null}
                        </header>
                        {gone ? (
                          <p className="ffb-tier-gone">
                            <span className="ffb-label">Gone</span> <span>{gone.join(", ")}</span>
                          </p>
                        ) : null}
                        <ol className="ffb-rows">
                          {group.rows.map((player) => {
                            const delta = adpAvailable
                              ? deltaAtPick(player, currentPick, currentRound)
                              : null;
                            const hasBye =
                              typeof player.byeWeek === "number" && Number.isFinite(player.byeWeek);
                            return (
                              <Fragment key={player.id}>
                                {player.id === turnPlayerId ? (
                                  <li className="ffb-turnline">
                                    <span className="ffb-turn-tab">Your next turn #{nextUserPick}</span>{" "}
                                    <span className="ffb-turn-note">if picks follow this board</span>
                                  </li>
                                ) : null}
                                <li className="ffb-row">
                                  <span className="ffb-c-rank" title="Overall board rank">
                                    {formatRankValue(player.rankEcr ?? player.averageRank)}
                                  </span>
                                  <span className={`ffb-chip ${positionClass(player.position)}`.trimEnd()}>
                                    {player.position}
                                    {player.positionRank ?? ""}
                                  </span>
                                  {/* The name has the whole first line on a phone. A narrow row
                                      can still cut a long one, and the title keeps it whole. */}
                                  <span className="ffb-c-name" title={player.name}>
                                    {player.name}
                                  </span>
                                  <span className="ffb-c-team">{player.team}</span>
                                  <span className="ffb-c-bye">
                                    {hasBye ? (
                                      <>
                                        <span className="ffb-mk-vh-desk">Bye </span>
                                        {player.byeWeek}
                                      </>
                                    ) : null}
                                  </span>
                                  {adpAvailable ? (
                                    <>
                                      {/* Each hidden label sits inside the cell it names, so it
                                          hides when the cell does. */}
                                      <span
                                        className="ffb-c-num ffb-is-flat"
                                        title="Average draft position in mock rooms"
                                      >
                                        <span className="sr-only">ADP</span> {formatAdp(player.adp)}
                                      </span>
                                      {/* A phone row has room for one number, and the gap against
                                          the pick on the clock is the reading the room is for. */}
                                      <span
                                        className={`ffb-c-num ffb-m-meta ${
                                          delta?.isValue ? "ffb-is-strong ffb-mk-is-value" : "ffb-is-flat"
                                        }`}
                                        title={delta?.title ?? "No reliable market sample for this player"}
                                      >
                                        <span className="sr-only">versus ADP at pick {currentPick}</span>{" "}
                                        <span aria-hidden="true" className="ffb-only-phone">
                                          ±ADP{" "}
                                        </span>
                                        {delta?.text ?? "—"}
                                      </span>
                                    </>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => draftPlayer(player)}
                                    disabled={!simulationAvailable}
                                    aria-label={`Draft ${player.name}`}
                                    className="ffb-log"
                                  >
                                    Draft
                                  </button>
                                </li>
                              </Fragment>
                            );
                          })}
                        </ol>
                      </section>
                    );
                  })}

                  {filteredAvailable.length === 0 ? (
                    <div className="ffb-empty">
                      <p className="ffb-empty-title">No available players match on this board.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setPositionFilter("ALL");
                          // This button leaves with the empty state, so the search field takes the focus.
                          searchRef.current?.focus();
                        }}
                        className="ffb-btn"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : null}
                  {filteredAvailable.length > VISIBLE_BOARD_ROWS ? (
                    <p className="ffb-fine ffb-mk-more">
                      Showing the top {VISIBLE_BOARD_ROWS} of {filteredAvailable.length} available
                      players. Search or filter to reach the rest.
                    </p>
                  ) : null}
                </section>
              </div>

              <aside
                ref={railRef}
                id="mock-your-draft"
                tabIndex={-1}
                className="ffb-rail ffb-rail-scroll"
                aria-label="Your draft"
              >
                <DraftRoster
                  assignment={lineupAssignment}
                  picked={userPicks.length}
                  rounds={settings.rounds}
                />
                <DraftPickGrid
                  picks={state.picks}
                  totalTeams={settings.totalTeams}
                  userTeam={settings.userTeam}
                  rounds={settings.rounds}
                  slotForPick={slotForPick}
                  currentPick={currentPick}
                  currentRound={currentRound}
                  isComplete={false}
                />
              </aside>
            </div>

            <div className="ffb-mk-foot">
              <p className="ffb-method">
                Take a pick back and the same room replays · sim to end finishes the room and
                cannot be taken back · nothing leaves this device
              </p>
              <p className="ffb-method">{LEAD}</p>
            </div>
          </>
        ) : null}

        {isRecap ? (
          <div className="ffb-stack ffb-stack-loose ffb-mk-recap">
            <section
              ref={valueReportRef}
              tabIndex={-1}
              aria-labelledby={reportHeadingId}
              className="ffb-mk-report"
            >
              <div className="ffb-sechead ffb-sechead-lg ffb-sechead-ctl">
                <h2 id={reportHeadingId} className="ffb-h2">
                  Value report
                </h2>
                <div className="ffb-cluster ffb-mk-noprint">
                  <button
                    type="button"
                    onClick={rerunRoom}
                    disabled={!simulationAvailable}
                    aria-describedby={simulationAvailable ? undefined : "mock-rerun-blocked"}
                    className="ffb-btn ffb-btn-primary"
                  >
                    Run it back <span aria-hidden="true">→</span>
                  </button>
                  <button type="button" onClick={openSetup} className="ffb-btn">
                    Change setup
                  </button>
                </div>
              </div>

              {!simulationAvailable ? (
                <div id="mock-rerun-blocked" role="status" className="ffb-notice ffb-notice-warn ffb-block">
                  <p>
                    {boardStatusLine} {rerunRecovery}
                  </p>
                  {boardReloadable ? (
                    <div className="ffb-notice-actions">
                      <button type="button" onClick={reloadBoard} className="ffb-btn">
                        Reload the board
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="ffb-mk-report-body">
                <div className="ffb-mk-grade">
                  <p className="ffb-label ffb-muted">Draft grade</p>
                  <p className="ffb-heavy ffb-mk-grade-letter">{recap.grade ?? "—"}</p>
                  <p className="ffb-mk-grade-total">
                    {recap.judged.length > 0
                      ? `${formatPickDelta(recap.total)} vs the draft baseline`
                      : "no judged picks"}
                  </p>
                  <p className="ffb-fine">
                    {recap.judged.length > 0
                      ? `summed pick delta vs the ADP-or-consensus baseline across ${recap.judged.length} of your ${userPicks.length} picks`
                      : "no pick had a market or consensus baseline to score against"}
                  </p>
                </div>
                <dl className="ffb-facts ffb-mk-facts">
                  <div className="ffb-fact">
                    <dt>Your best pick</dt>
                    <dd>{recap.bestPick ? shortName(recap.bestPick.pick.player) : "—"}</dd>
                    <dd
                      className={`ffb-fact-note${
                        recap.bestPick && classifyPickValue(recap.bestPick.pick) === "steal" ? " ffb-good" : ""
                      }`}
                    >
                      {recap.bestPick
                        ? `${formatPickDelta(recap.bestPick.delta)} vs baseline at #${recap.bestPick.pick.pickNumber}`
                        : "no judged picks"}
                    </dd>
                  </div>
                  <div className="ffb-fact">
                    <dt>Biggest room reach</dt>
                    <dd>{recap.biggestReach ? shortName(recap.biggestReach.pick.player) : "None"}</dd>
                    <dd className={`ffb-fact-note${recap.biggestReach ? " ffb-warn" : ""}`}>
                      {recap.biggestReach
                        ? `${
                            recap.biggestReach.pick.teamNumber === settings.userTeam
                              ? "you"
                              : `slot ${recap.biggestReach.pick.teamNumber}`
                          } · ${formatPickDelta(recap.biggestReach.delta)} vs baseline`
                        : "no pick cleared the reach threshold"}
                    </dd>
                  </div>
                  <div className="ffb-fact">
                    <dt>Your shape</dt>
                    <dd>{recap.shape || "—"}</dd>
                    <dd className="ffb-fact-note">
                      {`${userPicks.length} ${userPicks.length === 1 ? "pick" : "picks"} · ${
                        lineupAssignment.bench > 0 ? `${lineupAssignment.bench} to bench` : "all starters"
                      }`}
                    </dd>
                  </div>
                  <div className="ffb-fact">
                    <dt>Room temper</dt>
                    <dd>{TEMPER_LABELS[settings.temper]}</dd>
                    <dd className="ffb-fact-note">{`seeded room #${roomLabel(state.seed)}`}</dd>
                  </div>
                </dl>
              </div>
              <p className="ffb-fact-foot">
                same settings, fresh room · grades score every pick against the same baseline
              </p>
            </section>

            <div role="group" aria-labelledby={haulHeadingId}>
              <div className="ffb-sechead ffb-sechead-lg">
                <h2 id={haulHeadingId} className="ffb-h2">
                  Your haul
                </h2>
              </div>
              <ol className="ffb-mk-haul">
                {userPicks.map((pick) => {
                  const delta = getPickDelta(pick);
                  const verdict = classifyPickValue(pick);
                  const { position, positionRank } = pick.player;
                  return (
                    <li
                      key={`haul-${pick.pickNumber}`}
                      className={`ffb-sticker ${positionClass(position)}`.trimEnd()}
                    >
                      <span className="ffb-sticker-meta">
                        <span>
                          R{pick.round} · #{pick.pickNumber} · {position}
                          {positionRank ?? ""}
                        </span>{" "}
                        {delta !== null ? (
                          <span>
                            {verdict === "steal" ? "Value " : verdict === "reach" ? "Reach " : ""}
                            {formatPickDelta(delta)}
                          </span>
                        ) : null}
                      </span>{" "}
                      <span className="ffb-sticker-name" title={pick.player.name}>
                        {shortName(pick.player)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <section aria-labelledby={boardHeadingId} className="ffb-mk-fullboard">
              <div className="ffb-sechead ffb-sechead-lg">
                <h2 id={boardHeadingId} className="ffb-h2">
                  The board
                </h2>
              </div>
              <DraftPickGrid
                picks={state.picks}
                totalTeams={settings.totalTeams}
                userTeam={settings.userTeam}
                rounds={settings.rounds}
                slotForPick={slotForPick}
                currentPick={currentPick}
                currentRound={settings.rounds}
                isComplete
              />
            </section>

            <div className="ffb-mk-foot">
              <p className="ffb-method">
                Practice reps only, with no prediction in them · rooms stay on this device
              </p>
              <p className="ffb-method">{LEAD}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
