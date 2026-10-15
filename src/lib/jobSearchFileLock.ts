import fs from "node:fs";
import path from "node:path";

export class JobSearchFilesBusyError extends Error {
  constructor(lock: string) {
    let owner = "unknown";
    try {
      const pid = Number(fs.readFileSync(lock, "utf8").trim());
      if (Number.isSafeInteger(pid) && pid > 0) {
        owner = `PID ${pid}`;
        try { process.kill(pid, 0); } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ESRCH") owner += " has stopped";
        }
      }
    } catch { /* The writer may have released the lock. */ }
    super(`Job search files are busy (${owner}). Retry after the write finishes. If all job search writers have stopped, remove ${lock} and retry.`);
  }
}

/** The callback is synchronous; no network work runs while the lock is held. */
export async function withJobSearchFileLock<T>(write: () => T): Promise<T> {
  const folder = path.join(process.cwd(), "private/job-search");
  fs.mkdirSync(folder, { recursive: true });
  const lock = path.join(folder, ".write.lock");
  let descriptor: number | undefined;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      descriptor = fs.openSync(lock, "wx");
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (attempt === 19) throw new JobSearchFilesBusyError(lock);
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
