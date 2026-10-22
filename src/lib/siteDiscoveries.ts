/** Only public, known destinations go on a receipt. Queries and user entries never do. */
export const VISIT_NAMES: Readonly<Record<string, string>> = {
  "/": "A look around",
  "/about": "Meet the proprietor",
  "/portfolio": "Product browsing",
  "/writing": "Something to read",
  "/dashboards": "Dashboard browsing",
  "/resume": "Resume inspection",
  "/contact": "Start a conversation",
  "/fantasy-football": "Fantasy football research",
  "/fantasy-football/draft-tracker": "Draft preparation",
  "/fantasy-football/best-ball": "Best ball research",
  "/fantasy-football/best-ball/draft-tracker": "Best ball drafting",
  "/fantasy-football/weekly": "Weekly lineup deliberation",
  "/fantasy-football/waivers": "Waiver wire browsing",
  "/fantasy-football/trade-calculator": "Trade negotiations",
  "/fantasy-football/mock-draft": "One more mock draft",
  "/formula-1": "Race weekend research",
  "/fantasy-formula-1": "Fantasy pit stop",
  "/premier-league": "Premier League checking",
  "/la-liga": "La Liga checking",
  "/nba": "Basketball research",
  "/nfl": "Football research",
  "/mlb": "Baseball research",
  "/golf": "Leaderboard inspection",
  "/score-pools": "Score prediction",
  "/museum-log": "Museum wandering",
  "/food-map": "Dinner deliberation",
  "/wine-cellar": "Wine browsing",
  "/recipe-finder": "Something for dinner",
  "/travel": "Trip daydreaming",
  "/travel-deals": "Flight browsing",
  "/bay-area-transit": "Waiting for a train",
  "/spacex-mission-control": "Waiting for a rocket",
  "/investments": "Investment research",
  "/arcade": "A game or several",
  "/news-pulse": "News checking",
  "/earthquake-pulse": "Seismic curiosity",
  "/polling-aggregator": "Polling research",
  "/frontier-models": "Model comparison",
  "/github-trending-pulse": "Repository browsing",
  "/tech-startup-tracker": "Startup research",
  "/agent-build-index": "Build browsing",
  "/ai-dev-tools": "Tool comparison",
  "/now": "Checking in",
  "/changelog": "Checking what changed",
};

export interface VisitEntry { path: string; count: number }
export const RECEIPT_KEY = "site-visit-receipt-v1";
export const GUESTBOOK_KEY = "site-1997-guestbook-v1";

export function parseReceipt(raw: string | null): VisitEntry[] {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.filter((entry): entry is VisitEntry => {
      if (!entry || typeof entry !== "object") return false;
      const { path, count } = entry;
      if (typeof path !== "string" || !Object.hasOwn(VISIT_NAMES, path) || seen.has(path)
        || !Number.isInteger(count) || count < 1 || count > 999) return false;
      seen.add(path);
      return true;
    }).slice(0, 40).map(({ path, count }) => ({ path, count }));
  } catch { return []; }
}

export function addReceiptVisit(entries: VisitEntry[], path: string): VisitEntry[] {
  if (!Object.hasOwn(VISIT_NAMES, path)) return entries;
  const previous = entries.find((entry) => entry.path === path);
  if (previous) return entries.map((entry) => entry.path === path
    ? { path, count: Math.min(999, entry.count + 1) } : entry);
  return [...entries, { path, count: 1 }].slice(-40);
}

export function cleanGuestMessage(value: string): string {
  // eslint-disable-next-line no-control-regex -- discard control characters from restored guestbook text
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

export function parseGuestbook(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string")
      .map(cleanGuestMessage).filter(Boolean).slice(0, 12) : [];
  } catch { return []; }
}

export function isScoutQuery(query: string): boolean {
  return /^(isaac|isaac vazquez)$/i.test(query.trim().replace(/\s+/g, " "));
}

export const PAINTERS = ["monet", "van-gogh", "seurat", "hopper", "lichtenstein"] as const;

export function isRegistered(offsets: readonly number[]): boolean {
  return offsets.length === 4 && offsets.every((offset) => Number.isFinite(offset) && Math.abs(offset) <= 1);
}
