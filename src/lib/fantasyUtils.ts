import type { CSSProperties } from "react";

import type { FantasySnapshotSliceMetadata } from "@/lib/fantasy";
import type { Player, RedraftLineupSettings } from "@/types";

/**
 * Plain-language explanation of the "Avg" value shown next to each player.
 * Shared by the rankings board and the draft tracker so both surfaces tell the
 * same story. The number is FantasyPros' `rank_ave` — the mean of every
 * expert's individual ranking, distinct from the consensus rank in the
 * headline.
 */
export const FANTASY_AVG_RANK_TOOLTIP =
  "The average of the contributing experts' ranks for this player. It is the arithmetic mean of their individual rankings, which is separate from FantasyPros' consensus rank. Lower is better, so 1.00 would mean every contributing expert ranked the player first.";

export function formatUpdatedAt(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export type FantasySnapshotStaleness = "fresh" | "aging" | "stale";

const FANTASY_OFFSEASON_AGING_DAYS = 8;
const FANTASY_OFFSEASON_STALE_DAYS = 14;
const FANTASY_DAILY_REFRESH_AGING_DAYS = 2;
const FANTASY_DAILY_REFRESH_STALE_DAYS = 4;
const MS_PER_DAY = 86_400_000;
const FANTASY_FUTURE_SKEW_TOLERANCE_MS = 5 * 60 * 1000;
const NFL_REGULAR_SEASON_WEEKS = 18;

/**
 * Derives the NFL regular-season week for a season from the calendar so a
 * snapshot built mid-season isn't perpetually stamped "Preseason" (week 0).
 *
 * The fantasy week turns over on Wednesday, once the prior week's Monday game
 * is final and waivers have run, so week 1 opens the Wednesday after Labor Day
 * (the first Monday of September). Before that we're in the offseason and
 * report week 0; after that we count regular-season weeks and hold at the
 * final week through the playoffs until the next season opens. This is
 * calendar-derived rather than schedule-aware, and self-contained.
 *
 * The anchor was the Thursday opener until 2026, when the NFL moved week 1 to
 * Wednesday September 9 and the Thursday rule reported week 0 on opening day.
 * Anchoring to Wednesday matches all 18 weeks of the real 2026 schedule, and
 * in an ordinary Thursday-opener season it only moves the turnover one day
 * earlier, onto a day the prior week is already over.
 */
export function getNflRegularSeasonWeek(season: number, now: Date = new Date()): number {
  // Route clients pass `snapshot?.season ?? 0` before the snapshot loads (or
  // after it fails). Season 0 anchors the Labor Day math to the year 1900 and
  // reported week 18, which rendered "Week 18 of the 0 season" banners on the
  // loading and error states. No NFL season predates 1920, so anything
  // implausible reads as the offseason.
  if (season < 1920) {
    return 0;
  }
  // First Monday of September (Labor Day), evaluated in UTC.
  const septFirst = new Date(Date.UTC(season, 8, 1));
  const offsetToMonday = (8 - septFirst.getUTCDay()) % 7;
  const laborDay = new Date(Date.UTC(season, 8, 1 + offsetToMonday));
  const week1Kickoff = laborDay.getTime() + 2 * MS_PER_DAY;

  if (now.getTime() < week1Kickoff) {
    return 0;
  }

  const weeksElapsed = Math.floor((now.getTime() - week1Kickoff) / (7 * MS_PER_DAY));
  return Math.min(NFL_REGULAR_SEASON_WEEKS, weeksElapsed + 1);
}

/**
 * True while the refresh cron runs daily rather than weekly, which is July
 * through December: drafts through early September, then the season itself
 * through the Week 17 championships. February through June is the weekly lane.
 *
 * Keep this aligned with the schedule in .github/workflows/update-fantasy.yml,
 * because a freshness band only means something if it matches the cadence that
 * actually runs. The window used to end September 30, which judged a live
 * in-season board against offseason thresholds for three months.
 */
function isDailyRefreshWindow(now: Date): boolean {
  return now.getUTCMonth() >= 6;
}

/**
 * Buckets a snapshot timestamp into a freshness band that downstream UI can
 * use to surface a warning. July through December follows the daily refresh
 * schedule, so a source ages after two days and is stale after four. The rest
 * of the year follows the weekly schedule at eight and fourteen days.
 *
 * Returns "stale" for any invalid or missing date so callers default to the
 * conservative warning rather than silently treating it as fresh.
 */
export function getSnapshotStaleness(
  date: Date | string | null | undefined,
  now: Date = new Date()
): FantasySnapshotStaleness {
  if (date === null || date === undefined) {
    return "stale";
  }

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "stale";
  }

  // A materially future source date can otherwise produce a negative age and
  // pass as fresh indefinitely. Allow five minutes for ordinary device-clock
  // skew, matching the refresh verifier used by the snapshot pipeline.
  if (parsed.getTime() > now.getTime() + FANTASY_FUTURE_SKEW_TOLERANCE_MS) {
    return "stale";
  }

  const daily = isDailyRefreshWindow(now);
  const agingDays = daily
    ? FANTASY_DAILY_REFRESH_AGING_DAYS
    : FANTASY_OFFSEASON_AGING_DAYS;
  const staleDays = daily
    ? FANTASY_DAILY_REFRESH_STALE_DAYS
    : FANTASY_OFFSEASON_STALE_DAYS;
  const ageDays = (now.getTime() - parsed.getTime()) / MS_PER_DAY;
  if (ageDays < agingDays) {
    return "fresh";
  }
  if (ageDays <= staleDays) {
    return "aging";
  }
  return "stale";
}

