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
      tone: "var(--c97-ink-2)",
    };
  }
  switch (result?.verdict) {
    case "balanced":
      // Balanced is the outcome the tool exists to find, so it reads in ink.
      // The warning tone stays with the withheld verdict below.
      return {
        title: "Balanced offer",
        body: "The central values are within 5% of each other.",
        tone: "var(--c97-ink)",
      };
    case "leans-side-a":
      return {
        title: "You are giving more",
        body: "The central estimate leans toward the package you would send.",
        tone: "var(--c97-negative)",
      };
    case "leans-side-b":
      return {
        title: "Leans your way",
        body: "The central estimate leans toward the package you would receive.",
        tone: "var(--c97-positive)",
      };
    case "clear-edge-side-a":
      return {
        title: "Clear edge to the other side",
        body: "The sensitivity ranges do not overlap, and the package you send is higher.",
        tone: "var(--c97-negative)",
      };
    case "clear-edge-side-b":
      return {
        title: "Clear edge your way",
        body: "The sensitivity ranges do not overlap, and the package you receive is higher.",
        tone: "var(--c97-positive)",
      };
    default:
      return {
        title: "Verdict withheld",
        body: "The available inputs are too old, incomplete, or unsupported for a verdict.",
        tone: "var(--c97-warning)",
      };
  }
}

/**
 * Compact verdict for phones and tablets, where the evaluation rail stacks
 * under both ledgers. Rendered only once both sides hold a player, so it never
 * pins "Build both sides" over an empty ledger, and only below lg, where the
 * rail is not already in view. It carries no live region; the rail announces.
 */
export function TradeVerdictStrip({
  result,
  hasBothSides,
}: {
  result: FantasyTradeEvaluation | null;
  hasBothSides: boolean;
}) {
  if (!hasBothSides || !result) return null;
  const copy = verdictCopy(result, hasBothSides);
  return (
    <div
      data-testid="trade-verdict-strip"
      className="sticky top-0 z-20 flex items-center justify-between border lg:hidden"
      style={{
        paddingInline: "var(--c97-sp-1)",
        paddingBlock: "var(--c97-sp-0)",
        gap: "var(--c97-sp-1)",
        borderColor: "var(--c97-rule)",
        background: "var(--c97-field)",
      }}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-[-0.02em]" style={{ color: copy.tone }}>
          {copy.title}
        </p>
        <p className="font-mono text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]">
          {result.coverage} coverage
        </p>
      </div>
      <a
        href="#trade-evaluation"
        className="inline-flex min-h-touch shrink-0 items-center border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-xs font-semibold text-[var(--c97-ink)] transition-[border-color,background-color] hover:border-[var(--c97-accent)]" style={{ paddingInline: "var(--c97-sp-1)" }}
      >
        Evidence
      </a>
    </div>
  );
}

function coverageStyle(coverage: FantasyTradeCoverage | null) {
  // Nothing has been evaluated yet, so the chip rests neutral. The warning tone
  // belongs to a result that actually carries a coverage warning.
  if (coverage === null) {
    return {
      borderColor: "var(--c97-rule)",
      background: "var(--c97-surface)",
    };
  }
  if (coverage === "supported") {
    return {
      borderColor: "color-mix(in srgb, var(--c97-positive) 35%, var(--c97-rule))",
      background: "color-mix(in srgb, var(--c97-positive) 10%, var(--c97-surface))",
    };
  }
  if (coverage === "insufficient") {
    return {
      borderColor: "color-mix(in srgb, var(--c97-negative) 35%, var(--c97-rule))",
      background: "color-mix(in srgb, var(--c97-negative) 8%, var(--c97-surface))",
    };
  }
  return {
    borderColor: "color-mix(in srgb, var(--c97-warning) 35%, var(--c97-rule))",
    background: "color-mix(in srgb, var(--c97-warning) 9%, var(--c97-surface))",
  };
}

