"use client";

import { startTransition, useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
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
  hidden: { opacity: 1, y: 0 },
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

const recommendationAccent: Record<DecisionRecommendation, string> = {
  ship: "var(--home-haze)",
  test: "var(--home-acid)",
  hold: "var(--home-ink)",
};

const recommendationCopy: Record<DecisionRecommendation, string> = {
  ship: "Ship",
  test: "Test",
  hold: "Hold",
};

function getPanelStyle(): CSSProperties {
  return {
    background: "color-mix(in srgb, var(--home-paper-alt) 74%, white)",
    border: "1px solid var(--home-rule)",
    boxShadow: "var(--shadow-sm)",
  };
}

function getMatrixCoordinates(confidence: number, impact: number) {
  const padding = 26;
  const size = 240;
  const x = padding + (confidence / 100) * size;
  const y = padding + ((100 - impact) / 100) * size;
  return { x, y };
}

function DecisionMatrix({ state }: { state: DecisionLabState }) {
  const activePreset = getDecisionPreset(state.preset);
  const width = 292;
  const height = 292;
  const padding = 26;
  const size = 240;

  return (
    <div className="home-card overflow-hidden p-5 sm:p-6" style={getPanelStyle()}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="home-kicker mb-1">Matrix</p>
          <h2
            className="text-[1.2rem] font-semibold tracking-[-0.04em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            Confidence vs. impact
          </h2>
        </div>
        <span className="resume-chip">Active point updates with the sliders</span>
      </div>

      <div className="mt-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Confidence and impact matrix for Decision Lab presets"
          className="w-full"
        >
          <rect
            x={padding}
            y={padding}
            width={size}
            height={size}
            rx={18}
            fill="color-mix(in srgb, var(--home-paper) 82%, white)"
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
                  stroke="color-mix(in srgb, var(--home-rule) 75%, white)"
                  strokeDasharray="3 5"
                />
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + size}
                  y2={y}
                  stroke="color-mix(in srgb, var(--home-rule) 75%, white)"
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
              ? getMatrixCoordinates(state.confidence, state.impact)
              : getMatrixCoordinates(preset.confidence, preset.impact);

            return (
              <g key={preset.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 7 : 5}
                  fill={
                    isActive
                      ? "var(--home-haze)"
                      : "color-mix(in srgb, var(--home-ink) 55%, var(--home-paper))"
                  }
                  stroke={isActive ? "var(--home-paper)" : "transparent"}
                  strokeWidth={isActive ? 3 : 0}
                />
                {isActive ? (
                  <text
                    x={point.x}
                    y={point.y - 14}
                    textAnchor="middle"
                    style={{
                      fill: "var(--home-ink)",
                      fontFamily: "var(--font-home-sans)",
                      fontSize: "11px",
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
            y={height - 10}
            textAnchor="middle"
            style={{
              fill: "var(--home-ink-muted)",
              fontFamily: "var(--font-home-sans)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Confidence
          </text>
          <text
            x={16}
            y={padding + size / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${padding + size / 2})`}
            style={{
              fill: "var(--home-ink-muted)",
              fontFamily: "var(--font-home-sans)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Impact
          </text>
        </svg>
      </div>

      <p className="mt-4 mb-0 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
        {activePreset.name} stays selected as the active scenario even when I push the sliders away
        from its default shape.
      </p>
    </div>
  );
}

function RecommendationCard({ state }: { state: DecisionLabState }) {
  const evaluation = evaluateDecision(state);
  const activePreset = getDecisionPreset(state.preset);

  return (
    <div className="home-card h-full p-5 sm:p-6" style={getPanelStyle()}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="home-kicker mb-1">Recommendation</p>
          <h2
            className="text-[1.35rem] font-semibold tracking-[-0.05em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {recommendationCopy[evaluation.recommendation]}
          </h2>
        </div>
        <div
          className="rounded-full px-4 py-2"
          style={{
            background: `color-mix(in srgb, ${recommendationAccent[evaluation.recommendation]} 18%, var(--home-paper))`,
            border: `1px solid color-mix(in srgb, ${recommendationAccent[evaluation.recommendation]} 35%, var(--home-rule))`,
            color: "var(--home-ink)",
          }}
        >
          <span className="home-kicker">Score {evaluation.weightedScore}</span>
        </div>
      </div>

      <p
        className="mt-5 text-[1rem] leading-relaxed"
        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
      >
        {evaluation.rationale}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] px-4 py-4" style={getPanelStyle()}>
          <p className="home-kicker mb-1">Active preset</p>
          <p
            className="mb-1 text-base font-semibold tracking-[-0.03em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {activePreset.name}
          </p>
          <p className="mb-0 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
            {activePreset.outcomeHint}
          </p>
        </div>
        <div className="rounded-[1.2rem] px-4 py-4" style={getPanelStyle()}>
          <p className="home-kicker mb-1">Current call</p>
          <p
            className="mb-1 text-base font-semibold tracking-[-0.03em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {evaluation.recommendation === "ship"
              ? "Strong enough to commit"
              : evaluation.recommendation === "test"
                ? "Good enough to learn on"
                : "Better to leave parked"}
          </p>
          <p className="mb-0 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
            The label moves as soon as the score, impact floor, or confidence floor changes.
          </p>
        </div>
      </div>
    </div>
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
    <div className="rounded-[1.2rem] px-4 py-4" style={getPanelStyle()}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <label
            htmlFor={inputId}
            className="block text-base font-semibold tracking-[-0.03em]"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {label}
          </label>
          <p className="mb-0 mt-1 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
            {helper}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span
            className="resume-chip"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 35%, var(--home-rule))`,
              background: `color-mix(in srgb, ${accent} 18%, var(--home-paper))`,
            }}
          >
            {value}
          </span>
          <span
            className="resume-chip"
            style={{
              borderColor:
                delta === 0
                  ? "var(--home-rule)"
                  : `color-mix(in srgb, ${accent} 22%, var(--home-rule))`,
              background:
                delta === 0
                  ? "color-mix(in srgb, var(--home-paper) 92%, white)"
                  : `color-mix(in srgb, ${accent} 12%, var(--home-paper))`,
            }}
          >
            {deltaLabel}
          </span>
        </div>
      </div>

      <input
        id={inputId}
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
        className="mt-4 block min-h-touch w-full accent-[var(--home-haze)]"
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
  const hasPresetOverride =
    draftState.impact !== activePreset.impact ||
    draftState.confidence !== activePreset.confidence ||
    draftState.effort !== activePreset.effort ||
    draftState.reversibility !== activePreset.reversibility;

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
    commitState({
      ...draftState,
      [key]: value,
    });
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

  return (
    <section className="home-page min-h-screen" aria-label="Decision Lab" data-testid="decision-lab-shell">
      <div className="home-shell home-section space-y-6 sm:space-y-8">
        <motion.div variants={variants} initial="hidden" animate="visible">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="home-kicker">Decision Lab</p>
              <h1
                className="max-w-4xl text-balance"
                style={{
                  color: "var(--home-ink)",
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "clamp(2.6rem, 6vw, 5rem)",
                  fontWeight: 600,
                  lineHeight: 0.94,
                  letterSpacing: "-0.08em",
                }}
              >
                I built this to pressure-test product bets before a confident story outruns the actual tradeoff.
              </h1>
              <p className="home-body max-w-[42rem]">
                I do not think most roadmap arguments fail because people cannot tell a good story. I
                think they fail because impact, confidence, effort, and reversibility get blended into
                one vague feeling. Decision Lab keeps those axes separate, then forces a plain call.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="resume-chip">Six curated product scenarios</span>
                <span className="resume-chip">Deep-linkable slider state</span>
                <span className="resume-chip">Deterministic scoring model</span>
                {hasPresetOverride ? <span className="resume-chip">Preset unlocked</span> : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResetToPreset}
                  disabled={!hasPresetOverride}
                  className="min-h-touch rounded-full px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color,box-shadow] duration-200 ease disabled:cursor-not-allowed disabled:opacity-55"
                  style={{
                    ...getPanelStyle(),
                    color: "var(--home-ink)",
                    fontFamily: "var(--font-home-sans)",
                  }}
                >
                  Reset to preset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyLink();
                  }}
                  className="min-h-touch rounded-full px-4 py-2 text-sm font-semibold transition-[transform,border-color,background-color,color,box-shadow] duration-200 ease"
                  style={{
                    ...getPanelStyle(),
                    background: "color-mix(in srgb, var(--home-haze) 12%, var(--home-paper))",
                    borderColor: "color-mix(in srgb, var(--home-haze) 28%, var(--home-rule))",
                    color: "var(--home-ink)",
                    fontFamily: "var(--font-home-sans)",
                  }}
                >
                  Copy link
                </button>
                {copyStatus === "copied" ? <span className="resume-chip">Link copied</span> : null}
                {copyStatus === "error" ? <span className="resume-chip">Copy failed</span> : null}
              </div>
            </div>

            <RecommendationCard state={draftState} />
          </div>
        </motion.div>

        <motion.div variants={variants} initial="hidden" animate="visible">
          <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-5">
              <div className="home-card p-5 sm:p-6" style={getPanelStyle()}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="home-kicker mb-1">Preset rail</p>
                    <h2
                      className="text-[1.2rem] font-semibold tracking-[-0.04em]"
                      style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                    >
                      Scenario presets
                    </h2>
                  </div>
                  <span className="resume-chip">Selected: {activePreset.name}</span>
                </div>

                <div className="mt-5 grid gap-3">
                  {DECISION_PRESETS.map((preset) => {
                    const isActive = preset.id === draftState.preset;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetChange(preset.id)}
                        aria-pressed={isActive}
                        className="min-h-touch rounded-[1.25rem] px-4 py-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ease"
                        style={{
                          ...getPanelStyle(),
                          background: isActive
                            ? "color-mix(in srgb, var(--home-haze) 13%, var(--home-paper))"
                            : "color-mix(in srgb, var(--home-paper-alt) 68%, white)",
                          borderColor: isActive
                            ? "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))"
                            : "var(--home-rule)",
                          boxShadow: isActive ? "var(--shadow-md)" : "var(--shadow-sm)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="home-kicker">Preset</span>
                            <p
                              className="mb-1 mt-2 text-base font-semibold tracking-[-0.03em]"
                              style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                            >
                              {preset.name}
                            </p>
                          </div>
                          {isActive ? <span className="resume-chip">Active</span> : null}
                        </div>
                        <p className="mb-0 mt-3 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                          {preset.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <DecisionMatrix state={draftState} />
            </div>

            <div className="space-y-5">
              <div className="home-card p-5 sm:p-6" style={getPanelStyle()}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="home-kicker mb-1">Workbench</p>
                    <h2
                      className="text-[1.2rem] font-semibold tracking-[-0.04em]"
                      style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                    >
                      Score the tradeoff directly
                    </h2>
                  </div>
                  <span className="resume-chip">{recommendationCopy[evaluation.recommendation]} right now</span>
                </div>

                <div className="mt-5 grid gap-4">
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

              <div className="grid gap-4 md:grid-cols-3">
                <div className="home-card p-5" style={getPanelStyle()}>
                  <p className="home-kicker mb-2">Ship</p>
                  <h2
                    className="text-[1.05rem] font-semibold tracking-[-0.03em]"
                    style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                  >
                    I ship when upside and proof both clear the bar.
                  </h2>
                  <p className="mb-0 mt-3 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                    The model only says ship when score is at least 68 and both impact and confidence
                    are already sturdy.
                  </p>
                </div>

                <div className="home-card p-5" style={getPanelStyle()}>
                  <p className="home-kicker mb-2">Test</p>
                  <h2
                    className="text-[1.05rem] font-semibold tracking-[-0.03em]"
                    style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                  >
                    I test when the bet is interesting, but not clean enough to trust.
                  </h2>
                  <p className="mb-0 mt-3 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                    This is where I still see a reason to learn, either because impact is high or the
                    blended score stays respectable.
                  </p>
                </div>

                <div className="home-card p-5" style={getPanelStyle()}>
                  <p className="home-kicker mb-2">Hold</p>
                  <h2
                    className="text-[1.05rem] font-semibold tracking-[-0.03em]"
                    style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                  >
                    I hold when the case still feels weaker than the cost of attention.
                  </h2>
                  <p className="mb-0 mt-3 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                    A hold is not a moral judgment. It just means the tradeoff still looks worse than
                    the story people want to tell about it.
                  </p>
                </div>
              </div>
            </div>
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
