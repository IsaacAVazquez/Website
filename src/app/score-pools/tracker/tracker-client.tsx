"use client";

// The running score tracker: my submitted picks scored against results
// under the pool's rules as games finish, a cumulative total, rival
// comparisons when their picks are known, and manual result entry for
// games no provider covers.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useScorePools } from "@/hooks/useScorePools";
import { effectiveResult, scoreParticipantPicks } from "@/lib/scorePools/poolAnalysis";
import type { Scoreline } from "@/lib/scorePools";
import type { ScorePoolsSnapshot, SnapshotFixture } from "@/types/scorePools";
import {
  CHIP_BUTTON,
  PILL_BUTTON,
  chipStyle,
  formatKickoff,
  formatScoreline,
} from "../score-pools-ui";

interface TrackerClientProps {
  snapshot: ScorePoolsSnapshot;
}

const COMPONENT_LABELS: Record<string, string> = {
  exact: "exact score",
  difference: "winner and difference",
  outcome: "outcome only",
  none: "no points",
};

function parseScoreInput(home: string, away: string): Scoreline | null {
  const h = Number.parseInt(home, 10);
  const a = Number.parseInt(away, 10);
  if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 15 || a > 15) {
    return null;
  }
  return { home: h, away: a };
}

function ManualResultForm({
  fixture,
  onSave,
}: {
  fixture: SnapshotFixture;
  onSave: (result: { ninetyMinutes: Scoreline; afterExtraTime: Scoreline | null; penaltyWinner: "home" | "away" | null }) => void;
}) {
  const [ninety, setNinety] = useState({ home: "", away: "" });
  const [et, setEt] = useState({ home: "", away: "" });
  const [pens, setPens] = useState<"" | "home" | "away">("");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const ninetyScore = parseScoreInput(ninety.home, ninety.away);
    if (!ninetyScore) {
      setError("The 90-minute score needs two whole numbers.");
      return;
    }
    const etScore =
      et.home.trim() !== "" || et.away.trim() !== "" ? parseScoreInput(et.home, et.away) : null;
    if ((et.home.trim() !== "" || et.away.trim() !== "") && !etScore) {
      setError("The extra-time score needs two whole numbers, or leave both empty.");
      return;
    }
    setError(null);
    onSave({
      ninetyMinutes: ninetyScore,
      afterExtraTime: etScore,
      penaltyWinner: pens === "" ? null : pens,
    });
  };

  const scoreInput = (
    value: { home: string; away: string },
    set: (next: { home: string; away: string }) => void,
    label: string,
  ) => (
    <span className="flex items-center gap-1.5">
      <label className="sr-only">{`${label} home goals`}</label>
      <input
        type="number"
        min={0}
        max={15}
        inputMode="numeric"
        value={value.home}
        onChange={(event) => set({ ...value, home: event.target.value })}
        className="min-h-[44px] w-14 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-1 text-center text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
        aria-label={`${label} home goals`}
      />
      <span className="text-[var(--home-ink-muted)]">-</span>
      <input
        type="number"
        min={0}
        max={15}
        inputMode="numeric"
        value={value.away}
        onChange={(event) => set({ ...value, away: event.target.value })}
        className="min-h-[44px] w-14 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-1 text-center text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
        aria-label={`${label} away goals`}
      />
    </span>
  );

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-[var(--home-ink-muted)]">
      <span className="font-semibold text-[var(--home-ink)]">Enter result:</span>
      90&apos; {scoreInput(ninety, setNinety, "Ninety minute")}
      {fixture.knockout ? (
        <>
          aet {scoreInput(et, setEt, "After extra time")}
          <label className="flex items-center gap-1.5">
            pens
            <select
              value={pens}
              onChange={(event) => setPens(event.target.value as "" | "home" | "away")}
              className="min-h-[44px] rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-1 text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
            >
              <option value="">none</option>
              <option value="home">{fixture.homeTeam}</option>
              <option value="away">{fixture.awayTeam}</option>
            </select>
          </label>
        </>
      ) : null}
      <button type="button" className={PILL_BUTTON} onClick={save}>
        Save result
      </button>
      {error ? (
        <span className="font-semibold" style={{ color: "var(--home-negative)" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function TrackerClient({ snapshot }: TrackerClientProps) {
  const { pools, activePool, setActivePool, setManualResult, updateRival } = useScorePools();
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);
  const [rivalPickDrafts, setRivalPickDrafts] = useState<Record<string, { home: string; away: string }>>({});
  // One "now" per visit keeps render pure and the pending/played split stable.
  const [nowIso] = useState(() => new Date().toISOString());

  const league = activePool
    ? (snapshot.leagues.find((entry) => entry.key === activePool.leagueKey) ?? null)
    : null;

  const myScoring = useMemo(() => {
    if (!activePool || !league) return null;
    const scoring = scoreParticipantPicks(
      league,
      activePool,
      Object.fromEntries(
        Object.entries(activePool.submissions).map(([fixtureId, submission]) => [
          fixtureId,
          submission.score,
        ]),
      ),
    );
    // Precompute the running total so the table render stays pure.
    let running = 0;
    const rows = scoring.rows.map((row) => {
      if (row.score) running += row.score.points;
      return { ...row, running: row.score ? running : null };
    });
    return { total: scoring.total, rows };
  }, [activePool, league]);

  const rivalScoring = useMemo(() => {
    if (!activePool || !league) return [];
    return activePool.rivals.map((rival) => ({
      rival,
      scoring: scoreParticipantPicks(league, activePool, rival.picks),
    }));
  }, [activePool, league]);

  const needsResult = useMemo(() => {
    if (!activePool || !league) return [];
    const nowMs = new Date(nowIso).getTime();
    return league.fixtures.filter(
      (fixture) =>
        !effectiveResult(fixture, activePool) &&
        (fixture.status === "finished" || new Date(fixture.kickoff).getTime() < nowMs) &&
        activePool.submissions[fixture.id],
    );
  }, [activePool, league, nowIso]);

  const selectedRival = activePool?.rivals.find((rival) => rival.id === selectedRivalId) ?? null;

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section space-y-6">
        <header>
          <p className="home-kicker mb-1">Prediction Tools</p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
            Score{" "}
            <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 400 }}>
              Tracker
            </em>
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--home-ink-muted)]">
            Submitted picks scored against results under your pool&apos;s rules as games finish,
            with a running total and rival comparisons where you know their picks. Back to the{" "}
            <Link className="underline decoration-[var(--home-rule)] underline-offset-4 hover:decoration-[var(--home-signal)]" href="/score-pools">
              pick sheet
            </Link>{" "}
            or the{" "}
            <Link className="underline decoration-[var(--home-rule)] underline-offset-4 hover:decoration-[var(--home-signal)]" href="/score-pools/settings">
              settings
            </Link>
            .
          </p>
        </header>

        {!activePool || !league ? (
          <p className="text-sm text-[var(--home-ink-muted)]">
            No pool yet. Create one on the{" "}
            <Link className="underline" href="/score-pools">pick sheet</Link> first.
          </p>
        ) : (
          <>
            {pools.length > 1 ? (
              <nav className="flex flex-wrap gap-2" aria-label="Pools">
                {pools.map((pool) => (
                  <button
                    key={pool.id}
                    type="button"
                    aria-pressed={pool.id === activePool.id}
                    className={CHIP_BUTTON}
                    style={chipStyle(pool.id === activePool.id)}
                    onClick={() => setActivePool(pool.id)}
                  >
                    {pool.name}
                  </button>
                ))}
              </nav>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-3" aria-label="Totals">
              <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-4 shadow-[var(--shadow-sm)]">
                <p className="text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                  Tracked points
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-[var(--home-ink)]">
                  {myScoring?.total ?? 0}
                </p>
                <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                  from {myScoring?.rows.filter((row) => row.score).length ?? 0} scored picks
                </p>
              </div>
              <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-4 shadow-[var(--shadow-sm)]">
                <p className="text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                  Standing (settings)
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-[var(--home-ink)]">
                  {activePool.standing.myPoints}
                </p>
                <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                  what the leaderboard layer plans around
                </p>
              </div>
              <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-4 shadow-[var(--shadow-sm)]">
                <p className="text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                  Rules
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-[var(--home-ink)]">
                  {activePool.rules.exact}/{activePool.rules.correctDifference}/{activePool.rules.correctOutcome}
                </p>
                <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                  scored on the{" "}
                  {activePool.rules.basis === "ninetyMinutes" ? "90-minute" : "final"} result
                </p>
              </div>
            </section>

            {myScoring && myScoring.rows.length > 0 ? (
              <section aria-label="My scored picks">
                <h2 className="text-lg font-bold text-[var(--home-ink)]">My picks</h2>
                <div className="scroll-shadow-x mt-3 overflow-x-auto" role="region" aria-label="My scored picks (scrollable)" tabIndex={0}>
                  <table className="min-w-full border-separate border-spacing-y-2" aria-label="My picks scored against results">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                        <th scope="col" className="px-3 py-2 font-semibold">Match</th>
                        <th scope="col" className="px-3 py-2 font-semibold">My pick</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Result</th>
                        <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">How it scored</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Pts</th>
                        <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Running</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myScoring.rows.map((row) => {
                        return (
                          <tr key={row.fixture.id} className="bg-[var(--home-paper-raised)] text-sm text-[var(--home-ink)] shadow-[var(--shadow-sm)]">
                            <td className="rounded-l-xl border-y border-l border-[var(--home-rule)] px-3 py-2.5">
                              <p className="font-semibold">
                                {row.fixture.homeTeam} vs {row.fixture.awayTeam}
                              </p>
                              <p className="text-2xs text-[var(--home-ink-muted)]">
                                {formatKickoff(row.fixture.kickoff, activePool.timezone)}
                              </p>
                            </td>
                            <td className="border-y border-[var(--home-rule)] px-3 py-2.5 font-mono font-bold tabular-nums">
                              {formatScoreline(row.pick)}
                            </td>
                            <td className="border-y border-[var(--home-rule)] px-3 py-2.5 font-mono tabular-nums">
                              {row.result ? (
                                <>
                                  {formatScoreline(row.result.ninetyMinutes)}
                                  {row.result.afterExtraTime
                                    ? ` (aet ${formatScoreline(row.result.afterExtraTime)})`
                                    : ""}
                                  {row.result.penaltyWinner ? " p" : ""}
                                </>
                              ) : (
                                <span className="text-2xs text-[var(--home-ink-muted)]">pending</span>
                              )}
                            </td>
                            <td className="hidden border-y border-[var(--home-rule)] px-3 py-2.5 text-2xs text-[var(--home-ink-muted)] sm:table-cell">
                              {row.score ? COMPONENT_LABELS[row.score.component] : "—"}
                            </td>
                            <td className="border-y border-[var(--home-rule)] px-3 py-2.5 font-mono font-bold tabular-nums">
                              {row.score ? row.score.points : "—"}
                            </td>
                            <td className="hidden rounded-r-xl border-y border-r border-[var(--home-rule)] px-3 py-2.5 font-mono tabular-nums sm:table-cell">
                              {row.running ?? ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <p className="text-sm text-[var(--home-ink-muted)]">
                No saved picks yet. Save a submission from the pick sheet and it lands here.
              </p>
            )}

            {needsResult.length > 0 ? (
              <section aria-label="Missing results">
                <h2 className="text-base font-bold text-[var(--home-ink)]">Missing results</h2>
                <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                  These games have picks but no result from the data feed. Enter the result by hand
                  and the scoring uses it until a feed result shows up.
                </p>
                <ul className="mt-2 space-y-3">
                  {needsResult.map((fixture) => (
                    <li key={fixture.id} className="rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-3 text-sm text-[var(--home-ink)]">
                      <p className="font-semibold">
                        {fixture.homeTeam} vs {fixture.awayTeam}
                      </p>
                      <ManualResultForm
                        fixture={fixture}
                        onSave={(result) => setManualResult(activePool.id, fixture.id, result)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-label="Rivals">
              <h2 className="text-lg font-bold text-[var(--home-ink)]">Rivals</h2>
              {activePool.rivals.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
                  Add rivals on the{" "}
                  <Link className="underline" href="/score-pools/settings">settings page</Link>{" "}
                  and enter their picks here to see the gaps game by game.
                </p>
              ) : (
                <>
                  <div className="scroll-shadow-x mt-3 overflow-x-auto" role="region" aria-label="Rival totals (scrollable)" tabIndex={0}>
                    <table className="min-w-full border-separate border-spacing-y-2" aria-label="Rival totals">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                          <th scope="col" className="px-3 py-2 font-semibold">Rival</th>
                          <th scope="col" className="px-3 py-2 font-semibold">Tracked</th>
                          <th scope="col" className="px-3 py-2 font-semibold">Adjustment</th>
                          <th scope="col" className="px-3 py-2 font-semibold">Total</th>
                          <th scope="col" className="px-3 py-2 font-semibold">Gap to me</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rivalScoring.map(({ rival, scoring }) => {
                          const total = scoring.total + rival.pointsAdjustment;
                          const myTotal = (myScoring?.total ?? 0);
                          const gap = total - myTotal;
                          return (
                            <tr key={rival.id} className="bg-[var(--home-paper-raised)] text-sm text-[var(--home-ink)] shadow-[var(--shadow-sm)]">
                              <td className="rounded-l-xl border-y border-l border-[var(--home-rule)] px-3 py-2.5 font-semibold">{rival.name}</td>
                              <td className="border-y border-[var(--home-rule)] px-3 py-2.5 font-mono tabular-nums">{scoring.total}</td>
                              <td className="border-y border-[var(--home-rule)] px-3 py-2.5 font-mono tabular-nums">{rival.pointsAdjustment}</td>
                              <td className="border-y border-[var(--home-rule)] px-3 py-2.5 font-mono font-bold tabular-nums">{total}</td>
                              <td className="rounded-r-xl border-y border-r border-[var(--home-rule)] px-3 py-2.5 font-mono tabular-nums">
                                {gap > 0 ? `+${gap} on me` : gap < 0 ? `${-gap} behind` : "level"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-[var(--home-ink)]">Enter rival picks</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activePool.rivals.map((rival) => (
                        <button
                          key={rival.id}
                          type="button"
                          aria-pressed={rival.id === selectedRivalId}
                          className={CHIP_BUTTON}
                          style={chipStyle(rival.id === selectedRivalId)}
                          onClick={() =>
                            setSelectedRivalId(rival.id === selectedRivalId ? null : rival.id)
                          }
                        >
                          {rival.name}
                        </button>
                      ))}
                    </div>
                    {selectedRival ? (
                      <ul className="mt-3 space-y-2">
                        {league.fixtures.map((fixture) => {
                          const existing = selectedRival.picks[fixture.id];
                          const draft = rivalPickDrafts[fixture.id] ?? { home: "", away: "" };
                          return (
                            <li key={fixture.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-2.5 text-sm text-[var(--home-ink)]">
                              <span className="min-w-48 font-semibold">
                                {fixture.homeTeam} vs {fixture.awayTeam}
                              </span>
                              <span className="font-mono text-2xs text-[var(--home-ink-muted)]">
                                {existing ? `saved ${formatScoreline(existing)}` : "no pick saved"}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={15}
                                  inputMode="numeric"
                                  value={draft.home}
                                  onChange={(event) =>
                                    setRivalPickDrafts((drafts) => ({
                                      ...drafts,
                                      [fixture.id]: { ...draft, home: event.target.value },
                                    }))
                                  }
                                  className="min-h-[44px] w-14 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                                  aria-label={`${selectedRival.name} pick, ${fixture.homeTeam} goals`}
                                />
                                <span className="text-[var(--home-ink-muted)]">-</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={15}
                                  inputMode="numeric"
                                  value={draft.away}
                                  onChange={(event) =>
                                    setRivalPickDrafts((drafts) => ({
                                      ...drafts,
                                      [fixture.id]: { ...draft, away: event.target.value },
                                    }))
                                  }
                                  className="min-h-[44px] w-14 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                                  aria-label={`${selectedRival.name} pick, ${fixture.awayTeam} goals`}
                                />
                                <button
                                  type="button"
                                  className={PILL_BUTTON}
                                  onClick={() => {
                                    const score = parseScoreInput(draft.home, draft.away);
                                    if (!score) return;
                                    updateRival(activePool.id, selectedRival.id, (rival) => ({
                                      ...rival,
                                      picks: { ...rival.picks, [fixture.id]: score },
                                    }));
                                    setRivalPickDrafts((drafts) => ({
                                      ...drafts,
                                      [fixture.id]: { home: "", away: "" },
                                    }));
                                  }}
                                >
                                  Save
                                </button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
