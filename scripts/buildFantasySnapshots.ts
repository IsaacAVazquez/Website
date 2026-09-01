import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendFantasyRankHistory,
  createEmptyFantasyRankHistory,
  decodeFantasyRankHistory,
  stampFantasyRankMovement,
} from "@/lib/fantasyRankHistory";
import { buildFantasySnapshot } from "@/lib/fantasySnapshotBuilder";
import type { FantasyRouteScoring } from "@/lib/fantasy";

const SCORING_FORMATS = ["ppr", "half_ppr", "standard"] as const;
const SNAPSHOT_OUTPUT_PATH_SEGMENTS = ["public", "data", "fantasy"] as const;
const REVISION_OUTPUT_PATH_SEGMENTS = [
  "src",
  "data",
  "fantasySnapshotRevision.generated.ts",
] as const;
const RANK_HISTORY_OUTPUT_PATH_SEGMENTS = [
  "src",
  "data",
  "fantasyRankHistory.generated.json",
] as const;

type FantasySnapshotBuilder = typeof buildFantasySnapshot;

export interface BuildFantasySnapshotsOptions {
  projectRoot?: string;
  revision?: string;
  buildSnapshot?: FantasySnapshotBuilder;
  logger?: Pick<Console, "log">;
}

export interface BuildFantasySnapshotsResult {
  revision: string;
  snapshotPaths: Record<FantasyRouteScoring, string>;
  revisionOutputPath: string;
}

interface StagedOutput {
  targetPath: string;
  tempPath: string;
  contents: string;
}

function renderRevisionModule(revision: string): string {
  return `/**
 * Generated fantasy snapshot revision.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

export const fantasySnapshotRevision = ${JSON.stringify(revision)};
`;
}

export async function buildFantasySnapshots(
  options: BuildFantasySnapshotsOptions = {}
): Promise<BuildFantasySnapshotsResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const buildSnapshot = options.buildSnapshot ?? buildFantasySnapshot;
  const logger = options.logger ?? console;
  const revision = options.revision ?? new Date().toISOString();
  const outputDir = path.join(projectRoot, ...SNAPSHOT_OUTPUT_PATH_SEGMENTS);
  const revisionOutputPath = path.join(projectRoot, ...REVISION_OUTPUT_PATH_SEGMENTS);
  const snapshotPaths: Record<FantasyRouteScoring, string> = {
    ppr: path.join(outputDir, "ppr.json"),
    half_ppr: path.join(outputDir, "half_ppr.json"),
    standard: path.join(outputDir, "standard.json"),
  };

  // The committed rank history is the builder's own memory: one dated ECR/ADP
  // reading per player per run, trimmed to the movement window. A missing or
  // malformed file restarts the window rather than failing the build.
  const historyOutputPath = path.join(projectRoot, ...RANK_HISTORY_OUTPUT_PATH_SEGMENTS);
  let rankHistory = createEmptyFantasyRankHistory();
  try {
    rankHistory = decodeFantasyRankHistory(JSON.parse(await readFile(historyOutputPath, "utf8")));
  } catch {
    // First run, or an unreadable file; movement returns as readings accumulate.
  }
  const historyDate = new Date().toISOString().slice(0, 10);

  // Finish every build and serialization before creating directories or staging
  // files, so a failure in any format leaves the published set and its shared
  // revision untouched. This covers the build and serialization phase only —
  // see the rename loop below for what the publish phase actually guarantees.
  const serializedSnapshots = SCORING_FORMATS.map((scoring) => {
    const snapshot = buildSnapshot(scoring);
    const overallPlayers = Array.isArray(snapshot.overall) ? snapshot.overall : [];
    rankHistory = appendFantasyRankHistory(rankHistory, scoring, historyDate, overallPlayers);
    // The flex slice copies the overall players into new objects, so it needs
    // its own stamp on the same overall-scale history; position boards rank on
    // their own scale and stay out.
    const flexPlayers = Array.isArray(snapshot.positions?.FLEX) ? snapshot.positions.FLEX : [];
    stampFantasyRankMovement(overallPlayers, rankHistory, scoring, historyDate);
    stampFantasyRankMovement(flexPlayers, rankHistory, scoring, historyDate);
    return { scoring, contents: `${JSON.stringify(snapshot)}\n` };
  });
  const revisionContents = renderRevisionModule(revision);

  const tempSuffix = `${process.pid}-${randomUUID()}`;
  const snapshotOutputs: StagedOutput[] = serializedSnapshots.map(({ scoring, contents }) => {
    const targetPath = snapshotPaths[scoring];
    return {
      targetPath,
      tempPath: `${targetPath}.tmp-${tempSuffix}`,
      contents,
    };
  });
  const historyOutput: StagedOutput = {
    targetPath: historyOutputPath,
    tempPath: `${historyOutputPath}.tmp-${tempSuffix}`,
    contents: `${JSON.stringify(rankHistory)}\n`,
  };
  const revisionOutput: StagedOutput = {
    targetPath: revisionOutputPath,
    tempPath: `${revisionOutputPath}.tmp-${tempSuffix}`,
    contents: revisionContents,
  };
  const stagedOutputs = [...snapshotOutputs, historyOutput, revisionOutput];

  try {
    await mkdir(outputDir, { recursive: true });
    await mkdir(path.dirname(revisionOutputPath), { recursive: true });

    for (const output of stagedOutputs) {
      await writeFile(output.tempPath, output.contents, "utf8");
    }

    // These renames are sequential, so a failure partway through can leave one
    // scoring file new and the others stale. There is no cross-file atomic
    // rename, so the revision marker is the guard instead: it moves only after
    // all three succeed, and consumers key on it, so a partial set is never
    // announced as published. The catch below removes leftover temp files; it
    // cannot un-rename, and it does not need to.
    for (const output of snapshotOutputs) {
      await rename(output.tempPath, output.targetPath);
    }
    await rename(historyOutput.tempPath, historyOutput.targetPath);
    await rename(revisionOutput.tempPath, revisionOutput.targetPath);
  } catch (error) {
    await Promise.allSettled(
      stagedOutputs.map((output) => rm(output.tempPath, { force: true }))
    );
    throw error;
  }

  for (const scoring of SCORING_FORMATS) {
    logger.log(`Wrote fantasy snapshot: ${snapshotPaths[scoring]}`);
  }
  logger.log(`Wrote fantasy rank history: ${historyOutputPath}`);
  logger.log(`Wrote fantasy snapshot revision: ${revisionOutputPath}`);

  return {
    revision,
    snapshotPaths,
    revisionOutputPath,
  };
}

async function main() {
  await buildFantasySnapshots();
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
