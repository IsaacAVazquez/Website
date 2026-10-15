import fs from "node:fs";
import path from "node:path";

// A live writer holds the lock only for a synchronous read and replace, so a
// lock this old whose writer has stopped was left by a process killed holding it.
const ORPHANED_LOCK_AGE_MS = 2_000;

export class JobSearchFilesBusyError extends Error {
  constructor(lock: string) {
    let owner = "unknown";
    try {
      const pid = Number(fs.readFileSync(lock, "utf8").trim());
      if (Number.isSafeInteger(pid) && pid > 0) owner = `PID ${pid}`;
    } catch { /* The writer may have released the lock. */ }
    super(`Job search files are busy (${owner}, ${lock}). Retry in a few seconds.`);
  }
}

/** Removes a lock old enough to be orphaned whose writer has stopped or never recorded itself. */
function removeOrphanedLock(lock: string): boolean {
  try {
    if (Date.now() - fs.statSync(lock).mtimeMs < ORPHANED_LOCK_AGE_MS) return false;
    const pid = Number(fs.readFileSync(lock, "utf8").trim());
    if (Number.isSafeInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        return false;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") return false;
      }
    }
    fs.unlinkSync(lock);
    return true;
  } catch {
    return false; // Its writer released it, or another writer removed it first.
  }
}

/**
 * Reads a private file, or null when it is missing. A file that is not valid
 * JSON throws instead, since the parsers would read it as empty and the next
 * save would replace whatever a hand edit left in it.
 */
export function readJobSearchFile(file: string): string | null {
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  try {
    JSON.parse(raw);
  } catch {
    throw new Error(`${file} is not valid JSON, so it was left untouched. Fix it by hand, then retry.`);
  }
  return raw;
}

/** The callback is synchronous; no network work runs while the lock is held. */
export async function withJobSearchFileLock<T>(write: () => T): Promise<T> {
  const folder = path.join(process.cwd(), "private/job-search");
  fs.mkdirSync(folder, { recursive: true });
  const lock = path.join(folder, ".write.lock");
  let descriptor: number | undefined;
  for (let attempt = 0; descriptor === undefined; attempt += 1) {
    try {
      descriptor = fs.openSync(lock, "wx");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (removeOrphanedLock(lock)) continue;
      if (attempt >= 19) throw new JobSearchFilesBusyError(lock);
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  try {
    fs.writeFileSync(descriptor!, `${process.pid}\n`);
    return write();
  } finally {
    fs.closeSync(descriptor!);
    fs.unlinkSync(lock);
  }
}
