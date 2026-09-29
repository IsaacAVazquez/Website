// ============================================================
// Odds adapter — The Odds API (the-odds-api.com)
//
// Build-time only; nothing in the engine or the runtime app calls
// this. Fetches h2h + totals in decimal for one sport key and
// reduces each event to a single bookmaker's prices, preferring
// sharper books when they're present. Swappable: anything that
// returns ProviderOddsEvent[] can stand in.
// ============================================================

export interface ProviderOddsEvent {
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmaker: string;
  moneyline: { home: number; draw: number | null; away: number };
  totals: { line: number; over: number | null; under: number | null } | null;
}

interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

/** Sharper books first; the tail is whatever a region tends to carry. */
const PREFERRED_BOOKMAKERS = [
  "pinnacle",
  "betfair_ex_eu",
  "betfair_ex_uk",
  "bet365",
  "williamhill",
  "unibet_eu",
  "draftkings",
  "fanduel",
];

// A request costs markets x regions credits, so h2h and totals over one
// region is 2. Four runs a day is 8 credits, 248 in a 31 day month, against
// the free plan's 500. Adding uk and us makes it 6 a request and 744 a
// month. The engine prices one book per event, and Pinnacle and Betfair
// Exchange, the first two preferences above, both sit in eu.
const REGIONS = "eu";

function pickBookmaker(event: OddsApiEvent): OddsApiBookmaker | null {
  for (const key of PREFERRED_BOOKMAKERS) {
    const found = event.bookmakers.find((book) => book.key === key);
    if (found) return found;
  }
  return event.bookmakers[0] ?? null;
}

function extractMoneyline(
  event: OddsApiEvent,
  book: OddsApiBookmaker,
): ProviderOddsEvent["moneyline"] | null {
  const market = book.markets.find((m) => m.key === "h2h");
  if (!market) return null;
  const home = market.outcomes.find((o) => o.name === event.home_team)?.price;
  const away = market.outcomes.find((o) => o.name === event.away_team)?.price;
  const draw = market.outcomes.find((o) => o.name === "Draw")?.price ?? null;
  if (home === undefined || away === undefined) return null;
  return { home, draw, away };
}

function extractTotals(book: OddsApiBookmaker): ProviderOddsEvent["totals"] {
  const market = book.markets.find((m) => m.key === "totals");
  if (!market) return null;
  const over = market.outcomes.find((o) => o.name === "Over");
  const under = market.outcomes.find((o) => o.name === "Under");
  const line = over?.point ?? under?.point;
  if (line === undefined) return null;
  return { line, over: over?.price ?? null, under: under?.price ?? null };
}

/**
 * Fetch current odds for a sport key (e.g. "soccer_epl"). Throws on HTTP
 * errors with a `status` so the shared retry helper can classify them.
 */
export async function fetchTheOddsApiEvents(
  sportKey: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ProviderOddsEvent[]> {
  const url =
    `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds` +
    `?apiKey=${encodeURIComponent(apiKey)}&regions=${REGIONS}&markets=h2h,totals&oddsFormat=decimal&dateFormat=iso`;
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw Object.assign(new Error(`The Odds API responded ${response.status} for ${sportKey}`), {
      status: response.status,
      headers: response.headers,
    });
  }
  const events = (await response.json()) as OddsApiEvent[];
  const mapped: ProviderOddsEvent[] = [];
  for (const event of events) {
    const book = pickBookmaker(event);
    if (!book) continue;
    const moneyline = extractMoneyline(event, book);
    if (!moneyline) continue;
    mapped.push({
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
      bookmaker: book.key,
      moneyline,
      totals: extractTotals(book),
    });
  }
  return mapped;
}
