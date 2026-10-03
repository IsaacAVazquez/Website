"use client";

import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useOptimistic, useState } from "react";

import { DeferredCompareTray } from "@/components/fantasy/DeferredCompareTray";
import { DeferredPlayerDetailDrawer } from "@/components/fantasy/DeferredPlayerDetailDrawer";
import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy/PositionFilterBar";
import { useBestBallSnapshot } from "@/hooks/useBestBallSnapshot";
import { useDebounce } from "@/hooks/useDebounce";
import { PROJECT_PRESS } from "@/constants/projectPress";
import {
  getBestBallConsensusIssue,
  getContestPreset,
  hasSupportedBestBallAdp,
  sortBestBallRankings,
  type BestBallContestId,
  type RankedBestBallPlayer,
} from "@/lib/bestBall";
import {
  HEADER_CHIP_CLASS,
  MONO_LABEL_CLASS,
  SHELL_CLASS,
  getNflRegularSeasonWeek,
  getPositionTone,
  getSnapshotStaleness,
  getTierRailIntensity,
} from "@/lib/fantasyUtils";
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

// Round plates are one draft round wide, so the plate size is the selected contest's
// team count rather than a constant. 6-Man drafts the same 18-round roster with half
// the room, so a 12-pick plate would put its players two rounds off their real one.

const PILL_ACTION_CLASS =
  "inline-flex min-h-touch items-center border px-[var(--c97-sp-2)] font-mono text-2xs uppercase tracking-[0.06em] no-underline";

/** Phone rows carry their own value labels, since the column-label row is md-and-up. */
const ROW_MICRO_LABEL_CLASS = "text-3xs uppercase tracking-[0.06em] text-[var(--c97-ink-2)] md:hidden";

// Pinned to UTC so a date-only value like "2026-08-09" is not parsed as UTC
// midnight and then rendered a day earlier for viewers west of UTC.
function formatDate(value: string | null | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) return "Not published";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
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
  // from Week 1, so the card names the dates and what stays paused instead.
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
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
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

