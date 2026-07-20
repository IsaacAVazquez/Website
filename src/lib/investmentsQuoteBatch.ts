import { fetchFinnhubQuote } from "@/lib/finnhub";
import type { StockQuote } from "@/types/investment";

const PROVIDER_DEADLINE_ERROR =
  "Market quote request reached its time limit. Showing the latest saved data instead.";
const MAX_PROVIDER_CONCURRENCY = 5;
const PROVIDER_REQUEST_BUDGET_MS = 6_000;

export async function fetchQuotesWithConcurrency(
  symbols: string[],
  requestBudgetMs = PROVIDER_REQUEST_BUDGET_MS,
): Promise<StockQuote[]> {
  const quotes = new Array<StockQuote>(symbols.length);
  let nextIndex = 0;
  const deadlineAt = Date.now() + requestBudgetMs;

  const deadlineQuote = (symbol: string): StockQuote => ({
    symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    dayHigh: 0,
    dayLow: 0,
    open: 0,
    previousClose: 0,
    volume: 0,
    marketCap: 0,
    name: symbol,
    error: PROVIDER_DEADLINE_ERROR,
  });

  const fetchBeforeDeadline = (symbol: string): Promise<StockQuote> => {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) return Promise.resolve(deadlineQuote(symbol));

    return new Promise((resolve) => {
      let settled = false;
      const finish = (quote: StockQuote) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(quote);
      };
      const timeoutId = setTimeout(
        () => finish(deadlineQuote(symbol)),
        remainingMs,
      );
      void fetchFinnhubQuote(symbol, { timeoutMs: remainingMs }).then(
        finish,
        () => finish(deadlineQuote(symbol)),
      );
    });
  };

  async function worker() {
    while (nextIndex < symbols.length && Date.now() < deadlineAt) {
      const index = nextIndex;
      nextIndex += 1;
      quotes[index] = await fetchBeforeDeadline(symbols[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(MAX_PROVIDER_CONCURRENCY, symbols.length) },
      () => worker(),
    ),
  );

  return Array.from(
    { length: symbols.length },
    (_, index) => quotes[index] ?? deadlineQuote(symbols[index]),
  );
}
