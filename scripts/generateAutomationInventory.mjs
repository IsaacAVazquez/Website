#!/usr/bin/env node
/**
 * Regenerates the tables in docs/AUTOMATION_SCRIPTS.md from the repo itself:
 * the files under scripts/, the npm entry points in package.json, and the
 * schedules in .github/workflows. Run with --check to fail instead of write,
 * which is what catches a new script that nobody documented.
 *
 *   npm run docs:automation
 *   npm run docs:automation -- --check
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const docPath = path.join(projectRoot, "docs", "AUTOMATION_SCRIPTS.md");
const START = "<!-- generated:start -->";
const END = "<!-- generated:end -->";

// Every file under scripts/ needs a row here. Parsing the leading comment
// instead was tried and dropped: it still needed a hand-written override for
// two thirds of the tree, and where it did fire it left one file with no
// description and truncated two others mid-sentence.
const DESCRIPTIONS = {
  "append-changelog-entry.mjs":
    "Append a merged pull request to CHANGELOG.md, grouped under a UTC date header",
  "buildArticleCoverImages.ts":
    "Gives each blog post a real, license-safe cover photo in place of the auto-generated `/writing/<slug>/opengraph-image` editorial card",
  "buildBayAreaTransitSnapshot.ts":
    "Refreshes src/data/bayAreaTransitSnapshot.ts from BART's public API",
  "buildEarthquakeSnapshot.ts":
    "Refreshes src/data/earthquakeSnapshot.ts from the USGS Earthquake Hazards Program public GeoJSON feeds",
  "buildFantasyWeeklySnapshot.ts":
    "Rebuilds public/data/fantasy/weekly.json from the FantasyPros weekly FLEX and quarterback consensus boards",
  "buildGolfSnapshot.ts":
    "Refreshes src/data/golfSnapshot.ts from ESPN's public golf leaderboard",
  "buildWorldCupSnapshot.ts":
    "Refreshes src/data/worldCupSnapshot.ts from ESPN's public soccer/fifa.world endpoints",
  "fetchRetry.ts":
    "Shared retry-with-backoff helper for snapshot fetch scripts",
  "generateAutomationInventory.mjs":
    "Regenerates the tables in docs/AUTOMATION_SCRIPTS.md from scripts/, the npm entry points in package.json, and the workflow schedules",
  "patch-nft-sharp.mjs":
    "Removes sharp/@img entries from Next.js NFT traces to keep the Netlify function bundle under 250 MB",
  "snapshotFallback.ts":
    "Reads an already-generated snapshot back out of its `src/data/*.ts` file so a failed refresh falls back to the last good data",
  "updateFootballSnapshots.ts":
    "Refreshes football snapshot data from football-data.org",
  "updateLaLigaSnapshot.ts":
    "Updates src/data/laLigaSnapshot.ts with live data from football-data.org",
  "updateMlbSnapshot.ts":
    "Updates src/data/mlbSnapshot.ts with live data from the MLB Stats API",
  "updateNbaSnapshot.ts":
    "Updates src/data/nbaSnapshot.ts with live data from ESPN's public NBA API",
  "updateNflSnapshot.ts":
    "Refreshes src/data/nflSnapshot.ts using NFLverse open data",
  "buildBestBallSnapshot.ts":
    "Rebuilds public/data/fantasy/best-ball.json from the best ball consensus board and Underdog ADP",
  "buildFantasyAdpData.ts":
    "Rebuilds src/data/fantasyAdpData.generated.ts from mock-draft ADP",
  "buildFantasyGameLogData.ts":
    "Rebuilds src/data/fantasyGameLogData.generated.ts from nflverse weekly player stats",
  "buildFantasyPositionData.ts":
    "Rebuilds src/data/fantasyPositionData.generated.ts from the FantasyPros cheatsheets",
  "buildFantasySnapshots.ts":
    "Writes the published public/data/fantasy/{ppr,half_ppr,standard}.json snapshots and their revision file",
  "buildFantasyCompanionExtension.mjs":
    "Packages compact snapshot copies into extension/dist for the draft companion side panel",
  "buildFormula1Snapshot.ts": "Rebuilds src/data/formula1Snapshot.ts from OpenF1",
  "buildFrontierModelsSnapshot.ts":
    "Rebuilds the src/data/frontierModelsSnapshot.ts seed from the curated source file",
  "buildGitHubTrendingSnapshot.ts":
    "Rebuilds src/data/githubTrendingSnapshot.ts from the GitHub Search API",
  "buildInvestmentsSnapshots.ts":
    "Converts the fetched investments data into public/data/investments snapshots",
  "buildPollingSnapshot.ts":
    "Rebuilds the src/data/pollingSnapshot.ts seed from the VoteHub polling API",
  "buildPremierLeagueSnapshot.ts":
    "Rebuilds src/data/premierLeagueSnapshot.ts from football-data.org",
  "buildScorePoolsSnapshot.ts":
    "Rebuilds src/data/scorePoolsSnapshot.ts from The Odds API and API-Football",
  "buildSpaceXImageSnapshots.ts":
    "Caches SpaceX launch images and rebuilds the image manifest and reference index",
  "buildSpaceXSnapshot.ts":
    "Rebuilds src/data/spacexSnapshot.generated.json from Launch Library",
  "buildTechStartupSnapshot.ts":
    "Rebuilds src/data/techStartupSnapshot.ts from the curated seed in the script",
  "checkBlogDateReview.ts":
    "CI gate that applies the blog date review rules to changed content/blog files",
  "fetch_investments_data.py":
    "Pulls the raw investments data through defeatbeta-api before the snapshot build",
  "generate-pwa-icons.mjs": "Rebuilds the PWA icon assets",
  "generatePublicSitemap.mjs":
    "Regenerates public/sitemap.xml from the route inventory and snapshot timestamps",
  "submitIndexNow.mjs": "Submits the sitemap URLs to the IndexNow endpoint",
  "auditCuratedData.ts":
    "Structural and review-date audit of the curated, unverified datasets",
  "blogDateReview.ts":
    "Decides whether a blog edit is substantive enough to move its published date",
  "dataRefreshRegistry.ts":
    "Maps each data surface to its generated artifact and source-date path",
  "printDataLedgerRevision.ts":
    "Prints the current data ledger revision for the deploy gate",
  "verifyDataRefresh.ts":
    "Builds the refresh manifest and verifies a snapshot actually moved",
  "verifyScorePoolsSnapshot.ts":
    "Quality gate for the score pools snapshot before it is committed",
  "ci/commit-and-push-snapshot.sh":
    "Shared commit and push step for the snapshot refresh workflows",
  "ci/ensure-production-data-ledger.mjs":
    "Confirms the deployed build carries the expected data ledger",
  "ci/ensure-production-data-revision.sh":
    "Confirms production is serving the expected data revision",
  "ci/netlify-ignore.sh": "Netlify ignore-build check for snapshot-only commits",
  "ci/verify-deploy-assets.mjs": "Verifies required assets exist after a build",
  "data/articleCoverImages.ts": "Per-slug cover image plan for the writing posts",
  "data/frontierModels.source.ts": "Curated source data for the frontier model snapshot",
  "data/scorePools.manual.ts": "Hand-entered score pools inputs",
  "data/scorePoolsConfig.ts": "Score pools contest configuration",
  "investments_symbols.txt": "Curated symbol list for the investments refresh",
};

const SKIP_DIRS = new Set(["__tests__", "tests", "__pycache__"]);
const INCLUDE_EXT = new Set([".ts", ".mjs", ".js", ".py", ".sh", ".txt"]);

async function listScriptFiles(dir, prefix = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...(await listScriptFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)));
    } else if (INCLUDE_EXT.has(path.extname(entry.name))) {
      files.push(`${prefix}${entry.name}`);
    }
  }
  return files.sort();
}

function table(header, rows) {
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

async function build() {
  const pkg = JSON.parse(await fs.readFile(path.join(projectRoot, "package.json"), "utf8"));
  const npmScripts = pkg.scripts ?? {};
  const scriptFiles = await listScriptFiles(path.join(projectRoot, "scripts"));

  // npm command -> the scripts/ files it runs, following one hop of `npm run`.
  const directRuns = new Map();
  for (const [name, command] of Object.entries(npmScripts)) {
    directRuns.set(name, scriptFiles.filter((file) => command.includes(`scripts/${file}`)));
  }
  const runsFor = (name, seen = new Set()) => {
    if (seen.has(name)) return [];
    seen.add(name);
    const nested = [...(npmScripts[name] ?? "").matchAll(/npm run ([\w:-]+)/g)].flatMap(
      (match) => runsFor(match[1], seen)
    );
    return [...new Set([...(directRuns.get(name) ?? []), ...nested])];
  };

  const workflowDir = path.join(projectRoot, ".github", "workflows");
  const workflowNames = (await fs.readdir(workflowDir)).filter((name) => name.endsWith(".yml"));
  const workflows = [];
  for (const name of workflowNames) {
    const source = await fs.readFile(path.join(workflowDir, name), "utf8");
    const crons = [...source.matchAll(/-\s*cron:\s*["']([^"']+)["']/g)].map((match) => match[1]);
    const commands = [...new Set([...source.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]))];
    const files = [
      ...new Set([
        ...scriptFiles.filter((file) => source.includes(`scripts/${file}`)),
        ...commands.flatMap((command) => runsFor(command)),
      ]),
    ];
    workflows.push({ name, crons, commands, files });
  }

  const runnersFor = (file) => {
    const commands = Object.keys(npmScripts).filter((name) => runsFor(name).includes(file));
    const actions = workflows.filter((flow) => flow.files.includes(file)).map((flow) => flow.name);
    return [
      ...commands.map((command) => `\`npm run ${command}\``),
      ...actions.map((action) => `\`${action}\``),
    ];
  };

  const missing = [];
  const scriptRows = [];
  for (const file of scriptFiles) {
    const purpose = DESCRIPTIONS[file] ?? "";
    if (!purpose) missing.push(file);
    const runners = runnersFor(file);
    scriptRows.push([
      `\`${file}\``,
      purpose || "**undocumented**",
      runners.length ? runners.join("<br>") : "imported by other scripts",
    ]);
  }

  const commandRows = Object.entries(npmScripts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, command]) => [`\`npm run ${name}\``, `\`${command}\``]);

  const workflowRows = workflows
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((flow) => [
      `\`${flow.name}\``,
      flow.crons.length ? flow.crons.map((cron) => `\`${cron}\``).join("<br>") : "no cron (event or dispatch)",
      flow.files.length ? flow.files.map((file) => `\`${file}\``).join("<br>") : "no scripts/ file",
    ]);

  const generated = [
    START,
    "",
    "Generated by `npm run docs:automation`. Do not hand-edit between the markers.",
    "",
    `## Files under \`scripts/\` (${scriptFiles.length})`,
    "",
    table(["File", "Purpose", "Run by"], scriptRows),
    "",
    `## npm entry points (${commandRows.length})`,
    "",
    table(["Command", "Runs"], commandRows),
    "",
    `## Scheduled workflows (${workflowRows.length})`,
    "",
    "Cron times are UTC. Artifacts and fallback behavior live in `DATA_UPDATE_OPERATIONS.md`.",
    "",
    table(["Workflow", "Schedule", "Scripts"], workflowRows),
    "",
    END,
  ].join("\n");

  return { generated, missing };
}

const { generated, missing } = await build();
const existing = await fs.readFile(docPath, "utf8");
const startIndex = existing.indexOf(START);
const endIndex = existing.indexOf(END);
if (startIndex === -1 || endIndex === -1) {
  console.error(`${docPath} is missing the ${START} / ${END} markers.`);
  process.exit(1);
}
const next = existing.slice(0, startIndex) + generated + existing.slice(endIndex + END.length);

if (process.argv.includes("--check")) {
  const problems = [];
  if (next !== existing) problems.push("docs/AUTOMATION_SCRIPTS.md is out of date. Run: npm run docs:automation");
  if (missing.length) problems.push(`No description for: ${missing.join(", ")}`);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("Automation inventory is current.");
} else {
  await fs.writeFile(docPath, next);
  console.log(`Wrote ${path.relative(projectRoot, docPath)}.`);
  if (missing.length) console.warn(`No description for: ${missing.join(", ")}`);
}
