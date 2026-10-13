import { isFiniteNumber } from "@/lib/utils";
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

function MetricCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div role="cell" aria-label={`${label}: ${value}`} className="min-w-0">
      {/* Below md the column heads are hidden, so each cell carries its own label. */}
      <span aria-hidden="true" className="ffb-label ffb-tr-fit-label block md:hidden">
        {label}
      </span>
      <span className="ffb-heavy ffb-tr-fit-value">{value}</span>
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
    <section aria-labelledby="trade-roster-impact-title" className="ffb-tr-fit min-w-0">
      <div className="ffb-sechead ffb-sechead-lg">
        <h2 id="trade-roster-impact-title" className="ffb-h2">
          Package fit after the trade
        </h2>
      </div>

      <div role="table" aria-label="Package fit after the trade" className="ffb-tr-fit-table">
        <div role="row" className="ffb-label ffb-tr-fit-head hidden md:grid">
          <span role="columnheader">Roster</span>
          {["Starter-level assets", "Depth assets", "Roster spots opened", "Required cuts"].map((label) => (
            <span key={label} role="columnheader">
              {label}
            </span>
          ))}
        </div>

        {rows.map((row) => (
          <div key={row.label} role="row" className="ffb-tr-fit-row">
            <div role="rowheader" className="ffb-tr-fit-name min-w-0">
              {row.label}
            </div>
            <div role="presentation" className="ffb-tr-fit-cells">
              <MetricCell
                label="Starter-level assets"
                value={formatTransition(row.before?.starters, row.after?.starters)}
              />
              <MetricCell
                label="Depth assets"
                value={formatTransition(row.before?.depth, row.after?.depth)}
              />
              <MetricCell label="Roster spots opened" value={row.opened} />
              <MetricCell label="Required cuts" value={row.cuts} />
            </div>
          </div>
        ))}
      </div>

      <p className="ffb-method ffb-tr-fit-foot">
        This compares the assets in the offer against league-specific starter and roster lines. It does not project either full roster.
      </p>
    </section>
  );
}
