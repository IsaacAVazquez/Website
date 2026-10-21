import {
  NEWS_SOURCE_IDS,
  SOURCE_META,
  type NewsFeedId,
} from "@/lib/news-pulse-sources";
import { buildHref, readEnum, type SearchParamInput } from "@/lib/searchParams";

const NEWS_PULSE_ROUTE = "/news-pulse";

export type NewsSource = "all" | NewsFeedId;

// The page is one front page since the 2026-10-12 redesign, so the old
// ?view=coverage and ?view=analysis links land on it and only the headline
// source filter lives in the URL.
export interface NewsPulseSearchState {
  source: NewsSource;
}

export const SOURCE_OPTIONS: readonly NewsSource[] = ["all", ...NEWS_SOURCE_IDS];

const DEFAULT_NEWS_PULSE_STATE: NewsPulseSearchState = {
  source: "all",
};

export const SOURCE_LABELS: Record<NewsSource, string> = {
  all: "All sources",
  ...Object.fromEntries(
    NEWS_SOURCE_IDS.map((source) => [source, SOURCE_META[source].name]),
  ),
} as Record<NewsSource, string>;

export function normalizeNewsPulseState(input: SearchParamInput): NewsPulseSearchState {
  return {
    source: readEnum(input, "source", SOURCE_OPTIONS, DEFAULT_NEWS_PULSE_STATE.source),
  };
}

export function buildNewsPulseHref(state: NewsPulseSearchState): string {
  return buildHref(NEWS_PULSE_ROUTE, { source: state.source }, DEFAULT_NEWS_PULSE_STATE);
}
