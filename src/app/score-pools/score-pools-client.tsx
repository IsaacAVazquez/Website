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
import { DEFAULT_SCORING_RULES } from "@/lib/scorePools/defaults";
import type { ScorePoolsSnapshot, SnapshotFixture } from "@/types/scorePools";
import { FixtureDetailDrawer } from "./fixture-detail-drawer";
import {
  ConfidenceChip,
  EpMeter,
  LockBadge,
  PILL_BUTTON,
  SAMPLE_NOTICE,
  SAMPLE_NOTICE_STYLE,
  SampleDataNotice,
  formatAge,
  formatKickoff,
  formatPoints,
  formatScoreline,
  leagueOptionLabel,
} from "./score-pools-ui";
import { groupBy } from "@/lib/utils";

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
  const groups = groupBy(fixtures, (fixture) => fixture.stage ?? fixture.round ?? "Fixtures");
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
  // Default to the first league that has fixtures; the first entry can be empty.
  const [newPoolLeague, setNewPoolLeague] = useState(
    snapshot.leagues.find((entry) => entry.fixtures.length > 0)?.key ?? "",
  );
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
    <section className="c97-band min-h-dvh" data-c97-surface="paper">
      <div className="flex flex-col c97-shell" style={{ rowGap: "var(--c97-sp-3)" }}>
        <header>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Prediction tools</p>
          <h1 className="c97-display">
            Score{" "}
            <em style={{ fontFamily: "var(--c97-font-display)", fontStyle: "italic", fontWeight: 400 }}>
              Pools
            </em>
          </h1>
          <p className="text-sm leading-relaxed text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
            I run exact-score prediction pools, and this does the work I used to do by hand. It
            suggests the exact score that should earn the most points under my pool&apos;s own
            rules and my place in the standings. It&apos;s a decision aid built on betting-market
            prices, so it carries the market&apos;s uncertainty, and each match&apos;s Detail shows
            the working.
          </p>
          <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
            Data as of {formatAge(snapshot.generatedAt, now)} · picks recompute whenever the
            snapshot, the odds, or your settings change ·{" "}
            <Link className="c97-link" href="/score-pools/tracker">
              tracker
            </Link>{" "}
            ·{" "}
            <Link className="c97-link" href="/score-pools/settings">
              settings
            </Link>
          </p>
        </header>

        <SampleDataNotice snapshot={snapshot} />

        {pools.length === 0 || !activePool ? (
          <section className="bg-[var(--c97-panel)]" style={{ padding: "var(--c97-sp-2)" }} aria-label="Create your first pool">
            <h2 className="c97-serif c97-h2">Set up your first pool</h2>
            <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
              A pool is a league plus your scoring rules and your standing. Everything stays in
              this browser; nothing gets an account.
            </p>
            <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
              A new pool starts at {DEFAULT_SCORING_RULES.exact} points for the exact score,{" "}
              {DEFAULT_SCORING_RULES.correctDifference} for the right winner and goal difference, and{" "}
              {DEFAULT_SCORING_RULES.correctOutcome} for the right winner or draw only, and you can
              change those to match your pool in settings.
            </p>
            <div className="flex flex-wrap items-end" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
              <label className="block">
                <span className="c97-kicker">League</span>
                <select
                  value={newPoolLeague}
                  onChange={(event) => setNewPoolLeague(event.target.value)}
                  className="c97-field"
                  style={{ marginTop: "var(--c97-sp-1)" }}
                >
                  {snapshot.leagues.map((entry) => (
                    <option key={entry.key} value={entry.key} disabled={entry.fixtures.length === 0}>
                      {leagueOptionLabel(entry)}
                      {entry.fixtures.length > 0 ? ` · ${entry.fixtures.length} fixtures` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="c97-kicker">Pool name</span>
                <input
                  type="text"
                  value={newPoolName}
                  onChange={(event) => setNewPoolName(event.target.value)}
                  placeholder="Office pool"
                  className="c97-field"
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
                Create pool
              </button>
            </div>
          </section>
        ) : (
          <>
            <nav className="c97-segmented items-center" style={{ marginBottom: "var(--c97-sp-3)" }} aria-label="Pools and rounds">
              {pools.map((pool) => (
                <button
                  key={pool.id}
                  type="button"
                  aria-pressed={pool.id === activePool.id}
                  className="min-h-[44px] text-sm font-semibold"
                  onClick={() => {
                    setActivePool(pool.id);
                    resetStatuses();
                  }}
                >
                  {pool.name}
                </button>
              ))}
              <span className="hidden h-5 w-px bg-[var(--c97-rule)] sm:inline-block" style={{ marginInline: "var(--c97-sp-0)" }} aria-hidden="true" />
              {rounds.map((round) => (
                <button
                  key={round.label}
                  type="button"
                  aria-pressed={round.label === activeRoundLabel}
                  className="min-h-[44px] text-sm font-semibold"
                  onClick={() => {
                    setSelectedRound(round.label);
                    resetStatuses();
                  }}
                >
                  {round.label}
                </button>
              ))}
            </nav>

            <p className="text-sm text-[var(--c97-ink-2)]">
              {activePool.name} scores {activePool.rules.exact} points for the exact score,{" "}
              {activePool.rules.correctDifference} for the right winner and goal difference, and{" "}
              {activePool.rules.correctOutcome} for the right winner or draw only, counted on the{" "}
              {activePool.rules.basis === "ninetyMinutes" ? "90-minute result" : "final result after extra time"}.{" "}
              <Link className="c97-link" href="/score-pools/settings">Change the scoring</Link>
            </p>

            {league?.sample ? (
              <p className={SAMPLE_NOTICE} style={SAMPLE_NOTICE_STYLE}>
                This league is sample data with fictional teams and hand-set odds, so you can try
                the whole flow before wiring up a real competition.
                {snapshot.leagues.some((entry) => !entry.sample && entry.fixtures.length > 0)
                  ? " Swap in a live league from the settings page when you're ready."
                  : null}
              </p>
            ) : null}
            {league && league.notes.length > 0 && !league.sample ? (
              <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-0)" }}>
                {league.notes.map((note) => (
                  <p key={note} className="text-2xs text-[var(--c97-ink-2)]">{note}</p>
                ))}
              </div>
            ) : null}

            {!league ? (
              <p className="text-sm text-[var(--c97-ink-2)]">
                This pool points at a league that isn&apos;t in the snapshot anymore. Pick a
                different league in{" "}
                <Link className="c97-link" href="/score-pools/settings">settings</Link>.
              </p>
            ) : null}

            {/* The pick sheet */}
            {analysisResult.analyzed.length > 0 ? (
              <section aria-label="Pick sheet">
                <h2 className="c97-serif c97-h2">Pick sheet</h2>
                <div
                  className="scroll-shadow-x overflow-x-auto" style={{ marginTop: "var(--c97-sp-1)" }}
                  role="region"
                  aria-label="Pick sheet (scrollable)"
                  tabIndex={0}
                >
                  <table className="c97-table" aria-label="Recommended picks for the current round">
                    <thead>
                      <tr>
                        <th scope="col">Match</th>
                        <th scope="col">Pick</th>
                        <th scope="col">Exp pts</th>
                        <th scope="col" className="hidden sm:table-cell">Confidence</th>
                        <th scope="col" className="hidden md:table-cell">Higher floor</th>
                        <th scope="col" className="hidden lg:table-cell">Differentiator</th>
                        <th scope="col" className="hidden xl:table-cell">Why</th>
                        <th scope="col"><span className="sr-only">Detail</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.analyzed.map((item) => {
                        const rec = item.analysis.recommendation;
                        const pick = myPickFor(item);
                        const locked = now >= item.analysis.locksAt;
                        const topEp = rec.candidates[0]?.expectedPoints ?? rec.recommended.expectedPoints;
                        return (
                          <tr key={item.fixture.id}>
                            <td>
                              <p className="font-semibold">
                                {item.fixture.homeTeam} vs {item.fixture.awayTeam}
                              </p>
                              <p className="mt-0.5 text-2xs text-[var(--c97-ink-2)]">
                                {formatKickoff(item.fixture.kickoff, activePool.timezone)} · locks{" "}
                                {formatKickoff(item.analysis.locksAt, activePool.timezone)}{" "}
                                <LockBadge locked={locked} />
                              </p>
                            </td>
                            <td>
                              <span className="font-mono text-base font-bold">{formatScoreline(pick.score)}</span>
                              {pick.overridden ? (
                                <span className="align-middle text-3xs font-semibold uppercase tracking-[0.1em] text-[var(--c97-ink-2)]" style={{ marginLeft: "var(--c97-sp-0)" }} title="You set this pick yourself">
                                  mine
                                </span>
                              ) : null}
                            </td>
                            <td>
                              <EpMeter value={rec.recommended.expectedPoints} max={topEp} />
                            </td>
                            <td className="hidden sm:table-cell">
                              <ConfidenceChip level={rec.confidence.level} />
                            </td>
                            <td className="hidden md:table-cell">
                              <span className="font-mono font-semibold">{formatScoreline(rec.safest.score)}</span>{" "}
                              <span className="c97-tabular text-2xs text-[var(--c97-ink-2)]">
                                {formatPoints(rec.safest.expectedPoints)}
                              </span>
                            </td>
                            <td className="hidden lg:table-cell">
                              {rec.differentiator ? (
                                <>
                                  <span className="font-mono font-semibold">{formatScoreline(rec.differentiator.score)}</span>{" "}
                                  <span className="c97-tabular text-2xs text-[var(--c97-ink-2)]">
                                    {formatPoints(rec.differentiator.expectedPoints)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[var(--c97-ink-2)]">—</span>
                              )}
                            </td>
                            <td className="hidden max-w-md xl:table-cell">
                              <p className="text-2xs leading-relaxed text-[var(--c97-ink-2)]">{rec.reason}</p>
                            </td>
                            <td>
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
              <p className="text-sm text-[var(--c97-ink-2)]">
                Nothing left to pick in this round. The played games are below, and the tracker has
                the running score.
              </p>
            ) : null}

            {analysisResult.missingOdds.length > 0 ? (
              <section aria-label="Games without odds">
                <h2 className="c97-serif c97-h2">Waiting on odds</h2>
                <ul className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                  {analysisResult.missingOdds.map((fixture) => (
                    <li key={fixture.id} className="flex flex-wrap items-center justify-between border border-[var(--c97-rule)] bg-[var(--c97-panel)] text-sm text-[var(--c97-ink)]" style={{ gap: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}>
                      <span>
                        {fixture.homeTeam} vs {fixture.awayTeam}
                        <span className="text-2xs text-[var(--c97-ink-2)]" style={{ marginLeft: "var(--c97-sp-1)" }}>
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
                <h2 className="c97-serif c97-h2">Submission</h2>
                <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                  Just the match and the score, ready to paste into the pool. Rows marked mine are
                  picks you set yourself; the rest follow the recommendation.
                </p>
                <div className="max-w-xl overflow-x-auto" style={{ marginTop: "var(--c97-sp-1)" }} role="region" aria-label="Submission (scrollable)" tabIndex={0}>
                  <table className="c97-table font-mono" aria-label="Copyable submission: match and score">
                    <thead>
                      <tr>
                        <th scope="col">Match</th>
                        <th scope="col">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionRows.map((row) => (
                        <tr key={row.fixtureId}>
                          <td>
                            {row.label}
                            {row.overridden ? (
                              <span className="text-3xs uppercase text-[var(--c97-ink-2)]" style={{ marginLeft: "var(--c97-sp-0)" }}>mine</span>
                            ) : null}
                          </td>
                          <td className="font-bold">
                            {formatScoreline(row.score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                  <button type="button" className={PILL_BUTTON} onClick={copySubmission}>
                    Copy submission
                  </button>
                  <button type="button" className={PILL_BUTTON} onClick={savePicks}>
                    Save these as my picks
                  </button>
                  <span className="text-2xs text-[var(--c97-ink-2)]" role="status">
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
                <h2 className="c97-serif c97-h2">Played</h2>
                <ul className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                  {played.map((fixture) => {
                    const submission = activePool.submissions[fixture.id];
                    return (
                      <li key={fixture.id} className="flex flex-wrap items-center border border-[var(--c97-rule)] bg-[var(--c97-panel)] text-sm text-[var(--c97-ink)]" style={{ gap: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}>
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
                          <span className="text-2xs text-[var(--c97-ink-2)]">result pending</span>
                        )}
                        {submission ? (
                          <span className="text-2xs text-[var(--c97-ink-2)]">
                            my pick {formatScoreline(submission.score)} · scored in the{" "}
                            <Link className="c97-link" href="/score-pools/tracker">tracker</Link>
                          </span>
                        ) : (
                          <span className="text-2xs text-[var(--c97-ink-2)]">
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

        <p className="border-t border-[var(--c97-rule)] text-3xs leading-relaxed text-[var(--c97-ink-2)]" style={{ paddingTop: "var(--c97-sp-2)" }}>
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
    </section>
  );
}
