"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useOptimistic, useRef, useState } from "react";

import { DeferredCompareTray } from "@/components/fantasy/DeferredCompareTray";
import { DeferredPlayerDetailDrawer } from "@/components/fantasy/DeferredPlayerDetailDrawer";
import {
  FantasyRouteHeader,
  FantasySectionHeading,
  FreshnessParts,
  type FreshnessPart,
} from "@/components/fantasy/FantasyRouteHeader";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy/PositionFilterBar";
import { positionClass } from "@/components/fantasy/positionClass";
import { scrollChildIntoViewX } from "@/components/fantasy/scrollChildIntoViewX";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import "@/components/fantasy/fantasy-bestball.css";
import { useBestBallSnapshot } from "@/hooks/useBestBallSnapshot";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getBestBallConsensusIssue,
  getBestBallModelSourceIssue,
  getContestPreset,
  hasSupportedBestBallAdp,
  sortBestBallRankings,
  type BestBallContestId,
  type RankedBestBallPlayer,
} from "@/lib/bestBall";
import { SHELL_CLASS, getNflRegularSeasonWeek, getSnapshotStaleness } from "@/lib/fantasyUtils";
import type { BestBallSnapshot } from "@/lib/bestBallSnapshot";
import type { Player } from "@/types";

import {
  buildBestBallHref,
  normalizeBestBallQuery,
  normalizeBestBallState,
  type BestBallPositionFilter,
  type BestBallSearchState,
} from "./best-ball-state";

interface BestBallClientProps {
  initialState: BestBallSearchState;
}

interface ContestCopy {
  id: BestBallContestId;
  label: string;
  shortLabel: string;
  format: string;
  structure: string;
  brief: string;
  build: string;
  risk: string;
  /** Sit and Go has no playoff bracket, so its Week 17 column dims instead of reading as a lever. */
  showsWeek17: boolean;
}

const CONTESTS: ContestCopy[] = [
  {
    id: "bbm-vii",
    label: "Best Ball Mania VII",
    shortLabel: "Mania",
    format: "12 teams, 18 rounds, half PPR",
    structure: "Weeks 1 through 14 advance two teams from each group, followed by three playoff rounds.",
    brief:
      "I want a roster that can advance through the regular season and still has connected upside in Week 17.",
    build: "Use two or three quarterbacks, four to six running backs, seven to nine receivers, and two or three tight ends. Let early draft capital decide which end of each range to use.",
    risk: "Week 17 pairings are a tiebreaker. Reaching past a full tier for them gives away too much regular season value.",
    showsWeek17: true,
  },
  {
    id: "puppy",
    label: "The Puppy",
    shortLabel: "Puppy",
    format: "12 teams, 18 rounds, half PPR",
    structure: "Weeks 1 through 14 advance two teams, then one team advances from each playoff group.",
    brief:
      "The roster construction is close to Mania, but each later round asks for a higher finish within a smaller group.",
    build: "Keep the same balanced ranges as Mania and favor players who complete a quarterback stack without forcing the pick.",
    risk: "A lower entry fee does not change the roster math. I would not turn this into a collection of low probability bets.",
    showsWeek17: true,
  },
  {
    id: "little-dalmatian-2",
    label: "The Little Dalmatian 2",
    shortLabel: "Dalmatian",
    format: "12 teams, 18 rounds, half PPR",
    structure: "Weeks 1 through 14 advance three of twelve teams, then one team advances out of a ten team group in Week 15 and out of a six team group in Week 16, before a 470 team final in Week 17.",
    brief:
      "The entry is a dollar and the field is large, but the roster problem is the same one Mania asks, so I draft it the same way.",
    build: "Keep the same balanced ranges as Mania and let draft capital set the position counts, because a wider first cut does not change what a good roster looks like.",
    risk: "Three of twelve advancing out of the regular season is a softer first cut than Mania, so I would not give up regular season value for Week 17 pairings any earlier here than I would there.",
    showsWeek17: true,
  },
  {
    id: "six-man",
    label: "6-Man Best Ball",
    shortLabel: "6-Man",
    format: "6 teams, 18 rounds, half PPR",
    structure: "Underdog runs several tournament shapes on this style, from the two round Frenchie Sprint that scores Weeks 1 through 14 and then Weeks 15 through 17 together, up to the usual four round formats.",
    brief:
      "Six teams drafting an 18 player roster means every entrant leaves with players a twelve team room would never reach, so I stop treating scarcity as the main constraint.",
    build: "Take the best available player later than I would in a twelve team room, because the tier behind the one I am looking at is still there on the way back.",
    risk: "The snapshot's ADP comes from twelve team drafts, so it prices players correctly but not pick slots here, and reading it as a reach or a steal will mislead me.",
    showsWeek17: true,
  },
  {
    id: "eliminator",
    label: "The Eliminator",
    shortLabel: "Eliminator",
    format: "12 teams, 18 rounds, half PPR",
    structure: "Six teams survive Week 1, then head to head survival runs through Week 16 before a three team final.",
    brief:
      "This format keeps asking the roster to survive one week at a time, so I care more about role security and weekly coverage.",
    build: "Spread bye weeks, avoid fragile position rooms, and add enough contingent upside to improve as the season moves.",
    risk: "A concentrated stack can create a strong ceiling, but it can also put too much of one survival week on one NFL game.",
    showsWeek17: true,
  },
  {
    id: "weekly-winners",
    label: "Weekly Winners",
    shortLabel: "Weekly",
    format: "12 teams, 18 rounds, half PPR model",
    structure: "Each weekly score competes against the full contest field as a separate result. Underdog says group size, player pool, and slate can vary, so the linked tracker applies only when the contest card matches this model.",
    brief:
      "I am building for at least one exceptional weekly combination rather than a steady season long total.",
    build: "Create one or two clear quarterback stack paths. The current snapshot has no player level weekly projections, so weekly variation stays neutral instead of being estimated from position alone.",
    risk: "Large team stacks are rare in top weekly lineups. Concentration should have a reason tied to one or two scoring paths.",
    showsWeek17: true,
  },
  {
    id: "sit-and-go",
    label: "Sit and Go",
    shortLabel: "Sit and Go",
    format: "12 teams, 18 rounds, half PPR model",
    structure: "The roster competes over the full regular season slate without a tournament playoff bracket. Underdog says group size, roster size, and scoring can vary, so the linked tracker applies only when the contest card matches this model.",
    brief:
      "This is the cleanest season long best ball problem, so I put more weight on total points and less on Week 17 correlation.",
    build: "Draft for usable weekly production, cover byes, and use stacks when the underlying players are already good values.",
    risk: "Playoff correlation does not add value here, and it should not move a player up the board.",
    showsWeek17: false,
  },
  {
    id: "superflex",
    label: "Superflex",
    shortLabel: "Superflex",
    format: "12 teams, 20 rounds, half PPR model",
    structure: "A separate slot beside the normal flex can use a quarterback, and the room starts one fewer receiver to pay for it. The contest label determines the rest of the rules, so the linked tracker applies only when the contest card matches this model.",
    brief:
      "Quarterbacks carry more weekly lineup value here because two can score for the roster at the same time.",
    build: "Move quarterbacks up, leave the draft with three or four starters, and protect against shared byes before filling the last luxury pick.",
    risk: "A fourth quarterback can be useful, but only after the roster has enough receivers and playable depth at every other position.",
    showsWeek17: true,
  },
];

