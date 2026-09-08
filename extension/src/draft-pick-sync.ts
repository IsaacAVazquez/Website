import {
  detectFantasyDraftProvider,
  type FantasyDraftObservedPick,
  type FantasyDraftSyncMessage,
  type FantasyDraftSyncProvider,
} from "@/lib/fantasyCompanion";

type PublishDraftSync = (message: FantasyDraftSyncMessage) => void;

interface SleeperPickPayload {
  pick_no?: unknown;
  metadata?: {
    first_name?: unknown;
    last_name?: unknown;
    position?: unknown;
    team?: unknown;
  };
}

const POSITION_PATTERN = "QB|RB|WR|TE|K|DST|D/ST|DEF";

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizePosition(value: string): string {
  return value.toUpperCase().replace("D/ST", "DST").replace("DEF", "DST");
}

export function detectDraftSyncProvider(
  hostname = window.location.hostname
): FantasyDraftSyncProvider | null {
  return detectFantasyDraftProvider(hostname);
}

export function parseUnderdogDraftPickLabel(
  value: string
): FantasyDraftObservedPick | null {
  const match = cleanText(value).match(
    new RegExp(
      `\\b(\\d+)\\.(\\d+)\\|(\\d+)\\s+(.+?)\\s+(${POSITION_PATTERN})\\s*-\\s*([A-Z]{2,3})\\b`,
      "i"
    )
  );
  if (!match) return null;
  return {
    pickNumber: Number(match[3]),
    name: cleanText(match[4]),
    position: normalizePosition(match[5]),
    team: match[6].toUpperCase(),
  };
}

/** ESPN's league read API, the same host the draft room itself calls. */
const ESPN_LEAGUE_API = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl";
const ESPN_POSITIONS: Record<number, string> = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "DST" };
const ESPN_TEAMS: Record<number, string> = {
  1: "ATL", 2: "BUF", 3: "CHI", 4: "CIN", 5: "CLE", 6: "DAL", 7: "DEN", 8: "DET",
  9: "GB", 10: "TEN", 11: "IND", 12: "KC", 13: "LV", 14: "LAR", 15: "MIA", 16: "MIN",
  17: "NE", 18: "NO", 19: "NYG", 20: "NYJ", 21: "PHI", 22: "ARI", 23: "PIT", 24: "LAC",
  25: "SF", 26: "SEA", 27: "TB", 28: "WAS", 29: "CAR", 30: "JAX", 33: "BAL", 34: "HOU",
};

export interface EspnDraftContext {
  leagueId: string;
  season: number;
}

export type EspnPlayerIndex = Map<number, { name: string; position?: string; team?: string }>;

/** Only the draft room polls; a league page shares the id but has no live picks. */
export function extractEspnDraftContext(value: string): EspnDraftContext | null {
  try {
    const url = new URL(value);
    const leagueId = url.searchParams.get("leagueId");
    if (!leagueId || !/\/draft\b/.test(url.pathname)) return null;
    const season = Number(url.searchParams.get("seasonId"));
    return { leagueId, season: Number.isInteger(season) && season > 0 ? season : new Date().getFullYear() };
  } catch {
    return null;
  }
}

export function parseEspnPlayerIndex(value: unknown): EspnPlayerIndex {
  const index: EspnPlayerIndex = new Map();
  const list = Array.isArray(value)
    ? value
    : Array.isArray((value as { players?: unknown })?.players)
      ? ((value as { players: unknown[] }).players)
      : [];
  for (const entry of list) {
    const raw = (entry as { player?: unknown })?.player ?? entry;
    if (!raw || typeof raw !== "object") continue;
    const player = raw as {
      id?: unknown;
      fullName?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      defaultPositionId?: unknown;
      proTeamId?: unknown;
    };
    const id = Number(player.id);
    if (!Number.isInteger(id)) continue;
    const name = cleanText(
      typeof player.fullName === "string"
        ? player.fullName
        : `${typeof player.firstName === "string" ? player.firstName : ""} ${typeof player.lastName === "string" ? player.lastName : ""}`
    );
    if (!name) continue;
    const position = ESPN_POSITIONS[Number(player.defaultPositionId)];
    const team = ESPN_TEAMS[Number(player.proTeamId)];
    index.set(id, { name, ...(position ? { position } : {}), ...(team ? { team } : {}) });
  }
  return index;
}

/** ESPN pre-fills every slot with playerId -1; D/ST ids sit in -16001..-16100. */
export function espnPlayerIdsFromDraftDetail(value: unknown): number[] {
  const picks = (value as { draftDetail?: { picks?: unknown } })?.draftDetail?.picks;
  if (!Array.isArray(picks)) return [];
  return picks
    .map((pick) => Number((pick as { playerId?: unknown })?.playerId))
    .filter((id) => Number.isInteger(id) && (id > 0 || (id <= -16000 && id >= -16100)));
}

