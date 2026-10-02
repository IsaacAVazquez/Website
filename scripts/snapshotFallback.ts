import { readFileSync, renameSync, writeFileSync } from "node:fs";

/**
 * Writes to a .tmp file and renames it over the target. A rename is atomic on
 * POSIX, so a process killed mid-write never leaves a half-written snapshot.
 */
export function writeFileAtomic(filePath: string, content: string): void {
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, content, "utf8");
  renameSync(tmp, filePath);
}

/**
 * Runs a snapshot build and returns the result, or returns null after keeping
 * the committed snapshot when the build throws or comes back unusable (an
 * outage, an off-season rollover, or schema drift) and the committed one is
 * still usable. With nothing usable committed, a throw still throws and an
 * unusable build is returned so the caller writes it.
 */
export async function buildOrKeepExisting<T>(
  filePath: string,
  exportName: string,
  label: string,
  build: () => Promise<T>,
  isUsable: (snapshot: T) => boolean
): Promise<T | null> {
  const existingIsUsable = () => {
    const existing = readGeneratedSnapshot<T>(filePath, exportName);
    return existing !== null && isUsable(existing);
  };

  let snapshot: T;
  try {
    snapshot = await build();
  } catch (error) {
    if (!existingIsUsable()) throw error;
    console.warn(`${label} snapshot refresh failed; keeping the existing snapshot.`, error);
    return null;
  }

  if (!isUsable(snapshot) && existingIsUsable()) {
    console.warn(`${label} snapshot build came back empty; keeping the existing snapshot.`);
    return null;
  }
  return snapshot;
}

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
