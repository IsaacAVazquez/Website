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

  it("checks out main before any refresh that can push to main", () => {
    for (const workflowPath of updateWorkflowFiles) {
      const workflow = fs.readFileSync(workflowPath, "utf8");
      const checkoutBlock = workflow.match(
        /uses: actions\/checkout@v7[\s\S]*?(?=\n\s+- name:)/
      )?.[0];

      expect(checkoutBlock).toBeDefined();
      expect(checkoutBlock).toContain("ref: main");
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
    expect(helper).toContain("node scripts/generatePublicSitemap.mjs");
    expect(helper).toContain('git add -- "$@" public/sitemap.xml');
    expect(helper).toContain('unmerged_files="$(git diff --name-only --diff-filter=U)"');
    expect(helper).toContain(
      'if [[ "$sitemap_enabled" == true && "$unmerged_files" == "public/sitemap.xml" ]]'
    );
    expect(helper).toContain("git commit --amend --no-edit");
    expect(helper).toContain("git push origin HEAD:main");
    expect(helper).toContain("git rebase --autostash origin/main");
    expect(helper).toContain("SNAPSHOT_PUSH_ATTEMPTS");
  });

  it("installs sitemap dependencies before snapshot commits", () => {
    for (const workflowPath of updateWorkflowFiles) {
      const workflow = fs.readFileSync(workflowPath, "utf8");
      const helperIndex = workflow.indexOf(
        "bash scripts/ci/commit-and-push-snapshot.sh"
      );
      if (helperIndex === -1) continue;

      expect(workflow.indexOf("npm ci")).toBeGreaterThan(-1);
      expect(workflow.indexOf("npm ci")).toBeLessThan(helperIndex);
    }
  });

  it("publishes and verifies snapshot workflows through one coalesced job", () => {
    const publicationWorkflow = fs.readFileSync(
      path.join(workflowsDir, "publish-data.yml"),
      "utf8"
    );
    const verifier = fs.readFileSync(
      path.join(
        process.cwd(),
        "scripts",
        "ci",
        "ensure-production-data-ledger.mjs"
      ),
      "utf8"
    );

    expect(publicationWorkflow).toContain("workflow_run:");
    expect(publicationWorkflow).toContain("group: publish-refreshed-data");
    expect(publicationWorkflow).toContain("cancel-in-progress: true");
    expect(publicationWorkflow).toContain("printDataLedgerRevision.ts");
    expect(publicationWorkflow).toContain("ensure-production-data-ledger.mjs");
    expect(publicationWorkflow).toContain("NETLIFY_BUILD_HOOK is required");
    expect(verifier).toContain("cacheBust");
    expect(verifier).toContain("Production health endpoint rejected");
    expect(verifier).toContain("Production did not serve data ledger");

    for (const workflowPath of updateWorkflowFiles) {
      if (path.basename(workflowPath) === "update-article-images.yml") continue;
      const workflow = fs.readFileSync(workflowPath, "utf8");
      expect(workflow).not.toContain("NETLIFY_BUILD_HOOK");
      expect(workflow).not.toContain("Trigger Netlify deploy");
    }
  });

  it("rejects stale artifacts before scheduled refreshes can commit", () => {
    const scheduledSnapshotWorkflows = [
      "update-earthquake.yml",
      "update-bay-area-transit.yml",
      "update-world-cup.yml",
      "update-mlb.yml",
      "update-nba.yml",
      "update-nfl.yml",
      "update-golf.yml",
      "update-formula-1.yml",
      "update-github-trending.yml",
      "update-spacex.yml",
      "update-premier-league.yml",
      "update-la-liga.yml",
      "update-fantasy.yml",
      "update-investments.yml",
      "update-polling.yml",
      "update-score-pools.yml",
    ];

    for (const workflowName of scheduledSnapshotWorkflows) {
      const workflow = fs.readFileSync(path.join(workflowsDir, workflowName), "utf8");
      expect(workflow).toContain("npx tsx scripts/verifyDataRefresh.ts");
      expect(workflow.indexOf("npx tsx scripts/verifyDataRefresh.ts")).toBeLessThan(
        workflow.indexOf("bash scripts/ci/commit-and-push-snapshot.sh")
      );
    }
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

  it("typechecks before building without running a data refresh in prebuild", () => {
    const workflow = fs.readFileSync(path.join(workflowsDir, "test.yml"), "utf8");
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.typecheck).toBe("tsc --noEmit --pretty false");
    expect(packageJson.scripts?.prebuild).toBeUndefined();
    expect(workflow.indexOf("run: npm run typecheck")).toBeGreaterThan(-1);
    expect(workflow.indexOf("run: npm run typecheck")).toBeLessThan(
      workflow.indexOf("run: npm run build")
    );
  });
});
