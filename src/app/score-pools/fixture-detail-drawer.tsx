"use client";

// Per-match detail: the odds behind the pick with their timestamp, the
// calibrated scoreline distribution, the expected-points table, context
// flags, hand-entered odds, and what to recheck before lock.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  summarizeLineMovement,
  type ContextFlagKey,
  type ContextFlags,
  type FixtureAnalysis,
  type Scoreline,
} from "@/lib/scorePools";
import type { StoredManualOdds, StoredPool } from "@/lib/scorePools/persistence";
import { oddsEntryToMarkets } from "@/lib/scorePoolsSnapshot";
import type { SnapshotFixture } from "@/types/scorePools";
import {
  ConfidenceChip,
  EpMeter,
  FIELD_HINT,
  FIELD_INPUT,
  FIELD_LABEL,
  LockBadge,
  PILL_BUTTON,
  formatAge,
  formatKickoff,
  formatPercent,
  formatPoints,
  formatScoreline,
} from "./score-pools-ui";

interface FixtureDetailDrawerProps {
  fixture: SnapshotFixture;
  analysis: FixtureAnalysis | null;
  pool: StoredPool;
  now: string;
  myPick: Scoreline | null;
  onClose: () => void;
  onSetPick: (fixtureId: string, score: Scoreline) => void;
  onClearPick: (fixtureId: string) => void;
  onSetFlags: (fixtureId: string, flags: ContextFlags | null) => void;
  onSaveManualOdds: (fixtureId: string, odds: StoredManualOdds | null) => void;
}

const FLAG_LABELS: Array<{ key: ContextFlagKey; label: string; hint: string }> = [
  { key: "deadRubber", label: "Dead rubber", hint: "Nothing riding on it; lower tempo, more rotation." },
  { key: "drawSuitsBoth", label: "Draw suits both", hint: "Neither side needs to chase this one." },
  { key: "mustWinHome", label: "Must-win (home)", hint: "The home side has to push for three points." },
  { key: "mustWinAway", label: "Must-win (away)", hint: "The away side has to push for three points." },
  { key: "rotationRiskHome", label: "Rotation risk (home)", hint: "Expect a weakened home eleven." },
  { key: "rotationRiskAway", label: "Rotation risk (away)", hint: "Expect a weakened away eleven." },
];

const SECTION = "rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] p-4 shadow-[var(--shadow-sm)]";
const SECTION_TITLE = "text-sm font-bold text-[var(--home-ink)]";

