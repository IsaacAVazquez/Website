import { rename, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { withRetry } from "./fetchRetry";
import { readGeneratedSnapshot } from "./snapshotFallback";
import { fetchFantasyAdpBoard, type FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import { ScoringFormat } from "@/types";

/**
 * Fetches mock-draft ADP for each scoring format and writes the generated ADP
 * module the snapshot builder reads. ADP is a nice-to-have layered on top of
 * the FantasyPros consensus refresh, so this script never fails the
 * `update:fantasy` chain: a failed or thin fetch keeps the previous generated
 * data (its own asOf stays disclosed) or, with nothing to fall back to,
 * leaves the empty seed in place — the snapshots then simply ship without ADP.
 */

const OUTPUT_PATH = path.join(process.cwd(), "src", "data", "fantasyAdpData.generated.ts");

interface FantasyAdpDatasetRecord {
  entries: FantasyAdpEntry[];
  asOf: string | null;
  sampleSize: number | null;
  sourceUrl: string;
}

type FantasyAdpDataRecord = Record<ScoringFormat, FantasyAdpDatasetRecord>;

const SCORING_FORMATS: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];

// Minimum players a fresh ADP board must carry to be trusted. Fantasy Football
// Calculator's annual late-June mock-pool rollover briefly returns boards of
// 1-4 players; healthy boards run ~130-200. A board below this floor is treated
// as unusable so it can't overwrite a fuller previous board.
export const MIN_ADP_ENTRIES = 50;

export type AdpFormatResolution = {
  record: FantasyAdpDatasetRecord | null;
  source: "fresh" | "previous" | "thin-fresh" | "empty";
};

/**
 * Chooses the ADP record to keep for one scoring format. A fresh board is used
 * only when it clears the entry floor; a thin board or a failed fetch (null
 * fresh) falls back to the previous fuller board so good data is never
 * overwritten by a rollover blip. With no usable previous, a thin fresh board
 * is still better than nothing.
 */
export function resolveAdpFormat(
  fresh: FantasyAdpDatasetRecord | null,
  previous: FantasyAdpDatasetRecord | null,
  floor: number = MIN_ADP_ENTRIES
): AdpFormatResolution {
  if (fresh && fresh.entries.length >= floor) {
    return { record: fresh, source: "fresh" };
  }
  if (previous && previous.entries.length > 0) {
    return { record: previous, source: "previous" };
  }
  if (fresh) {
    return { record: fresh, source: "thin-fresh" };
  }
  return { record: null, source: "empty" };
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function atomicWriteFile(targetPath: string, contents: string) {
  const tempPath = `${targetPath}.tmp`;
  await writeFile(tempPath, contents, "utf8");
  await rename(tempPath, targetPath);
}

function renderGeneratedModule(data: FantasyAdpDataRecord, generatedAt: string): string {
  const serialized = JSON.stringify(data, null, 2);

  return `/**
 * Generated fantasy ADP data.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import type { ScoringFormat } from "@/types";

export const fantasyAdpDataGeneratedAt = ${JSON.stringify(generatedAt)};

export const fantasyAdpData: Record<
  ScoringFormat,
  {
    entries: FantasyAdpEntry[];
    asOf: string | null;
    sampleSize: number | null;
    sourceUrl: string;
  }
> = ${serialized};
`;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const season = getSnapshotSeason();
  const previous = readGeneratedSnapshot<FantasyAdpDataRecord>(OUTPUT_PATH, "fantasyAdpData");
  const dataset = {} as FantasyAdpDataRecord;
  const notes: string[] = [];

  // Resolve each scoring format independently: a failed or thin fetch for one
  // format keeps that format's previous board (with its older, disclosed asOf)
  // rather than discarding every format or overwriting good data with a blip.
  for (const scoringFormat of SCORING_FORMATS) {
    let fresh: FantasyAdpDatasetRecord | null = null;
    try {
      const board = await withRetry(`ADP ${scoringFormat}`, () =>
        fetchFantasyAdpBoard(scoringFormat, season)
      );
      fresh = {
        entries: board.entries,
        asOf: board.asOf,
        sampleSize: board.sampleSize,
        sourceUrl: board.sourceUrl,
      };
    } catch (error) {
      console.warn(
        `[adp] ${scoringFormat} fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const previousRecord = previous?.[scoringFormat] ?? null;
    const resolution = resolveAdpFormat(fresh, previousRecord);
    dataset[scoringFormat] = resolution.record ?? {
      entries: [],
      asOf: null,
      sampleSize: null,
      sourceUrl: previousRecord?.sourceUrl ?? fresh?.sourceUrl ?? "",
    };
    notes.push(
      `${scoringFormat}: ${dataset[scoringFormat].entries.length} entries (${resolution.source}, asOf ${
        dataset[scoringFormat].asOf ?? "unknown"
      }, ${dataset[scoringFormat].sampleSize ?? "?"} drafts)`
    );
    await pause(250);
  }

  const totalEntries = SCORING_FORMATS.reduce(
    (total, format) => total + (dataset[format]?.entries.length ?? 0),
    0
  );

  if (totalEntries === 0) {
    console.warn("[adp] no ADP data (fresh or previous); leaving the existing module untouched.");
    return;
  }

  await atomicWriteFile(OUTPUT_PATH, renderGeneratedModule(dataset, generatedAt));

  for (const note of notes) console.log(`[adp] ${note}`);
  console.log(`Wrote fantasy ADP data: ${OUTPUT_PATH}`);
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    // Unexpected failures (filesystem, programming errors) are still non-fatal:
    // ADP must never block the consensus refresh.
    console.warn(`[adp] unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(0);
  });
}
