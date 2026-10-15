/** @jest-environment node */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { JobSearchFilesBusyError, readJobSearchFile, withJobSearchFileLock } from "../jobSearchFileLock";

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

  it("clears a lock left by a writer that stopped, once it is old enough to be orphaned", async () => {
    // A finished child process stands in for a writer killed while it held the lock.
    const stopped = spawnSync(process.execPath, ["-e", ""]).pid;
    fs.writeFileSync(lock, `${stopped}\n`);
    const past = new Date(Date.now() - 10_000);
    fs.utimesSync(lock, past, past);
    await expect(withJobSearchFileLock(() => "saved")).resolves.toBe("saved");
    expect(fs.existsSync(lock)).toBe(false);
  });

  it("keeps an old lock while its writer is still running", async () => {
    fs.writeFileSync(lock, `${process.pid}\n`);
    const past = new Date(Date.now() - 10_000);
    fs.utimesSync(lock, past, past);
    const write = jest.fn();
    await expect(withJobSearchFileLock(write)).rejects.toBeInstanceOf(JobSearchFilesBusyError);
    expect(write).not.toHaveBeenCalled();
    expect(fs.readFileSync(lock, "utf8")).toBe(`${process.pid}\n`);
  });
});

describe("reading a private job search file", () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), "job-read-test-"));
  });
  afterEach(() => {
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it("returns null for a missing file and the text of a valid one", () => {
    const file = path.join(folder, "pipeline.json");
    expect(readJobSearchFile(file)).toBeNull();
    fs.writeFileSync(file, '{"applications":[]}');
    expect(readJobSearchFile(file)).toBe('{"applications":[]}');
  });

  it("refuses a file a hand edit left invalid, naming it", () => {
    const file = path.join(folder, "candidates.json");
    fs.writeFileSync(file, '{"candidates":[],}');
    expect(() => readJobSearchFile(file)).toThrow(`${file} is not valid JSON`);
  });
});
