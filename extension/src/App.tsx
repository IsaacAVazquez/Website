import {
  Activity,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleDot,
  Copy,
  Database,
  Plane,
  Power,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Undo2,
  UserRound,
  UsersRound,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeBestBallRoster,
  getNextUserPick,
  BEST_BALL_CONTEST_ORDER,
  BEST_BALL_CONTESTS,
  getBestBallModelSourceIssue,
  getBestBallRankingSource,
  getAdaptiveRosterTargets,
  hasSupportedBestBallAdp,
  sortBestBallRankings,
  type BestBallContestId,
  type BestBallRosterAnalysis,
} from "@/lib/bestBall";
import {
  addFantasyCompanionPick,
  buildAwayDraftPlan,
  createBestBallRoomConfig,
  createFantasyCompanionState,
  createRedraftRoomConfig,
  detectFantasyDraftProvider,
  formatAwayDraftPlan,
  getAvailablePlayers,
  getCurrentPickNumber,
  getCurrentTeamNumber,
  getDraftRoundForPick,
  getFantasyCompanionRecommendations,
  getTeamPicks,
  isFantasyDraftSyncMessage,
  parseFantasyCompanionState,
  reconcileFantasyDraftSync,
  resetFantasyCompanionDraft,
  serializeFantasyCompanionState,
  undoFantasyCompanionPick,
  type FantasyCompanionDraftOrder,
  type FantasyCompanionDraftState,
  type FantasyCompanionRoomConfig,
  type FantasyDraftSyncMessage,
  type AwayDraftPlan,
} from "@/lib/fantasyCompanion";
import {
  getFantasySourceCapabilities,
  resolveDraftPicksForModel,
  withoutPlayerAdp,
} from "@/lib/fantasyUtils";
import {
  countRedraftStartingSlots,
  DEFAULT_REDRAFT_LINEUP,
  getRedraftRosterTarget,
  normalizeRedraftLineup,
  REDRAFT_LINEUP_PRESETS,
} from "@/lib/redraftLineup";
import {
  calculateRedraftDraftDecision,
  type RedraftDraftDecisionReport,
  describeRedraftNeed,
  describeRedraftTier,
  describeRedraftWait,
} from "@/lib/redraftDraftDecision";
import {
  buildFantasyVorpIndex,
  isFantasyVorpTeamSize,
  type FantasyVorpRankingEntry,
} from "@/lib/fantasyVorp";
import {
  calculateBestBallDraftValues,
  calculateRedraftDraftValues,
  type DraftValueReport,
} from "@/lib/fantasyTeamValue";
import type {
  DraftPick,
  Player,
  RedraftLineupSettings,
  ScoringFormat,
} from "@/types";
import {
  loadCompanionSnapshot,
  type CompanionSnapshot,
} from "./snapshot-client";
import type { AutoDraftCommand, AutoDraftStatus } from "./autodraft-controller";
import { readLocalValue, removeLocalValue, writeLocalValue } from "./storage";

const DRAFT_STORAGE_KEY = "fantasy-companion-draft-v1";
const SETUP_STORAGE_KEY = "fantasy-companion-setup-v2";
const LEGACY_SETUP_STORAGE_KEY = "fantasy-companion-setup-v1";
const BOARD_LIMIT = 60;
const REDRAFT_POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "K", "DST"] as const;
const BEST_BALL_POSITIONS = ["ALL", "QB", "RB", "WR", "TE"] as const;

type Platform = "espn" | "sleeper" | "underdog";
type AutoDraftPlatform = Exclude<Platform, "underdog">;
type AwayQueueEntry = {
  player: Player;
  rank: number;
};
type PositionFilter = (typeof REDRAFT_POSITIONS)[number];
type PanelView = "board" | "roster" | "picks";

interface SetupValues {
  platform: Platform;
  season: number;
  teams: number;
  rounds: number;
  userTeam: number;
  draftOrder: FantasyCompanionDraftOrder;
  scoring: ScoringFormat;
  contestId: BestBallContestId;
  lineup: RedraftLineupSettings;
}

const currentSeason = (() => {
  const now = new Date();
  return now.getUTCMonth() < 2 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
})();

const DEFAULT_SETUP: SetupValues = {
  platform: "espn",
  season: currentSeason,
  teams: 12,
  rounds: 15,
  userTeam: 1,
  draftOrder: "snake",
  scoring: "PPR",
  contestId: "bbm-vii",
  lineup: { ...DEFAULT_REDRAFT_LINEUP },
};

function parseSetupValues(value: unknown): SetupValues | null {
  if (!value || typeof value !== "object") return null;
  const setup = value as Partial<SetupValues>;
  const contestId = setup.contestId as BestBallContestId;
  const contest = BEST_BALL_CONTEST_ORDER.includes(contestId)
    ? BEST_BALL_CONTESTS[contestId]
    : null;
  const savedRoomShapeIsValid =
    setup.platform === "underdog" ||
    ([8, 10, 12, 14, 16].includes(Number(setup.teams)) &&
      [13, 14, 15, 16, 17, 18].includes(Number(setup.rounds)));
  const valid =
    (["espn", "sleeper", "underdog"] as const).includes(setup.platform as Platform) &&
    Number.isInteger(setup.season) && Number(setup.season) >= 2020 && Number(setup.season) <= 2100 &&
    savedRoomShapeIsValid &&
    Number.isInteger(setup.userTeam) &&
    Number(setup.userTeam) >= 1 &&
    (setup.draftOrder === "snake" || setup.draftOrder === "linear") &&
    ["PPR", "HALF_PPR", "STANDARD"].includes(String(setup.scoring)) &&
    contest !== null;
  if (!valid) return null;
  const isBestBall = setup.platform === "underdog";
  const teams = isBestBall ? (contest as NonNullable<typeof contest>).teams : Number(setup.teams);
  const rounds = isBestBall ? (contest as NonNullable<typeof contest>).rounds : Number(setup.rounds);
  return {
    platform: setup.platform as Platform,
    season: Number(setup.season),
    teams,
    rounds,
    userTeam: Math.min(Number(setup.userTeam), teams),
    draftOrder: isBestBall ? "snake" : setup.draftOrder as FantasyCompanionDraftOrder,
    scoring: isBestBall ? "HALF_PPR" : setup.scoring as ScoringFormat,
    contestId,
    lineup: normalizeRedraftLineup(setup.lineup),
  };
}

function setupFromRoom(
  room: FantasyCompanionRoomConfig,
  redraftPlatform: AutoDraftPlatform = "espn"
): SetupValues {
  return {
    platform: room.kind === "best-ball" ? "underdog" : redraftPlatform,
    season: room.season,
    teams: room.teams,
    rounds: room.rounds,
    userTeam: room.userTeam,
    draftOrder: room.draftOrder,
    scoring: room.scoring,
    contestId: room.kind === "best-ball" ? room.contestId : "bbm-vii",
    lineup:
      room.kind === "redraft"
        ? { ...room.lineup }
        : { ...DEFAULT_REDRAFT_LINEUP },
  };
}

function roomFromSetup(setup: SetupValues): FantasyCompanionRoomConfig {
  if (setup.platform === "underdog") {
    return createBestBallRoomConfig({
      season: setup.season,
      contestId: setup.contestId,
      userTeam: setup.userTeam,
    });
  }

  return createRedraftRoomConfig({
    season: setup.season,
    teams: setup.teams,
    rounds: setup.rounds,
    userTeam: setup.userTeam,
    draftOrder: setup.draftOrder,
    scoring: setup.scoring,
    lineup: setup.lineup,
  });
}

