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
    expect(workflow).not.toContain("public/fantasy/rb_current.json");
  });
});
