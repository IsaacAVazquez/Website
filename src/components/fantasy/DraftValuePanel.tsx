"use client";

import { Fragment, useState, type CSSProperties } from "react";
import {
  calculateContestFieldEconomics,
  calculateExpectedReturn,
  ROOM_RANK_MIN_PICKS,
  type ContestFieldEconomicsInput,
  type DraftValueReport,
} from "@/lib/fantasyTeamValue";

import "./fantasy-overlays.css";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const WHOLE_CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat("en-US");

// Same UTC formatter the trackers use for their "Rankings updated" chips, so
// a field figure captured on the 9th cannot print as the 8th in one timezone.
function formatAsOfDate(value: string | null | undefined): string | null {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

/**
 * The kit's status ink for a signed figure. Positive, negative, and zero each
 * read differently, and the figure prints its own sign, so the ink is never
 * the only carrier.
 */
function signTone(value: number): string | undefined {
  if (value > 0) return "ffb-good";
  if (value < 0) return "ffb-bad";
  return undefined;
}

export interface ExpectedReturnFormState {
  entryCost: string;
  payoutProbability: string;
  averagePayout: string;
}

function signedNumber(value: number, digits = 1): string {
  const rounded = value.toFixed(digits);
  return value > 0 ? `+${rounded}` : rounded;
}

function signedCurrency(value: number): string {
  if (value > 0) return `+${CURRENCY.format(value)}`;
  return CURRENCY.format(value);
}

function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function signedPercent(value: number, digits = 1): string {
  const formatted = percent(value, digits);
  return value > 0 ? `+${formatted}` : formatted;
}

function confidenceLabel(value: DraftValueReport["confidence"]): string {
  if (value === "settled") return "Settled read";
  if (value === "developing") return "Developing read";
  return "Early read";
}

function componentLabel(
  component: DraftValueReport["components"][number],
  consensusOnly: boolean
): string {
  return component.id === "market" && consensusOnly ? "Consensus rank" : component.label;
}

const ORDINAL_RULES = new Intl.PluralRules("en-US", { type: "ordinal" });
const ORDINAL_SUFFIX: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "st", two: "nd", few: "rd" };

function ordinal(value: number): string {
  const whole = Math.round(value);
  return `${whole}${ORDINAL_SUFFIX[ORDINAL_RULES.select(whole)] ?? "th"}`;
}