function sourceRank(player: Player, room: FantasyCompanionRoomConfig): number {
  if (room.kind === "best-ball" && room.contestId === "superflex") {
    return player.superflexRank ?? player.averageRank;
  }
  return room.kind === "best-ball"
    ? player.averageRank
    : player.rankEcr ?? player.averageRank;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function positionClass(position: Player["position"]): string {
  return `position position--${position.toLowerCase()}`;
}

function BrandMark() {
  return (
    <div className="brand" aria-label="Fantasy Draft Companion">
      <span className="brand__glyph" aria-hidden="true">
        <span>F</span>
        <span>D</span>
      </span>
      <span className="brand__type">
        <strong>Draft Companion</strong>
        <small>Room-side console</small>
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SetupPanel({
  setup,
  onChange,
  onStart,
  onPrepareAway,
}: {
  setup: SetupValues;
  onChange: (next: SetupValues) => void;
  onStart: () => void;
  onPrepareAway: () => void;
}) {
  const isBestBall = setup.platform === "underdog";
  const selectedContest = BEST_BALL_CONTESTS[setup.contestId];
  const teams = isBestBall ? selectedContest.teams : setup.teams;
  const clampedTeam = Math.min(setup.userTeam, teams);
  const starterSlots = countRedraftStartingSlots(setup.lineup);
  const lineupFitsDraft = isBestBall || starterSlots <= setup.rounds;
  const activeLineupPreset = REDRAFT_LINEUP_PRESETS.find((preset) =>
    (Object.keys(preset.lineup) as Array<keyof RedraftLineupSettings>).every(
      (position) => preset.lineup[position] === setup.lineup[position]
    )
  );

  useEffect(() => {
    if (clampedTeam !== setup.userTeam) onChange({ ...setup, userTeam: clampedTeam });
  }, [clampedTeam, onChange, setup]);

  return (
    <main className="setup-page">
      <header className="setup-header">
        <BrandMark />
        <span className="local-badge">
          <ShieldCheck size={14} aria-hidden="true" /> Browser local
        </span>
      </header>

      <section className="setup-intro">
        <p className="eyebrow">NEW DRAFT</p>
        <h1>Set up the room.</h1>
        <p>
          Match the room once, then use the live board beside your draft or prepare the provider tab to pick while you are away.
        </p>
      </section>

      <section className="setup-card" aria-labelledby="platform-heading">
        <div className="section-heading">
          <span className="section-index">01</span>
          <div>
            <h2 id="platform-heading">Draft platform</h2>
            <p>This changes the rankings and room rules.</p>
          </div>
        </div>
        <div className="platform-options">
          <button
            type="button"
            className={`platform-option ${setup.platform === "espn" ? "is-selected" : ""}`}
            onClick={() => onChange({ ...setup, platform: "espn", userTeam: 1 })}
          >
            <span className="platform-option__top">
              <UsersRound size={20} aria-hidden="true" />
              {setup.platform === "espn" ? <Check size={18} aria-hidden="true" /> : null}
            </span>
            <strong>ESPN redraft</strong>
            <small>Scoring-specific consensus board</small>
          </button>
          <button
            type="button"
            className={`platform-option ${setup.platform === "sleeper" ? "is-selected" : ""}`}
            onClick={() => onChange({ ...setup, platform: "sleeper", userTeam: 1 })}
          >
            <span className="platform-option__top">
              <CircleDot size={20} aria-hidden="true" />
              {setup.platform === "sleeper" ? <Check size={18} aria-hidden="true" /> : null}
            </span>
            <strong>Sleeper redraft</strong>
            <small>Queue-first draft control</small>
          </button>
          <button
            type="button"
            className={`platform-option ${setup.platform === "underdog" ? "is-selected" : ""}`}
            onClick={() => onChange({ ...setup, platform: "underdog", teams: 12, rounds: 18, userTeam: 1 })}
          >
            <span className="platform-option__top">
              <Activity size={20} aria-hidden="true" />
              {setup.platform === "underdog" ? <Check size={18} aria-hidden="true" /> : null}
            </span>
            <strong>Underdog best ball</strong>
            <small>Contest-aware construction guidance</small>
          </button>
        </div>
      </section>

      {isBestBall ? (
        <section className="setup-card" aria-labelledby="contest-heading">
          <div className="section-heading">
            <span className="section-index">02</span>
            <div>
              <h2 id="contest-heading">Contest</h2>
              <p>Use the contest card shown in the Underdog lobby.</p>
            </div>
          </div>
          <div className="contest-options">
            {BEST_BALL_CONTEST_ORDER.map((contestId) => {
              const contest = BEST_BALL_CONTESTS[contestId];
              const selected = setup.contestId === contestId;
              return (
                <button
                  type="button"
                  key={contestId}
                  className={`contest-option ${selected ? "is-selected" : ""}`}
                  onClick={() => onChange({ ...setup, contestId })}
                >
                  <span>
                    <strong>{contest.shortName}</strong>
                    <small>{contest.competitionFormat}</small>
                  </span>
                  <em className={`mode-tag mode-tag--${contest.recommendationMode}`}>
                    {contest.recommendationMode === "exact" ? "Exact" : "Reference"}
                  </em>
                </button>
              );
            })}
          </div>
          <p className="rules-note">{selectedContest.rulesNote}</p>
        </section>
      ) : null}

      <section className="setup-card" aria-labelledby="room-heading">
        <div className="section-heading">
          <span className="section-index">{isBestBall ? "03" : "02"}</span>
          <div>
            <h2 id="room-heading">Room details</h2>
            <p>Your slot determines which picks land on your roster.</p>
          </div>
        </div>
        <div className="field-grid">
          {!isBestBall ? (
            <>
              <Field label="Scoring">
                <select
                  value={setup.scoring}
                  onChange={(event) => onChange({ ...setup, scoring: event.target.value as ScoringFormat })}
                >
                  <option value="PPR">PPR</option>
                  <option value="HALF_PPR">Half PPR</option>
                  <option value="STANDARD">Standard</option>
                </select>
              </Field>
              <Field label="Teams">
                <select
                  value={setup.teams}
                  onChange={(event) => {
                    const teamsValue = Number(event.target.value);
                    onChange({ ...setup, teams: teamsValue, userTeam: Math.min(setup.userTeam, teamsValue) });
                  }}
                >
                  {[8, 10, 12, 14, 16].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
              <Field label="Rounds">
                <select
                  value={setup.rounds}
                  onChange={(event) => onChange({ ...setup, rounds: Number(event.target.value) })}
                >
                  {[13, 14, 15, 16, 17, 18].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
              <Field label="Order">
                <select
                  value={setup.draftOrder}
                  onChange={(event) => onChange({ ...setup, draftOrder: event.target.value as FantasyCompanionDraftOrder })}
                >
                  <option value="snake">Snake</option>
                  <option value="linear">Linear</option>
                </select>
              </Field>
            </>
          ) : (
            <div className="locked-room" aria-label="Contest room structure">
              <span>{selectedContest.teams} teams</span>
              <span>{selectedContest.rounds} rounds</span>
              <span>Half PPR</span>
              <span>Snake</span>
            </div>
          )}
          <Field label="Your draft slot">
            <select
              value={clampedTeam}
              onChange={(event) => onChange({ ...setup, userTeam: Number(event.target.value) })}
            >
              {Array.from({ length: teams }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>Team {value}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {!isBestBall ? (
        <section className="setup-card" aria-labelledby="lineup-heading">
          <div className="section-heading">
            <span className="section-index">03</span>
            <div>
              <h2 id="lineup-heading">Starting lineup</h2>
              <p>The replacement index and roster needs use these exact slots.</p>
            </div>
          </div>
          <div className="lineup-presets" aria-label="Starting lineup presets">
            {REDRAFT_LINEUP_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={activeLineupPreset?.id === preset.id ? "is-selected" : ""}
                onClick={() => onChange({ ...setup, lineup: { ...preset.lineup } })}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="lineup-grid">
            <Field label="QB">
              <select value={1} disabled aria-label="Quarterback starters">
                <option value={1}>1</option>
              </select>
            </Field>
            {(
              [
                ["RB", [1, 2, 3]],
                ["WR", [1, 2, 3, 4]],
                ["TE", [1, 2]],
                ["FLEX", [0, 1, 2, 3]],
                ["K", [0, 1]],
                ["DST", [0, 1]],
              ] as const
            ).map(([lineupPosition, choices]) => (
              <Field key={lineupPosition} label={lineupPosition}>
                <select
                  value={setup.lineup[lineupPosition]}
                  onChange={(event) =>
                    onChange({
                      ...setup,
                      lineup: normalizeRedraftLineup({
                        ...setup.lineup,
                        [lineupPosition]: Number(event.target.value),
                      }),
                    })
                  }
                >
                  {choices.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <p className={`lineup-summary ${lineupFitsDraft ? "" : "is-invalid"}`}>
            {starterSlots} starting slots across {setup.rounds} rounds
            {lineupFitsDraft ? "." : ". Add rounds or remove starting slots before you begin."}
          </p>
        </section>
      ) : null}

      <div className="setup-actions">
        <button type="button" className="away-button" onClick={onPrepareAway} disabled={!lineupFitsDraft}>
          Prepare away draft <Plane size={19} aria-hidden="true" />
        </button>
        <button type="button" className="start-button" onClick={onStart} disabled={!lineupFitsDraft}>
          Start live companion <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>

      <aside className="access-note">
        <ShieldCheck size={20} aria-hidden="true" />
        <p>
          Everything here stays in this browser. Completed picks sync from the open provider room. ESPN and Sleeper pick submission stays off until you arm one draft tab, while Underdog uses its own Autopilot. Rankings, picks, and room settings stay in this browser.
        </p>
      </aside>
    </main>
  );
}

function draftProviderFromUrl(value: string | undefined): Platform | null {
  if (!value) return null;
  try {
    return detectFantasyDraftProvider(new URL(value).hostname);
  } catch {
    return null;
  }
}

async function requestActiveDraftSync(
  provider: Platform
): Promise<FantasyDraftSyncMessage | null> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) return null;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || draftProviderFromUrl(tab.url) !== provider) return null;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "FANTASY_DRAFT_SYNC_REQUEST",
    }) as unknown;
    return isFantasyDraftSyncMessage(response) ? response : null;
  } catch {
    return null;
  }
}

function isAutoDraftStatus(value: unknown): value is AutoDraftStatus {
  if (!value || typeof value !== "object") return false;
  const status = value as Partial<AutoDraftStatus>;
  return (
    status.type === "FANTASY_AUTODRAFT_STATUS" &&
    (status.provider === "espn" || status.provider === "sleeper") &&
    typeof status.message === "string" &&
    typeof status.armed === "boolean" &&
    typeof status.live === "boolean"
  );
}

async function sendAutoDraftCommand(
  provider: AutoDraftPlatform,
  command: AutoDraftCommand
): Promise<AutoDraftStatus> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    throw new Error("Load the built extension in Chrome or Edge before arming autodraft.");
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || draftProviderFromUrl(tab.url) !== provider) {
    const providerName = provider === "espn" ? "ESPN" : "Sleeper";
    throw new Error(`Open the ${providerName} draft room in this tab, then try again.`);
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, command) as unknown;
    if (!isAutoDraftStatus(response)) {
      throw new Error("The draft controller did not return a status.");
    }
    return response;
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message.includes("Receiving end")
        ? "Reload the draft tab once so the new controller can connect."
        : error instanceof Error
          ? error.message
          : "The draft controller could not connect to this tab.",
      { cause: error }
    );
  }
}

function AwayDraftView({
  setup,
  onBack,
}: {
  setup: SetupValues;
  onBack: () => void;
}) {
  const [snapshot, setSnapshot] = useState<CompanionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AutoDraftStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const room = useMemo(() => roomFromSetup(setup), [setup]);
  const providerName = setup.platform === "espn"
    ? "ESPN"
    : setup.platform === "sleeper"
      ? "Sleeper"
      : "Underdog";
  const isUnderdog = setup.platform === "underdog";
  const controlledProvider: AutoDraftPlatform | null =
    setup.platform === "espn" || setup.platform === "sleeper"
      ? setup.platform
      : null;

  useEffect(() => {
    let cancelled = false;
    loadCompanionSnapshot(room)
      .then((result) => {
        if (!cancelled) setSnapshot(result.snapshot);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Rankings could not be loaded."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [room]);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;
    const listener = (message: unknown) => {
      if (isAutoDraftStatus(message) && message.provider === controlledProvider) {
        setStatus(message);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [controlledProvider]);

  const plan: AwayDraftPlan | null = useMemo(() => {
    if (snapshot?.kind !== "redraft" || !controlledProvider) return null;
    return buildAwayDraftPlan(snapshot.data.overall, {
      platform: controlledProvider,
      teams: setup.teams,
      rounds: setup.rounds,
      lineup: setup.lineup,
    });
  }, [controlledProvider, setup.lineup, setup.rounds, setup.teams, snapshot]);

  const awayQueue: AwayQueueEntry[] = useMemo(() => {
    if (plan) return plan.queue;
    if (snapshot?.kind !== "best-ball") return [];
    return sortBestBallRankings(snapshot.data.players, setup.contestId)
      .slice(0, setup.teams * setup.rounds)
      .map((player) => ({ player, rank: player.bestBallRank }));
  }, [plan, setup.contestId, setup.rounds, setup.teams, snapshot]);

  const bestBallTargets = useMemo(
    () => isUnderdog ? getAdaptiveRosterTargets([], setup.contestId, 1) : null,
    [isUnderdog, setup.contestId]
  );

  const underdogSlate = useMemo(() => {
    switch (setup.contestId) {
      case "eliminator":
        return `NFL ${setup.season} Eliminator Season`;
      case "weekly-winners":
        return `NFL ${setup.season} Weekly Winners Season`;
      case "superflex":
        return `NFL ${setup.season} Superflex Season`;
      case "six-man":
        return `NFL ${setup.season} Season 6 Mans`;
      default:
        return `NFL ${setup.season} Season`;
    }
  }, [setup.contestId, setup.season]);

  const arm = async (live: boolean) => {
    if (!plan || !controlledProvider) return;
    if (
      live &&
      !window.confirm(
        `Arm live autodraft in the open ${providerName} tab? It will submit picks from this ranked queue when the page says it is your turn.`
      )
    ) {
      return;
    }
    setError(null);
    try {
      const nextStatus = await sendAutoDraftCommand(controlledProvider, {
        type: "FANTASY_AUTODRAFT_ARM",
        provider: controlledProvider,
        live,
        pickDelayMs: 2500,
        queue: plan.queue.map(({ player, rank }) => ({
          name: player.name,
          team: player.team,
          position: player.position,
          rank,
        })),
        rounds: setup.rounds,
        positionLimits: plan.positionLimits.map(({ position, maximum }) => ({ position, maximum })),
        roundRules: plan.roundRules,
      });
      setStatus(nextStatus);
    } catch (armError) {
      setError(
        armError instanceof Error
          ? armError.message
          : "Autodraft could not be armed."
      );
    }
  };

  const disarm = async () => {
    if (!controlledProvider) return;
    setError(null);
    try {
      const nextStatus = await sendAutoDraftCommand(controlledProvider, {
        type: "FANTASY_AUTODRAFT_DISARM",
        provider: controlledProvider,
      });
      setStatus(nextStatus);
    } catch (disarmError) {
      setError(
        disarmError instanceof Error
          ? disarmError.message
          : "Autodraft could not be disarmed."
      );
    }
  };

  const copyPlan = async () => {
    if (awayQueue.length === 0) return;
    try {
      await navigator.clipboard.writeText(
        isUnderdog
          ? awayQueue.map(({ player }) => player.name).join("\n")
          : formatAwayDraftPlan(plan as AwayDraftPlan)
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("The plan could not be copied. Keep this panel open while you enter it.");
    }
  };

  return (
    <main className="away-page">
      <header className="away-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Back to room setup">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <BrandMark />
        <span className="local-badge"><Plane size={14} aria-hidden="true" /> Away mode</span>
      </header>

      <section className="away-intro">
        <p className="eyebrow">{providerName.toUpperCase()} {isUnderdog ? "BEST BALL" : "REDRAFT"}</p>
        <h1>Set it before takeoff.</h1>
        <p>
          {isUnderdog
            ? `This prepares a ${BEST_BALL_CONTESTS[setup.contestId].shortName} ranking list for Underdog's own Autopilot.`
            : "The controller uses the scoring-specific board in this extension and acts only after the open draft page says it is your turn."}
        </p>
      </section>

      {isUnderdog ? (
        <section className="controller-card is-native" aria-labelledby="controller-heading">
          <div className="controller-card__status">
            <span className="controller-light controller-light--ready" aria-hidden="true" />
            <div>
              <h2 id="controller-heading">Native Autopilot</h2>
              <p>Paste these rankings once, set position limits, and turn on Autopilot in every draft room before takeoff.</p>
            </div>
          </div>
        </section>
      ) : (
        <section className={`controller-card ${status?.live && status.armed ? "is-live" : ""}`} aria-labelledby="controller-heading">
          <div className="controller-card__status">
            <span className={`controller-light controller-light--${status?.phase ?? "ready"}`} aria-hidden="true" />
            <div>
              <h2 id="controller-heading">Page controller</h2>
              <p>{status?.message ?? `Open the ${providerName} draft room in this tab, then run a dry test.`}</p>
            </div>
          </div>
          <div className="controller-actions">
            <button type="button" onClick={() => void arm(false)} disabled={!plan || loading}>
              Dry test
            </button>
            <button type="button" className="arm-live" onClick={() => void arm(true)} disabled={!plan || loading}>
              <Power size={16} aria-hidden="true" /> Arm live
            </button>
            {status?.armed ? (
              <button type="button" className="disarm-button" onClick={() => void disarm()}>
                Turn off
              </button>
            ) : null}
          </div>
        </section>
      )}

      {error ? <p className="away-error">{error}</p> : null}

      <aside className="risk-note">
        <ShieldCheck size={20} aria-hidden="true" />
        <p>
          {isUnderdog
            ? "Underdog documents this rankings and Autopilot flow. The rankings apply to one slate, so confirm the slate name and saved player count before you leave."
            : "This private controller depends on provider page text and controls. Both providers can change those pages, and their terms prohibit automated access. Set up the native autopick below as the fallback."}
        </p>
      </aside>

      <section className="setup-card native-fallback" aria-labelledby="fallback-heading">
        <div className="section-heading">
          <span className="section-index">01</span>
          <div>
            <h2 id="fallback-heading">Native autopick fallback</h2>
            <p>The provider finishes the pick if the controller stops.</p>
          </div>
        </div>
        {setup.platform === "espn" ? (
          <div className="instruction-list">
            <p><span>1</span>Open Edit Draft Strategy on the ESPN team page and save the copied player order.</p>
            <p><span>2</span>Enter the position minimums and maximums shown below.</p>
            <p><span>3</span>Leave early rounds on Best Available and reserve the final rounds for DST and K.</p>
            <p><span>4</span>Save before leaving the page and confirm the rankings still appear after a reload.</p>
          </div>
        ) : setup.platform === "sleeper" ? (
          <div className="instruction-list">
            <p><span>1</span>Open this league's draft room and add the copied player order to its Queue tab.</p>
            <p><span>2</span>Keep enough queued players to cover all {setup.teams * setup.rounds} room picks.</p>
            <p><span>3</span>Ask the commissioner to use Force CPU Auto Pick so the room does not wait for your full timer.</p>
            <p><span>4</span>Confirm the queue is still there after leaving and reopening the room.</p>
          </div>
        ) : (
          <div className="instruction-list">
            <p><span>1</span>Open Rankings, choose NFL, then select the {underdogSlate} slate.</p>
            <p><span>2</span>Open CSV upload/download, paste the copied player names, and press Save.</p>
            <p><span>3</span>Open Limits and enter the target maximums shown below, then save them.</p>
            <p><span>4</span>Clear any room queue you do not want to take priority, turn on Autopilot, and confirm the toggle remains on.</p>
          </div>
        )}
      </section>

      {setup.platform === "espn" && plan ? (
        <section className="setup-card" aria-labelledby="limits-heading">
          <div className="section-heading">
            <span className="section-index">02</span>
            <div>
              <h2 id="limits-heading">ESPN strategy settings</h2>
              <p>These caps fill the starting lineup and limit extra QB and TE picks.</p>
            </div>
          </div>
          <div className="position-limit-grid">
            {plan.positionLimits.map((limit) => (
              <div key={limit.position}>
                <strong>{limit.position}</strong>
                <span>Min {limit.minimum}</span>
                <span>Max {limit.maximum}</span>
              </div>
            ))}
          </div>
          <p className="round-rules">
            {plan.roundRules.length > 0
              ? `Leave the other rounds on Best Available. ${plan.roundRules.map((rule) => `Round ${rule.round} is ${rule.position}`).join(". ")}.`
              : "Leave every round on Best Available."}
          </p>
        </section>
      ) : null}

      {isUnderdog && bestBallTargets ? (
        <section className="setup-card" aria-labelledby="limits-heading">
          <div className="section-heading">
            <span className="section-index">02</span>
            <div>
              <h2 id="limits-heading">Underdog position limits</h2>
              <p>Autopilot treats each maximum as a hard cap while it works down your rankings.</p>
            </div>
          </div>
          <div className="position-limit-grid">
            {(["QB", "RB", "WR", "TE"] as const).map((position) => (
              <div key={position}>
                <strong>{position}</strong>
                <span>Target {bestBallTargets.targets[position].recommended}</span>
                <span>Max {bestBallTargets.targets[position].maximum}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="setup-card queue-card" aria-labelledby="queue-heading">
        <div className="queue-heading">
          <div>
            <p className="eyebrow">{setup.platform === "espn" || isUnderdog ? "03" : "02"}</p>
            <h2 id="queue-heading">Ranked queue</h2>
            <p>
              {loading
                ? "Loading the latest saved rankings."
                : awayQueue.length > 0
                  ? isUnderdog
                    ? `${awayQueue.length} players from the ${BEST_BALL_CONTESTS[setup.contestId].shortName} board, checked ${formatDate(snapshot?.kind === "best-ball" ? snapshot.data.rankingSource.asOf ?? snapshot.data.generatedAt : null)}.`
                    : `${awayQueue.length} players from the ${setup.scoring.replace("_", " ")} board, checked ${formatDate(snapshot?.kind === "redraft" ? snapshot.data.upstreamUpdatedAt : null)}.`
                  : "The ranked queue is unavailable."}
            </p>
          </div>
          <button type="button" onClick={() => void copyPlan()} disabled={awayQueue.length === 0}>
            <Copy size={16} aria-hidden="true" /> {copied ? "Copied" : isUnderdog ? "Copy rankings" : "Copy plan"}
          </button>
        </div>
        {awayQueue.length > 0 && awayQueue.length < setup.teams * setup.rounds ? (
          <p className="queue-warning">
            The board has {awayQueue.length} matchable players, which is fewer than the {setup.teams * setup.rounds} picks in this room. Add provider-ranked players after this list.
          </p>
        ) : null}
        <div className="away-queue" aria-busy={loading}>
          {loading ? (
            Array.from({ length: 8 }, (_, index) => <div className="player-skeleton" key={index} />)
          ) : awayQueue.length > 0 ? (
            awayQueue.map(({ player, rank }) => (
              <div className="away-queue__row" key={player.id}>
                <span>{rank}</span>
                <b>{player.position}</b>
                <strong>{player.name}</strong>
                <small>{player.team}</small>
              </div>
            ))
          ) : (
            <EmptyState>The rankings could not be prepared.</EmptyState>
          )}
        </div>
      </section>
    </main>
  );
}

function SnapshotStatus({
  snapshot,
  room,
  loading,
  liveError,
  onRefresh,
}: {
  snapshot: CompanionSnapshot | null;
  room: FantasyCompanionRoomConfig;
  loading: boolean;
  liveError: string | null;
  onRefresh: () => void;
}) {
  const sourceLabel =
    snapshot?.source === "published"
      ? "Published"
      : snapshot?.source === "saved"
        ? "Saved copy"
        : snapshot?.source === "bundled"
          ? "Bundled copy"
          : "Waiting";
  const rankingAsOf = snapshot?.kind === "redraft"
    ? snapshot.data.upstreamUpdatedAt ?? snapshot.data.generatedAt
    : snapshot?.kind === "best-ball" && room.kind === "best-ball"
      ? getBestBallRankingSource(
          snapshot.data,
          BEST_BALL_CONTESTS[room.contestId]
        )?.asOf ?? snapshot.data.generatedAt
      : null;
  const marketAsOf = snapshot?.data.adpSource?.asOf ?? null;

  return (
    <div className="snapshot-status">
      <span className={`status-dot ${snapshot ? "is-ready" : ""}`} aria-hidden="true" />
      <span>
        <strong>{loading ? "Refreshing rankings" : sourceLabel}</strong>
        <small>
          {snapshot
            ? `Rank ${formatDate(rankingAsOf)} · Market ${formatDate(marketAsOf)}${liveError ? " · offline fallback" : ""}`
            : "No rankings loaded"}
        </small>
      </span>
      <button
        type="button"
        className="icon-button"
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh published rankings"
        title="Refresh published rankings"
      >
        <RefreshCw size={17} className={loading ? "is-spinning" : ""} aria-hidden="true" />
      </button>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <CircleDot size={22} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function RedraftDecisionSummary({
  report,
}: {
  report: RedraftDraftDecisionReport | null;
}) {
  if (!report?.guidanceAvailable || report.positions.length === 0) return null;

  return (
    <section className="decision-panel" aria-labelledby="decision-heading">
      <div className="decision-panel__heading">
        <div>
          <p className="eyebrow">RANK INDEX AND SCARCITY</p>
          <h2 id="decision-heading">What changes if you wait</h2>
        </div>
        {report.mostAtRisk ? (
          <span className="risk-tag">Most at risk · {report.mostAtRisk.position}</span>
        ) : null}
      </div>
      <p className="decision-explainer">
        The replacement index is a 0 to 100 ordinal reading built from overall rank and this room&apos;s lineup. VORP appears separately on the player board because it comes from projected fantasy points. Positional tiers come from each position&apos;s own board. Wait cost appears only on your turn.
      </p>
      <div className="decision-grid">
        {report.positions.map((entry) => {
          const best = entry.bestAvailable;
          const isMostAtRisk = report.mostAtRisk?.position === entry.position;
          return (
            <article
              className={`decision-card ${isMostAtRisk ? "is-at-risk" : ""}`}
              key={entry.position}
            >
              <div className="decision-card__top">
                <span className={positionClass(entry.position)}>{entry.position}</span>
                <span>{describeRedraftNeed(entry)}</span>
              </div>
              {best ? (
                <>
                  <div className="decision-card__player">
                    <strong>{best.player.name}</strong>
                    <b>Index {best.value.toFixed(1)}</b>
                  </div>
                  <p>
                    {describeRedraftTier(entry)}
                    <br />
                    Starter line {best.starterCutoff === null ? "unavailable" : `overall #${Math.round(best.starterCutoff)}`}
                    {` · Roster line ${best.rosterCutoff === null ? "unavailable" : `overall #${Math.round(best.rosterCutoff)}`}`}
                  </p>
                  <small>{describeRedraftWait(entry.wait)}</small>
                </>
              ) : (
                <p>No ranked player remains.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DraftOutlookSummary({
  report,
  pausedReason,
}: {
  report: DraftValueReport | null;
  pausedReason: string | null;
}) {
  return (
    <section className="outlook-card" aria-labelledby="outlook-heading">
      <div className="view-heading">
        <div>
          <p className="eyebrow">DRAFT OUTLOOK</p>
          <h2 id="outlook-heading">Room-relative draft process</h2>
        </div>
        <Activity size={24} aria-hidden="true" />
      </div>
      {pausedReason ? (
        <p className="model-note">Draft Outlook is paused because {pausedReason}.</p>
      ) : report?.compositeScore === null || !report ? (
        <p className="model-note">Record your first pick to start Draft Outlook.</p>
      ) : (
        <>
          <div className="outlook-score">
            <strong>{Math.round(report.compositeScore)}</strong>
            <span>
              <b>{report.confidence} read</b>
              <small>
                {report.roomRank !== null && report.roomSize > 1
                  ? `Room rank ${report.roomRank.toFixed(report.roomRank % 1 === 0 ? 0 : 1)} of ${report.roomSize}`
                  : "Room rank begins after four picks"}
              </small>
            </span>
          </div>
          <div className="outlook-components">
            {report.components.map((component) => (
              <div key={component.id}>
                <span><b>{component.label}</b><em>{Math.round(component.score)}</em></span>
                <i><span style={{ width: `${component.score}%` }} /></i>
                <small>{component.detail}</small>
              </div>
            ))}
          </div>
          <p className="model-note">
            This ordinal score grades draft price, roster shape, lineup or correlation, and bye coverage. It does not estimate fantasy points or win probability.
          </p>
        </>
      )}
    </section>
  );
}

function RosterPlan({
  room,
  userPicks,
  bestBallAnalysis,
}: {
  room: FantasyCompanionRoomConfig;
  userPicks: FantasyCompanionDraftState["picks"];
  bestBallAnalysis: BestBallRosterAnalysis | null;
}) {
  const rosterPositions = room.kind === "best-ball"
    ? (["QB", "RB", "WR", "TE"] as const)
    : (["QB", "RB", "WR", "TE", "K", "DST"] as const);
  const counts = Object.fromEntries(
    rosterPositions.map((position) => [
      position,
      userPicks.filter((pick) => pick.player.position === position).length,
    ])
  ) as Record<(typeof rosterPositions)[number], number>;
  const redraftTarget = room.kind === "redraft"
    ? getRedraftRosterTarget(room.lineup, room.rounds)
    : null;

  return (
    <section className="roster-plan" aria-labelledby="roster-plan-heading">
      <div className="view-heading">
        <div>
          <p className="eyebrow">ROSTER PLAN</p>
          <h2 id="roster-plan-heading">Targets and open spots</h2>
        </div>
        <UserRound size={24} aria-hidden="true" />
      </div>
      <div className="roster-targets">
        {rosterPositions.map((position) => {
          const drafted = counts[position] ?? 0;
          const bestBallTarget = room.kind === "best-ball"
            ? bestBallAnalysis?.targets.targets[
                position as "QB" | "RB" | "WR" | "TE"
              ]
            : null;
          const target = redraftTarget
            ? redraftTarget[position]
            : bestBallTarget?.recommended ?? 0;
          const range = bestBallTarget;
          return (
            <article key={position}>
              <span className={positionClass(position)}>{position}</span>
              <strong>{drafted} / {target}</strong>
              <small>
                {range
                  ? `${range.minimum} to ${range.maximum} viable`
                  : drafted < target
                    ? `${target - drafted} open`
                    : "Target met"}
              </small>
            </article>
          );
        })}
      </div>
      {bestBallAnalysis?.targets.reasons.slice(0, 2).map((reason) => (
        <p className="roster-reason" key={reason}>{reason}</p>
      ))}
    </section>
  );
}

function DraftConsole({
  state,
  platform,
  onStateChange,
  onNewRoom,
}: {
  state: FantasyCompanionDraftState;
  platform: Platform;
  onStateChange: (next: FantasyCompanionDraftState) => void;
  onNewRoom: () => void;
}) {
  const [snapshot, setSnapshot] = useState<CompanionSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [view, setView] = useState<PanelView>("board");
  const [resetArmed, setResetArmed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [syncStatus, setSyncStatus] = useState<{
    phase: "waiting" | "synced" | "paused";
    message: string;
  }>({ phase: "waiting", message: "Waiting for the provider draft room." });

  const room = state.room;
  const roomIdentity = room.kind === "best-ball"
    ? `${room.kind}-${room.season}-${room.contestId}`
    : `${room.kind}-${room.season}-${room.scoring}`;

  useEffect(() => {
    let cancelled = false;

    loadCompanionSnapshot(room)
      .then((result) => {
        if (cancelled) return;
        setSnapshot(result.snapshot);
        setLiveError(result.liveError);
      })
      .catch((error) => {
        if (cancelled) return;
        setSnapshotError(error instanceof Error ? error.message : "Rankings could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSnapshot(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshVersion, room, roomIdentity]);

  const currentPick = getCurrentPickNumber(state);
  const currentTeam = getCurrentTeamNumber(state);
  const currentRound = currentTeam === null
    ? room.rounds
    : getDraftRoundForPick(currentPick, room.teams);
  const totalPicks = room.teams * room.rounds;
  const userPicks = getTeamPicks(state, room.userTeam);
  const positions = room.kind === "best-ball" ? BEST_BALL_POSITIONS : REDRAFT_POSITIONS;
  const contest = room.kind === "best-ball" ? BEST_BALL_CONTESTS[room.contestId] : null;
  const redraftSnapshot = snapshot?.kind === "redraft" && room.kind === "redraft"
    ? snapshot.data
    : null;
  const bestBallSnapshot = snapshot?.kind === "best-ball" && room.kind === "best-ball"
    ? snapshot.data
    : null;
  const rankingSourceAsOf = redraftSnapshot
    ? redraftSnapshot.upstreamUpdatedAt
    : bestBallSnapshot && contest
      ? getBestBallRankingSource(bestBallSnapshot, contest)?.asOf
      : null;
  const sourceCapabilities = getFantasySourceCapabilities({
    rankingAsOf: rankingSourceAsOf,
    vorpAsOf: redraftSnapshot?.vorpSource?.asOf,
    marketAsOf: snapshot?.data.adpSource?.asOf,
    scheduleAsOf: bestBallSnapshot?.scheduleSource?.asOf,
    season: snapshot?.data.season,
  });
  const rankingUsable = sourceCapabilities.ranking.usable;
  const adpAvailable = room.kind === "redraft"
    ? redraftSnapshot?.adpSource !== null && sourceCapabilities.market.current
    : Boolean(
        contest &&
        bestBallSnapshot?.adpSource &&
        hasSupportedBestBallAdp(contest) &&
        sourceCapabilities.market.current
      );
  const scheduleAvailable = Boolean(
    bestBallSnapshot?.scheduleSource &&
    sourceCapabilities.schedule.usable &&
    Object.keys(bestBallSnapshot.week17Opponents).length >= 30
  );
  const modelSourceIssue = room.kind === "redraft"
    ? rankingUsable
      ? null
      : "the ranking source is stale"
    : bestBallSnapshot && contest
      ? getBestBallModelSourceIssue(bestBallSnapshot, contest)
      : snapshot
        ? "the matching rankings are unavailable"
        : null;
  const rawPlayers = useMemo(
    () => redraftSnapshot?.overall ?? bestBallSnapshot?.players ?? [],
    [bestBallSnapshot, redraftSnapshot]
  );
  const syncProvider: Platform = room.kind === "best-ball" ? "underdog" : platform;
  // Provider messages arrive between renders, so they reconcile against the
  // newest state rather than the state the listener closed over.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (rawPlayers.length === 0 || typeof chrome === "undefined" || !chrome.runtime?.onMessage) {
      return;
    }
    let cancelled = false;

    const applySync = (message: FantasyDraftSyncMessage): void => {
      if (cancelled || message.provider !== syncProvider) return;
      const result = reconcileFantasyDraftSync(stateRef.current, message.picks, rawPlayers);
      if (result.status === "updated") {
        stateRef.current = result.state;
        onStateChange(result.state);
        const messageText = `${result.added} provider ${result.added === 1 ? "pick" : "picks"} recorded. The room is synced through pick ${result.state.picks.length}.`;
        setSyncStatus({ phase: "synced", message: messageText });
        setAnnouncement(messageText);
        return;
      }
      if (result.status === "unchanged") {
        setSyncStatus({
          phase: "synced",
          message: message.picks.length > 0
            ? `Synced through provider pick ${message.picks.length}.`
            : "Connected and waiting for the first pick.",
        });
        return;
      }
      if (result.status === "behind") {
        setSyncStatus({
          phase: "waiting",
          message: "The provider log is behind the companion, so no picks were removed.",
        });
        return;
      }
      if (!("reason" in result)) return;
      setSyncStatus({ phase: "paused", message: result.reason });
      setAnnouncement(`Automatic pick sync paused. ${result.reason}`);
    };

    const listener = (message: unknown): void => {
      if (isFantasyDraftSyncMessage(message)) applySync(message);
    };
    chrome.runtime.onMessage.addListener(listener);
    void requestActiveDraftSync(syncProvider).then((message) => {
      if (message) applySync(message);
    });
    return () => {
      cancelled = true;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [onStateChange, rawPlayers, syncProvider]);
  const modelPlayers = useMemo(
    () => rawPlayers.map((player) => (adpAvailable ? player : withoutPlayerAdp(player))),
    [adpAvailable, rawPlayers]
  );
  const modelWeek17Opponents = useMemo(
    () => scheduleAvailable ? bestBallSnapshot?.week17Opponents ?? {} : {},
    [bestBallSnapshot?.week17Opponents, scheduleAvailable]
  );
  const modelPicks = useMemo(
    () => resolveDraftPicksForModel(state.picks, modelPlayers, adpAvailable),
    [adpAvailable, modelPlayers, state.picks]
  );
  const available = useMemo(
    () => getAvailablePlayers(modelPlayers, state),
    [modelPlayers, state]
  );
  const guidance = useMemo(() => {
    if (!snapshot || !rankingUsable) return null;
    if (
      room.kind === "best-ball" &&
      contest?.recommendationMode === "exact" &&
      modelSourceIssue
    ) {
      return {
        kind: "best-ball" as const,
        mode: "exact" as const,
        reason: `Exact player scoring is paused because ${modelSourceIssue}.`,
        recommendations: [],
      };
    }
    return getFantasyCompanionRecommendations({
      state: { ...state, picks: modelPicks },
      players: modelPlayers,
      week17Opponents: modelWeek17Opponents,
      limit: 40,
    });
  }, [contest?.recommendationMode, modelPicks, modelPlayers, modelSourceIssue, modelWeek17Opponents, rankingUsable, room.kind, snapshot, state]);
  const guidanceRanks = useMemo(() => {
    const ranks = new Map<string, number>();
    guidance?.recommendations.forEach((recommendation, index) => {
      ranks.set(recommendation.player.id, index + 1);
    });
    return ranks;
  }, [guidance]);
  const guidanceScores = useMemo(() => {
    const scores = new Map<string, number>();
    if (guidance?.kind === "best-ball") {
      guidance.recommendations.forEach((recommendation) => {
        scores.set(recommendation.player.id, recommendation.score);
      });
    }
    return scores;
  }, [guidance]);
  const baseRanks = useMemo(() => {
    const ordered = room.kind === "best-ball" && contest
      ? sortBestBallRankings(modelPlayers, contest)
      : modelPlayers;
    return new Map(ordered.map((player, index) => [player.id, index + 1]));
  }, [contest, modelPlayers, room.kind]);
  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return available
      .filter((player) => position === "ALL" || player.position === position)
      .filter((player) =>
        !normalizedQuery || [player.name, player.team, player.position].join(" ").toLowerCase().includes(normalizedQuery)
      )
      .sort((left, right) => {
        const leftGuidance = guidanceRanks.get(left.id) ?? Number.POSITIVE_INFINITY;
        const rightGuidance = guidanceRanks.get(right.id) ?? Number.POSITIVE_INFINITY;
        return leftGuidance - rightGuidance ||
          (baseRanks.get(left.id) ?? Number.POSITIVE_INFINITY) -
            (baseRanks.get(right.id) ?? Number.POSITIVE_INFINITY) ||
          sourceRank(left, room) - sourceRank(right, room);
      });
  }, [available, baseRanks, guidanceRanks, position, query, room]);
  const vorpTeamSize = room.kind === "redraft" && isFantasyVorpTeamSize(room.teams)
    ? room.teams
    : null;
  const vorpById = useMemo(
    () =>
      redraftSnapshot?.vorpSource && vorpTeamSize && sourceCapabilities.vorp.usable
        ? buildFantasyVorpIndex(redraftSnapshot.vorpRankings, vorpTeamSize)
        : new Map<string, FantasyVorpRankingEntry>(),
    [redraftSnapshot, sourceCapabilities.vorp.usable, vorpTeamSize]
  );
  const redraftDecision = useMemo(
    () => redraftSnapshot && room.kind === "redraft"
      ? calculateRedraftDraftDecision({
          players: modelPlayers,
          positionBoards: {
            QB: redraftSnapshot.positions.QB,
            RB: redraftSnapshot.positions.RB,
            WR: redraftSnapshot.positions.WR,
            TE: redraftSnapshot.positions.TE,
          },
          picks: modelPicks,
          room: {
            teams: room.teams,
            rounds: room.rounds,
            userTeam: room.userTeam,
            draftOrder: room.draftOrder,
            lineup: room.lineup,
          },
          currentPick,
          rankingUsable,
          marketCurrent: adpAvailable,
          vorpValues: vorpById,
        })
      : null,
    [adpAvailable, currentPick, modelPicks, modelPlayers, rankingUsable, redraftSnapshot, room, vorpById]
  );
  const replacementById = useMemo(
    () => new Map(redraftDecision?.playerValues.map((entry) => [entry.player.id, entry.value]) ?? []),
    [redraftDecision]
  );
  const redraftPositionFacts = useMemo(() => {
    const facts = new Map<string, { positionRank: number | null; tier: number | null }>();
    if (!redraftSnapshot) return facts;
    for (const positionName of ["QB", "RB", "WR", "TE", "K", "DST"] as const) {
      for (const player of redraftSnapshot.positions[positionName]) {
        facts.set(player.id, {
          positionRank: Number.isFinite(player.rankEcr)
            ? Number(player.rankEcr)
            : Number.isFinite(player.averageRank)
              ? player.averageRank
              : null,
          tier: Number.isFinite(player.tier) ? Number(player.tier) : null,
        });
      }
    }
    return facts;
  }, [redraftSnapshot]);
  const bestBallAnalysis = useMemo(() => {
    if (room.kind !== "best-ball") return null;
    const nextUserPick =
      getNextUserPick(currentPick, room.userTeam, room.teams, room.rounds) ?? currentPick;
    const upcomingRound = getDraftRoundForPick(nextUserPick, room.teams);
    return analyzeBestBallRoster(
      modelPicks.filter((pick) => pick.teamNumber === room.userTeam),
      modelWeek17Opponents,
      room.contestId,
      upcomingRound
    );
  }, [currentPick, modelPicks, modelWeek17Opponents, room]);
  const draftOutlook = useMemo(() => {
    if (modelSourceIssue || !snapshot) return null;
    if (room.kind === "redraft") {
      const picks: DraftPick[] = modelPicks.map((pick) => ({
        ...pick,
        timestamp: new Date(pick.draftedAt),
      }));
      return calculateRedraftDraftValues(picks, {
        totalTeams: room.teams,
        userTeam: room.userTeam,
        rounds: room.rounds,
        draftType: room.draftOrder,
        lineup: room.lineup,
      }).find((report) => report.teamNumber === room.userTeam) ?? null;
    }
    return calculateBestBallDraftValues({
      picks: modelPicks,
      contestId: room.contestId,
      week17Opponents: modelWeek17Opponents,
    }).find((report) => report.teamNumber === room.userTeam) ?? null;
  }, [modelPicks, modelSourceIssue, modelWeek17Opponents, room, snapshot]);
  const mode = guidance?.kind === "best-ball" ? guidance.mode : "consensus";

  const recordPick = useCallback((player: Player) => {
    const result = addFantasyCompanionPick(state, player);
    if (!result.ok) {
      setAnnouncement(`Could not record ${player.name}. ${result.reason.replaceAll("-", " ")}.`);
      return;
    }
    onStateChange(result.state);
    setAnnouncement(`${player.name} recorded at pick ${result.pick.pickNumber} for Team ${result.pick.teamNumber}.`);
  }, [onStateChange, state]);

  const handleReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      setAnnouncement("Press Confirm reset to clear every recorded pick.");
      return;
    }
    onStateChange(resetFantasyCompanionDraft(state));
    setResetArmed(false);
    setAnnouncement("Draft picks cleared. Room settings and rankings were kept.");
  };

  return (
    <main className="console-page">
      <header className="console-header">
        <BrandMark />
        <button type="button" className="icon-button" onClick={onNewRoom} aria-label="Set up a new draft room" title="New room">
          <Settings2 size={18} aria-hidden="true" />
        </button>
      </header>

      <section className={`on-clock ${currentTeam === room.userTeam ? "is-yours" : ""}`} aria-label="Draft clock">
        <div className="on-clock__signal" aria-hidden="true"><span /></div>
        <div className="on-clock__primary">
          <span>{currentTeam === null ? "DRAFT COMPLETE" : currentTeam === room.userTeam ? "YOU ARE ON THE CLOCK" : `TEAM ${currentTeam} IS ON THE CLOCK`}</span>
          <strong>{currentTeam === null ? `${totalPicks} PICKS` : `PICK ${currentPick}`}</strong>
        </div>
        <div className="on-clock__meta">
          <span>ROUND {currentRound}</span>
          <small>{state.picks.length} / {totalPicks} recorded</small>
        </div>
      </section>

      <section className="room-bar" aria-label="Room and rankings status">
        <div className="room-label">
          <span className="room-label__platform">
            {room.kind === "best-ball" ? "UNDERDOG" : platform.toUpperCase()}
          </span>
          <strong>{contest?.shortName ?? `${room.scoring.replace("_", " ")} REDRAFT`}</strong>
          <small>{room.teams} teams · {room.rounds} rounds · Slot {room.userTeam}</small>
        </div>
        <SnapshotStatus
          snapshot={snapshot}
          room={room}
          loading={loadingSnapshot}
          liveError={liveError}
          onRefresh={() => {
            setLoadingSnapshot(true);
            setSnapshotError(null);
            setLiveError(null);
            setRefreshVersion((version) => version + 1);
          }}
        />
        <div className={`sync-status sync-status--${syncStatus.phase}`} title={syncStatus.message}>
          <span aria-hidden="true" />
          <strong>{syncStatus.phase === "paused" ? "Sync paused" : syncStatus.phase === "synced" ? "Auto synced" : "Auto sync"}</strong>
          <small>{syncStatus.message}</small>
        </div>
      </section>

      {liveError ? (
        <p className="fallback-note">
          <Database size={15} aria-hidden="true" /> The published update could not be reached, so the panel kept the last working rankings.
        </p>
      ) : null}
      {snapshotError ? <p className="error-note">{snapshotError}</p> : null}

      <nav className="view-tabs" aria-label="Draft companion views">
        {([
          ["board", "Board"],
          ["roster", `My roster ${userPicks.length}`],
          ["picks", `Room picks ${state.picks.length}`],
        ] as const).map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={view === value ? "is-active" : ""}
            onClick={() => setView(value)}
            aria-current={view === value ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      {view === "board" ? (
        <section className="board-view">
          <RedraftDecisionSummary report={redraftDecision} />
          <div className="guidance-strip">
            <div>
              <span className={`mode-tag mode-tag--${mode}`}>{mode === "exact" ? "Exact contest" : mode === "reference" ? "Reference only" : "Consensus board"}</span>
              <p>
                {guidance?.reason ?? (modelSourceIssue
                  ? `Model guidance is paused because ${modelSourceIssue}. The dated board remains available.`
                  : "Rankings are loading.")}
              </p>
            </div>
            <span className="board-count">{available.length} available</span>
          </div>

          {snapshot ? (
            <div className="source-chips" aria-label="Model source status">
              <span
                className={rankingUsable ? "is-current" : "is-paused"}
                title={`Ranking updated ${formatDate(rankingSourceAsOf)}`}
              >
                Rank {rankingUsable ? "usable" : "stale"}
              </span>
              <span
                className={adpAvailable ? "is-current" : "is-muted"}
                title={`Market updated ${formatDate(snapshot.data.adpSource?.asOf)}`}
              >
                ADP {adpAvailable ? "current" : "hidden"}
              </span>
              {room.kind === "redraft" && vorpById.size > 0 && vorpTeamSize ? (
                <span
                  className="is-current"
                  title={`FantasyPros VORP checked ${formatDate(redraftSnapshot?.vorpSource?.asOf)}`}
                >
                  VORP {vorpTeamSize}-team
                </span>
              ) : null}
              {room.kind === "best-ball" ? (
                <span
                  className={scheduleAvailable ? "is-current" : "is-muted"}
                  title={`Week 17 schedule updated ${formatDate(bestBallSnapshot?.scheduleSource?.asOf)}`}
                >
                  Week 17 {scheduleAvailable ? "ready" : "unavailable"}
                </span>
              ) : null}
            </div>
          ) : null}

          {guidance?.kind === "best-ball" && guidance.recommendations[0] ? (
            <p className="top-read">
              The top read is {guidance.recommendations[0].reasons.slice(0, 2).map((reason) => reason.detail).join(" ")}
            </p>
          ) : null}

          <div className="search-control">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search player, team, or position"
              aria-label="Search available players"
            />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search">Clear</button> : null}
          </div>

          <div className="position-filters" aria-label="Filter players by position">
            {positions.map((value) => (
              <button
                type="button"
                key={value}
                className={position === value ? "is-active" : ""}
                onClick={() => setPosition(value)}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="player-list" aria-busy={loadingSnapshot}>
            {loadingSnapshot && !snapshot ? (
              Array.from({ length: 8 }, (_, index) => <div className="player-skeleton" key={index} />)
            ) : filteredPlayers.length === 0 ? (
              <EmptyState>No available players match this search.</EmptyState>
            ) : (
              filteredPlayers.slice(0, BOARD_LIMIT).map((player, index) => {
                const ranked = guidanceRanks.get(player.id);
                const score = guidanceScores.get(player.id);
                const positionFacts = room.kind === "redraft"
                  ? redraftPositionFacts.get(player.id)
                  : null;
                const positionRank = room.kind === "redraft"
                  ? positionFacts?.positionRank ?? null
                  : room.contestId === "superflex"
                    ? null
                    : Number.isFinite(player.positionRank)
                      ? Number(player.positionRank)
                      : null;
                const tier = room.kind === "redraft"
                  ? positionFacts?.tier ?? null
                  : room.contestId === "superflex"
                    ? Number.isFinite(player.superflexTier)
                      ? Number(player.superflexTier)
                      : null
                    : Number.isFinite(player.tier)
                      ? Number(player.tier)
                      : null;
                const replacement = replacementById.get(player.id);
                const vorp = vorpById.get(player.id);
                const facts = [
                  player.team,
                  room.kind === "redraft"
                    ? `ECR ${Math.round(sourceRank(player, room))}`
                    : `Rank ${baseRanks.get(player.id) ?? index + 1}`,
                  positionRank !== null ? `${player.position}${Math.round(positionRank)}` : null,
                  tier !== null ? `T${tier}` : null,
                  Number.isFinite(player.byeWeek) ? `Bye ${player.byeWeek}` : null,
                  adpAvailable && Number.isFinite(player.adp) ? `ADP ${Number(player.adp).toFixed(1)}` : null,
                ].filter(Boolean).join(" · ");
                return (
                  <button
                    type="button"
                    className="player-row"
                    key={player.id}
                    onClick={() => recordPick(player)}
                    disabled={currentTeam === null}
                    aria-label={`Record ${player.name} at pick ${currentPick}`}
                  >
                    <span className="player-rank">{ranked ?? index + 1}</span>
                    <span className={positionClass(player.position)}>{player.position}</span>
                    <span className="player-identity">
                      <strong>{player.name}</strong>
                      <small>{facts}</small>
                    </span>
                    {typeof score === "number" ? (
                      <span className="player-score" title="Exact contest recommendation score">{score.toFixed(1)}</span>
                    ) : vorp ? (
                      <span
                        className="player-score"
                        title={`Projected season points above FantasyPros' ${vorpTeamSize}-team same-position waiver replacement`}
                      >
                        VORP {Math.round(vorp.value)}
                      </span>
                    ) : typeof replacement === "number" ? (
                      <span className="player-score" title="Rank-based replacement index">Index {replacement.toFixed(1)}</span>
                    ) : null}
                    <span className="record-action" aria-hidden="true">+</span>
                  </button>
                );
              })
            )}
          </div>
          {filteredPlayers.length > BOARD_LIMIT ? (
            <p className="list-limit">Showing the first {BOARD_LIMIT} matches. Use search or a position filter to narrow the board.</p>
          ) : null}
        </section>
      ) : null}

      {view === "roster" ? (
        <section className="roster-view">
          <div className="view-heading">
            <div>
              <p className="eyebrow">TEAM {room.userTeam}</p>
              <h2>My roster</h2>
            </div>
            <UserRound size={24} aria-hidden="true" />
          </div>
          <div className="roster-counts">
            {(room.kind === "best-ball" ? ["QB", "RB", "WR", "TE"] : ["QB", "RB", "WR", "TE", "K", "DST"]).map((rosterPosition) => (
              <span key={rosterPosition}>
                <b>{userPicks.filter((pick) => pick.player.position === rosterPosition).length}</b> {rosterPosition}
              </span>
            ))}
          </div>
          <RosterPlan
            room={room}
            userPicks={userPicks}
            bestBallAnalysis={bestBallAnalysis}
          />
          <DraftOutlookSummary
            report={draftOutlook}
            pausedReason={modelSourceIssue}
          />
          {userPicks.length === 0 ? (
            <EmptyState>Your picks will appear here when Team {room.userTeam} comes up.</EmptyState>
          ) : (
            <div className="pick-list">
              {userPicks.map((pick) => (
                <div className="pick-row" key={pick.pickNumber}>
                  <span className="pick-number">{pick.pickNumber}</span>
                  <span className={positionClass(pick.player.position)}>{pick.player.position}</span>
                  <span className="pick-identity"><strong>{pick.player.name}</strong><small>{pick.player.team} · Round {pick.round}</small></span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {view === "picks" ? (
        <section className="picks-view">
          <div className="view-heading">
            <div>
              <p className="eyebrow">FULL ROOM</p>
              <h2>Recent picks</h2>
            </div>
            <Wifi size={24} aria-hidden="true" />
          </div>
          {state.picks.length === 0 ? (
            <EmptyState>Record the first room pick from the board.</EmptyState>
          ) : (
            <div className="pick-list">
              {[...state.picks].reverse().map((pick) => (
                <div className={`pick-row ${pick.teamNumber === room.userTeam ? "is-user" : ""}`} key={pick.pickNumber}>
                  <span className="pick-number">{pick.pickNumber}</span>
                  <span className={positionClass(pick.player.position)}>{pick.player.position}</span>
                  <span className="pick-identity"><strong>{pick.player.name}</strong><small>Team {pick.teamNumber} · Round {pick.round}</small></span>
                  {pick.teamNumber === room.userTeam ? <span className="your-pick">YOU</span> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <footer className="draft-controls">
        <button
          type="button"
          onClick={() => {
            const lastPick = state.picks.at(-1);
            onStateChange(undoFantasyCompanionPick(state));
            setAnnouncement(lastPick ? `${lastPick.player.name} removed from pick ${lastPick.pickNumber}.` : "There are no picks to undo.");
          }}
          disabled={state.picks.length === 0}
        >
          <Undo2 size={17} aria-hidden="true" /> Undo last
        </button>
        <button type="button" className={resetArmed ? "is-danger" : ""} onClick={handleReset} disabled={state.picks.length === 0}>
          <RotateCcw size={17} aria-hidden="true" /> {resetArmed ? "Confirm reset" : "Reset draft"}
        </button>
        {resetArmed ? <button type="button" className="cancel-reset" onClick={() => setResetArmed(false)}>Cancel</button> : null}
      </footer>
      <p className="keyboard-note">Undo removes the latest room pick. Use it repeatedly to correct an earlier pick.</p>
      <div className="sr-only" aria-live="polite">{announcement}</div>
    </main>
  );
}

export function App() {
  const [setup, setSetup] = useState<SetupValues>(DEFAULT_SETUP);
  const [draftState, setDraftState] = useState<FantasyCompanionDraftState | null>(null);
  const [awaySetup, setAwaySetup] = useState<SetupValues | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      readLocalValue<unknown>(SETUP_STORAGE_KEY),
      readLocalValue<unknown>(LEGACY_SETUP_STORAGE_KEY),
      readLocalValue<string>(DRAFT_STORAGE_KEY),
    ]).then(([savedSetup, legacySetup, savedDraft]) => {
      if (cancelled) return;
      const parsedDraft = parseFantasyCompanionState(savedDraft);
      const parsedSetup = parseSetupValues(savedSetup) ?? parseSetupValues(legacySetup);
      // The saved room does not carry its provider, so recover it from the raw
      // setup even when the rest of that record no longer validates.
      const savedPlatform = (savedSetup as { platform?: unknown } | null)?.platform;
      const redraftPlatform: AutoDraftPlatform =
        savedPlatform === "sleeper" || parsedSetup?.platform === "sleeper" ? "sleeper" : "espn";
      if (legacySetup !== null) {
        // The v2 key is written on hydration below, so the v1 copy is only clutter now.
        void removeLocalValue(LEGACY_SETUP_STORAGE_KEY).catch(() => undefined);
      }
      if (parsedDraft) {
        setDraftState(parsedDraft);
        setSetup(
          setupFromRoom(parsedDraft.room, redraftPlatform)
        );
      } else if (parsedSetup) {
        setSetup(parsedSetup);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void writeLocalValue(SETUP_STORAGE_KEY, setup).catch(() => undefined);
  }, [hydrated, setup]);

  useEffect(() => {
    if (!hydrated || !draftState) return;
    // serializeFantasyCompanionState throws when the state fails its
    // round-trip schema check. A persistence failure must degrade to "this
    // pick is not saved yet", never crash the live panel mid-draft.
    try {
      const serialized = serializeFantasyCompanionState(draftState);
      void writeLocalValue(DRAFT_STORAGE_KEY, serialized).catch(() => undefined);
    } catch {
      // Skip this write; the next valid state change persists again.
    }
  }, [draftState, hydrated]);

  const startDraft = () => {
    if (
      setup.platform !== "underdog" &&
      countRedraftStartingSlots(setup.lineup) > setup.rounds
    ) {
      return;
    }
    const room = roomFromSetup(setup);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setDraftState(createFantasyCompanionState(room));
  };

  const newRoom = () => {
    if (draftState && draftState.picks.length > 0 && !window.confirm("Leave this draft and clear its recorded picks?")) return;
    setSetup(
      draftState
        ? setupFromRoom(
            draftState.room,
            setup.platform === "sleeper" ? "sleeper" : "espn"
          )
        : setup
    );
    setDraftState(null);
    void removeLocalValue(DRAFT_STORAGE_KEY).catch(() => undefined);
  };

  if (!hydrated) {
    return (
      <main className="loading-page">
        <BrandMark />
        <span><RefreshCw size={18} className="is-spinning" aria-hidden="true" /> Opening saved draft</span>
      </main>
    );
  }

  if (awaySetup) {
    return (
      <AwayDraftView
        setup={awaySetup}
        onBack={() => setAwaySetup(null)}
      />
    );
  }

  return draftState ? (
    <DraftConsole
      state={draftState}
      platform={setup.platform}
      onStateChange={setDraftState}
      onNewRoom={newRoom}
    />
  ) : (
    <SetupPanel
      setup={setup}
      onChange={setSetup}
      onStart={startDraft}
      onPrepareAway={() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        setAwaySetup(setup);
      }}
    />
  );
}
