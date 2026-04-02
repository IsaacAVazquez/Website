import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  MissionControlPanel,
  MissionControlSearchState,
  MissionControlStatus,
} from "@/types/spacex";

export const MISSION_CONTROL_ROUTE = "/spacex-mission-control";

const VALID_STATUS = new Set<MissionControlStatus>(["upcoming", "past"]);
const VALID_PANELS = new Set<MissionControlPanel>([
  "overview",
  "vehicle",
  "payloads",
  "links",
]);
const LAUNCH_ID_PATTERN = /^[a-f0-9]{24}$/i;

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_MISSION_CONTROL_STATE: MissionControlSearchState = {
  status: "upcoming",
  launch: null,
  panel: "overview",
};

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeLaunchId(rawValue: string | null): string | null {
  const trimmed = rawValue?.trim() ?? "";
  return LAUNCH_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function normalizeMissionControlState(
  input: SearchParamInput
): MissionControlSearchState {
  const status = readParam(input, "status");
  const launch = readParam(input, "launch");
  const panel = readParam(input, "panel");

  return {
    status: VALID_STATUS.has((status ?? "") as MissionControlStatus)
      ? (status as MissionControlStatus)
      : DEFAULT_MISSION_CONTROL_STATE.status,
    launch: normalizeLaunchId(launch),
    panel: VALID_PANELS.has((panel ?? "") as MissionControlPanel)
      ? (panel as MissionControlPanel)
      : DEFAULT_MISSION_CONTROL_STATE.panel,
  };
}

export function buildMissionControlHref(
  state: MissionControlSearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.status === DEFAULT_MISSION_CONTROL_STATE.status) {
    params.delete("status");
  } else {
    params.set("status", state.status);
  }

  if (state.launch) {
    params.set("launch", state.launch);
  } else {
    params.delete("launch");
  }

  if (state.panel === DEFAULT_MISSION_CONTROL_STATE.panel) {
    params.delete("panel");
  } else {
    params.set("panel", state.panel);
  }

  const query = params.toString();
  return `${MISSION_CONTROL_ROUTE}${query ? `?${query}` : ""}`;
}