/**
 * Short, human label for a staleness band. Kept beside getSnapshotStaleness so
 * the wording and the thresholds evolve together. Used by freshness chips that
 * annotate the "Source updated" and "Snapshot built" dates.
 */
export function getSnapshotStalenessLabel(staleness: FantasySnapshotStaleness): string {
  switch (staleness) {
    case "fresh":
      return "Current";
    case "aging":
      return "Aging";
    case "stale":
      return "Stale";
  }
}

export function formatRankValue(value: number | string | undefined): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "--";
    }

    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }

  return value?.trim() ? value : "--";
}

export function formatRange(player: Player): string {
  if (player.minRank === undefined || player.maxRank === undefined) {
    return "--";
  }

  return `${formatRankValue(player.minRank)} to ${formatRankValue(player.maxRank)}`;
}

export function formatOwnership(ownership: number | undefined): string {
  if (!Number.isFinite(ownership)) {
    return "Not listed";
  }

  return `${ownership?.toFixed(1)}%`;
}

/**
 * Plain-language explanation of the ADP value shown on fantasy surfaces.
 * ADP comes from a different upstream than the consensus ranks, and the
 * number is a 12-team-request price the provider served identically across
 * tested room sizes, so the copy keeps that disclosure with the value.
 */
export const FANTASY_ADP_TOOLTIP =
  "Average draft position from Fantasy Football Calculator's current mock-draft board, requested with 12-team settings. The provider returned the same prices across tested team sizes on August 7, 2026, so use it as a general market price rather than a league-size forecast.";

export const FANTASY_PRIOR_SEASON_ADP_TOOLTIP =
  "The final mock-draft average from the prior season, shown only as a dated reference. It does not drive Value, Reach, versus ADP, Draft Outlook, or simulated picks.";

export function formatAdp(adp: number | undefined): string {
  if (!Number.isFinite(adp)) {
    return "--";
  }

  return adp!.toFixed(1);
}

/**
 * How far consensus rank and market ADP must disagree before the board flags
 * it. Ten spots is the legacy fallback when the snapshot has no player-level
 * sample variation. New snapshots use the published ADP and expert spread.
 */
export const ADP_SIGNAL_THRESHOLD = 10;
/** Player-level mock selections required before an ADP gap can carry a signal. */
export const ADP_SIGNAL_MIN_TIMES_DRAFTED = 20;
/** Even stable sources move several picks between rooms, so smaller gaps remain noise. */
const ADP_SIGNAL_MIN_UNCERTAINTY_THRESHOLD = 6;

