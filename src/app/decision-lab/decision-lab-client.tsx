"use client";

import { Link as LinkIcon, RefreshCw, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Catalog97HeroReadouts,
  Catalog97ProjectHero,
} from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
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

interface DecisionLabClientProps {
  initialState: DecisionLabState;
}

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

  // The stamp prints in the quadrant the active point is not in, so it
  // never covers the mark it is explaining.
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
      className="c97-decision-matrix"
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
        <text x={activeLabelX} y={activeLabelY} textAnchor="middle" className="c97-decision-point-label">
          ACTIVE
        </text>
      </g>

      <g
        className="c97-decision-stamp"
        transform={`rotate(-9 ${stampCx} ${stampCy})`}
        aria-hidden="true"
      >
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
        <text x={stampCx} y={stampCy + 13} textAnchor="middle" className="c97-decision-stamp-word">
          {stamp.word}
        </text>
      </g>

      <text x={PAD_L + PLOT_SIZE / 2} y={VIEW_H - 8} textAnchor="middle" className="c97-decision-axis-label">
        Confidence
      </text>
      {/* A rotated label reads a getScreenCTM 'a' of ~0 to the route probe
          (its horizontal scale term drops out at 90deg), so this sits
          horizontal above the y-axis instead of running along it. */}
      <text x={PAD_L} y={PAD_T - 10} textAnchor="start" className="c97-decision-axis-label">
        Impact
      </text>
    </svg>
  );
}

function ContributionRow({ row }: { row: VerdictContribution }) {
  return (
    <div className="c97-decision-contribution-row">
      <div>
        <p className="c97-serif" style={{ margin: 0, fontSize: "var(--c97-fs-h3)" }}>
          {row.label}
        </p>
        <span className="c97-meter" style={{ marginTop: "var(--c97-sp-1)" }}>
          <span style={{ width: `${row.raw}%` }} />
        </span>
      </div>
      <p className="c97-mono c97-tabular" style={{ margin: 0, color: "var(--c97-ink)" }}>
        {row.raw} × {row.weight.toFixed(2)} = <strong>{row.contribution.toFixed(1)}</strong>
      </p>
    </div>
  );
}

