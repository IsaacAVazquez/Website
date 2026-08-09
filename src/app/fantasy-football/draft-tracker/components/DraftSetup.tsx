"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { DraftSettings, RedraftLineupSettings, ScoringFormat } from "@/types";
import {
  REDRAFT_LINEUP_PRESETS,
  countRedraftStartingSlots,
  normalizeRedraftLineup,
  redraftLineupSummary,
} from "@/lib/redraftLineup";

interface DraftSetupProps {
  settings: DraftSettings;
  onSaveSettings: (settings: Partial<DraftSettings>) => void;
  onStartDraft: () => void;
}

const SCORING_OPTIONS: { value: ScoringFormat; label: string; description: string }[] = [
  { value: "PPR", label: "PPR", description: "Best for reception-heavy leagues." },
  { value: "HALF_PPR", label: "Half PPR", description: "Balanced default for most home leagues." },
  { value: "STANDARD", label: "Standard", description: "Use when receptions do not score." },
];

const LINEUP_FIELDS: ReadonlyArray<{
  key: Exclude<keyof RedraftLineupSettings, "QB">;
  label: string;
  values: readonly number[];
}> = [
  { key: "RB", label: "Running backs", values: [1, 2, 3] },
  { key: "WR", label: "Wide receivers", values: [1, 2, 3, 4] },
  { key: "TE", label: "Tight ends", values: [1, 2] },
  { key: "FLEX", label: "Flex spots", values: [0, 1, 2, 3] },
  { key: "K", label: "Kickers", values: [0, 1] },
  { key: "DST", label: "Defenses", values: [0, 1] },
];

function sameLineup(left: RedraftLineupSettings, right: RedraftLineupSettings): boolean {
  return (Object.keys(left) as (keyof RedraftLineupSettings)[]).every(
    (position) => left[position] === right[position]
  );
}

function getOptionStyle(active: boolean): CSSProperties {
  if (active) {
    return {
      borderColor: "var(--home-ink)",
      background: "var(--home-ink)",
      color: "var(--home-paper)",
    };
  }

  return {
    borderColor: "var(--home-rule)",
    background: "color-mix(in srgb, var(--home-paper-alt) 52%, var(--home-elev-mix))",
    color: "var(--home-ink)",
  };
}

function getFieldStyle(): CSSProperties {
  return {
    borderColor: "var(--home-rule)",
    background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
    color: "var(--home-ink)",
  };
}

