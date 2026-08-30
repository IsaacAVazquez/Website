import { FANTASY_PROS_PUBLIC_USER_AGENT } from "@/lib/fantasyProsPublicSource";
import {
  FANTASY_VORP_TEAM_SIZES,
  type FantasyVorpTeamSize,
} from "@/lib/fantasyVorp";
import type { Position, ScoringFormat } from "@/types";

export { FANTASY_VORP_TEAM_SIZES };
export type { FantasyVorpTeamSize };

export const FANTASY_PROS_VORP_PROVIDER = "FantasyPros projected VORP";

const FANTASY_PROS_VORP_PATHS: Record<ScoringFormat, string> = {
  PPR: "ppr-vorp.php",
  HALF_PPR: "half-ppr-vorp.php",
  STANDARD: "vorp.php",
};

const FANTASY_PROS_VORP_SCORING_LABELS: Record<ScoringFormat, string> = {
  PPR: "PPR",
  HALF_PPR: "HALF",
  STANDARD: "STD",
};

const FANTASY_PROS_VORP_MINIMUM_ROWS = 300;
type VorpPosition = Extract<Position, "QB" | "RB" | "WR" | "TE" | "K" | "DST">;

export interface FantasyProsVorpPlayer {
  playerId: string;
  name: string;
  team: string;
  position: VorpPosition;
  positionRank: number;
  rank: number;
  value: number;
}

export interface FantasyProsVorpBoard {
  scoringFormat: ScoringFormat;
  teamSize: FantasyVorpTeamSize;
  season: number;
  sourceUrl: string;
  accessedAt: string;
  players: FantasyProsVorpPlayer[];
}

function finiteNumber(value: string | undefined, field: string): number {
  const parsed = Number.parseFloat(value ?? "");
  if (!Number.isFinite(parsed)) {
    throw new Error(`FantasyPros VORP source has an invalid ${field}.`);
  }
  return parsed;
}

function positiveInteger(value: string | undefined, field: string): number {
  const parsed = finiteNumber(value, field);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`FantasyPros VORP source has an invalid ${field}.`);
  }
  return parsed;
}

