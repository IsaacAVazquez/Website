"use client";

import { Link as LinkIcon, RefreshCw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useKeepPressedInView } from "@/components/football/useKeepPressedInView";
import {
  DECISION_PRESETS,
  evaluateDecision,
  getDecisionPreset,
  type DecisionEvaluation,
  type DecisionMetrics,
} from "./decision-lab-data";
import {
  buildDecisionLabHref,
  DECISION_LAB_ROUTE,
  normalizeDecisionLabState,
  type DecisionLabState,
} from "./decision-lab-state";
import { verdictContributions, verdictStamp, type VerdictContribution } from "./verdictStamp";
import "./decision-lab.css";
import { SavedBets } from "./SavedBetWorkspace";


interface MetricDefinition {
  key: keyof DecisionMetrics;
  label: string;
  helper: string;
}

const metricDefinitions: readonly MetricDefinition[] = [
  { key: "impact", label: "Impact", helper: "How much outcome I expect if this lands." },
  { key: "confidence", label: "Confidence", helper: "How much proof I think I have right now." },
  {
    key: "effort",
    label: "Effort",
    helper: "How expensive the build feels relative to the team. Lower is better here.",
  },
  {
    key: "reversibility",
    label: "Reversibility",
    helper: "How easy it would be to unwind if I learn I was wrong.",
  },
] as const;

// --- Matrix geometry --------------------------------------------------------
// A square plot, confidence on x and impact on y (inverted, since a high
// impact point sits near the top). Padding on every side leaves room for the
// axis titles the frame carries.

const PAD_L = 54;
const PAD_R = 24;
const PAD_T = 26;
const PAD_B = 64;
const PLOT_SIZE = 382;
const VIEW_W = PAD_L + PLOT_SIZE + PAD_R;
const VIEW_H = PAD_T + PLOT_SIZE + PAD_B;
// The impact and confidence gates a ship call needs (evaluateDecision in
// decision-lab-data.ts). The score gate has no axis, so it is not drawn.
const SHIP_CONFIDENCE = 60;
const SHIP_IMPACT = 65;
// A slider drag fires a change per tick, so the URL follows the draft after
// this pause instead of on every move.
const COMMIT_DELAY_MS = 200;

/**
 * The sliders live in the URL, and every commit is a plain history replace.
 * The router syncs useSearchParams from the native call, so a commit never
 * waits on a server render of this page the way router.replace did. An href
 * the bar already shows is left alone.
 */
function replaceHref(href: string) {
  if (href === `${window.location.pathname}${window.location.search}`) return;
  window.history.replaceState(null, "", href);
}

function plotX(confidence: number): number {
  return PAD_L + (confidence / 100) * PLOT_SIZE;
}

function plotY(impact: number): number {
  return PAD_T + ((100 - impact) / 100) * PLOT_SIZE;
}

/** Keeps a centered label's edges inside [min, max]. */
function fitCenterX(x: number, halfWidth: number, min: number, max: number): number {
  if (max - min <= halfWidth * 2) return (min + max) / 2;
  return Math.min(max - halfWidth, Math.max(min + halfWidth, x));
}

