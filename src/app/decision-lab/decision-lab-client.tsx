"use client";

import { startTransition, useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconAdjustmentsHorizontal,
  IconBolt,
  IconChartScatter,
  IconLink,
  IconRefresh,
  IconTarget,
} from "@tabler/icons-react";
import {
  DECISION_PRESETS,
  evaluateDecision,
  getDecisionPreset,
  type DecisionMetrics,
  type DecisionRecommendation,
} from "./decision-lab-data";
import {
  buildDecisionLabHref,
  DECISION_LAB_ROUTE,
  normalizeDecisionLabState,
  type DecisionLabState,
} from "./decision-lab-state";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";

interface DecisionLabClientProps {
  initialState: DecisionLabState;
}

interface MetricDefinition {
  key: keyof DecisionMetrics;
  label: string;
  helper: string;
  accent: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const noMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

const metricDefinitions: readonly MetricDefinition[] = [
  {
    key: "impact",
    label: "Impact",
    helper: "How much outcome I expect if this lands.",
    accent: "var(--home-haze)",
  },
  {
    key: "confidence",
    label: "Confidence",
    helper: "How much proof I think I have right now.",
    accent: "var(--home-moss)",
  },
  {
    key: "effort",
    label: "Effort",
    helper: "How expensive the build feels relative to the team. Lower is better here.",
    accent: "var(--home-ink)",
  },
  {
    key: "reversibility",
    label: "Reversibility",
    helper: "How easy it would be to unwind if I learn I was wrong.",
    accent: "var(--home-acid)",
  },
] as const;

const recommendationCopy: Record<DecisionRecommendation, string> = {
  ship: "SHIP",
  test: "TEST",
  hold: "HOLD",
};

const recommendationTone: Record<
  DecisionRecommendation,
  { fill: string; tint: string; ring: string }
> = {
  ship: {
    fill: "var(--home-haze)",
    tint: "color-mix(in srgb, var(--home-haze) 16%, var(--home-paper))",
    ring: "color-mix(in srgb, var(--home-haze) 38%, var(--home-rule))",
  },
  test: {
    fill: "var(--home-acid)",
    tint: "color-mix(in srgb, var(--home-acid) 22%, var(--home-paper))",
    ring: "color-mix(in srgb, var(--home-acid) 42%, var(--home-rule))",
  },
  hold: {
    fill: "var(--home-stone)",
    tint: "color-mix(in srgb, var(--home-stone) 28%, var(--home-paper))",
    ring: "color-mix(in srgb, var(--home-stone) 55%, var(--home-rule))",
  },
};

function getMatrixCoordinates(confidence: number, impact: number, padding: number, size: number) {
  const x = padding + (confidence / 100) * size;
  const y = padding + ((100 - impact) / 100) * size;
  return { x, y };
}

function DecisionMatrix({ state }: { state: DecisionLabState }) {
  const padding = 22;
  const size = 220;
  const width = size + padding * 2;
  const height = size + padding * 2 + 14;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Confidence and impact matrix for Decision Lab presets"
      className="w-full max-w-full"
      style={{ display: "block" }}
    >
      <rect
        x={padding}
        y={padding}
        width={size}
        height={size}
        rx={16}
        fill="color-mix(in srgb, var(--home-paper) 82%, var(--home-elev-mix))"
        stroke="var(--home-rule)"
      />

      {[0, 25, 50, 75, 100].map((tick) => {
        const x = padding + (tick / 100) * size;
        const y = padding + ((100 - tick) / 100) * size;
        return (
          <g key={tick}>
            <line
              x1={x}
              y1={padding}
              x2={x}
              y2={padding + size}
              stroke="color-mix(in srgb, var(--home-rule) 75%, var(--home-elev-mix))"
              strokeDasharray="3 5"
            />
            <line
              x1={padding}
              y1={y}
              x2={padding + size}
              y2={y}
              stroke="color-mix(in srgb, var(--home-rule) 75%, var(--home-elev-mix))"
              strokeDasharray="3 5"
            />
          </g>
        );
      })}

      <line
        x1={padding + 0.6 * size}
        y1={padding}
        x2={padding + 0.6 * size}
        y2={padding + size}
        stroke="color-mix(in srgb, var(--home-haze) 45%, var(--home-rule))"
        strokeWidth="1.5"
      />
      <line
        x1={padding}
        y1={padding + 0.4 * size}
        x2={padding + size}
        y2={padding + 0.4 * size}
        stroke="color-mix(in srgb, var(--home-haze) 45%, var(--home-rule))"
        strokeWidth="1.5"
      />

      {DECISION_PRESETS.map((preset) => {
        const isActive = preset.id === state.preset;
        const point = isActive
          ? getMatrixCoordinates(state.confidence, state.impact, padding, size)
          : getMatrixCoordinates(preset.confidence, preset.impact, padding, size);

        return (
          <g key={preset.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={isActive ? 6.5 : 4.5}
              fill={
                isActive
                  ? "var(--home-haze)"
                  : "color-mix(in srgb, var(--home-ink) 55%, var(--home-paper))"
              }
              stroke={isActive ? "var(--home-paper)" : "transparent"}
              strokeWidth={isActive ? 2.5 : 0}
            />
            {isActive ? (
              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                style={{
                  fill: "var(--home-ink)",
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                ACTIVE
              </text>
            ) : null}
          </g>
        );
      })}

      <text
        x={padding + size / 2}
        y={height - 2}
        textAnchor="middle"
        style={{
          fill: "var(--home-ink-muted)",
          fontFamily: "var(--font-home-sans)",
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Confidence
      </text>
      <text
        x={10}
        y={padding + size / 2}
        textAnchor="middle"
        transform={`rotate(-90 10 ${padding + size / 2})`}
        style={{
          fill: "var(--home-ink-muted)",
          fontFamily: "var(--font-home-sans)",
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Impact
      </text>
    </svg>
  );
}

function MetricSlider({
  label,
  helper,
  value,
  baseValue,
  accent,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  baseValue: number;
  accent: string;
  onChange: (value: number) => void;
}) {
  const inputId = `decision-lab-${label.toLowerCase()}`;
  const delta = value - baseValue;
  const deltaLabel = delta === 0 ? "Preset" : `${delta > 0 ? "+" : ""}${delta} vs preset`;

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={inputId}
          className="text-[13px] font-semibold tracking-[-0.01em]"
          style={{ color: "var(--home-ink)" }}
        >
          {label}
        </label>
        <div className="flex items-center gap-2 text-[11.5px]" style={{ color: "var(--home-ink-muted)" }}>
          <span
            className="rounded-full border px-2 py-0.5 font-semibold tabular-nums"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 35%, var(--home-rule))`,
              background: `color-mix(in srgb, ${accent} 18%, var(--home-paper))`,
              color: "var(--home-ink)",
            }}
          >
            {value}
          </span>
          <span className="tabular-nums">{deltaLabel}</span>
        </div>
      </div>
      <p className="m-0 text-[12px] leading-snug" style={{ color: "var(--home-ink-muted)" }}>
        {helper}
      </p>
      <input
        id={inputId}
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
        className="block min-h-touch w-full"
        aria-label={label}
        style={{ accentColor: accent }}
      />
    </div>
  );
}

function DecisionLabWorkbench({
  routeState,
  variants,
  onCommit,
}: {
  routeState: DecisionLabState;
  variants: typeof fadeIn;
  onCommit: (nextState: DecisionLabState) => void;
}) {
  const [draftState, setDraftState] = useState(routeState);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const activePreset = getDecisionPreset(draftState.preset);
  const evaluation = evaluateDecision(draftState);
  const currentHref = buildDecisionLabHref(draftState);
  const tone = recommendationTone[evaluation.recommendation];
  const hasPresetOverride =
    draftState.impact !== activePreset.impact ||
    draftState.confidence !== activePreset.confidence ||
    draftState.effort !== activePreset.effort ||
    draftState.reversibility !== activePreset.reversibility;
  const crumbLabel = hasPresetOverride ? "Custom" : activePreset.name;

  function commitState(nextState: DecisionLabState) {
    setDraftState(nextState);
    setCopyStatus("idle");
    startTransition(() => {
      onCommit(nextState);
    });
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
      await navigator.clipboard.writeText(
        new URL(currentHref, window.location.origin).toString()
      );
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  // "Why this verdict" — surface the per-axis contributions to the weighted score.
  // Mirrors the formula in decision-lab-data.ts: impact*0.35 + confidence*0.25 + (100-effort)*0.25 + reversibility*0.15
  const contributions: ReadonlyArray<{
    axis: keyof DecisionMetrics;
    label: string;
    weight: number;
    raw: number;
    contribution: number;
    accent: string;
  }> = [
    {
      axis: "impact",
      label: "Impact",
      weight: 0.35,
      raw: draftState.impact,
      contribution: draftState.impact * 0.35,
      accent: "var(--home-haze)",
    },
    {
      axis: "confidence",
      label: "Confidence",
      weight: 0.25,
      raw: draftState.confidence,
      contribution: draftState.confidence * 0.25,
      accent: "var(--home-moss)",
    },
    {
      axis: "effort",
      label: "Effort (inverted)",
      weight: 0.25,
      raw: 100 - draftState.effort,
      contribution: (100 - draftState.effort) * 0.25,
      accent: "var(--home-ink)",
    },
    {
      axis: "reversibility",
      label: "Reversibility",
      weight: 0.15,
      raw: draftState.reversibility,
      contribution: draftState.reversibility * 0.15,
      accent: "var(--home-acid)",
    },
  ];

  const heroStyle: CSSProperties = {
    background: `linear-gradient(140deg, ${tone.tint} 0%, color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix)) 70%)`,
    borderColor: tone.ring,
  };

  const presetDelta =
    (draftState.impact - activePreset.impact) +
    (draftState.confidence - activePreset.confidence) +
    (draftState.effort - activePreset.effort) +
    (draftState.reversibility - activePreset.reversibility);

  const decisionStatsCells: HomeStatsCell[] = [
    { label: "Impact", value: draftState.impact },
    { label: "Confidence", value: draftState.confidence },
    { label: "Effort", value: draftState.effort, sub: "Lower is better" },
    { label: "Reversibility", value: draftState.reversibility },
    { label: "Weighted score", value: evaluation.weightedScore },
    {
      label: "Verdict",
      value: recommendationCopy[evaluation.recommendation],
      tone: evaluation.recommendation === "ship" ? "good" : "default",
    },
    { label: "Active preset", value: activePreset.name },
    {
      label: "Delta from preset",
      value: hasPresetOverride ? `${presetDelta > 0 ? "+" : ""}${presetDelta}` : "—",
      sub: hasPresetOverride ? "Sum across axes" : "Matches preset",
    },
  ];

  return (
    <section className="home-page min-h-screen" aria-label="Decision Lab" data-testid="decision-lab-shell">
      <div className="home-shell home-section">
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          <div className="tool-topbar" id="hero">
                <div>
                  <p className="tool-crumbs">
                    Decision Lab / <strong>{crumbLabel}</strong>
                  </p>
                  <h1>Decision Lab</h1>
                </div>

                <button
                  type="button"
                  onClick={handleResetToPreset}
                  disabled={!hasPresetOverride}
                  className="inline-flex min-h-touch items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
                    color: "var(--home-ink)",
                  }}
                >
                  <IconRefresh size={14} aria-hidden="true" />
                  Reset to defaults
                </button>
              </div>

              {/* Live verdict chip */}
              <div className="tool-meta-chip" role="status" aria-live="polite">
                <span
                  className="tool-meta-chip-dot"
                  aria-hidden="true"
                  style={{
                    background: tone.fill,
                    boxShadow: `0 0 0 3px color-mix(in srgb, ${tone.fill} 22%, transparent)`,
                  }}
                />
                <span>
                  Impact <strong>{draftState.impact}</strong>
                </span>
                <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
                <span>
                  Confidence <strong>{draftState.confidence}</strong>
                </span>
                <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
                <span>
                  Effort <strong>{draftState.effort}</strong>
                </span>
                <span className="tool-meta-chip-divider" aria-hidden="true">·</span>
                <span>
                  Reversibility <strong>{draftState.reversibility}</strong>
                </span>
                <span className="tool-meta-chip-spacer" />
                <span className="tool-meta-chip-meta tabular-nums">
                  Score {evaluation.weightedScore} · {recommendationCopy[evaluation.recommendation]}
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
                <div className="flex flex-col gap-5">
                <HomeStatsPanel
                  id="decision-lab-stats"
                  title="Decision at a glance"
                  meta={`Score ${evaluation.weightedScore} · ${recommendationCopy[evaluation.recommendation]}`}
                  hideLiveDot
                  cells={decisionStatsCells}
                  pills={[
                    { label: "Presets", href: "#hero" },
                    { label: "Sliders", href: "#hero" },
                    { label: "Verdict", href: "#hero" },
                  ]}
                />

                {/* Hero verdict card */}
                <div className="tool-card tool-card-hero" style={heroStyle}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="tool-section-kicker">Recommendation</p>
                      <p
                        className="m-0 mt-2 text-[2.4rem] font-semibold leading-none tracking-[-0.05em] tabular-nums"
                        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                      >
                        {recommendationCopy[evaluation.recommendation]}
                      </p>
                    </div>
                    <div
                      className="rounded-full px-4 py-2 text-[11.5px] font-semibold tabular-nums"
                      style={{
                        background: tone.tint,
                        border: `1px solid ${tone.ring}`,
                        color: "var(--home-ink)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      SCORE {evaluation.weightedScore}
                    </div>
                  </div>

                  <p
                    className="mt-5 max-w-3xl text-balance"
                    style={{
                      color: "var(--home-ink)",
                      fontFamily: "var(--font-home-sans)",
                      fontSize: "clamp(1.4rem, 1.4vw + 0.95rem, 1.85rem)",
                      fontWeight: 600,
                      lineHeight: 1.15,
                      letterSpacing: "-0.04em",
                      margin: 0,
                    }}
                  >
                    I built this to pressure-test product bets before a confident story outruns the actual tradeoff.
                  </p>

                  <p
                    className="mt-3 max-w-2xl text-[13.5px] leading-relaxed"
                    style={{ color: "var(--home-ink)" }}
                  >
                    {evaluation.rationale}
                  </p>
                  <p
                    className="mt-2 max-w-2xl text-[13px] leading-relaxed"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Decision Lab keeps those axes separate, then forces a plain call.
                  </p>
                </div>

                {/* Sliders */}
                <div className="tool-card">
                  <div className="tool-section-header mb-4">
                    <div>
                      <p className="tool-section-kicker">
                        <IconAdjustmentsHorizontal size={12} aria-hidden="true" className="mr-1.5 inline align-middle" />
                        Inputs
                      </p>
                      <h2 className="tool-section-title">Score the tradeoff</h2>
                    </div>
                    <span className="text-[11.5px]" style={{ color: "var(--home-ink-muted)" }}>
                      Active: {activePreset.name}
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {metricDefinitions.map((metric) => (
                      <MetricSlider
                        key={metric.key}
                        label={metric.label}
                        helper={metric.helper}
                        value={draftState[metric.key]}
                        baseValue={activePreset[metric.key]}
                        accent={metric.accent}
                        onChange={(value) => handleMetricChange(metric.key, value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Matrix */}
                <div className="tool-card">
                  <div className="tool-section-header mb-3">
                    <div>
                      <p className="tool-section-kicker">
                        <IconChartScatter size={12} aria-hidden="true" className="mr-1.5 inline align-middle" />
                        Matrix
                      </p>
                      <h2 className="tool-section-title">Confidence vs. impact</h2>
                    </div>
                    <span className="text-[11.5px]" style={{ color: "var(--home-ink-muted)" }}>
                      Active point updates with the sliders
                    </span>
                  </div>
                  <DecisionMatrix state={draftState} />
                </div>
              </div>

            {/* Rail */}
            <aside
              aria-label="Verdict rail"
              className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_74%,var(--home-elev-mix))] p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
            >
              <section>
                <p className="tool-rail-label">
                  <IconBolt size={12} aria-hidden="true" />
                  Why this verdict
                </p>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {contributions.map((c) => (
                    <li
                      key={c.axis}
                      className="grid items-center gap-3 rounded-[14px] border px-3 py-2 text-[12px]"
                      style={{
                        gridTemplateColumns: "auto 1fr auto",
                        borderColor: "var(--home-rule)",
                        background: "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
                        color: "var(--home-ink)",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: c.accent }}
                      />
                      <span className="min-w-0 truncate font-medium" style={{ color: "var(--home-ink)" }}>
                        {c.label}
                      </span>
                      <span
                        className="tabular-nums text-[11.5px]"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        {c.raw} × {c.weight.toFixed(2)} ={" "}
                        <strong style={{ color: "var(--home-ink)" }}>{c.contribution.toFixed(1)}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
                <p
                  className="mt-3 mb-0 text-[11.5px] leading-snug"
                  style={{ color: "var(--home-ink-muted)" }}
                >
                  Ship needs score ≥ 68 with impact ≥ 65 and confidence ≥ 60. Test fires when
                  impact ≥ 60 or score ≥ 50. Otherwise it holds.
                </p>
              </section>

              <section>
                <p className="tool-rail-label">
                  <IconTarget size={12} aria-hidden="true" />
                  Presets
                </p>
                <div className="grid gap-1.5">
                  {DECISION_PRESETS.map((preset) => {
                    const isActive = preset.id === draftState.preset;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetChange(preset.id)}
                        aria-pressed={isActive}
                        className="min-h-touch rounded-[12px] border px-3 py-2 text-left text-[12.5px] font-semibold transition-colors"
                        style={{
                          borderColor: isActive
                            ? "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))"
                            : "var(--home-rule)",
                          background: isActive
                            ? "color-mix(in srgb, var(--home-haze) 14%, var(--home-paper))"
                            : "color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))",
                          color: "var(--home-ink)",
                        }}
                      >
                        <span className="block truncate">{preset.name}</span>
                        <span
                          className="block truncate text-2xs font-normal"
                          style={{ color: "var(--home-ink-muted)" }}
                        >
                          {preset.outcomeHint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="tool-rail-foot">
                <div className="grid w-full gap-2">
                  <p
                    className="m-0 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    <IconLink size={11} aria-hidden="true" />
                    URL state
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopyLink();
                    }}
                    className="min-h-touch rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                    style={{
                      borderColor: "color-mix(in srgb, var(--home-haze) 28%, var(--home-rule))",
                      background: "color-mix(in srgb, var(--home-haze) 12%, var(--home-paper))",
                      color: "var(--home-ink)",
                    }}
                  >
                    Copy link
                  </button>
                  <p
                    className="m-0 text-2xs leading-snug"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    {copyStatus === "copied"
                      ? "Link copied"
                      : copyStatus === "error"
                        ? "Copy failed"
                        : "Copy to share. Every slider change is encoded."}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function DecisionLabClient({ initialState }: DecisionLabClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;
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
    if (hasManagedParams && currentHref !== canonicalHref) {
      startTransition(() => {
        router.replace(canonicalHref, { scroll: false });
      });
    }
  }, [canonicalHref, currentHref, hasManagedParams, router]);

  return (
    <DecisionLabWorkbench
      key={buildDecisionLabHref(routeState)}
      routeState={routeState}
      variants={variants}
      onCommit={(nextState) => router.replace(buildDecisionLabHref(nextState), { scroll: false })}
    />
  );
}
