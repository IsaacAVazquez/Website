import type { ReadonlyURLSearchParams } from "next/navigation";
import type { MissionControlSearchState } from "@/types/spacex";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

const MISSION_CONTROL_ROUTE = "/spacex-mission-control";

const STATUSES = ["upcoming", "past"] as const;
const PANELS = ["overview", "vehicle", "payloads", "links"] as const;
const LAUNCH_ID_PATTERN =
  /^(?:[a-f0-9]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export const DEFAULT_MISSION_CONTROL_STATE: MissionControlSearchState = {
  status: "upcoming",
  launch: null,
  panel: "overview",
};

function normalizeLaunchId(rawValue: string | null): string | null {
  const trimmed = rawValue?.trim() ?? "";
  return LAUNCH_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function normalizeMissionControlState(
  input: SearchParamInput
): MissionControlSearchState {
  return {
    status: readEnum(input, "status", STATUSES, DEFAULT_MISSION_CONTROL_STATE.status),
    launch: normalizeLaunchId(readParam(input, "launch")),
    panel: readEnum(input, "panel", PANELS, DEFAULT_MISSION_CONTROL_STATE.panel),
  };
}

export function buildMissionControlHref(
  state: MissionControlSearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    MISSION_CONTROL_ROUTE,
    { status: state.status, launch: state.launch || null, panel: state.panel },
    DEFAULT_MISSION_CONTROL_STATE,
    baseSearchParams
  );
}
