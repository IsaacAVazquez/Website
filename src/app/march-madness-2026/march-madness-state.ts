import { buildHref, readEnum } from "@/lib/searchParams";

const MARCH_MADNESS_ROUTE = "/march-madness-2026";

const VIEW_OPTIONS = ["bracket", "picks", "analytics", "time-zones"] as const;
const REGION_OPTIONS = ["east", "west", "south", "midwest"] as const;
const ANALYTICS_OPTIONS = ["rankings", "s-curve", "injuries"] as const;

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
  "time-zones": "Time zones",
};

export const REGION_LABELS: Record<MarchMadnessRegion, string> = {
  east: "East",
  west: "West",
  south: "South",
  midwest: "Midwest",
};

export const ANALYTICS_LABELS: Record<MarchMadnessAnalytics, string> = {
  rankings: "Rankings",
  "s-curve": "S-curve",
  injuries: "Injuries",
};

export function normalizeMarchMadnessState(
  searchParams: { view?: string; region?: string; analytics?: string } = {}
): MarchMadnessSearchState {
  return {
    view: readEnum(searchParams, "view", VIEW_OPTIONS, DEFAULT_MARCH_MADNESS_STATE.view),
    region: readEnum(searchParams, "region", REGION_OPTIONS, DEFAULT_MARCH_MADNESS_STATE.region),
    analytics: readEnum(
      searchParams,
      "analytics",
      ANALYTICS_OPTIONS,
      DEFAULT_MARCH_MADNESS_STATE.analytics
    ),
  };
}

export function buildMarchMadnessHref(
  state: Partial<MarchMadnessSearchState> & { hash?: string; pick?: string | null } = {}
): string {
  const next = { ...DEFAULT_MARCH_MADNESS_STATE, ...state };
  const href = buildHref(
    MARCH_MADNESS_ROUTE,
    {
      view: next.view,
      region: next.region,
      analytics: next.analytics,
      // An open pick only means something on the picks board.
      pick: next.view === "picks" ? state.pick || null : null,
    },
    DEFAULT_MARCH_MADNESS_STATE
  );
  return state.hash ? `${href}#${state.hash}` : href;
}
