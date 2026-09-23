"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CI_OPTIONS,
  DEFAULT_TEAM_INTAKE,
  DOCUMENTATION_GAPS,
  ENABLEMENT_TEAM_SNAPSHOTS,
  LABELS,
  LANGUAGE_OPTIONS,
  MATURITY_OPTIONS,
  SURFACE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TEST_LAYER_OPTIONS,
  TROUBLESHOOTING_PROMPTS,
  type TeamIntake,
} from "./enablement-data";
import {
  buildEscalationDraft,
  generateOnboardingPlan,
  getProgramMetrics,
  matchTroubleshootingQuestion,
  recommendToolchains,
  TROUBLESHOOTING_CONFIDENCE_THRESHOLD,
  type ScoredToolchain,
  type TroubleshootingMatch,
} from "./enablement-engine";
import {
  INTAKE_STEP_COUNT,
  moveIntakeStep,
  resetTeamIntake,
  toggleTestLayer,
  updateIntake,
  type IntakeStep,
} from "./enablement-state";

type WorkspaceView = "program" | "team";

/*
 * Every section on this route is a Catalog 97 band. The shared styles below
 * are the few compositions the vocabulary has no class for: a fieldset drawn
 * as a panel, a check-plus-text option row, the small helper line under an
 * option, a fixed-pitch snippet block, and the wrapping header row that puts
 * an action beside a section heading.
 */
const fieldsetStyle: CSSProperties = {
  border: 0,
  margin: 0,
  minWidth: 0,
};

/*
 * A legend sits in the fieldset's border area, above its padding, so on a
 * panel it would hug the top edge. Floating it puts it back in normal flow
 * inside the padding; the block after it clears the float.
 */
const legendStyle: CSSProperties = {
  float: "left",
  width: "100%",
  padding: 0,
};

const optionStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "var(--c97-sp-2)",
  minHeight: 44,
  paddingBlock: "var(--c97-sp-1)",
  cursor: "pointer",
};

const optionLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "var(--c97-fs-body)",
  lineHeight: "var(--c97-lh-tight)",
  color: "var(--c97-ink)",
};

const helperStyle: CSSProperties = {
  display: "block",
  marginTop: "var(--c97-sp-1)",
  fontSize: "var(--c97-fs-small)",
  lineHeight: "var(--c97-lh-body)",
  color: "var(--c97-ink-2)",
};

const smallTextStyle: CSSProperties = {
  fontSize: "var(--c97-fs-small)",
  lineHeight: "var(--c97-lh-body)",
  color: "var(--c97-ink-2)",
  margin: 0,
};

const snippetStyle: CSSProperties = {
  margin: 0,
  padding: "var(--c97-sp-2)",
  fontSize: "var(--c97-fs-small)",
  lineHeight: "var(--c97-lh-body)",
  color: "var(--c97-ink)",
  background: "var(--c97-field)",
  overflowX: "auto",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "var(--c97-sp-3)",
};

const fullWidthButtonStyle: CSSProperties = {
  width: "100%",
  justifyContent: "center",
  marginTop: "var(--c97-sp-2)",
};

const termStyle: CSSProperties = {
  margin: 0,
  marginTop: "var(--c97-sp-1)",
  fontSize: "var(--c97-fs-small)",
  lineHeight: "var(--c97-lh-body)",
  color: "var(--c97-ink)",
};

