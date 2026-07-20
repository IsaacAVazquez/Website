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

  it("keeps the weekday 22:15 UTC schedule and manual trigger", () => {
    expect(workflow).toContain('cron: "15 22 * * 1-5"');
    expect(workflow).toContain("workflow_dispatch:");
  });

  it("runs the investments refresh command", () => {
    expect(workflow).toContain("run: npm run update:investments");
    expect(workflow).toContain("defeatbeta-api==0.0.47");
  });

  it("distinguishes fresh results from stale recoveries", () => {
    expect(workflow).toContain("freshCount === 0");
    expect(workflow).toContain("freshCount + staleCount !== successCount");
    expect(workflow).toContain("staleRatio > 0.8");
    expect(workflow).toContain("partialRatio > 0.5");
    expect(workflow).toContain('MAX_PRICE_AGE_DAYS: "7"');
    expect(workflow).toContain("delayedFreshSymbols.length > 0");
  });

  it("commits only deployable snapshots, not raw provider responses", () => {
    expect(workflow).toContain("bash scripts/ci/commit-and-push-snapshot.sh");
    expect(workflow).toContain("public/data/investments");
    expect(workflow).not.toContain("data/investments-raw");
  });

  it("keeps stale symbols on their prior snapshot timestamps", () => {
    const builder = fs.readFileSync(
      path.join(process.cwd(), "scripts", "buildInvestmentsSnapshots.ts"),
      "utf8"
    );

    expect(builder).toContain("staleSymbols.has");
    expect(builder).toContain("keeping the existing snapshot and freshness metadata");
  });
});
