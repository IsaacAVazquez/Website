"use client";

import { readValidatedBrowserStorage, writeBrowserStorageJson } from "@/lib/browserStorage";
import { prefixedId } from "@/lib/utils";
import { useEffect, useId, useRef, useState } from "react";
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
  /**
   * True when this screen replaced a running room (the "New room" button).
   * The button that was pressed is gone, so the heading takes the focus.
   */
  focusHeadingOnMount?: boolean;
}

// Left alone the armed button disarms again, so the guard cannot quietly decay
// into a one-click wipe the next time the visitor comes back to this screen.
const START_ARM_TIMEOUT_MS = 5000;

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

/** The kit's segmented switch: aria-pressed buttons in one frame, as wide as the field it sits in. */
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
    <div role="group" aria-labelledby={labelledBy} className="ffb-seg ffb-dt-field-seg">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onSelect(option.value)}
          className="ffb-seg-btn"
        >
          {option.label}
        </button>
      ))}
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
  focusHeadingOnMount = false,
}: DraftSetupProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusHeadingOnMount) headingRef.current?.focus();
  }, [focusHeadingOnMount]);
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
      // Re-enable after a short tick, since startDraft is synchronous, but the
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
    <div className="ffb-dt-setup">
      <div className="ffb-sechead ffb-sechead-lg ffb-dt-setup-head">
        <h2 ref={headingRef} tabIndex={-1} className="ffb-h2">
          One screen, then draft.
        </h2>
        {canResume && onResume ? (
          <button type="button" onClick={onResume} className="ffb-btn">
            Back to room <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>

      <div className="ffb-dt-setup-main">
        {/* Saved presets are the shortest path for a returning league, so they
            lead. Saving one is an optional step and sits with the other optional
            settings below. */}
        {presets.length > 0 ? (
          <div className="ffb-field">
            <span className="ffb-field-label">League presets</span>
            <div className="ffb-cluster ffb-dt-presets">
              {presets.map((preset) => (
                <span key={preset.id} className="ffb-dt-preset">
                  <button
                    type="button"
                    onClick={() => applyPreset(preset)}
                    title={describeDraftPreset(preset)}
                    aria-label={`Apply preset ${preset.name}`}
                    className="ffb-btn"
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePreset(preset.id)}
                    aria-label={`Delete preset ${preset.name}`}
                    className="ffb-iconbtn ffb-iconbtn-edge"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="ffb-dt-fields">
          <label className="ffb-field" htmlFor="draft-total-teams">
            <span className="ffb-field-label">Teams</span>
            <select
              id="draft-total-teams"
              name="totalTeams"
              value={formState.totalTeams}
              onChange={(event) => updateField("totalTeams", Number(event.target.value))}
              className="ffb-select"
            >
              {[8, 10, 12, 14, 16].map((teamCount) => (
                <option key={teamCount} value={teamCount}>
                  {teamCount} teams
                </option>
              ))}
            </select>
          </label>

          <label className="ffb-field" htmlFor="draft-user-team">
            <span className="ffb-field-label">Your draft slot</span>
            <select
              id="draft-user-team"
              name="userTeam"
              value={formState.userTeam}
              onChange={(event) => updateField("userTeam", Number(event.target.value))}
              className="ffb-select"
            >
              {Array.from({ length: formState.totalTeams }, (_, index) => index + 1).map((slot) => (
                <option key={slot} value={slot}>
                  Pick {slot}
                </option>
              ))}
            </select>
          </label>

          <div className="ffb-field">
            <span id={scoringLabelId} className="ffb-field-label">
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

        <fieldset className="ffb-dt-fieldset">
          <legend className="ffb-field-label">Starting lineup</legend>
          <div className="ffb-choices ffb-dt-lineups">
            {REDRAFT_LINEUP_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={sameRedraftLineup(formState.lineup, preset.lineup)}
                onClick={() => updateField("lineup", { ...preset.lineup })}
                className="ffb-choice"
              >
                <span className="ffb-choice-title">{preset.label}</span>
                <span className="ffb-choice-note">{preset.description}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* The start block comes right after the four main fields in the document,
          so it sits under them on a phone. From 1024px the stylesheet moves it
          to a rail at the right, where it stays in view. */}
      <div className="ffb-dt-start">
        <div className="ffb-sechead">
          <h3 className="ffb-h3">Room setup</h3>
        </div>
        <p className="ffb-dt-start-summary">{summary}</p>
        {rankingsStatus === "loading" ? (
          <p role="status" className="ffb-dt-start-status">
            Loading the published rankings. Start will unlock when the board is ready.
          </p>
        ) : rankingsStatus === "error" ? (
          <div role="alert" className="ffb-notice ffb-notice-bad">
            <p className="ffb-notice-title">
              {rankingsError ?? "Fantasy rankings are unavailable right now."}
            </p>
            <div className="ffb-notice-actions">
              <button type="button" onClick={onRetryRankings} className="ffb-btn">
                Retry rankings
              </button>
            </div>
          </div>
        ) : (
          <p role="status" className="ffb-dt-start-status">
            Published rankings are ready.
          </p>
        )}
        {startArmed ? (
          <p role="status" className="ffb-dt-start-status ffb-bad">
            Starting clears the {parkedPickCount}{" "}
            {parkedPickCount === 1 ? "pick" : "picks"} already logged in the parked room, and undo
            cannot bring them back. Press again to confirm, or use Back to room to keep them.
          </p>
        ) : null}
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
          // A disabled kit button prints unfilled with a dashed edge, so only
          // the armed state needs its own class.
          className={`ffb-btn ffb-btn-primary ffb-btn-lg ffb-btn-block${
            startArmed && !startDisabled ? " ffb-btn-danger" : ""
          }`}
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

      {/* F12 of the 2026-10-05 audit: teams, slot, scoring, and a lineup preset
          are enough to start, so everything else waits in a native disclosure.
          The summary line beside Start still prints the order, rounds, and
          lineup in force. */}
      <details className="ffb-details ffb-dt-optional">
        <summary>
          <span data-when="closed">Show optional settings</span>
          <span data-when="open">Hide optional settings</span>
        </summary>
        <div className="ffb-details-body ffb-dt-optional-body">
          <div className="ffb-dt-optional-fields">
            <label className="ffb-field" htmlFor="draft-league-name">
              <span className="ffb-field-label">League name</span>
              <input
                id="draft-league-name"
                name="leagueName"
                value={formState.leagueName ?? ""}
                onChange={(event) => updateField("leagueName", event.target.value.slice(0, 60))}
                autoComplete="organization"
                maxLength={60}
                placeholder="Home league"
                className="ffb-input"
              />
            </label>

            <label className="ffb-field" htmlFor="draft-rounds">
              <span className="ffb-field-label">Rounds</span>
              <select
                id="draft-rounds"
                name="rounds"
                value={formState.rounds}
                onChange={(event) => updateField("rounds", Number(event.target.value))}
                className="ffb-select"
              >
                {[13, 14, 15, 16, 17, 18].map((roundCount) => (
                  <option key={roundCount} value={roundCount}>
                    {roundCount} rounds
                  </option>
                ))}
              </select>
            </label>

            <div className="ffb-field">
              <span id={orderLabelId} className="ffb-field-label">
                Draft order
              </span>
              <SegmentedButtons
                labelledBy={orderLabelId}
                options={ORDER_OPTIONS}
                value={formState.draftType}
                onSelect={(draftType) => updateField("draftType", draftType)}
              />
            </div>

            <div className="ffb-field">
              <span id={clockLabelId} className="ffb-field-label">
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

          <fieldset className="ffb-dt-fieldset">
            <legend className="ffb-field-label">Custom lineup</legend>
            {/* Presets cover the common rooms; these selects keep odd home-league
                lineups reachable. Flex accepts RB, WR, or TE, and the board scores
                one-QB rankings only, so Superflex rooms are not modeled here. */}
            <div className="ffb-dt-lineup-custom">
              <p className="ffb-dt-lineup-fixed">
                <span className="ffb-field-label">Quarterbacks</span>
                <span>1</span>
              </p>
              {LINEUP_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className="ffb-field"
                  htmlFor={`lineup-${field.key.toLowerCase()}`}
                >
                  <span className="ffb-field-label">{field.label}</span>
                  <select
                    id={`lineup-${field.key.toLowerCase()}`}
                    value={formState.lineup[field.key]}
                    onChange={(event) => updateLineupField(field.key, Number(event.target.value))}
                    className="ffb-select"
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

          <div className="ffb-field">
            <span className="ffb-field-label">Save as a league preset</span>
            <div className="ffb-cluster ffb-dt-preset-save">
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
                className="ffb-input"
              />
              <button type="button" onClick={saveCurrentPreset} className="ffb-btn">
                Save current settings
              </button>
            </div>
            <p className="ffb-field-hint">
              A preset stores teams, slot, rounds, scoring, order, clock, lineup, and league name on
              this device. Applying one fills the form and starts nothing.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