function DecisionMatrix({
  metrics,
  evaluation,
  pointLabel,
}: {
  metrics: DecisionMetrics;
  evaluation: DecisionEvaluation;
  pointLabel: string;
}) {
  const stamp = verdictStamp(evaluation.recommendation);
  const activeX = plotX(metrics.confidence);
  const activeY = plotY(metrics.impact);
  const thresholdX = PAD_L + (SHIP_CONFIDENCE / 100) * PLOT_SIZE;
  const thresholdY = PAD_T + ((100 - SHIP_IMPACT) / 100) * PLOT_SIZE;

  // The stamp prints in the quadrant opposite the active point, so it stays
  // clear of the mark it is explaining, except in a small band just under
  // both gates where the tilted frame's corner reaches the point.
  const pointOnRight = metrics.confidence >= SHIP_CONFIDENCE;
  const pointOnTop = metrics.impact >= SHIP_IMPACT;
  const stampCx = PAD_L + (pointOnRight ? 0.25 : 0.75) * PLOT_SIZE;
  const stampCy = PAD_T + (pointOnTop ? 0.75 : 0.25) * PLOT_SIZE;

  // Half of "ACTIVE" at the phone-width size set in decision-lab.css, the wider of the two.
  const activeLabelX = fitCenterX(activeX, 40, PAD_L, PAD_L + PLOT_SIZE);
  // Above the point unless that crowds the frame or another preset's ring,
  // then below it.
  const neighbours = DECISION_PRESETS.map((preset) => [plotX(preset.confidence), plotY(preset.impact)]).filter(
    ([x, y]) => Math.hypot(x - activeX, y - activeY) > 2,
  );
  const labelClear = (y: number) =>
    y - PAD_T > 12 && neighbours.every(([x, ny]) => Math.abs(x - activeLabelX) > 40 || Math.abs(ny - (y - 5)) > 12);
  const activeLabelY = [activeY - 18, activeY + 24].find(labelClear) ?? (activeY - PAD_T > 30 ? activeY - 18 : activeY + 24);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={`Confidence ${metrics.confidence}, impact ${metrics.impact}, for ${pointLabel}. Verdict stamped ${stamp.word}.`}
      className="dl-matrix"
    >
      {/* Tokens go through `style`, since an SVG presentation attribute
          cannot substitute var(). */}
      <rect x={PAD_L} y={PAD_T} width={PLOT_SIZE} height={PLOT_SIZE} fill="none" style={{ stroke: "var(--c97-rule)" }} />

      {[25, 50, 75].map((tick) => (
        <g key={tick} aria-hidden="true">
          <line
            x1={PAD_L + (tick / 100) * PLOT_SIZE}
            y1={PAD_T}
            x2={PAD_L + (tick / 100) * PLOT_SIZE}
            y2={PAD_T + PLOT_SIZE}
            style={{ stroke: "var(--c97-rule)" }}
            strokeDasharray="2 6"
          />
          <line
            x1={PAD_L}
            y1={PAD_T + (tick / 100) * PLOT_SIZE}
            x2={PAD_L + PLOT_SIZE}
            y2={PAD_T + (tick / 100) * PLOT_SIZE}
            style={{ stroke: "var(--c97-rule)" }}
            strokeDasharray="2 6"
          />
        </g>
      ))}

      <g aria-hidden="true">
        <line
          x1={thresholdX}
          y1={PAD_T}
          x2={thresholdX}
          y2={PAD_T + PLOT_SIZE}
          style={{ stroke: "var(--c97-ink-2)" }}
          strokeWidth={2}
        />
        <line
          x1={PAD_L}
          y1={thresholdY}
          x2={PAD_L + PLOT_SIZE}
          y2={thresholdY}
          style={{ stroke: "var(--c97-ink-2)" }}
          strokeWidth={2}
        />
      </g>

      <g aria-hidden="true">
        {DECISION_PRESETS.map((preset) => (
          <circle
            key={preset.id}
            cx={plotX(preset.confidence)}
            cy={plotY(preset.impact)}
            r={5}
            fill="none"
            style={{ stroke: "var(--c97-ink-2)" }}
            strokeWidth={1.5}
          />
        ))}
        <circle
          cx={activeX}
          cy={activeY}
          r={8}
          strokeWidth={2}
          style={{ fill: "var(--c97-ink)", stroke: "var(--c97-surface)" }}
        />
        <text x={activeLabelX} y={activeLabelY} textAnchor="middle" className="dl-point-label">
          ACTIVE
        </text>
      </g>

      {/* The tilt sits on a group of its own, since the stamp-down animation
          sets a CSS transform on .dl-stamp and that replaces a transform
          attribute on the same element. */}
      <g transform={`rotate(-9 ${stampCx} ${stampCy})`} aria-hidden="true">
        <g className="dl-stamp">
          <rect
            x={stampCx - 86}
            y={stampCy - 34}
            width={172}
            height={68}
            fill="none"
            style={{ stroke: "var(--c97-overprint)" }}
            strokeWidth={3}
          />
          <rect
            x={stampCx - 78}
            y={stampCy - 26}
            width={156}
            height={52}
            fill="none"
            style={{ stroke: "var(--c97-overprint)" }}
            strokeWidth={1.5}
          />
          <text x={stampCx} y={stampCy + 13} textAnchor="middle" className="dl-stamp-word">
            {stamp.word}
          </text>
        </g>
      </g>

      <text x={PAD_L + PLOT_SIZE / 2} y={VIEW_H - 8} textAnchor="middle" className="dl-axis-label">
        Confidence
      </text>
      {/* A rotated label reads a getScreenCTM 'a' of ~0 to the route probe
          (its horizontal scale term drops out at 90deg), so this sits
          horizontal above the y-axis instead of running along it. */}
      <text x={PAD_L} y={PAD_T - 10} textAnchor="start" className="dl-axis-label">
        Impact
      </text>
    </svg>
  );
}

