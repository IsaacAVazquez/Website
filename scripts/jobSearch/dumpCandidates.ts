#!/usr/bin/env tsx
/**
 * Pulls the live job boards and adds every unseen full-time match inside
 * private/job-search/targets.json to private/job-search/candidates.json.
 *
 *   ./node_modules/.bin/tsx --env-file-if-exists=.env.local scripts/jobSearch/dumpCandidates.ts [inbox.json ...]
 *
 * Each inbox argument is a browser-sourced candidates file (atsType "manual",
 * sourceName set) that gets merged in too. Missing private files read as empty.
 * Not an npm script: `npm run` on this machine resolves to the home folder's Node.
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildMBAJobCandidatesFile,
  mergeMBAJobCandidates,
  parseMBAApplications,
  parseMBAJobCandidates,
  parseMBAJobSearchTargets,
  selectNewCandidates,
} from "../../src/lib/mba-applications";
import { getDefaultMBACompanyIds, getMBAJobsData } from "../../src/lib/mbaJobsServer";
import { writeFileAtomic } from "../snapshotFallback";

const DIR = resolve(process.cwd(), "private/job-search");
// getMBAJobsData answers after 5 s with an error while a cold fan-out is still
// running; asking again waits on the same in-flight refresh.
const MAX_WAITS = 24;

function readPrivate(name: string): string | null {
  const path = resolve(DIR, name);
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

async function main(): Promise<void> {
  const targets = parseMBAJobSearchTargets(readPrivate("targets.json"));
  const pipeline = parseMBAApplications(readPrivate("pipeline.json"));
  const candidates = parseMBAJobCandidates(readPrivate("candidates.json"));
  const external = Boolean(process.env.ADZUNA_APP_ID);

  let result = await getMBAJobsData(getDefaultMBACompanyIds(), external);
  for (let attempt = 0; attempt < MAX_WAITS && result.isError; attempt += 1) {
    result = await getMBAJobsData(getDefaultMBACompanyIds(), external);
  }
  if (result.isError) {
    for (const error of result.body.errors) {
      console.error(`${error.companyName || "feed"}: ${error.message}`);
    }
    process.exit(1);
  }

  const fresh = selectNewCandidates(result.body.jobs, candidates, pipeline, targets);
  const inbox = process.argv
    .slice(2)
    .flatMap((file) => parseMBAJobCandidates(readFileSync(resolve(file), "utf8")));

  const merged = mergeMBAJobCandidates(candidates, [...fresh, ...inbox]);
  mkdirSync(DIR, { recursive: true });
  writeFileAtomic(
    resolve(DIR, "candidates.json"),
    `${JSON.stringify(buildMBAJobCandidatesFile(merged), null, 2)}\n`
  );

  const failed = result.body.errors.map((error) => error.companyName || error.companyId);
  console.log(
    `candidates: ${fresh.length} new from feed, ${inbox.length} from inbox, ${merged.length} total; ` +
      `${failed.length} boards failed${failed.length ? ` (${failed.join(", ")})` : ""}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
