"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Search, X } from "lucide-react";
import { startTransition, useMemo, useOptimistic, useState } from "react";

import { PositionFilterBar, type PositionFilterOption } from "@/components/fantasy";
import { useBestBallSnapshot } from "@/hooks/useBestBallSnapshot";
import {
  hasSupportedBestBallAdp,
  sortBestBallRankings,
  type BestBallContestId,
  type RankedBestBallPlayer,
} from "@/lib/bestBall";
import {
  FANTASY_CHIP_CLASS,
  getPositionTone,
  getSnapshotStaleness,
} from "@/lib/fantasyUtils";
import type { BestBallSnapshot } from "@/lib/bestBallSnapshot";
import type { Player } from "@/types";

import {
  buildBestBallHref,
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
  },
  {
    id: "superflex",
    label: "Superflex",
    shortLabel: "Superflex",
    format: "12 teams, 18 rounds, half PPR model",
    structure: "The flex slot can use a quarterback. The contest label determines the rest of the rules, so the linked tracker applies only when the contest card matches this model.",
    brief:
      "Quarterbacks carry more weekly lineup value here because two can score for the roster at the same time.",
    build: "Move quarterbacks up, leave the draft with three or four starters, and protect against shared byes before filling the last luxury pick.",
    risk: "A fourth quarterback can be useful, but only after the roster has enough receivers and playable depth at every other position.",
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
const MANIA_URL = "https://help.underdogsports.com/en/articles/14785343-best-ball-mania-vii";
const PUPPY_URL = "https://help.underdogsports.com/en/articles/14787820-the-puppy";
const ELIMINATOR_URL = "https://help.underdogsports.com/en/articles/14786129-the-eliminator";
const WEEKLY_URL = "https://help.underdogsports.com/en/articles/14787567-best-ball-weekly-winners";
const SIT_AND_GO_URL = "https://help.underdogsports.com/en/articles/10716487-best-ball-sit-n-go";
const SUPERFLEX_URL = "https://help.underdogsports.com/en/articles/11102881-what-is-a-superflex";

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

function formatDate(value: string | null | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) return "Not published";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
  return stale
    ? "One or more best ball sources are older than the normal refresh window. Check the dates before using this board in a live room."
    : null;
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

function formatAdpDelta(value: number | null): string {
  if (value === null) return "NA";
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.05) return "Even";
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
}

