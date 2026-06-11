import { rename, writeFile } from "fs/promises";
import path from "path";
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
  const dataset = {} as FantasyAdpDataRecord;

  try {
    for (const scoringFormat of SCORING_FORMATS) {
      const board = await withRetry(`ADP ${scoringFormat}`, () =>
        fetchFantasyAdpBoard(scoringFormat, season)
      );
      dataset[scoringFormat] = {
        entries: board.entries,
        asOf: board.asOf,
        sampleSize: board.sampleSize,
        sourceUrl: board.sourceUrl,
      };
      await pause(250);
    }
  } catch (error) {
    console.warn(
      `[adp] fetch failed: ${error instanceof Error ? error.message : String(error)}`
    );

    const previous = readGeneratedSnapshot<FantasyAdpDataRecord>(OUTPUT_PATH, "fantasyAdpData");
    const previousEntryCount = previous
      ? SCORING_FORMATS.reduce(
          (total, format) => total + (previous[format]?.entries?.length ?? 0),
          0
        )
      : 0;

    if (previousEntryCount > 0) {
      console.warn(
        `[adp] keeping previous ADP data (asOf ${previous?.PPR?.asOf ?? "unknown"}); snapshots will disclose the older as-of date.`
      );
    } else {
      console.warn("[adp] no previous ADP data to fall back to; snapshots will ship without ADP.");
    }

    // Leave the existing generated module (previous data or empty seed)
    // untouched and exit cleanly so the rest of the update chain proceeds.
    return;
  }

  await atomicWriteFile(OUTPUT_PATH, renderGeneratedModule(dataset, generatedAt));

  for (const scoringFormat of SCORING_FORMATS) {
    console.log(
      `${scoringFormat}: ${dataset[scoringFormat].entries.length} ADP entries (asOf ${
        dataset[scoringFormat].asOf ?? "unknown"
      }, ${dataset[scoringFormat].sampleSize ?? "?"} drafts)`
    );
  }

  console.log(`Wrote fantasy ADP data: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  // Unexpected failures (filesystem, programming errors) are still non-fatal:
  // ADP must never block the consensus refresh.
  console.warn(`[adp] unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(0);
});
