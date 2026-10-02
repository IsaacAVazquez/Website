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

// Ten lanes share one body through refresh-snapshot.yml; the rest carry their own.
const reusableWorkflow = path.join(workflowsDir, "refresh-snapshot.yml");
const REUSABLE_USES = "uses: ./.github/workflows/refresh-snapshot.yml";
const isCaller = (file: string) =>
  fs.readFileSync(file, "utf8").includes(REUSABLE_USES);
const callerFiles = updateWorkflowFiles.filter(isCaller);
// Every file whose steps run a refresh body: the standalone lanes plus the shared one.
const bodyFiles = [
  ...updateWorkflowFiles.filter((file) => !isCaller(file)),
  reusableWorkflow,
];
const bodyFor = (file: string) => (isCaller(file) ? reusableWorkflow : file);

describe("snapshot refresh workflow infrastructure", () => {
  it("passes every per-lane field into the shared refresh body", () => {
    expect(callerFiles.length).toBe(10);
    const reusable = fs.readFileSync(reusableWorkflow, "utf8");
    expect(reusable).toContain("workflow_call:");
    expect(reusable).toContain("run: npm run update:${{ inputs.id }}");
    expect(reusable).toContain("npx tsx scripts/verifyDataRefresh.ts ${{ inputs.id }}");
    expect(reusable).toContain('"chore: refresh ${LANE//-/ } snapshot [automated] [skip ci]"');
    expect(reusable).toContain("'${{ inputs.label }}', '${{ inputs.title }}'");

    for (const workflowPath of callerFiles) {
      const workflow = fs.readFileSync(workflowPath, "utf8");
      expect(workflow).toContain("schedule:");
      expect(workflow).toContain("concurrency:");
      // A called workflow can only narrow the token it is handed, so the push
      // and the failure issue need the caller to grant both scopes.
      expect(workflow).toContain("contents: write");
      expect(workflow).toContain("issues: write");
      expect(workflow).toContain("secrets: inherit");
      expect(workflow).toMatch(/\n\s+id: [a-z-]+\n/);
      expect(workflow).toMatch(/snapshot-path: src\/data\/\w+Snapshot\.json/);
      expect(workflow).toMatch(/label: [a-z-]+-refresh-failure/);
      expect(workflow).toMatch(/title: .+ refresh failed/);
    }
  });

  it("routes automated snapshot commits through the shared helper", () => {
    expect(bodyFiles.length).toBeGreaterThan(1);

    for (const workflowPath of bodyFiles) {
      const workflow = fs.readFileSync(workflowPath, "utf8");
      expect(workflow).toContain("bash scripts/ci/commit-and-push-snapshot.sh");
      expect(workflow).not.toMatch(/git push origin HEAD:main/);
      expect(workflow).not.toMatch(/git rebase origin\/main/);
    }
  });

  it("checks out main before any refresh that can push to main", () => {
    for (const workflowPath of bodyFiles) {
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
    for (const workflowPath of bodyFiles) {
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
    // A failed ledger check must not skip the asset check. It did on every run
    // of incident #500.
    expect(publicationCommands).toMatch(
      /name: Verify the deploy published its static assets\n\s+if: \$\{\{ !cancelled\(\) && steps\.deploy\.outcome == 'success' \}\}/
    );
    // The ledger is read from the Netlify origin. Cloudflare challenges runner
    // traffic on the custom domain, which failed every publish on 2026-09-29
    // from 02:16 UTC until the check moved, while every deploy was fine.
    expect(publicationCommands).toContain(
      ":-https://isaacvazquez.netlify.app/api/data-revisions}"
    );
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
      const workflow = fs.readFileSync(bodyFor(path.join(workflowsDir, workflowName)), "utf8");
      expect(workflow).toContain("npx tsx scripts/verifyDataRefresh.ts");
      // Weekly validation is inside its builder and publishes independently.
      // The shared verifier gates the later redraft artifact in this workflow.
      const commitIndex = workflowName === "update-fantasy.yml"
        ? workflow.indexOf("- name: Commit and push snapshot updates")
        : workflow.indexOf("bash scripts/ci/commit-and-push-snapshot.sh");
      expect(workflow.indexOf("npx tsx scripts/verifyDataRefresh.ts")).toBeLessThan(
        commitIndex
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
    expect(workflow).toContain("rankingExperts < 4");
    // Draft ADP freezes at Week 1, so in season its age is a warning. The
    // board's own freeze lives in the freshness policy, which leaves the
    // freshness gate strict here and lets the redraft lane commit.
    expect(workflow).toContain("draft ADP is frozen at its last reading");
    expect(workflow).toContain("steps.verify_freshness.outcome == 'failure' ||");
    expect(workflow).not.toContain("season_open");
  });

  it("builds and commits the weekly board ahead of the draft boards", () => {
    const workflow = fs.readFileSync(
      path.join(workflowsDir, "update-fantasy.yml"),
      "utf8"
    );

    // It is the only fantasy artifact that changes in season, and it used to
    // run after two dozen FantasyPros requests from the same address.
    expect(workflow.indexOf("- name: Build weekly board")).toBeLessThan(
      workflow.indexOf("- name: Build fantasy snapshots")
    );
    expect(workflow.indexOf("- name: Commit and push weekly board")).toBeLessThan(
      workflow.indexOf("- name: Build fantasy snapshots")
    );
    // Weeks 17 and 18 fall in January, after the daily lane used to stop.
    expect(workflow).toContain('cron: "17 17 1-12 1 *"');
  });

  it("puts rejected draft files back before either draft lane commits", () => {
    const workflow = fs.readFileSync(
      path.join(workflowsDir, "update-fantasy.yml"),
      "utf8"
    );
    const discardStep = workflow.match(
      /- name: Discard redraft artifacts that failed their gates[\s\S]*?(?=\n\s+- name:)/
    )?.[0];

    expect(discardStep).toBeDefined();
    expect(discardStep).toContain("if: steps.verify_freshness.outcome != 'success' || steps.verify_quality.outcome != 'success'");
    expect(discardStep).toContain("git checkout --");
    expect(discardStep).toContain("public/data/fantasy/ppr.json");
    expect(workflow.indexOf("- name: Discard redraft artifacts")).toBeLessThan(
      workflow.indexOf("- name: Commit and push snapshot updates")
    );
    const discardBestBallStep = workflow.match(
      /- name: Discard best ball artifacts that failed their gates[\s\S]*?(?=\n\s+- name:)/
    )?.[0];
    expect(discardBestBallStep).toContain("if: steps.verify_best_ball.outcome != 'success'");
    expect(discardBestBallStep).toContain("git checkout -- public/data/fantasy/best-ball.json");
    expect(workflow.indexOf("- name: Discard best ball artifacts")).toBeLessThan(
      workflow.indexOf("- name: Commit and push snapshot updates")
    );
    expect(workflow.indexOf("- name: Discard best ball artifacts")).toBeLessThan(
      workflow.indexOf("- name: Commit and push best ball snapshot")
    );
  });

  it("commits the generated VORP source, validates every published VORP board, and only warns when one is absent", () => {
    const workflow = fs.readFileSync(
      path.join(workflowsDir, "update-fantasy.yml"),
      "utf8"
    );
    const qualityStep = workflow.match(
      /- name: Verify fantasy snapshot quality[\s\S]*?(?=\n\s+- name:)/
    )?.[0];

    // The commit and the discard step.
    expect(
      workflow.match(/src\/data\/fantasyVorpData\.generated\.json/g)
    ).toHaveLength(2);
    expect(qualityStep).toBeDefined();
    expect(qualityStep).toContain("const MIN_VORP = 300");
    expect(qualityStep).toContain(
      "const VORP_TEAM_SIZES = ['10', '12', '14']"
    );
    expect(qualityStep).toContain(
      "vorpSource?.provider !== 'FantasyPros projected VORP'"
    );
    expect(qualityStep).toContain("matchedCount !== count");
    expect(qualityStep).toContain("parsedUrl.pathname !==");
    expect(qualityStep).toContain("playerIds.has(entry.playerId)");
    expect(qualityStep).toContain("ranks.has(rank)");
    expect(qualityStep).toContain("rank <= previousRank");
    expect(qualityStep).toContain("value < 0 || value > previousValue");
    expect(qualityStep).toContain("entries[0]?.rank !== 1");
    expect(qualityStep).toContain("VORP board is absent");
    expect(qualityStep).toContain("console.log('::warning::' + warning)");
    expect(qualityStep).toContain("vorp_dark=");
    expect(workflow).toContain("steps.verify_quality.outputs.vorp_dark == 'true'");
  });

  it("allows every fantasy build lane to finish before validation and publication", () => {
    const workflow = fs.readFileSync(
      path.join(workflowsDir, "update-fantasy.yml"),
      "utf8"
    );
    const timeouts = [...workflow.matchAll(/timeout-minutes: (\d+)/g)].map(
      (match) => Number(match[1])
    );
    const [jobBudget, ...buildBudgets] = timeouts;
    expect(buildBudgets).toEqual([10, 15, 10]);
    expect(jobBudget).toBeGreaterThanOrEqual(
      buildBudgets.reduce((total, budget) => total + budget, 0) + 10
    );
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
    expect(workflow).not.toContain("FANTASYPROS");
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

  it("routes failure issues through the shared helper", () => {
    for (const workflowPath of bodyFiles) {
      if (path.basename(workflowPath) === "update-article-images.yml") continue;
      const workflow = fs.readFileSync(workflowPath, "utf8");
      expect(workflow).toContain("require('./scripts/ci/failure-issue.cjs').open(");
      expect(workflow).toContain("require('./scripts/ci/failure-issue.cjs').close(");
      expect(workflow).not.toContain("issues.listForRepo");
    }
  });

  it("opens one issue per label, comments on repeats, and closes on success", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const failureIssue = require("../../../scripts/ci/failure-issue.cjs");
    const open: { number: number }[] = [];
    const calls: string[] = [];
    const github = {
      rest: {
        issues: {
          listForRepo: async ({ labels }: { labels: string }) => {
            calls.push(`list ${labels}`);
            return { data: [...open] };
          },
          create: async ({ title, labels }: { title: string; labels: string[] }) => {
            calls.push(`create ${title.replace(/\d{4}-\d{2}-\d{2}$/, "DATE")} [${labels}]`);
            open.push({ number: 7 });
          },
          createComment: async ({ issue_number }: { issue_number: number }) => {
            calls.push(`comment ${issue_number}`);
          },
          update: async ({ issue_number, state }: { issue_number: number; state: string }) => {
            calls.push(`update ${issue_number} ${state}`);
          },
        },
      },
    };
    const context = {
      repo: { owner: "o", repo: "r" },
      serverUrl: "https://github.com",
      runId: 1,
      sha: "abc",
      eventName: "schedule",
      workflow: "Refresh NBA Snapshot",
    };

    await failureIssue.open({ github, context }, "nba-refresh-failure", "NBA refresh failed");
    await failureIssue.open({ github, context }, "nba-refresh-failure", "NBA refresh failed");
    await failureIssue.close({ github, context }, "nba-refresh-failure");

    expect(calls).toEqual([
      "list nba-refresh-failure",
      "create NBA refresh failed DATE [nba-refresh-failure,automation]",
      "list nba-refresh-failure",
      "comment 7",
      "list nba-refresh-failure",
      "comment 7",
      "update 7 closed",
    ]);
  });

  it("lets the commit helper decide whether anything changed", () => {
    const helper = fs.readFileSync(
      path.join(process.cwd(), "scripts", "ci", "commit-and-push-snapshot.sh"),
      "utf8"
    );
    // git status sees an untracked artifact, which git diff --quiet does not.
    expect(helper).toContain('git status --porcelain -- "$@"');
    expect(helper).toContain("changed=false");
    expect(helper).toContain("changed=true");
    expect(helper.indexOf("git status --porcelain")).toBeLessThan(
      helper.indexOf("node scripts/generatePublicSitemap.mjs")
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
