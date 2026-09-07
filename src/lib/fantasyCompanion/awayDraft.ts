import { countRedraftStartingSlots } from "@/lib/redraftLineup";
import type { Player, RedraftLineupSettings } from "@/types";
import { redraftSourceRank } from "./recommendations";

export type AwayDraftPlatform = "espn" | "sleeper";

export type AwayDraftPosition = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export interface AwayDraftQueueEntry {
  player: Player;
  rank: number;
  sourceRank: number;
}

export interface AwayDraftPositionLimit {
  position: AwayDraftPosition;
  minimum: number;
  maximum: number;
}

export interface AwayDraftRoundRule {
  round: number;
  position: "K" | "DST";
}

export interface AwayDraftPlan {
  platform: AwayDraftPlatform;
  queue: AwayDraftQueueEntry[];
  requiredQueueSize: number;
  positionLimits: AwayDraftPositionLimit[];
  roundRules: AwayDraftRoundRule[];
}

interface AwayDraftPlanOptions {
  platform: AwayDraftPlatform;
  teams: number;
  rounds: number;
  lineup: RedraftLineupSettings;
}

const DRAFTABLE_POSITIONS = new Set<AwayDraftPosition>([
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "DST",
]);

function buildPositionLimits(
  rounds: number,
  lineup: RedraftLineupSettings
): AwayDraftPositionLimit[] {
  const starters = countRedraftStartingSlots(lineup);
  const benchSlots = Math.max(0, rounds - starters);
  const skillBench = Math.ceil(benchSlots / 2);

  return [
    {
      position: "QB",
      minimum: lineup.QB,
      maximum: Math.min(rounds, lineup.QB + (benchSlots > 0 ? 1 : 0)),
    },
    {
      position: "RB",
      minimum: lineup.RB,
      maximum: Math.min(
        rounds,
        lineup.RB + lineup.FLEX + skillBench
      ),
    },
    {
      position: "WR",
      minimum: lineup.WR,
      maximum: Math.min(
        rounds,
        lineup.WR + lineup.FLEX + skillBench
      ),
    },
    {
      position: "TE",
      minimum: lineup.TE,
      maximum: Math.min(rounds, lineup.TE + (benchSlots > 0 ? 1 : 0)),
    },
    { position: "K", minimum: lineup.K, maximum: lineup.K },
    { position: "DST", minimum: lineup.DST, maximum: lineup.DST },
  ];
}

function buildRoundRules(
  rounds: number,
  lineup: RedraftLineupSettings
): AwayDraftRoundRule[] {
  const rules: AwayDraftRoundRule[] = [];
  let round = rounds;

  if (lineup.K > 0) {
    rules.unshift({ round, position: "K" });
    round -= 1;
  }
  if (lineup.DST > 0 && round > 0) {
    rules.unshift({ round, position: "DST" });
  }

  return rules;
}

export function buildAwayDraftPlan(
  players: readonly Player[],
  options: AwayDraftPlanOptions
): AwayDraftPlan {
  const teams = Math.max(1, Math.floor(options.teams));
  const rounds = Math.max(1, Math.floor(options.rounds));
  const requiredQueueSize = teams * rounds;
  const seen = new Set<string>();

  const queue = players
    .map((player, sourceIndex) => ({
      player,
      sourceIndex,
      sourceRank: redraftSourceRank(player),
    }))
    .filter(
      (entry) =>
        DRAFTABLE_POSITIONS.has(entry.player.position as AwayDraftPosition) &&
        Number.isFinite(entry.sourceRank)
    )
    .sort(
      (left, right) =>
        left.sourceRank - right.sourceRank || left.sourceIndex - right.sourceIndex
    )
    .filter((entry) => {
      if (seen.has(entry.player.id)) return false;
      seen.add(entry.player.id);
      return true;
    })
    .slice(0, requiredQueueSize)
    .map(({ player, sourceRank }, index) => ({
      player,
      rank: index + 1,
      sourceRank,
    }));

  return {
    platform: options.platform,
    queue,
    requiredQueueSize,
    positionLimits: buildPositionLimits(rounds, options.lineup),
    roundRules: buildRoundRules(rounds, options.lineup),
  };
}

export function formatAwayDraftPlan(plan: AwayDraftPlan): string {
  const platformName = plan.platform === "espn" ? "ESPN" : "Sleeper";
  const queue = plan.queue
    .map(
      ({ player, rank }) =>
        `${rank}\t${player.name}\t${player.position}\t${player.team}`
    )
    .join("\n");

  if (plan.platform === "sleeper") {
    return `${platformName} away draft queue\nRank\tPlayer\tPosition\tTeam\n${queue}`;
  }

  const limits = plan.positionLimits
    .map(
      ({ position, minimum, maximum }) =>
        `${position}\tminimum ${minimum}\tmaximum ${maximum}`
    )
    .join("\n");
  const rules = plan.roundRules.length > 0
    ? plan.roundRules
        .map(({ round, position }) => `Round ${round}\t${position}`)
        .join("\n")
    : "Leave every round set to Best Available";

  return `${platformName} away draft plan\n\nPosition limits\n${limits}\n\nRound rules\n${rules}\n\nRank\tPlayer\tPosition\tTeam\n${queue}`;
}
