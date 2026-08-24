import type {
  BestBallContestId,
  BestBallContestPreset,
  BestBallLineup,
  BestBallStrategyProfile,
  BestBallStrategyProfileId,
} from "./types";

export const BEST_BALL_RULES_AS_OF = "2026-08-09";
const UNDERDOG_OFFICIAL_RULES_URL = "https://app.underdogsports.com/rules";
const UNDERDOG_OFFICIAL_TERMS_URL = "https://legal.underdogsports.com/";
const BBM_VII_OFFICIAL_RULES_URL =
  "https://help.underdogsports.com/en/articles/14785343-best-ball-mania-vii";
const PUPPY_OFFICIAL_RULES_URL =
  "https://help.underdogsports.com/en/articles/14787820-the-puppy";
const ELIMINATOR_OFFICIAL_RULES_URL =
  "https://help.underdogsports.com/en/articles/14786129-the-eliminator";
const WEEKLY_WINNERS_OFFICIAL_RULES_URL =
  "https://help.underdogsports.com/en/articles/14787567-best-ball-weekly-winners";
const SIT_AND_GO_OFFICIAL_RULES_URL =
  "https://help.underdogsports.com/en/articles/10716487-best-ball-sit-n-go";
const SUPERFLEX_OFFICIAL_RULES_URL =
  "https://help.underdogsports.com/en/articles/11102881-what-is-a-superflex";
export const DEFAULT_BEST_BALL_CONTEST_ID: BestBallContestId = "bbm-vii";

export const STANDARD_BEST_BALL_LINEUP: Readonly<BestBallLineup> = Object.freeze({
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 1,
  FLEX: 1,
});

/**
 * Underdog's active "NFL Superflex Best Ball" style, confirmed against its published
 * contest-style catalog on 2026-08-23. It starts one fewer receiver than the standard
 * style, keeps a separate flex, adds the superflex slot, and drafts 20 rounds rather
 * than 18.
 */
export const SUPERFLEX_BEST_BALL_LINEUP: Readonly<BestBallLineup> = Object.freeze({
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1,
  SUPERFLEX: 1,
});

const SUPERFLEX_ROUNDS = 20;

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
      competitionFormat: "tournament",
      lineupVariant: "standard",
      recommendationMode: "exact",
      recommendationReason:
        "The current standard-season Underdog ADP matches this room's player pool and draft shape.",
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
      competitionFormat: "tournament",
      lineupVariant: "standard",
      recommendationMode: "exact",
      recommendationReason:
        "The current standard-season Underdog ADP matches this room's player pool and draft shape.",
      strategyProfileId: "standard-tournament",
      lineup: STANDARD_BEST_BALL_LINEUP,
      officialRulesUrl: PUPPY_OFFICIAL_RULES_URL,
    },
    "little-dalmatian-2": {
      ...sharedPreset,
      id: "little-dalmatian-2",
      name: "The Little Dalmatian 2",
      shortName: "Little Dalmatian",
      description:
        "A dollar entry tournament that uses the same draft profile as Best Ball Mania, with four rounds that advance three of twelve teams out of the regular season and then one team out of each playoff group.",
      aliases: [
        "little-dalmatian",
        "little-dalmatian-2",
        "the-little-dalmatian",
        "the-little-dalmatian-2",
        "dalmatian",
        "ld2",
      ],
      competitionFormat: "tournament",
      lineupVariant: "standard",
      recommendationMode: "exact",
      recommendationReason:
        "The current standard-season Underdog ADP matches this room's player pool and draft shape.",
      strategyProfileId: "standard-tournament",
      lineup: STANDARD_BEST_BALL_LINEUP,
    },
    "six-man": {
      ...sharedPreset,
      id: "six-man",
      name: "6-Man Best Ball",
      shortName: "6-Man",
      description:
        "Underdog's six team draft style, which keeps the standard 18 round roster but splits each position tier across half as many entrants, so every roster gets twice as much of it and the board runs out far later than it does in a twelve team room.",
      aliases: [
        "six-man",
        "6-man",
        "6-mans",
        "six-mans",
        "frenchie-sprint",
        "the-frenchie-sprint-2",
        "sprint",
      ],
      competitionFormat: "tournament",
      lineupVariant: "standard",
      teams: 6,
      recommendationMode: "reference",
      recommendationReason:
        "The snapshot's Underdog ADP is a twelve team market, so it prices the players correctly but not the pick slots in a six team room.",
      strategyProfileId: "standard-tournament",
      lineup: STANDARD_BEST_BALL_LINEUP,
      rulesNote:
        "Six team rooms run several tournament structures, from the two round Frenchie Sprint to the four round formats. Use this tracker only when the contest card shows 6 teams, 18 rounds, an 18 player roster, and half PPR scoring.",
    },
    eliminator: {
      ...sharedPreset,
      id: "eliminator",
      name: "Eliminator",
      shortName: "Eliminator",
      description:
        "A survival profile that puts more weight on weekly bye coverage and less weight on team correlation.",
      aliases: ["eliminator", "elimination", "survivor", "survival"],
      competitionFormat: "elimination",
      lineupVariant: "standard",
      recommendationMode: "reference",
      recommendationReason:
        "The snapshot does not include Eliminator-specific ADP for this player pool and slate.",
      strategyProfileId: "eliminator",
      lineup: STANDARD_BEST_BALL_LINEUP,
      officialRulesUrl: ELIMINATOR_OFFICIAL_RULES_URL,
    },
    "weekly-winners": {
      ...sharedPreset,
      id: "weekly-winners",
      name: "Weekly Winners",
      shortName: "Weekly Winners",
      description:
        "A Weekly Winners reference model for 12 teams and 18 rounds with a sourced board and roster construction guidance.",
      aliases: ["weekly", "weekly-winner", "weekly-winners", "weeklywinners"],
      competitionFormat: "weekly",
      lineupVariant: "standard",
      recommendationMode: "reference",
      recommendationReason:
        "Weekly Winners player pools and slates vary, and the snapshot has no matching room ADP.",
      strategyProfileId: "weekly-winners",
      lineup: STANDARD_BEST_BALL_LINEUP,
      officialRulesUrl: WEEKLY_WINNERS_OFFICIAL_RULES_URL,
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
      competitionFormat: "cumulative",
      lineupVariant: "standard",
      recommendationMode: "reference",
      recommendationReason:
        "Sit & Go room settings and player pools vary, and the snapshot has no matching room ADP.",
      strategyProfileId: "cumulative",
      lineup: STANDARD_BEST_BALL_LINEUP,
      officialRulesUrl: SIT_AND_GO_OFFICIAL_RULES_URL,
      rulesNote:
        "Sit & Go group size, roster size, and scoring can vary. Use this tracker only when the contest card shows 12 teams, 18 rounds, an 18 player roster, and half PPR scoring.",
    },
    superflex: {
      ...sharedPreset,
      id: "superflex",
      name: "Superflex",
      shortName: "Superflex",
      description:
        "A Superflex reference model for 12 teams and 20 rounds, which starts one fewer receiver, keeps the normal flex, and adds a separate slot that may use a quarterback, against its own sourced Superflex consensus board.",
      aliases: ["superflex", "super-flex", "sf", "sflex", "superflex-tournament"],
      competitionFormat: "tournament",
      lineupVariant: "superflex",
      recommendationMode: "reference",
      recommendationReason:
        "The snapshot has a Superflex consensus board but no matching Superflex room ADP.",
      strategyProfileId: "superflex",
      rounds: SUPERFLEX_ROUNDS,
      rosterSize: SUPERFLEX_ROUNDS,
      lineup: SUPERFLEX_BEST_BALL_LINEUP,
      officialRulesUrl: SUPERFLEX_OFFICIAL_RULES_URL,
      rulesNote:
        "Superflex is an eligibility label, and the rest of the contest rules can vary. Use this tracker only when the contest card shows 12 teams, 20 rounds, a 20 player roster, and half PPR scoring.",
    },
  });

