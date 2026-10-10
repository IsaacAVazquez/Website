"use client";

// Pool settings: the scoring rules first (including the 90-minute vs
// final-result basis that changes the whole scoring path), then the pool's
// name and league, rivals, an advanced disclosure holding the standing and
// posture, the field model, and the de-vig method, and per-league data
// provenance.

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useScorePools } from "@/hooks/useScorePools";
import type { StoredPool } from "@/lib/scorePools/persistence";
import type { DevigMethod, Posture, ScoringBasis } from "@/lib/scorePools";
import type { ScorePoolsSnapshot } from "@/types/scorePools";
import {
  FIELD_HINT,
  FIELD_INPUT,
  FIELD_LABEL,
  PILL_BUTTON,
  SampleDataNotice,
  formatAge,
  leagueOptionLabel,
} from "../score-pools-ui";

interface SettingsClientProps {
  snapshot: ScorePoolsSnapshot;
}

const TIMEZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Berlin",
  "UTC",
];

const SECTION = "c97-panel";
const HINT_STYLE = {
  display: "block" as const,
  marginTop: "var(--c97-sp-1)",
  fontSize: "var(--c97-fs-small)",
  color: "var(--c97-ink-2)",
};

function NumberSetting({
  label,
  value,
  onChange,
  hint,
  min,
  max,
  step,
  allowEmpty,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  allowEmpty?: boolean;
}) {
  // While focused the field keeps exactly what was typed and only passes a value
  // up once it is in range, because the callers and the store decoder clamp what
  // they get, and clamping each keystroke turned "12" into "212" in a field with a
  // minimum of 2. Leaving the field snaps the typed value into range.
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const typed = draft === null ? value : Number.parseFloat(draft);
  const outOfRange = typed !== null && Number.isFinite(typed) && clamp(typed) !== typed;
  return (
    <label className="block">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={draft ?? value ?? ""}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          if (raw === "") {
            if (allowEmpty) onChange(null);
            return;
          }
          const parsed = Number.parseFloat(raw);
          if (Number.isFinite(parsed) && clamp(parsed) === parsed) onChange(parsed);
        }}
        onBlur={() => {
          if (draft === null) return;
          const parsed = Number.parseFloat(draft);
          if (Number.isFinite(parsed)) onChange(clamp(parsed));
          else if (!allowEmpty) onChange(clamp(0));
          setDraft(null);
        }}
        className={FIELD_INPUT}
        style={{ marginTop: "var(--c97-sp-1)" }}
      />
      {hint ? (
        <span className={FIELD_HINT} style={HINT_STYLE}>
          {hint}
        </span>
      ) : null}
      {outOfRange ? (
        <span className={FIELD_HINT} style={{ ...HINT_STYLE, color: "var(--c97-negative)" }}>
          Use a value from {min ?? "any"} to {max ?? "any"}. It snaps into range when you leave the field.
        </span>
      ) : null}
    </label>
  );
}

