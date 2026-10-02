import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The `teamSnapshots` map from a committed `src/data/*.json` snapshot, so a
 * per-team fetch failure keeps that team's previous data. Missing, unreadable,
 * or malformed files read as an empty map.
 */
export function readExistingTeamSnapshots<T>(filePath: string): Record<string, T> {
  try {
    const parsed = JSON.parse(readFileSync(resolve(process.cwd(), filePath), "utf8"));
    return parsed.teamSnapshots ?? {};
  } catch {
    return {};
  }
}
