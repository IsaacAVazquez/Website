import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  Formula1RouteState,
  Formula1Summary,
  Formula1View,
} from "@/types/formula1";
import { enumValue } from "@/lib/utils";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

const FORMULA1_ROUTE = "/formula-1";

export const FORMULA1_VIEW_OPTIONS = [
  "overview",
  "drivers",
  "constructors",
  "calendar",
] as const;

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

function normalizeMeetingParam(meeting: string | null): string | null {
  const trimmed = meeting?.trim() ?? "";
  return /^[1-9]\d*$/.test(trimmed) ? trimmed : null;
}

export function normalizeFormula1State(input: SearchParamInput): Formula1RouteState {
  return {
    view: readEnum(input, "view", FORMULA1_VIEW_OPTIONS, DEFAULT_FORMULA1_STATE.view),
    meeting: normalizeMeetingParam(readParam(input, "meeting")),
  };
}

export function resolveFormula1State(
  state: Formula1RouteState,
  summary: Pick<Formula1Summary, "meetings" | "defaultMeetingKey">
): Formula1RouteState {
  const validMeetingKeys = new Set(summary.meetings.map((meeting) => meeting.key));
  const defaultMeetingKey = summary.defaultMeetingKey ?? summary.meetings[0]?.key ?? null;

  return {
    view: enumValue(state.view, FORMULA1_VIEW_OPTIONS, DEFAULT_FORMULA1_STATE.view),
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
  return buildHref(
    FORMULA1_ROUTE,
    { view: state.view, meeting: state.meeting || null },
    { view: DEFAULT_FORMULA1_STATE.view, meeting: defaultMeetingKey },
    baseSearchParams
  );
}
