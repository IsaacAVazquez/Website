"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { DraftSettings, RedraftLineupSettings, ScoringFormat } from "@/types";
import {
  DRAFT_PRESETS_STORAGE_KEY,
  MAX_DRAFT_PRESETS,
  decodeDraftPresets,
  describeDraftPreset,
  toDraftPresetSettings,
  type DraftPreset,
} from "@/lib/draftPresets";
import {
  REDRAFT_LINEUP_PRESETS,
  countRedraftStartingSlots,
  normalizeRedraftLineup,
  redraftLineupSummary,
} from "@/lib/redraftLineup";
import { MONO_LABEL_CLASS } from "@/lib/fantasyUtils";
import { FANTASY_SCORING_LABELS, scoringFormatToRouteScoring } from "@/lib/fantasy";

interface DraftSetupProps {
  settings: DraftSettings;
  onSaveSettings: (settings: Partial<DraftSettings>) => void;
  /**
   * Selects the setup screen's rankings snapshot without changing the parked
   * room. The full form is still committed through onSaveSettings at Start.
   */
  onPreviewScoring?: (scoringFormat: ScoringFormat) => void;
  onStartDraft: () => void;
  rankingsStatus: "loading" | "error" | "ready";
  rankingsError: string | null;
  onRetryRankings: () => void;
  /** True when a room with picks is parked behind this screen (the "New room" path). */
  canResume?: boolean;
  onResume?: () => void;
  /**
   * How many picks the parked room still holds. Starting from this screen calls
   * resetDraft, which clears the picks and the undo history together, so a
   * non-zero count arms the start button instead of letting one click wipe it.
   */
  parkedPickCount?: number;
}

// Left alone the armed button disarms again, so the guard cannot quietly decay
// into a one-click wipe the next time the visitor comes back to this screen.
const START_ARM_TIMEOUT_MS = 5000;

const FIELD_CLASS =
  "min-h-touch w-full rounded border px-3 font-mono text-xs transition-[background-color,border-color,box-shadow] duration-200";

const FIELD_STYLE: CSSProperties = {
  borderColor: "var(--home-rule)",
  background: "var(--home-paper)",
  color: "var(--home-ink)",
};

const PILL_BUTTON_CLASS =
  "inline-flex min-h-touch items-center justify-center rounded-full border px-3.5 font-mono text-2xs uppercase tracking-[0.06em]";

const SCORING_OPTIONS: { value: ScoringFormat; label: string }[] = [
  { value: "PPR", label: "PPR" },
  { value: "HALF_PPR", label: "Half" },
  { value: "STANDARD", label: "Std" },
];

const ORDER_OPTIONS: { value: DraftSettings["draftType"]; label: string }[] = [
  { value: "snake", label: "Snake" },
  { value: "linear", label: "Linear" },
];

const CLOCK_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Off" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
  { value: 120, label: "120s" },
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

