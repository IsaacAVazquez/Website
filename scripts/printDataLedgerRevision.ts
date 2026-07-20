import { GET } from "../src/app/api/data-revisions/route";

async function main() {
  const response = await GET();
  const payload = (await response.json()) as { revision?: unknown };

  if (typeof payload.revision !== "string" || !/^[a-f0-9]{64}$/.test(payload.revision)) {
    throw new Error("The local data ledger did not produce a valid revision.");
  }

  process.stdout.write(payload.revision);
}

void main();
