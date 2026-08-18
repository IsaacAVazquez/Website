/**
 * @jest-environment node
 */
import { readFileSync } from "fs";
import path from "path";

describe("fantasy workflow", () => {
  it("targets the published fantasy snapshot artifacts instead of legacy rb tiers output", () => {
    const workflowPath = path.join(process.cwd(), ".github", "workflows", "update-fantasy.yml");
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("npm run update:fantasy");
    expect(workflow).toContain("src/data/fantasyPositionData.generated.ts");
    expect(workflow).toContain("src/data/fantasyAdpData.generated.ts");
    expect(workflow).toContain("src/data/fantasySnapshotRevision.generated.ts");
    expect(workflow).toContain("public/data/fantasy/ppr.json");
    expect(workflow).toContain("public/data/fantasy/half_ppr.json");
    expect(workflow).toContain("public/data/fantasy/standard.json");
    expect(workflow).toContain("public/data/fantasy/best-ball.json");
    expect(workflow).toContain("adpMatches < 150");
    expect(workflow).toContain("superflexMatches < 150");
    expect(workflow).toContain("scheduleTeams < 30");
    expect(workflow).toContain("generatedAgeDays > 10");
    expect(workflow).toContain("FANTASYPROS_SOURCE: public-html");
    expect(workflow).not.toContain("secrets.FANTASYPROS_API_KEY");
    expect(workflow).not.toContain("public/fantasy/rb_current.json");
  });

  it("commits redraft and best ball as independent lanes", () => {
    const workflowPath = path.join(process.cwd(), ".github", "workflows", "update-fantasy.yml");
    const workflow = readFileSync(workflowPath, "utf8");

    // Redraft and best ball come from different upstream sources. They used to
    // share one build step and one commit list, so a best-ball-only outage
    // skipped the commit for fully validated redraft rankings.
    expect(workflow).toContain("npm run update:fantasy:redraft");
    expect(workflow).toContain("npm run update:fantasy:best-ball");
    expect(workflow).toContain("id: build_best_ball");
    expect(workflow).toContain("id: verify_best_ball");

    const redraftCommit = workflow.match(
      /- name: Commit and push snapshot updates[\s\S]*?(?=\n\s+#|\n\s+- name:)/
    )?.[0];
    expect(redraftCommit).toBeDefined();
    expect(redraftCommit).toContain("public/data/fantasy/ppr.json");
    // The whole point: best ball must not ride along on the redraft commit.
    expect(redraftCommit).not.toContain("best-ball.json");

    const bestBallCommit = workflow.match(
      /- name: Commit and push best ball snapshot[\s\S]*?(?=\n\s+#|\n\s+- name:)/
    )?.[0];
    expect(bestBallCommit).toBeDefined();
    expect(bestBallCommit).toContain("public/data/fantasy/best-ball.json");
    expect(bestBallCommit).not.toContain("public/data/fantasy/ppr.json");
  });

  it("reports soft-lane failures so a skipped lane still turns the run red", () => {
    const workflowPath = path.join(process.cwd(), ".github", "workflows", "update-fantasy.yml");
    const workflow = readFileSync(workflowPath, "utf8");

    // continue-on-error keeps a soft lane from skipping the other lane's commit,
    // so something has to fail the job afterwards. Without this the run would go
    // green and "Close resolved failure issues" would close a real incident.
    expect(workflow).toContain("- name: Report soft-lane failures");
    expect(workflow).toContain("steps.build_best_ball.outcome == 'failure'");
    expect(workflow).toContain("steps.verify_best_ball.outcome == 'failure'");
    expect(workflow).toContain("steps.adp_health.outputs.adp_dark == 'true'");
  });

  it("gates redraft ADP on age, not only coverage", () => {
    const workflowPath = path.join(process.cwd(), ".github", "workflows", "update-fantasy.yml");
    const workflow = readFileSync(workflowPath, "utf8");

    // resolveAdpFormat retains the previous board with no maximum age, so a
    // multi-day outage used to produce a green run while the site hid every ADP
    // surface past four days in draft season.
    expect(workflow).toContain("id: adp_health");
    expect(workflow).toContain("const ageWarnLimit = inDraftSeason ? 4 : 14");
    expect(workflow).toContain("const ageFailLimit = inDraftSeason ? 14 : 45");
    expect(workflow).toContain("adp_dark=");
  });
});