/** The one live copy of the board-order policy, shown in the contest lens footer. */
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
      ? `Board order follows current ${adpProvider ?? "Underdog"} ADP · value is ADP minus PPR best ball ECR, so a positive number means the market usually lets him go later.`
      : "Current ADP is unavailable or stale in this snapshot · board order falls back to PPR best ball ECR, and ADP and value stay NA.";
  }
  if (!contest.showsWeek17) {
    return "No matching ADP for this slate in the snapshot · board order follows PPR best ball ECR · the Week 17 column is dimmed because playoff correlation does not apply here.";
  }
  return "No matching ADP for this slate in the snapshot · board order follows PPR best ball ECR, and ADP and value stay NA instead of borrowing another slate's price.";
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
  const tone = getPositionTone(player.position);

  return (
    <li
      className="relative border-t transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--c97-field)_55%,transparent)]"
      style={{ borderColor: "color-mix(in srgb, var(--c97-rule) 60%, transparent)" }}
    >
      {/* The open control overlays the row instead of wrapping it: an aria-label
          on a wrapping button would override every cell for screen readers.
          The content div sits above it so the per-cell explanations fire on
          hover and the numbers stay selectable; its own click still opens the
          drawer unless the user is selecting text. */}
      <button
        type="button"
        aria-label={`Open ${player.name} details`}
        onClick={() => onOpenDetail(player)}
        className="absolute inset-0 z-[1] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--c97-accent)]"
      />
      <div
        className="relative z-[2] flex min-h-11 w-full cursor-pointer flex-wrap items-center text-left" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-0)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)" }}
        onClick={() => {
          if (window.getSelection()?.toString()) return;
          onOpenDetail(player);
        }}
      >
        <span
          className="w-[34px] shrink-0 text-right font-mono text-sm font-medium"
          title="Board rank under this contest lens"
        >
          {player.bestBallRank}
        </span>
        <span className="flex min-w-0 flex-[1_1_180px] items-baseline" style={{ gap: "var(--c97-sp-1)" }}>
          <span className="truncate text-sm font-semibold tracking-tight">{player.name}</span>
          <span
            className="inline-flex shrink-0 items-center border py-0.5 font-mono text-3xs tracking-[0.06em]"
            style={{ paddingInline: "var(--c97-sp-0)", ...tone, color: "var(--c97-ink)" }}
          >
            {player.position}
            {!withheld && Number.isFinite(player.positionRank) ? player.positionRank : ""}
          </span>
          <span
            className="shrink-0 font-mono text-3xs uppercase tracking-[0.06em]"
            style={{ color: "var(--c97-ink-2)" }}
          >
            {player.team || "FA"}
          </span>
        </span>
        <span className="flex max-w-full flex-wrap items-center" style={{ columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)" }}>
          <span className="sr-only">Underdog ADP</span>
          <span
            className={`w-auto font-mono md:w-14 md:text-right ${atUndraftedFloor ? "text-3xs uppercase" : "text-xs"}`}
            title={
              atUndraftedFloor
                ? "At the contest-floor placeholder, not a literal price"
                : "Current Underdog average draft position"
            }
            style={{ color: "var(--c97-ink-2)" }}
          >
            <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
              ADP{" "}
            </span>
            {atUndraftedFloor ? "Undrafted" : adpAvailable ? formatRank(player.adp) : "NA"}
          </span>
          <span className="sr-only">PPR best ball consensus</span>
          <span
            className={`w-auto font-mono md:w-14 md:text-right ${withheld ? "text-3xs uppercase" : "text-xs font-medium"}`}
            title={withheld ? WITHHELD_CELL_TITLE : "PPR best ball expert consensus rank"}
            style={withheld ? { color: "var(--c97-ink-2)" } : undefined}
          >
            <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
              ECR{" "}
            </span>
            {withheld ? "Withheld" : formatRank(getConsensusRank(player))}
          </span>
          <span className="sr-only">Value versus ADP</span>
          <span
            className="w-auto font-mono text-xs md:w-14 md:text-right"
            title={withheld ? WITHHELD_CELL_TITLE : describeAdpDelta(delta)}
            style={{
              color:
                delta !== null && delta >= 3
                  ? "var(--c97-positive)"
                  : delta !== null && delta <= -3
                    ? "var(--c97-warning)"
                    : "var(--c97-ink-2)",
            }}
          >
            <span
              aria-hidden="true"
              className={ROW_MICRO_LABEL_CLASS}
              style={{ color: "var(--c97-ink-2)" }}
            >
              Value{" "}
            </span>
            {formatAdpDelta(delta)}
          </span>
          <span className="sr-only">Bye week</span>
          <span
            className="w-auto font-mono text-xs md:w-8 md:text-right"
            style={{ color: "var(--c97-ink-2)" }}
          >
            <span aria-hidden="true" className={ROW_MICRO_LABEL_CLASS}>
              Bye{" "}
            </span>
            {player.byeWeek ?? "NA"}
          </span>
          <span className="sr-only">Week 17 opponent</span>
          <span
            className="w-auto font-mono text-xs md:w-10 md:text-right"
            title={
              showsWeek17
                ? `Week 17: ${player.team || "FA"} vs ${opponent ?? "TBD"}`
                : `Week 17 correlation does not move this board in ${contestLabel}`
            }
            style={{
              color: showsWeek17
                ? "var(--c97-ink-2)"
                : "color-mix(in srgb, var(--c97-ink-2) 40%, transparent)",
            }}
          >
            {/* The dimmed lens keeps its whole cell dim, label included, so the
                label never reads louder than the value it names. */}
            <span
              aria-hidden="true"
              className={ROW_MICRO_LABEL_CLASS}
              style={showsWeek17 ? undefined : { color: "inherit" }}
            >
              W17{" "}
            </span>
            {opponent ?? "NA"}
          </span>
        </span>
      </div>
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

  // Group the windowed rows into one-round plates keyed off the lens rank, so a
  // filtered board still shows each player inside his real round.
  const roundSize = activePreset.teams;
  const roundGroups = useMemo<RoundGroup[]>(() => {
    const groups: RoundGroup[] = [];
    for (const player of visiblePlayers) {
      const round = Math.ceil(player.bestBallRank / roundSize);
      const current = groups[groups.length - 1];
      if (!current || current.round !== round) groups.push({ round, rows: [player] });
      else current.rows.push(player);
    }
    return groups;
  }, [visiblePlayers, roundSize]);

  function updateRouteState(patch: Partial<BestBallSearchState>) {
    // The typed query is the live one, so a contest or position tap carries it
    // along instead of reverting the field to whatever the URL last recorded.
    const next = { ...routeState, query: normalizeBestBallQuery(searchQuery), ...patch };
    startTransition(() => {
      setOptimisticRouteState(next);
      router.replace(buildBestBallHref(next, searchParams), { scroll: false });
    });
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

  const trackerHref = `/fantasy-football/best-ball/draft-tracker?contest=${routeState.contest}`;
  const freshnessWarning = getFreshnessWarning(snapshot, routeState.contest);
  // The provider's self-consistency test on the PPR consensus. Every lens
  // prints that column, Superflex included, so the note shows on every lens.
  const consensusIssue = snapshot ? getBestBallConsensusIssue(snapshot) : null;
  const withheldCount = orderedPlayers.filter((player) => player.consensusWithheld).length;
  const boardReady = !isLoading && !error && visiblePlayers.length > 0;
  const policyLine = getBoardPolicyLine(activeContest, adpAvailable, snapshot?.adpSource?.provider);

  // Chips carry only the brand word ("Underdog ADP via Hayden Winks" → "Underdog");
  // the full provider names stay linked in the board footnote.
  const adpBrand = snapshot?.adpSource?.provider.split(" ")[0];
  const ecrBrand = snapshot?.rankingSource.provider.split(" ")[0];
  const headerChips = [
    `${CONTESTS.length} contest lenses`,
    ...(snapshot?.adpSource
      ? [`ADP ${adpBrand} · ${formatDate(snapshot.adpSource.asOf)}`]
      : []),
    ...(snapshot
      ? [
          `ECR ${ecrBrand} · ${formatDate(snapshot.rankingSource.asOf ?? snapshot.generatedAt)}`,
          `${snapshot.players.length} ranked`,
        ]
      : []),
  ];

  // A best ball board is a preseason artifact by construction. Once the season is
  // under way, say so instead of serving August ranks with no date on them.
  const seasonalWeek = getNflRegularSeasonWeek(snapshot?.season ?? 0);

  return (
    <section
      className="c97-dash relative overflow-x-clip min-h-dvh"
      aria-label="Best ball rankings and strategy"
      data-testid="best-ball-shell"
    >
      <section
        className="c97-sheet"
        data-c97-surface={`ink-${PROJECT_PRESS["/fantasy-football/best-ball"].lead}`}
        style={{ paddingBlock: "var(--c97-sp-5)" }}
      >
        <div className={SHELL_CLASS}>
          <h1 className="c97-poster">Best Ball</h1>
          <p className="c97-meta" style={{ marginTop: "var(--c97-sp-3)" }}>
            Best ball{snapshot?.season ? ` · ${snapshot.season}` : ""}
          </p>

          {/* Every status and accent token resolves to the sheet's ink on
              green, so the chips and the contest selector, which both carry
              accent-toned states, sit on their own paper plate instead. */}
          <div
            data-c97-surface="paper"
            className="c97-offset"
            style={{ marginTop: "var(--c97-sp-4)", padding: "var(--c97-sp-3)" }}
          >
            <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-0)" }}>
              {headerChips.map((chip) => (
                <span
                  key={chip}
                  className={HEADER_CHIP_CLASS}
                  style={{
                    borderColor: "var(--c97-rule)",
                    background: "var(--c97-field)",
                    color: "var(--c97-ink-2)",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-1)", columnGap: "var(--c97-sp-1)", rowGap: "var(--c97-sp-1)" }}>
              <span className={`shrink-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
                Contest
              </span>
              <div role="group" aria-label="Best ball contest" className="flex flex-wrap" style={{ gap: "var(--c97-sp-0)" }}>
                {CONTESTS.map((contest) => {
                  const active = contest.id === routeState.contest;
                  return (
                    <button
                      key={contest.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => updateRouteState({ contest: contest.id })}
                      className={`min-h-touch cursor-pointer border font-mono text-2xs uppercase tracking-[0.05em] transition-colors duration-150 ${
                        active ? "" : "border-[var(--c97-rule)] hover:border-[var(--c97-ink)]"
                      }`}
                      style={
                        { paddingInline: "var(--c97-sp-2)", ...(active
                          ? { borderColor: "var(--c97-ink)", background: "var(--c97-ink)", color: "var(--c97-surface)" }
                          : {
                              background: "var(--c97-field)",
                              color: "var(--c97-ink)",
                            }) }
                      }
                    >
                      {contest.shortLabel}
                    </button>
                  );
                })}
              </div>
              <span
                className="ml-auto whitespace-nowrap font-mono text-2xs"
                style={{ color: "var(--c97-ink-2)" }}
              >
                Rules checked {formatDate(activePreset.rulesAsOf)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Wrapped in the shell like the rankings board's note, so it sits in
          the content column rather than running edge to edge as an alert. */}
      <section
        className="c97-sheet"
        data-c97-surface="paper"
        data-seam="torn"
        style={{ paddingBlock: "var(--c97-sp-5)" }}
      >
      {seasonalWeek >= 1 ? (
        <div className={`${SHELL_CLASS}`} style={{ paddingBottom: "var(--c97-sp-2)" }}>
          <SeasonalScopeNote season={snapshot?.season ?? 0} week={seasonalWeek}>
            Best ball is drafted before the season and scored through it, so this board describes a
            market that closed at kickoff. Rankings and ADP here are the preseason readings your
            drafts were made against, kept for reference rather than refreshed. Ranks that still
            move are on the <Link href="/fantasy-football/weekly" className="underline decoration-[var(--c97-accent)] underline-offset-4">weekly board</Link>.
          </SeasonalScopeNote>
        </div>
      ) : null}

      <section aria-label="Selected format" className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-2)" }}>
        <div
          className="overflow-hidden border"
          style={{ borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
        >
          <div
            className="flex flex-wrap items-baseline justify-between border-b"
            style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)", borderColor: "var(--c97-rule)" }}
          >
            <div className="flex min-w-0 flex-wrap items-baseline" style={{ columnGap: "var(--c97-sp-1)", rowGap: "var(--c97-sp-0)" }}>
              <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
                Contest lens
              </p>
              <h2 className="c97-serif c97-h3">
                {activeContest.label}
              </h2>
            </div>
            <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
              {activeContest.format}
            </span>
          </div>
          <div
            className="grid"
            style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-2)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}
          >
            {[
              { label: "The room", body: activeContest.structure },
              { label: "How I read it", body: activeContest.brief },
              { label: "2026 build range", body: activeContest.build },
              { label: "What I would watch", body: activeContest.risk },
            ].map((cell) => (
              <div key={cell.label} className="min-w-0">
                <p className={`mt-0 ${MONO_LABEL_CLASS}`} style={{ marginBottom: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}>
                  {cell.label}
                </p>
                <p className="m-0 text-sm leading-6">{cell.body}</p>
              </div>
            ))}
          </div>
          <div
            className="flex flex-wrap items-center justify-between border-t"
            style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)", background: "var(--c97-surface)" }}
          >
            <p
              className="m-0 min-w-0 flex-[1_1_260px] font-mono text-2xs leading-relaxed"
              style={{ color: "var(--c97-ink-2)" }}
            >
              {policyLine}
            </p>
            {/* No shrink-0 here. With it the span took its two-pill max-content
                width (352px) inside a 324px footer and the card's overflow
                clipped the rules pill; letting it shrink lets its own wrap put
                the second pill on a new line at 390. */}
            <span className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
              <Link
                href={trackerHref}
                className={`${PILL_ACTION_CLASS} border-[var(--c97-ink)] bg-[var(--c97-ink)] text-[var(--c97-surface)] hover:bg-[var(--c97-ink-2)]`}
              >
                Draft with this lens&nbsp;<span className="c97-arrow-out" aria-hidden="true">↗</span>
              </Link>
              <a
                href={activePreset.officialRulesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${PILL_ACTION_CLASS} border-[var(--c97-rule)] hover:border-[var(--c97-ink)]`}
                style={{ color: "var(--c97-ink)" }}
              >
                Scoring rules&nbsp;<span className="c97-arrow-out" aria-hidden="true">↗</span>
              </a>
            </span>
          </div>
        </div>
      </section>

      {freshnessWarning ? (
        <div className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-2)" }}>
          <div
            role="status"
            className="max-w-[70ch] border text-sm leading-6"
            style={{
              paddingInline: "var(--c97-sp-2)",
              paddingBlock: "var(--c97-sp-1)",
              borderColor: "color-mix(in srgb, var(--c97-warning) 48%, var(--c97-rule))",
              background: "color-mix(in srgb, var(--c97-warning) 10%, var(--c97-surface))",
            }}
          >
            {freshnessWarning}
          </div>
        </div>
      ) : null}

      {/* The provider's own numbers disagreeing with each other. The sentence
          carries the consensus date, and the rows it names print no ECR,
          value, tier, or position rank while the expert band stays. */}
      {consensusIssue ? (
        <div className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-2)" }}>
          <div
            role="note"
            data-testid="best-ball-consensus-note"
            className="max-w-[70ch] border text-sm leading-6"
            style={{
              paddingInline: "var(--c97-sp-2)",
              paddingBlock: "var(--c97-sp-1)",
              borderColor: "color-mix(in srgb, var(--c97-warning) 48%, var(--c97-rule))",
              background: "color-mix(in srgb, var(--c97-warning) 10%, var(--c97-surface))",
            }}
          >
            <p className="m-0">
              <span className="font-semibold">Consensus withheld.</span>{" "}
              {consensusIssue.charAt(0).toUpperCase()}
              {consensusIssue.slice(1)}.
            </p>
            <p className="m-0" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}>
              {withheldCount} of {orderedPlayers.length} rows on this board print no ECR, value,
              tier, or position rank. Each one keeps its best, average, and worst expert rank, which
              agree with each other. Board order is unchanged.
            </p>
          </div>
        </div>
      ) : null}

      <div className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-2)" }} data-testid="best-ball-board">
        <h2 className="sr-only">{activeContest.shortLabel} board</h2>
        {/* One pinned control line at every width. The board runs hundreds of
            rows, so position, search, and the count have to stay reachable
            mid-scroll rather than only at the top. The negative margin matches
            the shell padding so rows pass under a full-width band. */}
        <div
          data-testid="best-ball-board-controls"
          className="sticky top-0 z-30 border-b"
          style={{
            marginBottom: "var(--c97-sp-1)",
            marginInline: "calc(-1 * var(--c97-gutter))",
            paddingInline: "var(--c97-gutter)",
            borderColor: "var(--c97-rule)",
            background: "var(--c97-surface)",
          }}
        >
          <div className="flex flex-wrap items-center" style={{ paddingBlock: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)" }}>
            <PositionFilterBar
              ariaLabel="Best ball position"
              options={POSITION_OPTIONS}
              value={routeState.position}
              onChange={(position) => updateRouteState({ position })}
              disabled={Boolean(error)}
            />
            <div className="relative">
              <label htmlFor="best-ball-search" className="sr-only">
                Search best ball rankings
              </label>
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: "var(--c97-ink-2)" }}
                aria-hidden="true"
              />
              <input
                id="best-ball-search"
                name="best-ball-search"
                type="search"
                value={searchQuery}
                maxLength={80}
                onChange={(event) => setSearchQuery(event.target.value)}
                disabled={Boolean(error)}
                autoComplete="off"
                placeholder="Search player or team"
                className="min-h-touch w-[200px] border font-mono text-xs placeholder:text-[var(--c97-ink-2)] disabled:cursor-not-allowed disabled:border-dashed"
                style={
                  { paddingLeft: "calc(24px + var(--c97-sp-1))", paddingRight: "var(--c97-sp-1)", ...(error
                    ? { borderColor: "var(--c97-ink-2)", background: "none", color: "var(--c97-ink-2)" }
                    : { borderColor: "var(--c97-rule)", background: "var(--c97-field)", color: "var(--c97-ink)" }) }
                }
              />
            </div>
            <span
              aria-live={error ? undefined : "polite"}
              className="ml-auto whitespace-nowrap font-mono text-2xs"
              style={{ color: "var(--c97-ink-2)" }}
            >
              {isLoading
                ? "Loading players"
                : `${filteredPlayers.length} of ${orderedPlayers.length} on this board`}
            </span>
          </div>
          {/* Column labels ride in the sticky bar so the numbers keep their
              names mid-scroll, as on the rankings board; phones carry per-value
              micro-labels in each row instead. Rendered only once the board has
              rows, so the loading, error, and empty states show no headings for
              columns that are not there. The row cells carry sr-only labels, so
              this row stays aria-hidden and nothing is read twice. */}
          {boardReady && (
            <div
              aria-hidden="true"
              className="hidden items-center border-t font-mono text-3xs uppercase tracking-[0.12em] md:flex"
              style={{
                paddingInline: "var(--c97-sp-2)",
                paddingBlock: "var(--c97-sp-0)",
                columnGap: "var(--c97-sp-2)",
                color: "var(--c97-ink-2)",
                borderColor: "color-mix(in srgb, var(--c97-rule) 60%, transparent)",
              }}
            >
              <span className="w-[34px] shrink-0" />
              <span className="min-w-0 flex-[1_1_180px]">Player</span>
              <span className="flex shrink-0 items-center" style={{ columnGap: "var(--c97-sp-2)" }}>
                <span className="w-14 text-right">UD ADP</span>
                <span className="w-14 text-right whitespace-nowrap">PPR ECR</span>
                <span className="w-14 text-right" title="ADP minus PPR best ball ECR">
                  Value
                </span>
                <span className="w-8 text-right">Bye</span>
                <span className="w-10 text-right">W17</span>
              </span>
            </div>
          )}
        </div>

        {error ? (
          <div
            role="alert"
            className="border"
            style={{
              paddingInline: "var(--c97-sp-2)",
              paddingBlock: "var(--c97-sp-3)",
              borderColor: "var(--c97-negative)",
              background: "color-mix(in srgb, var(--c97-negative) 8%, var(--c97-surface))",
            }}
          >
            <p className="font-semibold" style={{ color: "var(--c97-negative)" }}>
              {error}
            </p>
            <p className="text-sm" style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
              The strategy notes are still available while the published board reloads.
            </p>
            <button
              type="button"
              onClick={retry}
              className="inline-flex min-h-touch items-center border border-[var(--c97-ink)] bg-[var(--c97-ink)] text-[var(--c97-surface)] hover:bg-[var(--c97-ink-2)] text-sm font-semibold" style={{ paddingInline: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}
            >
              Retry rankings
            </button>
          </div>
        ) : isLoading ? (
          // The count line in the sticky bar is the live region that says
          // "Loading players", so the placeholder rows stay silent.
          <div className="grid" style={{ gap: "var(--c97-sp-1)" }} aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={`best-ball-loading-${index}`} className="c97-skeleton" style={{ height: 44 }} />
            ))}
          </div>
        ) : visiblePlayers.length > 0 ? (
          <>
            {roundGroups.map((group, index) => {
              const fullRound = group.rows.length === roundSize;
              return (
                <section
                  key={`round-${group.round}`}
                  style={{ marginTop: index === 0 ? 0 : "var(--c97-sp-2)" }}
                  aria-label={`Round ${group.round}`}
                >
                  <div
                    className="overflow-hidden border border-l-[3px]"
                    style={{
                      borderColor: "var(--c97-rule)",
                      borderLeftColor: `color-mix(in srgb, var(--c97-accent) ${getTierRailIntensity(group.round)}%, var(--c97-rule))`,
                      background: "var(--c97-field)",
                    }}
                  >
                    <div className="flex flex-wrap items-baseline" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-1)", paddingBottom: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)" }}>
                      <span className="text-2xl font-bold leading-none tracking-tight tabular-nums">
                        {String(group.round).padStart(2, "0")}
                      </span>
                      <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                        Round
                      </span>
                      <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
                        {fullRound ? "full round on this board" : `${group.rows.length} shown`}
                      </span>
                      <span className="ml-auto font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
                        picks {group.round * roundSize - (roundSize - 1)}–{group.round * roundSize}
                      </span>
                    </div>
                    <ul className="m-0 list-none p-0">
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
                  </div>
                </section>
              );
            })}
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="inline-flex min-h-touch w-full items-center justify-center border border-[var(--c97-rule)] hover:border-[var(--c97-ink)] text-sm font-semibold transition-colors"
                style={{ paddingInline: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)", color: "var(--c97-ink)" }}
              >
                Show the next {Math.min(PAGE_SIZE, filteredPlayers.length - visibleCount)} players
              </button>
            )}
          </>
        ) : (
          <div
            className="border border-dashed text-center"
            style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-4)", borderColor: "var(--c97-rule)" }}
          >
            <p className="font-mono text-xs" style={{ color: "var(--c97-ink-2)" }}>
              No players match on this board.
            </p>
            {/* Each control clears only itself, so the way out never resets a
                filter the visitor still wants. */}
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  updateRouteState({ query: "" });
                }}
                className="inline-flex min-h-touch items-center border border-[var(--c97-ink)] bg-[var(--c97-ink)] text-[var(--c97-surface)] hover:bg-[var(--c97-ink-2)] font-mono text-2xs uppercase tracking-[0.06em]" style={{ paddingInline: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => updateRouteState({ position: "all" })}
                className="inline-flex min-h-touch items-center border border-[var(--c97-ink)] bg-[var(--c97-ink)] text-[var(--c97-surface)] hover:bg-[var(--c97-ink-2)] font-mono text-2xs uppercase tracking-[0.06em]" style={{ paddingInline: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}
              >
                Show all positions
              </button>
            )}
          </div>
        )}

        <div
          className="max-w-[70ch] font-mono text-2xs leading-relaxed"
          style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}
        >
          {adpAvailable && (
            <p className="m-0">
              Players labeled Undrafted are at the contest-floor placeholder, not a literal price, so
              their board order falls back to PPR best ball ECR and value stays blank.
            </p>
          )}
          {snapshot && (
            <p className="m-0" style={{ marginTop: "var(--c97-sp-0)" }}>
              Snapshot built {formatDate(snapshot.generatedAt)} · rankings{" "}
              <a
                className="underline underline-offset-2"
                href={snapshot.rankingSource.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {snapshot.rankingSource.provider} PPR best ball
                {snapshot.rankingSource.expertCount
                  ? ` · ${snapshot.rankingSource.expertCount} experts`
                  : ""}
              </a>
              {snapshot.adpSource && (
                <>
                  {" "}
                  · ADP{" "}
                  <a
                    className="underline underline-offset-2"
                    href={snapshot.adpSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {snapshot.adpSource.provider} standard slate
                  </a>
                </>
              )}
              {routeState.contest === "superflex" && snapshot.superflexSource && (
                <>
                  {" "}
                  · Superflex order{" "}
                  <a
                    className="underline underline-offset-2"
                    href={snapshot.superflexSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {snapshot.superflexSource.provider}
                  </a>
                </>
              )}
              {snapshot.scheduleSource && (
                <>
                  {" "}
                  · Week 17{" "}
                  <a
                    className="underline underline-offset-2"
                    href={snapshot.scheduleSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {snapshot.scheduleSource.provider}
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      </div>
      </section>

      <section
        aria-labelledby="field-notes-heading"
        className="c97-sheet"
        data-c97-surface="bone"
        data-seam="torn"
        style={{ paddingBlock: "var(--c97-sp-5)" }}
      >
      <div className={SHELL_CLASS}>
        <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
          Field notes
        </p>
        <h2 id="field-notes-heading" className="c97-poster-sm" style={{ marginTop: "var(--c97-sp-1)" }}>
          What has worked, and how I would use it
        </h2>
        <p className="mb-0 max-w-[70ch] text-sm leading-6" style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
          The findings below describe past drafts and are not proof that one construction will win the
          next tournament. I use them to set boundaries, then let the current room and the selected
          contest decide the roster.
        </p>
        <div
          className="grid"
          style={{ marginTop: "var(--c97-sp-2)", columnGap: "var(--c97-sp-4)", rowGap: "var(--c97-sp-1)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}
        >
          <div className="min-w-0">
            <p className={`mb-0.5 mt-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
              Observed in past drafts
            </p>
            {OBSERVED_FINDINGS.map((finding) => (
              <div key={finding.title} className="border-t" style={{ paddingBlock: "var(--c97-sp-1)", borderColor: "var(--c97-rule)" }}>
                <p className="m-0 text-sm font-semibold tracking-tight">{finding.title}</p>
                <p className="m-0 text-sm leading-6" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}>
                  {finding.body}
                </p>
                {/* A standalone link line rather than a link inside a sentence,
                    so it takes the 44px floor like the footer tool links. The
                    negative margin keeps the card's rhythm close to the 13px
                    line it replaces. */}
                <a
                  href={finding.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-touch items-center font-mono text-2xs uppercase tracking-[0.06em] underline underline-offset-2" style={{ marginBottom: "calc(var(--c97-sp-1) * -1)" }}
                >
                  {finding.source}&nbsp;<span className="c97-arrow-out" aria-hidden="true">↗</span>
                </a>
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <p className={`mb-0.5 mt-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
              2026 recommendation
            </p>
            {RECOMMENDATIONS.map((recommendation) => (
              <div
                key={recommendation.number}
                className="flex border-t"
                style={{ paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)" }}
              >
                <span className="w-6 shrink-0 font-mono text-xs" style={{ color: "var(--c97-ink-2)" }}>
                  {recommendation.number}
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-sm font-semibold tracking-tight">{recommendation.title}</p>
                  <p className="mb-0 text-sm leading-6" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}>
                    {recommendation.body}
                  </p>
                  {recommendation.href && (
                    <a
                      href={recommendation.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-touch items-center font-mono text-2xs uppercase tracking-[0.06em] underline underline-offset-2" style={{ marginBottom: "calc(var(--c97-sp-1) * -1)" }}
                    >
                      4for4 draft date study&nbsp;<span className="c97-arrow-out" aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </section>

      <div className="c97-sheet" data-c97-surface="paper" data-seam="torn">
      <section aria-label="Format reference" className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-2)" }}>
        <div
          className="flex flex-wrap items-start justify-between border"
          style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", columnGap: "var(--c97-sp-3)", rowGap: "var(--c97-sp-2)", borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
        >
          <div className="min-w-0 max-w-[68ch] flex-[1_1_380px]">
            <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
              Format reference
            </p>
            <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-2)" }}>
              The baseline Underdog roster
            </h3>
            <p className="mb-0 text-sm leading-6" style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
              Standard NFL best ball drafts use 12 teams and 18 rounds with one quarterback, two
              running backs, three receivers, one tight end, one flex, and ten bench spots. The site
              sets the strongest lineup each week, and there are no waivers, trades, or manual lineup
              decisions. Scoring is half PPR unless the contest says otherwise.
            </p>
          </div>
          <a
            href={RULES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${PILL_ACTION_CLASS} max-w-full border-[var(--c97-rule)] hover:border-[var(--c97-ink)]`}
            style={{ color: "var(--c97-ink)" }}
          >
            Official scoring and lineup rules&nbsp;<span className="c97-arrow-out" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <div className={`${SHELL_CLASS}`} style={{ paddingTop: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-4)" }}>
        <div
          className="flex flex-wrap items-baseline justify-between border-t"
          style={{ paddingTop: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)" }}
        >
          <span className="font-mono text-2xs" style={{ color: "var(--c97-ink-2)" }}>
            Working ranges, not quotas, and nothing here guarantees a result
          </span>
          <span className="flex flex-wrap" style={{ columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-0)" }}>
            <Link href="/fantasy-football" className="c97-link inline-flex min-h-touch items-center text-sm font-semibold">
              Rankings board&nbsp;<span className="c97-arrow-out" aria-hidden="true">↗</span>
            </Link>
            <Link href={trackerHref} className="c97-link inline-flex min-h-touch items-center text-sm font-semibold">
              Draft tracker&nbsp;<span className="c97-arrow-out" aria-hidden="true">↗</span>
            </Link>
            <Link href="/fantasy-football/mock-draft" className="c97-link inline-flex min-h-touch items-center text-sm font-semibold">
              Mock draft&nbsp;<span className="c97-arrow-out" aria-hidden="true">↗</span>
            </Link>
          </span>
        </div>
      </div>
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
        valueSignalAvailable={adpAvailable}
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