function ContributionRow({ row }: { row: VerdictContribution }) {
  return (
    <li className="dl-contribution">
      <span className="dl-contribution-label">{row.label}</span>
      <span className="dl-contribution-bar" aria-hidden="true">
        <span style={{ width: `${row.raw}%` }} />
      </span>
      <span className="dl-contribution-math">
        {row.raw} × {row.weight.toFixed(2)} = <strong>{row.contribution.toFixed(2)}</strong>
      </span>
    </li>
  );
}

function WhyThisVerdict({
  metrics,
  evaluation,
  headingId,
}: {
  metrics: DecisionMetrics;
  evaluation: DecisionEvaluation;
  headingId: string;
}) {
  const contributions = verdictContributions(metrics);

  return (
    <section className="dl-why" aria-labelledby={headingId}>
      <h2 id={headingId}>Why this verdict</h2>
      <ol className="dl-contributions">
        {contributions.map((row) => (
          <ContributionRow key={row.axis} row={row} />
        ))}
        <li className="dl-contribution dl-contribution-total">
          <span className="dl-contribution-label">Weighted score</span>
          {/* Every contribution is a multiple of 0.05, so the rows and their
              sum print two places. At one place each row rounds on its own
              and the rows stop adding up to this line. */}
          <span className="dl-contribution-math">
            <strong>{contributions.reduce((sum, row) => sum + row.contribution, 0).toFixed(2)}</strong>
          </span>
        </li>
      </ol>
      <p className="dl-rationale">{evaluation.rationale}</p>
      <p className="dl-fine">
        Ship needs score ≥ 68 with impact ≥ 65 and confidence ≥ 60. Test fires when impact ≥ 60 or score ≥ 50.
        Otherwise it holds. Decision Lab keeps those axes separate, then forces a plain call.
      </p>
    </section>
  );
}

function MetricSlider({
  label,
  helper,
  value,
  baseValue,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  baseValue: number;
  onChange: (value: number) => void;
}) {
  const inputId = `decision-lab-${label.toLowerCase()}`;
  const delta = value - baseValue;
  const deltaLabel = delta === 0 ? "Preset" : `${delta > 0 ? "+" : ""}${delta} vs preset`;

  return (
    <div className="dl-slider">
      <div className="dl-slider-head">
        <label htmlFor={inputId}>{label}</label>
        <span className="dl-slider-value">{value}</span>
        <span className="dl-slider-delta" data-changed={delta !== 0 || undefined}>
          {deltaLabel}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
        aria-describedby={`${inputId}-helper`}
        className="dl-range"
      />
      <p id={`${inputId}-helper`} className="dl-helper">
        {helper}
      </p>
    </div>
  );
}

