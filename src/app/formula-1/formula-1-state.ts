import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  Formula1RouteState,
  Formula1Summary,
  Formula1View,
} from "@/types/formula1";

export const FORMULA1_ROUTE = "/formula-1";

export const FORMULA1_VIEW_OPTIONS = [
  "overview",
  "drivers",
  "constructors",
  "calendar",
] as const;

const VALID_VIEWS = new Set<Formula1View>(FORMULA1_VIEW_OPTIONS);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_FORMULA1_STATE: Formula1RouteState = {
  view: "overview",
  meeting: null,
};

export const FORMULA1_VIEW_LABELS: Record<Formula1View, string> = {
  overview: "Overview",
  drivers: "Drivers",
  constructors: "Constructors",
  calendar: "Calendar",
};

export const FORMULA1_VIEW_DESCRIPTIONS: Record<Formula1View, string> = {
  overview: "Season pulse with the next race, title leaders, and the latest swing.",
  drivers: "Full driver championship table with last-race point gains.",
  constructors: "Full constructor table with last-race team movement.",
  calendar: "Season timeline with weekend schedules and race classifications.",
};

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return (input as URLSearchParams).get(key);
  }

  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeMeetingParam(meeting: string | null): string | null {
  if (!meeting) {
    return null;
  }

  const trimmed = meeting.trim();
  return /^[1-9]\d*$/.test(trimmed) ? trimmed : null;
}

export function normalizeFormula1State(input: SearchParamInput): Formula1RouteState {
  const view = readParam(input, "view");
  const meeting = readParam(input, "meeting");

  return {
    view: VALID_VIEWS.has((view ?? "") as Formula1View)
      ? (view as Formula1View)
      : DEFAULT_FORMULA1_STATE.view,
    meeting: normalizeMeetingParam(meeting),
  };
}

export function resolveFormula1State(
  state: Formula1RouteState,
  summary: Pick<Formula1Summary, "meetings" | "defaultMeetingKey">
): Formula1RouteState {
  const validMeetingKeys = new Set(summary.meetings.map((meeting) => meeting.key));
  const defaultMeetingKey = summary.defaultMeetingKey ?? summary.meetings[0]?.key ?? null;

  return {
    view: VALID_VIEWS.has(state.view) ? state.view : DEFAULT_FORMULA1_STATE.view,
    meeting:
      state.meeting && validMeetingKeys.has(state.meeting)
        ? state.meeting
        : defaultMeetingKey,
  };
}

export function buildFormula1Href(
  state: Formula1RouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams,
  defaultMeetingKey?: string | null
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_FORMULA1_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (!state.meeting || state.meeting === defaultMeetingKey) {
    params.delete("meeting");
  } else {
    params.set("meeting", state.meeting);
  }

  const query = params.toString();
  return `${FORMULA1_ROUTE}${query ? `?${query}` : ""}`;
}
