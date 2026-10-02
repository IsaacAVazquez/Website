import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildOrKeepExisting, readGeneratedSnapshot } from "../snapshotFallback";

describe("readGeneratedSnapshot", () => {
  const dir = mkdtempSync(`${tmpdir()}/snapshot-read-`);

  it("parses a committed JSON snapshot", () => {
    writeFileSync(join(dir, "ok.json"), '{"generatedAt":"2026-01-01T00:00:00.000Z"}\n');
    expect(readGeneratedSnapshot(join(dir, "ok.json"))).toEqual({
      generatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns null for a missing file", () => {
    expect(readGeneratedSnapshot(join(dir, "missing.json"))).toBeNull();
  });

  it("returns null for a file that is not JSON", () => {
    writeFileSync(join(dir, "bad.json"), "export const x = {};\n");
    expect(readGeneratedSnapshot(join(dir, "bad.json"))).toBeNull();
  });
});

describe("buildOrKeepExisting", () => {
  it("surfaces the build error when the committed file cannot be read", async () => {
    // A directory makes the read fail with EISDIR, which readGeneratedSnapshot rethrows.
    const unreadable = mkdtempSync(`${tmpdir()}/snapshot-fallback-`);
    await expect(
      buildOrKeepExisting(
        unreadable,
        "Test",
        () => Promise.reject(new Error("upstream outage")),
        () => true
      )
    ).rejects.toThrow("upstream outage");
  });
});
