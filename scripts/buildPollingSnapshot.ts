import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  ApprovalDataPoint,
  ApprovalPoll,
  BasePoll,
  GenericBallotPoll,
  PollingSnapshot,
  SampleType,
} from "../src/types/polling";

const API_BASE = "https://api.votehub.com/polls";
const SNAPSHOT_PATH = path.join(process.cwd(), "src", "data", "pollingSnapshot.ts");
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RECENT_POLLS = 30;

interface VoteHubAnswer {
  choice?: string;
  pct?: number;
}

interface VoteHubPoll {
  id?: string;
  poll_type?: string;
  sample_size?: number | string | null;
  population?: string | null;
  start_date?: string;
  end_date?: string;
  pollster?: string;
  sponsors?: string[];
  answers?: VoteHubAnswer[];
  subject?: string;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function readAnswer(poll: VoteHubPoll, choices: string[]): number | null {
  const normalizedChoices = choices.map((choice) => choice.toLowerCase());
  const answer = poll.answers?.find((candidate) =>
    normalizedChoices.includes(candidate.choice?.trim().toLowerCase() ?? "")
  );
  return typeof answer?.pct === "number" && Number.isFinite(answer.pct)
    ? answer.pct
    : null;
}

function normalizeSampleType(value: string | null | undefined): SampleType {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "lv") return "LV";
  if (normalized === "rv") return "RV";
  return "A";
}

function normalizeBasePoll(poll: VoteHubPoll): BasePoll | null {
  if (!poll.id || !poll.pollster || !poll.start_date || !poll.end_date) return null;
  const sampleSize = Number(poll.sample_size);
  if (!Number.isFinite(sampleSize) || sampleSize < 1) return null;
  return {
    id: poll.id,
    pollster: poll.pollster,
    sponsor: poll.sponsors?.filter(Boolean).join(" / ") || undefined,
    startDate: poll.start_date,
    endDate: poll.end_date,
    sampleSize,
    sampleType: normalizeSampleType(poll.population),
    moe: null,
    methodology: "unknown",
  };
}

function populationPriority(poll: VoteHubPoll): number {
  const population = normalizeSampleType(poll.population);
  return population === "LV" ? 3 : population === "RV" ? 2 : 1;
}

function dedupeAndSort(polls: VoteHubPoll[]): VoteHubPoll[] {
  const byFielding = new Map<string, VoteHubPoll>();
  for (const poll of polls) {
    const key = `${poll.pollster ?? ""}|${poll.start_date ?? ""}|${poll.end_date ?? ""}`;
    const existing = byFielding.get(key);
    if (!existing || populationPriority(poll) > populationPriority(existing)) {
      byFielding.set(key, poll);
    }
  }
  return Array.from(byFielding.values()).sort(
    (left, right) => Date.parse(right.end_date ?? "") - Date.parse(left.end_date ?? "")
  );
}