function formatIndex(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "—";
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
      <dt className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--c97-ink-2)]">
        {label}
      </dt>
      <dd className="font-mono text-xl tabular-nums text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
        {valuesAvailable ? formatIndex(side?.value) : "—"}
      </dd>
      <dd className="mt-0.5 text-2xs text-[var(--c97-ink-2)]">
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
      id="trade-evaluation"
      aria-label="Trade evaluation"
      className="border border-[var(--c97-rule)] bg-[var(--c97-field)] lg:sticky lg:top-0 lg:self-start" style={{ padding: "var(--c97-sp-2)" }}
    >
      <div className="flex items-center justify-between border-b border-[var(--c97-rule)]" style={{ paddingBottom: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
        <span className="inline-flex items-center font-mono text-2xs uppercase tracking-[0.12em] text-[var(--c97-ink-2)]" style={{ gap: "var(--c97-sp-1)" }}>
          <Scale className="h-4 w-4" aria-hidden="true" />
          Evaluation
        </span>
        <span
          className="border font-mono text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink)]"
          style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-0)", ...(coverageStyle(coverage)) }}
        >
          {coverage ? `${coverage} coverage` : "Waiting"}
        </span>
      </div>

      <div style={{ paddingTop: "var(--c97-sp-2)" }} aria-live="polite">
        <p className="text-xl font-semibold tracking-[-0.03em]" style={{ color: copy.tone }}>
          {copy.title}
        </p>
        <p className="text-sm leading-6 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>{copy.body}</p>
      </div>

      <div className="border-y border-[var(--c97-rule)]" style={{ paddingBlock: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
        <TradeBalanceScale result={hasBothSides ? result : null} />
      </div>

      <dl className="grid grid-cols-2" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}>
        <ValueReadout label="You give" side={result?.sideA ?? null} valuesAvailable={valuesAvailable} />
        <ValueReadout label="You get" side={result?.sideB ?? null} valuesAvailable={valuesAvailable} />
      </dl>

      <div className="border-t border-[var(--c97-rule)]" style={{ paddingTop: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}>
        <h2 className="text-sm font-semibold text-[var(--c97-ink)]">Evidence mix</h2>
        <dl className="grid text-sm" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
          <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-1)" }}>
            <dt className="inline-flex items-center text-[var(--c97-ink-2)]">
              Expert consensus
              <MetricTooltip
                term="Expert consensus"
                definition="Aggregate preseason expert rankings on the overall board. This is not a named creator model or a points projection."
              />
            </dt>
            <dd className="text-right font-mono text-2xs text-[var(--c97-ink)]">
              {expertPlayers}/{totalPlayers || 0}
              <span className="mt-0.5 block text-[var(--c97-ink-2)]">
                {result ? formatUpdatedAt(result.sources.expert.asOf) : "Waiting for players"}
              </span>
            </dd>
          </div>
          <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-1)" }}>
            <dt className="inline-flex items-center text-[var(--c97-ink-2)]">
              Draft market
              <MetricTooltip
                term="Draft market"
                definition="Current mock-draft average position. It is a preseason price signal, not a database of completed trades."
              />
            </dt>
            <dd className="text-right font-mono text-2xs text-[var(--c97-ink)]">
              {marketPlayers}/{totalPlayers || 0}
              <span className="mt-0.5 block text-[var(--c97-ink-2)]">
                {/* "Not current" is a staleness claim, so it waits for an
                    evaluated result that actually found the market unusable.
                    Before that the header already carries the source date. */}
                {!result
                  ? "Waiting for players"
                  : result.sources.market.usable
                    ? formatUpdatedAt(result.sources.market.asOf)
                    : "Not current"}
              </span>
            </dd>
          </div>
          <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-1)" }}>
            <dt className="text-[var(--c97-ink-2)]">League fit</dt>
            <dd className="text-right font-mono text-2xs text-[var(--c97-ink)]">
              {result ? `${result.league.teams} teams` : "—"}
              <span className="mt-0.5 block text-[var(--c97-ink-2)]">
                {result ? `${result.league.rosterSize} roster spots` : "Set your league"}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-[var(--c97-rule)]" style={{ paddingTop: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}>
        <p className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--c97-ink-2)]">
          Roster-slot effect
        </p>
        <p className="text-sm leading-6 text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>
          {rosterDelta > 0
            ? `Receiving ${rosterDelta} extra ${rosterDelta === 1 ? "player" : "players"} assumes the same number of replacement-level cuts.`
            : rosterDelta < 0
              ? `This offer opens ${Math.abs(rosterDelta)} roster ${Math.abs(rosterDelta) === 1 ? "spot" : "spots"}.`
              : "Both packages use the same number of roster spots."}
        </p>
      </div>

      <div className="border-y border-[var(--c97-rule)]" style={{ marginTop: "var(--c97-sp-2)" }}>
        {warnings.length > 0 ? (
          <details>
            <summary className="flex min-h-touch cursor-pointer list-none items-center text-sm font-semibold text-[var(--c97-ink)] marker:content-none" style={{ gap: "var(--c97-sp-1)" }}>
              <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--c97-warning)]" aria-hidden="true" />
              {/* The panel mixes top-level and per-player notes, so its title
                  must match the coverage chip above it instead of asserting
                  "limited" beside a supported or insufficient result. */}
              {coverage === "insufficient"
                ? "Why there is no verdict"
                : coverage === "limited"
                  ? "Why coverage is limited"
                  : "Notes on this result"}
            </summary>
            <ul className="grid text-xs leading-5 text-[var(--c97-ink-2)]" style={{ paddingBottom: "var(--c97-sp-1)", paddingLeft: "var(--c97-sp-0)", gap: "var(--c97-sp-1)" }}>
              {warnings.map((warning) => (
                <li key={warning} className="flex" style={{ gap: "var(--c97-sp-1)" }}>
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 shrink-0 bg-[var(--c97-warning)]"
                    style={{ marginTop: "calc(0.5lh - 2px)" }}
                  />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : hasBothSides ? (
          <p className="flex min-h-touch items-center text-xs leading-5 text-[var(--c97-ink-2)]" style={{ gap: "var(--c97-sp-1)" }}>
            <Check className="h-3.5 w-3.5 shrink-0 text-[var(--c97-positive)]" aria-hidden="true" />
            Both sources cover every selected player and the sensitivity range is available.
          </p>
        ) : null}

        <details
          className={warnings.length > 0 || hasBothSides ? "border-t border-[var(--c97-rule)]" : undefined}
        >
          <summary className="flex min-h-touch cursor-pointer list-none items-center text-sm font-semibold text-[var(--c97-ink)] marker:content-none" style={{ gap: "var(--c97-sp-1)" }}>
            <Info className="h-4 w-4 shrink-0 text-[var(--c97-ink-2)]" aria-hidden="true" />
            How the estimate works
          </summary>
          <div className="text-xs leading-5 text-[var(--c97-ink-2)]" style={{ paddingBottom: "var(--c97-sp-1)" }}>
            <p>
              Overall expert rank and reliable current ADP are converted into a replacement-relative index for this league size and lineup. Source spreads create the sensitivity range.
            </p>
            <p
              className="text-sm leading-6"
              style={{
                marginTop: "var(--c97-sp-1)",
                fontFamily: "var(--c97-font-display)",
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
