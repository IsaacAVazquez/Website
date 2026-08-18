import { AlertTriangle, Check, Info, Scale } from "lucide-react";
import { MetricTooltip } from "@/components/investments/MetricTooltip";
import { formatUpdatedAt } from "@/lib/fantasyUtils";
import type {
  FantasyTradeCoverage,
  FantasyTradeEvaluation,
  FantasyTradeSideEvaluation,
} from "@/lib/fantasyTrade";
import { TradeBalanceScale } from "./trade-balance-scale";

interface VerdictCopy {
  title: string;
  body: string;
  tone: string;
}

function verdictCopy(
  result: FantasyTradeEvaluation | null,
  hasBothSides: boolean
): VerdictCopy {
  if (!hasBothSides) {
    return {
      title: "Build both sides",
      body: "Add at least one player to each package to see an estimate.",
      tone: "var(--home-ink-muted)",
    };
  }
  switch (result?.verdict) {
    case "balanced":
      return {
        title: "Balanced offer",
        body: "The central values are within 5% of each other.",
        tone: "var(--home-warning)",
      };
    case "leans-side-a":
      return {
        title: "You are giving more",
        body: "The central estimate leans toward the package you would send.",
        tone: "var(--home-negative)",
      };
    case "leans-side-b":
      return {
        title: "Leans your way",
        body: "The central estimate leans toward the package you would receive.",
        tone: "var(--home-positive)",
      };
    case "clear-edge-side-a":
      return {
        title: "Clear edge to the other side",
        body: "The sensitivity ranges do not overlap, and the package you send is higher.",
        tone: "var(--home-negative)",
      };
    case "clear-edge-side-b":
      return {
        title: "Clear edge your way",
        body: "The sensitivity ranges do not overlap, and the package you receive is higher.",
        tone: "var(--home-positive)",
      };
    default:
      return {
        title: "Verdict withheld",
        body: "The available inputs are too old, incomplete, or unsupported for a verdict.",
        tone: "var(--home-warning)",
      };
  }
}

function coverageStyle(coverage: FantasyTradeCoverage | null) {
  if (coverage === "supported") {
    return {
      borderColor: "color-mix(in srgb, var(--home-positive) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-positive) 10%, var(--home-paper))",
    };
  }
  if (coverage === "insufficient") {
    return {
      borderColor: "color-mix(in srgb, var(--home-negative) 35%, var(--home-rule))",
      background: "color-mix(in srgb, var(--home-negative) 8%, var(--home-paper))",
    };
  }
  return {
    borderColor: "color-mix(in srgb, var(--home-warning) 35%, var(--home-rule))",
    background: "color-mix(in srgb, var(--home-warning) 9%, var(--home-paper))",
  };
}

function formatIndex(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "--";
}

function ValueReadout({
  label,
  side,
  valuesAvailable,
}: {
  label: string;
  side: FantasyTradeSideEvaluation | null;
  valuesAvailable: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-xl tabular-nums text-[var(--home-ink)]">
        {valuesAvailable ? formatIndex(side?.value) : "--"}
      </dd>
      <dd className="mt-0.5 text-2xs text-[var(--home-ink-muted)]">
        {valuesAvailable && side
          ? `${formatIndex(side.range.low)} to ${formatIndex(side.range.high)}`
          : "Sensitivity unavailable"}
      </dd>
    </div>
  );
}

