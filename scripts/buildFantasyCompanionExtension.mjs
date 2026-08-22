import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const extensionDist = path.join(projectRoot, "extension", "dist");
const snapshotSource = path.join(projectRoot, "public", "data", "fantasy");
const snapshotOutput = path.join(extensionDist, "data", "fantasy");

const snapshots = [
  { file: "ppr.json", kind: "redraft", scoring: "PPR" },
  { file: "half_ppr.json", kind: "redraft", scoring: "HALF_PPR" },
  { file: "standard.json", kind: "redraft", scoring: "STANDARD" },
  { file: "best-ball.json", kind: "best-ball" },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateCommon(snapshot, file) {
  assert(
    snapshot && typeof snapshot === "object" && !Array.isArray(snapshot),
    `${file} must contain a JSON object`,
  );
  assert(
    Number.isInteger(snapshot.schemaVersion) && snapshot.schemaVersion > 0,
    `${file} has an invalid schemaVersion`,
  );
  assert(
    Number.isInteger(snapshot.season) && snapshot.season >= 2020,
    `${file} has an invalid season`,
  );
  assert(
    typeof snapshot.generatedAt === "string" &&
      Number.isFinite(Date.parse(snapshot.generatedAt)),
    `${file} has an invalid generatedAt value`,
  );
}

function validateRedraft(snapshot, file, scoring) {
  assert(
    snapshot.scoringFormat === scoring,
    `${file} must use the ${scoring} scoring format`,
  );
  assert(
    Array.isArray(snapshot.overall) && snapshot.overall.length > 0,
    `${file} must contain an overall player board`,
  );
  assert(
    snapshot.positions && typeof snapshot.positions === "object",
    `${file} must contain position boards`,
  );

  for (const position of ["QB", "RB", "WR", "TE", "FLEX", "K", "DST"]) {
    assert(
      Array.isArray(snapshot.positions[position]) &&
        snapshot.positions[position].length > 0,
      `${file} must contain a non-empty ${position} board`,
    );
  }
}

function validateBestBall(snapshot, file) {
  assert(
    Array.isArray(snapshot.players) && snapshot.players.length > 0,
    `${file} must contain a player board`,
  );
  assert(
    snapshot.week17Opponents && typeof snapshot.week17Opponents === "object",
    `${file} must contain Week 17 opponents`,
  );
}

async function readAndCompact({ file, kind, scoring }) {
  const sourcePath = path.join(snapshotSource, file);
  let snapshot;

  try {
    snapshot = JSON.parse(await readFile(sourcePath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read valid JSON from ${sourcePath}`, {
      cause: error,
    });
  }

  validateCommon(snapshot, file);

  if (kind === "redraft") {
    validateRedraft(snapshot, file, scoring);
  } else {
    validateBestBall(snapshot, file);
  }

  return {
    file,
    contents: `${JSON.stringify(snapshot)}\n`,
  };
}

async function main() {
  try {
    await access(extensionDist);
  } catch (error) {
    throw new Error(
      `The Vite build output is missing at ${extensionDist}. Run the extension build before this packaging step.`,
      { cause: error },
    );
  }

  const compactedSnapshots = await Promise.all(snapshots.map(readAndCompact));
  await mkdir(snapshotOutput, { recursive: true });

  await Promise.all(
    compactedSnapshots.map(({ file, contents }) =>
      writeFile(path.join(snapshotOutput, file), contents, "utf8"),
    ),
  );

  for (const { file, contents } of compactedSnapshots) {
    const sizeKb = (Buffer.byteLength(contents) / 1024).toFixed(1);
    console.log(`Bundled ${file} (${sizeKb} KB)`);
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.cause instanceof Error) {
    console.error(error.cause.message);
  }
  process.exitCode = 1;
});
