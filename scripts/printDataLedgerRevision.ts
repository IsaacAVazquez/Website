import { GET } from "../src/app/api/data-revisions/route";

async function main() {
  const response = await GET();
  const payload = (await response.json()) as { publicationRevision?: unknown };

  if (
    typeof payload.publicationRevision !== "string" ||
    !/^[a-f0-9]{64}$/.test(payload.publicationRevision)
  ) {
    throw new Error("The local committed-data ledger did not produce a valid revision.");
  }

  process.stdout.write(payload.publicationRevision);
}

void main();
