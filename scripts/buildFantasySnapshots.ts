import { mkdir, rename, writeFile } from "fs/promises";
import path from "path";
import { buildFantasySnapshot } from "@/lib/fantasySnapshotBuilder";

const OUTPUT_DIR = path.join(process.cwd(), "public", "data", "fantasy");
const REVISION_OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "fantasySnapshotRevision.generated.ts"
);

function renderRevisionModule(revision: string): string {
  return `/**
 * Generated fantasy snapshot revision.
 * Do not edit manually. Regenerate with \`npm run update:fantasy\`.
 */

export const fantasySnapshotRevision = ${JSON.stringify(revision)};
`;
}

async function atomicWriteFile(targetPath: string, contents: string) {
  const tempPath = `${targetPath}.tmp`;
  await writeFile(tempPath, contents, "utf8");
  await rename(tempPath, targetPath);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(path.dirname(REVISION_OUTPUT_PATH), { recursive: true });

  const revision = new Date().toISOString();
  await atomicWriteFile(REVISION_OUTPUT_PATH, renderRevisionModule(revision));
  console.log(`Wrote fantasy snapshot revision: ${REVISION_OUTPUT_PATH}`);

  for (const scoring of ["ppr", "half_ppr", "standard"] as const) {
    const snapshot = buildFantasySnapshot(scoring);
    const outputPath = path.join(OUTPUT_DIR, `${scoring}.json`);
    await atomicWriteFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`Wrote fantasy snapshot: ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
