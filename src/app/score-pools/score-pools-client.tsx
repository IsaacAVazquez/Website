"use client";

// The pick sheet: one row per match in the selected round with the
// recommended exact score, confidence, expected points, the safer and
// differentiator alternatives, the reason, and the lock time — plus the
// copyable submission table underneath and the per-match detail drawer.

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useScorePools } from "@/hooks/useScorePools";
import { analyzePoolFixtures, type PoolFixtureAnalysis } from "@/lib/scorePools/poolAnalysis";
import type { Scoreline } from "@/lib/scorePools";
import type { ScorePoolsSnapshot, SnapshotFixture } from "@/types/scorePools";
import { FixtureDetailDrawer } from "./fixture-detail-drawer";
import {
  CHIP_BUTTON,
  ConfidenceChip,
  EpMeter,
  LockBadge,
  PILL_BUTTON,
  chipStyle,
  formatAge,
  formatKickoff,
  formatPoints,
  formatScoreline,
} from "./score-pools-ui";

interface ScorePoolsClientProps {
  snapshot: ScorePoolsSnapshot;
  initialFixtureId: string | null;
}

interface RoundGroup {
  label: string;
  fixtures: SnapshotFixture[];
  firstKickoff: string;
  hasOpenGames: boolean;
}

function groupRounds(fixtures: SnapshotFixture[]): RoundGroup[] {
  const groups = new Map<string, SnapshotFixture[]>();
  for (const fixture of fixtures) {
    const label = fixture.stage ?? fixture.round ?? "Fixtures";
    const list = groups.get(label) ?? [];
    list.push(fixture);
    groups.set(label, list);
  }
  return Array.from(groups.entries())
    .map(([label, list]) => ({
      label,
      fixtures: list.sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
      firstKickoff: list.reduce(
        (min, fixture) => (fixture.kickoff < min ? fixture.kickoff : min),
        list[0].kickoff,
      ),
      hasOpenGames: list.some((fixture) => fixture.status === "scheduled"),
    }))
    .sort((a, b) => a.firstKickoff.localeCompare(b.firstKickoff));
}