function ContestRuleLink({ contest }: { contest: BestBallContestId }) {
  const href =
    contest === "bbm-vii"
      ? MANIA_URL
      : contest === "puppy"
        ? PUPPY_URL
        : contest === "eliminator"
          ? ELIMINATOR_URL
          : contest === "weekly-winners"
            ? WEEKLY_URL
            : contest === "sit-and-go"
              ? SIT_AND_GO_URL
              : SUPERFLEX_URL;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors hover:border-[var(--home-ink)]"
      style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
    >
      Read official rules
      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

function BestBallPlayerRow({
  player,
  lensRank,
  opponent,
  adpAvailable,
}: {
  player: RankedBestBallPlayer;
  lensRank: number;
  opponent?: string;
  adpAvailable: boolean;
}) {
  const delta = adpAvailable ? getAdpDelta(player) : null;
  const positive = delta !== null && delta >= 3;
  const negative = delta !== null && delta <= -3;

  return (
    <li
      className="rounded-[var(--radius-3xl)] border px-3 py-3 transition-[border-color,box-shadow] duration-200 hover:border-[var(--home-ink)] hover:shadow-[var(--shadow-sm)] sm:px-4"
      style={{
        borderColor: "var(--home-rule)",
        background: "color-mix(in srgb, var(--home-paper-alt) 48%, var(--home-elev-mix))",
      }}
    >
      <div className="flex min-w-0 items-center gap-3 md:grid md:grid-cols-[3.25rem_minmax(0,1fr)_4.5rem_4.5rem_4.5rem_4.5rem_5.5rem] md:gap-3">
        <span className="w-9 shrink-0 text-center text-xl font-semibold tabular-nums md:w-auto">
          {lensRank}
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold">{player.name}</span>
            <span className={FANTASY_CHIP_CLASS} style={getPositionTone(player.position)}>
              {player.position}
            </span>
          </div>
          <p className="mt-0.5 text-sm" style={{ color: "var(--home-ink-muted)" }}>
            {player.team || "FA"}
            {player.positionRank ? ` · ${player.position}${player.positionRank}` : ""}
          </p>
        </div>
        <div className="ml-auto shrink-0 text-right md:ml-0">
          <p className="text-2xs font-semibold uppercase tracking-[0.12em] md:hidden" style={{ color: "var(--home-ink-muted)" }}>
            {adpAvailable ? "UD ADP" : "Source rank"}
          </p>
          <p className="font-semibold tabular-nums">
            {formatRank(adpAvailable ? player.adp : player.adjustedRank)}
          </p>
        </div>
        <p className="hidden text-center font-semibold tabular-nums md:block">{formatRank(getConsensusRank(player))}</p>
        <p
          className="hidden text-center font-semibold tabular-nums md:block"
          style={{
            color: positive
              ? "var(--home-positive)"
              : negative
                ? "var(--home-warning)"
                : "var(--home-ink)",
          }}
        >
          {formatAdpDelta(delta)}
        </p>
        <p className="hidden text-center font-semibold tabular-nums md:block">{player.byeWeek ?? "NA"}</p>
        <p className="hidden text-center font-semibold tabular-nums md:block">{opponent ?? "NA"}</p>
      </div>
      <dl className="mt-3 grid grid-cols-4 gap-2 border-t pt-3 text-center md:hidden" style={{ borderColor: "var(--home-rule)" }}>
        <div>
          <dt className="text-2xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--home-ink-muted)" }}>
            {adpAvailable ? "PPR ECR" : "PPR best ball"}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{formatRank(getConsensusRank(player))}</dd>
        </div>
        <div>
          <dt className="text-2xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--home-ink-muted)" }}>
            Value
          </dt>
          <dd
            className="mt-0.5 text-sm font-semibold tabular-nums"
            style={{ color: positive ? "var(--home-positive)" : negative ? "var(--home-warning)" : "var(--home-ink)" }}
          >
            {formatAdpDelta(delta)}
          </dd>
        </div>
        <div>
          <dt className="text-2xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--home-ink-muted)" }}>
            Bye
          </dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{player.byeWeek ?? "NA"}</dd>
        </div>
        <div>
          <dt className="text-2xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--home-ink-muted)" }}>
            Week 17
          </dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{opponent ?? "NA"}</dd>
        </div>
      </dl>
    </li>
  );
}