const POSITION_OPTIONS: PositionFilterOption<BestBallPositionFilter>[] = [
  { value: "all", label: "All" },
  { value: "QB", label: "QB", position: "QB" },
  { value: "RB", label: "RB", position: "RB" },
  { value: "WR", label: "WR", position: "WR" },
  { value: "TE", label: "TE", position: "TE" },
];

const RULES_URL = "https://help.underdogsports.com/en/articles/11159786-daily-vs-best-ball-scoring";

const OBSERVED_FINDINGS = [
  {
    title: "Build a few clear stack paths",
    body: "The 2025 Best Ball Mania study found that teams with three quarterback stacks reached the final at about twice the rate of teams with none, while larger same team groups stopped helping after roughly four or five players.",
    href: "https://www.4for4.com/2026/preseason/how-winners-draft-quarterbacks-underdog-best-ball-mania",
    source: "4for4 quarterback study",
  },
  {
    title: "Let draft capital set position counts",
    body: "Three tight end builds have scored well across several Mania seasons, but an early elite tight end changes the need for a third option. The count is an output of the picks that came before it.",
    href: "https://www.4for4.com/2026/preseason/how-winners-draft-tight-ends-underdog-best-ball-mania",
    source: "4for4 tight end study",
  },
  {
    title: "Treat the 2025 running back result as an exception worth studying",
    body: "A Round 1 running back advanced about 24% of the time in the 2025 tournament, compared with roughly 12% for teams without one. Two running backs in the first two rounds advanced about 30% of the time, but earlier tournaments did not produce the same result.",
    href: "https://www.4for4.com/2026/preseason/how-winners-draft-running-backs-underdog-best-ball-mania",
    source: "4for4 running back study",
  },
  {
    title: "Keep enough receiver volume",
    body: "In the 2025 tournament, the receiver paths that beat the average had four or five receivers through Round 7. I would keep that volume while staying open to an early running back when the board gives me one.",
    href: "https://www.4for4.com/2026/preseason/how-winners-draft-wide-receivers-underdog-best-ball-mania",
    source: "4for4 receiver study",
  },
  {
    title: "Use the final week schedule late in a decision",
    body: "Week 17 opponents create one more way for a playoff lineup to score together, but the schedule study supports using that relationship after player quality and average draft position are already close.",
    href: "https://www.4for4.com/2026/preseason/best-ball-using-schedule-your-advantage",
    source: "4for4 schedule study",
  },
  {
    title: "Keep weekly stacks small enough to hit",
    body: "Underdog's study of more than 500,000 past rosters found that top weekly lineups usually had one or two stack connections. Large stacks were rare, which supports building a few clear scoring paths instead of tying one week to an entire NFL team.",
    href: "https://underdognetwork.com/football/best-ball-research/strategy-data-for-underdog-fantasys-weekly-winners",
    source: "Underdog weekly lineup study",
  },
];

const RECOMMENDATIONS = [
  {
    number: "01",
    title: "Start with the room price",
    body: "I use Underdog average draft position as the price and best ball consensus as a second opinion. A large gap is a prompt to check the player, not an automatic pick.",
  },
  {
    number: "02",
    title: "Make each stack earn its place",
    body: "I want two or three quarterback stack paths in tournament drafts, usually with no more than four or five players from one team. Every piece still needs a playable role.",
  },
  {
    number: "03",
    title: "Change the build with the contest",
    body: "I lower final week correlation in Sit and Go, focus on weekly position coverage in Eliminator, leave Weekly Winners variation neutral without player-level weekly projections, and use a separate sourced order in Superflex.",
  },
  {
    number: "04",
    title: "Leave room for new information",
    body: "Roles and prices keep moving through the summer. Later 2025 Mania drafts scored about ten more points per week than drafts completed before the NFL Draft, so I would keep refreshing the board.",
    href: "https://www.4for4.com/2026/preseason/how-draft-date-impacts-best-ball-leagues",
  },
];

const PAGE_SIZE = 80;

// A round break is one draft round wide, so its size is the selected contest's
// team count rather than a constant. 6-Man drafts the same 18-round roster with half
// the room, so a 12-pick round would put its players two rounds off their real one.

// Pinned to UTC so a date-only value like "2026-08-09" is not parsed as UTC
// midnight and then rendered a day earlier for viewers west of UTC.
// The head's line names the season once, so its dates leave the year off.
function formatDate(value: string | null | undefined, withYear = true): string {
  if (!value || Number.isNaN(Date.parse(value))) return "Not published";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(value));
}

/**
 * A source's name with the word for what it supplies, added only when the name does
 * not already carry it. "Underdog ADP via Hayden Winks" is already an ADP, so it does
 * not become "Underdog ADP via Hayden Winks ADP".
 */
function nameWith(provider: string, word: string): string {
  return provider.toLowerCase().includes(word.toLowerCase()) ? provider : `${provider} ${word}`;
}

