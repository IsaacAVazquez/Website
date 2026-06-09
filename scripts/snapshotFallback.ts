import { readFileSync } from "node:fs";

/**
 * Reads an already-generated snapshot back out of its `src/data/*.ts` file so a
 * failed refresh can fall back to the last good data instead of overwriting it
 * with nothing. The generated files are plain `export const <name>: <Type> = {…};`
 * object literals (emitted via JSON.stringify), so we slice out the literal and
 * parse it.
 *
 * Returns null when the file is missing or isn't in the generated shape yet
 * (e.g. a hand-authored seed). In that case the caller should surface the
 * original fetch error rather than mask it behind stale data that may not exist.
 *
 * Mirrors the inline reader in scripts/buildFormula1Snapshot.ts, shared so the
 * NFL, MLB, La Liga, and golf refreshers all behave the same way on failure.
 */
export function readGeneratedSnapshot<T>(
  filePath: string,
  exportName: string
): T | null {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const match = raw.match(
    new RegExp(`export const ${exportName}[^=]*=\\s*(\\{[\\s\\S]*\\});\\s*$`)
  );
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}
