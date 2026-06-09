import { rename, writeFile } from "fs/promises";
import path from "path";
import {
  FANTASY_PROS_PUBLIC_SOURCE,
  FANTASY_PUBLIC_POSITIONS,
  FantasyProsPublicFetchError,
  fetchFantasyProsPublicConsensusBoard,
  type FantasyPublicPosition,
} from "@/lib/fantasyProsPublicSource";
import { Player, ScoringFormat } from "@/types";

async function atomicWriteFile(targetPath: string, contents: string) {
  const tempPath = `${targetPath}.tmp`;
  await writeFile(tempPath, contents, "utf8");
  await rename(tempPath, targetPath);
}

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "fantasyPositionData.generated.ts"
);

const FANTASY_POSITION_DATA_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;
const SHARED_POSITIONS = new Set<FantasyPublicPosition>(["QB", "K", "DST"]);

type FantasyPositionDataPosition = (typeof FANTASY_POSITION_DATA_POSITIONS)[number];

interface FantasyPositionDataset {
  overall: Player[];
  positions: Record<FantasyPositionDataPosition, Player[]>;
  upstreamUpdatedAt: string | null;
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_BACKOFF_MS = 60_000;
const JITTER_MS = 500;

/**
 * Decide whether a thrown error is worth retrying. We retry network errors and
 * 429/503 responses but bail immediately on other 4xx — there is no point
 * hammering FantasyPros with a malformed request, and a 404 means the URL
 * shape changed and needs human attention.
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof FantasyProsPublicFetchError) {
    if (error.status === 429 || error.status === 503) {
      return true;
    }
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    return error.status >= 500;
  }
  return true;
}

/**
 * Honor `Retry-After` on 429 responses. Header is either an integer number of
 * seconds or an HTTP-date; both forms are normalized to ms. Returns null when
 * no header is present so the caller falls back to its exponential schedule.
 */
function getRetryAfterMs(error: unknown): number | null {
  if (!(error instanceof FantasyProsPublicFetchError) || error.status !== 429) {
    return null;
  }
  const header = error.headers.get("retry-after");
  if (!header) {
    return null;
  }

  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds) && String(seconds) === header.trim()) {
    return Math.max(0, seconds * 1000);
  }

  const dateMs = Date.parse(header);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 4,
  backoffBaseMs = 1500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        const status =
          error instanceof FantasyProsPublicFetchError ? ` (HTTP ${error.status})` : "";
        console.error(
          `[retry] ${label} failed with non-retryable error${status}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        throw error;
      }

      if (attempt < attempts) {
        const exponential = Math.min(backoffBaseMs * 2 ** (attempt - 1), MAX_BACKOFF_MS);
        const jitter = Math.floor(Math.random() * JITTER_MS);
        const retryAfter = getRetryAfterMs(error);
        const wait = retryAfter !== null ? retryAfter + jitter : exponential + jitter;

        console.warn(
          `[retry] ${label} attempt ${attempt}/${attempts} failed (${
            error instanceof Error ? error.message : String(error)
          }). Retrying in ${wait}ms${retryAfter !== null ? " (honored Retry-After)" : ""}.`
        );
        await pause(wait);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`[retry] ${label} failed after ${attempts} attempts`);
}

function renderGeneratedModule(
  data: Record<ScoringFormat, FantasyPositionDataset>,
  generatedAt: string
): string {
  const serialized = JSON.stringify(data, null, 2);

  return `/**
 * Generated fantasy position data.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

import { Player, ScoringFormat } from "@/types";

export const fantasyPositionDataGeneratedAt = ${JSON.stringify(generatedAt)};
export const fantasyPositionDataSource = ${JSON.stringify(FANTASY_PROS_PUBLIC_SOURCE)};

export const fantasyPositionData: Record<
  ScoringFormat,
  {
    overall: Player[];
    positions: Record<"QB" | "RB" | "WR" | "TE" | "K" | "DST", Player[]>;
    upstreamUpdatedAt: string | null;
  }
> = ${serialized};
`;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const sharedData = {} as Record<FantasyPositionDataPosition, Player[]>;

  for (const position of FANTASY_PUBLIC_POSITIONS) {
    if (position === "OVERALL" || !SHARED_POSITIONS.has(position)) {
      continue;
    }

    const board = await withRetry(`STANDARD ${position}`, () =>
      fetchFantasyProsPublicConsensusBoard("STANDARD", position)
    );
    sharedData[position] = board.players;
    await pause(250);
  }

  const scoringFormats: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];
  const dataset = {} as Record<ScoringFormat, FantasyPositionDataset>;

  for (const scoringFormat of scoringFormats) {
    const overallBoard = await withRetry(`${scoringFormat} OVERALL`, () =>
      fetchFantasyProsPublicConsensusBoard(scoringFormat, "OVERALL")
    );
    await pause(250);

    const positions = {} as Record<FantasyPositionDataPosition, Player[]>;

    for (const position of FANTASY_POSITION_DATA_POSITIONS) {
      if (SHARED_POSITIONS.has(position)) {
        positions[position] = sharedData[position];
        continue;
      }

      const board = await withRetry(`${scoringFormat} ${position}`, () =>
        fetchFantasyProsPublicConsensusBoard(scoringFormat, position)
      );
      positions[position] = board.players;
      await pause(250);
    }

    dataset[scoringFormat] = {
      overall: overallBoard.players,
      positions,
      upstreamUpdatedAt: overallBoard.upstreamUpdatedAt,
    };
  }

  await atomicWriteFile(OUTPUT_PATH, renderGeneratedModule(dataset, generatedAt));

  for (const scoringFormat of scoringFormats) {
    const counts = Object.fromEntries(
      [
        ["OVERALL", dataset[scoringFormat].overall.length],
        ...FANTASY_POSITION_DATA_POSITIONS.map((position) => [
          position,
          dataset[scoringFormat].positions[position].length,
        ]),
      ]
    );

    console.log(`${scoringFormat}:`, counts);
  }

  console.log(`Wrote fantasy position data: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
