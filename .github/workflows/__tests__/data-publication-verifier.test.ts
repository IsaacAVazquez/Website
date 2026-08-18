/**
 * @jest-environment node
 */
import { execFile, execFileSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import path from "node:path";

interface LedgerPayload {
  revision: string;
  publicationRevision: string | null;
  deploymentCommit: string | null;
}

interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
  hookCalls: () => number;
}

function startServer(
  initialLedger: LedgerPayload,
  afterHookLedger?: LedgerPayload
): Promise<TestServer> {
  let ledger = initialLedger;
  let hookCalls = 0;
  const server: Server = createServer((request, response) => {
    if (request.url?.startsWith("/ledger")) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(ledger));
      return;
    }
    if (request.url === "/hook" && request.method === "POST") {
      hookCalls += 1;
      if (afterHookLedger) ledger = afterHookLedger;
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end("{}");
      return;
    }
    response.writeHead(404);
    response.end();
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Test publication server did not bind a TCP port."));
        return;
      }
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => (error ? closeReject(error) : closeResolve()));
          }),
        hookCalls: () => hookCalls,
      });
    });
  });
}

function runVerifier(
  server: TestServer,
  expectedRevision: string,
  expectedCommit: string,
  ledgerUrlOverride?: string
): Promise<{ stdout: string; stderr: string }> {
  const script = path.join(
    process.cwd(),
    "scripts",
    "ci",
    "ensure-production-data-ledger.mjs"
  );
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [
        script,
        expectedRevision,
        ledgerUrlOverride ?? `${server.baseUrl}/ledger`,
        `${server.baseUrl}/hook`,
        expectedCommit,
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATA_LEDGER_POLL_ATTEMPTS: "2",
          DATA_LEDGER_POLL_INTERVAL_MS: "1",
          DATA_LEDGER_REQUEST_TIMEOUT_MS: "2000",
        },
        timeout: 10_000,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            Object.assign(error, {
              message: `${error.message}\nstdout: ${stdout}\nstderr: ${stderr}`,
            })
          );
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

describe("production data publication verifier", () => {
  const expectedRevision = "a".repeat(64);
  const headCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();

  it("ignores mutable runtime heartbeat state when committed data matches", async () => {
    const server = await startServer({
      revision: "b".repeat(64),
      publicationRevision: expectedRevision,
      deploymentCommit: null,
    });
    try {
      const result = await runVerifier(server, expectedRevision, headCommit);
      expect(result.stdout).toContain("expected committed data revision");
      expect(server.hookCalls()).toBe(0);
    } finally {
      await server.close();
    }
  });

  it("accepts a newer main deployment that contains the expected commit", async () => {
    const expectedAncestor = execFileSync("git", ["rev-parse", "HEAD^"], {
      encoding: "utf8",
    }).trim();
    const server = await startServer({
      revision: "b".repeat(64),
      publicationRevision: "c".repeat(64),
      deploymentCommit: headCommit,
    });
    try {
      const result = await runVerifier(
        server,
        expectedRevision,
        expectedAncestor
      );
      expect(result.stdout).toContain("expected newer deployment commit");
      expect(server.hookCalls()).toBe(0);
    } finally {
      await server.close();
    }
  });

  it("triggers the build hook and polls until committed data arrives", async () => {
    const server = await startServer(
      {
        revision: "b".repeat(64),
        publicationRevision: "c".repeat(64),
        deploymentCommit: null,
      },
      {
        revision: "d".repeat(64),
        publicationRevision: expectedRevision,
        deploymentCommit: headCommit,
      }
    );
    try {
      const result = await runVerifier(server, expectedRevision, headCommit);
      expect(result.stdout).toContain("Build hook accepted");
      expect(result.stdout).toContain("expected committed data revision");
      expect(server.hookCalls()).toBe(1);
    } finally {
      await server.close();
    }
  });

  it("still fires the build hook when the pre-hook ledger read is unreachable", async () => {
    // A transport-level failure (request timeout, DNS failure, TLS reset) used to
    // reject out of readProductionLedger and exit the run through main().catch
    // before the hook POST, so committed snapshots stayed unpublished for up to
    // six hours while the opened incident pointed on-call at the build hook. HTTP
    // failure was already tolerated; transport failure was not.
    const server = await startServer({
      revision: "b".repeat(64),
      publicationRevision: "c".repeat(64),
      deploymentCommit: null,
    });
    try {
      // Port 1 is reserved and refuses immediately, so the ledger read throws
      // while the hook endpoint on the stub server stays reachable.
      await expect(
        runVerifier(
          server,
          expectedRevision,
          headCommit,
          "http://127.0.0.1:1/ledger"
        )
      ).rejects.toThrow();

      // The run still fails, because production never confirmed the revision.
      // What matters is that the publish was attempted rather than skipped.
      expect(server.hookCalls()).toBe(1);
    } finally {
      await server.close();
    }
  });
});
