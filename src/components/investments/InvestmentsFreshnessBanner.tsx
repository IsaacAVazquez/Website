import { DataFreshnessIndicator } from "@/components/investments/DataFreshnessIndicator";

const STALE_THRESHOLD_DAYS = 7;

interface InvestmentsFreshnessBannerProps {
  lastUpdated: string | null;
  symbolCount: number;
  failedCount?: number;
}

function diffDays(lastUpdated: string | null): number | null {
  if (!lastUpdated) return null;
  const ts = Date.parse(lastUpdated);
  if (!Number.isFinite(ts)) return null;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

export function InvestmentsFreshnessBanner({
  lastUpdated,
  symbolCount,
  failedCount,
}: InvestmentsFreshnessBannerProps) {
  const days = diffDays(lastUpdated);
  const isStale = days !== null && days >= STALE_THRESHOLD_DAYS;

  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-4 py-3 text-xs  sm:text-xs"
      role="status"
      aria-label="Investments data freshness"
    >
      <DataFreshnessIndicator lastUpdated={lastUpdated} mode="dataset" />
      {symbolCount > 0 && (
        <span className="text-[var(--home-ink-muted)]">
          <span className="font-semibold text-[var(--home-ink)]">{symbolCount}</span>{" "}
          {symbolCount === 1 ? "security" : "securities"}
          {failedCount && failedCount > 0 ? (
            <span className="ml-1 text-[var(--home-warning)]">
              ({failedCount} unavailable)
            </span>
          ) : null}
        </span>
      )}
      <span className="text-[var(--home-ink-muted)]">
        Market quotes via Finnhub
      </span>
      {isStale && (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--home-warning)_18%,var(--home-paper))] px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-[var(--home-warning)]"
          title="The automated refresh has not produced newer data. Runs Mondays and Thursdays at 22:15 UTC."
        >
          Refresh pending
        </span>
      )}
    </div>
  );
}
