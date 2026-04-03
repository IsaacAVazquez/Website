import type { ReadonlyURLSearchParams } from "next/navigation";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import type { LaLigaClub, LaLigaRouteState, LaLigaView } from "@/types/la-liga";

export const LA_LIGA_ROUTE = "/la-liga";

const VALID_VIEWS = new Set<LaLigaView>(["table", "title-race", "europe", "relegation"]);
const VALID_CLUB_IDS = new Set(laLigaSnapshot.clubs.map((club) => club.id));

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_LA_LIGA_STATE: LaLigaRouteState = {
  view: "table",
  club: laLigaSnapshot.clubs[0]?.id ?? "barcelona",
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

export function filterClubsForView(view: LaLigaView): LaLigaClub[] {
  switch (view) {
    case "title-race":
      return laLigaSnapshot.clubs.slice(0, 4);
    case "europe":
      return laLigaSnapshot.clubs.slice(0, 6);
    case "relegation":
      return laLigaSnapshot.clubs.slice(-5);
    case "table":
    default:
      return laLigaSnapshot.clubs;
  }
}

export function getDefaultClubForView(view: LaLigaView): string {
  return filterClubsForView(view)[0]?.id ?? DEFAULT_LA_LIGA_STATE.club;
}

export function normalizeLaLigaState(input: SearchParamInput): LaLigaRouteState {
  const view = readParam(input, "view");
  const club = readParam(input, "club");

  return {
    view: VALID_VIEWS.has((view ?? "") as LaLigaView)
      ? (view as LaLigaView)
      : DEFAULT_LA_LIGA_STATE.view,
    club: VALID_CLUB_IDS.has(club ?? "")
      ? (club as string)
      : DEFAULT_LA_LIGA_STATE.club,
  };
}

export function buildLaLigaHref(
  state: LaLigaRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_LA_LIGA_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (state.club === DEFAULT_LA_LIGA_STATE.club && state.view === DEFAULT_LA_LIGA_STATE.view) {
    params.delete("club");
  } else {
    params.set("club", state.club);
  }

  const query = params.toString();
  return `${LA_LIGA_ROUTE}${query ? `?${query}` : ""}`;
}
