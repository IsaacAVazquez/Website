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
  CHIP_BUTTON,
  FIELD_HINT,
  FIELD_INPUT,
  FIELD_LABEL,
  PILL_BUTTON,
  chipStyle,
  formatAge,
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

const SECTION = "rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 shadow-[var(--shadow-sm)]";

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
  return (
    <label className={FIELD_LABEL}>
      {label}
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") {
            onChange(allowEmpty ? null : 0);
            return;
          }
          const parsed = Number.parseFloat(raw);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        className={FIELD_INPUT}
      />
      {hint ? <span className={FIELD_HINT}>{hint}</span> : null}
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
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <label className={FIELD_LABEL}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={FIELD_INPUT}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <span className={FIELD_HINT}>{hint}</span> : null}
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
  const [newPoolLeague, setNewPoolLeague] = useState(snapshot.leagues[0]?.key ?? "");
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
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-6">
        <header>
          <p className="home-kicker mb-1">Prediction Tools</p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
            Pool{" "}
            <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 400 }}>
              Settings
            </em>
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--home-ink-muted)]">
            The scoring rules drive the whole optimization, and the standing drives the risk
            posture, so this page is where the recommendations actually get their shape. Back to
            the{" "}
            <Link className="underline decoration-[var(--home-rule)] underline-offset-4 hover:decoration-[var(--home-signal)]" href="/score-pools">
              pick sheet
            </Link>
            .
          </p>
        </header>

        <section className={SECTION} aria-label="Pools">
          <h2 className="text-lg font-bold text-[var(--home-ink)]">Pools</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {pools.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === pool?.id}
                className={CHIP_BUTTON}
                style={chipStyle(entry.id === pool?.id)}
                onClick={() => {
                  setActivePool(entry.id);
                  setConfirmDelete(false);
                }}
              >
                {entry.name}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className={FIELD_LABEL}>
              League
              <select
                value={newPoolLeague}
                onChange={(event) => setNewPoolLeague(event.target.value)}
                className={FIELD_INPUT}
              >
                {snapshot.leagues.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.name}
                    {entry.sample ? " (sample data)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className={FIELD_LABEL}>
              Name
              <input
                type="text"
                value={newPoolName}
                onChange={(event) => setNewPoolName(event.target.value)}
                placeholder="Office pool"
                className={FIELD_INPUT}
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
              <h2 className="text-lg font-bold text-[var(--home-ink)]">
                {pool.name}
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className={FIELD_LABEL}>
                  Pool name
                  <input
                    type="text"
                    value={pool.name}
                    onChange={(event) => patch((current) => ({ ...current, name: event.target.value }))}
                    className={FIELD_INPUT}
                  />
                </label>
                <SelectSetting
                  label="League"
                  value={pool.leagueKey}
                  options={snapshot.leagues.map((entry) => ({
                    value: entry.key,
                    label: `${entry.name}${entry.sample ? " (sample data)" : ""}`,
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
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Scoring rules</h2>
              <p className="mt-1 max-w-2xl text-2xs text-[var(--home-ink-muted)]">
                The basis flag matters most in knockouts: under 90-minute scoring a game that
                finishes 1-1 and goes to penalties scores as a 1-1 draw, and under final-result
                scoring your pick compares against the score after extra time.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberSetting
                  label="Exact score points"
                  value={pool.rules.exact}
                  min={0}
                  max={100}
                  onChange={(value) =>
                    patch((current) => ({
                      ...current,
                      rules: { ...current.rules, exact: value ?? 0 },
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
                      rules: { ...current.rules, correctDifference: value ?? 0 },
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
                      rules: { ...current.rules, correctOutcome: value ?? 0 },
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
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2 self-end rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2">
                  <input
                    type="checkbox"
                    checked={pool.rules.penaltiesCountAsWin}
                    onChange={(event) =>
                      patch((current) => ({
                        ...current,
                        rules: { ...current.rules, penaltiesCountAsWin: event.target.checked },
                      }))
                    }
                    className="h-4 w-4 accent-[var(--home-signal)]"
                  />
                  <span className="text-xs font-semibold text-[var(--home-ink)]">
                    Shootout winner counts as the winner
                  </span>
                </label>
              </div>
            </section>

            <section className={SECTION} aria-label="Standing and posture">
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Standing and posture</h2>
              <p className="mt-1 max-w-2xl text-2xs text-[var(--home-ink-muted)]">
                The gap to whoever sits nearest above and below, against the games remaining, sets
                how much variance the recommendation courts. Auto derives it; protect and chase
                force it.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Field model</h2>
              <p className="mt-1 max-w-2xl text-2xs text-[var(--home-ink-muted)]">
                A heuristic for what the rest of the pool submits: mostly the favorite with the
                modal scoreline. Rival picks you enter in the tracker replace it wholesale for the
                gap math.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Rivals</h2>
              <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                The people you&apos;re actually racing. Their picks go in on the tracker page; the
                adjustment covers points they banked before you started tracking.
              </p>
              <ul className="mt-3 space-y-2">
                {pool.rivals.map((rival) => (
                  <li key={rival.id} className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 py-3">
                    <label className={FIELD_LABEL}>
                      Name
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
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className={FIELD_LABEL}>
                  New rival
                  <input
                    type="text"
                    value={newRivalName}
                    onChange={(event) => setNewRivalName(event.target.value)}
                    placeholder="Dana"
                    className={FIELD_INPUT}
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
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Data status</h2>
              <div className="scroll-shadow-x mt-3 overflow-x-auto" role="region" aria-label="League data status (scrollable)" tabIndex={0}>
                <table className="min-w-full border-separate border-spacing-y-2" aria-label="Snapshot status per league">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                      <th scope="col" className="px-3 py-2 font-semibold">League</th>
                      <th scope="col" className="px-3 py-2 font-semibold">Refreshed</th>
                      <th scope="col" className="px-3 py-2 font-semibold">Fixtures</th>
                      <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.leagues.map((league) => (
                      <tr key={league.key} className="bg-[var(--home-paper)] text-sm text-[var(--home-ink)]">
                        <td className="rounded-l-xl border-y border-l border-[var(--home-rule)] px-3 py-2.5 font-semibold">
                          {league.name}
                          {league.sample ? (
                            <span className="ml-1.5 text-3xs uppercase text-[var(--home-ink-muted)]">sample</span>
                          ) : null}
                        </td>
                        <td className="border-y border-[var(--home-rule)] px-3 py-2.5 text-2xs text-[var(--home-ink-muted)]">
                          {formatAge(league.generatedAt, nowIso)}
                        </td>
                        <td className="border-y border-[var(--home-rule)] px-3 py-2.5 font-mono tabular-nums">
                          {league.fixtures.length}
                        </td>
                        <td className="hidden rounded-r-xl border-y border-r border-[var(--home-rule)] px-3 py-2.5 text-2xs text-[var(--home-ink-muted)] sm:table-cell">
                          {league.sources.fixtures} / {league.sources.odds}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-2xs text-[var(--home-ink-muted)]">
                The snapshot refreshes on a schedule (every six hours) and with{" "}
                <code className="font-mono">npm run update:score-pools</code>. Odds history keeps
                every price change per game, so line movement stays visible in the match detail.
              </p>
            </section>

            <section className={SECTION} aria-label="Delete pool">
              <h2 className="text-base font-bold text-[var(--home-ink)]">Delete this pool</h2>
              <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                Removes the pool, its picks, rivals, flags, and hand-entered odds from this
                browser. There is no undo.
              </p>
              <div className="mt-2 flex gap-2">
                {!confirmDelete ? (
                  <button type="button" className={PILL_BUTTON} onClick={() => setConfirmDelete(true)}>
                    Delete pool…
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={PILL_BUTTON}
                      style={{ borderColor: "var(--home-negative)", color: "var(--home-negative)" }}
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
          <p className="text-sm text-[var(--home-ink-muted)]">
            No pool selected. Add one above and its settings show up here.
          </p>
        )}
      </div>
    </div>
  );
}
