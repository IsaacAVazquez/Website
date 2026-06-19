/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

describe("update-investments workflow contract", () => {
  const workflow = fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", "update-investments.yml"),
    "utf8"
  );

  it("keeps the Mon+Thu 22:15 UTC schedule and manual trigger", () => {
    // Schedule is intentionally Mon + Thu (not weekdays) to stay under the
    // GitHub Actions spending budget while still refreshing within a 3-day
    // window. See the comment in update-investments.yml.
    expect(workflow).toContain('cron: "15 22 * * 1,4"');
    expect(workflow).toContain("workflow_dispatch:");
  });

  it("runs the investments refresh command", () => {
    expect(workflow).toContain("run: npm run update:investments");
  });

  it("passes the public snapshots and raw dataset paths to the shared commit helper", () => {
    // Raw per-section fetch output lives outside public/ so it never ships
    // with a deploy; both locations must be staged for a refresh commit.
    expect(workflow).toContain("bash scripts/ci/commit-and-push-snapshot.sh");
    expect(workflow).toContain("public/data/investments");
    expect(workflow).toContain("data/investments-raw");
  });
});
