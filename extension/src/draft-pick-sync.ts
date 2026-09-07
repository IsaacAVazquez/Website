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

export function parseEspnDraftPickLabel(
  value: string
): FantasyDraftObservedPick | null {
  const text = cleanText(value);
  const positionThenTeam = text.match(
    new RegExp(
      `(?:^|\\s)\\d+\\.\\s*\\((\\d+)\\)\\s+(.+?)\\s+(${POSITION_PATTERN})\\s*[-,|]\\s*([A-Z]{2,3})(?:\\s|$)`,
      "i"
    )
  );
  if (positionThenTeam) {
    return {
      pickNumber: Number(positionThenTeam[1]),
      name: cleanText(positionThenTeam[2]),
      position: normalizePosition(positionThenTeam[3]),
      team: positionThenTeam[4].toUpperCase(),
    };
  }

  const teamThenPosition = text.match(
    new RegExp(
      `(?:^|\\s)\\d+\\.\\s*\\((\\d+)\\)\\s+(.+?)[,|]?\\s+([A-Z]{2,3})[,|]?\\s+(${POSITION_PATTERN})(?:\\s|$)`,
      "i"
    )
  );
  if (!teamThenPosition) return null;
  return {
    pickNumber: Number(teamThenPosition[1]),
    name: cleanText(teamThenPosition[2]),
    team: teamThenPosition[3].toUpperCase(),
    position: normalizePosition(teamThenPosition[4]),
  };
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

export function extractEspnDraftPicks(
  root: ParentNode = document
): FantasyDraftObservedPick[] {
  return extractUniquePicks(
    Array.from(
      root.querySelectorAll(
        "[data-testid*='pick' i], [class*='pick' i], [aria-label*='pick' i], [role='row']"
      )
    ),
    parseEspnDraftPickLabel
  );
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

  const read = async (): Promise<FantasyDraftObservedPick[]> => {
    if (provider === "underdog") return extractUnderdogDraftPicks();
    if (provider === "espn") return extractEspnDraftPicks();
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

  if (provider === "sleeper") {
    void poll();
    pollId = window.setInterval(() => void poll(), 2500);
  } else {
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

  return {
    request,
    stop: () => {
      stopped = true;
      if (pollId !== null) window.clearInterval(pollId);
    },
  };
}
