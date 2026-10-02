import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildFormula1SnapshotData } from "../src/lib/formula1Data";
import type { Formula1MeetingSummary, Formula1Snapshot } from "../src/types/formula1";
import { readGeneratedSnapshot, writeFileAtomic } from "./snapshotFallback";

export interface BuildFormula1SnapshotOptions {
  projectRoot?: string;
  logger?: Pick<Console, "log" | "error">;
  now?: Date;
}

export interface BuildFormula1SnapshotResult {
  snapshotPath: string;
  snapshot: Formula1Snapshot;
  liveLock?: boolean;
}

const SNAPSHOT_PATH_SEGMENTS = ["src", "data", "formula1Snapshot.ts"] as const;
// OpenF1 closes the API to anonymous callers from 30 minutes before a session
// until 30 minutes after it. The extra 15 covers a session that overruns.
const LIVE_SESSION_MARGIN_MS = 45 * 60 * 1_000;

export function isWithinLiveSessionWindow(snapshot: Formula1Snapshot | null, now: Date): boolean {
  const time = now.getTime();

  return Boolean(
    snapshot?.meetings.some((meeting) =>
      meeting.sessions.some(
        (session) =>
          time >= new Date(session.startAt).getTime() - LIVE_SESSION_MARGIN_MS &&
          time <= new Date(session.endAt).getTime() + LIVE_SESSION_MARGIN_MS
      )
    )
  );
}

function carryPublishedClassification(
  meeting: Formula1MeetingSummary,
  existingSnapshot: Formula1Snapshot | null
): Formula1MeetingSummary {
  const published = existingSnapshot?.meetings.find((existing) => existing.key === meeting.key);
  if (
    meeting.status !== "completed" ||
    meeting.classification.length > 0 ||
    !published ||
    published.classification.length === 0
  ) {
    return meeting;
  }

  return {
    ...meeting,
    classification: published.classification,
    podium: published.podium,
    resultPublished: published.resultPublished,
  };
}

function hasSnapshotContents(snapshot: Formula1Snapshot | null): boolean {
  return Boolean(snapshot && snapshot.meetings.length > 0);
}

function hasStandings(snapshot: Formula1Snapshot | null): boolean {
  return Boolean(
    snapshot &&
      (snapshot.driverStandings.length > 0 ||
        snapshot.constructorStandings.length > 0)
  );
}

export async function buildFormula1Snapshot(
  options: BuildFormula1SnapshotOptions = {}
): Promise<BuildFormula1SnapshotResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const logger = options.logger ?? console;
  const now = options.now ?? new Date();
  const snapshotPath = path.join(projectRoot, ...SNAPSHOT_PATH_SEGMENTS);
  const existingSnapshot = readGeneratedSnapshot<Formula1Snapshot>(snapshotPath, "formula1Snapshot");

  let snapshot: Formula1Snapshot;

  try {
    snapshot = await buildFormula1SnapshotData({ now });
  } catch (error) {
    if (hasSnapshotContents(existingSnapshot)) {
      const status = (error as { status?: unknown } | null)?.status;
      const cause = `${typeof status === "number" ? `status ${status}` : "no status"}, ${
        error instanceof Error ? error.message : String(error)
      }`;

      if (
        (status === 401 || status === 403) &&
        isWithinLiveSessionWindow(existingSnapshot, now)
      ) {
        logger.log(
          `OpenF1 is locked for a live session (${cause}). Keeping the existing snapshot.`
        );
        return {
          snapshotPath,
          snapshot: existingSnapshot as Formula1Snapshot,
          liveLock: true,
        };
      }

      logger.log(`Formula 1 snapshot refresh failed (${cause}). Keeping the existing snapshot.`);
      return {
        snapshotPath,
        snapshot: existingSnapshot as Formula1Snapshot,
      };
    }

    throw error;
  }

  // A successful build with no meetings (off-season / schema drift) must not
  // overwrite the good committed snapshot. Fall back to the existing data.
  if (!hasSnapshotContents(snapshot) && hasSnapshotContents(existingSnapshot)) {
    logger.log("Formula 1 snapshot build returned no meetings. Keeping the existing snapshot.");
    return {
      snapshotPath,
      snapshot: existingSnapshot as Formula1Snapshot,
    };
  }

  // Season rollover. From January 1 the build resolves the new season as soon as
  // OpenF1 lists a single meeting for it, but no race has run, so
  // standingsMeetingKey is null and both standings arrays come back empty. The
  // meetings check above cannot see that, so the completed season's final tables
  // would be overwritten by empty ones and the page would show empty standings
  // for roughly two months. Keeping the whole previous snapshot rather than
  // grafting the old standings onto the new calendar, because the snapshot
  // carries `season` and a mixed artifact would report one season's number
  // against another season's results. The new season takes over wholesale as
  // soon as its first race produces standings.
  if (!hasStandings(snapshot) && hasStandings(existingSnapshot)) {
    logger.log(
      `Formula 1 build for season ${snapshot.season} returned no standings. Keeping the existing season ${
        (existingSnapshot as Formula1Snapshot).season
      } snapshot until the new season produces results.`
    );
    return {
      snapshotPath,
      snapshot: existingSnapshot as Formula1Snapshot,
    };
  }

  // OpenF1 answers a result it cannot find with a 404, which the build reads as
  // not published yet, so one bad response would blank a finished round.
  const meetings = snapshot.meetings.map((meeting) =>
    carryPublishedClassification(meeting, existingSnapshot)
  );
  const carried = meetings.filter((meeting, index) => meeting !== snapshot.meetings[index]);
  if (carried.length > 0) {
    logger.log(
      `Formula 1 build returned no classification for ${carried
        .map((meeting) => meeting.name)
        .join(", ")}. Keeping the published classification.`
    );
    snapshot = {
      ...snapshot,
      meetings,
      lastCompletedMeeting:
        snapshot.lastCompletedMeeting &&
        carryPublishedClassification(snapshot.lastCompletedMeeting, existingSnapshot),
    };
  }

  const fileContents = `import type { Formula1Snapshot } from "@/types/formula1";

// Generated by scripts/buildFormula1Snapshot.ts.
export const formula1Snapshot: Formula1Snapshot = ${JSON.stringify(snapshot, null, 2)};
`;

  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  writeFileAtomic(snapshotPath, fileContents);

  logger.log(
    `Formula 1 snapshot written: ${snapshot.meetings.length} meetings, ${snapshot.driverStandings.length} drivers, ${snapshot.constructorStandings.length} constructors.`
  );

  return {
    snapshotPath,
    snapshot,
  };
}

export async function main(options: BuildFormula1SnapshotOptions = {}) {
  const result = await buildFormula1Snapshot(options);

  // The workflow reads this to skip the freshness gate, which a locked API cannot pass.
  if (result.liveLock && process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, "live_lock=true\n", "utf8");
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error("Failed to build Formula 1 snapshot:", error);
    process.exitCode = 1;
  });
}
