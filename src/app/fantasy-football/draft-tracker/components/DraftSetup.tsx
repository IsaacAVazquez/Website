"use client";

import { readValidatedBrowserStorage, writeBrowserStorageJson } from "@/lib/browserStorage";
import { prefixedId } from "@/lib/utils";
import { useEffect, useId, useState, type CSSProperties } from "react";
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
  sameRedraftLineup,
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
  "min-h-touch w-full border px-[var(--c97-sp-1)] font-mono text-xs transition-[background-color,border-color,box-shadow] duration-200";

const FIELD_STYLE: CSSProperties = {
  borderColor: "var(--c97-rule)",
  background: "var(--c97-surface)",
  color: "var(--c97-ink)",
};

const PILL_BUTTON_CLASS =
  "inline-flex min-h-touch items-center justify-center border border-[var(--c97-rule)] bg-[var(--c97-surface)] px-[var(--c97-sp-2)] font-mono text-2xs uppercase tracking-[0.06em] text-[var(--c97-ink)] hover:border-[var(--c97-ink)]";

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

/** Fused segmented control: aria-pressed buttons inside one hairline frame. */
function SegmentedButtons<Value extends string | number>({
  options,
  value,
  onSelect,
  labelledBy,
}: {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onSelect: (value: Value) => void;
  /** Id of the visible label, so each segment is announced with its group. */
  labelledBy: string;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="inline-flex overflow-hidden border"
      style={{ borderColor: "var(--c97-rule)" }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className={`min-h-touch flex-1 font-mono text-2xs uppercase tracking-[0.06em] ${
              active ? "" : "hover:bg-[var(--c97-overlay)]"
            }`}
            style={
              { paddingInline: "var(--c97-sp-1)", ...(active
                ? { background: "var(--c97-ink)", color: "var(--c97-surface)" }
                : { color: "var(--c97-ink)" }) }
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
  const scoringLabelId = useId();
  const orderLabelId = useId();
  const clockLabelId = useId();
  const startingSlots = countRedraftStartingSlots(formState.lineup);
  const lineupTooLarge = startingSlots > formState.rounds;
  const rankingsReady = rankingsStatus === "ready";
  const clearsParkedPicks = parkedPickCount > 0;
  const startDisabled = isStarting || lineupTooLarge || !rankingsReady;

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
    const saved = readValidatedBrowserStorage(DRAFT_PRESETS_STORAGE_KEY, decodeDraftPresets, () => []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate saved presets once on mount
    if (saved.source === "valid") setPresets(saved.value);
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
    writeBrowserStorageJson(DRAFT_PRESETS_STORAGE_KEY, next);
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
      id: prefixedId("preset"),
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
    if (startDisabled) return;
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
      className="overflow-hidden border"
      style={{ borderColor: "var(--c97-rule)", background: "var(--c97-field)" }}
    >
      <div
        className="flex flex-wrap items-baseline justify-between border-b"
        style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)" }}
      >
        <div className="min-w-0">
          <p className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
            Room setup
          </p>
          <h2 className="c97-poster-sm" style={{ marginTop: "var(--c97-sp-1)" }}>One screen, then draft.</h2>
        </div>
        {canResume && onResume ? (
          <button
            type="button"
            onClick={onResume}
            className={PILL_BUTTON_CLASS}
          >
            Back to room <span className="c97-arrow" aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>

      {/* Saved presets are the shortest path for a returning league, so they
          lead. Saving one is an optional step and sits with the other optional
          settings below. */}
      {presets.length > 0 ? (
        <div
          className="grid border-b"
          style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", gap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)" }}
        >
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
            League presets
          </span>
          <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-0)" }}>
            {presets.map((preset) => (
              <span
                key={preset.id}
                className="inline-flex items-center overflow-hidden border"
                style={{ borderColor: "var(--c97-rule)", background: "var(--c97-surface)" }}
              >
                <button
                  type="button"
                  onClick={() => applyPreset(preset)}
                  title={describeDraftPreset(preset)}
                  aria-label={`Apply preset ${preset.name}`}
                  className="inline-flex min-h-touch items-center font-mono text-2xs hover:bg-[var(--c97-overlay)]"
                  style={{ paddingInline: "var(--c97-sp-1)", color: "var(--c97-ink)" }}
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={() => deletePreset(preset.id)}
                  aria-label={`Delete preset ${preset.name}`}
                  className="inline-flex min-h-touch min-w-touch items-center justify-center border-l hover:bg-[var(--c97-overlay)]"
                  style={{ borderColor: "var(--c97-rule)", color: "var(--c97-ink-2)" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className="grid"
        style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-2)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))" }}
      >
        <label className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }} htmlFor="draft-total-teams">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
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

        <label className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }} htmlFor="draft-user-team">
          <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
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

        <div className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }}>
          <span id={scoringLabelId} className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
            Scoring
          </span>
          <SegmentedButtons
            options={SCORING_OPTIONS}
            value={formState.scoringFormat}
            onSelect={updateScoringFormat}
            labelledBy={scoringLabelId}
          />
        </div>
      </div>

      <fieldset className="grid" style={{ paddingInline: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
        <legend className={`${MONO_LABEL_CLASS}`} style={{ marginBottom: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
          Starting lineup
        </legend>
        <div className="grid" style={{ gap: "var(--c97-sp-1)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))" }}>
          {REDRAFT_LINEUP_PRESETS.map((preset) => {
            const active = sameRedraftLineup(formState.lineup, preset.lineup);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => updateField("lineup", { ...preset.lineup })}
                className={`min-h-[56px] border text-left ${
                  active ? "" : "bg-[var(--c97-surface)] hover:bg-[var(--c97-overlay)]"
                }`}
                style={
                  { paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)", ...(active
                    ? { borderColor: "var(--c97-ink)", background: "var(--c97-ink)", color: "var(--c97-surface)" }
                    : { borderColor: "var(--c97-rule)", color: "var(--c97-ink)" }) }
                }
              >
                <span className="block text-sm font-semibold tracking-[-0.01em]">{preset.label}</span>
                <span
                  className="mt-0.5 block font-mono text-3xs tracking-[0.04em]"
                  style={{
                    color: active
                      ? "color-mix(in srgb, var(--c97-surface) 75%, transparent)"
                      : "var(--c97-ink-2)",
                  }}
                >
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* F12 of the 2026-10-05 audit: teams, slot, scoring, and a lineup preset
          are enough to start, so everything else waits in a native disclosure.
          The summary line beside Start still prints the order, rounds, and
          lineup in force. */}
      <details className="c97-disclosure" style={{ paddingInline: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-2)" }}>
        <summary className="c97-btn-ghost">
          <span data-when="closed">Show optional settings</span>
          <span data-when="open">Hide optional settings</span>
        </summary>
        <div className="grid" style={{ gap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-1)" }}>
          <div
            className="grid"
            style={{ columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-2)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))" }}
          >
            <label className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }} htmlFor="draft-league-name">
              <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
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

            <label className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }} htmlFor="draft-rounds">
              <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
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

            <div className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }}>
              <span id={orderLabelId} className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                Draft order
              </span>
              <SegmentedButtons
                labelledBy={orderLabelId}
                options={ORDER_OPTIONS}
                value={formState.draftType}
                onSelect={(draftType) => updateField("draftType", draftType)}
              />
            </div>

            <div className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }}>
              <span id={clockLabelId} className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                Pick clock · advisory
              </span>
              <SegmentedButtons
                labelledBy={clockLabelId}
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

          <div className="grid" style={{ gap: "var(--c97-sp-1)" }}>
            <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
              Custom lineup
            </span>
            {/* Presets cover the common rooms; these selects keep odd home-league
                lineups reachable. Flex accepts RB, WR, or TE, and the board scores
                one-QB rankings only, so Superflex rooms are not modeled here. */}
            <div className="grid" style={{ columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
              <div className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }}>
                <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
                  Quarterbacks
                </span>
                <span className="font-mono text-xs" style={{ paddingBlock: "var(--c97-sp-1)" }}>1</span>
              </div>
              {LINEUP_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className="grid content-start text-sm" style={{ gap: "var(--c97-sp-0)" }}
                  htmlFor={`lineup-${field.key.toLowerCase()}`}
                >
                  <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
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
          </div>

          <div className="grid" style={{ gap: "var(--c97-sp-1)" }}>
            <span className={MONO_LABEL_CLASS} style={{ color: "var(--c97-ink-2)" }}>
              Save as a league preset
            </span>
            <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>
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
                className="min-h-touch w-56 border font-mono text-xs"
                style={{ paddingInline: "var(--c97-sp-1)", ...(FIELD_STYLE) }}
              />
              <button
                type="button"
                onClick={saveCurrentPreset}
                className={PILL_BUTTON_CLASS}
              >
                Save current settings
              </button>
            </div>
            <p className="m-0 font-mono text-3xs leading-relaxed" style={{ color: "var(--c97-ink-2)" }}>
              A preset stores teams, slot, rounds, scoring, order, clock, lineup, and league name on
              this device. Applying one fills the form and starts nothing.
            </p>
          </div>
        </div>
      </details>

      <div
        className="flex flex-wrap items-center justify-between border-t"
        style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)", columnGap: "var(--c97-sp-2)", rowGap: "var(--c97-sp-1)", borderColor: "var(--c97-rule)", background: "var(--c97-surface)" }}
      >
        <div className="grid min-w-0" style={{ gap: "var(--c97-sp-0)" }}>
          <p className="m-0 font-mono text-2xs leading-relaxed" style={{ color: "var(--c97-ink-2)" }}>
            {summary}
          </p>
          {rankingsStatus === "loading" ? (
            <p role="status" className="m-0 text-sm font-semibold">
              Loading the published rankings. Start will unlock when the board is ready.
            </p>
          ) : rankingsStatus === "error" ? (
            <div role="alert" className="flex flex-wrap items-center text-sm" style={{ gap: "var(--c97-sp-1)" }}>
              <p className="m-0 font-semibold" style={{ color: "var(--c97-negative)" }}>
                {rankingsError ?? "Fantasy rankings are unavailable right now."}
              </p>
              <button
                type="button"
                onClick={onRetryRankings}
                className={PILL_BUTTON_CLASS}
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
              style={{ color: "var(--c97-negative)" }}
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
          disabled={startDisabled}
          aria-busy={isStarting}
          aria-label={
            startArmed
              ? "Confirm new draft and clear the parked room"
              : clearsParkedPicks
                ? "Start draft, which clears the parked room"
                : undefined
          }
          // .c97-btn:disabled prints the unprinted state (no fill, dashed ink-2
          // edge, ink-2 text, no offset), so only the armed fill stays inline.
          className="c97-btn c97-btn-invert c97-offset justify-center"
          style={
            startArmed && !startDisabled
              ? { background: "var(--c97-negative)", color: "var(--c97-surface)" }
              : undefined
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