function getFreshnessWarning(
  snapshot: BestBallSnapshot | null,
  contest: BestBallContestId
): string | null {
  if (!snapshot) return null;
  const rankingAsOf =
    contest === "superflex" ? snapshot.superflexSource?.asOf : snapshot.rankingSource.asOf;
  const checks = [
    snapshot.generatedAt,
    rankingAsOf,
    ...(hasSupportedBestBallAdp(contest) ? [snapshot.adpSource?.asOf] : []),
  ];
  const stale = checks.some((value) => getSnapshotStaleness(value) === "stale");
  if (!stale) return null;

  // The four-day band still trips in season, and it should, because the
  // sources are dated. But "refresh window" and "live room" are August words:
  // the market closed at kickoff and the builder keeps the snapshot frozen
  // from Week 1, so the note names the dates and what stays paused instead.
  if (getNflRegularSeasonWeek(snapshot.season) >= 1) {
    const adpDate =
      hasSupportedBestBallAdp(contest) && snapshot.adpSource
        ? ` and the ${snapshot.adpSource.provider.split(" ")[0]} ADP ${formatDate(snapshot.adpSource.asOf)}`
        : "";
    const moves = adpDate ? "neither will move again" : "it will not move again";
    return `This consensus is dated ${formatDate(rankingAsOf ?? snapshot.generatedAt)}${adpDate}, and ${moves} now that the market has closed at kickoff. The board stays as a frozen reference for next summer, and the draft tracker keeps Draft Outlook and its exact player cards paused because they need a current consensus.`;
  }

  return "One or more best ball sources are older than the normal refresh window. Check the dates before using this board in a live room.";
}

function formatRank(value: number | null | undefined): string {
  return Number.isFinite(value) ? Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1) : "NA";
}

function getConsensusRank(player: Player): number {
  return player.rankEcr ?? player.averageRank;
}

function getAdpDelta(player: Player): number | null {
  if (!Number.isFinite(player.adp)) return null;
  return Number(player.adp) - getConsensusRank(player);
}

/** Cell title for a row whose published consensus rank is withheld. */
const WITHHELD_CELL_TITLE =
  "The published consensus rank for this player sits outside its own expert range, so the board withholds it";

/**
 * The copy of a withheld row that the shared drawer and compare modal see.
 * Neither component knows the best ball flag, and both derive tier, position
 * rank, and the value or reach signal from `rankEcr` (falling back to
 * `averageRank`), so a withheld row hands them a copy with those fields
 * blanked. `rankAverage`, `minRank`, and `maxRank` stay, because the expert
 * band is the half of the record that agrees with itself and the range bar
 * reads only those. Nothing is substituted; the fields are simply absent.
 */
function withholdConsensus(player: RankedBestBallPlayer): RankedBestBallPlayer {
  if (!player.consensusWithheld) return player;
  return {
    ...player,
    rankEcr: undefined,
    averageRank: Number.NaN,
    tier: undefined,
    positionRank: undefined,
  };
}

function formatAdpDelta(value: number | null): string {
  if (value === null) return "NA";
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.05) return "Even";
  // The same minus sign the rankings and redraft boards print, so a negative reads alike on every board.
  return `${rounded > 0 ? "+" : "\u2212"}${Math.abs(rounded).toFixed(1)}`;
}

function describeAdpDelta(value: number | null): string {
  if (value === null) return "No matching room price in this snapshot";
  if (value >= 3) return `The market usually lets him go ${value.toFixed(1)} picks after the PPR reference`;
  if (value <= -3) return `The market takes him ${Math.abs(value).toFixed(1)} picks before the PPR reference`;
  return "Priced about even with the PPR reference";
}

/**
 * Underdog pays 0.5 per reception, but FantasyPros publishes exactly one best ball
 * consensus and it is full PPR. The half PPR boards it does publish are redraft boards,
 * which would drop the best ball roster logic this tool is built on, so the mismatch
 * is disclosed rather than traded away.
 */
const SCORING_BASIS_NOTE =
  "ECR is full PPR while these contests score half PPR, so it reads pass catchers a little high and is a reference rather than a price.";

/** The one live copy of the board-order policy, shown with the selected contest. */
function getBoardPolicyLine(
  contest: ContestCopy,
  adpAvailable: boolean,
  adpProvider: string | undefined
): string {
  return `${describeBoardOrder(contest, adpAvailable, adpProvider)} · ${SCORING_BASIS_NOTE}`;
}

function describeBoardOrder(
  contest: ContestCopy,
  adpAvailable: boolean,
  adpProvider: string | undefined
): string {
  if (contest.id === "superflex") {
    return "Board order follows the separate sourced Superflex consensus · PPR ECR stays as the standard lineup reference, and this snapshot has no Superflex room ADP, so ADP and value stay NA.";
  }
  if (hasSupportedBestBallAdp(contest.id)) {
    return adpAvailable
      ? `Board order follows current ${nameWith(adpProvider ?? "Underdog", "ADP")} · value is ADP minus PPR best ball ECR, so a positive number means the market usually lets him go later.`
      : "Current ADP is unavailable or stale in this snapshot · board order falls back to PPR best ball ECR, and ADP and value stay NA.";
  }
  if (!contest.showsWeek17) {
    return "No matching ADP for this slate in the snapshot · board order follows PPR best ball ECR · the Week 17 column is dimmed because playoff correlation does not apply here.";
  }
  return "No matching ADP for this slate in the snapshot · board order follows PPR best ball ECR, and ADP and value stay NA instead of borrowing another slate's price.";
}