export function BestBallClient({ initialState }: BestBallClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { snapshot, isLoading, error, retry } = useBestBallSnapshot();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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

  const filteredPlayers = useMemo(() => {
    const query = routeState.query.toLowerCase();
    return orderedPlayers.filter((player) => {
      const matchesPosition = routeState.position === "all" || player.position === routeState.position;
      const matchesSearch =
        !query ||
        `${player.name} ${player.team} ${player.position}`.toLowerCase().includes(query);
      return matchesPosition && matchesSearch;
    });
  }, [orderedPlayers, routeState.position, routeState.query]);

  const visiblePlayers = filteredPlayers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlayers.length;

  function updateRouteState(patch: Partial<BestBallSearchState>) {
    const next = { ...routeState, ...patch };
    setVisibleCount(PAGE_SIZE);
    startTransition(() => {
      setOptimisticRouteState(next);
      router.replace(buildBestBallHref(next, searchParams), { scroll: false });
    });
  }

  const trackerHref = `/fantasy-football/best-ball/draft-tracker?contest=${routeState.contest}`;
  const rankingAsOf =
    (routeState.contest === "superflex"
      ? snapshot?.superflexSource?.asOf
      : snapshot?.rankingSource.asOf) ?? snapshot?.generatedAt;
  const freshnessWarning = getFreshnessWarning(snapshot, routeState.contest);

  return (
    <section
      className="home-page home-dash min-h-screen"
      aria-label="Best ball rankings and strategy"
      data-testid="best-ball-shell"
    >
      <div className="home-shell home-shell-wide home-section space-y-5 sm:space-y-6">
        <header className="space-y-4 pt-2">
          <div className="space-y-3">
            <p className="home-kicker mb-0">Fantasy Football · Best Ball</p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.15rem, 1.6rem + 2.75vw, 4.2rem)", // DESIGN.md headline step
                fontWeight: 600,
                letterSpacing: "-0.045em",
                lineHeight: 0.95,
                maxWidth: "17ch",
              }}
            >
              Build for the contest you are actually drafting.
            </h1>
            <p className="max-w-[65ch] text-sm leading-7 sm:text-base" style={{ color: "var(--home-ink-muted)" }}>
              I use standard-season Underdog average draft position for Mania and Puppy. Eliminator,
              Weekly Winners, and Sit and Go fall back to the standard PPR best ball consensus because
              this snapshot has no matching slate price, while Superflex has a separate sourced
              consensus. The draft assistant changes the build by contest and keeps expected return
              math separate from the roster model.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={trackerHref}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
              style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
            >
              Open {activeContest.shortLabel} draft assistant
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/fantasy-football"
              className="inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-semibold transition-colors hover:border-[var(--home-ink)]"
              style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
            >
              Redraft rankings
            </Link>
          </div>
        </header>

        <section className="home-card-static p-4 sm:p-5" aria-labelledby="contest-lens-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="home-kicker mb-1">Contest lens</p>
              <h2 id="contest-lens-heading" className="text-xl font-semibold sm:text-2xl">
                Choose the room before the players
              </h2>
            </div>
            <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
              Rules checked Aug 2, 2026
            </p>
          </div>
          <div role="group" aria-label="Best ball contest" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {CONTESTS.map((contest) => {
              const active = contest.id === routeState.contest;
              return (
                <button
                  key={contest.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateRouteState({ contest: contest.id })}
                  className="min-h-[52px] rounded-[var(--radius-3xl)] border px-3 py-2 text-left text-sm font-semibold transition-[background-color,border-color,color] duration-200"
                  style={
                    active
                      ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                      : {
                          borderColor: "var(--home-rule)",
                          background: "color-mix(in srgb, var(--home-paper-alt) 54%, var(--home-elev-mix))",
                          color: "var(--home-ink)",
                        }
                  }
                >
                  {contest.shortLabel}
                </button>
              );
            })}
          </div>
        </section>

        {freshnessWarning ? (
          <div
            role="status"
            className="rounded-[var(--radius-2xl)] border px-4 py-3 text-sm leading-6"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 48%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            }}
          >
            {freshnessWarning}
          </div>
        ) : null}

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:grid-cols-[minmax(0,1fr)_23rem]">
          <article className="home-card min-w-0 p-4 sm:p-6" aria-labelledby="best-ball-board-heading">
            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--home-rule)" }}>
              <div>
                <p className="home-kicker mb-1">Rankings board</p>
                <h2 id="best-ball-board-heading" className="text-2xl font-semibold">
                  {activeContest.shortLabel} view
                </h2>
              </div>
              <p aria-live="polite" className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                {isLoading ? "Loading players" : `${filteredPlayers.length} players · As of ${formatDate(rankingAsOf)}`}
              </p>
            </div>

            <div className="mt-4 grid gap-3">
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
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--home-ink-muted)" }}
                  aria-hidden="true"
                />
                <input
                  id="best-ball-search"
                  name="best-ball-search"
                  type="search"
                  value={routeState.query}
                  onChange={(event) => updateRouteState({ query: event.target.value })}
                  disabled={Boolean(error)}
                  autoComplete="off"
                  placeholder="Search player, team, or position"
                  className="min-h-[48px] w-full rounded-[var(--radius-3xl)] border px-10 pr-12 text-sm transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-[var(--home-ink-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 52%, var(--home-elev-mix))",
                    color: "var(--home-ink)",
                  }}
                />
                {routeState.query && (
                  <button
                    type="button"
                    onClick={() => updateRouteState({ query: "" })}
                    aria-label="Clear rankings search"
                    className="absolute right-0 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 hidden grid-cols-[3.25rem_minmax(0,1fr)_4.5rem_4.5rem_4.5rem_4.5rem_5.5rem] gap-3 px-4 text-2xs font-semibold uppercase tracking-[0.1em] md:grid" style={{ color: "var(--home-ink-muted)" }}>
              <span className="text-center">Board</span>
              <span>Player</span>
              <span className="text-center">{adpAvailable ? "UD ADP" : "Source rank"}</span>
              <span className="text-center">{routeState.contest === "superflex" ? "PPR best ball" : "PPR ECR"}</span>
              <span className="text-center">Value</span>
              <span className="text-center">Bye</span>
              <span className="text-center">Week 17</span>
            </div>

            {error ? (
              <div className="mt-4 rounded-[var(--radius-3xl)] border p-5" role="alert" style={{ borderColor: "var(--home-negative)" }}>
                <p className="font-semibold">{error}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                  The strategy notes are still available while the published board reloads.
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-semibold"
                  style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
                >
                  Retry rankings
                </button>
              </div>
            ) : isLoading ? (
              <div className="mt-4 grid gap-2" aria-label="Loading rankings">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[72px] rounded-[var(--radius-3xl)] border motion-safe:animate-pulse"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper-alt) 58%, var(--home-elev-mix))",
                    }}
                  />
                ))}
              </div>
            ) : visiblePlayers.length > 0 ? (
              <>
                <ol className="mt-3 grid gap-2">
                  {visiblePlayers.map((player) => (
                    <BestBallPlayerRow
                      key={player.id}
                      player={player}
                      lensRank={player.bestBallRank}
                      opponent={snapshot?.week17Opponents[player.team]}
                      adpAvailable={adpAvailable}
                    />
                  ))}
                </ol>
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors hover:border-[var(--home-ink)]"
                    style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
                  >
                    Show the next {Math.min(PAGE_SIZE, filteredPlayers.length - visibleCount)} players
                  </button>
                )}
              </>
            ) : (
              <div className="mt-4 rounded-[var(--radius-3xl)] border p-6 text-center" style={{ borderColor: "var(--home-rule)" }}>
                <p className="font-semibold">No players match this view.</p>
                <button
                  type="button"
                  onClick={() => updateRouteState({ position: "all", query: "" })}
                  className="mt-3 inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-semibold"
                  style={{ borderColor: "var(--home-rule)" }}
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="mt-5 border-t pt-4 text-sm leading-6" style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}>
              <p>
                {routeState.contest === "superflex"
                  ? "Board order follows the published half PPR Superflex consensus. PPR best ball shows the separate standard lineup reference for context. This snapshot has no Superflex room ADP, so ADP and value stay blank instead of reusing the standard lineup market."
                  : adpAvailable
                    ? "Board order follows current standard-season Underdog ADP when a player is matched. PPR best ball ECR is a separate reference. Value is ADP minus that PPR reference, so a positive number means the market usually lets the player go later."
                    : "This contest has no matching current ADP source in the snapshot. Board order follows PPR best ball ECR, and market value stays blank instead of reusing another slate's price."}
              </p>
              {snapshot && (
                <>
                  <p className="mt-2">The snapshot was built {formatDate(snapshot.generatedAt)}.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      className="inline-flex min-h-[44px] items-center rounded-full border px-3 underline underline-offset-4"
                      style={{ borderColor: "var(--home-rule)" }}
                      href={snapshot.rankingSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Rankings from {snapshot.rankingSource.provider}
                    </a>
                    {snapshot.adpSource && (
                      <a
                        className="inline-flex min-h-[44px] items-center rounded-full border px-3 underline underline-offset-4"
                        style={{ borderColor: "var(--home-rule)" }}
                        href={snapshot.adpSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {adpAvailable ? "ADP" : "Standard ADP reference"} from {snapshot.adpSource.provider}
                      </a>
                    )}
                    {routeState.contest === "superflex" && snapshot.superflexSource && (
                      <a
                        className="inline-flex min-h-[44px] items-center rounded-full border px-3 underline underline-offset-4"
                        style={{ borderColor: "var(--home-rule)" }}
                        href={snapshot.superflexSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Superflex order from {snapshot.superflexSource.provider}
                      </a>
                    )}
                    {snapshot.scheduleSource && (
                      <a
                        className="inline-flex min-h-[44px] items-center rounded-full border px-3 underline underline-offset-4"
                        style={{ borderColor: "var(--home-rule)" }}
                        href={snapshot.scheduleSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Week 17 from {snapshot.scheduleSource.provider}
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </article>

          <aside className="home-card-static h-fit p-5 lg:sticky lg:top-24" aria-labelledby="contest-brief-heading">
            <p className="home-kicker mb-1">Selected format</p>
            <h2 id="contest-brief-heading" className="text-2xl font-semibold">
              {activeContest.label}
            </h2>
            <p className="mt-2 text-sm font-semibold">{activeContest.format}</p>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
              {activeContest.structure}
            </p>
            <div className="my-5 border-t" style={{ borderColor: "var(--home-rule)" }} />
            <p className="font-semibold">How I read it</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
              {activeContest.brief}
            </p>
            <p className="mt-4 font-semibold">2026 build range</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
              {activeContest.build}
            </p>
            <p className="mt-4 font-semibold">What I would watch</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
              {activeContest.risk}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={trackerHref}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold"
                style={{ borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }}
              >
                Draft with this lens
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <ContestRuleLink contest={routeState.contest} />
            </div>
            <p className="mt-4 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
              These are working ranges, not quotas, and they do not guarantee a result.
            </p>
          </aside>
        </div>

        <section className="space-y-4 pt-3" aria-labelledby="best-ball-strategy-heading">
          <div className="max-w-[70ch]">
            <p className="home-kicker mb-1">What has worked</p>
            <h2 id="best-ball-strategy-heading" className="text-3xl font-semibold tracking-tight">
              The historical patterns I would carry into 2026
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
              The findings below describe past drafts and are not proof that one construction will win the next tournament. I use them to set boundaries, then let the current room and the selected contest decide the roster.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {OBSERVED_FINDINGS.map((finding) => (
              <article key={finding.title} className="home-card-static p-5 sm:p-6">
                <p className="text-2xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--home-ink-muted)" }}>
                  Observed in past drafts
                </p>
                <h3 className="mt-2 text-xl font-semibold">{finding.title}</h3>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                  {finding.body}
                </p>
                <a
                  href={finding.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold underline decoration-[var(--home-rule)] underline-offset-4"
                >
                  {finding.source}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="home-card p-5 sm:p-7" aria-labelledby="recommendations-heading">
          <div className="max-w-[68ch]">
            <p className="home-kicker mb-1">2026 recommendation</p>
            <h2 id="recommendations-heading" className="text-3xl font-semibold tracking-tight">
              How I would use the evidence now
            </h2>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {RECOMMENDATIONS.map((recommendation) => (
              <li
                key={recommendation.number}
                className="rounded-[var(--radius-3xl)] border p-5"
                style={{ borderColor: "var(--home-rule)", background: "color-mix(in srgb, var(--home-paper-alt) 48%, var(--home-elev-mix))" }}
              >
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
                  {recommendation.number}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{recommendation.title}</h3>
                <p className="mt-2 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                  {recommendation.body}
                </p>
                {recommendation.href && (
                  <a
                    href={recommendation.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold underline decoration-[var(--home-rule)] underline-offset-4"
                  >
                    Read the draft date study
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="home-card-static p-5 sm:p-6" aria-labelledby="rules-heading">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-[68ch]">
              <p className="home-kicker mb-1">Format reference</p>
              <h2 id="rules-heading" className="text-2xl font-semibold">
                The baseline Underdog roster
              </h2>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
                Standard NFL best ball drafts use 12 teams and 18 rounds with one quarterback, two running backs, three receivers, one tight end, one flex, and ten bench spots. The site sets the strongest lineup each week, and there are no waivers, trades, or manual lineup decisions. Scoring is half PPR unless the contest says otherwise.
              </p>
            </div>
            <a
              href={RULES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold"
              style={{ borderColor: "var(--home-rule)", color: "var(--home-ink)" }}
            >
              Official scoring and lineup rules
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