/** Fused segmented control: aria-pressed buttons inside one hairline frame. */
function SegmentedButtons<Value extends string | number>({
  options,
  value,
  onSelect,
}: {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onSelect: (value: Value) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded border" style={{ borderColor: "var(--home-rule)" }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className="min-h-touch flex-1 px-2.5 font-mono text-2xs uppercase tracking-[0.06em]"
            style={
              active
                ? { background: "var(--home-ink)", color: "var(--home-paper)" }
                : { background: "transparent", color: "var(--home-ink)" }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function DraftSetup({
  settings,
  onSaveSettings,
  onPreviewScoring,
  onStartDraft,
  rankingsStatus,
  rankingsError,
  onRetryRankings,
  canResume = false,
  onResume,
  parkedPickCount = 0,
}: DraftSetupProps) {
  const [formState, setFormState] = useState<DraftSettings>(settings);
  const [isStarting, setIsStarting] = useState(false);
  const [startArmed, setStartArmed] = useState(false);
  const [presets, setPresets] = useState<DraftPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const startingSlots = countRedraftStartingSlots(formState.lineup);
  const lineupTooLarge = startingSlots > formState.rounds;
  const rankingsReady = rankingsStatus === "ready";
  const clearsParkedPicks = parkedPickCount > 0;

  useEffect(() => {
    if (!startArmed) return;
    const timer = window.setTimeout(() => setStartArmed(false), START_ARM_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [startArmed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync local form state when external draft settings change (controlled-to-local mirror)
    setFormState(settings);
  }, [settings]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_PRESETS_STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate saved presets once on mount
        setPresets(decodeDraftPresets(JSON.parse(raw)));
      }
    } catch {
      // Presets are a convenience; a blocked read just leaves the list empty.
    }
  }, []);

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

  function updateScoringFormat(scoringFormat: ScoringFormat) {
    setFormState((current) => ({ ...current, scoringFormat }));
    // Snapshot selection is a preview. Publishing it through onSaveSettings
    // mutates a parked room and sends the changed settings prop back through
    // the mirror effect above, which also wipes every unsaved form field.
    onPreviewScoring?.(scoringFormat);
  }

  function persistPresets(next: DraftPreset[]) {
    setPresets(next);
    try {
      localStorage.setItem(DRAFT_PRESETS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // A blocked write only skips the save; the applied form is unaffected.
    }
  }

  function applyPreset(preset: DraftPreset) {
    setFormState((current) => ({
      ...current,
      ...preset.settings,
      lineup: { ...preset.settings.lineup },
    }));
    // Keep all room settings local until Start. The separate preview callback
    // lets the parent load this scoring board without editing the parked room.
    onPreviewScoring?.(preset.settings.scoringFormat);
  }

  function saveCurrentPreset() {
    const fallbackName =
      formState.leagueName?.trim() ||
      `${formState.totalTeams}-team ${FANTASY_SCORING_LABELS[scoringFormatToRouteScoring(formState.scoringFormat)]}`;
    const name = (presetName.trim() || fallbackName).slice(0, 40);
    const preset: DraftPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      savedAt: new Date().toISOString(),
      settings: toDraftPresetSettings(formState),
    };
    // Saving under an existing name replaces that preset rather than piling up
    // near-duplicates of the same league.
    persistPresets(
      [preset, ...presets.filter((entry) => entry.name !== name)].slice(0, MAX_DRAFT_PRESETS)
    );
    setPresetName("");
  }

  function deletePreset(id: string) {
    persistPresets(presets.filter((entry) => entry.id !== id));
  }

  function handleStartDraft() {
    if (isStarting || lineupTooLarge || !rankingsReady) return;
    // Starting over a parked room is the destructive step, so the first press
    // only arms it.
    if (clearsParkedPicks && !startArmed) {
      setStartArmed(true);
      return;
    }
    setStartArmed(false);
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

  const scoringLabel =
    SCORING_OPTIONS.find((option) => option.value === formState.scoringFormat)?.label ??
    formState.scoringFormat;
  const summary = lineupTooLarge
    ? `This lineup needs ${startingSlots} starters, which does not fit in ${formState.rounds} rounds. Reduce the lineup or add rounds before starting.`
    : `${formState.totalTeams}-team ${formState.draftType} · slot ${formState.userTeam} · ${formState.rounds} rounds · ${scoringLabel} · ${redraftLineupSummary(formState.lineup)}`;

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--home-rule)", background: "var(--home-paper-raised)" }}
    >
      <div
        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b px-4 py-3.5 sm:px-5"
        style={{ borderColor: "var(--home-rule)" }}
      >
        <div className="min-w-0">
          <p className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Room setup
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">One screen, then draft.</h2>
        </div>
        {canResume && onResume ? (
          <button
            type="button"
            onClick={onResume}
            className={PILL_BUTTON_CLASS}
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }}
          >
            Back to room →
          </button>
        ) : null}
      </div>

      <div
        className="grid gap-2.5 border-b px-4 py-3.5 sm:px-5"
        style={{ borderColor: "var(--home-rule)" }}
      >
        <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
          League presets
        </span>
        {presets.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <span
                key={preset.id}
                className="inline-flex items-center overflow-hidden rounded-full border"
                style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
              >
                <button
                  type="button"
                  onClick={() => applyPreset(preset)}
                  title={describeDraftPreset(preset)}
                  aria-label={`Apply preset ${preset.name}`}
                  className="inline-flex min-h-touch items-center px-3 font-mono text-2xs"
                  style={{ color: "var(--home-ink)" }}
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={() => deletePreset(preset.id)}
                  aria-label={`Delete preset ${preset.name}`}
                  className="inline-flex min-h-touch min-w-touch items-center justify-center border-l"
                  style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="draft-preset-name" className="sr-only">
            Preset name
          </label>
          <input
            id="draft-preset-name"
            name="presetName"
            value={presetName}
            onChange={(event) => setPresetName(event.target.value.slice(0, 40))}
            maxLength={40}
            placeholder="Name these settings"
            autoComplete="off"
            className="min-h-touch w-56 rounded border px-3 font-mono text-xs"
            style={FIELD_STYLE}
          />
          <button
            type="button"
            onClick={saveCurrentPreset}
            className={PILL_BUTTON_CLASS}
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }}
          >
            Save current settings
          </button>
        </div>
        <p className="m-0 font-mono text-3xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
          A preset stores teams, slot, rounds, scoring, order, clock, lineup, and league name on
          this device. Applying one fills the form and starts nothing.
        </p>
      </div>

      <div
        className="grid gap-x-4 gap-y-3.5 px-4 py-4 sm:px-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}
      >
        <label className="grid content-start gap-1.5 text-sm" htmlFor="draft-league-name">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            League name
          </span>
          <input
            id="draft-league-name"
            name="leagueName"
            value={formState.leagueName ?? ""}
            onChange={(event) => updateField("leagueName", event.target.value.slice(0, 60))}
            autoComplete="organization"
            maxLength={60}
            placeholder="Home league"
            className={FIELD_CLASS}
            style={FIELD_STYLE}
          />
        </label>

        <label className="grid content-start gap-1.5 text-sm" htmlFor="draft-total-teams">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Teams
          </span>
          <select
            id="draft-total-teams"
            name="totalTeams"
            value={formState.totalTeams}
            onChange={(event) => updateField("totalTeams", Number(event.target.value))}
            className={FIELD_CLASS}
            style={FIELD_STYLE}
          >
            {[8, 10, 12, 14, 16].map((teamCount) => (
              <option key={teamCount} value={teamCount}>
                {teamCount} teams
              </option>
            ))}
          </select>
        </label>

        <label className="grid content-start gap-1.5 text-sm" htmlFor="draft-user-team">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Your draft slot
          </span>
          <select
            id="draft-user-team"
            name="userTeam"
            value={formState.userTeam}
            onChange={(event) => updateField("userTeam", Number(event.target.value))}
            className={FIELD_CLASS}
            style={FIELD_STYLE}
          >
            {Array.from({ length: formState.totalTeams }, (_, index) => index + 1).map((slot) => (
              <option key={slot} value={slot}>
                Pick {slot}
              </option>
            ))}
          </select>
        </label>

        <label className="grid content-start gap-1.5 text-sm" htmlFor="draft-rounds">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Rounds
          </span>
          <select
            id="draft-rounds"
            name="rounds"
            value={formState.rounds}
            onChange={(event) => updateField("rounds", Number(event.target.value))}
            className={FIELD_CLASS}
            style={FIELD_STYLE}
          >
            {[13, 14, 15, 16, 17, 18].map((roundCount) => (
              <option key={roundCount} value={roundCount}>
                {roundCount} rounds
              </option>
            ))}
          </select>
        </label>

        <div className="grid content-start gap-1.5 text-sm">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Scoring
          </span>
          <SegmentedButtons options={SCORING_OPTIONS} value={formState.scoringFormat} onSelect={updateScoringFormat} />
        </div>

        <div className="grid content-start gap-1.5 text-sm">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Draft order
          </span>
          <SegmentedButtons
            options={ORDER_OPTIONS}
            value={formState.draftType}
            onSelect={(draftType) => updateField("draftType", draftType)}
          />
        </div>

        <div className="grid content-start gap-1.5 text-sm">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
            Pick clock · advisory
          </span>
          <SegmentedButtons
            options={CLOCK_OPTIONS}
            value={
              // A restored room can hold an off-menu duration (45s or 180s from
              // the previous setup UI). It renders with no active segment until
              // one is chosen, and the stored value keeps working.
              CLOCK_OPTIONS.some((option) => option.value === (formState.timerSeconds ?? 0))
                ? (formState.timerSeconds ?? 0)
                : -1
            }
            onSelect={(timerSeconds) => updateField("timerSeconds", timerSeconds)}
          />
        </div>
      </div>

      <fieldset className="grid gap-2.5 px-4 pb-4 sm:px-5">
        <legend className={`${MONO_LABEL_CLASS} mb-2`} style={{ color: "var(--home-ink-muted)" }}>
          Starting lineup
        </legend>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          {REDRAFT_LINEUP_PRESETS.map((preset) => {
            const active = sameLineup(formState.lineup, preset.lineup);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => updateField("lineup", { ...preset.lineup })}
                className="min-h-[56px] rounded border px-3 py-2 text-left"
                style={
                  active
                    ? { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
                    : { borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }
                }
              >
                <span className="block text-sm font-semibold tracking-[-0.01em]">{preset.label}</span>
                <span
                  className="mt-0.5 block font-mono text-3xs tracking-[0.04em]"
                  style={{
                    color: active
                      ? "color-mix(in srgb, var(--home-paper) 75%, transparent)"
                      : "var(--home-ink-muted)",
                  }}
                >
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Presets cover the common rooms; these selects keep odd home-league
            lineups reachable. Flex accepts RB, WR, or TE, and the board scores
            one-QB rankings only, so Superflex rooms are not modeled here. */}
        <div className="grid gap-x-4 gap-y-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <div className="grid content-start gap-1.5 text-sm">
            <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
              Quarterbacks
            </span>
            <span className="py-2.5 font-mono text-xs">1</span>
          </div>
          {LINEUP_FIELDS.map((field) => (
            <label
              key={field.key}
              className="grid content-start gap-1.5 text-sm"
              htmlFor={`lineup-${field.key.toLowerCase()}`}
            >
              <span className={MONO_LABEL_CLASS} style={{ color: "var(--home-ink-muted)" }}>
                {field.label}
              </span>
              <select
                id={`lineup-${field.key.toLowerCase()}`}
                value={formState.lineup[field.key]}
                onChange={(event) => updateLineupField(field.key, Number(event.target.value))}
                className={FIELD_CLASS}
                style={FIELD_STYLE}
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

      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-t px-4 py-3.5 sm:px-5"
        style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)" }}
      >
        <div className="grid min-w-0 gap-1.5">
          <p className="m-0 font-mono text-2xs leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
            {summary}
          </p>
          {rankingsStatus === "loading" ? (
            <p role="status" className="m-0 text-sm font-semibold">
              Loading the published rankings. Start will unlock when the board is ready.
            </p>
          ) : rankingsStatus === "error" ? (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
              <p className="m-0 font-semibold" style={{ color: "var(--home-negative)" }}>
                {rankingsError ?? "Fantasy rankings are unavailable right now."}
              </p>
              <button
                type="button"
                onClick={onRetryRankings}
                className={PILL_BUTTON_CLASS}
                style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink)" }}
              >
                Retry rankings
              </button>
            </div>
          ) : (
            <p role="status" className="m-0 text-sm font-semibold">
              Published rankings are ready.
            </p>
          )}
          {startArmed ? (
            <p
              role="status"
              className="m-0 max-w-[60ch] text-sm font-semibold leading-6"
              style={{ color: "var(--home-negative)" }}
            >
              Starting clears the {parkedPickCount}{" "}
              {parkedPickCount === 1 ? "pick" : "picks"} already logged in the parked room, and undo
              cannot bring them back. Press again to confirm, or use Back to room to keep them.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleStartDraft}
          disabled={isStarting || lineupTooLarge || !rankingsReady}
          aria-busy={isStarting}
          aria-label={
            startArmed
              ? "Confirm new draft and clear the parked room"
              : clearsParkedPicks
                ? "Start draft, which clears the parked room"
                : undefined
          }
          className="inline-flex min-h-touch items-center justify-center rounded-full border px-5 font-mono text-2xs uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-70"
          style={
            startArmed
              ? {
                  borderColor: "var(--home-negative)",
                  background: "var(--home-negative)",
                  color: "var(--home-paper)",
                }
              : { borderColor: "var(--home-ink)", background: "var(--home-ink)", color: "var(--home-paper)" }
          }
        >
          {isStarting
            ? "Starting…"
            : rankingsStatus === "loading"
              ? "Loading rankings…"
              : rankingsStatus === "error"
                ? "Rankings unavailable"
                : startArmed
                  ? "Confirm new draft"
                  : "Start draft"}
        </button>
      </div>
    </div>
  );
}
