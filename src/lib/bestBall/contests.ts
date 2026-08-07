import type {
  BestBallContestId,
  BestBallContestPreset,
  BestBallLineup,
  BestBallStrategyProfile,
  BestBallStrategyProfileId,
} from "./types";

export const BEST_BALL_RULES_AS_OF = "2026-08-02";
export const UNDERDOG_OFFICIAL_RULES_URL = "https://app.underdogsports.com/rules";
export const UNDERDOG_OFFICIAL_TERMS_URL = "https://legal.underdogsports.com/";
export const BBM_VII_OFFICIAL_RULES_URL =
  "https://help.underdogsports.com/en/articles/14785343-best-ball-mania-vii";
export const DEFAULT_BEST_BALL_CONTEST_ID: BestBallContestId = "bbm-vii";

export const STANDARD_BEST_BALL_LINEUP: Readonly<BestBallLineup> = Object.freeze({
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 1,
  FLEX: 1,
});

export const SUPERFLEX_BEST_BALL_LINEUP: Readonly<BestBallLineup> = Object.freeze({
  ...STANDARD_BEST_BALL_LINEUP,
  FLEX: 0,
  SUPERFLEX: 1,
});

const STANDARD_RULES_NOTE =
  "Underdog's current rules and the contest card in the draft lobby control if a contest changes.";

const sharedPreset = {
  teams: 12,
  rounds: 18,
  rosterSize: 18,
  scoring: "HALF_PPR" as const,
  officialRulesUrl: UNDERDOG_OFFICIAL_RULES_URL,
  officialTermsUrl: UNDERDOG_OFFICIAL_TERMS_URL,
  rulesAsOf: BEST_BALL_RULES_AS_OF,
  rulesNote: STANDARD_RULES_NOTE,
};

export const BEST_BALL_CONTESTS: Readonly<Record<BestBallContestId, BestBallContestPreset>> =
  Object.freeze({
    "bbm-vii": {
      ...sharedPreset,
      id: "bbm-vii",
      name: "Best Ball Mania VII",
      shortName: "BBM VII",
      description:
        "A playoff tournament profile that keeps the current room price first, scores completed Week 17 game stacks, and allows same team concentration up to four players before penalizing it.",
      aliases: ["bbm", "bbm7", "bbm-vii", "best-ball-mania", "best-ball-mania-7", "best-ball-mania-vii"],
      format: "tournament",
      strategyProfileId: "standard-tournament",
      lineup: STANDARD_BEST_BALL_LINEUP,
      officialRulesUrl: BBM_VII_OFFICIAL_RULES_URL,
      economics: {
        entryFee: 25,
        fieldEntries: 672_336,
        prizePool: 15_000_000,
        firstAdvanceRate: 2 / 12,
        asOf: BEST_BALL_RULES_AS_OF,
        sourceUrl: BBM_VII_OFFICIAL_RULES_URL,
      },
    },
    puppy: {
      ...sharedPreset,
      id: "puppy",
      name: "The Puppy",
      shortName: "Puppy",
      description:
        "A smaller tournament offering that uses the same draft profile as Best Ball Mania.",
      aliases: ["puppy", "the-puppy", "puppy-tournament"],
      format: "tournament",
      strategyProfileId: "standard-tournament",
      lineup: STANDARD_BEST_BALL_LINEUP,
    },
    eliminator: {
      ...sharedPreset,
      id: "eliminator",
      name: "Eliminator",
      shortName: "Eliminator",
      description:
        "A survival profile that puts more weight on weekly bye coverage and less weight on team correlation.",
      aliases: ["eliminator", "elimination", "survivor", "survival"],
      format: "elimination",
      strategyProfileId: "eliminator",
      lineup: STANDARD_BEST_BALL_LINEUP,
    },
    "weekly-winners": {
      ...sharedPreset,
      id: "weekly-winners",
      name: "Weekly Winners",
      shortName: "Weekly Winners",
      description:
        "A Weekly Winners model for 12 teams and 18 rounds that adds a visible position level weekly variance proxy and values correlated scoring more heavily.",
      aliases: ["weekly", "weekly-winner", "weekly-winners", "weeklywinners"],
      format: "weekly",
      strategyProfileId: "weekly-winners",
      lineup: STANDARD_BEST_BALL_LINEUP,
      rulesNote:
        "Weekly Winners group size, player pool, and slate can vary. Use this tracker only when the contest card shows 12 teams, 18 rounds, an 18 player roster, and half PPR scoring.",
    },
    "sit-and-go": {
      ...sharedPreset,
      id: "sit-and-go",
      name: "Sit & Go",
      shortName: "Sit & Go",
      description:
        "A cumulative scoring model for 12 teams and 18 rounds with no separate Week 17 opponent adjustment.",
      aliases: ["sit-and-go", "sit-and-go-cumulative", "sitngo", "sit-n-go", "cumulative", "cash"],
      format: "cumulative",
      strategyProfileId: "cumulative",
      lineup: STANDARD_BEST_BALL_LINEUP,
      rulesNote:
        "Sit & Go group size, roster size, and scoring can vary. Use this tracker only when the contest card shows 12 teams, 18 rounds, an 18 player roster, and half PPR scoring.",
    },
    superflex: {
      ...sharedPreset,
      id: "superflex",
      name: "Superflex",
      shortName: "Superflex",
      description:
        "A Superflex model for 12 teams and 18 rounds with a flex slot that can use a quarterback. The board order comes from a sourced Superflex consensus rather than a locally computed adjustment, and the heaviest positional tier cliff weight of any profile pulls thin quarterback tiers forward.",
      aliases: ["superflex", "super-flex", "sf", "sflex", "superflex-tournament"],
      format: "superflex",
      strategyProfileId: "superflex",
      lineup: SUPERFLEX_BEST_BALL_LINEUP,
      rulesNote:
        "Superflex is an eligibility label, and the rest of the contest rules can vary. Use this tracker only when the contest card shows 12 teams, 18 rounds, an 18 player roster, and half PPR scoring.",
    },
  });