function WhyThisVerdict({
  metrics,
  evaluation,
}: {
  metrics: DecisionMetrics;
  evaluation: DecisionEvaluation;
}) {
  const contributions = verdictContributions(metrics);

  return (
    <div>
      <div>
        {contributions.map((row) => (
          <ContributionRow key={row.axis} row={row} />
        ))}
      </div>
      <p
        className="c97-prose"
        style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", marginTop: "var(--c97-sp-3)" }}
      >
        Ship needs score ≥ 68 with impact ≥ 65 and confidence ≥ 60. Test fires when impact ≥
        60 or score ≥ 50. Otherwise it holds.
      </p>
      <p className="c97-prose" style={{ color: "var(--c97-ink)", marginTop: "var(--c97-sp-2)" }}>
        {evaluation.rationale}
      </p>
      <p className="c97-prose" style={{ color: "var(--c97-ink-2)", marginTop: "var(--c97-sp-1)" }}>
        Decision Lab keeps those axes separate, then forces a plain call.
      </p>
    </div>
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
    <div style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--c97-sp-3)" }}>
        <label htmlFor={inputId} className="c97-serif" style={{ fontSize: "var(--c97-fs-h3)" }}>
          {label}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-2)" }}>
          <span className="c97-chip c97-tabular">{value}</span>
          <span className="c97-mono c97-tabular" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
            {deltaLabel}
          </span>
        </div>
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
        className="c97-range"
      />
      <p id={`${inputId}-helper`} className="c97-prose" style={{ margin: 0, fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
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
  const presetDelta =
    draftState.impact -
    activePreset.impact +
    (draftState.confidence - activePreset.confidence) +
    (draftState.effort - activePreset.effort) +
    (draftState.reversibility - activePreset.reversibility);

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

  const lead = PROJECT_PRESS[DECISION_LAB_ROUTE].lead;
  const standfirst =
    "I built this to pressure-test product bets before a confident story outruns the actual tradeoff.";

  return (
    <>
      <Catalog97ProjectHero ink={lead} title="Decision Lab" standfirst={standfirst}>
        {/* The sliders drive the three figures, so the figures print after
            the sliders, which also keeps the first slider on a phone's first
            screen. */}
        <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
          {/* The verdict line and the four sliders come first, so on a phone the call changes right above the control that moved it. */}
          <div className="c97-decision-signature">
            <div style={{ display: "grid", gap: "var(--c97-sp-4)" }}>
              <h2 className="sr-only">Score the tradeoff</h2>
              <p className="c97-decision-caption" role="status" aria-live="polite">
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
            <DecisionMatrix metrics={draftState} evaluation={evaluation} pointLabel={crumbLabel} />
          </div>
        </div>
        <Catalog97HeroReadouts
          readouts={[
            { label: "Weighted score", value: evaluation.weightedScore },
            { label: "Active preset", value: crumbLabel },
            {
              label: "Vs preset",
              value: hasPresetOverride ? `${presetDelta > 0 ? "+" : ""}${presetDelta}` : "0",
              detail: hasPresetOverride ? "Sum across axes" : "Matches preset",
            },
          ]}
        />
      </Catalog97ProjectHero>

      <section
        className="c97-band c97-sheet"
        data-c97-surface="paper"
        data-seam="torn"
        data-testid="decision-lab-shell"
      >
        <div className="c97-shell">
          <h2 className="c97-poster-sm">Why this verdict</h2>
          <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
            Active: {activePreset.name}
          </p>

          <div className="c97-decision-body-grid" style={{ marginTop: "var(--c97-sp-4)" }}>
            <WhyThisVerdict metrics={draftState} evaluation={evaluation} />

            <div>
              <p className="c97-kicker" style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
                <Target size={12} aria-hidden="true" />
                Presets
              </p>
              <div className="c97-decision-preset-grid" style={{ marginTop: "var(--c97-sp-2)" }}>
                {DECISION_PRESETS.map((preset) => {
                  const isActive = preset.id === draftState.preset;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handlePresetChange(preset.id)}
                      className="c97-panel"
                      style={{
                        textAlign: "left",
                        minHeight: 44,
                        cursor: "pointer",
                      }}
                    >
                      <span className="c97-serif" style={{ display: "block" }}>
                        {preset.name}
                      </span>
                      <span
                        className="c97-mono"
                        style={{
                          display: "block",
                          fontSize: "var(--c97-fs-small)",
                          color: "var(--c97-ink-2)",
                          marginTop: "var(--c97-sp-1)",
                        }}
                      >
                        {preset.outcomeHint}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleResetToPreset}
                disabled={!hasPresetOverride}
                className="c97-btn-ghost"
                style={{ marginTop: "var(--c97-sp-3)", gap: "var(--c97-sp-1)" }}
              >
                <RefreshCw size={14} aria-hidden="true" />
                Reset to preset
              </button>

              <div style={{ marginTop: "var(--c97-sp-4)" }}>
                <p className="c97-kicker" style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
                  <LinkIcon size={12} aria-hidden="true" />
                  URL state
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyLink();
                  }}
                  className="c97-btn"
                  style={{ marginTop: "var(--c97-sp-2)" }}
                >
                  Copy link
                </button>
                <p
                  className="c97-prose"
                  style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", marginTop: "var(--c97-sp-2)" }}
                >
                  {copyStatus === "copied"
                    ? "Link copied"
                    : copyStatus === "error"
                      ? "Copy failed, so copy the address bar instead"
                      : "Copy to share. Every slider change is encoded."}
                </p>
                <p className="sr-only" role="status">
                  {copyStatus === "copied" ? "Link copied" : copyStatus === "error" ? "Copy failed, so copy the address bar instead" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function DecisionLabClient({ initialState }: DecisionLabClientProps) {
  const searchParams = useSearchParams();
  const normalizedRouteState = normalizeDecisionLabState(searchParams);
  const currentQuery = searchParams.toString();
  const currentHref = currentQuery ? `${DECISION_LAB_ROUTE}?${currentQuery}` : DECISION_LAB_ROUTE;
  const canonicalHref = buildDecisionLabHref(normalizedRouteState);
  const hasManagedParams =
    searchParams.get("preset") !== null ||
    searchParams.get("impact") !== null ||
    searchParams.get("confidence") !== null ||
    searchParams.get("effort") !== null ||
    searchParams.get("reversibility") !== null;
  const routeState = hasManagedParams ? normalizedRouteState : initialState;

  useEffect(() => {
    if (hasManagedParams && currentHref !== canonicalHref) replaceHref(canonicalHref);
  }, [canonicalHref, currentHref, hasManagedParams]);

  return <DecisionLabWorkbench routeState={routeState} />;
}
