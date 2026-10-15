/** @jest-environment node */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { JobSearchFilesBusyError, withJobSearchFileLock } from "../jobSearchFileLock";

describe("private job search file locking", () => {
  let folder: string;
  let lock: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), "job-lock-test-"));
    jest.spyOn(process, "cwd").mockReturnValue(folder);
    const privateFolder = path.join(folder, "private/job-search");
    fs.mkdirSync(privateFolder, { recursive: true });
    lock = path.join(privateFolder, ".write.lock");
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it("releases a failed write so another writer can proceed", async () => {
    await expect(withJobSearchFileLock(() => { throw new Error("write failed"); })).rejects.toThrow("write failed");
    expect(fs.existsSync(lock)).toBe(false);
    await expect(withJobSearchFileLock(() => "next write")).resolves.toBe("next write");
    expect(fs.existsSync(lock)).toBe(false);
  });

  it("waits for a competing writer to release the lock", async () => {
    fs.writeFileSync(lock, "other writer");
    const write = jest.fn(() => "saved");
    const pending = withJobSearchFileLock(write);
    expect(write).not.toHaveBeenCalled();
    fs.unlinkSync(lock);
    await expect(pending).resolves.toBe("saved");
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("fails without writing or deleting another writer's lock when it remains busy", async () => {
    fs.writeFileSync(lock, "other writer");
    const write = jest.fn();
    await expect(withJobSearchFileLock(write)).rejects.toBeInstanceOf(JobSearchFilesBusyError);
    expect(write).not.toHaveBeenCalled();
    expect(fs.readFileSync(lock, "utf8")).toBe("other writer");
  });
});
