import type {
  ApprovalDataPoint,
  ApprovalPoll,
  BasePoll,
  GenericBallotPoll,
  PollingSnapshot,
  Race,
  RaceCandidate,
  RacePoll,
  SampleType,
} from "@/types/polling";
import { groupBy } from "@/lib/utils";

/**
 * VoteHub fetch + transform for the polling snapshot. Lives in src/lib so the
 * committed-seed builder (scripts/buildPollingSnapshot.ts) and the Netlify
 * scheduled refresh (netlify/functions/refresh-polling.ts) share one
 * implementation. VoteHub is keyless, CC BY 4.0 — keep the attribution in
 * sourceLabel intact.
 */

const API_BASE = "https://api.votehub.com/polls";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RECENT_POLLS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
// The national series keep a year so the monthly trend has twelve points. A
// race average built on polls older than four months is not a current read.
const NATIONAL_FROM_DAYS = 370;
const RACE_FROM_DAYS = 120;

/** Blob key the scheduled refresh writes and the accessor reads. */
export const POLLING_BLOB_KEY = "polling";

// VoteHub names a race subject "2026 Michigan"; the page keys race ids by the
// postal abbreviation.
const STATE_ABBR: Readonly<Record<string, string>> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

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
    headers: { Accept: "application/json", "User-Agent": "isaacvazquez.com polling dashboard" },
  });
  if (!response.ok) throw new Error(`VoteHub returned HTTP ${response.status}.`);
  const payload = (await response.json()) as VoteHubPoll[] | { polls?: VoteHubPoll[] };
  const polls = Array.isArray(payload) ? payload : payload.polls;
  if (!Array.isArray(polls)) throw new Error("VoteHub returned an unexpected payload.");
  // VoteHub has published a poll dated after the day it was fetched (a
  // Michigan governor row read on 2026-10-09 ended "2026-10-27"). A date that
  // has not happened cannot head a series, so those rows are dropped.
  const now = Date.now();
  return polls.filter((poll) => Date.parse(poll.end_date ?? "") <= now);
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
  const cutoff = latestTime - 30 * DAY_MS;
  const inWindow = polls.filter((poll) => Date.parse(poll.endDate) >= cutoff);
  return (inWindow.length >= 3 ? inWindow : polls).slice(0, MAX_RECENT_POLLS);
}

function buildApprovalTrend(polls: ApprovalPoll[]): ApprovalDataPoint[] {
  const byMonth = groupBy(polls, (poll) => poll.endDate.slice(0, 7));
  return Array.from(byMonth.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-12)
    .map(([month, values]) => ({
      date: `${month}-15`,
      approve: average(values.map((poll) => poll.approve)),
      disapprove: average(values.map((poll) => poll.disapprove)),
    }));
}

const nameKey = (name: string) => name.trim().toLowerCase();

function toRacePoll(poll: VoteHubPoll): RacePoll | null {
  const base = normalizeBasePoll(poll);
  if (!base) return null;
  const candidates: RaceCandidate[] = (poll.answers ?? [])
    .flatMap((answer) =>
      answer.choice?.trim() && typeof answer.pct === "number" && Number.isFinite(answer.pct)
        ? [{ name: answer.choice.trim(), support: answer.pct }]
        : []
    )
    .sort((left, right) => right.support - left.support);
  return candidates.length < 2 ? null : { ...base, candidates };
}

function supportFor(poll: RacePoll, name: string): number[] {
  const key = nameKey(name);
  return poll.candidates
    .filter((candidate) => nameKey(candidate.name) === key)
    .map((candidate) => candidate.support);
}

/**
 * One row per state the office was polled in. A race is read as the two
 * leading names in its newest poll, averaged over the recent polls that asked
 * about both of them, which keeps the primary season's hypothetical matchups
 * out of the general election average. VoteHub publishes no party, incumbent,
 * or rating, so the row carries none.
 */