/**
 * The deepest consensus rank an ADP reading can still be compared against. ADP
 * is a pick number in a 12-team mock draft, so it stops around 190, while the
 * consensus board ranks 500+ players. Past this line `adp - rank` measures how
 * long the draft is rather than what the market thinks: in the 2026-08-16 PPR
 * snapshot the median gap sits near zero through rank 150, then falls to -21
 * across 151-200 and -147 past 250, purely because the market has no later pick
 * to spend. Matches ECR_BASELINE_MAX_RANK in draftAnalytics, which draws the
 * same line for the same reason.
 */
export const ADP_COMPARABLE_MAX_RANK = 150;

/**
 * Positions the consensus board and the draft market do not put on one scale.
 * FantasyPros ranks every kicker and defense below the last bench flex while
 * real rooms spend their final two rounds on them, so the gap runs -30 to -77
 * across the whole group and says nothing about any single player.
 */
const ADP_INCOMPARABLE_POSITIONS: ReadonlySet<string> = new Set(["K", "DST"]);

function finiteNonNegative(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Whether the player's ADP sample is large enough to support a value or reach
 * label. A missing count means the snapshot predates player-level sample
 * metadata, so callers preserve the legacy behavior instead of hiding every
 * signal during a rolling deploy.
 */
export function hasReliableAdpSample(player: Player): boolean {
  const timesDrafted = finiteNonNegative(player.adpTimesDrafted);
  return timesDrafted === null || timesDrafted >= ADP_SIGNAL_MIN_TIMES_DRAFTED;
}

/** Removes every market field so stale or slate-mismatched ADP cannot re-enter a model. */
export function withoutPlayerAdp(player: Player): Player {
  return {
    ...player,
    adp: undefined,
    adpHigh: undefined,
    adpLow: undefined,
    adpStandardDeviation: undefined,
    adpTimesDrafted: undefined,
  };
}

function withoutPlayerDraftBaselines(player: Player): Player {
  return {
    ...withoutPlayerAdp(player),
    averageRank: Number.NaN,
    standardDeviation: Number.NaN,
    rankEcr: undefined,
    rankAverage: undefined,
    positionRank: undefined,
    minRank: undefined,
    maxRank: undefined,
    tier: undefined,
    superflexRank: undefined,
    superflexTier: undefined,
  };
}

/**
 * Rebinds saved draft picks to the current snapshot before model scoring.
 * Orphaned saved players keep their identity and roster position, but no old
 * market or expert baseline can influence a model score.
 */
export function resolveDraftPicksForModel<T extends { player: Player }>(
  picks: readonly T[],
  currentBaselinePlayers: readonly Player[],
  allowAdp: boolean,
  currentIdentityPlayers: readonly Player[] = currentBaselinePlayers
): T[] {
  const currentBaselineById = new Map(
    currentBaselinePlayers.map((player) => [player.id, player])
  );
  const currentIdentityById = new Map(
    currentIdentityPlayers.map((player) => [player.id, player])
  );

  return picks.map((pick) => {
    const currentBaselinePlayer = currentBaselineById.get(pick.player.id);
    const currentIdentityPlayer = currentIdentityById.get(pick.player.id);
    const modelPlayer = currentBaselinePlayer
      ? allowAdp
        ? currentBaselinePlayer
        : withoutPlayerAdp(currentBaselinePlayer)
      : currentIdentityPlayer
        ? withoutPlayerDraftBaselines(currentIdentityPlayer)
      : withoutPlayerDraftBaselines(pick.player);
    return { ...pick, player: modelPlayer };
  });
}

/**
 * The minimum rank gap that counts as a market signal for this player.
 *
 * When the upstream publishes ADP variation, combine it with expert-rank
 * variation as independent sources of uncertainty. The root-sum-square keeps
 * a noisy reading from looking precise without adding both spreads in full.
 * Six picks is the floor when both readings exist. A board without either
 * spread keeps the prior ten-pick threshold.
 */
export function getAdpSignalThreshold(player: Player): number {
  const publishedAdpSpread = finiteNonNegative(player.adpStandardDeviation);
  const observedRangeSpread =
    publishedAdpSpread === null &&
    finiteNonNegative(player.adpHigh) !== null &&
    finiteNonNegative(player.adpLow) !== null
      ? Math.abs((player.adpLow as number) - (player.adpHigh as number)) / 4
      : null;
  const adpSpread = publishedAdpSpread ?? observedRangeSpread;

  if (adpSpread === null) {
    return ADP_SIGNAL_THRESHOLD;
  }

  const expertSpread = finiteNonNegative(player.standardDeviation);
  if (expertSpread === null) {
    return Math.max(ADP_SIGNAL_THRESHOLD, Math.ceil(adpSpread));
  }
  const combinedSpread = Math.hypot(adpSpread, expertSpread);
  return Math.max(ADP_SIGNAL_MIN_UNCERTAINTY_THRESHOLD, Math.ceil(combinedSpread));
}

/**
 * Compares a player's consensus rank to where drafters actually take him.
 * Positive delta means the market drafts him later than the experts rank him
 * (a value), negative means earlier (a reach). Returns null when the player
 * has no ADP reading or no usable rank.
 *
 * Invariant: `adp` is an overall draft position, so `rankEcr` must be on the
 * overall scale for the delta to mean anything. Only call this for players from
 * the overall or flex boards; on a position board `rankEcr` is the position rank
 * (e.g. QB9) and the result is meaningless. Callers gate on the board scale (see
 * the `valueSignalAvailable` prop threaded to the board, drawer, and compare).
 *
 * The two scales only overlap through ADP_COMPARABLE_MAX_RANK, and kickers and
 * defenses never share a scale with the market at all, so both cases return
 * null rather than a censored gap.
 */
export function getValueVsAdp(
  player: Player
): { delta: number; signal: "value" | "reach" | null } | null {
  const rank =
    typeof player.rankEcr === "number" && Number.isFinite(player.rankEcr)
      ? player.rankEcr
      : typeof player.averageRank === "number" && Number.isFinite(player.averageRank)
        ? player.averageRank
        : null;

  if (rank === null || !Number.isFinite(player.adp)) {
    return null;
  }

  // Both readings have to sit inside the range where the two boards overlap,
  // or the gap is an artifact of the draft's length instead of a market read.
  if (rank > ADP_COMPARABLE_MAX_RANK || ADP_INCOMPARABLE_POSITIONS.has(player.position)) {
    return null;
  }

  const delta = (player.adp as number) - rank;
  if (!hasReliableAdpSample(player)) {
    return { delta, signal: null };
  }

  const threshold = getAdpSignalThreshold(player);
  const signal = delta >= threshold ? "value" : delta <= -threshold ? "reach" : null;

  return { delta, signal };
}

export interface FantasyDraftMarketSignal {
  player: Player;
  delta: number;
}

export interface FantasyDraftMarketSignals {
  values: FantasyDraftMarketSignal[];
  reaches: FantasyDraftMarketSignal[];
}

/**
 * Pulls the largest expert-versus-drafter gaps from an overall board. This is
 * deliberately a current market read, not an ADP movement claim, because the
 * snapshot only publishes the latest ADP sample.
 */
export function getFantasyDraftMarketSignals(
  players: Player[],
  limit = 4
): FantasyDraftMarketSignals {
  const values: FantasyDraftMarketSignal[] = [];
  const reaches: FantasyDraftMarketSignal[] = [];

  for (const player of players) {
    const result = getValueVsAdp(player);
    if (result?.signal === "value") {
      values.push({ player, delta: result.delta });
    } else if (result?.signal === "reach") {
      reaches.push({ player, delta: result.delta });
    }
  }

  const tieBreak = (
    left: FantasyDraftMarketSignal,
    right: FantasyDraftMarketSignal
  ) =>
    (left.player.rankEcr ?? left.player.averageRank ?? Number.MAX_SAFE_INTEGER) -
      (right.player.rankEcr ??
        right.player.averageRank ??
        Number.MAX_SAFE_INTEGER) ||
    left.player.name.localeCompare(right.player.name);

  return {
    values: values
      .toSorted(
        (left, right) => right.delta - left.delta || tieBreak(left, right)
      )
      .slice(0, Math.max(0, limit)),
    reaches: reaches
      .toSorted(
        (left, right) => left.delta - right.delta || tieBreak(left, right)
      )
      .slice(0, Math.max(0, limit)),
  };
}

/**
 * Signed pick gap at the one-decimal precision the ADP column already uses.
 * ADP is a fractional pick number while the consensus rank is a whole slot, so
 * rounding the difference to an integer turns a half-pick gap into a full pick:
 * Jahmyr Gibbs at ADP 1.5 and ECR 1 read "+1" on the 2026-08-16 half PPR board.
 */
export function formatPickDelta(delta: number): string {
  const magnitude = Math.round(Math.abs(delta) * 10) / 10;
  if (magnitude === 0) {
    return "0";
  }
  return `${delta > 0 ? "+" : "\u2212"}${magnitude}`;
}

/**
 * Hover copy for the green "Value" chip. Explains the ADP-vs-consensus gap in
 * plain language so a drafter does not have to infer what the chip means.
 */
export const FANTASY_VALUE_TOOLTIP =
  "Value is his ADP minus his consensus rank, the number on the left of the row. A positive figure means drafters take him that many slots later than the experts rank him. The label appears only after at least 20 mock selections, only for players ranked inside the top 150 where a 12-team draft board and the consensus board still cover the same players, and only when the gap clears the published ADP and expert spread. It compares ADP with consensus rank, not the Avg shown beside it.";

/** Hover copy for the amber "Reach" chip, the mirror of FANTASY_VALUE_TOOLTIP. */
export const FANTASY_REACH_TOOLTIP =
  "Reach is his ADP minus his consensus rank, the number on the left of the row, and here it comes out negative. Drafters take him that many slots earlier than the experts rank him. The label appears only after at least 20 mock selections, only for players ranked inside the top 150 where a 12-team draft board and the consensus board still cover the same players, and only when the gap clears the published ADP and expert spread. It compares ADP with consensus rank, not the Avg shown beside it.";

/**
 * Hover copy for the expert low-to-high band. Shared by the rankings board and
 * the player drawer so the width of the bar means the same thing on both.
 */
export const FANTASY_EXPERT_SPREAD_TOOLTIP =
  "The best and worst rank any contributing expert gave this player. A wider band means the experts disagree more about him, so the consensus rank is a weaker guide on its own.";

/**
 * Hover copy for the "vs ADP" cell. The board also has narrower variants for
 * the unjudged and position-board cases; this is the general reading.
 */
export const FANTASY_VS_ADP_TOOLTIP =
  "Market ADP minus the consensus rank. A positive number means drafters let him fall past where the experts rank him, and a negative number means they take him earlier. It only appears through the top 150, because a 12-team draft runs out of picks around 190 while the consensus board ranks 500+ players, and kickers and defenses are left out because the consensus board ranks them well below where any room takes them. It is colored only when the gap clears the noise threshold for his ADP sample.";

/**
 * Hover copy for the "Player" column header on the rankings board. The cell
 * carries more than a name, so the header says what else is in it.
 */
export const FANTASY_PLAYER_COLUMN_TOOLTIP =
  "The player, his team, and his rank within his own position, plus a Value or Reach label when the market and the experts disagree by enough to be worth a look. Click any row for the full detail panel.";

/**
 * Hover copy for the points-per-game panel. The panel is prior-season history
 * rather than a projection, and the copy has to say so, because a scoring
 * average sitting next to draft ranks reads as a forecast otherwise.
 */
export const FANTASY_POINTS_PER_GAME_TOOLTIP =
  "Fantasy points per game from the prior completed regular season, scored in the format you have selected. It is what he did, not a projection of what he will do, and it appears only for players with at least four games that season.";

export type FantasyAdpFreshness = "current" | "prior-season" | "stale";

/**
 * Mock-draft ADP for the upcoming season does not populate until late summer,
 * so through the spring the upstream feed still serves the previous season's
 * final board. That carryover lands with an as-of date in a calendar year
 * before the snapshot season, which the board should label as preseason
 * carryover rather than letting an honest gap look like a broken refresh.
 * Once the daily window opens the same shape is a broken refresh instead, so
 * the age check below judges it rather than the carryover label.
 *
 * The age check applies year round. It used to run only from July through
 * September, and everything else fell through to a bare year comparison, so
 * any ADP stamped with the season's own year read as current. Mock-draft ADP
 * stops moving once real drafts end, which meant a frozen September market
 * read as live from October through December, on the board, on every value
 * and reach chip, and in the trade calculator's market leg.
 *
 * Returns "stale" when the date or season is missing or invalid. Callers
 * separately know whether a source exists, so incomplete metadata should fail
 * closed instead of enabling a draft signal with no verifiable date.
 */
export function getFantasyAdpFreshness(
  asOf: string | null | undefined,
  season: number | null | undefined,
  now: Date = new Date()
): FantasyAdpFreshness {
  if (!asOf || typeof season !== "number" || !Number.isFinite(season)) {
    return "stale";
  }

  const parsed = new Date(asOf);
  if (Number.isNaN(parsed.getTime())) {
    return "stale";
  }

  if (parsed.getTime() > now.getTime() + FANTASY_FUTURE_SKEW_TOLERANCE_MS) {
    return "stale";
  }

  const daily = isDailyRefreshWindow(now);

  if (parsed.getUTCFullYear() < season && !daily) {
    return "prior-season";
  }

  const staleDays = daily
    ? FANTASY_DAILY_REFRESH_STALE_DAYS
    : FANTASY_OFFSEASON_STALE_DAYS;
  if (now.getTime() - parsed.getTime() > staleDays * MS_PER_DAY) {
    return "stale";
  }

  return "current";
}

export interface FantasySourceCapabilities {
  ranking: {
    freshness: FantasySnapshotStaleness;
    usable: boolean;
  };
  market: {
    freshness: FantasyAdpFreshness;
    usable: boolean;
    current: boolean;
  };
  schedule: {
    freshness: FantasySnapshotStaleness;
    usable: boolean;
  };
}

/**
 * One source capability contract for fantasy surfaces. A page can keep showing
 * a dated board while using `usable` to withhold calculations that require a
 * current source. Market carryover remains a labeled reference outside draft
 * season, while `current` is reserved for same-season model inputs.
 */
export function getFantasySourceCapabilities({
  rankingAsOf,
  marketAsOf,
  scheduleAsOf,
  season,
  now = new Date(),
}: {
  rankingAsOf: Date | string | null | undefined;
  marketAsOf?: string | null;
  scheduleAsOf?: Date | string | null;
  season: number | null | undefined;
  now?: Date;
}): FantasySourceCapabilities {
  const rankingFreshness = getSnapshotStaleness(rankingAsOf, now);
  const marketFreshness = getFantasyAdpFreshness(marketAsOf, season, now);
  const scheduleFreshness = getSnapshotStaleness(scheduleAsOf, now);

  return {
    ranking: {
      freshness: rankingFreshness,
      usable: rankingFreshness !== "stale",
    },
    market: {
      freshness: marketFreshness,
      usable: marketFreshness !== "stale",
      current: marketFreshness === "current",
    },
    schedule: {
      freshness: scheduleFreshness,
      usable: scheduleFreshness !== "stale",
    },
  };
}

/**
 * Natural-height label chip shared across fantasy surfaces (matches the /nfl
 * badge recipe). Interactive pills keep min-h-[44px] separately for touch targets.
 */
export const FANTASY_CHIP_CLASS =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.12em]";