/**
 * Keeper slots are filled before the draft starts, so the log can hold a pick
 * in round 8 while round 1 is still open. Only the contiguous prefix from pick
 * 1 is reported; a keeper joins it once every earlier slot is filled.
 */
export function parseEspnDraftPicks(
  value: unknown,
  players: EspnPlayerIndex
): FantasyDraftObservedPick[] {
  const picks = (value as { draftDetail?: { picks?: unknown } })?.draftDetail?.picks;
  if (!Array.isArray(picks)) return [];
  const validIds = new Set(espnPlayerIdsFromDraftDetail(value));
  const filled = picks
    .map((entry): FantasyDraftObservedPick | null => {
      const pick = entry as { overallPickNumber?: unknown; playerId?: unknown };
      const playerId = Number(pick.playerId);
      const pickNumber = Number(pick.overallPickNumber);
      if (!validIds.has(playerId) || !Number.isInteger(pickNumber) || pickNumber < 1) return null;
      const player = players.get(playerId);
      return player
        ? { pickNumber, ...player }
        : { pickNumber, name: `ESPN player ${playerId}` };
    })
    .filter((pick): pick is FantasyDraftObservedPick => pick !== null)
    .sort((left, right) => left.pickNumber - right.pickNumber);
  const prefixLength = filled.findIndex((pick, index) => pick.pickNumber !== index + 1);
  return prefixLength === -1 ? filled : filled.slice(0, prefixLength);
}

function extractUniquePicks(
  elements: readonly Element[],
  parse: (value: string) => FantasyDraftObservedPick | null
): FantasyDraftObservedPick[] {
  const byPick = new Map<number, FantasyDraftObservedPick>();
  for (const element of elements) {
    const leafText = Array.from(element.querySelectorAll("p, span, strong, small, div"))
      .filter((node) => node.children.length === 0)
      .map((node) => node.textContent)
      .filter((value): value is string => Boolean(value))
      .join(" ");
    const labels = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      leafText,
      element.textContent,
    ].filter((value): value is string => Boolean(value));
    for (const label of labels) {
      const pick = parse(label);
      if (pick && !byPick.has(pick.pickNumber)) byPick.set(pick.pickNumber, pick);
    }
  }
  return [...byPick.values()].sort((left, right) => left.pickNumber - right.pickNumber);
}

export function extractUnderdogDraftPicks(
  root: ParentNode = document
): FantasyDraftObservedPick[] {
  const byPick = new Map<number, FantasyDraftObservedPick>();
  const elements = Array.from(root.querySelectorAll("button, [role='button']"));
  for (const element of elements) {
    const paragraphs = Array.from(element.querySelectorAll("p"));
    const pickLabel = paragraphs
      .map((paragraph) => cleanText(paragraph.textContent ?? ""))
      .find((text) => /^\d+\.\d+\|\d+$/.test(text));
    const positionLabel = Array.from(element.querySelectorAll("span, div"))
      .map((node) => cleanText(node.textContent ?? ""))
      .find((text) => new RegExp(`^(${POSITION_PATTERN})\\s*-\\s*([A-Z]{2,3})$`, "i").test(text));
    if (pickLabel) {
      const pickMatch = pickLabel.match(/^\d+\.\d+\|(\d+)$/);
      const positionMatch = positionLabel?.match(
        new RegExp(`^(${POSITION_PATTERN})\\s*-\\s*([A-Z]{2,3})$`, "i")
      ) ?? null;
      const name = cleanText(paragraphs.at(-1)?.textContent ?? "");
      if (pickMatch && name && name !== pickLabel && !/^\d+$/.test(name)) {
        byPick.set(Number(pickMatch[1]), {
          pickNumber: Number(pickMatch[1]),
          name,
          ...(positionMatch
            ? {
                position: normalizePosition(positionMatch[1]),
                team: positionMatch[2].toUpperCase(),
              }
            : {}),
        });
        continue;
      }
    }

    const fallback = extractUniquePicks([element], parseUnderdogDraftPickLabel)[0];
    if (fallback && !byPick.has(fallback.pickNumber)) {
      byPick.set(fallback.pickNumber, fallback);
    }
  }
  return [...byPick.values()].sort((left, right) => left.pickNumber - right.pickNumber);
}