export function DraftSetup({ settings, onSaveSettings, onStartDraft }: DraftSetupProps) {
  const [formState, setFormState] = useState<DraftSettings>(settings);
  const [isStarting, setIsStarting] = useState(false);
  const startingSlots = countRedraftStartingSlots(formState.lineup);
  const lineupTooLarge = startingSlots > formState.rounds;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync local form state when external draft settings change (controlled-to-local mirror)
    setFormState(settings);
  }, [settings]);

  function updateField<Key extends keyof DraftSettings>(field: Key, value: DraftSettings[Key]) {
    setFormState((current) => {
      const nextState = { ...current, [field]: value };
      if (field === "totalTeams" && nextState.userTeam > Number(value)) {
        nextState.userTeam = Number(value);
      }

      return nextState;
    });
  }

  function updateLineupField(
    field: Exclude<keyof RedraftLineupSettings, "QB">,
    value: number
  ) {
    setFormState((current) => ({
      ...current,
      lineup: normalizeRedraftLineup({ ...current.lineup, [field]: value }),
    }));
  }

  function handleStartDraft() {
    if (isStarting || lineupTooLarge) return;
    setIsStarting(true);
    try {
      onSaveSettings(formState);
      onStartDraft();
    } finally {
      // Re-enable after a short tick — startDraft is synchronous, but the
      // brief disable prevents double-click submission.
      setTimeout(() => setIsStarting(false), 400);
    }
  }

  return (
    <div className="home-card scroll-mt-28 p-5 sm:p-6">
      <div className="border-b pb-4" style={{ borderColor: "var(--home-rule)" }}>
        <p className="home-kicker mb-1">Draft Setup</p>
        <h2 className="text-2xl font-semibold">Configure the room before picks start.</h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
          Save the league settings once, then use the published snapshot board to log every pick as
          the room moves.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm" htmlFor="draft-league-name">
          <span className="home-kicker mb-0">League name</span>
          <input
            id="draft-league-name"
            name="leagueName"
            value={formState.leagueName ?? ""}
            onChange={(event) => updateField("leagueName", event.target.value.slice(0, 60))}
            autoComplete="organization"
            maxLength={60}
            className="min-h-[48px] w-full rounded-[var(--radius-3xl)] border px-4 text-sm transition-[background-color,border-color,box-shadow] duration-200"
            style={getFieldStyle()}
            placeholder="Home league"
          />
        </label>

        <label className="grid gap-2 text-sm" htmlFor="draft-total-teams">
          <span className="home-kicker mb-0">Teams</span>
          <select
            id="draft-total-teams"
            name="totalTeams"
            value={formState.totalTeams}
            onChange={(event) => updateField("totalTeams", Number(event.target.value))}
            className="min-h-[48px] w-full rounded-[var(--radius-3xl)] border px-4 text-sm transition-[background-color,border-color,box-shadow] duration-200"
            style={getFieldStyle()}
          >
            {[8, 10, 12, 14, 16].map((teamCount) => (
              <option key={teamCount} value={teamCount}>
                {teamCount} teams
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm" htmlFor="draft-user-team">
          <span className="home-kicker mb-0">Your draft slot</span>
          <select
            id="draft-user-team"
            name="userTeam"
            value={formState.userTeam}
            onChange={(event) => updateField("userTeam", Number(event.target.value))}
            className="min-h-[48px] w-full rounded-[var(--radius-3xl)] border px-4 text-sm transition-[background-color,border-color,box-shadow] duration-200"
            style={getFieldStyle()}
          >
            {Array.from({ length: formState.totalTeams }, (_, index) => index + 1).map((slot) => (
              <option key={slot} value={slot}>
                Pick {slot}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm" htmlFor="draft-rounds">
          <span className="home-kicker mb-0">Rounds</span>
          <select
            id="draft-rounds"
            name="rounds"
            value={formState.rounds}
            onChange={(event) => updateField("rounds", Number(event.target.value))}
            className="min-h-[48px] w-full rounded-[var(--radius-3xl)] border px-4 text-sm transition-[background-color,border-color,box-shadow] duration-200"
            style={getFieldStyle()}
          >
            {[13, 14, 15, 16, 17, 18].map((roundCount) => (
              <option key={roundCount} value={roundCount}>
                {roundCount} rounds
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-5 grid gap-3 text-sm">
        <legend className="home-kicker mb-0">Starting lineup</legend>
        <p className="text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
          Match the league you will actually draft. Flex accepts RB, WR, or TE. This assistant uses
          one-QB rankings, so Superflex and two-QB leagues are not scored here.
        </p>
        <div className="grid auto-rows-fr gap-2 md:grid-cols-3">
          {REDRAFT_LINEUP_PRESETS.map((preset) => {
            const active = sameLineup(formState.lineup, preset.lineup);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => updateField("lineup", { ...preset.lineup })}
                className="min-h-[84px] rounded-[var(--radius-3xl)] border px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow] duration-200"
                style={getOptionStyle(active)}
              >
                <span className="block text-sm font-semibold">{preset.label}</span>
                <span
                  className="mt-1 block text-xs leading-5"
                  style={{
                    color: active
                      ? "color-mix(in srgb, var(--home-paper) 78%, transparent)"
                      : "var(--home-ink-muted)",
                  }}
                >
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            className="grid min-h-[72px] gap-1 rounded-[var(--radius-3xl)] border px-4 py-3"
            style={getFieldStyle()}
          >
            <span className="home-kicker mb-0">Quarterbacks</span>
            <span className="text-sm font-semibold">1</span>
          </div>
          {LINEUP_FIELDS.map((field) => (
            <label key={field.key} className="grid gap-1 text-sm" htmlFor={`lineup-${field.key.toLowerCase()}`}>
              <span className="home-kicker mb-0">{field.label}</span>
              <select
                id={`lineup-${field.key.toLowerCase()}`}
                value={formState.lineup[field.key]}
                onChange={(event) => updateLineupField(field.key, Number(event.target.value))}
                className="min-h-[48px] w-full rounded-[var(--radius-3xl)] border px-4 text-sm transition-[background-color,border-color,box-shadow] duration-200"
                style={getFieldStyle()}
              >
                {field.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <fieldset className="grid gap-2 text-sm">
          <legend className="home-kicker mb-0">Draft order</legend>
          <div className="grid auto-rows-fr gap-2 sm:grid-cols-2">
            {[
              { value: "snake" as const, label: "Snake", description: "Reverse order each round." },
              { value: "linear" as const, label: "Linear", description: "Same order every round." },
            ].map((option) => {
              const active = formState.draftType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateField("draftType", option.value)}
                  className="min-h-[76px] rounded-[var(--radius-3xl)] border px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow] duration-200"
                  style={getOptionStyle(active)}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span
                    className="mt-1 block text-xs"
                    style={{ color: active ? "color-mix(in srgb, var(--home-paper) 78%, transparent)" : "var(--home-ink-muted)" }}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="grid gap-2 text-sm">
          <legend className="home-kicker mb-0">Scoring</legend>
          <div className="grid auto-rows-fr gap-2">
            {SCORING_OPTIONS.map((option) => {
              const active = formState.scoringFormat === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateField("scoringFormat", option.value)}
                  className="min-h-[72px] rounded-[var(--radius-3xl)] border px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow] duration-200"
                  style={getOptionStyle(active)}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span
                    className="mt-1 block text-xs"
                    style={{ color: active ? "color-mix(in srgb, var(--home-paper) 78%, transparent)" : "var(--home-ink-muted)" }}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <fieldset className="grid gap-2 text-sm">
          <legend className="home-kicker mb-0">Per-pick timer</legend>
          <div className="grid auto-rows-fr gap-2 sm:grid-cols-2">
            {[
              { value: 0, label: "Off", description: "No clock, log at your own pace." },
              { value: 90, label: "On", description: "Advisory countdown each pick." },
            ].map((option) => {
              const active = (option.value > 0) === ((formState.timerSeconds ?? 0) > 0);
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateField("timerSeconds", option.value === 0 ? 0 : formState.timerSeconds || 90)}
                  className="min-h-[72px] rounded-[var(--radius-3xl)] border px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow] duration-200"
                  style={getOptionStyle(active)}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span
                    className="mt-1 block text-xs"
                    style={{ color: active ? "color-mix(in srgb, var(--home-paper) 78%, transparent)" : "var(--home-ink-muted)" }}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="grid gap-2 text-sm" htmlFor="draft-timer-seconds">
          <span className="home-kicker mb-0">Seconds per pick</span>
          <select
            id="draft-timer-seconds"
            name="timerSeconds"
            value={formState.timerSeconds || 90}
            disabled={(formState.timerSeconds ?? 0) === 0}
            onChange={(event) => updateField("timerSeconds", Number(event.target.value))}
            className="min-h-[48px] w-full rounded-[var(--radius-3xl)] border px-4 text-sm transition-[background-color,border-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            style={getFieldStyle()}
          >
            {[45, 60, 90, 120, 180].map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds} seconds
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="mt-6 grid gap-3 rounded-[var(--radius-3xl)] border px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        style={{
          borderColor: "var(--home-rule)",
          background: "color-mix(in srgb, var(--home-paper-alt) 52%, var(--home-elev-mix))",
        }}
      >
        <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
          {lineupTooLarge
            ? `This lineup needs ${startingSlots} starters, which does not fit in ${formState.rounds} rounds. Reduce the lineup or add rounds before starting.`
            : `The board will track ${formState.totalTeams} teams, ${formState.rounds} rounds, and highlight your turns from slot ${formState.userTeam}. Your lineup is ${redraftLineupSummary(formState.lineup)}.`}
        </p>
        <button
          type="button"
          onClick={handleStartDraft}
          disabled={isStarting || lineupTooLarge}
          aria-busy={isStarting}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border px-4 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          style={{
            borderColor: "var(--home-ink)",
            background: "var(--home-ink)",
            color: "var(--home-paper)",
          }}
        >
          {isStarting ? "Starting…" : "Start draft assistant"}
        </button>
      </div>
    </div>
  );
}