/** The template's 1080px column; each page manages its own shell width. */
export const SHELL_CLASS = "mx-auto w-full max-w-[1080px] px-[clamp(1rem,4vw,2.5rem)]";

export const MONO_LABEL_CLASS = "font-mono text-3xs uppercase tracking-[0.12em]";

/** Square-cornered mono chip from the template header (distinct from the shared pill chip). */
export const HEADER_CHIP_CLASS =
  "inline-flex items-center whitespace-nowrap rounded-[2px] border px-2 py-1 font-mono text-3xs uppercase tracking-[0.08em]";

/** Square-cornered mono position chip from the template (not the shared pill chip). */
export const POSITION_CHIP_CLASS =
  "inline-flex flex-none items-center rounded-[2px] border px-1.5 py-0.5 font-mono text-2xs tracking-[0.06em]";

export const PILL_BUTTON_CLASS =
  "inline-flex min-h-touch items-center justify-center rounded-full border px-3 font-mono text-3xs uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-50";

export const PILL_BUTTON_STYLE: CSSProperties = {
  borderColor: "var(--home-rule)",
  background: "var(--home-paper)",
  color: "var(--home-ink)",
};

/** Sticky offset that clears the site header on the draft surfaces. */
export const FASCIA_TOP_CLASS = "top-[4.5rem]";

