import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { buildFantasySnapshot } from "@/lib/fantasySnapshotBuilder";

const OUTPUT_DIR = path.join(process.cwd(), "public", "data", "fantasy");

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const scoring of ["ppr", "half_ppr", "standard"] as const) {
    const snapshot = buildFantasySnapshot(scoring);
    const outputPath = path.join(OUTPUT_DIR, `${scoring}.json`);
    await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    console.log(`Wrote fantasy snapshot: ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
