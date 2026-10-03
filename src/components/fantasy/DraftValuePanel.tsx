"use client";

import { useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import {
  calculateContestFieldEconomics,
  calculateExpectedReturn,
  ROOM_RANK_MIN_PICKS,
  type ContestFieldEconomicsInput,
  type DraftValueReport,
} from "@/lib/fantasyTeamValue";

const TILE_STYLE = {
  borderColor: "var(--c97-rule)",
  background: "var(--c97-field)",
} as const;

const INPUT_STYLE = {
  borderColor: "var(--c97-rule)",
  background: "color-mix(in srgb, var(--c97-surface) 92%, var(--c97-field))",
  color: "var(--c97-ink)",
} as const;

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

/** Positive, negative, and zero each get their own tone; a sign is a state. */
function signTone(value: number): string {
  if (value > 0) return "var(--c97-positive)";
  if (value < 0) return "var(--c97-negative)";
  return "var(--c97-ink)";
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
    <details
      className="group border"
      style={{ borderColor: "var(--c97-rule)" }}
    >
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between text-sm font-semibold marker:hidden" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
        <span className="inline-flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
          <Calculator className="h-4 w-4" aria-hidden="true" />
          Expected return calculator
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-2)", borderColor: "var(--c97-rule)" }}>
        <p className="text-xs leading-5" style={{ color: "var(--c97-ink-2)" }}>
          Enter your own payout assumptions. The Draft Outlook does not set these probabilities,
          and this arithmetic does not include taxes.
        </p>

        <div className="grid" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
          <label className="grid text-xs" style={{ gap: "var(--c97-sp-0)" }} htmlFor={`${id}-entry-cost`}>
            <span className="font-semibold">Entry cost</span>
            <span className="relative">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center"
                style={{ color: "var(--c97-ink-2)" }}
              >
                $
              </span>
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
                className="min-h-[44px] w-full border text-sm tabular-nums"
                style={{ paddingLeft: "var(--c97-sp-3)", paddingRight: "var(--c97-sp-1)", ...(INPUT_STYLE) }}
                placeholder="100"
              />
            </span>
          </label>

          <label className="grid text-xs" style={{ gap: "var(--c97-sp-0)" }} htmlFor={`${id}-payout-chance`}>
            <span className="font-semibold">Chance of any payout</span>
            <span className="relative">
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
                className="min-h-[44px] w-full border text-sm tabular-nums"
                style={{ paddingInline: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-3)", ...(INPUT_STYLE) }}
                placeholder="20"
              />
              <span
                className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center"
                style={{ color: "var(--c97-ink-2)" }}
              >
                %
              </span>
            </span>
          </label>

          <label className="grid text-xs" style={{ gap: "var(--c97-sp-0)" }} htmlFor={`${id}-average-payout`}>
            <span className="font-semibold">Average total payout if paid</span>
            <span className="relative">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center"
                style={{ color: "var(--c97-ink-2)" }}
              >
                $
              </span>
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
                className="min-h-[44px] w-full border text-sm tabular-nums"
                style={{ paddingLeft: "var(--c97-sp-3)", paddingRight: "var(--c97-sp-1)", ...(INPUT_STYLE) }}
                placeholder="500"
              />
            </span>
          </label>
        </div>

        <p
          id={`${id}-status`}
          role="status"
          aria-live="polite"
          className="min-h-5 text-xs leading-5"
          style={{ marginTop: "var(--c97-sp-1)", color: validationMessage ? "var(--c97-negative)" : "var(--c97-ink-2)" }}
        >
          {validationMessage ??
            (result
              ? `Net expected value is ${signedCurrency(result.netExpectedValue)} before taxes.`
              : "Enter all three assumptions to calculate expected return.")}
        </p>

        {result ? (
          <div className="grid grid-cols-2" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }} aria-live="polite">
            <div className="border" style={{ padding: "var(--c97-sp-1)", ...(TILE_STYLE) }}>
              <p className="text-2xs font-semibold" style={{ color: "var(--c97-ink-2)" }}>
                Gross return
              </p>
              <p className="text-lg font-semibold tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>
                {CURRENCY.format(result.grossExpectedReturn)}
              </p>
            </div>
            <div className="border" style={{ padding: "var(--c97-sp-1)", ...(TILE_STYLE) }}>
              <p className="text-2xs font-semibold" style={{ color: "var(--c97-ink-2)" }}>
                Net EV
              </p>
              <p
                className="text-lg font-semibold tabular-nums"
                style={{ marginTop: "var(--c97-sp-0)", color: signTone(result.netExpectedValue) }}
              >
                {signedCurrency(result.netExpectedValue)}
              </p>
            </div>
            <div className="border" style={{ padding: "var(--c97-sp-1)", ...(TILE_STYLE) }}>
              <p className="text-2xs font-semibold" style={{ color: "var(--c97-ink-2)" }}>
                ROI
              </p>
              <p className="text-lg font-semibold tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>
                {result.roi === null ? "No entry cost" : percent(result.roi)}
              </p>
            </div>
            <div className="border" style={{ padding: "var(--c97-sp-1)", ...(TILE_STYLE) }}>
              <p className="text-2xs font-semibold" style={{ color: "var(--c97-ink-2)" }}>
                Break-even payout chance
              </p>
              <p className="text-lg font-semibold tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>
                {result.breakEvenPayoutProbability === null
                  ? "No payout"
                  : result.breakEvenPayoutProbability > 1
                    ? "Not possible"
                    : percent(result.breakEvenPayoutProbability)}
              </p>
            </div>
          </div>
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
    /* Nothing in this panel is live, active, or actionable, so it takes the
       rule-and-paper-alt treatment of the tiles above it rather than a
       signal wash; the signal stays on the top card and the progress bars. */
    <section
      className="border"
      style={{ padding: "var(--c97-sp-2)", ...(TILE_STYLE) }}
      aria-labelledby={headingId}
    >
      <p className="c97-kicker" style={{ marginBottom: "0.25rem" }}>Published contest math</p>
      <h4 id={headingId} className="text-sm font-semibold">
        {contestName ? `${contestName} field baseline` : "Published field baseline"}
      </h4>
      <div className="grid grid-cols-2 text-xs" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
        <div>
          <p style={{ color: "var(--c97-ink-2)" }}>Field gross</p>
          <p className="text-base font-semibold tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>
            {CURRENCY.format(result.grossExpectedReturn)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--c97-ink-2)" }}>Field net EV</p>
          <p
            className="text-base font-semibold tabular-nums"
            style={{ marginTop: "var(--c97-sp-0)", color: signTone(result.netExpectedValue) }}
          >
            {signedCurrency(result.netExpectedValue)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--c97-ink-2)" }}>First advance</p>
          <p className="text-base font-semibold tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>
            {economics.firstAdvanceRate === undefined ? "Not set" : percent(economics.firstAdvanceRate)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--c97-ink-2)" }}>Break-even edge</p>
          <p className="text-base font-semibold tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>
            {signedPercent(result.breakEvenEdge)}
          </p>
        </div>
      </div>
      <p className="text-2xs leading-5" style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
        {asOf ? `Field figures as of ${asOf}. ` : ""}
        At a full field, {WHOLE_CURRENCY.format(result.prizePool)} across {NUMBER.format(result.fieldEntries)} entries
        gives an equal-entry return before taxes. This field math stays separate from Draft Outlook.
      </p>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center text-xs font-semibold underline decoration-[var(--c97-rule)] underline-offset-4" style={{ marginTop: "var(--c97-sp-1)" }}
        >
          Check the current rules
        </a>
      ) : null}
    </section>
  );
}

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

  return (
    <section className="grid" style={{ gap: "var(--c97-sp-2)" }} aria-labelledby={headingId}>
      <div>
        <div className="flex flex-wrap items-center justify-between" style={{ gap: "var(--c97-sp-1)" }}>
          <p className="c97-kicker">Draft outlook</p>
          {report && !unavailableReason ? (
            <span
              className="border text-2xs font-semibold"
              style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-0)", borderColor: "var(--c97-rule)", color: "var(--c97-ink-2)" }}
            >
              {confidenceLabel(report.confidence)}
            </span>
          ) : null}
        </div>
        <h3 id={headingId} className="text-xl font-semibold" style={{ marginTop: "var(--c97-sp-0)" }}>
          {unavailableReason
            ? "Draft Outlook paused"
            : report?.picksDrafted
              ? "How this room reads right now"
              : "Waiting for your first pick"}
        </h3>
        {!unavailableReason ? (
          <p className="text-xs leading-5" style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
            {evidenceIntro}
          </p>
        ) : null}
      </div>

      {unavailableReason ? (
        <p
          role="status"
          className="border text-xs leading-5"
          style={{
            paddingInline: "var(--c97-sp-2)",
            paddingBlock: "var(--c97-sp-1)",
            borderColor: "color-mix(in srgb, var(--c97-warning) 48%, var(--c97-rule))",
            background: "color-mix(in srgb, var(--c97-warning) 10%, var(--c97-surface))",
            color: "var(--c97-ink-2)",
          }}
        >
          {unavailableReason}
        </p>
      ) : report?.picksDrafted ? (
        <>
          <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-1)" }}>
            <div className="border" style={{ padding: "var(--c97-sp-1)", ...(TILE_STYLE) }}>
              <p className="text-2xs font-semibold" style={{ color: "var(--c97-ink-2)" }}>
                Your rank in this room, modeled
              </p>
              <p className="text-2xl font-semibold tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>{rankLabel}</p>
              <p className="text-2xs" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}>
                {rankCaption}
              </p>
            </div>
            <div className="border" style={{ padding: "var(--c97-sp-1)", ...(TILE_STYLE) }}>
              <p className="text-2xs font-semibold" style={{ color: "var(--c97-ink-2)" }}>
                {consensusOnly ? "Calculated consensus value" : "Calculated market value"}
              </p>
              <p className="text-2xl font-semibold tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>
                {averageDelta === null ? "Not set" : signedNumber(averageDelta)}
              </p>
              <p className="text-2xs" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}>
                {consensusOnly
                  ? "Raw draft slots against published consensus rank per judged pick. This snapshot has no usable ADP evidence for these picks."
                  : "Raw draft slots per priced pick. The market component discounts thin or volatile ADP evidence."}
              </p>
            </div>
          </div>

          {turnGap ? (
            <p
              className="border text-xs leading-5"
              style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)", ...(TILE_STYLE) }}
            >
              Slot {turnGap.slot} has {turnGap.minimumTurnGap === turnGap.maximumTurnGap
                ? `a ${turnGap.maximumTurnGap} pick gap between turns`
                : `${turnGap.minimumTurnGap} to ${turnGap.maximumTurnGap} pick gaps between turns`}.
              {consensusOnly
                ? " Consensus value uses every actual overall pick."
                : " Market value already uses every actual overall pick."}
            </p>
          ) : null}

          <div className="grid" style={{ gap: "var(--c97-sp-1)" }}>
            {report.components.map((component) => (
              <div key={component.id}>
                <div className="flex items-center justify-between text-xs" style={{ gap: "var(--c97-sp-1)" }}>
                  <span className="font-semibold">
                    {componentLabel(component, consensusOnly)}
                  </span>
                  <span className="tabular-nums" style={{ color: "var(--c97-ink-2)" }}>
                    {component.score} score · {Math.round(component.weight * 100)}% weight
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden"
                  style={{ marginTop: "var(--c97-sp-0)", background: "var(--c97-rule)" }}
                  role="progressbar"
                  aria-label={`${componentLabel(component, consensusOnly)} score`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={component.score}
                >
                  <div
                    className="h-full"
                    style={{ width: `${component.score}%`, background: "var(--c97-accent)" }}
                  />
                </div>
                <p className="text-2xs leading-5" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}>
                  {component.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap text-2xs" style={{ gap: "var(--c97-sp-0)" }}>
            {["Published ranks", "Calculated signals", "Modeled room rank", report.modelVersion.replace("draft-outlook-", "Model ")].map((label) => (
              <span
                key={label}
                className="border"
                style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-0)", borderColor: "var(--c97-rule)", color: "var(--c97-ink-2)" }}
              >
                {label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs leading-5" style={{ color: "var(--c97-ink-2)" }}>
          The first read appears after a team has one pick. It becomes more useful as the roster and room fill in.
        </p>
      )}

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
    </section>
  );
}