export const WARNING_CARD_STYLE: CSSProperties = {
  borderColor: "color-mix(in srgb, var(--home-warning) 55%, var(--home-rule))",
  background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
};

export function getPositionTone(position: string): CSSProperties {
  switch (position) {
    case "QB":
      return {
        background: "color-mix(in srgb, var(--home-signal) 14%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-signal) 28%, var(--home-rule))",
      };
    case "RB":
      return {
        background: "color-mix(in srgb, var(--home-positive) 14%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-positive) 24%, var(--home-rule))",
      };
    case "WR":
      return {
        background: "color-mix(in srgb, var(--home-ink) 10%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-ink) 24%, var(--home-rule))",
      };
    case "TE":
      return {
        background: "color-mix(in srgb, var(--home-warning) 18%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-warning) 26%, var(--home-rule))",
      };
    case "K":
      return {
        background: "color-mix(in srgb, var(--home-stone) 45%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-stone) 60%, var(--home-rule))",
      };
    case "DST":
      return {
        background: "color-mix(in srgb, var(--home-ink) 16%, var(--home-paper))",
        borderColor: "color-mix(in srgb, var(--home-ink) 34%, var(--home-rule))",
      };
    default:
      return {
        background: "color-mix(in srgb, var(--home-paper-alt) 90%, var(--home-elev-mix))",
        borderColor: "var(--home-rule)",
      };
  }
}