export const BEST_BALL_CONTEST_ORDER: readonly BestBallContestId[] = [
  "bbm-vii",
  "puppy",
  "little-dalmatian-2",
  "six-man",
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
    concentrationPenalty: 2,
    concentrationFloor: 4,
    spikeWeekWeight: 0,
    scarcityWeight: 4,
    week17Treatment: "scored",
  },
  eliminator: {
    id: "eliminator",
    correlationWeight: 1,
    byeCoverageWeight: 7,
    rosterNeedWeight: 10,
    concentrationPenalty: 3,
    concentrationFloor: 2,
    spikeWeekWeight: 0,
    scarcityWeight: 4,
    week17Treatment: "none",
  },
  "weekly-winners": {
    id: "weekly-winners",
    correlationWeight: 5,
    byeCoverageWeight: 2,
    rosterNeedWeight: 8,
    concentrationPenalty: 1.5,
    concentrationFloor: 4,
    spikeWeekWeight: 5,
    scarcityWeight: 3,
    week17Treatment: "none",
  },
  cumulative: {
    id: "cumulative",
    correlationWeight: 2,
    byeCoverageWeight: 3,
    rosterNeedWeight: 9,
    concentrationPenalty: 2.5,
    concentrationFloor: 3,
    spikeWeekWeight: 0,
    scarcityWeight: 4,
    week17Treatment: "none",
  },
  superflex: {
    id: "superflex",
    correlationWeight: 2,
    byeCoverageWeight: 2,
    rosterNeedWeight: 9,
    concentrationPenalty: 2,
    concentrationFloor: 3,
    spikeWeekWeight: 0,
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

/**
 * The snapshot carries one standard-season Underdog ADP board. It is a usable
 * market for the two standard tournament rooms, but it is not a contest-specific
 * price for separate Eliminator, Weekly Winners, Sit & Go, or Superflex slates.
 */
export function hasSupportedBestBallAdp(
  contest: BestBallContestId | BestBallContestPreset
): boolean {
  const preset = typeof contest === "string" ? getContestPreset(contest) : contest;
  return preset.recommendationMode === "exact";
}

export function getStrategyProfile(
  contest: BestBallContestId | BestBallContestPreset
): BestBallStrategyProfile {
  const preset = typeof contest === "string" ? getContestPreset(contest) : contest;
  return BEST_BALL_STRATEGY_PROFILES[preset.strategyProfileId];
}
