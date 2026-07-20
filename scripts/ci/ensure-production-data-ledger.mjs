#!/usr/bin/env node

const [expectedRevision, revisionEndpoint, buildHook] = process.argv.slice(2);
const pollAttempts = Number.parseInt(process.env.DATA_LEDGER_POLL_ATTEMPTS ?? "30", 10);
const pollIntervalMs = Number.parseInt(
  process.env.DATA_LEDGER_POLL_INTERVAL_MS ?? "10000",
  10
);

if (!expectedRevision || !revisionEndpoint || !buildHook) {
  console.error(
    "Usage: ensure-production-data-ledger.mjs <expected-revision> <revision-endpoint> <build-hook>"
  );
  process.exit(2);
}

if (!/^[a-f0-9]{64}$/.test(expectedRevision)) {
  console.error("Expected ledger revision is malformed.");
  process.exit(2);
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readProductionLedger() {
  const url = new URL(revisionEndpoint);
  url.searchParams.set("cacheBust", `${Date.now()}`);
  const response = await fetch(url, {
    cache: "no-store",
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
  };
}

async function main() {
  const before = await readProductionLedger();
  if (before.revision === expectedRevision) {
    console.log(`Production already serves data ledger ${expectedRevision}.`);
    return;
  }

  const hookResponse = await fetch(buildHook, {
    method: "POST",
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
    if (current.revision === expectedRevision) {
      console.log("Production serves the expected data ledger revision.");
      return;
    }
    console.log(
      `Attempt ${attempt}/${pollAttempts}: HTTP ${current.status}, revision ${current.revision ?? "unavailable"}.`
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