function DecisionLabWorkbench({ routeState }: { routeState: DecisionLabState }) {
  // The draft is the page's state, seeded from the URL once, and the URL
  // follows it after a pause. Back or forward is the one URL change the draft
  // did not write, so it alone re-seeds the draft; the router's own copy of
  // the URL lags a commit by a transition, so it is never read back.
  const [draftState, setDraftState] = useState(routeState);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const ids = useId();
  // On a phone the chips are one row that scrolls sideways, so a shared link
  // to a later preset would open with its pressed chip off screen.
  const chipsRef = useRef<HTMLDivElement>(null);
  useKeepPressedInView(chipsRef, draftState.preset);
  useEffect(() => {
    const id = window.setTimeout(
      () => replaceHref(buildDecisionLabHref(draftState)),
      COMMIT_DELAY_MS
    );
    return () => window.clearTimeout(id);
  }, [draftState]);
  useEffect(() => {
    const reseed = () =>
      setDraftState(normalizeDecisionLabState(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", reseed);
    return () => window.removeEventListener("popstate", reseed);
  }, []);

  const activePreset = getDecisionPreset(draftState.preset);
  const evaluation = evaluateDecision(draftState);
  const stamp = verdictStamp(evaluation.recommendation);
  const currentHref = buildDecisionLabHref(draftState);
  const hasPresetOverride =
    draftState.impact !== activePreset.impact ||
    draftState.confidence !== activePreset.confidence ||
    draftState.effort !== activePreset.effort ||
    draftState.reversibility !== activePreset.reversibility;
  const crumbLabel = hasPresetOverride ? "Custom" : activePreset.name;
  const copyMessage =
    copyStatus === "copied" ? "Link copied" : copyStatus === "error" ? "Copy failed, so copy the address bar instead" : "";

  function commitState(nextState: DecisionLabState) {
    setDraftState(nextState);
    setCopyStatus("idle");
  }

  function handlePresetChange(presetId: DecisionLabState["preset"]) {
    const preset = getDecisionPreset(presetId);
    commitState({
      preset: presetId,
      impact: preset.impact,
      confidence: preset.confidence,
      effort: preset.effort,
      reversibility: preset.reversibility,
    });
  }

  function handleMetricChange(key: keyof DecisionMetrics, value: number) {
    commitState({ ...draftState, [key]: value });
  }

  function handleResetToPreset() {
    commitState({
      preset: draftState.preset,
      impact: activePreset.impact,
      confidence: activePreset.confidence,
      effort: activePreset.effort,
      reversibility: activePreset.reversibility,
    });
  }

  async function handleCopyLink() {
    try {
      if (!navigator.clipboard) {
        throw new Error("clipboard unavailable");
      }
      await navigator.clipboard.writeText(new URL(currentHref, window.location.origin).toString());
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="dl" data-testid="decision-lab-shell">
      <div className="dl-page c97-shell c97-frame">
        <header className="dl-title">
          <h1>Decision Lab</h1>
          <p>I built this to pressure-test product bets before a confident story outruns the actual tradeoff.</p>
        </header>

        <section className="dl-presets" aria-labelledby={`${ids}-presets`}>
          <h2 id={`${ids}-presets`} className="sr-only">
            Presets
          </h2>
          <div ref={chipsRef} className="dl-chips" role="group" aria-labelledby={`${ids}-presets`}>
            {DECISION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={preset.id === draftState.preset}
                onClick={() => handlePresetChange(preset.id)}
                className="dl-chip"
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="dl-preset-row">
            {/* The hint describes the preset's own numbers, so it goes once a slider leaves them. */}
            <p className="dl-preset-note">
              {hasPresetOverride ? (
                <span>Custom, from {activePreset.name}.</span>
              ) : (
                <>
                  <span>{activePreset.name}.</span> {activePreset.outcomeHint}
                </>
              )}
            </p>
            <div className="dl-tools">
              <button type="button" onClick={handleResetToPreset} disabled={!hasPresetOverride} className="dl-link">
                <RefreshCw size={14} aria-hidden="true" />
                Reset to preset
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleCopyLink();
                }}
                className="dl-link"
              >
                <LinkIcon size={14} aria-hidden="true" />
                Copy link
              </button>
              {copyMessage ? (
                <span className="dl-copy" aria-hidden="true">
                  {copyMessage}
                </span>
              ) : null}
              <span className="sr-only" role="status">
                {copyMessage}
              </span>
            </div>
          </div>
        </section>

        <div className="dl-sheet">
          <div className="dl-inputs">
            <h2 className="sr-only">Score the tradeoff</h2>
            {/* The verdict line and the four sliders come first, so on a phone the call changes right above the control that moved it. */}
            <p className="dl-caption" role="status" aria-live="polite">
              Score {evaluation.weightedScore} · {stamp.word}
            </p>
            {metricDefinitions.map((metric) => (
              <MetricSlider
                key={metric.key}
                label={metric.label}
                helper={metric.helper}
                value={draftState[metric.key]}
                baseValue={activePreset[metric.key]}
                onChange={(value) => handleMetricChange(metric.key, value)}
              />
            ))}
          </div>
          <figure className="dl-figure">
            <DecisionMatrix metrics={draftState} evaluation={evaluation} pointLabel={crumbLabel} />
          </figure>
          <WhyThisVerdict metrics={draftState} evaluation={evaluation} headingId={`${ids}-why`} />
        </div>
        <SavedBets state={draftState} onLoad={commitState} />
      </div>
    </div>
  );
}

export function DecisionLabClient() {
  const searchParams = useSearchParams();
  // The URL is the only source. Back from another page can restore the
  // server's state for a deep link the visitor has since cleared.
  const routeState = normalizeDecisionLabState(searchParams);
  const currentQuery = searchParams.toString();
  const currentHref = currentQuery ? `${DECISION_LAB_ROUTE}?${currentQuery}` : DECISION_LAB_ROUTE;
  const canonicalHref = buildDecisionLabHref(routeState);
  const hasManagedParams =
    searchParams.get("preset") !== null ||
    searchParams.get("impact") !== null ||
    searchParams.get("confidence") !== null ||
    searchParams.get("effort") !== null ||
    searchParams.get("reversibility") !== null;

  useEffect(() => {
    if (hasManagedParams && currentHref !== canonicalHref) replaceHref(canonicalHref);
  }, [canonicalHref, currentHref, hasManagedParams]);

  return <DecisionLabWorkbench routeState={routeState} />;
}