async function fetchPolls(query: URLSearchParams): Promise<VoteHubPoll[]> {
  const response = await fetch(`${API_BASE}?${query}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: "application/json", "User-Agent": "isaacavazquez.com polling dashboard" },
  });
  if (!response.ok) throw new Error(`VoteHub returned HTTP ${response.status}.`);
  const payload = (await response.json()) as VoteHubPoll[] | { polls?: VoteHubPoll[] };
  const polls = Array.isArray(payload) ? payload : payload.polls;
  if (!Array.isArray(polls)) throw new Error("VoteHub returned an unexpected payload.");
  return polls;
}

function buildApprovalPolls(raw: VoteHubPoll[]): ApprovalPoll[] {
  return dedupeAndSort(raw)
    .map((poll): ApprovalPoll | null => {
      const base = normalizeBasePoll(poll);
      const approve = readAnswer(poll, ["approve"]);
      const disapprove = readAnswer(poll, ["disapprove"]);
      if (!base || approve === null || disapprove === null) return null;
      return {
        ...base,
        approve,
        disapprove,
        unsure: Math.max(0, Math.round((100 - approve - disapprove) * 10) / 10),
      };
    })
    .filter((poll): poll is ApprovalPoll => poll !== null);
}

function buildGenericPolls(raw: VoteHubPoll[]): GenericBallotPoll[] {
  return dedupeAndSort(raw)
    .map((poll): GenericBallotPoll | null => {
      const base = normalizeBasePoll(poll);
      const dem = readAnswer(poll, ["dem", "democratic", "democrat"]);
      const rep = readAnswer(poll, ["rep", "republican"]);
      if (!base || dem === null || rep === null) return null;
      return {
        ...base,
        dem,
        rep,
        other: Math.max(0, Math.round((100 - dem - rep) * 10) / 10),
      };
    })
    .filter((poll): poll is GenericBallotPoll => poll !== null);
}

function selectCurrent<T extends BasePoll>(polls: T[]): T[] {
  const latestTime = Date.parse(polls[0]?.endDate ?? "");
  const cutoff = latestTime - 30 * 24 * 60 * 60 * 1000;
  const inWindow = polls.filter((poll) => Date.parse(poll.endDate) >= cutoff);
  return (inWindow.length >= 3 ? inWindow : polls).slice(0, MAX_RECENT_POLLS);
}

function buildApprovalTrend(polls: ApprovalPoll[]): ApprovalDataPoint[] {
  const byMonth = new Map<string, ApprovalPoll[]>();
  for (const poll of polls) {
    const month = poll.endDate.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(poll);
  }
  return Array.from(byMonth.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-12)
    .map(([month, values]) => ({
      date: `${month}-15`,
      approve: average(values.map((poll) => poll.approve)),
      disapprove: average(values.map((poll) => poll.disapprove)),
    }));
}

export async function buildPollingSnapshot(): Promise<PollingSnapshot> {
  const fromDate = new Date(Date.now() - 370 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const [approvalRaw, genericRaw] = await Promise.all([
    fetchPolls(new URLSearchParams({
      poll_type: "approval",
      subject: "donald-trump",
      from_date: fromDate,
      min_sample_size: "300",
    })),
    fetchPolls(new URLSearchParams({
      poll_type: "generic-ballot",
      subject: "2026",
      from_date: fromDate,
      min_sample_size: "300",
    })),
  ]);

  const approvalPolls = buildApprovalPolls(approvalRaw);
  const genericBallotPolls = buildGenericPolls(genericRaw);
  if (approvalPolls.length < 5 || genericBallotPolls.length < 5) {
    throw new Error(
      `VoteHub returned too little usable data (${approvalPolls.length} approval, ${genericBallotPolls.length} generic ballot).`
    );
  }

  const currentApproval = selectCurrent(approvalPolls);
  const currentGeneric = selectCurrent(genericBallotPolls);
  const approve = average(currentApproval.map((poll) => poll.approve));
  const disapprove = average(currentApproval.map((poll) => poll.disapprove));
  const dem = average(currentGeneric.map((poll) => poll.dem));
  const rep = average(currentGeneric.map((poll) => poll.rep));
  const sourceAsOf = [approvalPolls[0].endDate, genericBallotPolls[0].endDate]
    .sort()
    .at(-1)!;

  return {
    generatedAt: new Date().toISOString(),
    sourceAsOf,
    sourceLabel: "VoteHub Polling API, CC BY 4.0",
    approvalAvg: { approve, disapprove, net: Math.round((approve - disapprove) * 10) / 10 },
    approvalTrend: buildApprovalTrend(approvalPolls),
    approvalPolls: approvalPolls.slice(0, MAX_RECENT_POLLS),
    genericBallotAvg: { dem, rep, margin: Math.round((dem - rep) * 10) / 10 },
    genericBallotPolls: genericBallotPolls.slice(0, MAX_RECENT_POLLS),
    senateRaces: [],
    governorRaces: [],
  };
}

async function main() {
  const snapshot = await buildPollingSnapshot();
  const contents = `import type { PollingSnapshot } from "@/types/polling";\n\nexport const pollingSnapshot: PollingSnapshot = ${JSON.stringify(snapshot, null, 2)};\n`;
  const temporaryPath = `${SNAPSHOT_PATH}.tmp-${process.pid}`;
  await fs.writeFile(temporaryPath, contents, "utf8");
  await fs.rename(temporaryPath, SNAPSHOT_PATH);
  console.log(
    `Polling snapshot written with ${snapshot.approvalPolls.length} approval and ${snapshot.genericBallotPolls.length} generic ballot polls.`
  );
}

if (process.argv[1]?.endsWith("buildPollingSnapshot.ts")) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
