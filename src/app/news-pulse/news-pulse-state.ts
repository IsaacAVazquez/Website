// ---------------------------------------------------------------------------
// News Pulse – URL state management
// ---------------------------------------------------------------------------

export const NEWS_PULSE_ROUTE = "/news-pulse";

export const VIEW_OPTIONS = ["headlines", "coverage", "analysis"] as const;
export const SOURCE_OPTIONS = [
  "all", "atlantic", "nyt", "guardian", "bbc", "npr", "wapo",
] as const;

export type NewsPulseView = (typeof VIEW_OPTIONS)[number];
export type NewsSource = (typeof SOURCE_OPTIONS)[number];

export interface NewsPulseSearchState {
  view: NewsPulseView;
  source: NewsSource;
}

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
  atlantic: "The Atlantic",
  nyt: "NYT",
  guardian: "The Guardian",
  bbc: "BBC",
  npr: "NPR",
  wapo: "Washington Post",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

type SearchParamInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function readParam(input: SearchParamInput, key: string): string | undefined {
  if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
  const v = input[key];
  return Array.isArray(v) ? v[0] : v;
}

function isValidOption<T extends string>(
  value: string | undefined,
  options: readonly T[],
): value is T {
  return !!value && (options as readonly string[]).includes(value);
}

export function normalizeNewsPulseState(
  input: SearchParamInput,
): NewsPulseSearchState {
  const rawView = readParam(input, "view");
  const rawSource = readParam(input, "source");
  return {
    view: isValidOption(rawView, VIEW_OPTIONS)
      ? rawView
      : DEFAULT_NEWS_PULSE_STATE.view,
    source: isValidOption(rawSource, SOURCE_OPTIONS)
      ? rawSource
      : DEFAULT_NEWS_PULSE_STATE.source,
  };
}

export function buildNewsPulseHref(state: NewsPulseSearchState): string {
  const params = new URLSearchParams();
  if (state.view !== DEFAULT_NEWS_PULSE_STATE.view)
    params.set("view", state.view);
  if (state.source !== DEFAULT_NEWS_PULSE_STATE.source)
    params.set("source", state.source);
  const qs = params.toString();
  return qs ? `${NEWS_PULSE_ROUTE}?${qs}` : NEWS_PULSE_ROUTE;
}
