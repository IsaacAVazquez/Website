"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
  BASE_SCORE,
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
import "./enablement.css";

type WorkspaceView = "program" | "team";

/** A label above its value; the label comes first so a reader meets the name before the number. */
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
    <div className="ea-metric">
      <p className="ea-label">{label}</p>
      <p className="ea-metric-value">{value}</p>
      <p className="ea-small">{detail}</p>
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
    <div className="ea-switch" role="group" aria-label="Enablement workspace views">
      {(
        [
          ["program", "Program dashboard"],
          ["team", "Onboard a team"],
        ] as const
      ).map(([id, label]) => (
        <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function statusChipClass(status: "standard" | "partial" | "drift"): string {
  return status === "standard"
    ? "c97-chip c97-chip-positive"
    : status === "partial"
      ? "c97-chip c97-chip-warning"
      : "c97-chip c97-chip-negative";
}

function ProgramDashboard({ onStart }: { onStart: () => void }) {
  const metrics = useMemo(() => getProgramMetrics(), []);
  const maxGapCount = DOCUMENTATION_GAPS[0]?.count ?? 1;
  const driftTeams = ENABLEMENT_TEAM_SNAPSHOTS.filter(
    (team) => team.standardStatus !== "standard"
  );

  return (
    <div className="ea-program">
      <section aria-labelledby="program-metrics-heading" className="ea-section">
        <div className="ea-section-head">
          <div>
            <h2 id="program-metrics-heading" className="ea-h2">
              See where the standard is holding
            </h2>
            <p className="ea-lede">
              This is twelve simulated teams on one standard, with the stack each one runs, the
              setup questions it resolves on its own, and where it has drifted.
            </p>
          </div>
          <button type="button" className="c97-btn" onClick={onStart}>
            Onboard a team
          </button>
        </div>

        {/* The program's own summary is the table's header row. */}
        <div className="ea-table-block">
          <div className="ea-metrics">
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
          <div
            role="region"
            aria-label="Standard adoption by team"
            tabIndex={0}
            className="ea-table-scroll"
          >
            <table className="ea-table">
              <thead>
                <tr>
                  <th scope="col">Team</th>
                  <th scope="col">Surface</th>
                  <th scope="col">Toolchain</th>
                  <th scope="col">Adoption</th>
                  <th scope="col" data-align="end">
                    Resolved
                  </th>
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
                      <th scope="row">{team.name}</th>
                      <td>{LABELS.surfaces[team.surface]}</td>
                      <td>{team.toolchain}</td>
                      <td>
                        <span className={statusChipClass(team.standardStatus)}>
                          {team.standardStatus}
                        </span>
                      </td>
                      <td data-align="end" className="ea-num">
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="ea-small">
            This dashboard uses invented, committed seed data for a portfolio demo. It does not
            describe a real organization or production program.
          </p>
        </div>
      </section>

      <div className="ea-split">
        <section aria-labelledby="feedback-loop-heading" className="ea-section">
          <h2 id="feedback-loop-heading" className="ea-h2">
            The failure log becomes the documentation roadmap.
          </h2>
          <p className="ea-lede">
            Every low-confidence answer is a trace of where the platform failed to transfer
            knowledge, so ranked across teams the traces say which guide or integration to write
            next.
          </p>
          <ol className="ea-gaps">
            {DOCUMENTATION_GAPS.map((gap, index) => (
              <li key={gap.question}>
                <span className="ea-rank">{String(index + 1).padStart(2, "0")}</span>
                <div className="ea-gap-body">
                  <p className="ea-gap-question">{gap.question}</p>
                  <p className="ea-small">
                    {gap.teams} teams · owner {gap.owner}
                  </p>
                  <span
                    className="ea-meter"
                    role="progressbar"
                    aria-valuenow={gap.count}
                    aria-valuemin={0}
                    aria-valuemax={maxGapCount}
                    aria-label={`${gap.question}: ${gap.count} unanswered questions`}
                  >
                    <span style={{ width: `${Math.round((gap.count / maxGapCount) * 100)}%` }} />
                  </span>
                </div>
                <span className="ea-num ea-gap-count">{gap.count} asks</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="drift-heading" className="ea-section">
          <h2 id="drift-heading" className="ea-h2">
            Where teams are leaving the shared path
          </h2>
          <p className="ea-lede">
            A team can use the recommended framework and still keep the reporting and maintenance
            differences that made the portfolio hard to support.
          </p>
          <ul className="ea-drift">
            {driftTeams.map((team) => (
              <li key={team.name} className="ea-card">
                <div className="ea-card-head">
                  <h3 className="ea-h3">{team.name}</h3>
                  <span className={statusChipClass(team.standardStatus)}>
                    {team.standardStatus}
                  </span>
                </div>
                <p className="ea-small">{LABELS.surfaces[team.surface]}</p>
                <p className="ea-body">{team.driftReason}</p>
                <p className="ea-small ea-card-foot">Current stack · {team.toolchain}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
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
    <label className="ea-option">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span>
        <span className="ea-option-label">{label}</span>
        {helper ? <span className="ea-option-helper">{helper}</span> : null}
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
      <div className="ea-fields">
        <fieldset className="ea-fieldset">
          <legend>Primary surface</legend>
          {SURFACE_OPTIONS.map((option) => (
            <RadioOption
              key={option.value}
              name="surface"
              value={option.value}
              checked={intake.surface === option.value}
              label={option.label}
              onChange={() => onIntakeChange(updateIntake(intake, "surface", option.value))}
            />
          ))}
        </fieldset>
        <fieldset className="ea-fieldset">
          <legend>Primary language</legend>
          {LANGUAGE_OPTIONS.map((option) => (
            <RadioOption
              key={option.value}
              name="language"
              value={option.value}
              checked={intake.language === option.value}
              label={option.label}
              onChange={() => onIntakeChange(updateIntake(intake, "language", option.value))}
            />
          ))}
        </fieldset>
        <fieldset className="ea-fieldset">
          <legend>CI system</legend>
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
        </fieldset>
      </div>
    );
  }

  if (step === 1) {
    return (
      <fieldset className="ea-fieldset">
        <legend>Which test layers does the team need?</legend>
        <p className="ea-small">
          Pick every layer the standard needs to cover. The score drops when a stack leaves a
          selected layer unsupported.
        </p>
        {TEST_LAYER_OPTIONS.map((option) => {
          const checked = intake.layers.includes(option.value);
          return (
            <label key={option.value} className="ea-option">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onIntakeChange(toggleTestLayer(intake, option.value))}
              />
              <span>
                <span className="ea-option-label">{option.label}</span>
                <span className="ea-option-helper">{option.helper}</span>
              </span>
            </label>
          );
        })}
      </fieldset>
    );
  }

  return (
    <div className="ea-fields">
      <fieldset className="ea-fieldset">
        <legend>Current automation maturity</legend>
        {MATURITY_OPTIONS.map((option) => (
          <RadioOption
            key={option.value}
            name="maturity"
            value={option.value}
            checked={intake.maturity === option.value}
            label={option.label}
            helper={option.helper}
            onChange={() => onIntakeChange(updateIntake(intake, "maturity", option.value))}
          />
        ))}
      </fieldset>
      <fieldset className="ea-fieldset">
        <legend>Team size</legend>
        {TEAM_SIZE_OPTIONS.map((option) => (
          <RadioOption
            key={option.value}
            name="team-size"
            value={option.value}
            checked={intake.teamSize === option.value}
            label={option.label}
            onChange={() => onIntakeChange(updateIntake(intake, "teamSize", option.value))}
          />
        ))}
      </fieldset>
      <fieldset className="ea-fieldset">
        <legend>Quality ownership</legend>
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
  // The engine's factors leave out where the score starts, so the ledger opens on that row and adds up.
  const rows = [
    {
      label: "Starting score",
      points: BASE_SCORE,
      detail: "Every stack starts here, and the total is held between 0 and 100.",
    },
    ...result.factors,
  ];

  return (
    <details open={defaultOpen} className="ea-ledger">
      <summary>Show the score ledger</summary>
      <ul>
        {rows.map((factor) => (
          <li key={factor.label}>
            <span>{factor.label}</span>
            <span
              className="ea-num"
              style={{
                color: factor.points >= 0 ? "var(--c97-positive)" : "var(--c97-negative)",
              }}
            >
              {factor.points >= 0 ? "+" : ""}
              {factor.points}
            </span>
            <span className="ea-small">{factor.detail}</span>
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
    <article className="ea-card" data-primary={primary ? "true" : undefined}>
      <div className="ea-card-head">
        <div>
          <p className="ea-label">{label}</p>
          <h3 className="ea-h3">{result.toolchain.name}</h3>
        </div>
        <div
          className="ea-score"
          style={{
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
      <p className="ea-body">{result.toolchain.summary}</p>
      <dl className="ea-terms">
        <div>
          <dt>Framework</dt>
          <dd>{result.toolchain.framework}</dd>
        </div>
        <div>
          <dt>Runner</dt>
          <dd>{result.toolchain.runner}</dd>
        </div>
        <div>
          <dt>Reporting</dt>
          <dd>{result.toolchain.reporting}</dd>
        </div>
      </dl>
      <p className="ea-label">The tradeoff I would keep visible</p>
      <p className="ea-body">{result.toolchain.tradeoff}</p>
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
  // The question as it was searched, which the box can move on from before the next search.
  const [asked, setAsked] = useState("");
  const [attempted, setAttempted] = useState("");
  const [match, setMatch] = useState<TroubleshootingMatch | null>(null);
  const [copied, setCopied] = useState<
    "none" | "plan" | "handoff" | "plan-error" | "handoff-error"
  >("none");

  function runTroubleshooting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAsked(question.trim());
    setMatch(
      matchTroubleshootingQuestion(question, recommendation.primary.toolchain.id)
    );
  }

  const handoffNeeded = recommendation.shouldEscalate || Boolean(match?.shouldEscalate);
  const escalationDraft = buildEscalationDraft({
    intake,
    recommendation,
    // Only a question the desk declined belongs under "could not answer".
    question: match?.shouldEscalate ? asked : "",
    attempted,
  });

  async function copyText(value: string, target: "plan" | "handoff") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
    } catch {
      setCopied(`${target}-error`);
    }
  }

  const planCopyLabel =
    copied === "plan"
      ? "Plan copied"
      : copied === "plan-error"
        ? "Copy failed, select the text below"
        : "Copy full plan";
  const handoffCopyLabel =
    copied === "handoff"
      ? "Support request copied"
      : copied === "handoff-error"
        ? "Copy failed, select the text below"
        : "Copy support request";

  const planText = plan
    .map(
      (step) =>
        `${step.order}. ${step.title}\nOwner: ${step.owner}\nEffort: ${step.effort}\nPrerequisites: ${step.prerequisites}\n${step.description}\n\n${step.snippet}`
    )
    .join("\n\n");

  return (
    <div className="ea-results">
      <section id="recommendation" aria-labelledby="recommendation-heading" className="ea-section">
        <h2 id="recommendation-heading" className="ea-h2">
          A recommendation you can inspect
        </h2>
        <p className="ea-lede">
          The score is a committed set of readable rules, so changing one answer in the intake
          moves the recommendation through the surface, language, coverage, CI fit, migration
          work, or ownership score.
        </p>

        {recommendation.shouldEscalate ? (
          <div className="ea-callout" role="status">
            <p className="ea-label" style={{ color: "var(--c97-negative)" }}>
              Human review needed
            </p>
            <h3 className="ea-h3">I do not have enough confidence to recommend this setup.</h3>
            <p className="ea-body">
              The best catalog match scored {recommendation.primary.score}%, below the{" "}
              {recommendation.threshold}% threshold. I would route the intake to the central team
              instead of making the missing language or CI integration sound supported.
            </p>
          </div>
        ) : null}

        <div className="ea-pair">
          <RecommendationCard
            result={recommendation.primary}
            label={recommendation.shouldEscalate ? "Closest catalog match" : "Top recommendation"}
            primary
          />
          <RecommendationCard result={recommendation.runnerUp} label="Runner-up" primary={false} />
        </div>
      </section>

      {!recommendation.shouldEscalate ? (
        <section id="plan" aria-labelledby="plan-heading" className="ea-section">
          <div className="ea-section-head">
            <div>
              <h2 id="plan-heading" className="ea-h2">
                {intake.maturity === "none" || intake.maturity === "manual"
                  ? "Start with one workflow and build the habit"
                  : "Migrate the suite without dropping coverage"}
              </h2>
              <p className="ea-lede">
                This team gets a{" "}
                {intake.maturity === "none" || intake.maturity === "manual"
                  ? "first setup"
                  : "parallel migration"}{" "}
                plan, with an owner, effort, prerequisite, and copyable configuration in every
                step.
              </p>
            </div>
            <button type="button" className="c97-btn-ghost" onClick={() => copyText(planText, "plan")}>
              {planCopyLabel}
            </button>
            <p className="sr-only" role="status">
              {copied === "plan" || copied === "plan-error" ? planCopyLabel : ""}
            </p>
          </div>

          <ol className="ea-plan">
            {plan.map((step) => (
              <li key={step.id}>
                <span className="ea-rank">{String(step.order).padStart(2, "0")}</span>
                <div>
                  <h3 className="ea-h3">{step.title}</h3>
                  <p className="ea-body">{step.description}</p>
                  <dl className="ea-terms ea-terms-inline">
                    <div>
                      <dt>Owner</dt>
                      <dd>{step.owner}</dd>
                    </div>
                    <div>
                      <dt>Rough effort</dt>
                      <dd>{step.effort}</dd>
                    </div>
                    <div>
                      <dt>Prerequisite</dt>
                      <dd>{step.prerequisites}</dd>
                    </div>
                  </dl>
                  <pre className="ea-snippet">
                    <code>{step.snippet}</code>
                  </pre>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section id="troubleshooting" aria-labelledby="troubleshooting-heading" className="ea-section">
        <h2 id="troubleshooting-heading" className="ea-h2">
          Ask a setup or integration question
        </h2>
        <p className="ea-lede">
          The search retrieves from a small committed knowledge base, reports its confidence, and
          gives up when the question does not match the material it has.
        </p>

        <div className="ea-pair">
          <div>
            <form onSubmit={runTroubleshooting} className="ea-form">
              <label htmlFor="troubleshooting-question" className="ea-label">
                What is going wrong?
              </label>
              <textarea
                id="troubleshooting-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                required
                placeholder="For example, Playwright cannot find Chromium in CI"
                className="c97-field"
              />
              <button type="submit" className="c97-btn ea-wide">
                Find an answer
              </button>
            </form>

            <p className="ea-label" style={{ marginTop: "var(--c97-sp-3)" }}>
              Seeded demo questions
            </p>
            <ul className="ea-prompts">
              {TROUBLESHOOTING_PROMPTS.map((prompt) => (
                <li key={prompt.question}>
                  <button type="button" onClick={() => setQuestion(prompt.question)}>
                    <span>{prompt.question}</span>
                    {!prompt.answerable ? <span className="c97-chip">Outside scope</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="ea-answer" aria-live="polite">
            {match ? (
              <>
                <div className="ea-card-head">
                  <p className="ea-label">Retrieval confidence</p>
                  <span
                    className="ea-num"
                    style={{
                      color: match.shouldEscalate ? "var(--c97-negative)" : "var(--c97-positive)",
                    }}
                  >
                    {Math.round(match.confidence * 100)}%
                  </span>
                </div>
                {match.article ? (
                  <>
                    <h3 className="ea-h3">{match.article.title}</h3>
                    <p className="ea-body">{match.article.answer}</p>
                    <pre className="ea-snippet">
                      <code>{match.article.snippet}</code>
                    </pre>
                    <p className="ea-small">Matched terms · {match.matchedTerms.join(", ")}</p>
                  </>
                ) : (
                  <>
                    <h3 className="ea-h3">I do not have a reliable answer for this.</h3>
                    <p className="ea-body">
                      The best match stayed below the{" "}
                      {Math.round(TROUBLESHOOTING_CONFIDENCE_THRESHOLD * 100)}% threshold. I would
                      send the question and the team context to a person instead of guessing.
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <h3 className="ea-h3">No question searched yet</h3>
                <p className="ea-body">
                  Try a known setup problem or one of the deliberately unsupported questions to see
                  the confidence boundary.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {handoffNeeded ? (
        <section id="handoff" aria-labelledby="handoff-heading" className="ea-section">
          <h2 id="handoff-heading" className="ea-h2">
            Give the central team the context up front.
          </h2>
          <p className="ea-lede">
            The handoff carries the intake, the recommendation, the exact question, and what the
            team already tried, so support can start with the failure instead of repeating
            discovery.
          </p>
          <div className="ea-pair">
            <div className="ea-form">
              <label htmlFor="attempted" className="ea-label">
                What has the team already tried?
              </label>
              <textarea
                id="attempted"
                value={attempted}
                onChange={(event) => setAttempted(event.target.value)}
                rows={6}
                placeholder="Add commands, links, errors, or changes already attempted"
                className="c97-field"
              />
              <button
                type="button"
                className="c97-btn ea-wide"
                onClick={() => copyText(escalationDraft, "handoff")}
              >
                {handoffCopyLabel}
              </button>
              <p className="sr-only" role="status">
                {copied === "handoff" || copied === "handoff-error" ? handoffCopyLabel : ""}
              </p>
            </div>
            <pre className="ea-snippet ea-snippet-wrap">
              <code>{escalationDraft}</code>
            </pre>
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
  const reduceMotion = useReducedMotion();

  const stepLabels = ["Team context", "Test layers", "Delivery reality"];

  function advance() {
    if (step < INTAKE_STEP_COUNT - 1) {
      setStep(moveIntakeStep(step, 1));
      return;
    }
    setShowResults(true);
    requestAnimationFrame(() =>
      document
        .getElementById("recommendation")
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })
    );
  }

  function reset() {
    setIntake(resetTeamIntake());
    setStep(0);
    setShowResults(false);
  }

  const backDisabled = step === 0;
  // The step list opens the last step directly, so it needs a layer selected as much as the layers step.
  const advanceDisabled = step > 0 && intake.layers.length === 0;

  return (
    <div className="ea-team">
      <section aria-labelledby="intake-heading" className="ea-stepper">
        <div className="ea-section-head">
          <h2 id="intake-heading" className="ea-h2">
            Start with the team that needs help
          </h2>
          <button type="button" onClick={reset} className="c97-btn-ghost">
            Reset intake
          </button>
        </div>
        <p className="ea-small">
          Move backward and forward freely, and every answer stays in place.
        </p>

        <nav aria-label="Intake progress">
          <ol className="ea-steps">
            {stepLabels.map((label, index) => {
              const current = step === index;
              const completed = step > index || showResults;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setStep(index as IntakeStep)}
                    aria-current={current ? "step" : undefined}
                    data-done={completed && !current ? "true" : undefined}
                  >
                    <span className="ea-step-mark">{completed && !current ? "✓" : index + 1}</span>
                    <span>{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <IntakeForm intake={intake} step={step} onIntakeChange={setIntake} />

        {advanceDisabled ? (
          <p role="alert" className="ea-alert">
            Select at least one layer{step === 1 ? "" : " on the Test layers step"} so the engine
            has something real to score.
          </p>
        ) : null}

        <div className="ea-step-actions">
          <button
            type="button"
            className="c97-btn-ghost"
            onClick={() => setStep(moveIntakeStep(step, -1))}
            disabled={backDisabled}
          >
            Back
          </button>
          <button type="button" className="c97-btn" onClick={advance} disabled={advanceDisabled}>
            {step === INTAKE_STEP_COUNT - 1 ? "Build recommendation" : "Continue"}
          </button>
        </div>
      </section>

      <div className="ea-team-results">
        {showResults ? (
          <RecommendationSection intake={intake} />
        ) : (
          <p className="ea-empty">
            <strong>The recommendation fills in here.</strong>
            Answer the three steps to see the scored stack with its runner-up, the onboarding
            plan, and a troubleshooting desk for the setup questions that follow.
          </p>
        )}
      </div>
    </div>
  );
}

export function EnablementAssistantClient() {
  const [view, setView] = useState<WorkspaceView>("program");
  const reduceMotion = useReducedMotion();

  function changeView(nextView: WorkspaceView) {
    setView(nextView);
    requestAnimationFrame(() =>
      document
        .getElementById("workspace")
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })
    );
  }

  return (
    <div className="ea-root">
      <div className="c97-shell c97-frame ea-page">
        <section className="ea-titlebar" aria-labelledby="ea-title">
          <div className="ea-title-row">
            <h1 id="ea-title" className="ea-h1">Automation Enablement Assistant</h1>
            <WorkspaceTabs view={view} onChange={changeView} />
            <p className="ea-small ea-title-status">
              {view === "program" ? "Portfolio view · 12 seeded teams" : "Team view · 3 intake steps"}
            </p>
          </div>
          <p className="ea-lede">
            I built this so a small central tooling team can support many product teams without
            repeating the same onboarding work one team at a time.
          </p>
          <p className="ea-small ea-boundary">
            <span className="ea-boundary-tag">Model boundary</span> No credentials, live model, or
            hidden service. The scoring, retrieval, plans, and program data all run from committed
            TypeScript rules and invented seed data.
          </p>
        </section>

        <div id="workspace" className="ea-workspace">
          {view === "program" ? (
            <ProgramDashboard onStart={() => changeView("team")} />
          ) : (
            <TeamOnboarding />
          )}
        </div>
      </div>
    </div>
  );
}