export function ScorePoolsClient({ snapshot, initialFixtureId }: ScorePoolsClientProps) {
  const {
    pools,
    activePool,
    addPool,
    setActivePool,
    setSubmission,
    setSubmissions,
    clearSubmission,
    setFixtureFlags,
    setManualOdds,
  } = useScorePools();

  // A stable "now" per visit keeps the analysis, staleness, and lock states
  // consistent across the page; a reload refreshes it.
  const [now] = useState(() => new Date().toISOString());
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [openFixtureId, setOpenFixtureId] = useState<string | null>(initialFixtureId);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [newPoolLeague, setNewPoolLeague] = useState(snapshot.leagues[0]?.key ?? "");
  const [newPoolName, setNewPoolName] = useState("");

  const league = activePool
    ? (snapshot.leagues.find((entry) => entry.key === activePool.leagueKey) ?? null)
    : null;

  const rounds = useMemo(() => (league ? groupRounds(league.fixtures) : []), [league]);
  const defaultRound = useMemo(() => {
    const open = rounds.find((round) => round.hasOpenGames);
    return (open ?? rounds[rounds.length - 1])?.label ?? null;
  }, [rounds]);
  const activeRoundLabel = selectedRound ?? defaultRound;
  const activeRound = rounds.find((round) => round.label === activeRoundLabel) ?? null;

  const upcoming = useMemo(
    () => (activeRound ? activeRound.fixtures.filter((fixture) => fixture.status !== "finished") : []),
    [activeRound],
  );
  const played = useMemo(
    () => (activeRound ? activeRound.fixtures.filter((fixture) => fixture.status === "finished") : []),
    [activeRound],
  );

  const analysisResult = useMemo(() => {
    if (!activePool || !league) return { analyzed: [] as PoolFixtureAnalysis[], missingOdds: [] as SnapshotFixture[] };
    return analyzePoolFixtures(upcoming, league, activePool, now);
  }, [activePool, league, upcoming, now]);

  const syncDrawerUrl = useCallback((fixtureId: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (fixtureId) url.searchParams.set("fixture", fixtureId);
    else url.searchParams.delete("fixture");
    window.history.replaceState(null, "", url.toString());
  }, []);

  const openDrawer = useCallback(
    (fixtureId: string) => {
      setOpenFixtureId(fixtureId);
      syncDrawerUrl(fixtureId);
    },
    [syncDrawerUrl],
  );
  const closeDrawer = useCallback(() => {
    setOpenFixtureId(null);
    syncDrawerUrl(null);
  }, [syncDrawerUrl]);

  const resetStatuses = useCallback(() => {
    setCopyStatus("idle");
    setSaveStatus("idle");
  }, []);

  const myPickFor = useCallback(
    (item: PoolFixtureAnalysis): { score: Scoreline; overridden: boolean } => {
      const stored = activePool?.submissions[item.fixture.id]?.score;
      if (stored) return { score: stored, overridden: true };
      return { score: item.analysis.recommendation.recommended.score, overridden: false };
    },
    [activePool],
  );

  const submissionRows = analysisResult.analyzed.map((item) => {
    const pick = myPickFor(item);
    return {
      fixtureId: item.fixture.id,
      label: `${item.fixture.homeTeam} vs ${item.fixture.awayTeam}`,
      score: pick.score,
      overridden: pick.overridden,
    };
  });

  const copySubmission = async () => {
    const text = submissionRows
      .map((row) => `${row.label}\t${formatScoreline(row.score)}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  const savePicks = () => {
    if (!activePool) return;
    setSubmissions(
      activePool.id,
      submissionRows.map((row) => ({ fixtureId: row.fixtureId, score: row.score })),
      now,
    );
    setSaveStatus("saved");
  };

  const openItem =
    openFixtureId !== null
      ? (analysisResult.analyzed.find((item) => item.fixture.id === openFixtureId) ?? null)
      : null;
  const openMissingFixture =
    openFixtureId !== null && !openItem && league
      ? (league.fixtures.find((fixture) => fixture.id === openFixtureId) ?? null)
      : null;

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-shell-wide home-section space-y-6">
        <header>
          <p className="home-kicker mb-1">Prediction Tools</p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--home-ink)] sm:text-3xl">
            Score{" "}
            <em style={{ fontFamily: "var(--font-home-serif)", fontStyle: "italic", fontWeight: 400 }}>
              Pools
            </em>
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--home-ink-muted)]">
            I run exact-score prediction pools, and this is the engine I used to work by hand: it
            de-vigs the market, fits a scoreline distribution anchored to the moneyline and the
            total, and ranks every pick by expected points under my pool&apos;s actual rules,
            adjusted for where I sit on the leaderboard. It&apos;s a decision aid built on market
            prices, so it carries the market&apos;s uncertainty rather than beating it.
          </p>
          <p className="mt-2 text-2xs text-[var(--home-ink-muted)]">
            Data as of {formatAge(snapshot.generatedAt, now)} · picks recompute whenever the
            snapshot, the odds, or your settings change ·{" "}
            <Link className="underline decoration-[var(--home-rule)] underline-offset-4 hover:decoration-[var(--home-signal)]" href="/score-pools/tracker">
              tracker
            </Link>{" "}
            ·{" "}
            <Link className="underline decoration-[var(--home-rule)] underline-offset-4 hover:decoration-[var(--home-signal)]" href="/score-pools/settings">
              settings
            </Link>
          </p>
        </header>

        {pools.length === 0 || !activePool ? (
          <section className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-5 shadow-[var(--shadow-sm)]" aria-label="Create your first pool">
            <h2 className="text-lg font-bold text-[var(--home-ink)]">Set up your first pool</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--home-ink-muted)]">
              A pool is a league plus your scoring rules and your standing. Everything stays in
              this browser; nothing gets an account.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="block text-1xs font-semibold text-[var(--home-ink)]">
                League
                <select
                  value={newPoolLeague}
                  onChange={(event) => setNewPoolLeague(event.target.value)}
                  className="mt-1 block min-h-[44px] rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                >
                  {snapshot.leagues.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.name}
                      {entry.sample ? " (sample data)" : ""} · {entry.fixtures.length} fixtures
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-1xs font-semibold text-[var(--home-ink)]">
                Pool name
                <input
                  type="text"
                  value={newPoolName}
                  onChange={(event) => setNewPoolName(event.target.value)}
                  placeholder="Office pool"
                  className="mt-1 block min-h-[44px] rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
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
                Create pool
              </button>
            </div>
          </section>
        ) : (
          <>
            <nav className="flex flex-wrap items-center gap-2" aria-label="Pools and rounds">
              {pools.map((pool) => (
                <button
                  key={pool.id}
                  type="button"
                  aria-pressed={pool.id === activePool.id}
                  className={CHIP_BUTTON}
                  style={chipStyle(pool.id === activePool.id)}
                  onClick={() => {
                    setActivePool(pool.id);
                    resetStatuses();
                  }}
                >
                  {pool.name}
                </button>
              ))}
              <span className="mx-1 hidden h-5 w-px bg-[var(--home-rule)] sm:inline-block" aria-hidden="true" />
              {rounds.map((round) => (
                <button
                  key={round.label}
                  type="button"
                  aria-pressed={round.label === activeRoundLabel}
                  className={CHIP_BUTTON}
                  style={chipStyle(round.label === activeRoundLabel)}
                  onClick={() => {
                    setSelectedRound(round.label);
                    resetStatuses();
                  }}
                >
                  {round.label}
                </button>
              ))}
            </nav>

            {league?.sample ? (
              <p className="rounded-xl border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-3 text-2xs text-[var(--home-ink-muted)]">
                This league is sample data with fictional teams and hand-set odds, so you can try
                the whole flow before wiring up a real competition. Swap in a live league from the
                settings page when you&apos;re ready.
              </p>
            ) : null}
            {league && league.notes.length > 0 && !league.sample ? (
              <div className="space-y-1">
                {league.notes.map((note) => (
                  <p key={note} className="text-2xs text-[var(--home-ink-muted)]">{note}</p>
                ))}
              </div>
            ) : null}

            {!league ? (
              <p className="text-sm text-[var(--home-ink-muted)]">
                This pool points at a league that isn&apos;t in the snapshot anymore. Pick a
                different league in{" "}
                <Link className="underline" href="/score-pools/settings">settings</Link>.
              </p>
            ) : null}

            {/* The pick sheet */}
            {analysisResult.analyzed.length > 0 ? (
              <section aria-label="Pick sheet">
                <h2 className="text-lg font-bold text-[var(--home-ink)]">Pick sheet</h2>
                <div
                  className="scroll-shadow-x mt-3 overflow-x-auto"
                  role="region"
                  aria-label="Pick sheet (scrollable)"
                  tabIndex={0}
                >
                  <table className="min-w-full border-separate border-spacing-y-2" aria-label="Recommended picks for the current round">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                        <th scope="col" className="px-3 py-2 font-semibold">Match</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Pick</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Exp pts</th>
                        <th scope="col" className="hidden px-3 py-2 font-semibold sm:table-cell">Confidence</th>
                        <th scope="col" className="hidden px-3 py-2 font-semibold md:table-cell">Higher floor</th>
                        <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">Differentiator</th>
                        <th scope="col" className="hidden px-3 py-2 font-semibold xl:table-cell">Why</th>
                        <th scope="col" className="px-3 py-2 font-semibold"><span className="sr-only">Detail</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.analyzed.map((item) => {
                        const rec = item.analysis.recommendation;
                        const pick = myPickFor(item);
                        const locked = now >= item.analysis.locksAt;
                        const topEp = rec.candidates[0]?.expectedPoints ?? rec.recommended.expectedPoints;
                        return (
                          <tr key={item.fixture.id} className="rounded-xl bg-[var(--home-paper-raised)] text-sm text-[var(--home-ink)] shadow-[var(--shadow-sm)]">
                            <td className="rounded-l-xl border-y border-l border-[var(--home-rule)] px-3 py-3">
                              <p className="font-semibold">
                                {item.fixture.homeTeam} vs {item.fixture.awayTeam}
                              </p>
                              <p className="mt-0.5 text-2xs text-[var(--home-ink-muted)]">
                                {formatKickoff(item.fixture.kickoff, activePool.timezone)} · locks{" "}
                                {formatKickoff(item.analysis.locksAt, activePool.timezone)}{" "}
                                <LockBadge locked={locked} />
                              </p>
                            </td>
                            <td className="border-y border-[var(--home-rule)] px-3 py-3">
                              <span className="font-mono text-base font-bold">{formatScoreline(pick.score)}</span>
                              {pick.overridden ? (
                                <span className="ml-1.5 align-middle text-3xs font-semibold uppercase tracking-[0.1em] text-[var(--home-ink-muted)]" title="You set this pick yourself">
                                  mine
                                </span>
                              ) : null}
                            </td>
                            <td className="border-y border-[var(--home-rule)] px-3 py-3">
                              <EpMeter value={rec.recommended.expectedPoints} max={topEp} />
                            </td>
                            <td className="hidden border-y border-[var(--home-rule)] px-3 py-3 sm:table-cell">
                              <ConfidenceChip level={rec.confidence.level} />
                            </td>
                            <td className="hidden border-y border-[var(--home-rule)] px-3 py-3 md:table-cell">
                              <span className="font-mono font-semibold">{formatScoreline(rec.safest.score)}</span>{" "}
                              <span className="text-2xs text-[var(--home-ink-muted)]">
                                {formatPoints(rec.safest.expectedPoints)}
                              </span>
                            </td>
                            <td className="hidden border-y border-[var(--home-rule)] px-3 py-3 lg:table-cell">
                              {rec.differentiator ? (
                                <>
                                  <span className="font-mono font-semibold">{formatScoreline(rec.differentiator.score)}</span>{" "}
                                  <span className="text-2xs text-[var(--home-ink-muted)]">
                                    {formatPoints(rec.differentiator.expectedPoints)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[var(--home-ink-muted)]">—</span>
                              )}
                            </td>
                            <td className="hidden max-w-md border-y border-[var(--home-rule)] px-3 py-3 xl:table-cell">
                              <p className="text-2xs leading-relaxed text-[var(--home-ink-muted)]">{rec.reason}</p>
                            </td>
                            <td className="rounded-r-xl border-y border-r border-[var(--home-rule)] px-3 py-3">
                              <button
                                type="button"
                                className={PILL_BUTTON}
                                onClick={() => openDrawer(item.fixture.id)}
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : league && upcoming.length === 0 ? (
              <p className="text-sm text-[var(--home-ink-muted)]">
                Nothing left to pick in this round. The played games are below, and the tracker has
                the running score.
              </p>
            ) : null}

            {analysisResult.missingOdds.length > 0 ? (
              <section aria-label="Games without odds">
                <h2 className="text-base font-bold text-[var(--home-ink)]">Waiting on odds</h2>
                <ul className="mt-2 space-y-2">
                  {analysisResult.missingOdds.map((fixture) => (
                    <li key={fixture.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-3 text-sm text-[var(--home-ink)]">
                      <span>
                        {fixture.homeTeam} vs {fixture.awayTeam}
                        <span className="ml-2 text-2xs text-[var(--home-ink-muted)]">
                          {formatKickoff(fixture.kickoff, activePool.timezone)} · no odds yet
                        </span>
                      </span>
                      <button type="button" className={PILL_BUTTON} onClick={() => openDrawer(fixture.id)}>
                        Enter odds
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Copyable submission table */}
            {submissionRows.length > 0 ? (
              <section aria-label="Submission table">
                <h2 className="text-lg font-bold text-[var(--home-ink)]">Submission</h2>
                <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                  Just the match and the score, ready to paste into the pool. Rows marked mine are
                  picks you set yourself; the rest follow the recommendation.
                </p>
                <div className="mt-3 max-w-xl overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] shadow-[var(--shadow-sm)]">
                  <table className="min-w-full font-mono text-sm" aria-label="Copyable submission: match and score">
                    <thead>
                      <tr className="border-b border-[var(--home-rule)] text-left text-3xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                        <th scope="col" className="px-4 py-2 font-semibold">Match</th>
                        <th scope="col" className="px-4 py-2 font-semibold">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionRows.map((row) => (
                        <tr key={row.fixtureId} className="border-b border-[var(--home-rule)] last:border-b-0">
                          <td className="px-4 py-2 text-[var(--home-ink)]">
                            {row.label}
                            {row.overridden ? (
                              <span className="ml-1.5 text-3xs uppercase text-[var(--home-ink-muted)]">mine</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-2 font-bold tabular-nums text-[var(--home-ink)]">
                            {formatScoreline(row.score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button type="button" className={PILL_BUTTON} onClick={copySubmission}>
                    Copy submission
                  </button>
                  <button type="button" className={PILL_BUTTON} onClick={savePicks}>
                    Save these as my picks
                  </button>
                  <span className="text-2xs text-[var(--home-ink-muted)]" role="status">
                    {copyStatus === "copied"
                      ? "Copied to the clipboard."
                      : copyStatus === "error"
                        ? "Clipboard blocked; select the table and copy it directly."
                        : saveStatus === "saved"
                          ? "Saved. The tracker scores these as results come in."
                          : ""}
                  </span>
                </div>
              </section>
            ) : null}

            {/* Played games in this round */}
            {played.length > 0 && activePool ? (
              <section aria-label="Played games">
                <h2 className="text-base font-bold text-[var(--home-ink)]">Played</h2>
                <ul className="mt-2 space-y-2">
                  {played.map((fixture) => {
                    const submission = activePool.submissions[fixture.id];
                    return (
                      <li key={fixture.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-3 text-sm text-[var(--home-ink)]">
                        <span className="font-semibold">
                          {fixture.homeTeam} vs {fixture.awayTeam}
                        </span>
                        {fixture.result ? (
                          <span className="font-mono tabular-nums">
                            {formatScoreline(fixture.result.ninetyMinutes)}
                            {fixture.result.afterExtraTime
                              ? ` (aet ${formatScoreline(fixture.result.afterExtraTime)})`
                              : ""}
                            {fixture.result.penaltyWinner
                              ? ` · pens: ${fixture.result.penaltyWinner === "home" ? fixture.homeTeam : fixture.awayTeam}`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-2xs text-[var(--home-ink-muted)]">result pending</span>
                        )}
                        {submission ? (
                          <span className="text-2xs text-[var(--home-ink-muted)]">
                            my pick {formatScoreline(submission.score)} · scored in the{" "}
                            <Link className="underline" href="/score-pools/tracker">tracker</Link>
                          </span>
                        ) : (
                          <span className="text-2xs text-[var(--home-ink-muted)]">
                            no pick recorded
                          </span>
                        )}
                        <button
                          type="button"
                          className={PILL_BUTTON}
                          onClick={() => openDrawer(fixture.id)}
                        >
                          Detail
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </>
        )}

        <p className="border-t border-[var(--home-rule)] pt-4 text-3xs leading-relaxed text-[var(--home-ink-muted)]">
          This is a decision aid for prediction pools, not betting advice. The scorelines come from
          a market-calibrated model with real uncertainty; on any single game the modal pick is
          still probably wrong, and the edge only shows up across a lot of picks.
        </p>
      </div>

      {activePool && (openItem || openMissingFixture) ? (
        <FixtureDetailDrawer
          key={openFixtureId}
          fixture={openItem?.fixture ?? (openMissingFixture as SnapshotFixture)}
          analysis={openItem?.analysis ?? null}
          pool={activePool}
          now={now}
          myPick={activePool.submissions[openFixtureId as string]?.score ?? null}
          onClose={closeDrawer}
          onSetPick={(fixtureId, score) => setSubmission(activePool.id, fixtureId, score, now)}
          onClearPick={(fixtureId) => clearSubmission(activePool.id, fixtureId)}
          onSetFlags={(fixtureId, flags) => setFixtureFlags(activePool.id, fixtureId, flags)}
          onSaveManualOdds={(fixtureId, odds) => setManualOdds(activePool.id, fixtureId, odds)}
        />
      ) : null}
    </div>
  );
}
