import type {
  FantasyTradeEvaluation,
  FantasyTradePlayerEvaluation,
  FantasyTradeSideEvaluation,
} from "@/lib/fantasyTrade";

interface TradeRosterImpactProps {
  result: FantasyTradeEvaluation | null;
  valuesAvailable: boolean;
  giveCount: number;
  getCount: number;
}

interface PackageSummary {
  starters: number;
  depth: number;
}

interface RosterRow {
  label: "Your roster" | "Other roster";
  before: PackageSummary | null;
  after: PackageSummary | null;
  opened: number;
  cuts: number;
}

const METRIC_CELL_BORDERS = [
  "border-b border-r md:border-b-0",
  "border-b md:border-b-0 md:border-r",
  "border-r",
  "",
] as const;

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStarterLevel(player: FantasyTradePlayerEvaluation): boolean {
  const expertStarter = player.replacementCutoffs.expertStarter;
  const marketStarter = player.replacementCutoffs.marketStarter;

  return (
    isFiniteNumber(player.expertRank) &&
    isFiniteNumber(player.marketAdp) &&
    isFiniteNumber(expertStarter) &&
    isFiniteNumber(marketStarter) &&
    player.expertRank <= expertStarter &&
    player.marketAdp <= marketStarter
  );
}

function summarizePackage(side: FantasyTradeSideEvaluation): PackageSummary {
  const starters = side.players.filter(isStarterLevel).length;
  return {
    starters,
    depth: Math.max(0, side.valuedPlayerCount - starters),
  };
}

function formatTransition(
  before: number | undefined,
  after: number | undefined,
): string {
  if (before === undefined || after === undefined) return "-- → --";
  return `${before} → ${after}`;
}

function normalizePackageCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function MetricCell({
  label,
  value,
  index,
}: {
  label: string;
  value: string | number;
  index: number;
}) {
  return (
    <div
      role="cell"
      aria-label={`${label}: ${value}`}
      className={`min-w-0 px-3 py-3 sm:px-4 md:flex md:min-h-20 md:items-center md:justify-center md:py-4 ${METRIC_CELL_BORDERS[index] ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="block font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)] md:hidden"
      >
        {label}
      </span>
      <span className="mt-1 block font-mono text-base font-semibold tabular-nums text-[var(--home-ink)] md:mt-0 md:text-center">
        {value}
      </span>
    </div>
  );
}

export function TradeRosterImpact({
  result,
  valuesAvailable,
  giveCount,
  getCount,
}: TradeRosterImpactProps) {
  const canShowValues = valuesAvailable && result !== null;
  const sideA = canShowValues ? summarizePackage(result.sideA) : null;
  const sideB = canShowValues ? summarizePackage(result.sideB) : null;
  const normalizedGiveCount = normalizePackageCount(giveCount);
  const normalizedGetCount = normalizePackageCount(getCount);
  const yourRosterDelta = normalizedGiveCount - normalizedGetCount;
  const rows: RosterRow[] = [
    {
      label: "Your roster",
      before: sideA,
      after: sideB,
      opened: Math.max(0, yourRosterDelta),
      cuts: Math.max(0, -yourRosterDelta),
    },
    {
      label: "Other roster",
      before: sideB,
      after: sideA,
      opened: Math.max(0, -yourRosterDelta),
      cuts: Math.max(0, yourRosterDelta),
    },
  ];

  return (
    <section
      aria-labelledby="trade-roster-impact-title"
      className="min-w-0 border-y border-[var(--home-rule)] bg-[var(--home-paper)]"
    >
      <header className="border-b border-[var(--home-rule)] px-4 py-4 sm:px-5">
        <h2
          id="trade-roster-impact-title"
          className="text-lg font-semibold tracking-[-0.03em] text-[var(--home-ink)]"
        >
          Package fit after the trade
        </h2>
      </header>

      <div role="table" aria-label="Package fit after the trade">
        <div
          role="row"
          className="hidden grid-cols-[minmax(8rem,1.15fr)_repeat(4,minmax(0,1fr))] border-b border-[var(--home-rule)] md:grid"
        >
          <span role="columnheader" className="px-4 py-2.5 font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
            Roster
          </span>
          {[
            "Starter-level assets",
            "Depth assets",
            "Roster spots opened",
            "Required cuts",
          ].map((label) => (
            <span
              key={label}
              role="columnheader"
              className="border-l border-[var(--home-rule)] px-3 py-2.5 text-center font-mono text-3xs uppercase leading-4 tracking-[0.1em] text-[var(--home-ink-muted)]"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="divide-y divide-[var(--home-rule)]">
          {rows.map((row) => (
            <div
              key={row.label}
              role="row"
              className="grid min-w-0 md:grid-cols-[minmax(8rem,1.15fr)_minmax(0,4fr)]"
            >
              <div
                role="rowheader"
                className="min-w-0 border-b border-[var(--home-rule)] px-4 py-3 md:flex md:min-h-20 md:items-center md:border-b-0 md:border-r md:py-4"
              >
                <span className="text-sm font-semibold text-[var(--home-ink)]">
                  {row.label}
                </span>
              </div>
              <div role="presentation" className="grid min-w-0 grid-cols-2 md:grid-cols-4">
                <MetricCell
                  label="Starter-level assets"
                  value={formatTransition(row.before?.starters, row.after?.starters)}
                  index={0}
                />
                <MetricCell
                  label="Depth assets"
                  value={formatTransition(row.before?.depth, row.after?.depth)}
                  index={1}
                />
                <MetricCell label="Roster spots opened" value={row.opened} index={2} />
                <MetricCell label="Required cuts" value={row.cuts} index={3} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="border-t border-[var(--home-rule)] px-4 py-3 text-xs leading-5 text-[var(--home-ink-muted)] sm:px-5">
        This compares the assets in the offer against league-specific starter and roster lines. It does not project either full roster.
      </p>
    </section>
  );
}
