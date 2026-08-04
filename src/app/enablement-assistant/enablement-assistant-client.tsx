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

const fieldsetClass =
  "grid gap-3 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] p-4 sm:p-5";
const optionClass =
  "group flex min-h-touch cursor-pointer items-start gap-3 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-3 transition-[border-color,background-color,transform] hover:-translate-y-px hover:border-[var(--home-ink)] focus-within:border-[var(--home-signal)]";
const primaryButtonClass =
  "inline-flex min-h-touch items-center justify-center rounded-full bg-[var(--home-ink)] px-5 py-2.5 text-sm font-semibold text-[var(--home-paper)] transition-[background-color,transform] hover:-translate-y-px hover:bg-[var(--home-signal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-paper)]";
const secondaryButtonClass =
  "inline-flex min-h-touch items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-5 py-2.5 text-sm font-semibold text-[var(--home-ink)] transition-[border-color,background-color] hover:border-[var(--home-ink)] hover:bg-[var(--home-paper-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-paper)]";

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
    <div className="max-w-3xl space-y-3">
      <p className="home-kicker">{kicker}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-[var(--home-ink)] md:text-4xl">
        {title}
      </h2>
      {children ? (
        <div className="max-w-2xl text-sm leading-7 text-[var(--home-ink-muted)] sm:text-base">
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
    <div className="home-card relative overflow-hidden p-5">
      <span
        className="absolute inset-y-0 left-0 w-1 bg-[var(--home-signal)]"
        aria-hidden="true"
      />
      <p className="font-mono text-3xs uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--home-ink)]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-[var(--home-ink-muted)]">{detail}</p>
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
      className="inline-grid w-full grid-cols-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-1 sm:w-auto"
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
            className={`min-h-touch rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] ${
              active
                ? "bg-[var(--home-ink)] text-[var(--home-paper)]"
                : "text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
            }`}
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
    <div role="tabpanel" aria-label="Program dashboard" className="space-y-14">
      <section aria-labelledby="program-metrics-heading" className="space-y-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <SectionHeading kicker="Portfolio signal" title="See where the standard is holding">
            <p id="program-metrics-heading">
              This simulated view covers twelve independent teams. I care about the resolution
              rate, but the more useful output is the failure log because it tells the central
              team where documentation and integrations still break down.
            </p>
          </SectionHeading>
          <button type="button" className={primaryButtonClass} onClick={onStart}>
            Onboard a team
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section
        aria-labelledby="feedback-loop-heading"
        className="grid overflow-hidden rounded-3xl border border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)] lg:grid-cols-[0.82fr_1.18fr]"
      >
        <div className="flex flex-col justify-between gap-10 border-b border-[color-mix(in_srgb,var(--home-paper)_24%,transparent)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="space-y-4">
            <p className="font-mono text-3xs uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--home-paper)_70%,transparent)]">
              Feedback loop
            </p>
            <h2
              id="feedback-loop-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
            >
              The failure log becomes the documentation roadmap.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[color-mix(in_srgb,var(--home-paper)_76%,transparent)]">
            Every low-confidence answer is a trace of where the platform failed to transfer
            knowledge. Ranked across teams, those traces show which guide, integration, or
            policy clarification should be written next.
          </p>
        </div>

        <ol className="divide-y divide-[color-mix(in_srgb,var(--home-paper)_20%,transparent)]">
          {DOCUMENTATION_GAPS.map((gap, index) => (
            <li key={gap.question} className="grid gap-3 p-5 sm:grid-cols-[2.5rem_1fr_auto] sm:p-6">
              <span className="font-mono text-sm text-[var(--home-signal)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-medium leading-6">{gap.question}</p>
                <p className="mt-1 font-mono text-3xs uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--home-paper)_62%,transparent)]">
                  {gap.teams} teams · owner {gap.owner}
                </p>
              </div>
              <span className="font-mono text-sm">{gap.count} asks</span>
              <div className="sm:col-start-2 sm:col-end-4">
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--home-paper)_16%,transparent)]"
                  role="progressbar"
                  aria-valuenow={gap.count}
                  aria-valuemin={0}
                  aria-valuemax={maxGapCount}
                  aria-label={`${gap.question}: ${gap.count} unanswered questions`}
                >
                  <div
                    className="h-full rounded-full bg-[var(--home-signal)]"
                    style={{ width: `${Math.round((gap.count / maxGapCount) * 100)}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="adoption-heading" className="space-y-6">
        <SectionHeading kicker="Team adoption" title="One standard, twelve local realities">
          <p id="adoption-heading">
            The useful comparison is visible by team, from the stack each team runs, to the
            questions it resolves, to the exact point where it has drifted.
          </p>
        </SectionHeading>

        <div
          className="overflow-x-auto rounded-2xl border border-[var(--home-rule)]"
          role="region"
          aria-label="Standard adoption by team"
          tabIndex={0}
        >
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-[var(--home-paper-raised)]">
              <tr className="font-mono text-3xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                <th className="px-5 py-4 font-normal">Team</th>
                <th className="px-5 py-4 font-normal">Surface</th>
                <th className="px-5 py-4 font-normal">Toolchain</th>
                <th className="px-5 py-4 font-normal">Adoption</th>
                <th className="px-5 py-4 text-right font-normal">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--home-rule)] bg-[var(--home-paper)]">
              {ENABLEMENT_TEAM_SNAPSHOTS.map((team) => {
                const rate = Math.round(
                  (team.resolvedQuestions /
                    (team.resolvedQuestions + team.escalatedQuestions)) *
                    100
                );
                return (
                  <tr key={team.name}>
                    <th className="px-5 py-4 text-sm font-semibold text-[var(--home-ink)]">
                      {team.name}
                    </th>
                    <td className="px-5 py-4 text-sm text-[var(--home-ink-muted)]">
                      {LABELS.surfaces[team.surface]}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--home-ink-muted)]">
                      {team.toolchain}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 font-mono text-3xs uppercase tracking-[0.12em] ${
                          team.standardStatus === "standard"
                            ? "border-[var(--home-positive)] text-[var(--home-positive)]"
                            : team.standardStatus === "partial"
                              ? "border-[var(--home-warning)] text-[var(--home-warning)]"
                              : "border-[var(--home-negative)] text-[var(--home-negative)]"
                        }`}
                      >
                        {team.standardStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-[var(--home-ink)]">
                      {rate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="drift-heading" className="space-y-6">
        <SectionHeading kicker="Standards drift" title="Where teams are leaving the shared path">
          <p id="drift-heading">
            Partial adoption matters because a team can use the recommended framework and still
            preserve the reporting and maintenance differences that made the portfolio hard to
            support.
          </p>
        </SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          {driftTeams.map((team) => (
            <article key={team.name} className="home-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-3xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    {LABELS.surfaces[team.surface]} · {team.standardStatus}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--home-ink)]">{team.name}</h3>
                </div>
                <span
                  className={`mt-1 h-3 w-3 rounded-full ${
                    team.standardStatus === "drift"
                      ? "bg-[var(--home-negative)]"
                      : "bg-[var(--home-warning)]"
                  }`}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-5 text-sm leading-6 text-[var(--home-ink-muted)]">
                {team.driftReason}
              </p>
              <p className="mt-4 border-t border-[var(--home-rule)] pt-4 font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                Current stack · {team.toolchain}
              </p>
            </article>
          ))}
        </div>
      </section>

      <p className="border-t border-[var(--home-rule)] pt-5 text-xs leading-5 text-[var(--home-ink-muted)]">
        This dashboard uses invented, committed seed data for a portfolio demo. It does not
        describe a real organization or production program.
      </p>
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
    <label className={optionClass}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-[var(--home-signal)]"
      />
      <span>
        <span className="block text-sm font-semibold text-[var(--home-ink)]">{label}</span>
        {helper ? (
          <span className="mt-1 block text-xs leading-5 text-[var(--home-ink-muted)]">
            {helper}
          </span>
        ) : null}
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
      <div className="grid gap-5 lg:grid-cols-3">
        <fieldset className={fieldsetClass}>
          <legend className="px-1 text-base font-semibold text-[var(--home-ink)]">
            Primary surface
          </legend>
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
        </fieldset>
        <fieldset className={fieldsetClass}>
          <legend className="px-1 text-base font-semibold text-[var(--home-ink)]">
            Primary language
          </legend>
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
        </fieldset>
        <fieldset className={fieldsetClass}>
          <legend className="px-1 text-base font-semibold text-[var(--home-ink)]">
            CI system
          </legend>
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
      <fieldset className={fieldsetClass}>
        <legend className="px-1 text-base font-semibold text-[var(--home-ink)]">
          Which test layers does the team need?
        </legend>
        <p className="px-1 text-sm leading-6 text-[var(--home-ink-muted)]">
          Pick every layer the standard needs to cover. The score drops when a stack leaves a
          selected layer unsupported.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEST_LAYER_OPTIONS.map((option) => {
            const checked = intake.layers.includes(option.value);
            return (
              <label key={option.value} className={optionClass}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onIntakeChange(toggleTestLayer(intake, option.value))}
                  className="mt-1 h-4 w-4 accent-[var(--home-signal)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--home-ink)]">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--home-ink-muted)]">
                    {option.helper}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {intake.layers.length === 0 ? (
          <p role="alert" className="text-sm text-[var(--home-negative)]">
            Select at least one layer so the engine has something real to score.
          </p>
        ) : null}
      </fieldset>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
      <fieldset className={fieldsetClass}>
        <legend className="px-1 text-base font-semibold text-[var(--home-ink)]">
          Current automation maturity
        </legend>
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
      </fieldset>
      <fieldset className={fieldsetClass}>
        <legend className="px-1 text-base font-semibold text-[var(--home-ink)]">
          Team size
        </legend>
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
      </fieldset>
      <fieldset className={fieldsetClass}>
        <legend className="px-1 text-base font-semibold text-[var(--home-ink)]">
          Quality ownership
        </legend>
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

function ScoreLedger({ result }: { result: ScoredToolchain }) {
  return (
    <details className="mt-5 border-t border-[var(--home-rule)] pt-4">
      <summary className="flex min-h-touch cursor-pointer items-center text-sm font-semibold text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]">
        Show the score ledger
      </summary>
      <ul className="mt-3 divide-y divide-[var(--home-rule)]">
        {result.factors.map((factor) => (
          <li key={factor.label} className="grid gap-2 py-3 sm:grid-cols-[9rem_3rem_1fr]">
            <span className="text-xs font-semibold text-[var(--home-ink)]">
              {factor.label}
            </span>
            <span
              className={`font-mono text-xs ${
                factor.points >= 0
                  ? "text-[var(--home-positive)]"
                  : "text-[var(--home-negative)]"
              }`}
            >
              {factor.points >= 0 ? "+" : ""}
              {factor.points}
            </span>
            <span className="text-xs leading-5 text-[var(--home-ink-muted)]">
              {factor.detail}
            </span>
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
      className={`rounded-2xl border p-5 sm:p-6 ${
        primary
          ? "border-[var(--home-ink)] bg-[var(--home-paper-raised)]"
          : "border-[var(--home-rule)] bg-[var(--home-paper)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-3xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
            {label}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--home-ink)]">
            {result.toolchain.name}
          </h3>
        </div>
        <div
          className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border font-mono text-lg ${
            result.score >= 70
              ? "border-[var(--home-positive)] text-[var(--home-positive)]"
              : result.score >= 56
                ? "border-[var(--home-warning)] text-[var(--home-warning)]"
                : "border-[var(--home-negative)] text-[var(--home-negative)]"
          }`}
          role="img"
          aria-label={`${result.score} percent confidence`}
        >
          {result.score}%
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--home-ink-muted)]">
        {result.toolchain.summary}
      </p>
      <dl className="mt-5 grid gap-3 border-y border-[var(--home-rule)] py-4 text-xs sm:grid-cols-3">
        <div>
          <dt className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
            Framework
          </dt>
          <dd className="mt-1 text-[var(--home-ink)]">{result.toolchain.framework}</dd>
        </div>
        <div>
          <dt className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
            Runner
          </dt>
          <dd className="mt-1 text-[var(--home-ink)]">{result.toolchain.runner}</dd>
        </div>
        <div>
          <dt className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
            Reporting
          </dt>
          <dd className="mt-1 text-[var(--home-ink)]">{result.toolchain.reporting}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-[var(--home-ink)]">
        <span className="font-semibold">The tradeoff I would keep visible.</span>{" "}
        {result.toolchain.tradeoff}
      </p>
      <ScoreLedger result={result} />
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
    <div className="space-y-16">
      <section id="recommendation" aria-labelledby="recommendation-heading" className="space-y-6">
        <SectionHeading kicker="Scored recommendation" title="A recommendation you can inspect">
          <p id="recommendation-heading">
            The score is a committed set of readable rules. Change one answer in the intake and
            the recommendation moves because the surface, language, coverage, CI fit, migration
            work, or ownership score moved with it.
          </p>
        </SectionHeading>

        {recommendation.shouldEscalate ? (
          <div
            className="rounded-2xl border border-[var(--home-negative)] bg-[color-mix(in_srgb,var(--home-negative)_8%,var(--home-paper))] p-5 sm:p-6"
            role="status"
          >
            <p className="font-mono text-3xs uppercase tracking-[0.14em] text-[var(--home-negative)]">
              Human review needed
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--home-ink)]">
              I do not have enough confidence to recommend this setup.
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--home-ink-muted)]">
              The best catalog match scored {recommendation.primary.score}%, below the{" "}
              {recommendation.threshold}% threshold. I would route the intake to the central team
              instead of making the missing language or CI integration sound supported.
            </p>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
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
      </section>

      {!recommendation.shouldEscalate ? (
        <section id="plan" aria-labelledby="plan-heading" className="space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
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
              className={secondaryButtonClass}
              onClick={() => copyText(planText, "plan")}
            >
              {copied === "plan" ? "Plan copied" : "Copy full plan"}
            </button>
          </div>

          <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-6 before:top-8 before:w-px before:bg-[var(--home-rule)] sm:before:left-8">
            {plan.map((step) => (
              <li
                key={step.id}
                className="relative grid gap-4 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] p-5 pl-16 sm:grid-cols-[1fr_11rem] sm:p-6 sm:pl-20"
              >
                <span className="absolute left-3 top-5 z-10 grid h-12 w-12 place-items-center rounded-full border border-[var(--home-ink)] bg-[var(--home-paper)] font-mono text-sm text-[var(--home-ink)] sm:left-4 sm:top-6">
                  {String(step.order).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--home-ink)]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                    {step.description}
                  </p>
                  <pre className="mt-4 overflow-x-auto rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-4 font-mono text-xs leading-5 text-[var(--home-ink)]">
                    <code>{step.snippet}</code>
                  </pre>
                </div>
                <dl className="space-y-4 border-t border-[var(--home-rule)] pt-4 text-xs sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <div>
                    <dt className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      Owner
                    </dt>
                    <dd className="mt-1 text-[var(--home-ink)]">{step.owner}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      Rough effort
                    </dt>
                    <dd className="mt-1 text-[var(--home-ink)]">{step.effort}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      Prerequisite
                    </dt>
                    <dd className="mt-1 leading-5 text-[var(--home-ink)]">
                      {step.prerequisites}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section id="troubleshooting" aria-labelledby="troubleshooting-heading" className="space-y-6">
        <SectionHeading kicker="Troubleshooting desk" title="Ask a setup or integration question">
          <p id="troubleshooting-heading">
            This search retrieves from a small committed knowledge base. It reports its
            confidence and gives up when the question does not match the material it has.
          </p>
        </SectionHeading>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="home-card p-5 sm:p-6">
            <form onSubmit={runTroubleshooting}>
              <label
                htmlFor="troubleshooting-question"
                className="text-sm font-semibold text-[var(--home-ink)]"
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
                className="mt-3 min-h-[132px] w-full rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-3 text-sm leading-6 text-[var(--home-ink)] outline-none placeholder:text-[var(--home-ink-muted)] focus:border-[var(--home-signal)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--home-signal)_30%,transparent)]"
              />
              <button type="submit" className={`${primaryButtonClass} mt-3 w-full`}>
                Find an answer
              </button>
            </form>

            <div className="mt-6 border-t border-[var(--home-rule)] pt-5">
              <p className="font-mono text-3xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                Seeded demo questions
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TROUBLESHOOTING_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.question}
                    type="button"
                    onClick={() => setQuestion(prompt.question)}
                    className="min-h-touch rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-left text-xs leading-5 text-[var(--home-ink)] transition-colors hover:border-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                  >
                    {prompt.question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 sm:p-6"
            aria-live="polite"
          >
            {match ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-3xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    Retrieval confidence
                  </p>
                  <span
                    className={`font-mono text-sm ${
                      match.shouldEscalate
                        ? "text-[var(--home-negative)]"
                        : "text-[var(--home-positive)]"
                    }`}
                  >
                    {Math.round(match.confidence * 100)}%
                  </span>
                </div>
                {match.article ? (
                  <div className="mt-5">
                    <h3 className="text-2xl font-semibold text-[var(--home-ink)]">
                      {match.article.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--home-ink-muted)]">
                      {match.article.answer}
                    </p>
                    <pre className="mt-5 overflow-x-auto rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] p-4 font-mono text-xs leading-5 text-[var(--home-ink)]">
                      <code>{match.article.snippet}</code>
                    </pre>
                    <p className="mt-4 font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                      Matched terms · {match.matchedTerms.join(", ")}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5">
                    <h3 className="text-2xl font-semibold text-[var(--home-ink)]">
                      I do not have a reliable answer for this.
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--home-ink-muted)]">
                      The best match stayed below the{" "}
                      {Math.round(TROUBLESHOOTING_CONFIDENCE_THRESHOLD * 100)}% threshold. I would
                      send the question and the team context to a person instead of guessing.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="grid min-h-[320px] place-items-center text-center">
                <div className="max-w-sm">
                  <p className="font-mono text-5xl text-[var(--home-rule)]">?</p>
                  <h3 className="mt-5 text-xl font-semibold text-[var(--home-ink)]">
                    No question searched yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                    Try a known setup problem or one of the deliberately unsupported questions
                    to see the confidence boundary.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {handoffNeeded ? (
        <section
          id="handoff"
          aria-labelledby="handoff-heading"
          className="overflow-hidden rounded-3xl border border-[var(--home-ink)]"
        >
          <div className="bg-[var(--home-ink)] p-6 text-[var(--home-paper)] sm:p-8">
            <p className="font-mono text-3xs uppercase tracking-[0.14em] text-[var(--home-signal)]">
              Escalation handoff
            </p>
            <h2
              id="handoff-heading"
              className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em]"
            >
              Give the central team the context up front.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color-mix(in_srgb,var(--home-paper)_75%,transparent)]">
              The handoff carries the intake, the recommendation, the exact question, and what
              the team already tried so support can start with the failure instead of repeating
              discovery.
            </p>
          </div>
          <div className="grid gap-6 bg-[var(--home-paper)] p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <label
                htmlFor="attempted"
                className="text-sm font-semibold text-[var(--home-ink)]"
              >
                What has the team already tried?
              </label>
              <textarea
                id="attempted"
                value={attempted}
                onChange={(event) => setAttempted(event.target.value)}
                rows={7}
                placeholder="Add commands, links, errors, or changes already attempted"
                className="mt-3 min-h-[180px] w-full rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-3 text-sm leading-6 text-[var(--home-ink)] outline-none placeholder:text-[var(--home-ink-muted)] focus:border-[var(--home-signal)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--home-signal)_30%,transparent)]"
              />
              <button
                type="button"
                className={`${primaryButtonClass} mt-3 w-full`}
                onClick={() => copyText(escalationDraft, "handoff")}
              >
                {copied === "handoff" ? "Support request copied" : "Copy support request"}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 font-mono text-xs leading-6 text-[var(--home-ink)]">
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

  return (
    <div role="tabpanel" aria-label="Team onboarding" className="space-y-16">
      <section aria-labelledby="intake-heading" className="space-y-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <SectionHeading kicker="Guided intake" title="Start with the team that needs help">
            <p id="intake-heading">
              The intake keeps the parts that change the recommendation separate. Move backward
              and forward freely, and every answer stays in place.
            </p>
          </SectionHeading>
          <button type="button" onClick={reset} className={secondaryButtonClass}>
            Reset intake
          </button>
        </div>

        <nav aria-label="Intake progress">
          <ol className="grid gap-2 sm:grid-cols-3">
            {stepLabels.map((label, index) => {
              const current = step === index;
              const completed = step > index || showResults;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setStep(index as IntakeStep)}
                    aria-current={current ? "step" : undefined}
                    className={`flex min-h-touch w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] ${
                      current
                        ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--home-paper)]"
                        : "border-[var(--home-rule)] bg-[var(--home-paper)] text-[var(--home-ink)] hover:border-[var(--home-ink)]"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full border font-mono text-3xs ${
                        current
                          ? "border-[var(--home-paper)]"
                          : completed
                            ? "border-[var(--home-positive)] text-[var(--home-positive)]"
                            : "border-[var(--home-rule)]"
                      }`}
                    >
                      {completed && !current ? "✓" : index + 1}
                    </span>
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <IntakeForm intake={intake} step={step} onIntakeChange={setIntake} />

        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setStep(moveIntakeStep(step, -1))}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={advance}
            disabled={step === 1 && intake.layers.length === 0}
          >
            {step === INTAKE_STEP_COUNT - 1 ? "Build recommendation" : "Continue"}
          </button>
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
    <div className="home-page min-h-screen bg-[var(--home-paper)]">
      <section className="relative overflow-hidden border-b border-[var(--home-rule)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          aria-hidden="true"
          style={
            {
              backgroundImage:
                "linear-gradient(var(--home-rule) 1px, transparent 1px), linear-gradient(90deg, var(--home-rule) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(to bottom, black, transparent 88%)",
            } as CSSProperties
          }
        />
        <div className="home-shell relative py-12 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div className="max-w-4xl">
              <p className="home-kicker">Internal platform enablement · deterministic demo</p>
              <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.055em] text-[var(--home-ink)] sm:text-6xl lg:text-7xl">
                Automation Enablement Assistant
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--home-ink-muted)] sm:text-lg">
                I built this to help a small central tooling team support many independent
                product teams without repeating the same onboarding work one team at a time.
                It recommends a standard stack, writes the adoption plan, answers the common
                setup questions, and turns every failure into a clearer documentation backlog.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--home-ink)] bg-[var(--home-ink)] p-5 text-[var(--home-paper)]">
              <p className="font-mono text-3xs uppercase tracking-[0.16em] text-[var(--home-signal)]">
                Model boundary
              </p>
              <p className="mt-3 text-sm leading-6 text-[color-mix(in_srgb,var(--home-paper)_78%,transparent)]">
                No credentials, live model, or hidden service. The scoring, retrieval, plans,
                and program data all run from committed TypeScript rules and invented seed data.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="workspace" className="home-shell home-section">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-[var(--home-rule)] pb-6 sm:flex-row sm:items-center">
          <WorkspaceTabs view={view} onChange={changeView} />
          <p className="font-mono text-3xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
            {view === "program" ? "Portfolio view · 12 seeded teams" : "Team view · 3 intake steps"}
          </p>
        </div>
        {view === "program" ? (
          <ProgramDashboard onStart={() => changeView("team")} />
        ) : (
          <TeamOnboarding />
        )}
      </div>
    </div>
  );
}