export function getSourceKindLabel(
  sourceKind: FantasySnapshotSliceMetadata["sourceKind"] | undefined,
): string {
  switch (sourceKind) {
    case "overall_consensus":
      return "Overall consensus";
    case "position_consensus":
      return "Position consensus";
    case "shared_position_consensus":
      return "Shared consensus";
    case "derived_flex":
      return "Derived flex board";
    default:
      return "Unavailable";
  }
}

type FantasyConsensusSpread = "tight" | "mixed" | "volatile";

/**
 * Expert disagreement (`standardDeviation`) naturally grows with rank — the
 * top of the board is settled, the deep pool is noisy — so a flat threshold
 * would mislabel almost every late pick as "volatile". Normalizing the spread
 * against the player's own rank (with a floor that tames the very top) yields a
 * scale-aware read on how much the experts actually agree. Thresholds were
 * tuned against the live PPR board so the labels split roughly 55/40/6.
 *
 * Returns null when there is no usable rank or spread to judge.
 */
const CONSENSUS_SPREAD_FLOOR = 12;
const CONSENSUS_SPREAD_MIXED = 0.12;
const CONSENSUS_SPREAD_VOLATILE = 0.22;

export function getConsensusSpread(
  player: Player,
): { level: FantasyConsensusSpread; label: string; ratio: number } | null {
  const rank =
    typeof player.rankEcr === "number" && Number.isFinite(player.rankEcr)
      ? player.rankEcr
      : typeof player.averageRank === "number" && Number.isFinite(player.averageRank)
        ? player.averageRank
        : null;

  const standardDeviation = finiteNonNegative(player.standardDeviation);
  if (rank === null || standardDeviation === null) {
    return null;
  }

  const ratio = standardDeviation / (rank + CONSENSUS_SPREAD_FLOOR);
  if (ratio < CONSENSUS_SPREAD_MIXED) {
    return { level: "tight", label: "Tight consensus", ratio };
  }
  if (ratio < CONSENSUS_SPREAD_VOLATILE) {
    return { level: "mixed", label: "Mixed reads", ratio };
  }
  return { level: "volatile", label: "Volatile", ratio };
}

