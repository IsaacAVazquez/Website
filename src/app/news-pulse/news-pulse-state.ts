import {
  NEWS_SOURCE_IDS,
  SOURCE_META,
  type NewsFeedId,
} from "@/lib/news-pulse-sources";

export const NEWS_PULSE_ROUTE = "/news-pulse";

export const VIEW_OPTIONS = ["headlines", "coverage", "analysis"] as const;

export type NewsPulseView = (typeof VIEW_OPTIONS)[number];
export type NewsSource = "all" | NewsFeedId;

export interface NewsPulseSearchState {
  view: NewsPulseView;
  source: NewsSource;
}

export const SOURCE_OPTIONS: readonly NewsSource[] = ["all", ...NEWS_SOURCE_IDS];

export const DEFAULT_NEWS_PULSE_STATE: NewsPulseSearchState = {
  view: "headlines",
  source: "all",
};

export const VIEW_LABELS: Record<NewsPulseView, string> = {
  headlines: "Headlines",
  coverage: "Coverage Map",
  analysis: "Analysis",
};

export const SOURCE_LABELS: Record<NewsSource, string> = {
  all: "All Sources",
  ...Object.fromEntries(
    NEWS_SOURCE_IDS.map((source) => [source, SOURCE_META[source].name]),
  ),
} as Record<NewsSource, string>;

type SearchParamInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function readParam(input: SearchParamInput, key: string): string | undefined {
  if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
  const value = input[key];
  return Array.isArray(value) ? value[0] : value;
}

function isValidOption<T extends string>(
  value: string | undefined,
  options: readonly T[],
): value is T {
  return !!value && options.includes(value as T);
}

function normalizeRouteState(state: NewsPulseSearchState): NewsPulseSearchState {
  if (state.view !== "headlines") {
    return { ...state, source: DEFAULT_NEWS_PULSE_STATE.source };
  }

  return state;
}

export function normalizeNewsPulseState(input: SearchParamInput): NewsPulseSearchState {
  const rawView = readParam(input, "view");
  const rawSource = readParam(input, "source");

  return normalizeRouteState({
    view: isValidOption(rawView, VIEW_OPTIONS)
      ? rawView
      : DEFAULT_NEWS_PULSE_STATE.view,
    source: isValidOption(rawSource, SOURCE_OPTIONS)
      ? rawSource
      : DEFAULT_NEWS_PULSE_STATE.source,
  });
}

export function buildNewsPulseHref(state: NewsPulseSearchState): string {
  const normalizedState = normalizeRouteState(state);
  const params = new URLSearchParams();

  if (normalizedState.view !== DEFAULT_NEWS_PULSE_STATE.view) {
    params.set("view", normalizedState.view);
  }

  if (normalizedState.source !== DEFAULT_NEWS_PULSE_STATE.source) {
    params.set("source", normalizedState.source);
  }

  const queryString = params.toString();
  return queryString ? `${NEWS_PULSE_ROUTE}?${queryString}` : NEWS_PULSE_ROUTE;
}

