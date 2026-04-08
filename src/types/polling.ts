// ─── Poll metadata ────────────────────────────────────────────────────────────

export type SampleType = "LV" | "RV" | "A"; // Likely Voters, Registered Voters, Adults
export type PollMethodology = "online" | "phone" | "mixed" | "ivr";
export type Party = "D" | "R" | "I" | "L";
export type RaceRating =
  | "Safe D"
  | "Likely D"
  | "Lean D"
  | "Toss-up"
  | "Lean R"
  | "Likely R"
  | "Safe R";

export interface BasePoll {
  id: string;
  pollster: string;
  sponsor?: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  sampleSize: number;
  sampleType: SampleType;
  moe: number; // margin of error in points
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

export interface RaceCandidate {
  name: string;
  party: Party;
  incumbent: boolean;
  support: number;
}

export interface RacePoll extends BasePoll {
  raceId: string;
  candidates: RaceCandidate[];
}

export interface Race {
  id: string;
  state: string;
  stateAbbr: string;
  office: "Senate" | "Governor";
  year: number;
  rating: RaceRating;
  incumbentParty: Party | null;
  openSeat: boolean;
  demAvg: number;  // polling average
  repAvg: number;
  marginLabel: string; // e.g. "D+3" | "R+2" | "Even"
  pollCount: number;
  lastPolled: string; // ISO date
  polls: RacePoll[];
}

// ─── Full snapshot ─────────────────────────────────────────────────────────────

export interface PollingSnapshot {
  generatedAt: string; // ISO datetime
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
