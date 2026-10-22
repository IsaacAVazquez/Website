"use client";

import { useState } from "react";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import {
  DEFAULT_TEAM_INTAKE,
  SURFACE_OPTIONS,
  LANGUAGE_OPTIONS,
  CI_OPTIONS,
  MATURITY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TEST_LAYER_OPTIONS,
  LABELS,
  type TeamIntake,
} from "./enablement-data";
import {
  generateOnboardingPlan,
  recommendToolchains,
} from "./enablement-engine";
import {
  parseTeamRecords,
  saveTeamRecord,
  setTeamProgress,
  TEAM_RECORDS_KEY,
  type TeamRecord,
} from "./teamRecords";

const blank = (): TeamRecord => ({
  id: "",
  name: "",
  intake: { ...DEFAULT_TEAM_INTAKE, layers: [...DEFAULT_TEAM_INTAKE.layers] },
  standardStatus: "partial",
  resolvedQuestions: 0,
  escalatedQuestions: 0,
  completedSteps: [],
});
export function UserTeams() {
  const {
    value: teams,
    update,
    status,
  } = useBrowserRecord(TEAM_RECORDS_KEY, parseTeamRecords);
  const [draft, setDraft] = useState(blank);
  const [original, setOriginal] = useState<TeamRecord | undefined>();
  const [activeId, setActiveId] = useState("");
  const [message, setMessage] = useState("");
  const active = teams.find((team) => team.id === activeId);
  const plan = active ? generateOnboardingPlan(active.intake) : [];
  const recommendation = active ? recommendToolchains(active.intake) : null;
  const total = teams.reduce(
    (sum, team) => sum + team.resolvedQuestions + team.escalatedQuestions,
    0,
  );
  const resolved = teams.reduce((sum, team) => sum + team.resolvedQuestions, 0);
  function intakeField<K extends keyof TeamIntake>(
    field: K,
    value: TeamIntake[K],
  ) {
    setDraft((previous) => ({
      ...previous,
      intake: { ...previous.intake, [field]: value },
    }));
  }
  return (
    <div className="ea-user-teams">
      <section className="ea-section" aria-labelledby="ea-user-heading">
        <h2 id="ea-user-heading" className="ea-h2">
          Your teams
        </h2>
        <p>
          These records are saved in this browser and kept separate from the
          example program. Enter the team&apos;s own question counts and
          adoption status.
        </p>
        <p>
          {teams.length} teams ·{" "}
          {teams.filter((team) => team.standardStatus === "standard").length} on
          the full standard ·{" "}
          {total
            ? `${Math.round((resolved / total) * 100)}% of ${total} questions resolved without escalation`
            : "No questions recorded"}
        </p>
        {status === "memory-only" ? (
          <p role="status">
            Browser storage is unavailable. These edits only last in this tab.
          </p>
        ) : null}
        <form
          className="ea-record-form"
          onSubmit={(event) => {
            event.preventDefault();
            const next = {
              ...draft,
              id: draft.id || crypto.randomUUID(),
              name: draft.name.trim(),
            };
            const validated = parseTeamRecords(JSON.stringify([next]))[0];
            if (!validated) {
              setMessage(
                "Check the team name and question counts before saving.",
              );
              return;
            }
            if (!draft.id && teams.length >= 50) {
              setMessage(
                "There is room for 50 teams. Remove a team before adding another.",
              );
              return;
            }
            const saved = update((latest) =>
              saveTeamRecord(latest, validated, original),
            ).find((team) => team.id === validated.id);
            if (!saved) {
              setDraft(blank());
              setOriginal(undefined);
              setMessage(
                "This team was removed in another tab. Start a new record to add it again.",
              );
              return;
            }
            setDraft(saved);
            setOriginal(saved);
            setActiveId(saved.id);
            setMessage(
              `Saved ${saved.name}. Intake changes reset its onboarding checklist.`,
            );
          }}
        >
          <label>
            Team name
            <input
              className="c97-field"
              required
              maxLength={80}
              value={draft.name}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Product surface
            <select
              className="c97-field"
              value={draft.intake.surface}
              onChange={(event) =>
                intakeField(
                  "surface",
                  event.target.value as TeamIntake["surface"],
                )
              }
            >
              {SURFACE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Primary language
            <select
              className="c97-field"
              value={draft.intake.language}
              onChange={(event) =>
                intakeField(
                  "language",
                  event.target.value as TeamIntake["language"],
                )
              }
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Continuous integration
            <select
              className="c97-field"
              value={draft.intake.ci}
              onChange={(event) =>
                intakeField("ci", event.target.value as TeamIntake["ci"])
              }
            >
              {CI_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Automation maturity
            <select
              className="c97-field"
              value={draft.intake.maturity}
              onChange={(event) =>
                intakeField(
                  "maturity",
                  event.target.value as TeamIntake["maturity"],
                )
              }
            >
              {MATURITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Team size
            <select
              className="c97-field"
              value={draft.intake.teamSize}
              onChange={(event) =>
                intakeField(
                  "teamSize",
                  event.target.value as TeamIntake["teamSize"],
                )
              }
            >
              {TEAM_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Adoption status
            <select
              className="c97-field"
              value={draft.standardStatus}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  standardStatus: event.target
                    .value as TeamRecord["standardStatus"],
                }))
              }
            >
              {["standard", "partial", "drift"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          {(["resolvedQuestions", "escalatedQuestions"] as const).map(
            (field) => (
              <label key={field}>
                {field === "resolvedQuestions"
                  ? "Resolved questions"
                  : "Escalated questions"}
                <input
                  className="c97-field"
                  type="number"
                  required
                  min={0}
                  max={1000000}
                  step={1}
                  value={draft[field]}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      [field]:
                        event.target.value === ""
                          ? 0
                          : Number(event.target.value),
                    }))
                  }
                />
              </label>
            ),
          )}
          <fieldset>
            <legend>Test layers</legend>
            {TEST_LAYER_OPTIONS.map((option) => (
              <label className="ea-record-check" key={option.value}>
                <input
                  type="checkbox"
                  checked={draft.intake.layers.includes(option.value)}
                  onChange={() =>
                    intakeField(
                      "layers",
                      draft.intake.layers.includes(option.value)
                        ? draft.intake.layers.filter(
                            (layer) => layer !== option.value,
                          )
                        : [...draft.intake.layers, option.value],
                    )
                  }
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <label className="ea-record-check">
            <input
              type="checkbox"
              checked={draft.intake.hasQualityEngineer}
              onChange={(event) =>
                intakeField("hasQualityEngineer", event.target.checked)
              }
            />{" "}
            Has a quality engineer
          </label>
          <div className="ea-record-actions">
            <button className="c97-btn" type="submit">
              {draft.id ? "Save team changes" : "Save team"}
            </button>
            <button
              className="c97-btn-ghost"
              type="button"
              onClick={() => {
                setDraft(blank());
                setOriginal(undefined);
              }}
            >
              New team
            </button>
          </div>
        </form>
        <p role="status">{message}</p>
        {teams.length ? (
          <div
            className="ea-table-scroll"
            role="region"
            aria-label="Your saved team records"
            tabIndex={0}
          >
            <table className="ea-table">
              <thead>
                <tr>
                  <th scope="col">Team</th>
                  <th scope="col">Surface</th>
                  <th scope="col">Adoption</th>
                  <th scope="col">Questions resolved</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id}>
                    <th scope="row">{team.name}</th>
                    <td>{LABELS.surfaces[team.intake.surface]}</td>
                    <td>{team.standardStatus}</td>
                    <td>
                      {team.resolvedQuestions} of{" "}
                      {team.resolvedQuestions + team.escalatedQuestions}
                    </td>
                    <td>
                      <button
                        className="c97-btn-ghost"
                        type="button"
                        onClick={() => {
                          setDraft(team);
                          setOriginal(team);
                          setActiveId(team.id);
                        }}
                      >
                        Edit {team.name}
                      </button>
                      <button
                        className="c97-btn-ghost"
                        type="button"
                        onClick={() => {
                          update((latest) =>
                            latest.filter((entry) => entry.id !== team.id),
                          );
                          if (draft.id === team.id) {
                            setDraft(blank());
                            setOriginal(undefined);
                          }
                          setMessage(`Removed ${team.name}.`);
                        }}
                      >
                        Remove {team.name}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No saved teams yet. Add your first team above.</p>
        )}
      </section>
      {active && recommendation ? (
        <section className="ea-section" aria-labelledby="ea-progress-heading">
          <h2 id="ea-progress-heading" className="ea-h2">
            Onboarding for {active.name}
          </h2>
          <p>
            {recommendation.primary.toolchain.name} · fit score{" "}
            {recommendation.primary.score} out of 100. This score measures the
            rules&apos; match to the intake.
          </p>
          {recommendation.shouldEscalate ? (
            <p>
              This intake needs a central team review before choosing a stack.
            </p>
          ) : (
            <>
              <p>
                {active.completedSteps.length} of {plan.length} steps complete.
              </p>
              <ol className="ea-record-progress">
                {plan.map((step) => (
                  <li key={step.id}>
                    <label className="ea-record-check">
                      <input
                        type="checkbox"
                        aria-label={`Complete ${step.title} for ${active.name}`}
                        checked={active.completedSteps.includes(step.id)}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          update((latest) => setTeamProgress(latest, active.id, active.intake, step.id, checked));
                        }}
                      />
                      {step.title}
                    </label>
                    <p>{step.description}</p>
                    <p>
                      {step.owner} · {step.effort}
                    </p>
                    <pre className="ea-snippet">
                      <code>{step.snippet}</code>
                    </pre>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