export const BEST_BALL_CONTEST_ORDER: readonly BestBallContestId[] = [
  "bbm-vii",
  "puppy",
  "eliminator",
  "weekly-winners",
  "sit-and-go",
  "superflex",
];

export const BEST_BALL_STRATEGY_PROFILES: Readonly<
  Record<BestBallStrategyProfileId, BestBallStrategyProfile>
> = Object.freeze({
  "standard-tournament": {
    id: "standard-tournament",
    correlationWeight: 4,
    byeCoverageWeight: 2,
    rosterNeedWeight: 8,
    adpValueWeight: 1,
    concentrationPenalty: 2,
    concentrationFloor: 4,
    spikeWeekWeight: 0,
    gameStackWeight: 6,
    scarcityWeight: 4,
    week17Treatment: "scored",
  },
  eliminator: {
    id: "eliminator",
    correlationWeight: 1,
    byeCoverageWeight: 7,
    rosterNeedWeight: 10,
    adpValueWeight: 1,
    concentrationPenalty: 3,
    concentrationFloor: 2,
    spikeWeekWeight: 0,
    gameStackWeight: 0,
    scarcityWeight: 4,
    week17Treatment: "none",
  },
  "weekly-winners": {
    id: "weekly-winners",
    correlationWeight: 5,
    byeCoverageWeight: 2,
    rosterNeedWeight: 8,
    adpValueWeight: 0.9,
    concentrationPenalty: 1.5,
    concentrationFloor: 4,
    spikeWeekWeight: 5,
    gameStackWeight: 0,
    scarcityWeight: 3,
    week17Treatment: "none",
  },
  cumulative: {
    id: "cumulative",
    correlationWeight: 2,
    byeCoverageWeight: 3,
    rosterNeedWeight: 9,
    adpValueWeight: 1.1,
    concentrationPenalty: 2.5,
    concentrationFloor: 3,
    spikeWeekWeight: 0,
    gameStackWeight: 0,
    scarcityWeight: 4,
    week17Treatment: "none",
  },
  superflex: {
    id: "superflex",
    correlationWeight: 2,
    byeCoverageWeight: 2,
    rosterNeedWeight: 9,
    adpValueWeight: 1,
    concentrationPenalty: 2,
    concentrationFloor: 3,
    spikeWeekWeight: 0,
    gameStackWeight: 0,
    scarcityWeight: 6,
    week17Treatment: "none",
  },
});

function normalizeContestKey(value: string): string {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

const CONTEST_ALIASES: Readonly<Record<string, BestBallContestId>> = (() => {
  const aliases: Record<string, BestBallContestId> = {};
  for (const contest of Object.values(BEST_BALL_CONTESTS)) {
    for (const alias of [contest.id, contest.name, contest.shortName, ...contest.aliases]) {
      aliases[normalizeContestKey(alias)] = contest.id;
    }
  }
  aliases.standard = "bbm-vii";
  aliases.tournament = "bbm-vii";
  aliases.bestball = "bbm-vii";
  aliases.bestballmaniavii = "bbm-vii";
  aliases.bestballmania7 = "bbm-vii";
  aliases.sitandgo = "sit-and-go";
  return aliases;
})();

export function isBestBallContestId(value: unknown): value is BestBallContestId {
  return typeof value === "string" && value in BEST_BALL_CONTESTS;
}

export function normalizeContestId(
  value: string | null | undefined,
  fallback: BestBallContestId = DEFAULT_BEST_BALL_CONTEST_ID
): BestBallContestId {
  if (!value) return fallback;
  return CONTEST_ALIASES[normalizeContestKey(value)] ?? fallback;
}

export function getContestPreset(
  contest: BestBallContestId | string | null | undefined
): BestBallContestPreset {
  return BEST_BALL_CONTESTS[normalizeContestId(contest)];
}

export function getStrategyProfile(
  contest: BestBallContestId | BestBallContestPreset
): BestBallStrategyProfile {
  const preset = typeof contest === "string" ? getContestPreset(contest) : contest;
  return BEST_BALL_STRATEGY_PROFILES[preset.strategyProfileId];
}