function SectionHeading({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div style={{ maxWidth: "var(--c97-column)" }}>
      <p className="c97-kicker">{kicker}</p>
      <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
        {title}
      </h2>
      {children ? (
        <div
          className="c97-prose"
          style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="c97-stat">
      <p className="c97-stat-label">{label}</p>
      <p className="c97-stat-value c97-tabular">{value}</p>
      <p className="c97-stat-delta">{detail}</p>
    </div>
  );
}

function WorkspaceTabs({
  view,
  onChange,
}: {
  view: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
}) {
  return (
    <div
      className="c97-segmented"
      role="tablist"
      aria-label="Enablement workspace views"
    >
      {(
        [
          ["program", "Program dashboard"],
          ["team", "Onboard a team"],
        ] as const
      ).map(([id, label]) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className="c97-microlink"
            /*
             * The segmented group styles its pressed state off `aria-pressed`,
             * which a `role="tab"` cannot carry, so the selected underline is
             * drawn inline from the same values.
             */
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "baseline",
              color: active ? "var(--c97-ink)" : "var(--c97-label)",
              textDecoration: active ? "underline" : "none",
              textDecorationThickness: 2,
              textUnderlineOffset: 6,
              textDecorationColor: "var(--c97-accent)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ProgramDashboard({ onStart }: { onStart: () => void }) {
  const metrics = useMemo(() => getProgramMetrics(), []);
  const maxGapCount = DOCUMENTATION_GAPS[0]?.count ?? 1;
  const driftTeams = ENABLEMENT_TEAM_SNAPSHOTS.filter(
    (team) => team.standardStatus !== "standard"
  );

  return (
    <div role="tabpanel" aria-label="Program dashboard">
      <section
        aria-labelledby="program-metrics-heading"
        className="c97-band"
        data-c97-surface="bone"
      >
        <div className="c97-shell">
          <div style={headerRowStyle}>
            <SectionHeading kicker="Portfolio signal" title="See where the standard is holding">
              <p id="program-metrics-heading">
                This simulated view covers twelve independent teams. I care about the resolution
                rate, but the more useful output is the failure log because it tells the central
                team where documentation and integrations still break down.
              </p>
            </SectionHeading>
            <button type="button" className="c97-btn" onClick={onStart}>
              Onboard a team
            </button>
          </div>

          <div className="c97-columns" style={{ marginTop: "var(--c97-sp-4)" }}>
            <MetricCard
              value={`${metrics.resolutionRate}%`}
              label="Resolved without a human"
              detail={`${metrics.resolvedQuestions} of ${metrics.totalQuestions} seeded questions`}
            />
            <MetricCard
              value={`${metrics.adoptionRate}%`}
              label="Standard adoption"
              detail={`${metrics.standardTeams} of ${metrics.teamCount} teams on the full standard`}
            />
            <MetricCard
              value={String(metrics.driftTeams)}
              label="Teams in material drift"
              detail="Custom runners or unsupported result formats"
            />
            <MetricCard
              value={String(metrics.topGapCount)}
              label="Top unanswered gap"
              detail="Questions tied to shared test environment access"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="feedback-loop-heading"
        className="c97-band c97-band-tall"
        data-c97-surface="ink-blue"
      >
        <div className="c97-shell c97-columns">
          <div>
            <p className="c97-kicker">Feedback loop</p>
            <h2
              id="feedback-loop-heading"
              className="c97-serif c97-h2"
              style={{ marginTop: "var(--c97-sp-2)" }}
            >
              The failure log becomes the documentation roadmap.
            </h2>
            <p
              className="c97-prose"
              style={{
                marginTop: "var(--c97-sp-3)",
                color: "var(--c97-ink-2)",
                maxWidth: "var(--c97-measure-body)",
              }}
            >
              Every low-confidence answer is a trace of where the platform failed to transfer
              knowledge. Ranked across teams, those traces show which guide, integration, or
              policy clarification should be written next.
            </p>
          </div>

          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {DOCUMENTATION_GAPS.map((gap, index) => (
              <li
                key={gap.question}
                className="c97-row c97-row-numbered"
                style={{
                  borderTop: "1px solid var(--c97-rule)",
                  paddingBlock: "var(--c97-sp-3)",
                  rowGap: "var(--c97-sp-2)",
                }}
              >
                <span
                  className="c97-mono"
                  style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-label)" }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="c97-prose">{gap.question}</p>
                  <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>
                    {gap.teams} teams · owner {gap.owner}
                  </p>
                </div>
                <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)" }}>
                  {gap.count} asks
                </span>
                <span
                  className="c97-meter"
                  style={{ gridColumn: "2 / -1" }}
                  role="progressbar"
                  aria-valuenow={gap.count}
                  aria-valuemin={0}
                  aria-valuemax={maxGapCount}
                  aria-label={`${gap.question}: ${gap.count} unanswered questions`}
                >
                  <span
                    style={{ width: `${Math.round((gap.count / maxGapCount) * 100)}%` }}
                  />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="adoption-heading"
        className="c97-band"
        data-c97-surface="paper"
      >
        <div className="c97-shell">
          <SectionHeading kicker="Team adoption" title="One standard, twelve local realities">
            <p id="adoption-heading">
              The useful comparison is visible by team, from the stack each team runs, to the
              questions it resolves, to the exact point where it has drifted.
            </p>
          </SectionHeading>

          <div
            role="region"
            aria-label="Standard adoption by team"
            tabIndex={0}
            style={{ overflowX: "auto", marginTop: "var(--c97-sp-4)" }}
          >
            <table className="c97-table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Surface</th>
                  <th>Toolchain</th>
                  <th>Adoption</th>
                  <th data-align="end">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {ENABLEMENT_TEAM_SNAPSHOTS.map((team) => {
                  const rate = Math.round(
                    (team.resolvedQuestions /
                      (team.resolvedQuestions + team.escalatedQuestions)) *
                      100
                  );
                  return (
                    <tr key={team.name}>
                      {/*
                       * A row header, not a column header, so the sticky
                       * uppercase label treatment `.c97-table th` gives column
                       * headings is undone here.
                       */}
                      <th
                        style={{
                          position: "static",
                          fontSize: "var(--c97-fs-small)",
                          letterSpacing: 0,
                          textTransform: "none",
                          color: "var(--c97-ink)",
                          background: "none",
                        }}
                      >
                        {team.name}
                      </th>
                      <td style={{ color: "var(--c97-ink-2)" }}>
                        {LABELS.surfaces[team.surface]}
                      </td>
                      <td style={{ color: "var(--c97-ink-2)" }}>{team.toolchain}</td>
                      <td>
                        <span
                          className={`c97-chip ${
                            team.standardStatus === "standard"
                              ? "c97-chip-positive"
                              : team.standardStatus === "partial"
                                ? "c97-chip-warning"
                                : "c97-chip-negative"
                          }`}
                        >
                          {team.standardStatus}
                        </span>
                      </td>
                      <td data-align="end" className="c97-mono">
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="drift-heading"
        className="c97-band"
        data-c97-surface="bone"
      >
        <div className="c97-shell">
          <SectionHeading kicker="Standards drift" title="Where teams are leaving the shared path">
            <p id="drift-heading">
              Partial adoption matters because a team can use the recommended framework and still
              preserve the reporting and maintenance differences that made the portfolio hard to
              support.
            </p>
          </SectionHeading>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "var(--c97-sp-3)",
              marginTop: "var(--c97-sp-4)",
            }}
          >
            {driftTeams.map((team) => (
              <article key={team.name} className="c97-panel">
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "var(--c97-sp-2)",
                  }}
                >
                  <div>
                    <p className="c97-kicker">
                      {LABELS.surfaces[team.surface]} · {team.standardStatus}
                    </p>
                    <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
                      {team.name}
                    </h3>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 4,
                      width: 10,
                      height: 10,
                      background:
                        team.standardStatus === "drift"
                          ? "var(--c97-negative)"
                          : "var(--c97-warning)",
                    }}
                    aria-hidden="true"
                  />
                </div>
                <p
                  className="c97-prose"
                  style={{ marginTop: "var(--c97-sp-3)", color: "var(--c97-ink-2)" }}
                >
                  {team.driftReason}
                </p>
                <p
                  className="c97-kicker"
                  style={{
                    marginTop: "var(--c97-sp-3)",
                    paddingTop: "var(--c97-sp-2)",
                    borderTop: "1px solid var(--c97-rule)",
                  }}
                >
                  Current stack · {team.toolchain}
                </p>
              </article>
            ))}
          </div>

          <p
            style={{
              ...smallTextStyle,
              marginTop: "var(--c97-sp-5)",
              paddingTop: "var(--c97-sp-3)",
              borderTop: "1px solid var(--c97-rule)",
            }}
          >
            This dashboard uses invented, committed seed data for a portfolio demo. It does not
            describe a real organization or production program.
          </p>
        </div>
      </section>
    </div>
  );
}

function RadioOption({
  name,
  value,
  checked,
  label,
  helper,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  helper?: string;
  onChange: () => void;
}) {
  return (
    <label style={optionStyle}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="c97-check"
        style={{ flexShrink: 0, marginTop: 2 }}
      />
      <span>
        <span style={optionLabelStyle}>{label}</span>
        {helper ? <span style={helperStyle}>{helper}</span> : null}
      </span>
    </label>
  );
}

function IntakeForm({
  intake,
  step,
  onIntakeChange,
}: {
  intake: TeamIntake;
  step: IntakeStep;
  onIntakeChange: (intake: TeamIntake) => void;
}) {
  if (step === 0) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "var(--c97-sp-3)",
        }}
      >
        <fieldset className="c97-panel" style={fieldsetStyle}>
          <legend className="c97-serif c97-h3" style={legendStyle}>
            Primary surface
          </legend>
          <div style={{ clear: "both", display: "grid", gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
            {SURFACE_OPTIONS.map((option) => (
              <RadioOption
                key={option.value}
                name="surface"
                value={option.value}
                checked={intake.surface === option.value}
                label={option.label}
                onChange={() =>
                  onIntakeChange(updateIntake(intake, "surface", option.value))
                }
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="c97-panel" style={fieldsetStyle}>
          <legend className="c97-serif c97-h3" style={legendStyle}>
            Primary language
          </legend>
          <div style={{ clear: "both", display: "grid", gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
            {LANGUAGE_OPTIONS.map((option) => (
              <RadioOption
                key={option.value}
                name="language"
                value={option.value}
                checked={intake.language === option.value}
                label={option.label}
                onChange={() =>
                  onIntakeChange(updateIntake(intake, "language", option.value))
                }
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="c97-panel" style={fieldsetStyle}>
          <legend className="c97-serif c97-h3" style={legendStyle}>
            CI system
          </legend>
          <div style={{ clear: "both", display: "grid", gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
            {CI_OPTIONS.map((option) => (
              <RadioOption
                key={option.value}
                name="ci"
                value={option.value}
                checked={intake.ci === option.value}
                label={option.label}
                onChange={() => onIntakeChange(updateIntake(intake, "ci", option.value))}
              />
            ))}
          </div>
        </fieldset>
      </div>
    );
  }

  if (step === 1) {
    return (
      <fieldset className="c97-panel" style={fieldsetStyle}>
        <legend className="c97-serif c97-h3" style={legendStyle}>
          Which test layers does the team need?
        </legend>
        <p
          className="c97-prose"
          style={{ clear: "both", marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
        >
          Pick every layer the standard needs to cover. The score drops when a stack leaves a
          selected layer unsupported.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "var(--c97-sp-2)",
            marginTop: "var(--c97-sp-3)",
          }}
        >
          {TEST_LAYER_OPTIONS.map((option) => {
            const checked = intake.layers.includes(option.value);
            return (
              <label key={option.value} style={optionStyle}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onIntakeChange(toggleTestLayer(intake, option.value))}
                  className="c97-check"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <span>
                  <span style={optionLabelStyle}>{option.label}</span>
                  <span style={helperStyle}>{option.helper}</span>
                </span>
              </label>
            );
          })}
        </div>
        {intake.layers.length === 0 ? (
          <p
            role="alert"
            style={{
              ...smallTextStyle,
              marginTop: "var(--c97-sp-3)",
              color: "var(--c97-negative)",
            }}
          >
            Select at least one layer so the engine has something real to score.
          </p>
        ) : null}
      </fieldset>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
        gap: "var(--c97-sp-3)",
      }}
    >
      <fieldset className="c97-panel" style={fieldsetStyle}>
        <legend className="c97-serif c97-h3" style={legendStyle}>
          Current automation maturity
        </legend>
        <div style={{ clear: "both", display: "grid", gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
          {MATURITY_OPTIONS.map((option) => (
            <RadioOption
              key={option.value}
              name="maturity"
              value={option.value}
              checked={intake.maturity === option.value}
              label={option.label}
              helper={option.helper}
              onChange={() =>
                onIntakeChange(updateIntake(intake, "maturity", option.value))
              }
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="c97-panel" style={fieldsetStyle}>
        <legend className="c97-serif c97-h3" style={legendStyle}>
          Team size
        </legend>
        <div style={{ clear: "both", display: "grid", gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
          {TEAM_SIZE_OPTIONS.map((option) => (
            <RadioOption
              key={option.value}
              name="team-size"
              value={option.value}
              checked={intake.teamSize === option.value}
              label={option.label}
              onChange={() =>
                onIntakeChange(updateIntake(intake, "teamSize", option.value))
              }
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="c97-panel" style={fieldsetStyle}>
        <legend className="c97-serif c97-h3" style={legendStyle}>
          Quality ownership
        </legend>
        <div style={{ clear: "both", display: "grid", gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
          <RadioOption
            name="quality-engineer"
            value="yes"
            checked={intake.hasQualityEngineer}
            label="Dedicated quality engineer"
            helper="A named person owns the suite day to day"
            onChange={() => onIntakeChange(updateIntake(intake, "hasQualityEngineer", true))}
          />
          <RadioOption
            name="quality-engineer"
            value="no"
            checked={!intake.hasQualityEngineer}
            label="Shared team ownership"
            helper="Developers maintain the suite together"
            onChange={() => onIntakeChange(updateIntake(intake, "hasQualityEngineer", false))}
          />
        </div>
      </fieldset>
    </div>
  );
}

function ScoreLedger({
  result,
  defaultOpen = false,
}: {
  result: ScoredToolchain;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      style={{
        marginTop: "var(--c97-sp-3)",
        paddingTop: "var(--c97-sp-2)",
        borderTop: "1px solid var(--c97-rule)",
      }}
    >
      <summary
        className="c97-kicker"
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: 44,
          cursor: "pointer",
          color: "var(--c97-ink)",
        }}
      >
        Show the score ledger
      </summary>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "var(--c97-sp-1)" }}>
        {result.factors.map((factor) => (
          <li
            key={factor.label}
            style={{
              display: "grid",
              gridTemplateColumns: "auto auto minmax(0, 1fr)",
              gap: "var(--c97-sp-2)",
              alignItems: "baseline",
              paddingBlock: "var(--c97-sp-1)",
              borderTop: "1px solid var(--c97-rule)",
            }}
          >
            <span style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink)" }}>
              {factor.label}
            </span>
            <span
              className="c97-mono"
              style={{
                fontSize: "var(--c97-fs-small)",
                color:
                  factor.points >= 0 ? "var(--c97-positive)" : "var(--c97-negative)",
              }}
            >
              {factor.points >= 0 ? "+" : ""}
              {factor.points}
            </span>
            <span style={smallTextStyle}>{factor.detail}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function RecommendationCard({
  result,
  label,
  primary,
}: {
  result: ScoredToolchain;
  label: string;
  primary: boolean;
}) {
  return (
    <article
      className="c97-panel"
      style={primary ? { borderLeft: "2px solid var(--c97-ink)" } : undefined}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--c97-sp-3)",
        }}
      >
        <div>
          <p className="c97-kicker">{label}</p>
          <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
            {result.toolchain.name}
          </h3>
        </div>
        <div
          className="c97-mono"
          style={{
            flexShrink: 0,
            fontSize: "var(--c97-fs-h2)",
            lineHeight: "var(--c97-lh-tight)",
            color:
              result.score >= 70
                ? "var(--c97-positive)"
                : result.score >= 56
                  ? "var(--c97-warning)"
                  : "var(--c97-negative)",
          }}
          role="img"
          aria-label={`${result.score} percent confidence`}
        >
          {result.score}%
        </div>
      </div>
      <p
        className="c97-prose"
        style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
      >
        {result.toolchain.summary}
      </p>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
          gap: "var(--c97-sp-2)",
          margin: 0,
          marginTop: "var(--c97-sp-3)",
          paddingBlock: "var(--c97-sp-2)",
          borderTop: "1px solid var(--c97-rule)",
          borderBottom: "1px solid var(--c97-rule)",
        }}
      >
        <div>
          <dt className="c97-kicker">Framework</dt>
          <dd style={termStyle}>{result.toolchain.framework}</dd>
        </div>
        <div>
          <dt className="c97-kicker">Runner</dt>
          <dd style={termStyle}>{result.toolchain.runner}</dd>
        </div>
        <div>
          <dt className="c97-kicker">Reporting</dt>
          <dd style={termStyle}>{result.toolchain.reporting}</dd>
        </div>
      </dl>
      <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
        <span style={{ fontWeight: 600 }}>The tradeoff I would keep visible.</span>{" "}
        {result.toolchain.tradeoff}
      </p>
      <ScoreLedger result={result} defaultOpen={primary} />
    </article>
  );
}

function RecommendationSection({
  intake,
}: {
  intake: TeamIntake;
}) {
  const recommendation = useMemo(() => recommendToolchains(intake), [intake]);
  const plan = useMemo(
    () => generateOnboardingPlan(intake, recommendation),
    [intake, recommendation]
  );
  const [question, setQuestion] = useState("");
  const [attempted, setAttempted] = useState("");
  const [match, setMatch] = useState<TroubleshootingMatch | null>(null);
  const [copied, setCopied] = useState<"none" | "plan" | "handoff">("none");

  function runTroubleshooting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMatch(
      matchTroubleshootingQuestion(question, recommendation.primary.toolchain.id)
    );
  }

  const handoffNeeded = recommendation.shouldEscalate || Boolean(match?.shouldEscalate);
  const escalationDraft = buildEscalationDraft({
    intake,
    recommendation,
    question,
    attempted,
  });

  async function copyText(value: string, target: "plan" | "handoff") {
    await navigator.clipboard.writeText(value);
    setCopied(target);
  }

  const planText = plan
    .map(
      (step) =>
        `${step.order}. ${step.title}\nOwner: ${step.owner}\nEffort: ${step.effort}\nPrerequisites: ${step.prerequisites}\n${step.description}\n\n${step.snippet}`
    )
    .join("\n\n");

  return (
    <div>
      <section
        id="recommendation"
        aria-labelledby="recommendation-heading"
        className="c97-band"
        data-c97-surface="paper"
        style={{ scrollMarginTop: "var(--c97-sp-6)" }}
      >
        <div className="c97-shell">
          <SectionHeading kicker="Scored recommendation" title="A recommendation you can inspect">
            <p id="recommendation-heading">
              The score is a committed set of readable rules. Change one answer in the intake and
              the recommendation moves because the surface, language, coverage, CI fit, migration
              work, or ownership score moved with it.
            </p>
          </SectionHeading>

          {recommendation.shouldEscalate ? (
            <div
              className="c97-panel"
              style={{
                marginTop: "var(--c97-sp-4)",
                borderLeft: "2px solid var(--c97-negative)",
              }}
              role="status"
            >
              <p className="c97-kicker" style={{ color: "var(--c97-negative)" }}>
                Human review needed
              </p>
              <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
                I do not have enough confidence to recommend this setup.
              </h3>
              <p
                className="c97-prose"
                style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
              >
                The best catalog match scored {recommendation.primary.score}%, below the{" "}
                {recommendation.threshold}% threshold. I would route the intake to the central team
                instead of making the missing language or CI integration sound supported.
              </p>
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "var(--c97-sp-3)",
              marginTop: "var(--c97-sp-4)",
            }}
          >
            <RecommendationCard
              result={recommendation.primary}
              label={recommendation.shouldEscalate ? "Closest catalog match" : "Top recommendation"}
              primary
            />
            <RecommendationCard
              result={recommendation.runnerUp}
              label="Runner-up"
              primary={false}
            />
          </div>
        </div>
      </section>

      {!recommendation.shouldEscalate ? (
        <section
          id="plan"
          aria-labelledby="plan-heading"
          className="c97-band"
          data-c97-surface="bone"
          style={{ scrollMarginTop: "var(--c97-sp-6)" }}
        >
          <div className="c97-shell">
            <div style={headerRowStyle}>
              <SectionHeading
                kicker="Onboarding plan"
                title={
                  intake.maturity === "none" || intake.maturity === "manual"
                    ? "Start with one workflow and build the habit"
                    : "Migrate the suite without dropping coverage"
                }
              >
                <p id="plan-heading">
                  The checklist changes with maturity. This team gets a{" "}
                  {intake.maturity === "none" || intake.maturity === "manual"
                    ? "first setup"
                    : "parallel migration"}{" "}
                  plan, with an owner, effort, prerequisite, and copyable configuration in every
                  step.
                </p>
              </SectionHeading>
              <button
                type="button"
                className="c97-btn-ghost"
                onClick={() => copyText(planText, "plan")}
              >
                {copied === "plan" ? "Plan copied" : "Copy full plan"}
              </button>
            </div>

            <ol
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                marginTop: "var(--c97-sp-4)",
                borderBottom: "1px solid var(--c97-rule)",
              }}
            >
              {plan.map((step) => (
                <li
                  key={step.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0, 1fr)",
                    gap: "var(--c97-sp-3)",
                    alignItems: "baseline",
                    paddingBlock: "var(--c97-sp-3)",
                    borderTop: "1px solid var(--c97-rule)",
                  }}
                >
                  <span
                    className="c97-mono"
                    style={{
                      fontSize: "var(--c97-fs-small)",
                      color: "var(--c97-label)",
                      minWidth: "2.5rem",
                    }}
                  >
                    {String(step.order).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="c97-serif c97-h3">{step.title}</h3>
                    <p
                      className="c97-prose"
                      style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}
                    >
                      {step.description}
                    </p>
                    <dl
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "var(--c97-sp-3)",
                        margin: 0,
                        marginTop: "var(--c97-sp-2)",
                      }}
                    >
                      <div>
                        <dt className="c97-kicker">Owner</dt>
                        <dd style={termStyle}>{step.owner}</dd>
                      </div>
                      <div>
                        <dt className="c97-kicker">Rough effort</dt>
                        <dd style={termStyle}>{step.effort}</dd>
                      </div>
                      <div style={{ flexBasis: "100%" }}>
                        <dt className="c97-kicker">Prerequisite</dt>
                        <dd style={termStyle}>{step.prerequisites}</dd>
                      </div>
                    </dl>
                    <pre className="c97-mono" style={{ ...snippetStyle, marginTop: "var(--c97-sp-2)" }}>
                      <code>{step.snippet}</code>
                    </pre>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <section
        id="troubleshooting"
        aria-labelledby="troubleshooting-heading"
        className="c97-band"
        data-c97-surface="paper"
        style={{ scrollMarginTop: "var(--c97-sp-6)" }}
      >
        <div className="c97-shell">
          <SectionHeading kicker="Troubleshooting desk" title="Ask a setup or integration question">
            <p id="troubleshooting-heading">
              This search retrieves from a small committed knowledge base. It reports its
              confidence and gives up when the question does not match the material it has.
            </p>
          </SectionHeading>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "var(--c97-sp-3)",
              marginTop: "var(--c97-sp-4)",
            }}
          >
            <div>
              <form onSubmit={runTroubleshooting}>
                <label
                  htmlFor="troubleshooting-question"
                  className="c97-kicker"
                  style={{ display: "block" }}
                >
                  What is going wrong?
                </label>
                <textarea
                  id="troubleshooting-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={5}
                  required
                  placeholder="For example, Playwright cannot find Chromium in CI"
                  className="c97-field"
                  style={{ marginTop: "var(--c97-sp-1)", minHeight: 132 }}
                />
                <button type="submit" className="c97-btn" style={fullWidthButtonStyle}>
                  Find an answer
                </button>
              </form>

              <div
                style={{
                  marginTop: "var(--c97-sp-4)",
                  paddingTop: "var(--c97-sp-3)",
                  borderTop: "1px solid var(--c97-rule)",
                }}
              >
                <p className="c97-kicker">Seeded demo questions</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "var(--c97-sp-1)" }}>
                  {TROUBLESHOOTING_PROMPTS.map((prompt) => (
                    <li key={prompt.question} style={{ borderTop: "1px solid var(--c97-rule)" }}>
                      <button
                        type="button"
                        onClick={() => setQuestion(prompt.question)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "var(--c97-sp-2)",
                          width: "100%",
                          minHeight: 44,
                          paddingBlock: "var(--c97-sp-1)",
                          paddingInline: 0,
                          background: "none",
                          border: 0,
                          font: "inherit",
                          fontSize: "var(--c97-fs-small)",
                          lineHeight: "var(--c97-lh-body)",
                          textAlign: "left",
                          color: "var(--c97-ink)",
                          cursor: "pointer",
                        }}
                      >
                        <span>{prompt.question}</span>
                        {!prompt.answerable ? (
                          <span className="c97-chip">Outside scope</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="c97-panel" aria-live="polite">
              {match ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: "var(--c97-sp-3)",
                    }}
                  >
                    <p className="c97-kicker">Retrieval confidence</p>
                    <span
                      className="c97-mono"
                      style={{
                        fontSize: "var(--c97-fs-small)",
                        color: match.shouldEscalate
                          ? "var(--c97-negative)"
                          : "var(--c97-positive)",
                      }}
                    >
                      {Math.round(match.confidence * 100)}%
                    </span>
                  </div>
                  {match.article ? (
                    <div style={{ marginTop: "var(--c97-sp-3)" }}>
                      <h3 className="c97-serif c97-h3">{match.article.title}</h3>
                      <p
                        className="c97-prose"
                        style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
                      >
                        {match.article.answer}
                      </p>
                      <pre
                        className="c97-mono"
                        style={{
                          ...snippetStyle,
                          marginTop: "var(--c97-sp-3)",
                          background: "var(--c97-surface)",
                        }}
                      >
                        <code>{match.article.snippet}</code>
                      </pre>
                      <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-2)" }}>
                        Matched terms · {match.matchedTerms.join(", ")}
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginTop: "var(--c97-sp-3)" }}>
                      <h3 className="c97-serif c97-h3">
                        I do not have a reliable answer for this.
                      </h3>
                      <p
                        className="c97-prose"
                        style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
                      >
                        The best match stayed below the{" "}
                        {Math.round(TROUBLESHOOTING_CONFIDENCE_THRESHOLD * 100)}% threshold. I would
                        send the question and the team context to a person instead of guessing.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    display: "grid",
                    minHeight: 320,
                    placeItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div style={{ maxWidth: "var(--c97-measure-body)" }}>
                    <p
                      className="c97-serif"
                      style={{ fontSize: "var(--c97-fs-h1)", color: "var(--c97-label)" }}
                    >
                      ?
                    </p>
                    <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-3)" }}>
                      No question searched yet
                    </h3>
                    <p
                      className="c97-prose"
                      style={{
                        marginTop: "var(--c97-sp-1)",
                        color: "var(--c97-ink-2)",
                        marginInline: "auto",
                      }}
                    >
                      Try a known setup problem or one of the deliberately unsupported questions
                      to see the confidence boundary.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {handoffNeeded ? (
        <section
          id="handoff"
          aria-labelledby="handoff-heading"
          style={{ scrollMarginTop: "var(--c97-sp-6)" }}
        >
          <div className="c97-band" data-c97-surface="ink-blue">
            <div className="c97-shell">
              <p className="c97-kicker">Escalation handoff</p>
              <h2
                id="handoff-heading"
                className="c97-serif c97-h2"
                style={{ marginTop: "var(--c97-sp-2)" }}
              >
                Give the central team the context up front.
              </h2>
              <p
                className="c97-prose"
                style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
              >
                The handoff carries the intake, the recommendation, the exact question, and what
                the team already tried so support can start with the failure instead of repeating
                discovery.
              </p>
            </div>
          </div>
          <div className="c97-band" data-c97-surface="bone">
            <div
              className="c97-shell"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                gap: "var(--c97-sp-4)",
              }}
            >
              <div>
                <label htmlFor="attempted" className="c97-kicker" style={{ display: "block" }}>
                  What has the team already tried?
                </label>
                <textarea
                  id="attempted"
                  value={attempted}
                  onChange={(event) => setAttempted(event.target.value)}
                  rows={7}
                  placeholder="Add commands, links, errors, or changes already attempted"
                  className="c97-field"
                  style={{ marginTop: "var(--c97-sp-1)", minHeight: 180 }}
                />
                <button
                  type="button"
                  className="c97-btn"
                  style={fullWidthButtonStyle}
                  onClick={() => copyText(escalationDraft, "handoff")}
                >
                  {copied === "handoff" ? "Support request copied" : "Copy support request"}
                </button>
              </div>
              <pre
                className="c97-mono"
                style={{
                  ...snippetStyle,
                  padding: "var(--c97-sp-3)",
                  whiteSpace: "pre-wrap",
                }}
              >
                <code>{escalationDraft}</code>
              </pre>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TeamOnboarding() {
  const [intake, setIntake] = useState<TeamIntake>({
    ...DEFAULT_TEAM_INTAKE,
    layers: [...DEFAULT_TEAM_INTAKE.layers],
  });
  const [step, setStep] = useState<IntakeStep>(0);
  const [showResults, setShowResults] = useState(false);

  const stepLabels = ["Team context", "Test layers", "Delivery reality"];

  function advance() {
    if (step < INTAKE_STEP_COUNT - 1) {
      setStep(moveIntakeStep(step, 1));
      return;
    }
    setShowResults(true);
    requestAnimationFrame(() =>
      document.getElementById("recommendation")?.scrollIntoView({ behavior: "smooth" })
    );
  }

  function reset() {
    setIntake(resetTeamIntake());
    setStep(0);
    setShowResults(false);
  }

  const backDisabled = step === 0;
  const advanceDisabled = step === 1 && intake.layers.length === 0;

  return (
    <div role="tabpanel" aria-label="Team onboarding">
      <section
        aria-labelledby="intake-heading"
        className="c97-band"
        data-c97-surface="bone"
      >
        <div className="c97-shell">
          <div style={headerRowStyle}>
            <SectionHeading kicker="Guided intake" title="Start with the team that needs help">
              <p id="intake-heading">
                The intake keeps the parts that change the recommendation separate. Move backward
                and forward freely, and every answer stays in place.
              </p>
            </SectionHeading>
            <button type="button" onClick={reset} className="c97-btn-ghost">
              Reset intake
            </button>
          </div>

          <nav aria-label="Intake progress" style={{ marginTop: "var(--c97-sp-4)" }}>
            <ol
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexWrap: "wrap",
                columnGap: "var(--c97-sp-3)",
                /* .c97-microlink buys its 44px target with negative margins; sp-5 keeps wrapped rows' hit boxes apart. */
                rowGap: "var(--c97-sp-5)",
              }}
            >
              {stepLabels.map((label, index) => {
                const current = step === index;
                const completed = step > index || showResults;
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => setStep(index as IntakeStep)}
                      aria-current={current ? "step" : undefined}
                      className="c97-microlink"
                      style={{
                        background: "none",
                        border: 0,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: "var(--c97-sp-1)",
                        textAlign: "left",
                        color: current ? "var(--c97-ink)" : "var(--c97-label)",
                        textDecoration: current ? "underline" : "none",
                        textDecorationThickness: 2,
                        textUnderlineOffset: 6,
                        textDecorationColor: "var(--c97-accent)",
                      }}
                    >
                      <span
                        className="c97-mono"
                        style={{
                          color:
                            completed && !current ? "var(--c97-positive)" : undefined,
                        }}
                      >
                        {completed && !current ? "✓" : index + 1}
                      </span>
                      <span>{label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div style={{ marginTop: "var(--c97-sp-4)" }}>
            <IntakeForm intake={intake} step={step} onIntakeChange={setIntake} />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--c97-sp-2)",
              marginTop: "var(--c97-sp-4)",
            }}
          >
            <button
              type="button"
              className="c97-btn-ghost"
              style={backDisabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              onClick={() => setStep(moveIntakeStep(step, -1))}
              disabled={backDisabled}
            >
              Back
            </button>
            <button
              type="button"
              className="c97-btn"
              style={advanceDisabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              onClick={advance}
              disabled={advanceDisabled}
            >
              {step === INTAKE_STEP_COUNT - 1 ? "Build recommendation" : "Continue"}
            </button>
          </div>
        </div>
      </section>

      {showResults ? <RecommendationSection intake={intake} /> : null}
    </div>
  );
}

export function EnablementAssistantClient() {
  const [view, setView] = useState<WorkspaceView>("program");

  function changeView(nextView: WorkspaceView) {
    setView(nextView);
    requestAnimationFrame(() =>
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })
    );
  }

  return (
    <div>
      <section className="c97-band c97-band-tall" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-kicker">Internal platform enablement · deterministic demo</p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
            Automation Enablement Assistant
          </h1>
          <p
            className="c97-lead"
            style={{
              marginTop: "var(--c97-sp-3)",
              color: "var(--c97-ink-2)",
              maxWidth: "var(--c97-column)",
            }}
          >
            I built this to help a small central tooling team support many independent
            product teams without repeating the same onboarding work one team at a time.
            It recommends a standard stack, writes the adoption plan, answers the common
            setup questions, and turns every failure into a clearer documentation backlog.
          </p>
        </div>
      </section>

      <section className="c97-band c97-band-tight" data-c97-surface="ink-blue">
        <div className="c97-shell">
          <p className="c97-kicker">Model boundary</p>
          <p
            className="c97-prose"
            style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
          >
            No credentials, live model, or hidden service. The scoring, retrieval, plans,
            and program data all run from committed TypeScript rules and invented seed data.
          </p>
        </div>
      </section>

      <section
        id="workspace"
        className="c97-band c97-band-tight"
        data-c97-surface="paper"
        style={{ scrollMarginTop: "var(--c97-sp-6)" }}
      >
        <div
          className="c97-shell"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--c97-sp-3)",
          }}
        >
          <WorkspaceTabs view={view} onChange={changeView} />
          <p className="c97-kicker">
            {view === "program" ? "Portfolio view · 12 seeded teams" : "Team view · 3 intake steps"}
          </p>
        </div>
      </section>

      {view === "program" ? (
        <ProgramDashboard onStart={() => changeView("team")} />
      ) : (
        <TeamOnboarding />
      )}
    </div>
  );
}
