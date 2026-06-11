import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import type { Player } from "@/types";

/**
 * Matches ADP entries from the mock-draft source onto FantasyPros consensus
 * players at build time. Matching is deliberately tiered and exact — name,
 * team, and position normalization only, never fuzzy string distance. A
 * player without an ADP reading stays blank; a wrong reading would quietly
 * mislead every value signal downstream.
 */

/** Sentinel stored in the name index when two entries collide on a key. */
const AMBIGUOUS = Symbol("ambiguous");

const NAME_SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);

/**
 * Both sources use current abbreviations for most teams, but relocations and
 * style differences linger in upstream data. Normalize both sides to one
 * canonical abbreviation before comparing.
 */
const TEAM_ABBR_ALIASES: Record<string, string> = {
  JAC: "JAX",
  WSH: "WAS",
  OAK: "LV",
  LVR: "LV",
  SD: "LAC",
  STL: "LAR",
  LA: "LAR",
  ARZ: "ARI",
  BLT: "BAL",
  CLV: "CLE",
  HST: "HOU",
};

/**
 * Team nickname (and city, where unambiguous) to abbreviation, for DST
 * entries whose source carries a name like "Pittsburgh Steelers" or
 * "Pittsburgh Defense" without a usable team field.
 */
const TEAM_NAME_TO_ABBR: Record<string, string> = {
  cardinals: "ARI",
  arizona: "ARI",
  falcons: "ATL",
  atlanta: "ATL",
  ravens: "BAL",
  baltimore: "BAL",
  bills: "BUF",
  buffalo: "BUF",
  panthers: "CAR",
  carolina: "CAR",
  bears: "CHI",
  chicago: "CHI",
  bengals: "CIN",
  cincinnati: "CIN",
  browns: "CLE",
  cleveland: "CLE",
  cowboys: "DAL",
  dallas: "DAL",
  broncos: "DEN",
  denver: "DEN",
  lions: "DET",
  detroit: "DET",
  packers: "GB",
  "green bay": "GB",
  texans: "HOU",
  houston: "HOU",
  colts: "IND",
  indianapolis: "IND",
  jaguars: "JAX",
  jacksonville: "JAX",
  chiefs: "KC",
  "kansas city": "KC",
  raiders: "LV",
  "las vegas": "LV",
  chargers: "LAC",
  rams: "LAR",
  dolphins: "MIA",
  miami: "MIA",
  vikings: "MIN",
  minnesota: "MIN",
  patriots: "NE",
  "new england": "NE",
  saints: "NO",
  "new orleans": "NO",
  giants: "NYG",
  jets: "NYJ",
  eagles: "PHI",
  philadelphia: "PHI",
  steelers: "PIT",
  pittsburgh: "PIT",
  "49ers": "SF",
  "san francisco": "SF",
  seahawks: "SEA",
  seattle: "SEA",
  buccaneers: "TB",
  "tampa bay": "TB",
  titans: "TEN",
  tennessee: "TEN",
  commanders: "WAS",
  washington: "WAS",
};

export function normalizeAdpTeam(team: string | null | undefined): string {
  const normalized = (team ?? "").trim().toUpperCase();
  return TEAM_ABBR_ALIASES[normalized] ?? normalized;
}

export function normalizeAdpPlayerName(name: string): string {
  const tokens = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  while (tokens.length > 1 && NAME_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  return tokens.join(" ");
}

function findTeamAbbrInName(name: string): string | null {
  const normalized = name
    .toLowerCase()
    .replace(/\b(defense|defence|dst|d\/st)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (TEAM_NAME_TO_ABBR[normalized]) {
    return TEAM_NAME_TO_ABBR[normalized];
  }

  const words = normalized.split(" ");
  for (let span = Math.min(2, words.length); span >= 1; span -= 1) {
    for (let start = 0; start + span <= words.length; start += 1) {
      const candidate = words.slice(start, start + span).join(" ");
      if (TEAM_NAME_TO_ABBR[candidate]) {
        return TEAM_NAME_TO_ABBR[candidate];
      }
    }
  }

  return null;
}

export interface FantasyAdpIndex {
  byNameTeamPosition: Map<string, FantasyAdpEntry>;
  byNamePosition: Map<string, FantasyAdpEntry | typeof AMBIGUOUS>;
  dstByTeam: Map<string, FantasyAdpEntry>;
}

function nameTeamPositionKey(name: string, team: string, position: string): string {
  return `${name}|${team}|${position}`;
}

function namePositionKey(name: string, position: string): string {
  return `${name}|${position}`;
}

export function buildFantasyAdpIndex(entries: FantasyAdpEntry[]): FantasyAdpIndex {
  const index: FantasyAdpIndex = {
    byNameTeamPosition: new Map(),
    byNamePosition: new Map(),
    dstByTeam: new Map(),
  };

  for (const entry of entries) {
    const name = normalizeAdpPlayerName(entry.name);
    const team = normalizeAdpTeam(entry.team);

    if (entry.position === "DST") {
      const teamAbbr = team && team !== "FA" ? team : findTeamAbbrInName(entry.name);
      if (teamAbbr && !index.dstByTeam.has(teamAbbr)) {
        index.dstByTeam.set(teamAbbr, entry);
      }
      continue;
    }

    if (!name) {
      continue;
    }

    if (team) {
      const fullKey = nameTeamPositionKey(name, team, entry.position);
      if (!index.byNameTeamPosition.has(fullKey)) {
        index.byNameTeamPosition.set(fullKey, entry);
      }
    }

    const looseKey = namePositionKey(name, entry.position);
    index.byNamePosition.set(
      looseKey,
      index.byNamePosition.has(looseKey) ? AMBIGUOUS : entry
    );
  }

  return index;
}

export function matchPlayerAdp(
  player: Pick<Player, "name" | "team" | "position">,
  index: FantasyAdpIndex
): FantasyAdpEntry | null {
  if (player.position === "DST") {
    const teamAbbr =
      normalizeAdpTeam(player.team) && normalizeAdpTeam(player.team) !== "FA"
        ? normalizeAdpTeam(player.team)
        : findTeamAbbrInName(player.name);
    return teamAbbr ? index.dstByTeam.get(teamAbbr) ?? null : null;
  }

  const name = normalizeAdpPlayerName(player.name);
  if (!name) {
    return null;
  }

  const team = normalizeAdpTeam(player.team);
  if (team) {
    const fullMatch = index.byNameTeamPosition.get(
      nameTeamPositionKey(name, team, player.position)
    );
    if (fullMatch) {
      return fullMatch;
    }
  }

  // Name plus position absorbs team lag after trades and free agents, but an
  // ambiguous key (two distinct players sharing a normalized name at the same
  // position) yields nothing rather than a coin flip.
  const looseMatch = index.byNamePosition.get(namePositionKey(name, player.position));
  return looseMatch === AMBIGUOUS ? null : looseMatch ?? null;
}