export function TradeResultRail({
  result,
  hasBothSides,
  valuesAvailable,
  giveCount,
  getCount,
}: {
  result: FantasyTradeEvaluation | null;
  hasBothSides: boolean;
  valuesAvailable: boolean;
  giveCount: number;
  getCount: number;
}) {
  const copy = verdictCopy(result, hasBothSides);
  const coverage = hasBothSides ? result?.coverage ?? null : null;
  const totalPlayers = giveCount + getCount;
  const marketPlayers =
    (result?.sideA.marketPlayerCount ?? 0) + (result?.sideB.marketPlayerCount ?? 0);
  const expertPlayers =
    (result?.sideA.valuedPlayerCount ?? 0) + (result?.sideB.valuedPlayerCount ?? 0);
  const rosterDelta = getCount - giveCount;
  const warnings = Array.from(
    new Set([
      ...(result?.warnings ?? []),
      ...(result?.sideA.players.flatMap((player) => player.warnings) ?? []),
      ...(result?.sideB.players.flatMap((player) => player.warnings) ?? []),
    ])
  );

  return (
    <aside
      aria-label="Trade evaluation"
      className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 lg:sticky lg:top-24 lg:self-start"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--home-rule)] pb-3">
        <span className="inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
          <Scale className="h-4 w-4" aria-hidden="true" />
          Evaluation
        </span>
        <span
          className="rounded-full border px-2.5 py-1 font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink)]"
          style={coverageStyle(coverage)}
        >
          {coverage ? `${coverage} coverage` : "Waiting"}
        </span>
      </div>

      <div className="pt-4" aria-live="polite">
        <p className="text-xl font-semibold tracking-[-0.03em]" style={{ color: copy.tone }}>
          {copy.title}
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--home-ink-muted)]">{copy.body}</p>
      </div>

      <div className="mt-4 border-y border-[var(--home-rule)] py-3">
        <TradeBalanceScale result={hasBothSides ? result : null} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <ValueReadout label="You give" side={result?.sideA ?? null} valuesAvailable={valuesAvailable} />
        <ValueReadout label="You get" side={result?.sideB ?? null} valuesAvailable={valuesAvailable} />
      </dl>

      <div className="mt-5 border-t border-[var(--home-rule)] pt-4">
        <h2 className="text-sm font-semibold text-[var(--home-ink)]">Evidence mix</h2>
        <dl className="mt-3 grid gap-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="inline-flex items-center text-[var(--home-ink-muted)]">
              Expert consensus
              <MetricTooltip
                term="Expert consensus"
                definition="Aggregate preseason expert rankings on the overall board. This is not a named creator model or a points projection."
              />
            </dt>
            <dd className="text-right font-mono text-2xs text-[var(--home-ink)]">
              {expertPlayers}/{totalPlayers || 0}
              <span className="mt-0.5 block text-[var(--home-ink-muted)]">
                {formatUpdatedAt(result?.sources.expert.asOf)}
              </span>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="inline-flex items-center text-[var(--home-ink-muted)]">
              Draft market
              <MetricTooltip
                term="Draft market"
                definition="Current mock-draft average position. It is a preseason price signal, not a database of completed trades."
              />
            </dt>
            <dd className="text-right font-mono text-2xs text-[var(--home-ink)]">
              {marketPlayers}/{totalPlayers || 0}
              <span className="mt-0.5 block text-[var(--home-ink-muted)]">
                {result?.sources.market.usable
                  ? formatUpdatedAt(result.sources.market.asOf)
                  : "Not current"}
              </span>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-[var(--home-ink-muted)]">League fit</dt>
            <dd className="text-right font-mono text-2xs text-[var(--home-ink)]">
              {result ? `${result.league.teams} teams` : "--"}
              <span className="mt-0.5 block text-[var(--home-ink-muted)]">
                {result ? `${result.league.rosterSize} roster spots` : "Set your league"}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 border-t border-[var(--home-rule)] pt-4">
        <p className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
          Roster-slot effect
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--home-ink)]">
          {rosterDelta > 0
            ? `Receiving ${rosterDelta} extra ${rosterDelta === 1 ? "player" : "players"} assumes the same number of replacement-level cuts.`
            : rosterDelta < 0
              ? `This offer opens ${Math.abs(rosterDelta)} roster ${Math.abs(rosterDelta) === 1 ? "spot" : "spots"}.`
              : "Both packages use the same number of roster spots."}
        </p>
      </div>

      <div className="mt-4 border-y border-[var(--home-rule)]">
        {warnings.length > 0 ? (
          <details>
            <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[var(--home-ink)] marker:content-none">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--home-warning)]" aria-hidden="true" />
              Why coverage is limited
            </summary>
            <ul className="grid gap-2 pb-3 pl-1 text-xs leading-5 text-[var(--home-ink-muted)]">
              {warnings.slice(0, 6).map((warning) => (
                <li key={warning} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[var(--home-warning)]"
                  />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : hasBothSides ? (
          <p className="flex min-h-touch items-center gap-2 text-xs leading-5 text-[var(--home-ink-muted)]">
            <Check className="h-3.5 w-3.5 shrink-0 text-[var(--home-positive)]" aria-hidden="true" />
            Both sources cover every selected player and the sensitivity range is available.
          </p>
        ) : null}

        <details
          className={warnings.length > 0 || hasBothSides ? "border-t border-[var(--home-rule)]" : undefined}
        >
          <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[var(--home-ink)] marker:content-none">
            <Info className="h-4 w-4 shrink-0 text-[var(--home-ink-muted)]" aria-hidden="true" />
            How the estimate works
          </summary>
          <div className="pb-3 text-xs leading-5 text-[var(--home-ink-muted)]">
            <p>
              Overall expert rank and reliable current ADP are converted into a replacement-relative index for this league size and lineup. Source spreads create the sensitivity range.
            </p>
            <p
              className="mt-2 text-sm leading-6"
              style={{
                fontFamily: "var(--font-home-serif)",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              This is a preseason one-QB redraft estimate. It is not projected points, win probability, dynasty value, or injury advice.
            </p>
          </div>
        </details>
      </div>
    </aside>
  );
}
