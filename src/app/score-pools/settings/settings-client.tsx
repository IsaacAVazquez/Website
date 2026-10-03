"use client";

// Pool settings: the scoring rules (including the 90-minute vs final-result
// basis that changes the whole scoring path), my standing and posture, the
// field model, rivals, and per-league data provenance.

import { useState } from "react";
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
            The scoring rules drive the whole optimization, and the standing drives the risk
            posture, so this page is where the recommendations actually get their shape. Back to
            the{" "}
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
          <div className="flex flex-wrap items-end" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
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
              type="button"
              className={PILL_BUTTON}
              onClick={() => {
                if (!newPoolLeague) return;
                addPool(newPoolLeague, newPoolName.trim() || "My pool");
                setNewPoolName("");
              }}
            >
              Add pool
            </button>
          </div>
        </section>

        {pool ? (
          <>
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
                <SelectSetting<DevigMethod>
                  label="De-vig method"
                  value={pool.devigMethod}
                  options={[
                    { value: "proportional", label: "Proportional (standard)" },
                    { value: "power", label: "Power (favorite-longshot aware)" },
                  ]}
                  onChange={(devigMethod) => patch((current) => ({ ...current, devigMethod }))}
                  hint="How the bookmaker margin gets stripped from the odds."
                />
              </div>
            </section>

            <section className={SECTION} aria-label="Scoring rules">
              <h2 className="c97-serif c97-h2">Scoring rules</h2>
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                The basis flag matters most in knockouts, since under 90-minute scoring a game that
                finishes 1-1 and goes to penalties scores as a 1-1 draw, and under final-result
                scoring your pick compares against the score after extra time.
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

            <section className={SECTION} aria-label="Standing and posture">
              <h2 className="c97-serif c97-h2">Standing and posture</h2>
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                The gap to whoever sits nearest above and below, against the games remaining, sets
                how much variance the recommendation courts. Auto derives it; protect and chase
                force it.
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
                  label="Posture"
                  value={pool.standing.posture}
                  options={[
                    { value: "auto", label: "Auto (derive from the gaps)" },
                    { value: "protect", label: "Protect the lead" },
                    { value: "chase", label: "Chase" },
                    { value: "neutral", label: "Neutral (pure expected points)" },
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

            <section className={SECTION} aria-label="Field model">
              <h2 className="c97-serif c97-h2">Field model</h2>
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                A heuristic for what the rest of the pool submits, which is mostly the favorite with
                the modal scoreline. Rival picks you enter in the tracker score the rival table only and
                do not change this model.
              </p>
              <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-1)" }}>
                <NumberSetting
                  label="Share on the modal chalk pick"
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
                  label="Total share on chalk picks"
                  value={pool.field.chalkShare}
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  onChange={(value) =>
                    patch((current) => ({
                      ...current,
                      field: { ...current.field, chalkShare: value ?? 0.65 },
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
                      onClick={() => removeRival(pool.id, rival.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-end" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                <label className="block">
                  <span className={FIELD_LABEL}>New rival</span>
                  <input
                    type="text"
                    value={newRivalName}
                    onChange={(event) => setNewRivalName(event.target.value)}
                    placeholder="Dana"
                    className={FIELD_INPUT}
                    style={{ marginTop: "var(--c97-sp-1)" }}
                  />
                </label>
                <button
                  type="button"
                  className={PILL_BUTTON}
                  onClick={() => {
                    if (!newRivalName.trim()) return;
                    addRival(pool.id, newRivalName.trim());
                    setNewRivalName("");
                  }}
                >
                  Add rival
                </button>
              </div>
            </section>

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
