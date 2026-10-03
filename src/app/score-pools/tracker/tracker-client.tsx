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
import { PILL_BUTTON, SampleDataNotice, formatKickoff, formatScoreline } from "../score-pools-ui";

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
      <input
        type="number"
        min={0}
        max={15}
        inputMode="numeric"
        value={value.home}
        onChange={(event) => set({ ...value, home: event.target.value })}
        className="min-h-[44px] w-14 border border-[var(--c97-rule)] bg-[var(--c97-surface)] px-2 py-1 text-center text-sm text-[var(--c97-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c97-accent)]"
        aria-label={`${label} home goals`}
      />
      <span className="text-[var(--c97-ink-2)]">-</span>
      <input
        type="number"
        min={0}
        max={15}
        inputMode="numeric"
        value={value.away}
        onChange={(event) => set({ ...value, away: event.target.value })}
        className="min-h-[44px] w-14 border border-[var(--c97-rule)] bg-[var(--c97-surface)] px-2 py-1 text-center text-sm text-[var(--c97-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c97-accent)]"
        aria-label={`${label} away goals`}
      />
    </span>
  );

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-[var(--c97-ink-2)]">
      <span className="font-semibold text-[var(--c97-ink)]">Enter result:</span>
      90&apos; {scoreInput(ninety, setNinety, "Ninety minute")}
      {fixture.knockout ? (
        <>
          aet {scoreInput(et, setEt, "After extra time")}
          <label className="flex items-center gap-1.5">
            pens
            <select
              value={pens}
              onChange={(event) => setPens(event.target.value as "" | "home" | "away")}
              className="min-h-[44px] border border-[var(--c97-rule)] bg-[var(--c97-surface)] px-2 py-1 text-sm text-[var(--c97-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c97-accent)]"
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
        <span role="alert" className="font-semibold" style={{ color: "var(--c97-negative)" }}>
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
  const [rivalPickErrors, setRivalPickErrors] = useState<Record<string, string>>({});
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
    <section className="c97-band min-h-dvh" data-c97-surface="paper">
      <div className="c97-shell space-y-6">
        <header>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Prediction Tools</p>
          <h1 className="c97-display">
            Score{" "}
            <em style={{ fontFamily: "var(--c97-font-display)", fontStyle: "italic", fontWeight: 400 }}>
              Tracker
            </em>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--c97-ink-2)]">
            Submitted picks scored against results under your pool&apos;s rules as games finish,
            with a running total and rival comparisons where you know their picks. Back to the{" "}
            <Link className="c97-link" href="/score-pools">
              pick sheet
            </Link>{" "}
            or the{" "}
            <Link className="c97-link" href="/score-pools/settings">
              settings
            </Link>
            .
          </p>
        </header>

        <SampleDataNotice snapshot={snapshot} />

        {!activePool || !league ? (
          <p className="text-sm text-[var(--c97-ink-2)]">
            No pool yet. Create one on the{" "}
            <Link className="c97-link" href="/score-pools">pick sheet</Link> first.
          </p>
        ) : (
          <>
            {pools.length > 1 ? (
              <nav className="c97-segmented" style={{ marginBottom: "var(--c97-sp-3)" }} aria-label="Pools">
                {pools.map((pool) => (
                  <button
                    key={pool.id}
                    type="button"
                    aria-pressed={pool.id === activePool.id}
                    className="min-h-[44px] text-sm font-semibold"
                    onClick={() => setActivePool(pool.id)}
                  >
                    {pool.name}
                  </button>
                ))}
              </nav>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-3" aria-label="Totals">
              <div className="c97-stat" style={{ background: "var(--c97-panel)", padding: "var(--c97-sp-3)" }}>
                <p className="c97-stat-label">Tracked points</p>
                <p className="c97-stat-value c97-mono">{myScoring?.total ?? 0}</p>
                <p className="c97-stat-delta">
                  from {myScoring?.rows.filter((row) => row.score).length ?? 0} scored picks
                </p>
              </div>
              <div className="c97-stat" style={{ background: "var(--c97-panel)", padding: "var(--c97-sp-3)" }}>
                <p className="c97-stat-label">Standing (settings)</p>
                <p className="c97-stat-value c97-mono">{activePool.standing.myPoints}</p>
                <p className="c97-stat-delta">what the leaderboard layer plans around</p>
              </div>
              <div className="c97-stat" style={{ background: "var(--c97-panel)", padding: "var(--c97-sp-3)" }}>
                <p className="c97-stat-label">Rules</p>
                <p className="c97-stat-value c97-mono">
                  {activePool.rules.exact}/{activePool.rules.correctDifference}/{activePool.rules.correctOutcome}
                </p>
                <p className="c97-stat-delta">
                  scored on the{" "}
                  {activePool.rules.basis === "ninetyMinutes" ? "90-minute" : "final"} result
                </p>
              </div>
            </section>

            {myScoring && myScoring.rows.length > 0 ? (
              <section aria-label="My scored picks">
                <h2 className="c97-serif c97-h2">My picks</h2>
                <div className="scroll-shadow-x mt-3 overflow-x-auto" role="region" aria-label="My scored picks (scrollable)" tabIndex={0}>
                  <table className="min-w-full border-separate border-spacing-y-2" aria-label="My picks scored against results">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--c97-label)]">
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
                          <tr key={row.fixture.id} className="bg-[var(--c97-panel)] text-sm text-[var(--c97-ink)]">
                            <td className="border-y border-l border-[var(--c97-rule)] px-3 py-2.5">
                              <p className="font-semibold">
                                {row.fixture.homeTeam} vs {row.fixture.awayTeam}
                              </p>
                              <p className="text-2xs text-[var(--c97-ink-2)]">
                                {formatKickoff(row.fixture.kickoff, activePool.timezone)}
                              </p>
                            </td>
                            <td className="border-y border-[var(--c97-rule)] px-3 py-2.5 font-mono font-bold tabular-nums">
                              {formatScoreline(row.pick)}
                            </td>
                            <td className="border-y border-[var(--c97-rule)] px-3 py-2.5 font-mono tabular-nums">
                              {row.result ? (
                                <>
                                  {formatScoreline(row.result.ninetyMinutes)}
                                  {row.result.afterExtraTime
                                    ? ` (aet ${formatScoreline(row.result.afterExtraTime)})`
                                    : ""}
                                  {row.result.penaltyWinner ? " p" : ""}
                                  {activePool.manualResults[row.fixture.id] && !row.fixture.result ? (
                                    <span className="mt-1 flex items-center gap-2 font-sans">
                                      <span className="c97-chip">manual</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setManualResult(activePool.id, row.fixture.id, null)
                                        }
                                        className="inline-flex min-h-[44px] items-center text-2xs font-semibold text-[var(--c97-accent)] hover:underline"
                                      >
                                        Clear
                                      </button>
                                    </span>
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-2xs text-[var(--c97-ink-2)]">pending</span>
                              )}
                            </td>
                            <td className="hidden border-y border-[var(--c97-rule)] px-3 py-2.5 text-2xs text-[var(--c97-ink-2)] sm:table-cell">
                              {row.score ? COMPONENT_LABELS[row.score.component] : "—"}
                            </td>
                            <td className="border-y border-[var(--c97-rule)] px-3 py-2.5 font-mono font-bold tabular-nums">
                              {row.score ? row.score.points : "—"}
                            </td>
                            <td className="hidden border-y border-r border-[var(--c97-rule)] px-3 py-2.5 font-mono tabular-nums sm:table-cell">
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
              <p className="text-sm text-[var(--c97-ink-2)]">
                No saved picks yet. Save a submission from the pick sheet and it lands here.
              </p>
            )}

            {needsResult.length > 0 ? (
              <section aria-label="Missing results">
                <h2 className="c97-serif c97-h2">Missing results</h2>
                <p className="mt-1 text-2xs text-[var(--c97-ink-2)]">
                  These games have picks but no result from the data feed. Enter the result by hand
                  and the scoring uses it until a feed result shows up.
                </p>
                <ul className="mt-2 space-y-3">
                  {needsResult.map((fixture) => (
                    <li key={fixture.id} className="border border-[var(--c97-rule)] bg-[var(--c97-panel)] px-4 py-3 text-sm text-[var(--c97-ink)]">
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
              <h2 className="c97-serif c97-h2">Rivals</h2>
              {activePool.rivals.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--c97-ink-2)]">
                  Add rivals on the{" "}
                  <Link className="c97-link" href="/score-pools/settings">settings page</Link>{" "}
                  and enter their picks here to see the gaps game by game.
                </p>
              ) : (
                <>
                  <div className="scroll-shadow-x mt-3 overflow-x-auto" role="region" aria-label="Rival totals (scrollable)" tabIndex={0}>
                    <table className="min-w-full border-separate border-spacing-y-2" aria-label="Rival totals">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--c97-label)]">
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
                          // My banked points count too, the same way a rival's adjustment does.
                          const myTotal = (myScoring?.total ?? 0) + activePool.standing.myPoints;
                          const gap = total - myTotal;
                          return (
                            <tr key={rival.id} className="bg-[var(--c97-panel)] text-sm text-[var(--c97-ink)]">
                              <td className="border-y border-l border-[var(--c97-rule)] px-3 py-2.5 font-semibold">{rival.name}</td>
                              <td className="border-y border-[var(--c97-rule)] px-3 py-2.5 font-mono tabular-nums">{scoring.total}</td>
                              <td className="border-y border-[var(--c97-rule)] px-3 py-2.5 font-mono tabular-nums">{rival.pointsAdjustment}</td>
                              <td className="border-y border-[var(--c97-rule)] px-3 py-2.5 font-mono font-bold tabular-nums">{total}</td>
                              <td className="border-y border-r border-[var(--c97-rule)] px-3 py-2.5 font-mono tabular-nums">
                                {gap > 0 ? `+${gap} on me` : gap < 0 ? `${-gap} behind` : "level"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4">
                    <h3 className="c97-serif c97-h3">Enter rival picks</h3>
                    <div className="c97-segmented" style={{ marginTop: "var(--c97-sp-1)" }}>
                      {activePool.rivals.map((rival) => (
                        <button
                          key={rival.id}
                          type="button"
                          aria-pressed={rival.id === selectedRivalId}
                          className="min-h-[44px] text-sm font-semibold"
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
                            <li key={fixture.id} className="flex flex-wrap items-center gap-3 border border-[var(--c97-rule)] bg-[var(--c97-panel)] px-4 py-2.5 text-sm text-[var(--c97-ink)]">
                              <span className="min-w-48 font-semibold">
                                {fixture.homeTeam} vs {fixture.awayTeam}
                              </span>
                              <span className="font-mono text-2xs text-[var(--c97-ink-2)]">
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
                                  className="min-h-[44px] w-14 border border-[var(--c97-rule)] bg-[var(--c97-surface)] px-2 py-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c97-accent)]"
                                  aria-label={`${selectedRival.name} pick, ${fixture.homeTeam} goals`}
                                />
                                <span className="text-[var(--c97-ink-2)]">-</span>
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
                                  className="min-h-[44px] w-14 border border-[var(--c97-rule)] bg-[var(--c97-surface)] px-2 py-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c97-accent)]"
                                  aria-label={`${selectedRival.name} pick, ${fixture.awayTeam} goals`}
                                />
                                <button
                                  type="button"
                                  className={PILL_BUTTON}
                                  onClick={() => {
                                    const score = parseScoreInput(draft.home, draft.away);
                                    if (!score) {
                                      setRivalPickErrors((errors) => ({
                                        ...errors,
                                        [fixture.id]: "Both scores need whole numbers from 0 to 15.",
                                      }));
                                      return;
                                    }
                                    setRivalPickErrors((errors) => ({ ...errors, [fixture.id]: "" }));
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
                                {existing ? (
                                  <button
                                    type="button"
                                    className={PILL_BUTTON}
                                    onClick={() => {
                                      updateRival(activePool.id, selectedRival.id, (rival) => {
                                        const picks = { ...rival.picks };
                                        delete picks[fixture.id];
                                        return { ...rival, picks };
                                      });
                                      setRivalPickDrafts((drafts) => ({
                                        ...drafts,
                                        [fixture.id]: { home: "", away: "" },
                                      }));
                                    }}
                                  >
                                    Clear
                                  </button>
                                ) : null}
                              </span>
                              {rivalPickErrors[fixture.id] ? (
                                <span role="alert" className="text-2xs font-semibold" style={{ color: "var(--c97-negative)" }}>
                                  {rivalPickErrors[fixture.id]}
                                </span>
                              ) : null}
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
    </section>
  );
}
