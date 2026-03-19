import { writeFile } from "fs/promises";
import path from "path";
import { fantasyProsSession } from "@/lib/fantasyProsSession";
import { Player, Position, ScoringFormat } from "@/types";

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "fantasyPositionData.generated.ts"
);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const FANTASY_POSITION_DATA_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;
const SHARED_POSITIONS = new Set<FantasyPositionDataPosition>(["QB", "K", "DST"]);

type FantasyPositionDataPosition = Extract<Position, (typeof FANTASY_POSITION_DATA_POSITIONS)[number]>;

const URL_MAP: Record<ScoringFormat, Record<FantasyPositionDataPosition, string>> = {
  PPR: {
    QB: "https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php",
    RB: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
    WR: "https://www.fantasypros.com/nfl/rankings/ppr-wr-cheatsheets.php",
    TE: "https://www.fantasypros.com/nfl/rankings/ppr-te-cheatsheets.php",
    K: "https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php",
    DST: "https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php",
  },
  HALF_PPR: {
    QB: "https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php",
    RB: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-rb-cheatsheets.php",
    WR: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-wr-cheatsheets.php",
    TE: "https://www.fantasypros.com/nfl/rankings/half-point-ppr-te-cheatsheets.php",
    K: "https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php",
    DST: "https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php",
  },
  STANDARD: {
    QB: "https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php",
    RB: "https://www.fantasypros.com/nfl/rankings/rb-cheatsheets.php",
    WR: "https://www.fantasypros.com/nfl/rankings/wr-cheatsheets.php",
    TE: "https://www.fantasypros.com/nfl/rankings/te-cheatsheets.php",
    K: "https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php",
    DST: "https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php",
  },
};

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFiniteNumber(value: number | string | undefined, fallback: number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeTier(value: number | string | undefined): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : undefined;
  }

  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function buildDeterministicExpertRanks(averageRank: number, standardDeviation: number): number[] {
  const normalizedStdDev = Math.max(0.5, Math.min(standardDeviation, 3));

  return Array.from({ length: 10 }, (_, index) => {
    const offset = (index - 4.5) / 4.5;
    return Math.max(1, Math.round(averageRank + offset * normalizedStdDev * 2));
  });
}

function dedupePlayers(players: Player[]): Player[] {
  const seen = new Set<string>();
  const deduped: Player[] = [];

  for (const player of players) {
    const key = `${player.name}::${player.team}::${player.position}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(player);
  }

  return deduped;
}

function normalizePlayers(players: Player[], position: FantasyPositionDataPosition): Player[] {
  return dedupePlayers(players)
    .map((player, index) => {
      const averageRank = toFiniteNumber(player.averageRank, index + 1);
      const standardDeviation = toFiniteNumber(
        player.standardDeviation,
        Math.max(0.5, averageRank * 0.08)
      );
      const projectedPoints = toFiniteNumber(player.projectedPoints, 0);

      return {
        ...player,
        id: `fp-${position}-${index + 1}`,
        position,
        averageRank,
        projectedPoints,
        standardDeviation,
        tier: normalizeTier(player.tier),
        minRank:
          player.minRank === undefined
            ? undefined
            : toFiniteNumber(player.minRank, Math.max(1, averageRank - 1)),
        maxRank:
          player.maxRank === undefined
            ? undefined
            : toFiniteNumber(player.maxRank, averageRank + 1),
        expertRanks: buildDeterministicExpertRanks(averageRank, standardDeviation),
      };
    })
    .sort((left, right) => Number(left.averageRank) - Number(right.averageRank));
}

async function fetchPositionPlayers(
  position: FantasyPositionDataPosition,
  url: string
): Promise<Player[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.fantasypros.com/nfl/rankings/",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${position} rankings from ${url}: ${response.status}`);
  }

  const html = await response.text();
  const rawPlayers = await fantasyProsSession.parseHTMLData(html, position);
  const normalizedPlayers = normalizePlayers(rawPlayers, position);

  if (normalizedPlayers.length === 0) {
    throw new Error(`No ${position} rankings were parsed from ${url}.`);
  }

  return normalizedPlayers;
}

function renderGeneratedModule(
  data: Record<ScoringFormat, Record<FantasyPositionDataPosition, Player[]>>,
  generatedAt: string
): string {
  const serialized = JSON.stringify(data, null, 2);

  return `/**
 * Generated fantasy position data.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

import { Player, ScoringFormat } from "@/types";

export const fantasyPositionDataGeneratedAt = ${JSON.stringify(generatedAt)};
export const fantasyPositionDataSource =
  "FantasyPros public consensus cheatsheets. QB, K, and DST are scoring-agnostic position boards reused across formats.";

export const fantasyPositionData: Record<
  ScoringFormat,
  Record<"QB" | "RB" | "WR" | "TE" | "K" | "DST", Player[]>
> = ${serialized};
`;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const sharedData = {} as Record<FantasyPositionDataPosition, Player[]>;

  for (const position of FANTASY_POSITION_DATA_POSITIONS) {
    if (!SHARED_POSITIONS.has(position)) {
      continue;
    }

    sharedData[position] = await fetchPositionPlayers(position, URL_MAP.STANDARD[position]);
    await pause(250);
  }

  const scoringFormats: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];
  const dataset = {} as Record<ScoringFormat, Record<FantasyPositionDataPosition, Player[]>>;

  for (const scoringFormat of scoringFormats) {
    dataset[scoringFormat] = {} as Record<FantasyPositionDataPosition, Player[]>;

    for (const position of FANTASY_POSITION_DATA_POSITIONS) {
      if (SHARED_POSITIONS.has(position)) {
        dataset[scoringFormat][position] = sharedData[position];
        continue;
      }

      dataset[scoringFormat][position] = await fetchPositionPlayers(
        position,
        URL_MAP[scoringFormat][position]
      );
      await pause(250);
    }
  }

  await writeFile(OUTPUT_PATH, renderGeneratedModule(dataset, generatedAt), "utf8");

  for (const scoringFormat of scoringFormats) {
    const counts = Object.fromEntries(
      FANTASY_POSITION_DATA_POSITIONS.map((position) => [
        position,
        dataset[scoringFormat][position].length,
      ])
    );

    console.log(`${scoringFormat}:`, counts);
  }

  console.log(`Wrote fantasy position data: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
