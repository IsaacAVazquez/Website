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
  });

  it("stages the public investments dataset path before committing", () => {
    expect(workflow).toContain("git add public/data/investments");
  });
});
