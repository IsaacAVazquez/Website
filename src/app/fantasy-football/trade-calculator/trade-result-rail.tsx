import { MetricTooltip } from "@/components/investments/MetricTooltip";
import { formatUpdatedAt } from "@/lib/fantasyUtils";
import type {
  FantasyTradeCoverage,
  FantasyTradeEvaluation,
  FantasyTradeSideEvaluation,
} from "@/lib/fantasyTrade";
import { TradeBalanceScale } from "./trade-balance-scale";

// The provider publishes the market window's end as a date, normalised to
// midnight UTC by the builder. It prints as a date in UTC everywhere on the
// page (the head, the season note, the evidence row), since a clock time is
// something the source never gave and a US timezone rolls the date back a day.
export function formatMarketDate(asOf: string | null | undefined): string | null {
  if (!asOf) return null;
  const parsed = new Date(asOf);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

interface VerdictCopy {
  title: string;
  body: string;
  /** The kit's status ink for the title. Status is an ink and a word, never a fill. */
  tone: "" | "ffb-muted" | "ffb-good" | "ffb-bad" | "ffb-warn";
  /** A withheld verdict is something the page is holding back, so it wears the held notice. */
  held?: boolean;
}

function verdictCopy(
  result: FantasyTradeEvaluation | null,
  hasBothSides: boolean
): VerdictCopy {
  if (!hasBothSides) {
    return {
      title: "Build both sides",
      body: "Add at least one player to each package to see an estimate.",
      tone: "ffb-muted",
    };
  }
  switch (result?.verdict) {
    case "balanced":
      // Balanced is the outcome the tool exists to find, so it reads in ink.
      // The warning tone stays with the withheld verdict below.
      return {
        title: "Balanced offer",
        body: "The central values are within 5% of each other.",
        tone: "",
      };
    case "leans-side-a":
      return {
        title: "You are giving more",
        body: "The central estimate leans toward the package you would send.",
        tone: "ffb-bad",
      };
    case "leans-side-b":
      return {
        title: "Leans your way",
        body: "The central estimate leans toward the package you would receive.",
        tone: "ffb-good",
      };
    case "clear-edge-side-a":
      return {
        title: "Clear edge to the other side",
        body: "The sensitivity ranges do not overlap, and the package you send is higher.",
        tone: "ffb-bad",
      };
    case "clear-edge-side-b":
      return {
        title: "Clear edge your way",
        body: "The sensitivity ranges do not overlap, and the package you receive is higher.",
        tone: "ffb-good",
      };
    default:
      return {
        title: "Verdict withheld",
        body: "The available inputs are too old, incomplete, or unsupported for a verdict.",
        tone: "ffb-warn",
        held: true,
      };
  }
}

/**
 * Compact verdict for phones and tablets, where the evaluation rail stacks
 * under both ledgers. Rendered only once both sides hold a player, so it never
 * pins "Build both sides" over an empty ledger, and only below 1200px, where
 * the rail is not already in view. It carries no live region; the rail announces.
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
    <div data-testid="trade-verdict-strip" className="ffb-sticky ffb-tr-strip flex min-[1200px]:hidden">
      <div className="min-w-0">
        <p className={`ffb-verdict-title ffb-tr-strip-title ${copy.tone}`}>{copy.title}</p>
        <p className="ffb-label ffb-muted">{result.coverage} coverage</p>
      </div>
      <a href="#trade-evaluation" className="ffb-btn">
        Evidence
      </a>
    </div>
  );
}

// Nothing has been evaluated yet, so the badge rests muted. A status ink
// belongs to a result that actually carries that coverage.
const COVERAGE_TONE: Record<FantasyTradeCoverage, string> = {
  supported: "ffb-good",
  limited: "ffb-warn",
  insufficient: "ffb-bad",
};

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
    <div className="ffb-stat">
      <dt>{label}</dt>
      <dd>{valuesAvailable ? formatIndex(side?.value) : "—"}</dd>
      <dd className="ffb-stat-note">
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
  teams,
  rosterSize,
}: {
  result: FantasyTradeEvaluation | null;
  hasBothSides: boolean;
  valuesAvailable: boolean;
  giveCount: number;
  getCount: number;
  /** The league as it is set, so the League fit row has its reading before any player is chosen. */
  teams: number;
  rosterSize: number;
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
    <aside id="trade-evaluation" aria-label="Trade evaluation" className="ffb-rail ffb-tr-eval">
      <div className="ffb-stack">
        <div className="ffb-sechead ffb-tr-colhead">
          <h2 className="ffb-h3">Evaluation</h2>
          <span className={`ffb-badge ${coverage ? COVERAGE_TONE[coverage] : "ffb-muted"}`}>
            {coverage ? `${coverage} coverage` : "Waiting"}
          </span>
        </div>

        <div
          className={`ffb-verdict ffb-tr-verdict${copy.held ? " ffb-notice ffb-notice-held" : ""}`}
          aria-live="polite"
        >
          <p className={`ffb-verdict-title ${copy.tone}`}>{copy.title}</p>
          <p className="ffb-verdict-body">{copy.body}</p>
        </div>

        <TradeBalanceScale result={hasBothSides ? result : null} />

        {/* Until both sides hold a player there is nothing to read here, so the
            idle desk shows the scale at rest and the line above it. */}
        {hasBothSides ? (
          <>
            <dl className="ffb-stats">
              <ValueReadout label="You give" side={result?.sideA ?? null} valuesAvailable={valuesAvailable} />
              <ValueReadout label="You get" side={result?.sideB ?? null} valuesAvailable={valuesAvailable} />
            </dl>
            <p className="ffb-tr-effect">
              <span className="ffb-label">Roster-slot effect</span>
              {rosterDelta > 0
                ? `Receiving ${rosterDelta} extra ${rosterDelta === 1 ? "player" : "players"} assumes the same number of replacement-level cuts.`
                : rosterDelta < 0
                  ? `This offer opens ${Math.abs(rosterDelta)} roster ${Math.abs(rosterDelta) === 1 ? "spot" : "spots"}.`
                  : "Both packages use the same number of roster spots."}
            </p>
          </>
        ) : null}

        {/* A disclaimer never sits inside a disclosure, so this prints in the
            open beside the verdict it qualifies. */}
        <p className="ffb-method">
          This is a preseason one-QB redraft estimate. It is not projected points, win probability, dynasty value, or injury advice.
        </p>
      </div>

      {/* One block, so below 1200px the evidence and the limits share the column beside the verdict. */}
      <div className="ffb-tr-evidence">
        <div>
          <div className="ffb-sechead">
            <h3 className="ffb-h3">Evidence mix</h3>
          </div>
          <dl className="ffb-facts ffb-facts-sm ffb-tr-facts">
            <div className="ffb-fact">
              <dt>
                Expert consensus
                <MetricTooltip
                  term="Expert consensus"
                  definition="Aggregate preseason expert rankings on the overall board. This is not a named creator model or a points projection."
                />
              </dt>
              {result ? (
                <dd>
                  {expertPlayers}/{totalPlayers} players
                </dd>
              ) : null}
              <dd className="ffb-fact-note">
                {result ? formatUpdatedAt(result.sources.expert.asOf) : "Waiting for players"}
              </dd>
            </div>
            <div className="ffb-fact">
              <dt>
                Draft market
                <MetricTooltip
                  term="Draft market"
                  definition="Current mock-draft average position. It is a preseason price signal, not a database of completed trades."
                />
              </dt>
              {result ? (
                <dd>
                  {marketPlayers}/{totalPlayers} players
                </dd>
              ) : null}
              <dd className="ffb-fact-note">
                {/* "Not current" is a staleness claim, so it waits for an
                    evaluated result that actually found the market unusable.
                    Before that the header already carries the source date. */}
                {!result
                  ? "Waiting for players"
                  : result.sources.market.usable
                    ? formatMarketDate(result.sources.market.asOf) ?? "Unavailable"
                    : "Not current"}
              </dd>
            </div>
            <div className="ffb-fact">
              <dt>League fit</dt>
              <dd>{result?.league.teams ?? teams} teams</dd>
              <dd className="ffb-fact-note">{result?.league.rosterSize ?? rosterSize} roster spots</dd>
            </div>
          </dl>
        </div>

        <div className="ffb-tr-limits">
          {warnings.length > 0 ? (
            <details className="ffb-details">
              {/* The panel mixes top-level and per-player notes, so its title
                  must match the coverage badge above it instead of asserting
                  "limited" beside a supported or insufficient result. */}
              <summary>
                {coverage === "insufficient"
                  ? "Why there is no verdict"
                  : coverage === "limited"
                    ? "Why coverage is limited"
                    : "Notes on this result"}
              </summary>
              <div className="ffb-details-body">
                <ul className="ffb-notice ffb-notice-warn ffb-tr-warnings">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </details>
          ) : hasBothSides ? (
            <p className="ffb-method">
              Both sources cover every selected player and the sensitivity range is available.
            </p>
          ) : null}

          <details className="ffb-details">
            <summary>How the estimate works</summary>
            <div className="ffb-details-body">
              <p className="ffb-method">
                Overall expert rank and reliable current ADP are converted into a replacement-relative index for this league size and lineup. Source spreads create the sensitivity range.
              </p>
            </div>
          </details>
        </div>
      </div>
    </aside>
  );
}