// ponytail: names match by exact trimmed, case-folded text, so "J.B." and "JB"
// would split one candidate in two. Add an alias table if a race shows it.
function buildRaces(raw: VoteHubPoll[], office: Race["office"]): Race[] {
  const races: Race[] = [];
  for (const [subject, polls] of groupBy(raw, (poll) => poll.subject ?? "")) {
    const match = /^(\d{4}) (.+)$/.exec(subject);
    const stateAbbr = match ? STATE_ABBR[match[2]] : undefined;
    if (!match || !stateAbbr) continue;
    const byNewest = [...polls].sort(
      (left, right) => Date.parse(right.end_date ?? "") - Date.parse(left.end_date ?? "")
    );
    const newest = byNewest.map(toRacePoll).find((poll) => poll !== null);
    if (!newest) continue;
    const pair = newest.candidates.slice(0, 2).map((candidate) => candidate.name);
    const matchup = byNewest.filter((poll) =>
      pair.every((name) => readAnswer(poll, [name]) !== null)
    );
    const current = selectCurrent(
      dedupeAndSort(matchup)
        .map(toRacePoll)
        .filter((poll): poll is RacePoll => poll !== null)
    );
    // The dedupe keeps a fielding's LV row over its RV row before either is
    // checked for a sample size, so a pair that only appears in that fielding
    // can be left with no usable poll. The race is left out rather than
    // written with zero support, and the rest of the snapshot still builds.
    if (current.length === 0) continue;
    const candidates = pair
      .map((name) => ({
        name,
        support: average(current.flatMap((poll) => supportFor(poll, name))),
      }))
      .sort((left, right) => right.support - left.support) as Race["candidates"];
    races.push({
      id: `${office.toLowerCase()}-${stateAbbr.toLowerCase()}`,
      state: match[2],
      stateAbbr,
      office,
      year: Number(match[1]),
      candidates,
      margin: Math.round((candidates[0].support - candidates[1].support) * 10) / 10,
      pollCount: current.length,
      lastPolled: current[0].endDate,
      polls: current,
    });
  }
  return races.sort((left, right) => left.state.localeCompare(right.state));
}

export async function buildPollingSnapshotData(): Promise<PollingSnapshot> {
  const now = Date.now();
  const fromDate = (days: number) => new Date(now - days * DAY_MS).toISOString().slice(0, 10);
  const query = (params: Record<string, string>) =>
    fetchPolls(new URLSearchParams({ ...params, min_sample_size: "300" }));
  const [approvalRaw, genericRaw, senateRaw, governorRaw] = await Promise.all([
    query({ poll_type: "approval", subject: "donald-trump", from_date: fromDate(NATIONAL_FROM_DAYS) }),
    query({ poll_type: "generic-ballot", subject: "2026", from_date: fromDate(NATIONAL_FROM_DAYS) }),
    query({ poll_type: "us-senator", from_date: fromDate(RACE_FROM_DAYS) }),
    query({ poll_type: "governor", from_date: fromDate(RACE_FROM_DAYS) }),
  ]);

  const approvalPolls = buildApprovalPolls(approvalRaw);
  const genericBallotPolls = buildGenericPolls(genericRaw);
  if (approvalPolls.length < 5 || genericBallotPolls.length < 5) {
    throw new Error(
      `VoteHub returned too little usable data (${approvalPolls.length} approval, ${genericBallotPolls.length} generic ballot).`
    );
  }
  const senateRaces = buildRaces(senateRaw, "Senate");
  const governorRaces = buildRaces(governorRaw, "Governor");

  const currentApproval = selectCurrent(approvalPolls);
  const currentGeneric = selectCurrent(genericBallotPolls);
  const approve = average(currentApproval.map((poll) => poll.approve));
  const disapprove = average(currentApproval.map((poll) => poll.disapprove));
  const dem = average(currentGeneric.map((poll) => poll.dem));
  const rep = average(currentGeneric.map((poll) => poll.rep));
  const sourceAsOf = [
    approvalPolls[0].endDate,
    genericBallotPolls[0].endDate,
    ...[...senateRaces, ...governorRaces].map((race) => race.lastPolled),
  ]
    .sort()
    .at(-1)!;

  return {
    generatedAt: new Date(now).toISOString(),
    sourceAsOf,
    sourceLabel: "VoteHub Polling API, CC BY 4.0",
    approvalAvg: { approve, disapprove, net: Math.round((approve - disapprove) * 10) / 10 },
    approvalTrend: buildApprovalTrend(approvalPolls),
    approvalPolls: approvalPolls.slice(0, MAX_RECENT_POLLS),
    genericBallotAvg: { dem, rep, margin: Math.round((dem - rep) * 10) / 10 },
    genericBallotPolls: genericBallotPolls.slice(0, MAX_RECENT_POLLS),
    senateRaces,
    governorRaces,
  };
}
