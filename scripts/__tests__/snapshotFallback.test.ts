import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { buildOrKeepExisting } from "../snapshotFallback";

describe("buildOrKeepExisting", () => {
  it("surfaces the build error when the committed file cannot be read", async () => {
    // A directory makes the read fail with EISDIR, which readGeneratedSnapshot rethrows.
    const unreadable = mkdtempSync(`${tmpdir()}/snapshot-fallback-`);
    await expect(
      buildOrKeepExisting(
        unreadable,
        "snapshot",
        "Test",
        () => Promise.reject(new Error("upstream outage")),
        () => true
      )
    ).rejects.toThrow("upstream outage");
  });
});