/**
 * One ordered list row paired with whether it opens a new tier. The board
 * renders a labeled separator above any row where `startsTier` is true (the
 * caller decides whether to suppress the very first one). Players without a
 * tier never start a break, so an untiered tail flows together.
 */
interface FantasyTierRow {
  player: Player;
  tier: number | null;
  startsTier: boolean;
}

export function withTierBreaks(players: Player[]): FantasyTierRow[] {
  let previousTier: number | null = null;
  return players.map((player) => {
    const tier = typeof player.tier === "number" && Number.isFinite(player.tier) ? player.tier : null;
    const startsTier = tier !== null && tier !== previousTier;
    if (tier !== null) {
      previousTier = tier;
    }
    return { player, tier, startsTier };
  });
}

/**
 * Signal intensity for a tier, on a 0-100 scale: solid (100) at tier 1, fading
 * by 13 points per tier down to a 12-point floor so even the bottom of the
 * board keeps a faint accent instead of vanishing. Shared by the rankings
 * row's left-edge tier rail and the inline tier-break tag so both read the
 * same "how deep in the board" signal off one formula. An untiered player
 * gets 0, which callers should mix toward a transparent/neutral base so the
 * accent disappears rather than reading as flat gray.
 */
const TIER_RAIL_FLOOR = 12;
const TIER_RAIL_STEP = 13;