function normalizeText(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function extractRequired(
  html: string,
  pattern: RegExp,
  field: string
): RegExpMatchArray {
  const match = html.match(pattern);
  if (!match) throw new Error(`FantasyPros VORP source is missing ${field}.`);
  return match;
}

export function getFantasyProsVorpUrl(
  scoringFormat: ScoringFormat,
  teamSize: FantasyVorpTeamSize
): string {
  const url = new URL(
    FANTASY_PROS_VORP_PATHS[scoringFormat],
    "https://www.fantasypros.com/nfl/rankings/"
  );
  if (teamSize !== 12) url.searchParams.set("team_size", String(teamSize));
  return url.toString();
}

export function parseFantasyProsVorpPage(
  html: string,
  {
    scoringFormat,
    teamSize,
    sourceUrl = getFantasyProsVorpUrl(scoringFormat, teamSize),
    accessedAt = new Date().toISOString(),
    minimumRows = FANTASY_PROS_VORP_MINIMUM_ROWS,
  }: {
    scoringFormat: ScoringFormat;
    teamSize: FantasyVorpTeamSize;
    sourceUrl?: string;
    accessedAt?: string;
    minimumRows?: number;
  }
): FantasyProsVorpBoard {
  const heading = normalizeText(
    extractRequired(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i, "the report heading")[1]
  );
  if (heading !== "NFL Value Over Replacement Player (VORP) Rankings") {
    throw new Error("FantasyPros VORP source returned the wrong report.");
  }

  const seasonMatch = normalizeText(
    extractRequired(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/i, "the projection season")[1]
  ).match(
    /^(\d{4}) Overall Projections$/
  );
  if (!seasonMatch) {
    throw new Error("FantasyPros VORP source is missing the projection season.");
  }
  const season = positiveInteger(seasonMatch[1], "season");

  const scoringSelect = extractRequired(
    html,
    /<select\b[^>]*aria-label=["']Filter rankings by Scoring["'][^>]*>([\s\S]*?)<\/select>/i,
    "the scoring control"
  )[1];
  const selectedScoring = normalizeText(
    extractRequired(
      scoringSelect,
      /<option\b[^>]*\bselected(?:=["'][^"']*["'])?[^>]*>([\s\S]*?)<\/option>/i,
      "the selected scoring format"
    )[1]
  ).toUpperCase();
  if (selectedScoring !== FANTASY_PROS_VORP_SCORING_LABELS[scoringFormat]) {
    throw new Error(
      `FantasyPros VORP source returned ${selectedScoring || "unknown"} scoring for ${scoringFormat}.`
    );
  }

  const teamSizeSelect = extractRequired(
    html,
    /<select\b[^>]*name=["']team-size["'][^>]*>([\s\S]*?)<\/select>/i,
    "the team-size control"
  )[1];
  const selectedTeamSize = positiveInteger(
    normalizeText(
      extractRequired(
        teamSizeSelect,
        /<option\b[^>]*\bselected(?:=["'][^"']*["'])?[^>]*>([\s\S]*?)<\/option>/i,
        "the selected team size"
      )[1]
    ),
    "team size"
  );
  if (selectedTeamSize !== teamSize) {
    throw new Error(
      `FantasyPros VORP source returned ${selectedTeamSize} teams for a ${teamSize}-team request.`
    );
  }

  const table = extractRequired(
    html,
    /<table\b[^>]*id=["']data["'][^>]*>([\s\S]*?)<\/table>/i,
    "the rankings table"
  )[1];
  const tableHead = extractRequired(
    table,
    /<thead\b[^>]*>([\s\S]*?)<\/thead>/i,
    "the ranking columns"
  )[1];
  const headers = Array.from(tableHead.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)).map(
    (match) => normalizeText(match[1]).toUpperCase()
  );
  if (
    headers[0] !== "RANK" ||
    headers[1] !== "PLAYER" ||
    headers[2] !== "POS" ||
    headers[3] !== "VORP"
  ) {
    throw new Error("FantasyPros VORP source changed its ranking columns.");
  }

  const tableBody = extractRequired(
    table,
    /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i,
    "the ranking rows"
  )[1];
  const rowMatches = Array.from(
    tableBody.matchAll(
      /<tr\b(?=[^>]*class=["'][^"']*\bplayer-row\b[^"']*["'])(?=[^>]*data-id=["'](\d+)["'])[^>]*>([\s\S]*?)(?=<tr\b(?=[^>]*class=["'][^"']*\bplayer-row\b)|$)/gi
    )
  );
  const players: FantasyProsVorpPlayer[] = rowMatches.map((rowMatch, index) => {
    const sourceId = rowMatch[1];
    const rowHtml = rowMatch[2];
    const cells = Array.from(
      rowHtml.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)
    );
    if (cells.length < 4) {
      throw new Error(`FantasyPros VORP source has too few cells at row ${index + 1}.`);
    }
    const rank = positiveInteger(normalizeText(cells[0][2]), `row ${index + 1} rank`);
    const playerCell = cells[1][2];
    const playerLink = extractRequired(
      playerCell,
      /<a\b[^>]*class=["'][^"']*\bplayer-name\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
      `row ${index + 1} player name`
    );
    const name = normalizeText(playerLink[1]);
    const playerLabel = normalizeText(playerCell);
    const teamMatch = playerLabel.match(/\(([^()]+)\)$/);
    const positionLabel = normalizeText(cells[2][2]).toUpperCase();
    const positionMatch = positionLabel.match(/^(QB|RB|WR|TE|K|DST)(\d+)$/);
    const value = finiteNumber(normalizeText(cells[3][2]), `row ${index + 1} VORP`);
    const rawValue = finiteNumber(
      cells[3][1].match(/\bdata-value=["']([^"']+)["']/i)?.[1],
      `row ${index + 1} raw VORP`
    );

    if (!sourceId || !/^\d+$/.test(sourceId) || !name || !teamMatch || !positionMatch) {
      throw new Error(`FantasyPros VORP source has an invalid player at row ${index + 1}.`);
    }
    if (rank !== index + 1) {
      throw new Error(`FantasyPros VORP source has a nonsequential rank at row ${index + 1}.`);
    }
    if (value !== Math.max(0, rawValue)) {
      throw new Error(`FantasyPros VORP source has inconsistent displayed value at row ${index + 1}.`);
    }

    return {
      playerId: `fp-${sourceId}`,
      name,
      team: teamMatch[1].trim(),
      position: positionMatch[1] as VorpPosition,
      positionRank: positiveInteger(positionMatch[2], `row ${index + 1} position rank`),
      rank,
      value,
    };
  });

  if (players.length < minimumRows) {
    throw new Error(
      `FantasyPros VORP source returned ${players.length} players, below the ${minimumRows}-player floor.`
    );
  }
  if (new Set(players.map((player) => player.playerId)).size !== players.length) {
    throw new Error("FantasyPros VORP source returned duplicate player ids.");
  }
  for (let index = 1; index < players.length; index += 1) {
    if (players[index].value > players[index - 1].value) {
      throw new Error("FantasyPros VORP source is not ordered from highest to lowest value.");
    }
  }

  return {
    scoringFormat,
    teamSize,
    season,
    sourceUrl,
    accessedAt: new Date(accessedAt).toISOString(),
    players,
  };
}

export async function fetchFantasyProsVorpBoard(
  scoringFormat: ScoringFormat,
  teamSize: FantasyVorpTeamSize,
  expectedSeason: number
): Promise<FantasyProsVorpBoard> {
  const sourceUrl = getFantasyProsVorpUrl(scoringFormat, teamSize);
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": FANTASY_PROS_PUBLIC_USER_AGENT,
    },
  });
  if (!response.ok) {
    throw new Error(`FantasyPros VORP request failed (${response.status}).`);
  }
  const board = parseFantasyProsVorpPage(await response.text(), {
    scoringFormat,
    teamSize,
    sourceUrl,
    accessedAt: new Date().toISOString(),
  });
  if (board.season !== expectedSeason) {
    throw new Error(
      `FantasyPros VORP source returned season ${board.season}; expected ${expectedSeason}.`
    );
  }
  return board;
}