function parseInput(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ExpectedReturnCalculator({
  id,
  defaultEntryCost,
  value,
  onChange,
}: {
  id: string;
  defaultEntryCost?: number;
  value?: ExpectedReturnFormState;
  onChange?: (value: ExpectedReturnFormState) => void;
}) {
  const [internalValue, setInternalValue] = useState<ExpectedReturnFormState>(() => ({
    entryCost: defaultEntryCost === undefined ? "" : String(defaultEntryCost),
    payoutProbability: "",
    averagePayout: "",
  }));
  const formValue = value ?? internalValue;
  const { entryCost, payoutProbability, averagePayout } = formValue;

  function updateField(field: keyof ExpectedReturnFormState, nextValue: string) {
    const next = { ...formValue, [field]: nextValue };
    if (onChange) onChange(next);
    else setInternalValue(next);
  }

  const parsedEntryCost = parseInput(entryCost);
  const parsedProbability = parseInput(payoutProbability);
  const parsedAveragePayout = parseInput(averagePayout);
  const entryCostInvalid = parsedEntryCost !== null && parsedEntryCost < 0;
  const payoutProbabilityInvalid =
    parsedProbability !== null && (parsedProbability < 0 || parsedProbability > 100);
  const averagePayoutInvalid = parsedAveragePayout !== null && parsedAveragePayout < 0;
  const validationMessage = entryCostInvalid
    ? "Entry cost cannot be negative."
    : payoutProbabilityInvalid
      ? "Use a payout chance from 0% to 100%."
      : averagePayoutInvalid
        ? "Average payout cannot be negative."
        : null;
  const result =
    !validationMessage &&
    parsedEntryCost !== null &&
    parsedProbability !== null &&
    parsedAveragePayout !== null
      ? calculateExpectedReturn({
          entryCost: parsedEntryCost,
          payoutProbability: parsedProbability / 100,
          averagePayout: parsedAveragePayout,
        })
      : null;

  return (
    <details className="ffb-details">
      <summary>Expected return calculator</summary>

      <div className="ffb-details-body ffb-stack">
        <p className="ffb-method">
          Enter your own payout assumptions. The Draft Outlook does not set these probabilities,
          and this arithmetic does not include taxes.
        </p>

        <div className="ffb-ov-calc-fields">
          <label className="ffb-field" htmlFor={`${id}-entry-cost`}>
            <span className="ffb-field-label">Entry cost</span>
            <span className="ffb-affix">
              <span className="ffb-affix-mark">$</span>
              <input
                id={`${id}-entry-cost`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={entryCost}
                onChange={(event) => updateField("entryCost", event.target.value)}
                aria-invalid={entryCostInvalid || undefined}
                aria-describedby={`${id}-status`}
                className="ffb-input"
                placeholder="100"
              />
            </span>
          </label>

          <label className="ffb-field" htmlFor={`${id}-payout-chance`}>
            <span className="ffb-field-label">Chance of any payout</span>
            <span className="ffb-affix">
              <input
                id={`${id}-payout-chance`}
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.1"
                value={payoutProbability}
                onChange={(event) => updateField("payoutProbability", event.target.value)}
                aria-invalid={payoutProbabilityInvalid || undefined}
                aria-describedby={`${id}-status`}
                className="ffb-input"
                placeholder="20"
              />
              <span className="ffb-affix-mark">%</span>
            </span>
          </label>

          <label className="ffb-field" htmlFor={`${id}-average-payout`}>
            <span className="ffb-field-label">Average total payout if paid</span>
            <span className="ffb-affix">
              <span className="ffb-affix-mark">$</span>
              <input
                id={`${id}-average-payout`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={averagePayout}
                onChange={(event) => updateField("averagePayout", event.target.value)}
                aria-invalid={averagePayoutInvalid || undefined}
                aria-describedby={`${id}-status`}
                className="ffb-input"
                placeholder="500"
              />
            </span>
          </label>
        </div>

        <p
          id={`${id}-status`}
          role="status"
          aria-live="polite"
          className={validationMessage ? "ffb-field-error" : "ffb-field-hint"}
        >
          {validationMessage ??
            (result
              ? `Net expected value is ${signedCurrency(result.netExpectedValue)} before taxes.`
              : "Enter all three assumptions to calculate expected return.")}
        </p>

        {result ? (
          <dl className="ffb-stats ffb-stats-2" aria-live="polite">
            <div className="ffb-stat">
              <dt>Gross return</dt>
              <dd>{CURRENCY.format(result.grossExpectedReturn)}</dd>
            </div>
            <div className="ffb-stat">
              <dt>Net EV</dt>
              <dd className={signTone(result.netExpectedValue)}>{signedCurrency(result.netExpectedValue)}</dd>
            </div>
            <div className="ffb-stat">
              <dt>ROI</dt>
              <dd>{result.roi === null ? "No entry cost" : percent(result.roi)}</dd>
            </div>
            <div className="ffb-stat">
              <dt>Break-even payout chance</dt>
              <dd>
                {result.breakEvenPayoutProbability === null
                  ? "No payout"
                  : result.breakEvenPayoutProbability > 1
                    ? "Not possible"
                    : percent(result.breakEvenPayoutProbability)}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </details>
  );
}

/**
 * Field figures a preset publishes: entry fee, prize pool, and the entry
 * count on the day they were captured. The count keeps growing until the
 * draft deadline, so the capture date is part of the figure.
 */
export type ContestEconomicsDisplayInput = ContestFieldEconomicsInput & {
  firstAdvanceRate?: number;
  asOf?: string;
};

function ContestMath({
  headingId,
  economics,
  contestName,
  sourceUrl,
}: {
  headingId: string;
  economics: ContestEconomicsDisplayInput;
  contestName?: string;
  sourceUrl?: string;
}) {
  const result = calculateContestFieldEconomics(economics);
  if (!result) return null;
  const asOf = formatAsOfDate(economics.asOf);

  return (
    <section className="ffb-stack ffb-stack-tight" aria-labelledby={headingId}>
      <div className="ffb-sechead">
        <h4 id={headingId} className="ffb-h3">
          {contestName ? `${contestName} field baseline` : "Published field baseline"}
        </h4>
        <p className="ffb-sechead-note">Published contest math</p>
      </div>
      <dl className="ffb-stats ffb-stats-2">
        <div className="ffb-stat">
          <dt>Field gross</dt>
          <dd>{CURRENCY.format(result.grossExpectedReturn)}</dd>
        </div>
        <div className="ffb-stat">
          <dt>Field net EV</dt>
          <dd className={signTone(result.netExpectedValue)}>{signedCurrency(result.netExpectedValue)}</dd>
        </div>
        <div className="ffb-stat">
          <dt>First advance</dt>
          <dd>{economics.firstAdvanceRate === undefined ? "Not set" : percent(economics.firstAdvanceRate)}</dd>
        </div>
        <div className="ffb-stat">
          <dt>Break-even edge</dt>
          <dd>{signedPercent(result.breakEvenEdge)}</dd>
        </div>
      </dl>
      <p className="ffb-method">
        {asOf ? `Field figures as of ${asOf}. ` : ""}
        At a full field, {WHOLE_CURRENCY.format(result.prizePool)} across {NUMBER.format(result.fieldEntries)} entries
        gives an equal-entry return before taxes. This field math stays separate from Draft Outlook.
        {sourceUrl ? (
          <>
            {" "}
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="ffb-link ffb-link-out">
              Check the current rules
            </a>
          </>
        ) : null}
      </p>
    </section>
  );
}

/**
 * Draft Outlook: how this roster reads against the other teams in the same
 * room, the published contest math when the caller has it, and a calculator
 * for the user's own payout assumptions. It is flat, with ruled facts and no
 * boxes, and it lays itself out from its own width, so it works in a 320px
 * sheet, a 400px rail, and a wide column without reading the window.
 */
export function DraftValuePanel({
  report,
  headingId,
  economics,
  economicsContestName,
  economicsSourceUrl,
  defaultEntryCost,
  calculatorValue,
  onCalculatorChange,
  unavailableReason,
}: {
  report: DraftValueReport | null;
  headingId: string;
  economics?: ContestEconomicsDisplayInput;
  /** The preset's own name, so the heading never hardcodes one contest. */
  economicsContestName?: string;
  economicsSourceUrl?: string;
  defaultEntryCost?: number;
  calculatorValue?: ExpectedReturnFormState;
  onCalculatorChange?: (value: ExpectedReturnFormState) => void;
  unavailableReason?: string | null;
}) {
  const roomRank = report?.roomRank;
  // Hold the rank until the sample is big enough to mean anything, and say so
  // rather than rendering a number the user will read as a verdict.
  const progressReady = (report?.picksDrafted ?? 0) >= ROOM_RANK_MIN_PICKS;
  const roomRankReady = progressReady && (report?.roomSize ?? 0) >= 2;
  const rankLabel =
    report && roomRankReady && roomRank !== null && roomRank !== undefined
      ? `${report.roomTieCount > 1 ? "T" : ""}${roomRank} of ${report.roomSize}`
      : "Waiting";
  const rankCaption = !progressReady
    ? `Held until you have ${ROOM_RANK_MIN_PICKS} picks, because a smaller sample is too unstable for a room comparison.`
    : report && report.roomSize < 2
      ? "Waiting for another team at the same pick count"
      : report?.roomPercentile === null || report?.roomPercentile === undefined
        ? "No comparison yet"
        : `${ordinal(report.roomPercentile)} percentile among same-progress teams`;
  const averageDelta = report?.market.averageDelta ?? null;
  const turnGap = report?.slotContext;
  const consensusOnly = Boolean(
    report &&
      report.market.judgedPicks > 0 &&
      report.market.consensusRankPicks === report.market.judgedPicks
  );
  const evidenceIntro = consensusOnly
    ? "This scores your picks against the other teams in this same draft using published consensus rank, roster shape, and format fit. Consensus rank measures expert board position. Market price requires usable ADP. It reads draft process. Projected points, win probability, and roster-specific dollar EV require a separate simulation."
    : "This scores your picks against the other teams in this same draft, on the price the market put on each player, the shape of your roster, and how well it fits the format. It reads draft process. Projected points, win probability, and roster-specific dollar EV require a separate simulation.";
  // The widest meter belongs to the heaviest component, and the rest are
  // drawn against it, so a track's length is that component's share of the read.
  const heaviest = Math.max(0, ...(report?.components.map((component) => component.weight) ?? []));

  return (
    <section className="ffb-stack ffb-ov-outlook" aria-labelledby={headingId}>
      <div className="ffb-stack ffb-stack-tight">
        <div className="ffb-sechead">
          <h3 id={headingId} className="ffb-h3">
            {unavailableReason
              ? "Draft Outlook paused"
              : report?.picksDrafted
                ? "How this room reads right now"
                : "Waiting for your first pick"}
          </h3>
          {!unavailableReason ? (
            <p className="ffb-sechead-note ffb-cluster">
              Draft Outlook{" "}
              {report ? <span className="ffb-badge">{confidenceLabel(report.confidence)}</span> : null}
            </p>
          ) : null}
        </div>
        {!unavailableReason ? <p className="ffb-method">{evidenceIntro}</p> : null}
      </div>

      <div className="ffb-ov-outlook-cols">
        {unavailableReason ? (
          <div className="ffb-notice ffb-notice-warn" role="status">
            <p>{unavailableReason}</p>
          </div>
        ) : report?.picksDrafted ? (
          <div className="ffb-stack">
            <div>
              <dl className="ffb-facts">
                <div className="ffb-fact">
                  <dt>Your rank in this room, modeled</dt>
                  <dd>{rankLabel}</dd>
                  <dd className="ffb-fact-note">{rankCaption}</dd>
                </div>
                <div className="ffb-fact">
                  <dt>{consensusOnly ? "Calculated consensus value" : "Calculated market value"}</dt>
                  <dd className={averageDelta === null ? undefined : signTone(averageDelta)}>
                    {averageDelta === null ? "Not set" : signedNumber(averageDelta)}
                  </dd>
                  <dd className="ffb-fact-note">
                    {consensusOnly
                      ? "Raw draft slots against published consensus rank per judged pick. This snapshot has no usable ADP evidence for these picks."
                      : "Raw draft slots per priced pick. The market component discounts thin or volatile ADP evidence."}
                  </dd>
                </div>
              </dl>
              {turnGap ? (
                <p className="ffb-fact-foot">
                  Slot {turnGap.slot} has {turnGap.minimumTurnGap === turnGap.maximumTurnGap
                    ? `a ${turnGap.maximumTurnGap} pick gap between turns`
                    : `${turnGap.minimumTurnGap} to ${turnGap.maximumTurnGap} pick gaps between turns`}.
                  {consensusOnly
                    ? " Consensus value uses every actual overall pick."
                    : " Market value already uses every actual overall pick."}
                </p>
              ) : null}
            </div>

            <div>
              {report.components.map((component) => (
                <div key={component.id} className="ffb-score">
                  <span className="ffb-score-label">{componentLabel(component, consensusOnly)}</span>{" "}
                  <span className="ffb-score-value">
                    {component.score} score · {Math.round(component.weight * 100)}% weight
                  </span>
                  <span
                    className="ffb-meter ffb-meter-weighted"
                    role="progressbar"
                    aria-label={`${componentLabel(component, consensusOnly)} score`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={component.score}
                    style={
                      {
                        "--ffb-value": `${component.score}%`,
                        "--ffb-weight": `${heaviest > 0 ? Math.round((component.weight / heaviest) * 100) : 100}%`,
                      } as CSSProperties
                    }
                  />{" "}
                  <span className="ffb-score-note">{component.detail}</span>
                </div>
              ))}
              <p className="ffb-method ffb-dotlist ffb-ov-provenance">
                {["Published ranks", "Calculated signals", "Modeled room rank", report.modelVersion.replace("draft-outlook-", "Model ")].map(
                  (label, index) => (
                    <Fragment key={label}>
                      {index > 0 ? " " : null}
                      <span>{label}</span>
                    </Fragment>
                  )
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="ffb-ov-outlook-empty">
            The first read appears after a team has one pick. It becomes more useful as the roster and room fill in.
          </p>
        )}

        <div className="ffb-stack">
          {economics ? (
            <ContestMath
              headingId={`${headingId}-contest-math`}
              economics={economics}
              contestName={economicsContestName}
              sourceUrl={economicsSourceUrl}
            />
          ) : null}

          <ExpectedReturnCalculator
            id={`${headingId}-return`}
            defaultEntryCost={defaultEntryCost}
            value={calculatorValue}
            onChange={onCalculatorChange}
          />
        </div>
      </div>
    </section>
  );
}