export function getTierRailIntensity(tier: number | null | undefined): number {
  if (typeof tier !== "number" || !Number.isFinite(tier)) {
    return 0;
  }
  return Math.max(TIER_RAIL_FLOOR, 100 - (tier - 1) * TIER_RAIL_STEP);
}

/**
 * The expert average to show beside a player. `rankAverage` is FantasyPros'
 * published mean; `averageRank` is the snapshot's own fallback for boards that
 * do not carry one. Returns null when neither is usable, so callers render a
 * dash rather than a zero.
 */
export function getConsensusAvg(player: Player): number | null {
  if (typeof player.rankAverage === "number" && Number.isFinite(player.rankAverage)) {
    return player.rankAverage;
  }
  if (typeof player.averageRank === "number" && Number.isFinite(player.averageRank)) {
    return player.averageRank;
  }
  return null;
}

/** "J. Gibbs" for the narrow draft chips. Team defenses keep their full name. */
export function shortName(player: Player): string {
  const name = player.name ?? "";
  if (player.position === "DST" || !name.includes(" ")) return name;
  const parts = name.split(" ");
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

export interface LineupSlot {
  slot: string;
  eligible: string[];
  player: Player | null;
}

export interface LineupAssignment {
  slots: LineupSlot[];
  bench: number;
  /** Unfilled exact-position starting slots, keyed by position. */
  openExact: Partial<Record<string, number>>;
  flexOpen: boolean;
}

/**
 * Map the user's picks into starting-lineup slots in pick order: an exact
 * position slot first, then an eligible flex, then the bench. This mirrors how
 * the roster chips read on a draft sheet, not an optimal lineup solver.
 */
export function assignLineupSlots(
  lineup: RedraftLineupSettings,
  players: Player[]
): LineupAssignment {
  const slots: LineupSlot[] = [];
  (["QB", "RB", "WR", "TE"] as const).forEach((position) => {
    for (let index = 0; index < (lineup[position] || 0); index++) {
      slots.push({ slot: position, eligible: [position], player: null });
    }
  });
  for (let index = 0; index < (lineup.FLEX || 0); index++) {
    slots.push({ slot: "FLX", eligible: ["RB", "WR", "TE"], player: null });
  }
  (["K", "DST"] as const).forEach((position) => {
    for (let index = 0; index < (lineup[position] || 0); index++) {
      slots.push({ slot: position, eligible: [position], player: null });
    }
  });

  let bench = 0;
  for (const player of players) {
    const open =
      slots.find(
        (slot) => !slot.player && slot.eligible.length === 1 && slot.eligible[0] === player.position
      ) ?? slots.find((slot) => !slot.player && slot.eligible.includes(player.position));
    if (open) {
      open.player = player;
    } else {
      bench++;
    }
  }

  const openExact: Partial<Record<string, number>> = {};
  for (const slot of slots) {
    if (!slot.player && slot.eligible.length === 1) {
      openExact[slot.eligible[0]] = (openExact[slot.eligible[0]] ?? 0) + 1;
    }
  }

  return {
    slots,
    bench,
    openExact,
    flexOpen: slots.some((slot) => !slot.player && slot.eligible.length > 1),
  };
}
