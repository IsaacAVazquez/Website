import type { ReadonlyURLSearchParams } from "next/navigation";

/** Route state arrives as client search params or as a server page's searchParams record. */
export type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

/** First value for `key`, or null when it is absent. */
export function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as Record<string, string | string[] | undefined | null>)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

/** Resolves an id or alias (any case, padded) to its canonical id, or null. */
export function canonicalizeId(
  id: string | null | undefined,
  aliasMap: Map<string, string>
): string | null {
  if (!id) return null;
  return aliasMap.get(id.trim().toLowerCase()) ?? null;
}

type TeamRouteState<V extends string> = { view: V; team: string };

/**
 * `?view=&team=` state shared by the NBA, NFL, and MLB dashboards. Defaults
 * stay out of the URL, and a team is written whenever the view is not default.
 */
export function createTeamRouteState<V extends string>(route: string, views: readonly V[]) {
  const validViews = new Set<string>(views);

  function normalizeState(
    input: SearchParamInput,
    defaultState: TeamRouteState<V>,
    aliasMap: Map<string, string>
  ): TeamRouteState<V> {
    const view = readParam(input, "view");
    const team = canonicalizeId(readParam(input, "team"), aliasMap);

    return {
      view: view && validViews.has(view) ? (view as V) : defaultState.view,
      team: team ?? defaultState.team,
    };
  }

  function buildHref(
    state: TeamRouteState<V>,
    defaultState: TeamRouteState<V>,
    aliasMap: Map<string, string>,
    baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
  ): string {
    const params = new URLSearchParams(
      baseSearchParams ? Array.from(baseSearchParams.entries()) : []
    );
    const canonical = canonicalizeId(state.team, aliasMap) ?? defaultState.team;

    if (state.view === defaultState.view) {
      params.delete("view");
    } else {
      params.set("view", state.view);
    }

    if (canonical === defaultState.team && state.view === defaultState.view) {
      params.delete("team");
    } else {
      params.set("team", canonical);
    }

    const query = params.toString();
    return `${route}${query ? `?${query}` : ""}`;
  }

  return { normalizeState, buildHref };
}

/**
 * Lowercased id and abbreviation of every team mapped to its canonical id,
 * the map `canonicalizeId` reads. `canonical` lets a dashboard lowercase its ids.
 */
export function buildTeamAliasMap<T extends { id: string }>(
  teams: readonly T[],
  abbreviation: (team: T) => string,
  canonical: (team: T) => string = (team) => team.id
): Map<string, string> {
  return new Map(
    teams.flatMap((team) => {
      const id = canonical(team);
      return [
        [team.id.toLowerCase(), id],
        [abbreviation(team).toLowerCase(), id],
      ] as const;
    })
  );
}
