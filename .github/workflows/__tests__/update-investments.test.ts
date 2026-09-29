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

  it("runs the morning after each trading day, once the dataset has published", () => {
    // The dataset lands between 05:09 and 07:32 UTC. At 22:15 the evening run
    // on Monday 2026-09-14 fetched prices dated the Friday before.
    expect(workflow).toContain('cron: "30 8 * * 2-6"');
    expect(workflow).toContain("workflow_dispatch:");
  });

  it("runs the investments refresh command", () => {
    expect(workflow).toContain("run: npm run update:investments");
    expect(workflow).toContain("pip install -r scripts/requirements-investments.txt");
    expect(workflow).toContain("hashFiles('scripts/requirements-investments.txt')");
    const requirements = fs.readFileSync(
      path.join(process.cwd(), "scripts", "requirements-investments.txt"),
      "utf8"
    );
    expect(requirements).toMatch(/^defeatbeta-api==\d+\.\d+\.\d+$/m);
  });

  it("gates on the dates of the prices and not on the time of the run", () => {
    expect(workflow).toContain("recentPriceShare < 0.95");
    expect(workflow).toContain("priceHealth.recentCount");
  });

  it("distinguishes fresh results from stale recoveries", () => {
    expect(workflow).toContain("freshCount === 0");
    expect(workflow).toContain("freshCount + staleCount !== successCount");
    expect(workflow).toContain("staleRatio > 0.8");
    expect(workflow).toContain('MAX_PRICE_AGE_DAYS: "7"');
    expect(workflow).toContain("delayedFreshSymbols.length > 0");
  });

  it("reports partial retention without gating on it", () => {
    // partialCount is sticky across the budget-limited rotation: every freshly
    // fetched symbol lands partial, and the flag carries forward on the symbols
    // a run did not fetch, so the count ratchets toward the full universe no
    // matter how healthy the provider is. A ratio gate on it went from 37/151 to
    // 67/151 over two runs in July 2026, crossed 0.5, and then blocked every
    // scheduled commit for 26 days. Provider outages are caught by the
    // price-history checks instead.
    expect(workflow).toContain("Symbols carrying one or more retained sections");
    expect(workflow).not.toContain("partialRatio > 0.5");
    expect(workflow).not.toContain("likely a systemic provider outage");
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
