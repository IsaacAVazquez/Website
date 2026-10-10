// ─── Poll metadata ────────────────────────────────────────────────────────────

export type SampleType = "LV" | "RV" | "A"; // Likely Voters, Registered Voters, Adults
export type PollMethodology = "online" | "phone" | "mixed" | "ivr" | "unknown";

export interface BasePoll {
  id: string;
  pollster: string;
  sponsor?: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  sampleSize: number;
  sampleType: SampleType;
  moe: number | null; // margin of error in points when the source exposes it
  methodology: PollMethodology;
}

// ─── Presidential approval ────────────────────────────────────────────────────

export interface ApprovalPoll extends BasePoll {
  approve: number;
  disapprove: number;
  unsure: number;
}

export interface ApprovalDataPoint {
  date: string; // ISO date (monthly midpoint)
  approve: number;
  disapprove: number;
}

export interface ApprovalAverage {
  approve: number;
  disapprove: number;
  net: number; // approve − disapprove
}

// ─── Generic congressional ballot ─────────────────────────────────────────────

export interface GenericBallotPoll extends BasePoll {
  dem: number;
  rep: number;
  other: number;
}

export interface GenericBallotAverage {
  dem: number;
  rep: number;
  margin: number; // positive = D+, negative = R+
}

// ─── Race polls ───────────────────────────────────────────────────────────────
// VoteHub publishes a race poll as candidate names with a share each and no
// party, incumbency, or rating, so a race carries only what the source does.

export interface RaceCandidate {
  name: string;
  support: number;
}

export interface RacePoll extends BasePoll {
  candidates: RaceCandidate[]; // every answer the pollster published, highest first
}

export interface Race {
  id: string; // "senate-mi"
  state: string;
  stateAbbr: string;
  office: "Senate" | "Governor";
  year: number;
  /** The two leading names in the newest poll, each averaged over `polls`, leader first. */
  candidates: [RaceCandidate, RaceCandidate];
  margin: number; // leader average minus runner-up average
  pollCount: number;
  lastPolled: string; // ISO date
  polls: RacePoll[]; // the polls behind the averages, newest first
}

// ─── Full snapshot ─────────────────────────────────────────────────────────────

export interface PollingSnapshot {
  generatedAt: string; // ISO datetime
  sourceAsOf?: string; // newest field-end date in the source
  sourceLabel: string;
  approvalAvg: ApprovalAverage;
  approvalTrend: ApprovalDataPoint[];
  approvalPolls: ApprovalPoll[];
  genericBallotAvg: GenericBallotAverage;
  genericBallotPolls: GenericBallotPoll[];
  senateRaces: Race[];
  governorRaces: Race[];
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export type PollingView = "overview" | "approval" | "senate" | "governors";

export interface PollingRouteState {
  view: PollingView;
  race: string | null; // race id for sidebar
}