function countOf(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

interface RoundGroup {
  round: number;
  rows: RankedBestBallPlayer[];
}

function BestBallPlayerRow({
  player,
  opponent,
  adpAvailable,
  showsWeek17,
  contestLabel,
  onOpenDetail,
}: {
  player: RankedBestBallPlayer;
  opponent?: string;
  adpAvailable: boolean;
  showsWeek17: boolean;
  contestLabel: string;
  onOpenDetail: (player: RankedBestBallPlayer) => void;
}) {
  const atUndraftedFloor = adpAvailable && player.isUndraftedAtContestFloor;
  const playerAdpAvailable =
    adpAvailable && !atUndraftedFloor && Number.isFinite(player.adp);
  // A withheld consensus prints no value either, since value is ADP minus the
  // rank the board just declined to print.
  const withheld = player.consensusWithheld;
  const delta = playerAdpAvailable && !withheld ? getAdpDelta(player) : null;
  // A gap of three picks or more is weighted and toned, and the sign says which way it runs.
  const valueTone =
    delta !== null && delta >= 3
      ? "ffb-is-strong ffb-good"
      : delta !== null && delta <= -3
        ? "ffb-is-strong ffb-warn"
        : "ffb-is-flat";

  return (
    // The opener overlays the row instead of wrapping it: an aria-label on a
    // wrapping button would override every cell for screen readers. The cells
    // sit above it so the per-cell explanations fire on hover and the numbers
    // stay selectable, and the row's own click still opens the drawer unless
    // the visitor is selecting text. The opener is the keyboard path.
    <li
      className="ffb-row"
      onClick={(event) => {
        if (window.getSelection()?.toString()) return;
        // Pointer clicks land on the cells above the opener. Focus the opener
        // so closing the drawer returns to this player.
        event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
        onOpenDetail(player);
      }}
    >
      <button
        type="button"
        aria-label={`Open ${player.name} details`}
        onClick={(event) => {
          event.stopPropagation();
          onOpenDetail(player);
        }}
        className="ffb-row-open"
      />
      <span className="ffb-c-rank" title="Board rank under this contest lens">
        {player.bestBallRank}
      </span>
      <span className={`ffb-chip ${positionClass(player.position)}`.trimEnd()}>
        {player.position}
        {!withheld && Number.isFinite(player.positionRank) ? player.positionRank : ""}
      </span>
      <span className="ffb-c-name" title={player.name}>
        {player.name}
      </span>
      <span className="ffb-c-team">{player.team || "FA"}</span>
      {/* Each value's name is inside its own cell, so it hides when the cell
          does. A phone prints two numbers at the right of a row: ADP over
          value where the lens has a current ADP, and the consensus rank alone
          where it does not. */}
      <span
        className={`ffb-c-num${adpAvailable ? " ffb-m-top" : " ffb-is-flat"}`}
        title={
          atUndraftedFloor
            ? "At the contest-floor placeholder, not a literal price"
            : "Current Underdog average draft position"
        }
      >
        <span className="ffb-vh">ADP </span>
        {atUndraftedFloor ? (
          <span className="ffb-label ffb-bb-word">Undrafted</span>
        ) : adpAvailable ? (
          formatRank(player.adp)
        ) : (
          "NA"
        )}
      </span>
      <span
        className={`ffb-c-num${adpAvailable ? "" : " ffb-m-top"}${withheld ? " ffb-is-flat" : ""}`}
        title={withheld ? WITHHELD_CELL_TITLE : "PPR best ball expert consensus rank"}
      >
        <span className="ffb-vh">ECR </span>
        {withheld ? (
          <span className="ffb-label ffb-bb-word">Withheld</span>
        ) : (
          formatRank(getConsensusRank(player))
        )}
      </span>
      <span
        className={`ffb-c-num ${valueTone}${adpAvailable ? " ffb-m-sub" : ""}`}
        title={withheld ? WITHHELD_CELL_TITLE : describeAdpDelta(delta)}
      >
        <span className="ffb-vh">Value </span>
        {formatAdpDelta(delta)}
      </span>
      <span className="ffb-c-bye">
        <span className="ffb-vh-desk">Bye </span>
        {player.byeWeek ?? "NA"}
      </span>
      {/* Sit and Go has no playoff bracket, so its Week 17 opponent prints
          muted, with a title that says why. */}
      <span
        className={`ffb-c-num ffb-m-meta${showsWeek17 ? "" : " ffb-is-flat"}`}
        title={
          showsWeek17
            ? `Week 17: ${player.team || "FA"} vs ${opponent ?? "TBD"}`
            : `Week 17 correlation does not move this board in ${contestLabel}`
        }
      >
        <span className="ffb-vh-desk">W17 </span>
        {opponent ?? "NA"}
      </span>
    </li>
  );
}

export function BestBallClient({ initialState }: BestBallClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { snapshot, isLoading, error, retry } = useBestBallSnapshot();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [detailPlayer, setDetailPlayer] = useState<RankedBestBallPlayer | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialState.query);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const contestRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const retriedRef = useRef(false);
  const canonicalState = useMemo(() => {
    const fromUrl = normalizeBestBallState(searchParams);
    return searchParams.size > 0 ? fromUrl : initialState;
  }, [initialState, searchParams]);
  const [routeState, setOptimisticRouteState] = useOptimistic(
    canonicalState,
    (_current, next: BestBallSearchState) => next,
  );

  const activeContest =
    CONTESTS.find((contest) => contest.id === routeState.contest) ?? CONTESTS[0];
  const activePreset = getContestPreset(routeState.contest);

  const adpAvailable =
    hasSupportedBestBallAdp(routeState.contest) &&
    snapshot?.adpSource !== null &&
    getSnapshotStaleness(snapshot?.adpSource?.asOf) !== "stale";

  const modelPlayers = useMemo(
    () =>
      (snapshot?.players ?? []).map((player) =>
        adpAvailable ? player : { ...player, adp: undefined }
      ),
    [adpAvailable, snapshot?.players]
  );

  const orderedPlayers = useMemo(() => {
    if (!snapshot) return [];
    return sortBestBallRankings(modelPlayers, routeState.contest);
  }, [modelPlayers, routeState.contest, snapshot]);
  // The shared drawer and modal read a plain Player, so the copy they get has
  // the undrafted-floor ADP and any withheld consensus fields already blanked.
  const comparablePlayerLookup = useMemo(
    () =>
      new Map(
        orderedPlayers.map((player) => {
          const withheld = withholdConsensus(player);
          return [
            player.id,
            player.isUndraftedAtContestFloor ? { ...withheld, adp: undefined } : withheld,
          ];
        })
      ),
    [orderedPlayers]
  );
  const resolveComparablePlayer = useCallback(
    (id: string) => comparablePlayerLookup.get(id),
    [comparablePlayerLookup]
  );
  const isConsensusWithheld = useCallback(
    (player: Player) => comparablePlayerLookup.get(player.id)?.consensusWithheld ?? false,
    [comparablePlayerLookup]
  );

  const filteredPlayers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orderedPlayers.filter((player) => {
      const matchesPosition = routeState.position === "all" || player.position === routeState.position;
      const matchesSearch =
        !query ||
        `${player.name} ${player.team} ${player.position}`.toLowerCase().includes(query);
      return matchesPosition && matchesSearch;
    });
  }, [orderedPlayers, routeState.position, searchQuery]);

  const visiblePlayers = filteredPlayers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlayers.length;

  // Group the windowed rows into rounds keyed off the lens rank, so a filtered
  // board still shows each player inside his real round. A round's count comes
  // from the whole filtered board, so a round cut by the window says how many
  // players it holds and not how many have mounted.
  const roundSize = activePreset.teams;
  // The contest drafts this many rounds. Everyone the board ranks past its last
  // pick sits in one group after them, since a round past the last does not exist.
  const lastRound = activePreset.rounds;
  const roundGroups = useMemo<RoundGroup[]>(() => {
    const groups: RoundGroup[] = [];
    for (const player of visiblePlayers) {
      const round = Math.min(Math.ceil(player.bestBallRank / roundSize), lastRound + 1);
      const current = groups[groups.length - 1];
      if (!current || current.round !== round) groups.push({ round, rows: [player] });
      else current.rows.push(player);
    }
    return groups;
  }, [visiblePlayers, roundSize, lastRound]);
  const roundCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const player of filteredPlayers) {
      const round = Math.min(Math.ceil(player.bestBallRank / roundSize), lastRound + 1);
      counts.set(round, (counts.get(round) ?? 0) + 1);
    }
    return counts;
  }, [filteredPlayers, roundSize, lastRound]);

  function updateRouteState(patch: Partial<BestBallSearchState>) {
    // The typed query is the live one, so a contest or position tap carries it
    // along instead of reverting the field to whatever the URL last recorded.
    const next = { ...routeState, query: normalizeBestBallQuery(searchQuery), ...patch };
    startTransition(() => {
      setOptimisticRouteState(next);
      router.replace(buildBestBallHref(next, searchParams), { scroll: false });
    });
  }

  function clearSearch() {
    setSearchQuery("");
    updateRouteState({ query: "" });
    // Either Clear button leaves the page once the field is empty, so focus goes back to the field.
    searchRef.current?.focus();
  }

  // Reset the window whenever the lens, position, or search changes so a
  // narrowed list never starts deep into a stale offset.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on filter change
    setVisibleCount(PAGE_SIZE);
  }, [routeState.contest, routeState.position, searchQuery]);

  // Only adopt the URL's query when it genuinely differs from what is typed.
  // The URL form is trimmed, so comparing raw values made a trailing space
  // vanish from under the cursor once the URL write was debounced.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser Back/Forward can replace the URL-backed query
    setSearchQuery((current) =>
      normalizeBestBallQuery(current) === canonicalState.query ? current : canonicalState.query
    );
  }, [canonicalState.query]);

  // Every keystroke used to fire router.replace, which meant one round trip per
  // character and a trimmed value read straight back into the field. The board
  // filters on searchQuery, so only the shareable URL waits.
  const debouncedQuery = useDebounce(searchQuery, 200);
  useEffect(() => {
    // Push the normalized form, so the value written to the URL is the value
    // read back out of it and the effect settles after one replace.
    const nextQuery = normalizeBestBallQuery(debouncedQuery);
    if (nextQuery === routeState.query) return;
    updateRouteState({ query: nextQuery });
    // updateRouteState is recreated every render; the query is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, routeState.query]);

  // On a phone the contest switch scrolls sideways, so the pressed contest is
  // brought into view when the page opens on it and whenever it changes.
  useEffect(() => {
    const group = contestRef.current;
    const pressed = group?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (group && pressed) scrollChildIntoViewX(group, pressed);
  }, [routeState.contest]);

  // A round's head pins under the toolbar block, so it needs that block's
  // height, which changes when the controls wrap. Written straight to the
  // board's style, so a resize renders nothing. The area sheet builds the
  // kit's scroll margin for a focused row from the same number.
  useEffect(() => {
    const bar = barRef.current;
    const board = boardRef.current;
    if (!bar || !board || typeof ResizeObserver === "undefined") return;
    const write = () => board.style.setProperty("--ffb-bb-bar", `${bar.offsetHeight}px`);
    write();
    const observer = new ResizeObserver(write);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  // Retry leaves the page with the alert it sits in, so once the error clears
  // focus goes to the search field, which is enabled again by then.
  useEffect(() => {
    if (error || !retriedRef.current) return;
    retriedRef.current = false;
    searchRef.current?.focus();
  }, [error]);

  const trackerHref = `/fantasy-football/best-ball/draft-tracker?contest=${routeState.contest}`;
  const freshnessWarning = getFreshnessWarning(snapshot, routeState.contest);
  // The provider's self-consistency test on the PPR consensus. Every lens
  // prints that column, Superflex included, so the note shows on every lens.
  const consensusIssue = snapshot ? getBestBallConsensusIssue(snapshot) : null;
  const withheldCount = orderedPlayers.filter((player) => player.consensusWithheld).length;
  const boardReady = !isLoading && !error && visiblePlayers.length > 0;
  const policyLine = getBoardPolicyLine(activeContest, adpAvailable, snapshot?.adpSource?.provider);

  // A best ball board is a preseason artifact by construction. Once the season is
  // under way, say so instead of serving August ranks with no date on them.
  const seasonalWeek = getNflRegularSeasonWeek(snapshot?.season ?? 0);

  // The drawer's market sentence is pick advice ("Take him on schedule"), so it
  // prints only while this board would stand behind a pick: every source the
  // lens uses is current, and the season has not started.
  const verdictAvailable =
    snapshot !== null &&
    !freshnessWarning &&
    seasonalWeek < 1 &&
    getBestBallModelSourceIssue(snapshot, activePreset) === null;

  // The head carries only the brand word ("Underdog ADP via Hayden Winks" → "Underdog");
  // the full provider names stay linked in the line under the board. The first
  // part is there before the snapshot is, so the line holds its place.
  const freshnessParts: FreshnessPart[] = [
    { label: `${CONTESTS.length} contest lenses` },
    ...(snapshot
      ? [
          { label: String(snapshot.season) },
          ...(snapshot.adpSource
            ? [{ label: `${snapshot.adpSource.provider.split(" ")[0]} ADP ${formatDate(snapshot.adpSource.asOf, false)}` }]
            : []),
          {
            label: `${snapshot.rankingSource.provider.split(" ")[0]} consensus ${formatDate(snapshot.rankingSource.asOf ?? snapshot.generatedAt, false)}`,
          },
        ]
      : []),
  ];

  const countLine = isLoading
    ? "Loading players"
    : error
      ? "Rankings unavailable"
      : `${filteredPlayers.length} of ${orderedPlayers.length} on this board`;

  return (
    <section
      className="relative min-h-dvh overflow-x-clip"
      aria-label="Best ball rankings and strategy"
      data-testid="best-ball-shell"
    >
      <FantasyRouteHeader
        title="Best Ball"
        lead="Pick a contest lens for its room, how I read it, a build range, and the board I would draft from."
        freshness={<FreshnessParts parts={freshnessParts} />}
      >
        {/* Eight contests do not fit a phone, so there the switch is one row
            that scrolls sideways, and a contest that takes focus half off
            screen is brought into view. */}
        <div className="ffb-toolbar ffb-bb-lens">
          <div
            ref={contestRef}
            role="group"
            aria-label="Best ball contest"
            className="ffb-seg ffb-seg-scroll ffb-bb-contests"
            onFocus={(event) => scrollChildIntoViewX(event.currentTarget, event.target)}
          >
            {CONTESTS.map((contest) => (
              <button
                key={contest.id}
                type="button"
                aria-pressed={contest.id === routeState.contest}
                onClick={() => updateRouteState({ contest: contest.id })}
                className="ffb-seg-btn"
              >
                {contest.shortLabel}
              </button>
            ))}
          </div>
          <p className="ffb-count">Rules checked {formatDate(activePreset.rulesAsOf)}</p>
        </div>
      </FantasyRouteHeader>

      <div className={`${SHELL_CLASS} ffb-stack ffb-stack-page`}>
        {/* The rail is first in the markup, so a phone and a tablet draw the
            selected contest above the board with nothing reordered. From
            1200px the area sheet puts it in the second column. */}
        <div className="ffb-work ffb-bb-work">
          <div className="ffb-rail ffb-rail-scroll ffb-bb-rail">
            <section aria-label="Selected format" className="ffb-stack ffb-bb-format">
              <div className="ffb-bb-format-head">
                <h2 className="ffb-h2">{activeContest.label}</h2>
                <p className="ffb-fine">{activeContest.format}</p>
              </div>
              <div className="ffb-cluster ffb-bb-actions">
                <Link href={trackerHref} className="ffb-btn ffb-btn-primary">
                  Draft with this lens
                </Link>
                <a
                  href={activePreset.officialRulesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ffb-link ffb-link-out"
                >
                  Scoring rules
                </a>
              </div>
              {/* The notices sit under the action they qualify and above the
                  notes, so a dated or frozen board says so on the first screen. */}
              {seasonalWeek >= 1 || freshnessWarning || consensusIssue ? (
                <div className="ffb-bb-notices">
                  {seasonalWeek >= 1 || freshnessWarning ? (
                    <div className="ffb-bb-pair">
                      {seasonalWeek >= 1 ? (
                        <SeasonalScopeNote season={snapshot?.season ?? 0} week={seasonalWeek}>
                          Best ball is drafted before the season and scored through it, so this board
                          describes a market that closed at kickoff. Rankings and ADP here are the
                          preseason readings your drafts were made against, kept for reference rather
                          than refreshed. Ranks that still move are on the{" "}
                          <Link href="/fantasy-football/weekly">weekly board</Link>.
                        </SeasonalScopeNote>
                      ) : null}
                      {freshnessWarning ? (
                        <p role="status" className="ffb-notice ffb-notice-warn">
                          {freshnessWarning}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* The provider's own numbers disagreeing with each other. The
                      sentence carries the consensus date, and the rows it names
                      print no ECR, value, tier, or position rank while the
                      expert band stays. */}
                  {consensusIssue ? (
                    <div
                      role="note"
                      data-testid="best-ball-consensus-note"
                      className="ffb-notice ffb-notice-held"
                    >
                      <p>
                        <strong>Consensus withheld.</strong> {consensusIssue.charAt(0).toUpperCase()}
                        {consensusIssue.slice(1)}.
                      </p>
                      <p className="ffb-muted">
                        {withheldCount} of {orderedPlayers.length} rows on this board print no ECR,
                        value, tier, or position rank. Each one keeps its best, average, and worst
                        expert rank, which agree with each other. Board order is unchanged.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="ffb-stack ffb-stack-tight">
                {/* The room is the short summary. The three build notes sit
                    behind the toggle wherever the rail is above the board
                    (below 1200px), so a phone reaches the board without
                    reading them first, and they are open beside it. */}
                <dl className="ffb-bb-notes">
                  {[
                    { label: "The room", body: activeContest.structure, guidance: false },
                    { label: "How I read it", body: activeContest.brief, guidance: true },
                    { label: "2026 build range", body: activeContest.build, guidance: true },
                    { label: "What I would watch", body: activeContest.risk, guidance: true },
                  ].map((cell) => (
                    <div
                      key={cell.label}
                      className={`ffb-bb-note${cell.guidance && !guidanceOpen ? " hidden min-[1200px]:block" : ""}`}
                    >
                      <dt className="ffb-label ffb-muted">{cell.label}</dt>
                      <dd>{cell.body}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  className="ffb-btn ffb-bb-guide self-start min-[1200px]:hidden"
                  aria-expanded={guidanceOpen}
                  onClick={() => setGuidanceOpen((current) => !current)}
                >
                  {guidanceOpen ? "Hide build guidance" : "Show build guidance"}
                </button>
              </div>
              {/* The sentence describes the loaded snapshot, so it prints once
                  there is one. Until then its place is held, and after a
                  failed load the alert on the board says what happened. */}
              {snapshot ? (
                <p className="ffb-fine">{policyLine}</p>
              ) : isLoading ? (
                <div className="ffb-bb-order-skel" aria-hidden="true">
                  <span className="ffb-skel" />
                  <span className="ffb-skel" />
                  <span className="ffb-skel" />
                </div>
              ) : null}
            </section>
          </div>

          <div className="ffb-bb-main">
            <h2 className="sr-only">{activeContest.shortLabel} board</h2>
            <div
              ref={boardRef}
              className="ffb-board ffb-board-ruled ffb-board-plain ffb-board-open ffb-bb-board"
              data-testid="best-ball-board"
            >
              {/* The toolbar and the column heads pin as one block. The board
                  runs hundreds of rows, so position, search, and the count
                  stay reachable mid-scroll and the numbers keep their names. */}
              <div
                ref={barRef}
                className="ffb-sticky ffb-sticky-ruled"
                data-testid="best-ball-board-controls"
              >
                <div className="ffb-toolbar ffb-bb-tools">
                  <PositionFilterBar
                    ariaLabel="Best ball position"
                    options={POSITION_OPTIONS}
                    value={routeState.position}
                    onChange={(position) => updateRouteState({ position })}
                    disabled={Boolean(error)}
                  />
                  <div className="ffb-search">
                    <Search size={15} aria-hidden="true" />
                    <label htmlFor="best-ball-search" className="ffb-vh">
                      Search best ball rankings
                    </label>
                    <input
                      id="best-ball-search"
                      name="best-ball-search"
                      type="search"
                      ref={searchRef}
                      value={searchQuery}
                      maxLength={80}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      disabled={Boolean(error)}
                      autoComplete="off"
                      placeholder="Search player or team"
                      className="ffb-search-input"
                    />
                    {searchQuery && !error ? (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={clearSearch}
                        className="ffb-search-clear"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  {/* The route's one live region. On an error the alert below
                      is the announcement, so this line stops being one. */}
                  <p className="ffb-count" aria-live={error ? undefined : "polite"}>
                    {countLine}
                  </p>
                </div>
                {/* Rendered only once the board has rows, so the loading,
                    error, and empty states show no heads for columns that are
                    not there. Each cell carries its own hidden name, so this
                    row stays aria-hidden and nothing is read twice. */}
                {boardReady && (
                  <div className="ffb-colhead" aria-hidden="true">
                    <span className="ffb-h-num ffb-is-sorted ffb-m-show">Rk</span>
                    <span className="ffb-h-pos">Pos</span>
                    <span className="ffb-m-show">Player</span>
                    <span>Team</span>
                    <span className="ffb-h-num">UD ADP</span>
                    <span className="ffb-h-num">PPR ECR</span>
                    <span className="ffb-h-num" title="ADP minus PPR best ball ECR">
                      Value
                    </span>
                    <span className="ffb-h-num">Bye</span>
                    <span className="ffb-h-num">W17</span>
                    <span className="ffb-only-phone ffb-m-show">{adpAvailable ? "ADP, value" : "ECR"}</span>
                  </div>
                )}
              </div>

              {error ? (
                <div role="alert" className="ffb-notice ffb-notice-bad">
                  <p>
                    <strong>{error}</strong> The strategy notes are still available while the
                    published board reloads.
                  </p>
                  <div className="ffb-notice-actions">
                    <button
                      type="button"
                      onClick={() => {
                        retriedRef.current = true;
                        retry();
                      }}
                      className="ffb-btn"
                    >
                      Retry rankings
                    </button>
                  </div>
                </div>
              ) : isLoading ? (
                // The count line in the pinned block is the live region that
                // says "Loading players", so the placeholder rows stay silent.
                <div aria-hidden="true">
                  {Array.from({ length: 10 }, (_, index) => (
                    <div key={`best-ball-loading-${index}`} className="ffb-skel-row">
                      <span className="ffb-skel" />
                      <span className="ffb-skel" />
                      <span className="ffb-skel" />
                      <span className="ffb-skel" />
                      <span className="ffb-skel" />
                    </div>
                  ))}
                </div>
              ) : visiblePlayers.length > 0 ? (
                <>
                  {roundGroups.map((group) => {
                    const count = roundCounts.get(group.round) ?? group.rows.length;
                    const past = group.round > lastRound;
                    const roundName = past ? `Past round ${lastRound}` : `Round ${group.round}`;
                    return (
                      <section key={`round-${group.round}`} className="ffb-tier" aria-label={roundName}>
                        <header className="ffb-tier-head">
                          <h3 className="ffb-tier-name">
                            <span className="ffb-tier-tab">{roundName}</span>{" "}
                            {/* A full round needs no count. A filter that leaves
                                part of one says how many of its players match,
                                and so does the group past the last round. */}
                            {past || count !== roundSize ? (
                              <>
                                <span className="ffb-tier-count">{countOf(count, "player", "players")}</span>{" "}
                              </>
                            ) : null}
                            <span className="ffb-tier-range">
                              {past
                                ? `Ranks ${lastRound * roundSize + 1} and later`
                                : `Picks ${group.round * roundSize - (roundSize - 1)}–${group.round * roundSize}`}
                            </span>
                          </h3>
                        </header>
                        <ul className="ffb-rows">
                          {group.rows.map((player) => (
                            <BestBallPlayerRow
                              key={player.id}
                              player={player}
                              opponent={snapshot?.week17Opponents[player.team]}
                              adpAvailable={adpAvailable}
                              showsWeek17={activeContest.showsWeek17}
                              contestLabel={activeContest.label}
                              onOpenDetail={setDetailPlayer}
                            />
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      className="ffb-more"
                    >
                      Show the next{" "}
                      {countOf(Math.min(PAGE_SIZE, filteredPlayers.length - visibleCount), "player", "players")}
                    </button>
                  )}
                </>
              ) : (
                <div className="ffb-empty">
                  <p className="ffb-empty-title">No players match on this board.</p>
                  {/* Each control clears only itself, so the way out never
                      resets a filter the visitor still wants. Either button
                      leaves with the empty state, so focus goes to the control
                      it just reset. */}
                  {searchQuery ? (
                    <button type="button" onClick={clearSearch} className="ffb-btn">
                      Clear search
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        updateRouteState({ position: "all" });
                        boardRef.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
                      }}
                      className="ffb-btn"
                    >
                      Show all positions
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="ffb-method ffb-bb-method">
              {adpAvailable && (
                <p>
                  Players labeled Undrafted are at the contest-floor placeholder, not a literal
                  price, so their board order falls back to PPR best ball ECR and value stays blank.
                </p>
              )}
              {snapshot && (
                <p>
                  Snapshot built {formatDate(snapshot.generatedAt)} · rankings{" "}
                  <a href={snapshot.rankingSource.url} target="_blank" rel="noopener noreferrer">
                    {nameWith(snapshot.rankingSource.provider, "PPR best ball")}
                    {snapshot.rankingSource.expertCount
                      ? ` · ${countOf(snapshot.rankingSource.expertCount, "expert", "experts")}`
                      : ""}
                  </a>
                  {snapshot.adpSource && (
                    <>
                      {" "}
                      · ADP{" "}
                      <a href={snapshot.adpSource.url} target="_blank" rel="noopener noreferrer">
                        {/* The label before the link already says ADP. */}
                        {snapshot.adpSource.provider.replace(/\s+ADP\b/, "")} standard slate
                      </a>
                    </>
                  )}
                  {routeState.contest === "superflex" && snapshot.superflexSource && (
                    <>
                      {" "}
                      · Superflex order{" "}
                      <a href={snapshot.superflexSource.url} target="_blank" rel="noopener noreferrer">
                        {snapshot.superflexSource.provider}
                      </a>
                    </>
                  )}
                  {snapshot.scheduleSource && (
                    <>
                      {" "}
                      · Week 17{" "}
                      <a href={snapshot.scheduleSource.url} target="_blank" rel="noopener noreferrer">
                        {snapshot.scheduleSource.provider}
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <section aria-labelledby="field-notes-heading">
          <div className="ffb-sechead ffb-sechead-lg">
            <FantasySectionHeading id="field-notes-heading">
              What has worked, and how I would use it
            </FantasySectionHeading>
          </div>
          <p className="ffb-copy">
            The findings below describe past drafts and are not proof that one construction will win
            the next tournament. I use them to set boundaries, then let the current room and the
            selected contest decide the roster.
          </p>
          <div className="ffb-columns ffb-bb-fieldnotes">
            <div className="ffb-stack ffb-stack-tight">
              <h3 className="ffb-h3">Observed in past drafts</h3>
              <ul className="ffb-notes ffb-bb-findings">
                {OBSERVED_FINDINGS.map((finding) => (
                  <li key={finding.title} className="ffb-note">
                    <h4 className="ffb-h4">{finding.title}</h4>
                    <p>{finding.body}</p>
                    <p>
                      <a
                        href={finding.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ffb-link ffb-link-out"
                      >
                        {finding.source}
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ffb-stack ffb-stack-tight">
              <h3 className="ffb-h3">2026 recommendation</h3>
              <ol className="ffb-notes">
                {RECOMMENDATIONS.map((recommendation) => (
                  <li key={recommendation.number} className="ffb-note">
                    <span className="ffb-note-num" aria-hidden="true">
                      {recommendation.number}
                    </span>
                    <h4 className="ffb-h4">{recommendation.title}</h4>
                    <p>{recommendation.body}</p>
                    {recommendation.href && (
                      <p>
                        <a
                          href={recommendation.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ffb-link ffb-link-out"
                        >
                          4for4 draft date study
                        </a>
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section aria-label="Format reference">
          <div className="ffb-sechead ffb-sechead-lg">
            <h2 className="ffb-h2">The baseline Underdog roster</h2>
          </div>
          <div className="ffb-prose">
            <p>
              Standard NFL best ball drafts use 12 teams and 18 rounds with one quarterback, two
              running backs, three receivers, one tight end, one flex, and ten bench spots. The site
              sets the strongest lineup each week, and there are no waivers, trades, or manual lineup
              decisions. Scoring is half PPR unless the contest says otherwise.
            </p>
            <p>
              <a href={RULES_URL} target="_blank" rel="noopener noreferrer" className="ffb-link ffb-link-out">
                Official scoring and lineup rules
              </a>
            </p>
          </div>
        </section>

        <p className="ffb-method ffb-method-ruled">
          Working ranges, not quotas, and nothing here guarantees a result
        </p>
      </div>

      {/* bestBallRank is the board order under the lens, which on the ADP
          lenses is the market and never the expert consensus, so the drawer
          chip and the modal row carry that name with the number. The modal
          adds its own consensus row from rankEcr, so the two rank spaces stay
          named and separate. */}
      <DeferredPlayerDetailDrawer
        player={detailPlayer ? withholdConsensus(detailPlayer) : null}
        publishedRank={detailPlayer ? String(detailPlayer.bestBallRank) : undefined}
        publishedRankLabel="Board rank"
        adpAvailable={
          adpAvailable && !detailPlayer?.isUndraftedAtContestFloor
        }
        valueSignalAvailable={adpAvailable && !detailPlayer?.consensusWithheld}
        verdictAvailable={verdictAvailable}
        consensusWithheld={detailPlayer?.consensusWithheld ?? false}
        onClose={() => setDetailPlayer(null)}
      />
      <DeferredCompareTray
        resolvePlayer={resolveComparablePlayer}
        playerDataReady={!isLoading && Boolean(snapshot)}
        pruneUnresolvedIds={false}
        publishedRank={(player) =>
          String(comparablePlayerLookup.get(player.id)?.bestBallRank ?? "")
        }
        publishedRankLabel="Board rank"
        consensusWithheld={isConsensusWithheld}
        valueSignalAvailable={adpAvailable}
        adpAvailable={adpAvailable}
      />
    </section>
  );
}