function ScorelineHeatmap({ analysis }: { analysis: FixtureAnalysis }) {
  const grid = analysis.distribution.grid;
  const max = Math.max(...grid.flat());
  const size = Math.min(grid.length, 8);
  return (
    <div className="scroll-shadow-x overflow-x-auto" role="region" aria-label="Scoreline probability grid (scrollable)" tabIndex={0}>
      <table className="border-separate border-spacing-0.5" aria-label="Scoreline probabilities: home goals by away goals">
        <thead>
          <tr>
            <th scope="col" className="p-1 text-3xs font-semibold text-[var(--home-ink-muted)]">
              H\A
            </th>
            {Array.from({ length: size }, (_, away) => (
              <th key={away} scope="col" className="w-7 p-1 text-center text-3xs font-semibold text-[var(--home-ink-muted)]">
                {away}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: size }, (_, home) => (
            <tr key={home}>
              <th scope="row" className="p-1 text-3xs font-semibold text-[var(--home-ink-muted)]">
                {home}
              </th>
              {Array.from({ length: size }, (_, away) => {
                const p = grid[home][away];
                const strength = max > 0 ? Math.round((p / max) * 72) : 0;
                return (
                  <td
                    key={away}
                    title={`${home}-${away}: ${formatPercent(p, 1)}`}
                    className="h-7 w-7 rounded-[4px] text-center align-middle text-3xs tabular-nums text-[var(--home-ink)]"
                    style={{
                      background: `color-mix(in srgb, var(--home-signal) ${strength}%, var(--home-overlay))`,
                    }}
                  >
                    {p >= 0.02 ? Math.round(p * 100) : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-3xs text-[var(--home-ink-muted)]">
        Cell numbers are percentages; blanks sit under 2%.
      </p>
    </div>
  );
}

export function FixtureDetailDrawer({
  fixture,
  analysis,
  pool,
  now,
  myPick,
  onClose,
  onSetPick,
  onClearPick,
  onSetFlags,
  onSaveManualOdds,
}: FixtureDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [pickHome, setPickHome] = useState("");
  const [pickAway, setPickAway] = useState("");
  const existingManual = pool.manualOdds[fixture.id];
  const [manualDraft, setManualDraft] = useState({
    home: existingManual ? String(existingManual.home) : "",
    draw: existingManual?.draw !== null && existingManual ? String(existingManual.draw) : "",
    away: existingManual ? String(existingManual.away) : "",
    line: existingManual?.line !== null && existingManual ? String(existingManual.line) : "",
    over: existingManual?.over !== null && existingManual ? String(existingManual.over) : "",
    under: existingManual?.under !== null && existingManual ? String(existingManual.under) : "",
  });
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const movement = useMemo(() => {
    if (fixture.odds.length < 2) return null;
    return summarizeLineMovement(fixture.odds.map(oddsEntryToMarkets), pool.devigMethod);
  }, [fixture.odds, pool.devigMethod]);

  const flags = pool.flags[fixture.id] ?? {};
  const locked = analysis ? now >= analysis.locksAt : false;
  const latestOdds = fixture.odds[fixture.odds.length - 1] ?? null;

  const toggleFlag = (key: ContextFlagKey) => {
    const next: ContextFlags = { ...flags, [key]: !flags[key] };
    if (!next[key]) delete next[key];
    onSetFlags(fixture.id, Object.keys(next).length > 0 ? next : null);
  };

  const saveManualOdds = () => {
    const parse = (value: string): number | null => {
      if (value.trim() === "") return null;
      const num = Number.parseFloat(value);
      return Number.isFinite(num) ? num : Number.NaN;
    };
    const home = parse(manualDraft.home);
    const away = parse(manualDraft.away);
    const draw = parse(manualDraft.draw);
    const line = parse(manualDraft.line);
    const over = parse(manualDraft.over);
    const under = parse(manualDraft.under);
    const prices = [home, draw, away, over, under].filter((v): v is number => v !== null);
    if (home === null || away === null) {
      setManualError("Home and away prices are required.");
      return;
    }
    if (prices.some((v) => Number.isNaN(v) || v <= 1)) {
      setManualError("Prices are decimal odds and have to be greater than 1, like 2.45.");
      return;
    }
    if (line !== null && (Number.isNaN(line) || line <= 0)) {
      setManualError("The totals line has to be a positive number, like 2.5.");
      return;
    }
    setManualError(null);
    onSaveManualOdds(fixture.id, {
      home,
      draw,
      away,
      line,
      over,
      under,
      enteredAt: now,
    });
  };

  const submitPick = () => {
    const home = Number.parseInt(pickHome, 10);
    const away = Number.parseInt(pickAway, 10);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 15 || away > 15) {
      return;
    }
    onSetPick(fixture.id, { home, away });
    setPickHome("");
    setPickAway("");
  };

  const rec = analysis?.recommendation ?? null;
  const topEp = rec ? Math.max(...rec.candidates.map((c) => c.expectedPoints)) : 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${fixture.homeTeam} vs ${fixture.awayTeam} detail`}>
      <button
        type="button"
        aria-label="Close match detail"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: "color-mix(in srgb, var(--home-ink) 32%, transparent)" }}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto border-l border-[var(--home-rule)] bg-[var(--home-paper)] p-5 shadow-[var(--shadow-lg)]">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--home-rule)] pb-4">
          <div>
            <p className="home-kicker mb-1">{fixture.stage ?? fixture.round ?? "Fixture"}</p>
            <h2 className="text-lg font-bold text-[var(--home-ink)]">
              {fixture.homeTeam} vs {fixture.awayTeam}
            </h2>
            <p className="mt-1 text-xs text-[var(--home-ink-muted)]">
              Kickoff {formatKickoff(fixture.kickoff, pool.timezone)}
              {analysis ? <> · locks {formatKickoff(analysis.locksAt, pool.timezone)}</> : null}
              {fixture.knockout ? " · knockout" : ""}
            </p>
            <div className="mt-1"><LockBadge locked={locked} /></div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className={PILL_BUTTON} aria-label="Close">
            Close
          </button>
        </header>

        <div className="mt-4 space-y-4">
          {/* My pick */}
          <section className={SECTION} aria-label="My pick">
            <h3 className={SECTION_TITLE}>My pick</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-lg font-bold text-[var(--home-ink)]">
                {myPick ? formatScoreline(myPick) : "not set"}
              </span>
              {myPick ? (
                <button type="button" className={PILL_BUTTON} onClick={() => onClearPick(fixture.id)}>
                  Clear
                </button>
              ) : null}
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`pick-home-${fixture.id}`}>Home goals</label>
                <input
                  id={`pick-home-${fixture.id}`}
                  type="number"
                  min={0}
                  max={15}
                  inputMode="numeric"
                  value={pickHome}
                  onChange={(event) => setPickHome(event.target.value)}
                  className="min-h-[44px] w-16 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-1 text-center text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                />
                <span className="text-[var(--home-ink-muted)]">-</span>
                <label className="sr-only" htmlFor={`pick-away-${fixture.id}`}>Away goals</label>
                <input
                  id={`pick-away-${fixture.id}`}
                  type="number"
                  min={0}
                  max={15}
                  inputMode="numeric"
                  value={pickAway}
                  onChange={(event) => setPickAway(event.target.value)}
                  className="min-h-[44px] w-16 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-1 text-center text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                />
                <button type="button" className={PILL_BUTTON} onClick={submitPick}>
                  Set
                </button>
              </div>
            </div>
          </section>

          {/* Recommendation */}
          {rec && analysis ? (
            <section className={SECTION} aria-label="Recommendation">
              <div className="flex items-center justify-between gap-3">
                <h3 className={SECTION_TITLE}>Recommendation</h3>
                <ConfidenceChip level={rec.confidence.level} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Recommended", pick: rec.recommended },
                  { label: "Higher floor", pick: rec.safest },
                  ...(rec.differentiator ? [{ label: "Differentiator", pick: rec.differentiator }] : []),
                ].map(({ label, pick }) => (
                  <div key={label} className="rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] p-3">
                    <p className="text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">{label}</p>
                    <p className="mt-1 font-mono text-xl font-bold text-[var(--home-ink)]">{formatScoreline(pick.score)}</p>
                    <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                      {formatPoints(pick.expectedPoints)} exp pts · floor {formatPercent(pick.pAnyPoints)}
                    </p>
                    <button
                      type="button"
                      className={`${PILL_BUTTON} mt-2 w-full`}
                      onClick={() => onSetPick(fixture.id, pick.score)}
                    >
                      Use as my pick
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--home-ink)]">{rec.reason}</p>
              <p className="mt-2 text-2xs text-[var(--home-ink-muted)]">{rec.risk.explanation}</p>
            </section>
          ) : null}

          {/* Market */}
          <section className={SECTION} aria-label="Market">
            <h3 className={SECTION_TITLE}>The market it used</h3>
            {analysis && latestOdds ? (
              <div className="mt-2 space-y-2 text-sm text-[var(--home-ink)]">
                <p className="font-mono tabular-nums">
                  {latestOdds.moneyline.home.toFixed(2)}
                  {latestOdds.moneyline.draw !== null ? ` / ${latestOdds.moneyline.draw.toFixed(2)}` : ""}
                  {" / "}
                  {latestOdds.moneyline.away.toFixed(2)}
                  {latestOdds.totals ? (
                    <span className="text-[var(--home-ink-muted)]">
                      {" "}· O/U {latestOdds.totals.line}
                      {latestOdds.totals.over ? ` (${latestOdds.totals.over.toFixed(2)}/${latestOdds.totals.under?.toFixed(2) ?? "—"})` : ""}
                    </span>
                  ) : null}
                </p>
                <p className="text-2xs text-[var(--home-ink-muted)]">
                  {latestOdds.manual ? "Hand-entered" : (latestOdds.bookmaker ?? "book")} ·{" "}
                  {formatAge(latestOdds.fetchedAt, now)} · margin {formatPercent(analysis.market.overround, 1)}
                </p>
                <p className="text-2xs text-[var(--home-ink-muted)]">
                  Fair probabilities after the de-vig: home {formatPercent(analysis.market.probabilities.home, 1)}
                  {analysis.market.probabilities.draw !== undefined
                    ? `, draw ${formatPercent(analysis.market.probabilities.draw, 1)}`
                    : ""}
                  , away {formatPercent(analysis.market.probabilities.away, 1)}.
                </p>
                {movement ? (
                  <p className="text-2xs text-[var(--home-ink-muted)]">
                    Movement over {movement.snapshots} snapshots: home{" "}
                    {movement.outcomeDelta.home >= 0 ? "up" : "down"}{" "}
                    {formatPercent(Math.abs(movement.outcomeDelta.home), 1)}
                    {movement.outcomeDelta.draw !== null
                      ? `, draw ${movement.outcomeDelta.draw >= 0 ? "up" : "down"} ${formatPercent(Math.abs(movement.outcomeDelta.draw), 1)}`
                      : ""}
                    {movement.totalLineDelta !== null && movement.totalLineDelta !== 0
                      ? `, total line ${movement.totalLineDelta > 0 ? "+" : ""}${movement.totalLineDelta}`
                      : ""}
                    .
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--home-ink-muted)]">
                No odds yet for this game. Enter a moneyline below and the engine can price it.
              </p>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-1xs font-semibold text-[var(--home-ink)]">
                {existingManual ? "Edit hand-entered odds" : "Enter odds by hand"}
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    ["home", "Home"],
                    ["draw", "Draw"],
                    ["away", "Away"],
                    ["line", "Total line"],
                    ["over", "Over"],
                    ["under", "Under"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className={FIELD_LABEL}>
                    {label}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={manualDraft[key]}
                      onChange={(event) =>
                        setManualDraft((draft) => ({ ...draft, [key]: event.target.value }))
                      }
                      className={FIELD_INPUT}
                    />
                  </label>
                ))}
              </div>
              <span className={FIELD_HINT}>
                Decimal odds, like 2.45. Draw and totals are optional; leave the draw empty for a
                two-way market.
              </span>
              {manualError ? (
                <p className="mt-1 text-2xs font-semibold" style={{ color: "var(--home-negative)" }}>
                  {manualError}
                </p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <button type="button" className={PILL_BUTTON} onClick={saveManualOdds}>
                  Save odds
                </button>
                {existingManual ? (
                  <button
                    type="button"
                    className={PILL_BUTTON}
                    onClick={() => onSaveManualOdds(fixture.id, null)}
                  >
                    Remove hand-entered odds
                  </button>
                ) : null}
              </div>
            </details>
          </section>

          {/* Model */}
          {analysis ? (
            <section className={SECTION} aria-label="Scoreline model">
              <h3 className={SECTION_TITLE}>The scoreline distribution</h3>
              <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
                Expected goals {analysis.distribution.lambdaHome.toFixed(2)} vs{" "}
                {analysis.distribution.lambdaAway.toFixed(2)}, total{" "}
                {analysis.distribution.expectedTotal.toFixed(2)}, low-score correction{" "}
                {analysis.distribution.rho.toFixed(2)}
                {fixture.knockout
                  ? ` · P(extra time) ${formatPercent(analysis.comparison.pExtraTime)} · P(penalties) ${formatPercent(analysis.comparison.pPenalties)}`
                  : ""}
                .
              </p>
              <div className="mt-3">
                <ScorelineHeatmap analysis={analysis} />
              </div>

              <h4 className="mt-4 text-1xs font-bold text-[var(--home-ink)]">
                Expected points by candidate
              </h4>
              <div className="scroll-shadow-x mt-2 overflow-x-auto" role="region" aria-label="Candidate expected points (scrollable)" tabIndex={0}>
                <table className="min-w-full border-separate border-spacing-y-1" aria-label="Top candidate picks by expected points">
                  <thead>
                    <tr className="text-left text-3xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                      <th scope="col" className="px-2 py-1 font-semibold">Pick</th>
                      <th scope="col" className="px-2 py-1 font-semibold">Exp pts</th>
                      <th scope="col" className="px-2 py-1 font-semibold">Exact</th>
                      <th scope="col" className="px-2 py-1 font-semibold">Floor</th>
                      <th scope="col" className="px-2 py-1 font-semibold">Field on it</th>
                      <th scope="col" className="px-2 py-1 font-semibold"><span className="sr-only">Use</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rec?.candidates.slice(0, 10).map((candidate) => (
                      <tr key={formatScoreline(candidate.score)} className="text-xs text-[var(--home-ink)]">
                        <td className="px-2 py-1 font-mono font-bold">{formatScoreline(candidate.score)}</td>
                        <td className="px-2 py-1"><EpMeter value={candidate.expectedPoints} max={topEp} /></td>
                        <td className="px-2 py-1 tabular-nums">{formatPercent(candidate.pExact, 1)}</td>
                        <td className="px-2 py-1 tabular-nums">{formatPercent(candidate.pAnyPoints)}</td>
                        <td className="px-2 py-1 tabular-nums">{formatPercent(candidate.fieldShare)}</td>
                        <td className="px-2 py-1">
                          <button
                            type="button"
                            className="inline-flex min-h-[44px] items-center rounded-full px-3 text-2xs font-semibold text-[var(--home-ink)] underline decoration-[var(--home-rule)] underline-offset-4 hover:decoration-[var(--home-signal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]"
                            onClick={() => onSetPick(fixture.id, candidate.score)}
                          >
                            Use
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {analysis.distribution.diagnostics.notes.length > 0 || analysis.contextAudit.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {[...analysis.distribution.diagnostics.notes, ...analysis.contextAudit].map((note) => (
                    <p key={note} className="text-2xs text-[var(--home-ink-muted)]">{note}</p>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Context flags */}
          <section className={SECTION} aria-label="Context flags">
            <h3 className={SECTION_TITLE}>Context flags</h3>
            <p className="mt-1 text-2xs text-[var(--home-ink-muted)]">
              Flags shade the calibration modestly; the market already prices most context.
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {FLAG_LABELS.map(({ key, label, hint }) => (
                <label key={key} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2">
                  <input
                    type="checkbox"
                    checked={flags[key] === true}
                    onChange={() => toggleFlag(key)}
                    className="h-4 w-4 accent-[var(--home-signal)]"
                  />
                  <span className="text-xs font-semibold text-[var(--home-ink)]">{label}</span>
                  <span className="sr-only">{hint}</span>
                </label>
              ))}
            </div>
            {analysis && analysis.suggestedFlags.length > 0 ? (
              <div className="mt-3 space-y-2">
                {analysis.suggestedFlags.map((suggestion) => (
                  <div key={suggestion.flag} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2">
                    <p className="text-2xs text-[var(--home-ink-muted)]">
                      <span className="font-semibold text-[var(--home-ink)]">Suggested from standings:</span>{" "}
                      {suggestion.reason}
                    </p>
                    {!flags[suggestion.flag] ? (
                      <button type="button" className={PILL_BUTTON} onClick={() => toggleFlag(suggestion.flag)}>
                        Apply
                      </button>
                    ) : (
                      <span className="text-2xs font-semibold text-[var(--home-ink-muted)]">Applied</span>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* Recheck */}
          {analysis && analysis.recheck.length > 0 ? (
            <section className={SECTION} aria-label="Before it locks">
              <h3 className={SECTION_TITLE}>Recheck before it locks</h3>
              <ul className="mt-2 space-y-1.5">
                {analysis.recheck.map((item) => (
                  <li key={item} className="flex gap-2 text-2xs text-[var(--home-ink-muted)]">
                    <span aria-hidden="true" style={{ color: "var(--home-warning)" }}>▲</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {fixture.injuryNotes.length > 0 ? (
            <section className={SECTION} aria-label="Injury notes">
              <h3 className={SECTION_TITLE}>Injury notes</h3>
              <ul className="mt-2 space-y-1">
                {fixture.injuryNotes.map((note) => (
                  <li key={note} className="text-2xs text-[var(--home-ink-muted)]">{note}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="pb-4 text-3xs text-[var(--home-ink-muted)]">
            Analysis as of {formatAge(analysis?.asOf ?? now, now)} from odds{" "}
            {latestOdds ? formatAge(latestOdds.fetchedAt, now) : "entered by hand"}. The model is
            anchored to the market, and it carries the market's uncertainty; treat the expected
            points as a ranking, not a promise.
          </p>
        </div>
      </aside>
    </div>
  );
}