function SelectSetting<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={FIELD_LABEL}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={FIELD_INPUT}
        style={{ marginTop: "var(--c97-sp-1)" }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <span className={FIELD_HINT} style={HINT_STYLE}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function SettingsClient({ snapshot }: SettingsClientProps) {
  const {
    pools,
    activePool,
    addPool,
    removePool,
    setActivePool,
    updatePool,
    addRival,
    updateRival,
    removeRival,
  } = useScorePools();
  const [newPoolLeague, setNewPoolLeague] = useState(
    snapshot.leagues.find((entry) => entry.fixtures.length > 0)?.key ?? "",
  );
  const [newPoolName, setNewPoolName] = useState("");
  const [newRivalName, setNewRivalName] = useState("");
  const [newRivalError, setNewRivalError] = useState("");
  const [status, setStatus] = useState("");
  const newRivalErrorId = useId();
  const newRivalInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // One "now" per visit keeps the freshness column pure across renders.
  const [nowIso] = useState(() => new Date().toISOString());

  const pool = activePool;
  const patch = (updater: (current: StoredPool) => StoredPool) => {
    if (pool) updatePool(pool.id, updater);
  };

  return (
    <section className="c97-band min-h-dvh" data-c97-surface="paper">
      <div className="flex flex-col c97-shell" style={{ rowGap: "var(--c97-sp-3)" }}>
        <header>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Prediction tools</p>
          <h1 className="c97-display">
            Pool{" "}
            <em style={{ fontFamily: "var(--c97-font-display)", fontStyle: "italic", fontWeight: 400 }}>
              Settings
            </em>
          </h1>
          <p className="text-sm leading-relaxed text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
            The scoring rules decide which picks get recommended, so set those first. The pool
            name, league, and rivals come next, and the standing and risk settings sit under
            advanced settings with defaults that work. Back to the{" "}
            <Link className="c97-link" href="/score-pools">
              pick sheet
            </Link>
            .
          </p>
        </header>

        <SampleDataNotice snapshot={snapshot} />

        <section className={SECTION} aria-label="Pools">
          <h2 className="c97-serif c97-h2">Pools</h2>
          <div className="c97-segmented" style={{ marginTop: "var(--c97-sp-1)" }}>
            {pools.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === pool?.id}
                className="min-h-[44px] text-sm font-semibold"
                onClick={() => {
                  setActivePool(entry.id);
                  setConfirmDelete(false);
                }}
              >
                {entry.name}
              </button>
            ))}
          </div>
          <form
            aria-label="Create pool"
            className="flex flex-wrap items-end"
            style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}
            onSubmit={(event) => {
              event.preventDefault();
              if (!newPoolLeague) return;
              const name = newPoolName.trim() || "My pool";
              addPool(newPoolLeague, name);
              setNewPoolName("");
              setConfirmDelete(false);
              setStatus(`Added ${name}. Its settings are below.`);
            }}
          >
            <label className="block">
              <span className={FIELD_LABEL}>League</span>
              <select
                value={newPoolLeague}
                onChange={(event) => setNewPoolLeague(event.target.value)}
                className={FIELD_INPUT}
                style={{ marginTop: "var(--c97-sp-1)" }}
              >
                {snapshot.leagues.map((entry) => (
                  <option key={entry.key} value={entry.key} disabled={entry.fixtures.length === 0}>
                    {leagueOptionLabel(entry)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={FIELD_LABEL}>Name</span>
              <input
                type="text"
                value={newPoolName}
                onChange={(event) => setNewPoolName(event.target.value)}
                placeholder="Office pool"
                className={FIELD_INPUT}
                style={{ marginTop: "var(--c97-sp-1)" }}
              />
            </label>
            <button
              type="submit"
              className={PILL_BUTTON}
            >
              Add pool
            </button>
          </form>
          <p role="status" aria-live="polite" className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
            {status}
          </p>
        </section>

        {pool ? (
          <>
            <section className={SECTION} aria-label="Scoring rules">
              <h2 className="c97-serif c97-h2">Scoring rules</h2>
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                Set these to match your pool&apos;s own rules, since every recommendation is ranked by
                the points it should earn under them. The scoring basis matters most in knockouts,
                since under 90-minute scoring a game that finishes 1-1 and goes to penalties scores
                as a 1-1 draw, and under final-result scoring your pick compares against the score
                after extra time.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-1)" }}>
                <NumberSetting
                  label="Exact score points"
                  value={pool.rules.exact}
                  min={0}
                  max={100}
                  onChange={(value) =>
                    patch((current) => ({
                      ...current,
                      rules: { ...current.rules, exact: Math.max(0, Math.min(100, value ?? 0)) },
                    }))
                  }
                />
                <NumberSetting
                  label="Winner and goal difference"
                  value={pool.rules.correctDifference}
                  min={0}
                  max={100}
                  onChange={(value) =>
                    patch((current) => ({
                      ...current,
                      rules: { ...current.rules, correctDifference: Math.max(0, Math.min(100, value ?? 0)) },
                    }))
                  }
                />
                <NumberSetting
                  label="Correct outcome only"
                  value={pool.rules.correctOutcome}
                  min={0}
                  max={100}
                  onChange={(value) =>
                    patch((current) => ({
                      ...current,
                      rules: { ...current.rules, correctOutcome: Math.max(0, Math.min(100, value ?? 0)) },
                    }))
                  }
                />
                <SelectSetting<ScoringBasis>
                  label="Scoring basis"
                  value={pool.rules.basis}
                  options={[
                    { value: "ninetyMinutes", label: "90-minute result" },
                    { value: "finalResult", label: "Final result (after extra time)" },
                  ]}
                  onChange={(basis) =>
                    patch((current) => ({ ...current, rules: { ...current.rules, basis } }))
                  }
                />
                <label className="flex min-h-[44px] cursor-pointer items-center self-end border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ gap: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}>
                  <input
                    type="checkbox"
                    checked={pool.rules.penaltiesCountAsWin}
                    onChange={(event) =>
                      patch((current) => ({
                        ...current,
                        rules: { ...current.rules, penaltiesCountAsWin: event.target.checked },
                      }))
                    }
                    className="c97-check"
                  />
                  <span className="text-xs font-semibold text-[var(--c97-ink)]">
                    Shootout winner counts as the winner
                  </span>
                </label>
              </div>
            </section>

            <section className={SECTION} aria-label="Pool basics">
              <h2 className="c97-serif c97-h2">
                {pool.name}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-1)" }}>
                <label className="block">
                  <span className={FIELD_LABEL}>Pool name</span>
                  <input
                    type="text"
                    value={pool.name}
                    onChange={(event) => patch((current) => ({ ...current, name: event.target.value }))}
                    className={FIELD_INPUT}
                    style={{ marginTop: "var(--c97-sp-1)" }}
                  />
                </label>
                <SelectSetting
                  label="League"
                  value={pool.leagueKey}
                  options={snapshot.leagues.map((entry) => ({
                    value: entry.key,
                    label: leagueOptionLabel(entry),
                    disabled: entry.fixtures.length === 0,
                  }))}
                  onChange={(leagueKey) => patch((current) => ({ ...current, leagueKey }))}
                />
                <SelectSetting
                  label="Timezone"
                  value={pool.timezone ?? "browser"}
                  options={[
                    { value: "browser", label: "Browser default" },
                    ...TIMEZONES.map((zone) => ({ value: zone, label: zone })),
                  ]}
                  onChange={(zone) =>
                    patch((current) => ({ ...current, timezone: zone === "browser" ? null : zone }))
                  }
                  hint="Kickoffs and lock times display in this zone."
                />
                <NumberSetting
                  label="Lock offset (minutes before kickoff)"
                  value={pool.lockOffsetMinutes}
                  min={0}
                  max={1440}
                  onChange={(value) =>
                    patch((current) => ({
                      ...current,
                      lockOffsetMinutes: Math.max(0, Math.min(1440, Math.round(value ?? 0))),
                    }))
                  }
                />
              </div>
            </section>

            <section className={SECTION} aria-label="Rivals">
              <h2 className="c97-serif c97-h2">Rivals</h2>
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                The people you&apos;re actually racing. Their picks go in on the tracker page; the
                adjustment covers points they banked before you started tracking.
              </p>
              <ul className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                {pool.rivals.map((rival) => (
                  <li key={rival.id} className="flex flex-wrap items-end border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ gap: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}>
                    <label className="block">
                      <span className={FIELD_LABEL}>Name</span>
                      <input
                        type="text"
                        value={rival.name}
                        onChange={(event) =>
                          updateRival(pool.id, rival.id, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className={FIELD_INPUT}
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      />
                    </label>
                    <NumberSetting
                      label="Points adjustment"
                      value={rival.pointsAdjustment}
                      onChange={(value) =>
                        updateRival(pool.id, rival.id, (current) => ({
                          ...current,
                          pointsAdjustment: value ?? 0,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={PILL_BUTTON}
                      onClick={() => {
                        removeRival(pool.id, rival.id);
                        setStatus(`Removed ${rival.name} and their saved picks.`);
                        newRivalInputRef.current?.focus();
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <form
                aria-label="Create rival"
                className="flex flex-wrap items-end"
                style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}
                onSubmit={(event) => {
                  event.preventDefault();
                  const name = newRivalName.trim();
                  if (!name) {
                    setNewRivalError("Enter a name for the rival.");
                    newRivalInputRef.current?.focus();
                    return;
                  }
                  addRival(pool.id, name);
                  setNewRivalName("");
                  setNewRivalError("");
                  setStatus(`Added ${name} to ${pool.name}. Enter their picks in the tracker.`);
                }}
              >
                <label className="block">
                  <span className={FIELD_LABEL}>New rival</span>
                  <input
                    type="text"
                    ref={newRivalInputRef}
                    value={newRivalName}
                    onChange={(event) => {
                      setNewRivalName(event.target.value);
                      setNewRivalError("");
                    }}
                    aria-invalid={!!newRivalError || undefined}
                    aria-describedby={newRivalError ? newRivalErrorId : undefined}
                    placeholder="Dana"
                    className={FIELD_INPUT}
                    style={{ marginTop: "var(--c97-sp-1)" }}
                  />
                </label>
                <button
                  type="submit"
                  className={PILL_BUTTON}
                >
                  Add rival
                </button>
              </form>
              {newRivalError ? (
                <p id={newRivalErrorId} role="alert" className="text-sm" style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-negative)" }}>
                  {newRivalError}
                </p>
              ) : null}
            </section>

            <details className="c97-disclosure">
              <summary className="c97-btn-ghost">
                <span data-when="closed">Show advanced settings</span>
                <span data-when="open">Hide advanced settings</span>
              </summary>
              <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>Advanced settings</h2>
              <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                These three groups shape the recommendation and all of them have working defaults,
                so a new pool can skip them.
              </p>
              <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-3)", marginTop: "var(--c97-sp-2)" }}>
                <section className={SECTION} aria-label="Standing and risk">
                  <h3 className="c97-serif c97-h3">Your standing and how much risk to take</h3>
                  <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                    The gap to whoever sits nearest above and below you, against the games remaining,
                    sets how much risk the recommendation takes. Auto works that out from these numbers,
                    and protect and chase force it. A new pool starts on auto with no gaps entered. My
                    points is a number you type in, and the tracker does not update it.
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-1)" }}>
                    <NumberSetting
                      label="My points"
                      value={pool.standing.myPoints}
                      onChange={(value) =>
                        patch((current) => ({
                          ...current,
                          standing: { ...current.standing, myPoints: value ?? 0 },
                        }))
                      }
                    />
                    <NumberSetting
                      label="Nearest above (points)"
                      value={pool.standing.nearestAbovePoints}
                      allowEmpty
                      hint="Leave empty when you lead the pool."
                      onChange={(value) =>
                        patch((current) => ({
                          ...current,
                          standing: { ...current.standing, nearestAbovePoints: value },
                        }))
                      }
                    />
                    <NumberSetting
                      label="Nearest below (points)"
                      value={pool.standing.nearestBelowPoints}
                      allowEmpty
                      hint="Leave empty when you're last."
                      onChange={(value) =>
                        patch((current) => ({
                          ...current,
                          standing: { ...current.standing, nearestBelowPoints: value },
                        }))
                      }
                    />
                    <NumberSetting
                      label="Pool size"
                      value={pool.standing.poolSize}
                      min={2}
                      onChange={(value) =>
                        patch((current) => ({
                          ...current,
                          standing: { ...current.standing, poolSize: Math.max(2, Math.round(value ?? 2)) },
                        }))
                      }
                    />
                    <NumberSetting
                      label="Games remaining"
                      value={pool.standing.gamesRemaining}
                      min={0}
                      onChange={(value) =>
                        patch((current) => ({
                          ...current,
                          standing: {
                            ...current.standing,
                            gamesRemaining: Math.max(0, Math.round(value ?? 0)),
                          },
                        }))
                      }
                    />
                    <SelectSetting<Posture>
                      label="Risk approach"
                      value={pool.standing.posture}
                      options={[
                        { value: "auto", label: "Auto (from the gaps)" },
                        { value: "protect", label: "Protect the lead" },
                        { value: "chase", label: "Chase" },
                        { value: "neutral", label: "Neutral (most expected points)" },
                      ]}
                      onChange={(posture) =>
                        patch((current) => ({
                          ...current,
                          standing: { ...current.standing, posture },
                        }))
                      }
                    />
                  </div>
                </section>

                <section className={SECTION} aria-label="Rest of the pool">
                  <h3 className="c97-serif c97-h3">What the rest of the pool picks</h3>
                  <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                    An estimate of what everyone else in the pool submits, which is mostly the favorite
                    at its single most likely score. It is a rule of thumb, and these shares were not
                    measured from a real pool. Rival picks you enter in the tracker score the rival table only
                    and do not change this estimate.
                  </p>
                  <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-1)" }}>
                    <NumberSetting
                      label="Share on the single most likely score"
                      value={pool.field.modalShare}
                      min={0.05}
                      max={0.9}
                      step={0.05}
                      hint="0.30 means about a third of the pool lands on the single obvious score."
                      onChange={(value) =>
                        patch((current) => ({
                          ...current,
                          field: { ...current.field, modalShare: value ?? 0.3 },
                        }))
                      }
                    />
                    <NumberSetting
                      label="Total share on the few obvious scores"
                      value={pool.field.chalkShare}
                      min={0.1}
                      max={0.95}
                      step={0.05}
                      hint="0.65 means about two thirds of the pool lands on one of a few obvious scores, the one above included."
                      onChange={(value) =>
                        patch((current) => ({
                          ...current,
                          field: { ...current.field, chalkShare: value ?? 0.65 },
                        }))
                      }
                    />
                  </div>
                </section>

                <section className={SECTION} aria-label="Odds conversion">
                  <h3 className="c97-serif c97-h3">How the odds become probabilities</h3>
                  <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-1)" }}>
                    <SelectSetting<DevigMethod>
                      label="Bookmaker margin removal"
                      value={pool.devigMethod}
                      options={[
                        { value: "proportional", label: "Proportional (standard)" },
                        { value: "power", label: "Power (accounts for long shots being overpriced)" },
                      ]}
                      onChange={(devigMethod) => patch((current) => ({ ...current, devigMethod }))}
                      hint="Bookmaker odds add up to more than 100% because of the bookmaker's margin. This sets how that margin is taken out, which the match detail calls the de-vig."
                    />
                  </div>
                </section>
              </div>
            </details>

            <section className={SECTION} aria-label="Data status">
              <h2 className="c97-serif c97-h2">Data status</h2>
              <div className="scroll-shadow-x overflow-x-auto" style={{ marginTop: "var(--c97-sp-1)" }} role="region" aria-label="League data status (scrollable)" tabIndex={0}>
                <table className="c97-table" aria-label="Snapshot status per league">
                  <thead>
                    <tr>
                      <th scope="col">League</th>
                      <th scope="col">Refreshed</th>
                      <th scope="col">Fixtures</th>
                      <th scope="col" className="hidden sm:table-cell">Sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.leagues.map((league) => (
                      <tr key={league.key}>
                        <td className="font-semibold">
                          {league.name}
                          {league.sample ? (
                            <span className="text-3xs uppercase text-[var(--c97-ink-2)]" style={{ marginLeft: "var(--c97-sp-0)" }}>sample</span>
                          ) : null}
                        </td>
                        <td className="text-2xs text-[var(--c97-ink-2)]">
                          {formatAge(league.generatedAt, nowIso)}
                        </td>
                        <td className="font-mono">
                          {league.fixtures.length}
                        </td>
                        <td className="hidden text-2xs text-[var(--c97-ink-2)] sm:table-cell">
                          {league.sources.fixtures} / {league.sources.odds}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                The fixtures and odds come from a snapshot I set up to refresh every six hours once
                the live data feeds are connected, and until then it stays as it was built, so the
                Refreshed column above is where to check how current each league is. Every price
                change per game is kept, which is what lets the match detail show how the line
                moved.
              </p>
            </section>

            <section className={SECTION} aria-label="Delete pool">
              <h2 className="c97-serif c97-h2">Delete this pool</h2>
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                Removes the pool, its picks, rivals, flags, and hand-entered odds from this
                browser. There is no undo.
              </p>
              <div className="flex" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                {!confirmDelete ? (
                  <button type="button" className={PILL_BUTTON} onClick={() => setConfirmDelete(true)}>
                    Delete pool…
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={PILL_BUTTON}
                      onClick={() => {
                        removePool(pool.id);
                        setConfirmDelete(false);
                        setStatus(`Deleted ${pool.name} and its saved data.`);
                      }}
                    >
                      Yes, delete {pool.name}
                    </button>
                    <button type="button" className={PILL_BUTTON} onClick={() => setConfirmDelete(false)}>
                      Keep it
                    </button>
                  </>
                )}
              </div>
            </section>
          </>
        ) : (
          <p className="text-sm text-[var(--c97-ink-2)]">
            No pool selected. Add one above and its settings show up here.
          </p>
        )}
      </div>
    </section>
  );
}
