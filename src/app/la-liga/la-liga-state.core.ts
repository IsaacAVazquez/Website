import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  LaLigaClub,
  LaLigaDetailTab,
  LaLigaRouteState,
  LaLigaView,
} from "@/types/la-liga";

// Pure, snapshot-free route-state core for /la-liga. Importing this module never
// pulls the multi-thousand-line `laLigaSnapshot` into the bundle, so the client
// can derive route state from the lean `summary` prop it already receives
// instead of dragging the full snapshot into browser JS. The snapshot-bound
// wrappers in `la-liga-state.ts` reuse these helpers for server + test code.

export const LA_LIGA_ROUTE = "/la-liga";

/** Ultimate static fallback club id when no standings data exists. */
export const LA_LIGA_FALLBACK_CLUB = "barcelona";

const VALID_VIEWS = new Set<LaLigaView>(["table", "title-race", "europe", "relegation"]);

export const LA_LIGA_DETAIL_OPTIONS = ["club", "fixtures", "scorers"] as const;
const VALID_DETAILS = new Set<LaLigaDetailTab>(LA_LIGA_DETAIL_OPTIONS);

export type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

type ClubAliasSource = { id: string; tla: string | null };

export function buildClubAliasMap(teams: readonly ClubAliasSource[]): Map<string, string> {
  return new Map(
    teams.flatMap((team) => {
      const canonicalClubId = team.tla?.toLowerCase() || team.id;
      return [
        [team.id.toLowerCase(), canonicalClubId],
        [canonicalClubId, canonicalClubId],
      ] as const;
    })
  );
}

export function canonicalizeClubId(
  clubId: string | null | undefined,
  aliasMap: Map<string, string>
): string | null {
  if (!clubId) {
    return null;
  }

  return aliasMap.get(clubId.trim().toLowerCase()) ?? null;
}

export function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

export function filterClubs(clubs: readonly LaLigaClub[], view: LaLigaView): LaLigaClub[] {
  switch (view) {
    case "title-race":
      return clubs.slice(0, 4);
    case "europe":
      return clubs.slice(0, 6);
    case "relegation":
      return clubs.slice(-5);
    case "table":
    default:
      return [...clubs];
  }
}

export function getDefaultClub(
  clubs: readonly LaLigaClub[],
  view: LaLigaView,
  fallback: string
): string {
  return filterClubs(clubs, view)[0]?.id ?? fallback;
}

export function resolveDefaultState(clubs: readonly LaLigaClub[]): LaLigaRouteState {
  return {
    view: "table",
    club: clubs[0]?.id ?? LA_LIGA_FALLBACK_CLUB,
    detail: "club",
  };
}

export function normalizeState(
  input: SearchParamInput,
  defaultState: LaLigaRouteState,
  aliasMap: Map<string, string>
): LaLigaRouteState {
  const view = readParam(input, "view");
  const club = canonicalizeClubId(readParam(input, "club"), aliasMap);
  const detail = readParam(input, "detail");

  return {
    view: VALID_VIEWS.has((view ?? "") as LaLigaView)
      ? (view as LaLigaView)
      : defaultState.view,
    club: club ?? defaultState.club,
    detail: VALID_DETAILS.has((detail ?? "") as LaLigaDetailTab)
      ? (detail as LaLigaDetailTab)
      : defaultState.detail,
  };
}

export function buildHref(
  state: LaLigaRouteState,
  defaultState: LaLigaRouteState,
  aliasMap: Map<string, string>,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );
  const canonicalClubId = canonicalizeClubId(state.club, aliasMap) ?? defaultState.club;

  if (state.view === defaultState.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (canonicalClubId === defaultState.club && state.view === defaultState.view) {
    params.delete("club");
  } else {
    params.set("club", canonicalClubId);
  }

  if (state.detail && state.detail !== defaultState.detail) {
    params.set("detail", state.detail);
  } else {
    params.delete("detail");
  }

  const query = params.toString();
  return `${LA_LIGA_ROUTE}${query ? `?${query}` : ""}`;
}