/** Only a draft-room URL carries a draft id; a league page's id is the league. */
export function extractSleeperDraftId(value: string): string | null {
  try {
    return new URL(value).pathname.match(/\/draft\/(?:[a-z]+\/)?(\d{10,})(?:\/|$)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function parseSleeperDraftPicks(value: unknown): FantasyDraftObservedPick[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): FantasyDraftObservedPick | null => {
      if (!entry || typeof entry !== "object") return null;
      const pick = entry as SleeperPickPayload;
      const pickNumber = Number(pick.pick_no);
      const firstName = pick.metadata?.first_name;
      const lastName = pick.metadata?.last_name;
      if (
        !Number.isInteger(pickNumber) ||
        pickNumber < 1 ||
        typeof firstName !== "string" ||
        typeof lastName !== "string"
      ) {
        return null;
      }
      return {
        pickNumber,
        name: cleanText(`${firstName} ${lastName}`),
        ...(typeof pick.metadata?.position === "string"
          ? { position: normalizePosition(pick.metadata.position) }
          : {}),
        ...(typeof pick.metadata?.team === "string"
          ? { team: pick.metadata.team.toUpperCase() }
          : {}),
      };
    })
    .filter((pick): pick is FantasyDraftObservedPick => pick !== null)
    .sort((left, right) => left.pickNumber - right.pickNumber);
}

function signature(picks: readonly FantasyDraftObservedPick[]): string {
  return picks
    .map((pick) => `${pick.pickNumber}:${pick.name}:${pick.position ?? ""}:${pick.team ?? ""}`)
    .join("|");
}

function messageFor(
  provider: FantasyDraftSyncProvider,
  picks: FantasyDraftObservedPick[]
): FantasyDraftSyncMessage {
  return {
    type: "FANTASY_DRAFT_SYNC",
    provider,
    picks,
    observedAt: new Date().toISOString(),
  };
}

export function startDraftPickSync(
  provider: FantasyDraftSyncProvider,
  publish: PublishDraftSync,
  options: {
    href?: string;
    fetcher?: typeof fetch;
  } = {}
): {
  request: () => Promise<FantasyDraftSyncMessage>;
  stop: () => void;
} {
  const fetcher = options.fetcher ?? window.fetch.bind(window);
  let stopped = false;
  let inFlight = false;
  let lastSignature = "";
  let debounceId: number | null = null;
  let pollId: number | null = null;

  let espnPlayers: EspnPlayerIndex = new Map();

  const getJson = async (url: string, headers: Record<string, string> = {}): Promise<unknown> => {
    const response = await fetcher(url, {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json", ...headers },
    });
    return response.ok ? response.json() : null;
  };

  const readEspn = async (): Promise<FantasyDraftObservedPick[]> => {
    const context = extractEspnDraftContext(options.href ?? window.location.href);
    if (!context) return [];
    const league = await getJson(
      `${ESPN_LEAGUE_API}/seasons/${context.season}/segments/0/leagues/${context.leagueId}?view=mDraftDetail`
    );
    const ids = espnPlayerIdsFromDraftDetail(league);
    if (ids.length === 0) return [];
    // The player list is one request for the whole season; fetch it once and
    // again only when a drafted id is missing from it.
    if (ids.some((id) => !espnPlayers.has(id))) {
      const fetched = parseEspnPlayerIndex(
        await getJson(
          `${ESPN_LEAGUE_API}/seasons/${context.season}/players?scoringPeriodId=0&view=players_wl`,
          { "X-Fantasy-Filter": JSON.stringify({ filterActive: { value: true } }) }
        )
      );
      if (fetched.size > 0) espnPlayers = fetched;
    }
    return parseEspnDraftPicks(league, espnPlayers);
  };

  const read = async (): Promise<FantasyDraftObservedPick[]> => {
    if (provider === "underdog") return extractUnderdogDraftPicks();
    if (provider === "espn") {
      try {
        return await readEspn();
      } catch {
        return [];
      }
    }
    // Sleeper is a single-page app, so the href is re-read on every poll
    // instead of captured once at script load.
    const sleeperDraftId = extractSleeperDraftId(options.href ?? window.location.href);
    if (!sleeperDraftId) return [];
    try {
      const response = await fetcher(
        `https://api.sleeper.app/v1/draft/${sleeperDraftId}/picks`,
        { cache: "no-store", headers: { Accept: "application/json" } }
      );
      if (!response.ok) return [];
      return parseSleeperDraftPicks(await response.json());
    } catch {
      return [];
    }
  };

  const request = async (): Promise<FantasyDraftSyncMessage> => {
    const picks = await read();
    const nextMessage = messageFor(provider, picks);
    const nextSignature = signature(picks);
    if (!stopped && picks.length > 0 && nextSignature !== lastSignature) {
      lastSignature = nextSignature;
      publish(nextMessage);
    }
    return nextMessage;
  };

  const poll = async (): Promise<void> => {
    if (inFlight) return;
    inFlight = true;
    try {
      await request();
    } finally {
      inFlight = false;
    }
  };

  if (provider === "underdog") {
    const observer = new MutationObserver(() => {
      if (debounceId !== null) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => void request(), 200);
    });
    // A new pick mounts new nodes, so childList is enough. Watching
    // characterData would rescrape the page on every clock tick.
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "title"],
    });
    void request();

    return {
      request,
      stop: () => {
        stopped = true;
        observer.disconnect();
        if (debounceId !== null) window.clearTimeout(debounceId);
      },
    };
  }

  void poll();
  pollId = window.setInterval(() => void poll(), 2500);
  return {
    request,
    stop: () => {
      stopped = true;
      if (pollId !== null) window.clearInterval(pollId);
    },
  };
}
