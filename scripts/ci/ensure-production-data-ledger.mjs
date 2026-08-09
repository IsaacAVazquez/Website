#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const [expectedRevision, revisionEndpoint, buildHook, expectedCommit] = process.argv.slice(2);
const pollAttempts = Number.parseInt(process.env.DATA_LEDGER_POLL_ATTEMPTS ?? "60", 10);
const pollIntervalMs = Number.parseInt(
  process.env.DATA_LEDGER_POLL_INTERVAL_MS ?? "10000",
  10
);
const requestTimeoutMs = Number.parseInt(
  process.env.DATA_LEDGER_REQUEST_TIMEOUT_MS ?? "20000",
  10
);
const commitPattern = /^[a-f0-9]{40}$/;

if (!expectedRevision || !revisionEndpoint || !buildHook) {
  console.error(
    "Usage: ensure-production-data-ledger.mjs <expected-revision> <revision-endpoint> <build-hook> [expected-commit]"
  );
  process.exit(2);
}

if (!/^[a-f0-9]{64}$/.test(expectedRevision)) {
  console.error("Expected ledger revision is malformed.");
  process.exit(2);
}

if (expectedCommit && !commitPattern.test(expectedCommit)) {
  console.error("Expected deployment commit is malformed.");
  process.exit(2);
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readProductionLedger() {
  const url = new URL(revisionEndpoint);
  url.searchParams.set("cacheBust", `${Date.now()}`);
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: {
      Accept: "application/json",
      "User-Agent": "WebsiteDataPublicationHealth/1.0",
    },
    redirect: "follow",
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `Production health endpoint rejected the publication check with HTTP ${response.status}. Check the Cloudflare or Netlify access rule for ${url.pathname}.`
    );
  }

  if (!response.ok) {
    return { status: response.status, revision: null };
  }

  const payload = await response.json();
  return {
    status: response.status,
    revision: typeof payload.revision === "string" ? payload.revision : null,
    publicationRevision:
      typeof payload.publicationRevision === "string"
        ? payload.publicationRevision
        : null,
    deploymentCommit:
      typeof payload.deploymentCommit === "string" &&
      commitPattern.test(payload.deploymentCommit)
        ? payload.deploymentCommit
        : null,
  };
}

const commitRelationshipCache = new Map();

function gitSucceeded(args) {
  return spawnSync("git", args, { stdio: "ignore" }).status === 0;
}

function deploymentIncludesExpectedCommit(deployedCommit) {
  if (!expectedCommit || !deployedCommit) return false;
  if (deployedCommit === expectedCommit) return true;

  const cacheKey = `${expectedCommit}:${deployedCommit}`;
  if (commitRelationshipCache.has(cacheKey)) {
    return commitRelationshipCache.get(cacheKey);
  }

  if (!gitSucceeded(["cat-file", "-e", `${deployedCommit}^{commit}`])) {
    // A snapshot may land after checkout while Netlify is starting the branch
    // build. Refresh recent main history once so that commit can be compared.
    gitSucceeded(["fetch", "--quiet", "--depth=100", "origin", "main"]);
  }

  const includesExpected = gitSucceeded([
    "merge-base",
    "--is-ancestor",
    expectedCommit,
    deployedCommit,
  ]);
  commitRelationshipCache.set(cacheKey, includesExpected);
  return includesExpected;
}

function matchingPublicationState(ledger) {
  if (ledger.publicationRevision === expectedRevision) {
    return "committed data revision";
  }
  if (deploymentIncludesExpectedCommit(ledger.deploymentCommit)) {
    return ledger.deploymentCommit === expectedCommit
      ? "deployment commit"
      : "newer deployment commit";
  }
  return null;
}

async function main() {
  const before = await readProductionLedger();
  const existingMatch = matchingPublicationState(before);
  if (existingMatch) {
    console.log(`Production already serves the expected ${existingMatch}.`);
    return;
  }

  const hookResponse = await fetch(buildHook, {
    method: "POST",
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!hookResponse.ok) {
    throw new Error(`Netlify build hook failed with HTTP ${hookResponse.status}.`);
  }

  console.log(`Build hook accepted. Waiting for ledger ${expectedRevision}.`);
  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    await wait(pollIntervalMs);
    const current = await readProductionLedger();
    const match = matchingPublicationState(current);
    if (match) {
      console.log(`Production serves the expected ${match}.`);
      return;
    }
    console.log(
      `Attempt ${attempt}/${pollAttempts}: HTTP ${current.status}, publication revision ${current.publicationRevision ?? "unavailable"}, deployment commit ${current.deploymentCommit ?? "unavailable"}, aggregate revision ${current.revision ?? "unavailable"}.`
    );
  }

  throw new Error(
    `Production did not serve data ledger ${expectedRevision} before the verification deadline.`
  );
}

main().catch((error) => {
  console.error(`::error::${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
