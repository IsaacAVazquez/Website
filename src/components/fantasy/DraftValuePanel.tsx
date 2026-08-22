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
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper-alt) 62%, var(--home-elev-mix))",
} as const;

const INPUT_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
  color: "var(--home-ink)",
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

function ordinal(value: number): string {
  const whole = Math.round(value);
  const mod100 = whole % 100;
  const suffix = mod100 >= 11 && mod100 <= 13
    ? "th"
    : whole % 10 === 1
      ? "st"
      : whole % 10 === 2
        ? "nd"
        : whole % 10 === 3
          ? "rd"
          : "th";
  return `${whole}${suffix}`;
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
      className="group rounded-[var(--radius-2xl)] border"
      style={{ borderColor: "var(--home-rule)" }}
    >
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold marker:hidden">
        <span className="inline-flex items-center gap-2">
          <Calculator className="h-4 w-4" aria-hidden="true" />
          Expected return calculator
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t px-4 pb-4 pt-4" style={{ borderColor: "var(--home-rule)" }}>
        <p className="text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
          Enter your own payout assumptions. The Draft Outlook does not set these probabilities,
          and this arithmetic does not include taxes.
        </p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-xs" htmlFor={`${id}-entry-cost`}>
            <span className="font-semibold">Entry cost</span>
            <span className="relative">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center"
                style={{ color: "var(--home-ink-muted)" }}
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
                className="min-h-[44px] w-full rounded-[var(--radius-xl)] border pl-7 pr-3 text-sm tabular-nums"
                style={INPUT_STYLE}
                placeholder="100"
              />
            </span>
          </label>

          <label className="grid gap-1.5 text-xs" htmlFor={`${id}-payout-chance`}>
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
                className="min-h-[44px] w-full rounded-[var(--radius-xl)] border px-3 pr-8 text-sm tabular-nums"
                style={INPUT_STYLE}
                placeholder="20"
              />
              <span
                className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center"
                style={{ color: "var(--home-ink-muted)" }}
              >
                %
              </span>
            </span>
          </label>

          <label className="grid gap-1.5 text-xs" htmlFor={`${id}-average-payout`}>
            <span className="font-semibold">Average total payout if paid</span>
            <span className="relative">
              <span
                className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center"
                style={{ color: "var(--home-ink-muted)" }}
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
                className="min-h-[44px] w-full rounded-[var(--radius-xl)] border pl-7 pr-3 text-sm tabular-nums"
                style={INPUT_STYLE}
                placeholder="500"
              />
            </span>
          </label>
        </div>

        <p
          id={`${id}-status`}
          role="status"
          aria-live="polite"
          className="mt-3 min-h-5 text-xs leading-5"
          style={{ color: validationMessage ? "var(--home-negative)" : "var(--home-ink-muted)" }}
        >
          {validationMessage ??
            (result
              ? `Net expected value is ${signedCurrency(result.netExpectedValue)} before taxes.`
              : "Enter all three assumptions to calculate expected return.")}
        </p>

        {result ? (
          <div className="mt-4 grid grid-cols-2 gap-2" aria-live="polite">
            <div className="rounded-[var(--radius-xl)] border p-3" style={TILE_STYLE}>
              <p className="text-2xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                Gross return
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {CURRENCY.format(result.grossExpectedReturn)}
              </p>
            </div>
            <div className="rounded-[var(--radius-xl)] border p-3" style={TILE_STYLE}>
              <p className="text-2xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                Net EV
              </p>
              <p
                className="mt-1 text-lg font-semibold tabular-nums"
                style={{
                  color:
                    result.netExpectedValue > 0
                      ? "var(--home-positive)"
                      : result.netExpectedValue < 0
                        ? "var(--home-negative)"
                        : "var(--home-ink)",
                }}
              >
                {signedCurrency(result.netExpectedValue)}
              </p>
            </div>
            <div className="rounded-[var(--radius-xl)] border p-3" style={TILE_STYLE}>
              <p className="text-2xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                ROI
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {result.roi === null ? "No entry cost" : percent(result.roi)}
              </p>
            </div>
            <div className="rounded-[var(--radius-xl)] border p-3" style={TILE_STYLE}>
              <p className="text-2xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                Break-even payout chance
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
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

function ContestMath({
  headingId,
  economics,
  sourceUrl,
}: {
  headingId: string;
  economics: ContestFieldEconomicsInput & { firstAdvanceRate?: number };
  sourceUrl?: string;
}) {
  const result = calculateContestFieldEconomics(economics);
  if (!result) return null;

  return (
    <section
      className="rounded-[var(--radius-2xl)] border p-4"
      style={{
        borderColor: "color-mix(in srgb, var(--home-signal) 42%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-signal) 7%, var(--home-paper))",
      }}
      aria-labelledby={headingId}
    >
      <p className="home-kicker mb-1">Published contest math</p>
      <h4 id={headingId} className="text-sm font-semibold">
        Best Ball Mania VII field baseline
      </h4>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p style={{ color: "var(--home-ink-muted)" }}>Field gross</p>
          <p className="mt-1 text-base font-semibold tabular-nums">
            {CURRENCY.format(result.grossExpectedReturn)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--home-ink-muted)" }}>Field net EV</p>
          <p className="mt-1 text-base font-semibold tabular-nums" style={{ color: "var(--home-negative)" }}>
            {signedCurrency(result.netExpectedValue)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--home-ink-muted)" }}>First advance</p>
          <p className="mt-1 text-base font-semibold tabular-nums">
            {economics.firstAdvanceRate === undefined ? "Not set" : percent(economics.firstAdvanceRate)}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--home-ink-muted)" }}>Break-even edge</p>
          <p className="mt-1 text-base font-semibold tabular-nums">
            {signedPercent(result.breakEvenEdge)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-2xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
        At a full field, {WHOLE_CURRENCY.format(result.prizePool)} across {NUMBER.format(result.fieldEntries)} entries
        gives an equal-entry return before taxes. This field math stays separate from Draft Outlook.
      </p>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold underline decoration-[var(--home-rule)] underline-offset-4"
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
  economicsSourceUrl,
  defaultEntryCost,
  calculatorValue,
  onCalculatorChange,
  unavailableReason,
}: {
  report: DraftValueReport | null;
  headingId: string;
  economics?: ContestFieldEconomicsInput & { firstAdvanceRate?: number };
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
    <section className="grid gap-4" aria-labelledby={headingId}>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="home-kicker mb-0">Draft outlook</p>
          {report && !unavailableReason ? (
            <span
              className="rounded-full border px-2.5 py-1 text-2xs font-semibold"
              style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
            >
              {confidenceLabel(report.confidence)}
            </span>
          ) : null}
        </div>
        <h3 id={headingId} className="mt-1 text-xl font-semibold">
          {unavailableReason
            ? "Draft Outlook paused"
            : report?.picksDrafted
              ? "How this room reads right now"
              : "Waiting for your first pick"}
        </h3>
        {!unavailableReason ? (
          <p className="mt-2 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
            {evidenceIntro}
          </p>
        ) : null}
      </div>

      {unavailableReason ? (
        <p
          role="status"
          className="rounded-[var(--radius-2xl)] border px-4 py-3 text-xs leading-5"
          style={{
            borderColor: "color-mix(in srgb, var(--home-warning) 48%, var(--home-rule))",
            background: "color-mix(in srgb, var(--home-warning) 10%, var(--home-paper))",
            color: "var(--home-ink-muted)",
          }}
        >
          {unavailableReason}
        </p>
      ) : report?.picksDrafted ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-2xl)] border p-3" style={TILE_STYLE}>
              <p className="text-2xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                Your rank in this room, modeled
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{rankLabel}</p>
              <p className="mt-1 text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                {rankCaption}
              </p>
            </div>
            <div className="rounded-[var(--radius-2xl)] border p-3" style={TILE_STYLE}>
              <p className="text-2xs font-semibold" style={{ color: "var(--home-ink-muted)" }}>
                {consensusOnly ? "Calculated consensus value" : "Calculated market value"}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {averageDelta === null ? "Not set" : signedNumber(averageDelta)}
              </p>
              <p className="mt-1 text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                {consensusOnly
                  ? "Raw draft slots against published consensus rank per judged pick. This snapshot has no usable ADP evidence for these picks."
                  : "Raw draft slots per priced pick. The market component discounts thin or volatile ADP evidence."}
              </p>
            </div>
          </div>

          {turnGap ? (
            <p
              className="rounded-[var(--radius-2xl)] border px-3 py-3 text-xs leading-5"
              style={TILE_STYLE}
            >
              Slot {turnGap.slot} has {turnGap.minimumTurnGap === turnGap.maximumTurnGap
                ? `a ${turnGap.maximumTurnGap} pick gap between turns`
                : `${turnGap.minimumTurnGap} to ${turnGap.maximumTurnGap} pick gaps between turns`}.
              {consensusOnly
                ? " Consensus value uses every actual overall pick."
                : " Market value already uses every actual overall pick."}
            </p>
          ) : null}

          <div className="grid gap-3">
            {report.components.map((component) => (
              <div key={component.id}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold">
                    {componentLabel(component, consensusOnly)}
                  </span>
                  <span className="tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
                    {component.score} score · {Math.round(component.weight * 100)}% weight
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                  style={{ background: "var(--home-stone)" }}
                  role="progressbar"
                  aria-label={`${componentLabel(component, consensusOnly)} score`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={component.score}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${component.score}%`, background: "var(--home-signal)" }}
                  />
                </div>
                <p className="mt-1 text-2xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
                  {component.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 text-2xs">
            {["Published ranks", "Calculated signals", "Modeled room rank", report.modelVersion.replace("draft-outlook-", "Model ")].map((label) => (
              <span
                key={label}
                className="rounded-full border px-2.5 py-1"
                style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
              >
                {label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
          The first read appears after a team has one pick. It becomes more useful as the roster and room fill in.
        </p>
      )}

      {economics ? (
        <ContestMath
          headingId={`${headingId}-contest-math`}
          economics={economics}
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
