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

    // Publication is batched on a schedule rather than fired once per refresh. Sixteen
    // refresh workflows each triggering their own build exhausted the Netlify account's
    // build minutes, which silently stopped every deploy. The ledger check makes batching
    // safe because it compares production against the committed revision rather than
    // against whichever refresh happened to trigger the run. Batching survived the move
    // to building in Actions because the refresh commits carry [skip ci], so they never
    // fire the push trigger and instead accumulate until the next scheduled run.
    expect(publicationWorkflow).toContain("schedule:");
    expect(publicationWorkflow).toContain("workflow_dispatch:");
    expect(publicationWorkflow).not.toContain("workflow_run:");
    expect(publicationWorkflow).toContain("group: publish-refreshed-data");
    // Publication used to fire a build hook, which was harmless to kill mid-flight.
    // It now builds and uploads the deploy itself, and cancelling that part way
    // through its upload is not harmless.
    expect(publicationWorkflow).toContain("cancel-in-progress: false");
    expect(publicationWorkflow).toContain("printDataLedgerRevision.ts");
    expect(publicationWorkflow).toContain("ensure-production-data-ledger.mjs");
    expect(publicationWorkflow).toContain("EXPECTED_COMMIT");
    expect(publicationWorkflow).toContain("fetch-depth: 100");
    // The build moved into Actions, where a public repository gets free minutes,
    // so it never draws on the account's 300 monthly build minutes. That needs an
    // auth token, not a hook.
    expect(publicationWorkflow).toContain("NETLIFY_AUTH_TOKEN is required");
    // Build and deploy have to stay one command. Splitting them lets
    // @netlify/plugin-nextjs run its onEnd hook, which swaps .netlify/static back
    // out of the publish directory, so the upload ships the raw .next tree and
    // every /_next/static URL 404s. That took production down on 2026-08-20.
    // Assert against the commands only. The comment above them names the broken
    // form on purpose, so a raw string search would match the explanation.
    const publicationCommands = publicationWorkflow
      .split("\n")
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    expect(publicationCommands).toMatch(
      /netlify-cli@[\d.]+ deploy \\\n\s+--prod \\\n\s+--context production/
    );
    expect(publicationCommands).not.toMatch(/--no-build/);
    expect(publicationCommands).not.toMatch(/netlify-cli@[\d.]+ build/);
    // The ledger check alone passes on a deploy that published no static assets,
    // which is exactly what shipped on 2026-08-20, so the file-manifest check has
    // to stay wired up.
    expect(publicationCommands).toContain("verify-deploy-assets.mjs");
    expect(verifier).toContain("cacheBust");
    expect(verifier).toContain("publicationRevision");
    expect(verifier).toContain("merge-base");
    expect(verifier).toContain("AbortSignal.timeout");
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

  it("holds fantasy source freshness and top-board ADP coverage to the UI contract", () => {
    const workflow = fs.readFileSync(
      path.join(workflowsDir, "update-fantasy.yml"),
      "utf8"
    );

    expect(workflow).toContain("? 4 : 14");
    expect(workflow).toContain("? 2 : 8");
    expect(workflow).not.toContain("? 14 : 45");
    expect(workflow).toContain("const futureSkewToleranceDays = 5 / 1440");
    expect(workflow).toContain("ageDays < -futureSkewToleranceDays");
    expect(workflow).toContain("adpAgeDays < -futureSkewToleranceDays");
    expect(workflow).toContain("checkSourceAge('schedule', scheduleAgeDays)");
    expect(workflow).toContain("const TOP_BOARD_SIZE = 150");
    expect(workflow).toContain("const MIN_COVERAGE = 0.9");
    expect(workflow).toContain("top-board ADP coverage");
    expect(workflow).toContain("rankingExperts < 5");
  });

  it("pins the scheduled fantasy build to public HTML without passing an API key", () => {
    const workflow = fs.readFileSync(
      path.join(workflowsDir, "update-fantasy.yml"),
      "utf8"
    );
    const buildStep = workflow.match(
      /- name: Build fantasy snapshots[\s\S]*?(?=\n\s+- name:)/
    )?.[0];

    expect(buildStep).toBeDefined();
    expect(buildStep).toContain("run: npm run update:fantasy");
    expect(buildStep).toContain("FANTASYPROS_SOURCE: public-html");
    expect(buildStep).not.toContain("FANTASYPROS_API_KEY");
    expect(workflow).not.toContain("secrets.FANTASYPROS_API_KEY");
  });

  it("does not close World Cup incidents on a dormant run", () => {
    const workflow = fs.readFileSync(
      path.join(workflowsDir, "update-world-cup.yml"),
      "utf8"
    );

    // Every substantive step is gated on the tournament window, but skipped
    // steps do not set job status, so a dormant run still reports success().
    // Gated only on success(), the close step erased real refresh-failure
    // incidents on runs that refreshed nothing.
    expect(workflow).toContain(
      "if: success() && steps.window.outputs.active == 'true'"
    );
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
