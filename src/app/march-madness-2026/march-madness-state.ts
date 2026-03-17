export const MARCH_MADNESS_ROUTE = "/march-madness-2026";

export const VIEW_OPTIONS = ["bracket", "picks", "analytics", "time-zones"] as const;
export const REGION_OPTIONS = ["east", "west", "south", "midwest"] as const;
export const ANALYTICS_OPTIONS = ["rankings", "s-curve", "injuries"] as const;

export type MarchMadnessView = (typeof VIEW_OPTIONS)[number];
export type MarchMadnessRegion = (typeof REGION_OPTIONS)[number];
export type MarchMadnessAnalytics = (typeof ANALYTICS_OPTIONS)[number];

export interface MarchMadnessSearchState {
  view: MarchMadnessView;
  region: MarchMadnessRegion;
  analytics: MarchMadnessAnalytics;
}

export const DEFAULT_MARCH_MADNESS_STATE: MarchMadnessSearchState = {
  view: "bracket",
  region: "east",
  analytics: "rankings",
};

export const VIEW_LABELS: Record<MarchMadnessView, string> = {
  bracket: "Bracket",
  picks: "Picks",
  analytics: "Analytics",
  "time-zones": "Time Zones",
};

export const REGION_LABELS: Record<MarchMadnessRegion, string> = {
  east: "East",
  west: "West",
  south: "South",
  midwest: "Midwest",
};

export const ANALYTICS_LABELS: Record<MarchMadnessAnalytics, string> = {
  rankings: "Rankings",
  "s-curve": "S-Curve",
  injuries: "Injuries",
};

const isValidOption = <T extends readonly string[]>(
  value: string | null | undefined,
  options: T
): value is T[number] => Boolean(value && options.includes(value as T[number]));

export function normalizeMarchMadnessState(searchParams?: {
  view?: string;
  region?: string;
  analytics?: string;
}): MarchMadnessSearchState {
  return {
    view: isValidOption(searchParams?.view, VIEW_OPTIONS)
      ? searchParams!.view
      : DEFAULT_MARCH_MADNESS_STATE.view,
    region: isValidOption(searchParams?.region, REGION_OPTIONS)
      ? searchParams!.region
      : DEFAULT_MARCH_MADNESS_STATE.region,
    analytics: isValidOption(searchParams?.analytics, ANALYTICS_OPTIONS)
      ? searchParams!.analytics
      : DEFAULT_MARCH_MADNESS_STATE.analytics,
  };
}

export function buildMarchMadnessHref(
  state: Partial<MarchMadnessSearchState> & { hash?: string } = {}
): string {
  const nextState = {
    ...DEFAULT_MARCH_MADNESS_STATE,
    ...state,
  };

  const params = new URLSearchParams();

  if (nextState.view !== DEFAULT_MARCH_MADNESS_STATE.view) {
    params.set("view", nextState.view);
  }

  if (nextState.region !== DEFAULT_MARCH_MADNESS_STATE.region) {
    params.set("region", nextState.region);
  }

  if (nextState.analytics !== DEFAULT_MARCH_MADNESS_STATE.analytics) {
    params.set("analytics", nextState.analytics);
  }

  const query = params.toString();
  const hash = state.hash ? `#${state.hash}` : "";

  return `${MARCH_MADNESS_ROUTE}${query ? `?${query}` : ""}${hash}`;
}
