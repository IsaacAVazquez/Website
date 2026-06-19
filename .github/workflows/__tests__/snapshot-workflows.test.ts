/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

const workflowsDir = path.join(process.cwd(), ".github", "workflows");
const workflowFiles = fs
  .readdirSync(workflowsDir)
  .filter((file) => file.endsWith(".yml"))
  .map((file) => path.join(workflowsDir, file));

const updateWorkflowFiles = workflowFiles.filter((file) =>
  path.basename(file).startsWith("update-")
);

describe("snapshot refresh workflow infrastructure", () => {
  it("routes automated snapshot commits through the shared helper", () => {
    expect(updateWorkflowFiles.length).toBeGreaterThan(0);

    for (const workflowPath of updateWorkflowFiles) {
      const workflow = fs.readFileSync(workflowPath, "utf8");
      expect(workflow).toContain("bash scripts/ci/commit-and-push-snapshot.sh");
      expect(workflow).not.toMatch(/git push origin HEAD:main/);
      expect(workflow).not.toMatch(/git rebase origin\/main/);
    }
  });

  it("keeps inline snapshot pushes out of every workflow, not just update-*", () => {
    // Defense-in-depth: the shared helper is the single push path in the repo.
    // The check above only globs update-*.yml, so a future workflow under a
    // different name that reintroduced an inline `git push origin HEAD:main`
    // would bypass the retry/rebase logic unnoticed. Forbid it everywhere.
    for (const workflowPath of workflowFiles) {
      const workflow = fs.readFileSync(workflowPath, "utf8");
      expect(workflow).not.toMatch(/git push origin HEAD:main/);
    }
  });

  it("keeps push retries and autostash rebase behavior in one script", () => {
    const helper = fs.readFileSync(
      path.join(process.cwd(), "scripts", "ci", "commit-and-push-snapshot.sh"),
      "utf8"
    );

    expect(helper).toContain("git add -- \"$@\"");
    expect(helper).toContain("git push origin HEAD:main");
    expect(helper).toContain("git rebase --autostash origin/main");
    expect(helper).toContain("SNAPSHOT_PUSH_ATTEMPTS");
  });

  it("uses modern action majors across workflows", () => {
    const bannedPins = [
      "actions/checkout@v4",
      "actions/setup-node@v4",
      "actions/setup-python@v5",
      "actions/cache@v4",
      "actions/cache/restore@v4",
      "actions/cache/save@v4",
      "actions/upload-artifact@v4",
      "actions/download-artifact@v4",
      "actions/github-script@v7",
      "codecov/codecov-action@v4",
    ];

    for (const workflowPath of workflowFiles) {
      const workflow = fs.readFileSync(workflowPath, "utf8");
      for (const pin of bannedPins) {
        expect(workflow).not.toContain(pin);
      }
    }
  });

  it("transfers the production build to E2E jobs with a workflow artifact", () => {
    const workflow = fs.readFileSync(
      path.join(workflowsDir, "test.yml"),
      "utf8"
    );

    expect(workflow).toContain("tar -cf next-build.tar .next");
    expect(workflow).toContain("actions/upload-artifact@v7");
    expect(workflow.match(/actions\/download-artifact@v8/g)).toHaveLength(2);
    expect(workflow.match(/tar -xf next-build\.tar/g)).toHaveLength(2);
    expect(workflow).not.toContain("key: next-build-");
  });
});
