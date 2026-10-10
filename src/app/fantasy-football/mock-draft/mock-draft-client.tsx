"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import { PROJECT_PRESS } from "@/constants/projectPress";
import Link from "next/link";
import type { DraftPick, Player, RedraftLineupSettings, ScoringFormat } from "@/types";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { readValidatedBrowserStorage } from "@/lib/browserStorage";
import { FANTASY_SCORING_LABELS, scoringFormatToRouteScoring } from "@/lib/fantasy";
import {
  FASCIA_TOP_CLASS,
  HEADER_CHIP_CLASS,
  MONO_LABEL_CLASS,
  PILL_BUTTON_CLASS,
  SHELL_CLASS,
  WARNING_CARD_STYLE,
  assignLineupSlots,
  canPracticeWithArchivedDraftBoard,
  formatAdp,
  formatPickDelta,
  formatRankValue,
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
import { REDRAFT_LINEUP_PRESETS, sameRedraftLineup } from "@/lib/redraftLineup";
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

/**
 * Ink-filled action pill (the template's "Draft" / "Start mock" buttons). The
 * fill lives in classes rather than an inline style so the hover can win.
 * The opacity fade `disabled:opacity-50` used to apply measured 4.38:1 light
 * and 3.42:1 dark once blended over the page, so disabled drops the fade and
 * prints as a dashed ink-2 outline instead of a faded ink fill.
 */
const SOLID_BUTTON_CLASS =
  "inline-flex min-h-touch items-center justify-center border border-[var(--c97-ink)] bg-[var(--c97-ink)] px-[var(--c97-sp-2)] font-mono text-2xs uppercase tracking-[0.08em] text-[var(--c97-surface)] hover:bg-[var(--c97-ink-2)] disabled:cursor-not-allowed disabled:border-dashed disabled:border-[var(--c97-ink-2)] disabled:bg-transparent disabled:text-[var(--c97-ink-2)]";

const WARNING_CHIP_TONE: CSSProperties = {
  background: "color-mix(in srgb, var(--c97-warning) 18%, var(--c97-surface))",
  borderColor: "color-mix(in srgb, var(--c97-warning) 32%, var(--c97-rule))",
  color: "var(--c97-ink)",
};

/**
 * Below `md` the column-label row is hidden, so each board value carries its
 * own label. The sr-only cell label next to it keeps the value named exactly
 * once for assistive tech at every width. Same contract as the draft tracker.
 */
const ROW_MICRO_LABEL_CLASS =
  "font-mono text-3xs uppercase tracking-[0.06em] text-[var(--c97-ink-2)] md:hidden";

/**
 * The recap board's "#n · POS" line sits on each cell's position wash, where
 * plain muted ink measured 4.16 to 4.41:1 in light. Muted mixed 72% toward ink
 * clears 4.5:1 on every wash in both themes and stays lighter than the name.
 */
const RECAP_CELL_LABEL_COLOR = "color-mix(in srgb, var(--c97-ink-2) 72%, var(--c97-ink))";

/**
 * Date-only stamp pinned to UTC, so the board and ADP dates in the header chip
 * and the scope note match the upstream's own date in every zone instead of
 * drifting a day for viewers west of UTC.
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
      color: "var(--c97-positive)",
      title: `Still on the board ${magnitude} picks past his market ADP`,
    };
  }
  return {
    text: formatPickDelta(delta),
    color: "var(--c97-ink-2)",
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
  labelledBy,
}: {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onSelect: (value: Value) => void;
  /** Id of the visible label, so each segment is announced with its group. */
  labelledBy: string;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="flex flex-wrap border"
      style={{ borderColor: "var(--c97-rule)" }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className={`relative min-h-touch min-w-touch flex-1 font-mono text-2xs uppercase tracking-[0.06em] focus-visible:z-[var(--c97-z-tray)] ${
              active ? "" : "hover:bg-[var(--c97-overlay)]"
            }`}
            style={
              { paddingInline: "var(--c97-sp-0)", ...(active
                ? { background: "var(--c97-ink)", color: "var(--c97-surface)" }
                : { color: "var(--c97-ink)" }) }
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
  // The sticky status strip above the on-the-clock panel is one wrapping line
  // below md and a readout row from lg (189px against 86px when measured on
  // 2026-10-09), so the margin that keeps the panel clear of it when focus()
  // scrolls it into view is read off the strip rather than fixed in CSS.
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
  const pendingFocusRef = useRef<"clock" | "recap" | null>(null);
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
    }
  }, [currentPick, focusClock, isLive, isRecap]);

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
    ...(archivedPractice ? [{ label: "Dated preseason practice", tone: WARNING_CHIP_TONE }] : []),
    ...(state.status !== "setup" ? [{ label: `Room #${roomLabel(state.seed)}` }] : []),
    { label: `${chipSettings.teams}-team ${chipSettings.draftType}` },
    { label: `${scoringLabel} scoring` },
    { label: `${chipSettings.rounds}-round rep` },
    ...(boardReady
      ? [
          {
            label: `Board ${getSnapshotStalenessLabel(boardStaleness)} · ${formatStampDate(boardUpdatedAt)}`,
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
  const pauseRecovery = !boardReady
    ? boardReloadable
      ? "Your picks stay saved, and simulated picks resume once the board loads."
      : "Your picks stay saved, and simulated picks resume once the board arrives."
    : archiveEligible
      ? "Your picks stay saved. Choose dated preseason practice above to resume with this board."
      : "Your picks stay saved, and the room resumes only if a newer board publishes.";
  const rerunRecovery = !boardReady
    ? "Run it back turns back on once the published board loads, and this recap stays exactly as it is."
    : archiveEligible
      ? "Choose dated preseason practice above to run it back. This recap stays saved."
      : "Run it back turns back on only if a newer board publishes, and this recap stays exactly as it is.";

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

  const footerLinks = (
    <span className="inline-flex" style={{ gap: "var(--c97-sp-2)" }}>
      <Link href="/fantasy-football" className="c97-link inline-flex min-h-touch items-center text-sm font-semibold">
        Rankings board <span className="c97-arrow-out" aria-hidden="true">↗</span>
      </Link>
      <Link href="/fantasy-football/draft-tracker" className="c97-link inline-flex min-h-touch items-center text-sm font-semibold">
        Draft tracker <span className="c97-arrow-out" aria-hidden="true">↗</span>
      </Link>
    </span>
  );

  interface FasciaCell {
    key: string;
    label: string;
    value: string;
    sub: string;
    /** The same readout as one phrase for the single-line strip below md. */
    compact: string;
    /** Read before `compact` by assistive tech when the phrase needs its label. */
    compactPrefix?: string;
    valueColor?: string;
    background?: string;
  }

  const roomPickCount = `${picksSinceUserTurn.length} room pick${picksSinceUserTurn.length === 1 ? "" : "s"}`;
  const fasciaCells: FasciaCell[] = [
    {
      key: "pick",
      label: "Pick",
      value: `#${currentPick} / ${totalPicks}`,
      sub: `Round ${currentRound} of ${settings.rounds}`,
      compact: `Pick #${currentPick}/${totalPicks} · round ${currentRound}/${settings.rounds}`,
    },
    {
      key: "clock",
      label: "On the clock",
      value: "You",
      sub: `slot ${settings.userTeam} of ${settings.totalTeams} · ${settings.draftType}`,
      compact: `You · slot ${settings.userTeam}/${settings.totalTeams}`,
      compactPrefix: "On the clock",
      // Signal mixed toward ink clears 4.5:1 on the signal wash in both themes.
      valueColor: "color-mix(in srgb, var(--c97-accent) 72%, var(--c97-ink))",
      background: "color-mix(in srgb, var(--c97-accent) 8%, var(--c97-surface))",
    },
    {
      key: "between",
      label: "Between turns",
      value: `${picksSinceUserTurn.length} pick${picksSinceUserTurn.length === 1 ? "" : "s"}`,
      sub: hasUserPick ? "since your last pick" : "before your first turn",
      compact: `${roomPickCount} ${hasUserPick ? "since yours" : "before you"}`,
    },
    {
      key: "pool",
      label: "Pool",
      value: `${availablePlayers.length} left`,
      sub: `of ${board.length} ranked`,
      compact: `${availablePlayers.length} of ${board.length} left`,
    },
  ];

  // The simulator drafts off the preseason board, so once the season starts it is
  // rehearsing a market that no longer exists. Name the season rather than letting
  // it read as current.
  const seasonalWeek = getNflRegularSeasonWeek(metadata?.season ?? 0);
  // The seasonal note is the first paper sheet under the green hero when it
  // renders, so it carries the torn seam; when it does not render, whichever
  // state sheet (setup, live, recap) follows the hero carries it instead.
  const showScopeNote = seasonalWeek >= 1;
  // The header chip reads the freshness gate, so the stamp line has to as well:
  // an ADP that has a date but is past its window is dated and unused, and the
  // line says both so the two do not disagree two lines apart.
  const adpStampLabel = (() => {
    if (!snapshotMatches || !metadata?.adpSource) return "ADP unavailable";
    const dated = `ADP dated ${formatStampDate(metadata.adpSource.asOf)}`;
    if (adpAvailable) return dated;
    if (adpFreshness === "prior-season") {
      return `${dated}, from the prior season, so the room runs on consensus`;
    }
    return `${dated}, past its window, so the room runs on consensus`;
  })();

  return (
    <section
      className="c97-dash relative overflow-x-clip min-h-dvh"
      aria-label="Fantasy football mock draft"
      data-testid="fantasy-mock-draft-shell"
    >
      <section
        className="c97-sheet"
        data-c97-surface={`ink-${PROJECT_PRESS["/fantasy-football/mock-draft"].lead}`}
      >
        <div className={SHELL_CLASS} style={{ paddingBlock: "var(--c97-sp-5)" }}>
          <h1 className="c97-poster m-0">Mock Draft</h1>
          <p className="c97-meta" style={{ marginTop: "var(--c97-sp-2)" }}>{kicker}</p>
          <div
            data-c97-surface="paper"
            className="c97-offset flex flex-wrap"
            style={{ gap: "var(--c97-sp-0)", padding: "var(--c97-sp-3)", marginTop: "var(--c97-sp-4)" }}
          >
            {headerChips.map((chip) => (
              <span
                key={chip.label}
                className={HEADER_CHIP_CLASS}
                style={
                  chip.tone ?? {
                    borderColor: "var(--c97-rule)",
                    background: "var(--c97-field)",
                    color: "var(--c97-ink-2)",
                  }
                }
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <p role="status" aria-live="polite" className="sr-only">
        {draftAnnouncement}
      </p>

      {showScopeNote ? (
        <div className="c97-sheet" data-c97-surface="paper" data-seam="torn">
          <div className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-2)" }}>
            <SeasonalScopeNote season={metadata?.season ?? 0} week={seasonalWeek}>
              This is a preseason draft practice room. I keep the source dates visible, and the room pauses simulated picks
              if the published board goes stale. You can choose dated preseason practice to use the archived consensus board.
              Current in-season ranks are on the{" "}
              <Link href="/fantasy-football/weekly" className="underline decoration-[var(--c97-accent)] underline-offset-4">weekly board</Link>.
              <span className="block font-mono text-2xs uppercase tracking-[0.08em]" style={{ marginTop: "var(--c97-sp-0)" }}>
                {boardReady
                  ? `Board dated ${formatStampDate(boardUpdatedAt)} · ${adpStampLabel}`
                  : "Board and ADP dates arrive with the board"}
              </span>
              {archiveEligible ? (
                <label className="flex min-h-touch cursor-pointer items-center" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                  <input
                    type="checkbox"
                    checked={archivedPractice}
                    onChange={(event) => setArchiveConsent(event.target.checked ? archiveIdentity : null)}
                    className="h-5 w-5 accent-[var(--c97-accent)]"
                  />
                  <span>Practice with the dated preseason board</span>
                </label>
              ) : null}
            </SeasonalScopeNote>
          </div>
        </div>
      ) : null}

      {showSetup && (
        <div className="c97-sheet" data-c97-surface="paper" data-seam={showScopeNote ? undefined : "torn"}>
        <div className="c97-shell c97-frame" style={{ paddingTop: "var(--c97-sp-0)", paddingBottom: "var(--c97-sp-5)", maxWidth: 700 }}>
          <div
            className="overflow-hidden border"
            style={{ borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
          >
            <div
              className="flex flex-wrap items-baseline justify-between border-b"
              style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)" }}
            >
              <div className="min-w-0">
                <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
                  Room setup
                </p>
                <h2 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
                  Rep the rounds that decide leagues.
                </h2>
              </div>
              {roomSetupOpen && state.status !== "setup" && (
                <button
                  type="button"
                  onClick={() => setRoomSetupOpen(false)}
                  className={PILL_BUTTON_CLASS}
                >
                  Back to room <span className="c97-arrow" aria-hidden="true">→</span>
                </button>
              )}
            </div>

            {/* The room summary and Start sit directly under the heading, so
                the default room starts without scrolling past its settings.
                The summary reads the form, so it follows every change made in
                the fields below it. */}
            <div
              className="flex flex-wrap items-center justify-between border-b"
              style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)", background: "var(--c97-surface)" }}
            >
              <p className="m-0 font-mono text-2xs leading-relaxed" style={{ color: "var(--c97-ink-2)" }}>
                {`${setupForm.totalTeams}-team ${setupForm.draftType} · ${
                  setupForm.slot === 0 ? "random slot" : `slot ${setupForm.slot}`
                } · ${setupForm.rounds}-round rep · ${scoringLabel} · ${lineupShort(setupForm.lineup)}`}
              </p>
              <button
                type="button"
                onClick={startRoom}
                disabled={!simulationAvailable}
                className={SOLID_BUTTON_CLASS}
              >
                Start mock
              </button>
            </div>

            {/* Why Start is paused, kept against the button it explains. */}
            {boardStatusLine && (
              <p
                role="status"
                aria-live="polite"
                className="m-0 border-b text-sm leading-6"
                style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", borderColor: "var(--c97-rule)", color: "var(--c97-ink-2)" }}
              >
                {boardStatusLine}
                {error && (
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex min-h-touch items-center font-semibold underline underline-offset-4 hover:decoration-[var(--c97-accent)]" style={{ marginLeft: "var(--c97-sp-1)" }}
                  >
                    Retry
                  </button>
                )}
              </p>
            )}

            <div
              className="grid"
              style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-2)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))" }}
            >
              <label className="grid content-start" style={{ gap: "var(--c97-sp-0)" }}>
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
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
                  className="min-h-touch border font-mono text-xs"
                  style={{
                    paddingInline: "var(--c97-sp-1)",
                    borderColor: "var(--c97-rule)",
                    background: "var(--c97-surface)",
                    color: "var(--c97-ink)",
                  }}
                >
                  {TEAM_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} teams
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid content-start" style={{ gap: "var(--c97-sp-0)" }}>
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                  Your slot
                </span>
                <select
                  value={setupForm.slot}
                  onChange={(event) =>
                    setSetupForm((form) => ({ ...form, slot: Number(event.target.value) }))
                  }
                  className="min-h-touch border font-mono text-xs"
                  style={{
                    paddingInline: "var(--c97-sp-1)",
                    borderColor: "var(--c97-rule)",
                    background: "var(--c97-surface)",
                    color: "var(--c97-ink)",
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

              <label className="grid content-start" style={{ gap: "var(--c97-sp-0)" }}>
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                  Rounds · early rep
                </span>
                <select
                  value={setupForm.rounds}
                  onChange={(event) =>
                    setSetupForm((form) => ({ ...form, rounds: Number(event.target.value) }))
                  }
                  className="min-h-touch border font-mono text-xs"
                  style={{
                    paddingInline: "var(--c97-sp-1)",
                    borderColor: "var(--c97-rule)",
                    background: "var(--c97-surface)",
                    color: "var(--c97-ink)",
                  }}
                >
                  {ROUND_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} rounds
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid content-start" style={{ gap: "var(--c97-sp-0)" }}>
                <span id={scoringLabelId} className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                  Scoring
                </span>
                <SegmentedButtons
                  labelledBy={scoringLabelId}
                  options={SCORING_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={scoringSelection}
                  onSelect={setScoringSelection}
                />
              </div>

              <div className="grid content-start" style={{ gap: "var(--c97-sp-0)" }}>
                <span id={orderLabelId} className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                  Draft order
                </span>
                <SegmentedButtons
                  labelledBy={orderLabelId}
                  options={ORDER_OPTIONS}
                  value={setupForm.draftType}
                  onSelect={(draftType) => setSetupForm((form) => ({ ...form, draftType }))}
                />
              </div>

              <div className="grid content-start" style={{ gap: "var(--c97-sp-0)" }}>
                <span id={temperLabelId} className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                  Room temper
                </span>
                <SegmentedButtons
                  labelledBy={temperLabelId}
                  options={TEMPER_OPTIONS}
                  value={setupForm.temper}
                  onSelect={(temper) => setSetupForm((form) => ({ ...form, temper }))}
                />
                <p className="m-0 font-mono text-3xs leading-relaxed" style={{ color: "var(--c97-ink-2)" }}>
                  {TEMPER_NOTES[setupForm.temper]}
                </p>
              </div>
            </div>

            <div style={{ paddingInline: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-2)" }}>
              <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ marginBottom: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
                Starting lineup
              </p>
              <div
                className="grid"
                style={{ gap: "var(--c97-sp-1)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))" }}
              >
                {REDRAFT_LINEUP_PRESETS.map((preset) => {
                  const active = sameRedraftLineup(preset.lineup, setupForm.lineup);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setSetupForm((form) => ({ ...form, lineup: { ...preset.lineup } }))
                      }
                      className={`min-h-[56px] border text-left ${
                        active ? "" : "bg-[var(--c97-surface)] hover:bg-[var(--c97-overlay)]"
                      }`}
                      style={
                        { paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)", ...(active
                          ? {
                              borderColor: "var(--c97-ink)",
                              background: "var(--c97-ink)",
                              color: "var(--c97-surface)",
                            }
                          : {
                              borderColor: "var(--c97-rule)",
                              color: "var(--c97-ink)",
                            }) }
                      }
                    >
                      <span className="block text-sm font-semibold tracking-[-0.01em]">
                        {preset.label}
                      </span>
                      <span
                        className="mt-0.5 block font-mono text-3xs tracking-[0.04em]"
                        style={{
                          color: active
                            ? "color-mix(in srgb, var(--c97-surface) 75%, transparent)"
                            : "var(--c97-ink-2)",
                        }}
                      >
                        {lineupShort(preset.lineup)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <p className="mx-0.5 font-mono text-2xs leading-relaxed" style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}>
            The room drafts around you, so you are on the clock every turn. Each run is a fresh
            seeded room with the same settings, and nothing here is a projection of season
            outcomes.
          </p>
        </div>
        </div>
      )}

      {isLive && (
        <div className="c97-sheet" data-c97-surface="paper" data-seam={showScopeNote ? undefined : "torn"}>
          <section
            ref={stripRef}
            aria-label="Live mock draft status"
            className={`sticky ${FASCIA_TOP_CLASS} z-30 border-y`}
            style={{
              borderColor: "var(--c97-rule)",
              // Opaque on the sheet it sits on (paper), matching the boards'
              // own sticky bars rather than a translucent blur.
              background: "var(--c97-surface)",
            }}
          >
            <div className={SHELL_CLASS}>
              {/*
                The readouts and the actions used to share one auto-fit grid, so
                the row stretched to the stacked pills (160px) at every width and
                the grid's painted background showed through empty tracks once
                the cells wrapped. Now the readouts are their own row of cells
                with hairlines between them, the actions sit beside them from lg
                and under them below that, and below md the four readouts
                collapse to one wrapping mono line so nothing truncates.
              */}
              <div
                className="border-x lg:flex lg:items-stretch"
                style={{ borderColor: "var(--c97-rule)", background: "var(--c97-surface)" }}
              >
                <dl
                  className="m-0 hidden min-w-0 md:grid lg:flex-1"
                  style={{ gridTemplateColumns: `repeat(${fasciaCells.length}, minmax(0, 1fr))` }}
                >
                  {fasciaCells.map((cell, index) => (
                    <div
                      key={cell.key}
                      className={`min-w-0 ${index > 0 ? "border-l" : ""}`}
                      style={{
                        paddingInline: "var(--c97-sp-1)",
                        paddingBlock: "var(--c97-sp-1)",
                        background: cell.background ?? "var(--c97-surface)",
                        borderColor: "var(--c97-rule)",
                      }}
                    >
                      <dt className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
                        {cell.label}
                      </dt>
                      <dd
                        className="m-0 font-mono text-lg leading-tight tabular-nums"
                        style={{ marginTop: "var(--c97-sp-0)", color: cell.valueColor ?? "var(--c97-ink)" }}
                      >
                        {cell.value}
                      </dd>
                      <dd
                        className="m-0 mt-0.5 font-mono text-3xs leading-snug"
                        style={{ color: "var(--c97-ink-2)" }}
                      >
                        {cell.sub}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p
                  className="m-0 flex flex-wrap items-baseline gap-y-0.5 font-mono text-xs tabular-nums md:hidden"
                  style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)", columnGap: "var(--c97-sp-1)", color: "var(--c97-ink)" }}
                >
                  {fasciaCells.map((cell, index) => (
                    <span
                      key={cell.key}
                      className="whitespace-nowrap"
                      style={{ color: cell.valueColor ?? "var(--c97-ink)" }}
                    >
                      {index > 0 && (
                        <span aria-hidden="true" style={{ color: "var(--c97-ink-2)" }}>
                          ·{" "}
                        </span>
                      )}
                      {cell.compactPrefix && <span className="sr-only">{cell.compactPrefix} </span>}
                      {cell.compact}
                    </span>
                  ))}
                </p>
                <div
                  className="flex flex-wrap items-center border-t lg:flex-none lg:border-l lg:border-t-0"
                  style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-0)", gap: "var(--c97-sp-0)", borderColor: "var(--c97-rule)" }}
                >
                  <button
                    type="button"
                    onClick={takeBackPick}
                    disabled={!hasUserPick}
                    aria-label={hasUserPick ? "Take back your last pick" : "Take back (no picks yet)"}
                    className={PILL_BUTTON_CLASS}
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
                    onClick={finishRoom}
                    disabled={!simulationAvailable}
                    aria-label="Sim to end, which finishes the room with no take back"
                    title="The engine finishes every remaining pick, including yours, and the room goes straight to the recap. Nothing takes that back."
                    className={PILL_BUTTON_CLASS}
                    style={WARNING_CARD_STYLE}
                  >
                    Sim to end <span aria-hidden="true">⇥</span>
                  </button>
                  <button
                    type="button"
                    onClick={openSetup}
                    className={PILL_BUTTON_CLASS}
                    style={{ color: "var(--c97-ink-2)" }}
                  >
                    New mock
                  </button>
                </div>
              </div>
            </div>
          </section>

          {!simulationAvailable && (
            <div className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-1)" }}>
              <div
                role="alert"
                className="border text-sm leading-6"
                style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", ...(WARNING_CARD_STYLE) }}
              >
                {boardStatusLine} {pauseRecovery}
                {boardReloadable && (
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex min-h-touch items-center font-semibold underline underline-offset-4 hover:decoration-[var(--c97-accent)]" style={{ marginLeft: "var(--c97-sp-1)" }}
                  >
                    Reload the board
                  </button>
                )}
              </div>
            </div>
          )}

          {tapePicks.length > 0 && (
            <div
              role="group"
              aria-label="Room picks since your last turn"
              className={`${SHELL_CLASS} flex items-center overflow-x-auto`} style={{ paddingTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
            >
              <span className={`${MONO_LABEL_CLASS} flex-none`} style={{ color: "var(--c97-ink-2)" }}>
                Since your last pick
              </span>
              {tapePicks.map((pick) => (
                <span
                  key={`tape-${pick.pickNumber}`}
                  className="inline-flex flex-none items-baseline border py-0.5 font-mono text-2xs"
                  style={{
                    paddingInline: "var(--c97-sp-1)",
                    gap: "var(--c97-sp-0)",
                    borderColor: "var(--c97-rule)",
                    background: "var(--c97-field)",
                    color: "var(--c97-ink)",
                  }}
                >
                  <span style={{ color: "var(--c97-ink-2)" }}>#{pick.pickNumber}</span>
                  <span className="font-sans text-xs font-semibold tracking-[-0.01em]">
                    {shortName(pick.player)}
                  </span>
                  <span style={{ color: "var(--c97-ink-2)" }}>
                    {pick.player.position} · S{pick.teamNumber}
                  </span>
                </span>
              ))}
            </div>
          )}

          <section
            aria-label="Your roster"
            className={`${SHELL_CLASS} flex flex-wrap items-center`} style={{ paddingTop: "var(--c97-sp-1)", gap: "var(--c97-sp-0)" }}
          >
            <span className={`${MONO_LABEL_CLASS} flex-none`} style={{ color: "var(--c97-ink-2)" }}>
              Your roster
            </span>
            {lineupAssignment.slots.map((slot, index) => (
              <span
                key={`slot-${slot.slot}-${index}`}
                className="inline-flex items-baseline border py-0.5 font-mono text-3xs uppercase tracking-[0.06em]"
                style={
                  { paddingInline: "var(--c97-sp-0)", gap: "var(--c97-sp-0)", ...(slot.player
                    ? {
                        borderStyle: "solid",
                        borderColor: "var(--c97-rule)",
                        background: "var(--c97-field)",
                        color: "var(--c97-ink-2)",
                      }
                    : {
                        borderStyle: "dashed",
                        borderColor: "color-mix(in srgb, var(--c97-rule) 80%, transparent)",
                        background: "transparent",
                        color: "var(--c97-ink-2)",
                      }) }
                }
              >
                {slot.slot}
                {slot.player ? (
                  <span
                    className="font-sans text-xs font-semibold normal-case tracking-[-0.01em]"
                    style={{ color: "var(--c97-ink)" }}
                  >
                    {shortName(slot.player)}
                  </span>
                ) : (
                  <span className="normal-case">open</span>
                )}
              </span>
            ))}
            {lineupAssignment.bench > 0 && (
              <span className="font-mono text-3xs" style={{ color: "var(--c97-ink-2)" }}>
                +{lineupAssignment.bench} bench
              </span>
            )}
          </section>

          {/*
            focusClock sets this panel's scroll margin to the sticky strip's
            measured height before it calls focus(), so the panel lands under
            the strip rather than behind it. The site header scrolls away.
          */}
          <section
            ref={onClockRef}
            tabIndex={-1}
            aria-label="You are on the clock"
            className={SHELL_CLASS} style={{ marginTop: "var(--c97-sp-2)" }}
          >
            <div
              className="overflow-hidden border"
              style={{
                borderColor: "color-mix(in srgb, var(--c97-accent) 45%, var(--c97-rule))",
                background: "color-mix(in srgb, var(--c97-accent) 7%, var(--c97-surface))",
              }}
            >
              <div
                className="flex flex-wrap items-baseline border-b"
                style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)", borderColor: "color-mix(in srgb, var(--c97-accent) 28%, var(--c97-rule))" }}
              >
                <span
                  className="inline-flex items-center font-mono text-2xs uppercase tracking-[0.12em]"
                  style={{ gap: "var(--c97-sp-1)", color: "color-mix(in srgb, var(--c97-accent) 72%, var(--c97-ink))" }}
                >
                  <span
                    className="h-[7px] w-[7px]"
                    style={{ background: "var(--c97-accent)" }}
                    aria-hidden="true"
                  />
                  You&apos;re up
                </span>
                <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
                  {`Pick #${currentPick} · round ${currentRound} of ${settings.rounds} · the room resumes the moment you draft`}
                </span>
              </div>
              <div className="flex flex-wrap items-center" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-0)" }}>
                {quickPicks.map((quick) => (
                  <button
                    key={quick.key}
                    type="button"
                    onClick={() => draftPlayer(quick.player)}
                    title={quick.title}
                    className="inline-flex min-h-touch items-center border border-[var(--c97-rule)] font-mono text-2xs hover:border-[var(--c97-ink)]"
                    style={{
                      paddingInline: "var(--c97-sp-2)",
                      gap: "var(--c97-sp-1)",
                      background: "var(--c97-surface)",
                      color: "var(--c97-ink)",
                    }}
                  >
                    <span
                      className="text-3xs uppercase tracking-[0.1em]"
                      style={{ color: "var(--c97-accent)" }}
                    >
                      {quick.tag}
                    </span>
                    <span className="font-sans text-xs font-semibold tracking-[-0.01em]">
                      {shortName(quick.player)}
                    </span>
                    <span style={{ color: "var(--c97-ink-2)" }}>{quick.sub}</span>
                  </button>
                ))}
                <span className="font-mono text-3xs" style={{ color: "var(--c97-ink-2)" }}>
                  or draft from the board <span aria-hidden="true">↓</span>
                </span>
              </div>
            </div>
          </section>

          <div className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-4)" }}>
            <h2 className="sr-only">Available players</h2>
            <div className="flex flex-wrap items-center" style={{ paddingBottom: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)" }}>
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
                className="min-h-touch w-[190px] border font-mono text-xs placeholder:text-[var(--c97-ink-2)]"
                style={{
                  paddingInline: "var(--c97-sp-1)",
                  borderColor: "var(--c97-rule)",
                  background: "var(--c97-field)",
                  color: "var(--c97-ink)",
                }}
              />
              <span
                className="ml-auto whitespace-nowrap font-mono text-2xs"
                style={{ color: "var(--c97-ink-2)" }}
              >
                {filteredAvailable.length} of {availablePlayers.length} available
              </span>
            </div>

            {/*
              Column labels for md and up, where the values sit in fixed-width
              columns under them. Below md the rows wrap and each value carries
              its own micro label instead, so the row stays hidden there.
            */}
            {windowedPlayers.length > 0 && adpAvailable && (
              <div
                aria-hidden="true"
                className={`hidden items-center md:flex ${MONO_LABEL_CLASS}`}
                style={{ paddingInline: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-0)", columnGap: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
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
                  ? `color-mix(in srgb, var(--c97-accent) ${getTierRailIntensity(group.tier)}%, var(--c97-rule))`
                  : "var(--c97-rule)";
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
                    <div aria-hidden="true" className="flex items-center px-0.5" style={{ paddingBottom: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                      <span
                        className="flex-1 border-t border-dashed"
                        style={{ borderColor: "color-mix(in srgb, var(--c97-ink) 24%, transparent)" }}
                      />
                      <span
                        className="whitespace-nowrap font-mono text-3xs uppercase tracking-[0.12em]"
                        style={{ color: "var(--c97-accent)" }}
                      >
                        ↓ {cliff.toFixed(1)} avg-rank cliff
                      </span>
                      <span
                        className="flex-1 border-t border-dashed"
                        style={{ borderColor: "color-mix(in srgb, var(--c97-ink) 24%, transparent)" }}
                      />
                    </div>
                  )}
                  <div
                    className="overflow-hidden border border-l-[3px]"
                    style={{
                      borderColor: "var(--c97-rule)",
                      borderLeftColor: railTone,
                      background: "var(--c97-field)",
                    }}
                  >
                    <div className="flex flex-wrap items-baseline" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-1)", paddingBottom: "var(--c97-sp-0)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)" }}>
                      <span className="text-2xl font-bold leading-none tracking-[-0.04em] tabular-nums">
                        {group.tier !== null ? String(group.tier).padStart(2, "0") : "—"}
                      </span>
                      <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                        {group.tier !== null ? "Tier" : "No published tier"}
                      </span>
                      <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
                        {group.rows.length} left
                      </span>
                      <span className="ml-auto font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
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
                            className="flex flex-wrap items-center border-t"
                            style={{
                              paddingInline: "var(--c97-sp-2)",
                              paddingBlock: "var(--c97-sp-0)",
                              columnGap: "var(--c97-sp-2)",
                              rowGap: "var(--c97-sp-0)",
                              borderColor: "color-mix(in srgb, var(--c97-rule) 60%, transparent)",
                            }}
                          >
                            <span
                              className="w-[34px] shrink-0 text-right font-mono text-sm font-medium"
                              title="Overall board rank"
                            >
                              {formatRankValue(player.rankEcr ?? player.averageRank)}
                            </span>
                            <div className="flex min-w-0 flex-1 basis-44 items-baseline" style={{ gap: "var(--c97-sp-1)" }}>
                              <span className="truncate text-sm font-semibold tracking-[-0.02em]">
                                {player.name}
                              </span>
                              <span
                                className="inline-flex shrink-0 items-center border py-0.5 font-mono text-3xs tracking-[0.06em]"
                                style={{ paddingInline: "var(--c97-sp-0)", ...(positionTone) }}
                              >
                                {player.position}
                                {player.positionRank ?? ""}
                              </span>
                              <span
                                className="shrink-0 font-mono text-3xs uppercase tracking-[0.06em]"
                                style={{ color: "var(--c97-ink-2)" }}
                              >
                                {player.team}
                                {player.byeWeek ? ` · Bye ${player.byeWeek}` : ""}
                              </span>
                            </div>
                            <div className="flex flex-none items-center" style={{ columnGap: "var(--c97-sp-2)" }}>
                              {adpAvailable && (
                                <>
                                  <span className="sr-only">ADP</span>
                                  <span
                                    className="w-auto text-right font-mono text-xs md:w-11"
                                    style={{ color: "var(--c97-ink-2)" }}
                                    title="Average draft position in mock rooms"
                                  >
                                    <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
                                      ADP{" "}
                                    </span>
                                    {formatAdp(player.adp)}
                                  </span>
                                  <span className="sr-only">versus ADP at pick {currentPick}</span>
                                  <span
                                    className="w-auto text-right font-mono text-xs md:w-14"
                                    style={{ color: delta?.color ?? "var(--c97-ink-2)" }}
                                    title={delta?.title ?? "No reliable market sample for this player"}
                                  >
                                    <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
                                      At #{currentPick}{" "}
                                    </span>
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
                className="border border-dashed text-center"
                style={{ paddingInline: "var(--c97-sp-3)", paddingBlock: "var(--c97-sp-3)", borderColor: "var(--c97-rule)" }}
              >
                <p className="m-0 font-mono text-xs" style={{ marginBottom: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}>
                  No available players match on this board.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPositionFilter("ALL");
                  }}
                  className={SOLID_BUTTON_CLASS}
                >
                  Clear search
                </button>
              </div>
            )}
            {filteredAvailable.length > VISIBLE_BOARD_ROWS && (
              <p className="font-mono text-3xs" style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
                Showing the top {VISIBLE_BOARD_ROWS} of {filteredAvailable.length} available
                players. Search or filter to reach the rest.
              </p>
            )}

            <div
              className="flex flex-wrap items-baseline justify-between border-t"
              style={{ paddingTop: "var(--c97-sp-2)", marginTop: "var(--c97-sp-3)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)" }}
            >
              <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
                Take a pick back and the same room replays · sim to end finishes the room and
                cannot be taken back · nothing leaves this device
              </span>
              {footerLinks}
            </div>
          </div>
        </div>
      )}

      {isRecap && (
        <div className="c97-sheet" data-c97-surface="paper" data-seam={showScopeNote ? undefined : "torn"}>
        <div className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-0)", paddingBottom: "var(--c97-sp-4)" }}>
          <section
            ref={valueReportRef}
            tabIndex={-1}
            aria-label="Value report"
            className="flex flex-wrap overflow-hidden border"
            style={{ marginTop: "var(--c97-sp-1)", borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
          >
            <div
              className="w-full border-b sm:w-[200px] sm:border-b-0 sm:border-r"
              style={{
                padding: "var(--c97-sp-2)",
                borderColor: "var(--c97-rule)",
                background: "color-mix(in srgb, var(--c97-accent) 6%, var(--c97-surface))",
              }}
            >
              <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
                Draft grade
              </p>
              <p
                className="m-0 text-5xl font-bold leading-none tracking-[-0.05em]"
                style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-accent)" }}
              >
                {recap.grade ?? "—"}
              </p>
              <p className="m-0 font-mono text-2xs" style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink)" }}>
                {recap.judged.length > 0
                  ? `${formatPickDelta(recap.total)} vs the draft baseline`
                  : "no judged picks"}
              </p>
              <p className="m-0 font-mono text-3xs leading-relaxed" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}>
                {recap.judged.length > 0
                  ? `summed pick delta vs the ADP-or-consensus baseline across ${recap.judged.length} of your ${userPicks.length} picks`
                  : "no pick had a market or consensus baseline to score against"}
              </p>
            </div>
            <div
              className="grid min-w-0 flex-1 basis-[340px] gap-px"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
                background: "var(--c97-rule)",
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
                          ? "var(--c97-positive)"
                          : "var(--c97-ink-2)",
                    }
                  : {
                      label: "Your best pick",
                      value: "—",
                      sub: "no judged picks",
                      subColor: "var(--c97-ink-2)",
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
                      subColor: "var(--c97-warning)",
                    }
                  : {
                      label: "Biggest room reach",
                      value: "None",
                      sub: "no pick cleared the reach threshold",
                      subColor: "var(--c97-ink-2)",
                    },
                {
                  label: "Your shape",
                  value: recap.shape || "—",
                  sub: `${userPicks.length} picks · ${
                    lineupAssignment.bench > 0
                      ? `${lineupAssignment.bench} to bench`
                      : "all starters"
                  }`,
                  subColor: "var(--c97-ink-2)",
                },
                {
                  label: "Room temper",
                  value: TEMPER_LABELS[settings.temper],
                  sub: `seeded room #${roomLabel(state.seed)}`,
                  subColor: "var(--c97-ink-2)",
                },
              ].map((fact) => (
                <div
                  key={fact.label}
                  className="min-w-0"
                  style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", background: "var(--c97-field)" }}
                >
                  <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
                    {fact.label}
                  </p>
                  <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold tracking-[-0.02em]" style={{ marginTop: "var(--c97-sp-0)" }}>
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
            className="overflow-hidden border"
            style={{ marginTop: "var(--c97-sp-2)", borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
          >
            <div className="flex flex-wrap items-baseline" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)" }}>
              <h2 className="c97-serif c97-h3">The board</h2>
              <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
                {`room #${roomLabel(state.seed)} · ${settings.draftType} order · your column outlined`}
              </span>
            </div>
            {/*
              A real table, not a grid of divs. The grid version handed a screen
              reader a flat run of "#3 · RB", "Ja'Marr Chase" with no way to
              tell which round row or team column a pick belonged to, the same
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
                  borderColor: "var(--c97-rule)",
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
                    <th scope="col" className="border-t p-0" style={{ borderColor: "var(--c97-rule)", background: "var(--c97-surface)" }}>
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
                          className="whitespace-nowrap border-l border-t text-center font-mono text-3xs font-normal uppercase tracking-[0.1em]"
                          style={{
                            paddingInline: "var(--c97-sp-1)",
                            paddingBlock: "var(--c97-sp-0)",
                            borderColor: "var(--c97-rule)",
                            background: isUser
                              ? "color-mix(in srgb, var(--c97-accent) 10%, var(--c97-surface))"
                              : "var(--c97-surface)",
                            color: isUser
                              ? "color-mix(in srgb, var(--c97-accent) 72%, var(--c97-ink))"
                              : "var(--c97-ink-2)",
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
                          borderColor: "var(--c97-rule)",
                          background: "var(--c97-surface)",
                          color: "var(--c97-ink-2)",
                        }}
                      >
                        R{row.round}
                      </th>
                      {row.cells.map((cell) => (
                        <td
                          key={`cell-${cell.pickNumber}`}
                          className="min-w-0 border-l border-t align-top"
                          style={{
                            paddingInline: "var(--c97-sp-1)",
                            paddingBlock: "var(--c97-sp-0)",
                            borderColor: "var(--c97-rule)",
                            background: cell.pick
                              ? (getPositionTone(cell.pick.player.position).background as string)
                              : "var(--c97-surface)",
                            boxShadow:
                              cell.slot === settings.userTeam
                                ? "inset 0 0 0 1px color-mix(in srgb, var(--c97-accent) 55%, transparent)"
                                : undefined,
                          }}
                        >
                          {/* 10px muted on the position washes measured 4.16 to 4.41:1 in
                              light and 4.16 on the TE wash in dark. Mixing the muted tone
                              72% toward ink clears 4.5:1 on every wash in both themes while
                              the name line below stays the darker of the two. */}
                          <p
                            className="m-0 font-mono text-3xs tracking-[0.04em]"
                            style={{ color: RECAP_CELL_LABEL_COLOR }}
                          >
                            #{cell.pickNumber} · {cell.pick?.player.position ?? "—"}
                          </p>
                          <p
                            className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold tracking-[-0.01em]"
                            style={{ color: cell.pick ? "var(--c97-ink)" : "var(--c97-ink-2)" }}
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

          <div role="group" className="flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-0)" }} aria-label="Your haul">
            <span className={`${MONO_LABEL_CLASS} flex-none`} style={{ color: "var(--c97-ink-2)" }}>
              Your haul
            </span>
            {userPicks.map((pick) => {
              const delta = getPickDelta(pick);
              const verdict = classifyPickValue(pick);
              return (
                <span
                  key={`haul-${pick.pickNumber}`}
                  className="inline-flex items-baseline border py-0.5 font-mono text-2xs"
                  style={{
                    paddingInline: "var(--c97-sp-1)",
                    gap: "var(--c97-sp-0)",
                    borderColor: "var(--c97-rule)",
                    background: "var(--c97-field)",
                    color: "var(--c97-ink)",
                  }}
                >
                  <span style={{ color: "var(--c97-ink-2)" }}>#{pick.pickNumber}</span>
                  <span className="font-sans text-xs font-semibold tracking-[-0.01em]">
                    {shortName(pick.player)}
                  </span>
                  {delta !== null && (
                    <span
                      style={{
                        color:
                          verdict === "steal"
                            ? "var(--c97-positive)"
                            : verdict === "reach"
                              ? "var(--c97-warning)"
                              : "var(--c97-ink-2)",
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
              className="m-0 border text-sm leading-6"
              style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)", ...(WARNING_CARD_STYLE) }}
            >
              {boardStatusLine} {rerunRecovery}
              {boardReloadable && (
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex min-h-touch items-center font-semibold underline underline-offset-4 hover:decoration-[var(--c97-accent)]" style={{ marginLeft: "var(--c97-sp-1)" }}
                >
                  Reload the board
                </button>
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
            <button
              type="button"
              onClick={rerunRoom}
              disabled={!simulationAvailable}
              aria-describedby={simulationAvailable ? undefined : "mock-rerun-blocked"}
              className={SOLID_BUTTON_CLASS}
            >
              Run it back <span className="c97-arrow" aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={openSetup}
              className={PILL_BUTTON_CLASS}
            >
              Change setup
            </button>
            <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
              same settings, fresh room · grades score every pick against the same baseline
            </span>
          </div>

          <div
            className="flex flex-wrap items-baseline justify-between border-t"
            style={{ paddingTop: "var(--c97-sp-2)", marginTop: "var(--c97-sp-3)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)" }}
          >
            <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
              Practice reps only, with no prediction in them · rooms stay on this device
            </span>
            {footerLinks}
          </div>
        </div>
        </div>
      )}
    </section>
  );
}
