"use client";

// Per-match detail: the odds behind the pick with their timestamp, the
// calibrated scoreline distribution, the expected-points table, context
// flags, hand-entered odds, and what to recheck before lock.

import { useMemo, useRef, useState } from "react";
import { useModal } from "@/hooks/useModal";
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
  SCORE_FIELD_STYLE,
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

const SECTION = "c97-panel";
const SECTION_TITLE = "c97-serif c97-h3";

function ScorelineHeatmap({ analysis }: { analysis: FixtureAnalysis }) {
  const grid = analysis.distribution.grid;
  const max = Math.max(...grid.flat());
  const size = Math.min(grid.length, 8);
  return (
    <div className="scroll-shadow-x overflow-x-auto" role="region" aria-label="Scoreline probability grid (scrollable)" tabIndex={0}>
      <table className="border-separate border-spacing-0.5" aria-label="Scoreline probabilities: home goals by away goals">
        <thead>
          <tr>
            <th scope="col" className="text-3xs font-semibold text-[var(--c97-ink-2)]" style={{ padding: "var(--c97-sp-0)" }}>
              H\A
            </th>
            {Array.from({ length: size }, (_, away) => (
              <th key={away} scope="col" className="w-7 text-center text-3xs font-semibold text-[var(--c97-ink-2)]" style={{ padding: "var(--c97-sp-0)" }}>
                {away}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: size }, (_, home) => (
            <tr key={home}>
              <th scope="row" className="text-3xs font-semibold text-[var(--c97-ink-2)]" style={{ padding: "var(--c97-sp-0)" }}>
                {home}
              </th>
              {Array.from({ length: size }, (_, away) => {
                const p = grid[home][away];
                // Capped at 40% so the strongest cell keeps 4.5:1 label contrast on the panel in both
                // themes: 5.11:1 light and 6.61:1 dark. 55% measured 3.85:1 in light.
                const strength = max > 0 ? Math.round((p / max) * 40) : 0;
                return (
                  <td
                    key={away}
                    title={`${home}-${away}: ${formatPercent(p, 1)}`}
                    className="h-7 w-7 text-center align-middle text-3xs tabular-nums text-[var(--c97-ink)]"
                    style={{
                      background: `color-mix(in srgb, var(--c97-accent) ${strength}%, var(--c97-overlay))`,
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
      <p className="text-3xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
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
  const dialogRef = useRef<HTMLDivElement>(null);
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
  const [pickError, setPickError] = useState<string | null>(null);

  useModal(dialogRef, true, onClose, { initialFocusRef: closeRef, lockScroll: false });

  const movement = useMemo(() => {
    if (fixture.odds.length < 2) return null;
    return summarizeLineMovement(fixture.odds.map(oddsEntryToMarkets), pool.devigMethod);
  }, [fixture.odds, pool.devigMethod]);

  const flags = pool.flags[fixture.id] ?? {};
  const locked = analysis ? now >= analysis.locksAt : false;
  const latestOdds = fixture.odds[fixture.odds.length - 1] ?? null;
  // Hand-entered odds replace the snapshot price in the analysis, so the market
  // line shows them too instead of the older snapshot price above newer math.
  const shownOdds = existingManual
    ? {
        moneyline: { home: existingManual.home, draw: existingManual.draw, away: existingManual.away },
        totals:
          existingManual.line !== null
            ? { line: existingManual.line, over: existingManual.over, under: existingManual.under }
            : null,
        manual: true,
        bookmaker: null as string | null,
        fetchedAt: existingManual.enteredAt,
      }
    : latestOdds;

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
    // A locked game keeps whatever was picked before it locked.
    if (locked) return;
    const home = Number.parseInt(pickHome, 10);
    const away = Number.parseInt(pickAway, 10);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 15 || away > 15) {
      setPickError("Both scores need whole numbers from 0 to 15.");
      return;
    }
    setPickError(null);
    onSetPick(fixture.id, { home, away });
    setPickHome("");
    setPickAway("");
  };

  const rec = analysis?.recommendation ?? null;
  const topEp = rec ? Math.max(...rec.candidates.map((c) => c.expectedPoints)) : 0;

  return (
    <div ref={dialogRef} className="fixed inset-0"
      style={{ zIndex: "var(--c97-z-drawer)" }} role="dialog" aria-modal="true" aria-label={`${fixture.homeTeam} vs ${fixture.awayTeam} detail`}>
      <button
        type="button"
        aria-label="Close match detail"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: "color-mix(in srgb, var(--c97-ink) 32%, transparent)" }}
      />
      <aside
        data-c97-surface="paper"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto border-l border-[var(--c97-rule)]" style={{ padding: "var(--c97-sp-2)" }}
      >
        <header className="flex items-start justify-between border-b border-[var(--c97-rule)]" style={{ gap: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-2)" }}>
          <div>
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>{fixture.stage ?? fixture.round ?? "Fixture"}</p>
            <h2 className="c97-serif c97-h2">
              {fixture.homeTeam} vs {fixture.awayTeam}
            </h2>
            <p className="text-xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
              Kickoff {formatKickoff(fixture.kickoff, pool.timezone)}
              {analysis ? <> · locks {formatKickoff(analysis.locksAt, pool.timezone)}</> : null}
              {fixture.knockout ? " · knockout" : ""}
            </p>
            <div style={{ marginTop: "var(--c97-sp-0)" }}><LockBadge locked={locked} /></div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className={PILL_BUTTON} aria-label="Close">
            Close
          </button>
        </header>

        <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-2)" }}>
          {/* My pick */}
          <section className={SECTION} aria-label="My pick">
            <h3 className={SECTION_TITLE}>My pick</h3>
            <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
              <span className="font-mono text-lg font-bold text-[var(--c97-ink)]">
                {myPick ? formatScoreline(myPick) : "not set"}
              </span>
              {myPick ? (
                <button type="button" className={PILL_BUTTON} onClick={() => onClearPick(fixture.id)}>
                  Clear
                </button>
              ) : null}
              <div className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
                <label className="sr-only" htmlFor={`pick-home-${fixture.id}`}>Home goals</label>
                <input
                  id={`pick-home-${fixture.id}`}
                  type="number"
                  min={0}
                  max={15}
                  inputMode="numeric"
                  value={pickHome}
                  onChange={(event) => setPickHome(event.target.value)}
                  className="c97-field"
                  style={SCORE_FIELD_STYLE}
                />
                <span className="text-[var(--c97-ink-2)]">-</span>
                <label className="sr-only" htmlFor={`pick-away-${fixture.id}`}>Away goals</label>
                <input
                  id={`pick-away-${fixture.id}`}
                  type="number"
                  min={0}
                  max={15}
                  inputMode="numeric"
                  value={pickAway}
                  onChange={(event) => setPickAway(event.target.value)}
                  className="c97-field"
                  style={SCORE_FIELD_STYLE}
                />
                <button type="button" className={`${PILL_BUTTON} disabled:cursor-not-allowed disabled:opacity-50`} onClick={submitPick} disabled={locked}>
                  Set
                </button>
              </div>
            </div>
            {pickError ? (
              <p role="alert" className="text-2xs font-semibold" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-negative)" }}>
                {pickError}
              </p>
            ) : null}
          </section>

          {/* Recommendation */}
          {rec && analysis ? (
            <section className={SECTION} aria-label="Recommendation">
              <div className="flex items-center justify-between" style={{ gap: "var(--c97-sp-1)" }}>
                <h3 className={SECTION_TITLE}>Recommendation</h3>
                <ConfidenceChip level={rec.confidence.level} />
              </div>
              <div className="grid sm:grid-cols-3" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                {[
                  { label: "Recommended", pick: rec.recommended },
                  { label: "Higher floor", pick: rec.safest },
                  ...(rec.differentiator ? [{ label: "Differentiator", pick: rec.differentiator }] : []),
                ].map(({ label, pick }) => (
                  <div key={label} className="flex flex-col border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-1)" }}>
                    <p className="text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--c97-ink-2)]">{label}</p>
                    <p className="font-mono text-xl font-bold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-0)" }}>{formatScoreline(pick.score)}</p>
                    <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)", marginBottom: "var(--c97-sp-1)" }}>
                      {formatPoints(pick.expectedPoints)} exp pts · floor {formatPercent(pick.pAnyPoints)}
                    </p>
                    <button
                      type="button"
                      className={`${PILL_BUTTON} w-full justify-center`}
                      // .c97-btn is unlayered and sets nowrap and wide padding, so the
                      // three-up column needs its own inline spacing to fit the label.
                      // The auto top margin pins it to the card's foot, so the three
                      // buttons share one line when a stat line wraps in one card.
                      style={{
                        marginTop: "auto",
                        paddingInline: "var(--c97-sp-1)",
                        whiteSpace: "normal",
                      }}
                      onClick={() => onSetPick(fixture.id, pick.score)}
                    >
                      Use as my pick
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>{rec.reason}</p>
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>{rec.risk.explanation}</p>
            </section>
          ) : null}

          {/* Market */}
          <section className={SECTION} aria-label="Market">
            <h3 className={SECTION_TITLE}>The market it used</h3>
            {analysis && shownOdds ? (
              <div className="flex flex-col text-sm text-[var(--c97-ink)]" style={{ rowGap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                <p className="font-mono tabular-nums">
                  {shownOdds.moneyline.home.toFixed(2)}
                  {shownOdds.moneyline.draw !== null ? ` / ${shownOdds.moneyline.draw.toFixed(2)}` : ""}
                  {" / "}
                  {shownOdds.moneyline.away.toFixed(2)}
                  {shownOdds.totals ? (
                    <span className="text-[var(--c97-ink-2)]">
                      {" "}· O/U {shownOdds.totals.line}
                      {shownOdds.totals.over ? ` (${shownOdds.totals.over.toFixed(2)}/${shownOdds.totals.under?.toFixed(2) ?? "—"})` : ""}
                    </span>
                  ) : null}
                </p>
                <p className="text-2xs text-[var(--c97-ink-2)]">
                  {shownOdds.manual ? "Hand-entered" : (shownOdds.bookmaker ?? "book")} ·{" "}
                  {formatAge(shownOdds.fetchedAt, now)} · margin {formatPercent(analysis.market.overround, 1)}
                </p>
                <p className="text-2xs text-[var(--c97-ink-2)]">
                  Fair probabilities after the de-vig: home {formatPercent(analysis.market.probabilities.home, 1)}
                  {analysis.market.probabilities.draw !== undefined
                    ? `, draw ${formatPercent(analysis.market.probabilities.draw, 1)}`
                    : ""}
                  , away {formatPercent(analysis.market.probabilities.away, 1)}.
                </p>
                {movement ? (
                  <p className="text-2xs text-[var(--c97-ink-2)]">
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
              <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                No odds yet for this game. Enter a moneyline below and the engine can price it.
              </p>
            )}

            <details style={{ marginTop: "var(--c97-sp-1)" }}>
              <summary
                className="min-h-touch cursor-pointer text-1xs font-semibold text-[var(--c97-ink)]"
                style={{ paddingBlock: "var(--c97-sp-1)" }}
              >
                {existingManual ? "Edit hand-entered odds" : "Enter odds by hand"}
              </summary>
              <div className="grid grid-cols-3" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
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
                  <label key={key} className="block">
                    <span className={FIELD_LABEL}>{label}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={manualDraft[key]}
                      onChange={(event) =>
                        setManualDraft((draft) => ({ ...draft, [key]: event.target.value }))
                      }
                      className={FIELD_INPUT}
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    />
                  </label>
                ))}
              </div>
              <span
                className={FIELD_HINT}
                style={{
                  display: "block",
                  marginTop: "var(--c97-sp-1)",
                  fontSize: "var(--c97-fs-small)",
                  color: "var(--c97-ink-2)",
                }}
              >
                Decimal odds, like 2.45. Draw and totals are optional; leave the draw empty for a
                two-way market.
              </span>
              {manualError ? (
                <p role="alert" className="text-2xs font-semibold" style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-negative)" }}>
                  {manualError}
                </p>
              ) : null}
              <div className="flex" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
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
              <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                Expected goals {analysis.distribution.lambdaHome.toFixed(2)} vs{" "}
                {analysis.distribution.lambdaAway.toFixed(2)}, total{" "}
                {analysis.distribution.expectedTotal.toFixed(2)}, low-score correction{" "}
                {analysis.distribution.rho.toFixed(2)}
                {fixture.knockout
                  ? ` · P(extra time) ${formatPercent(analysis.comparison.pExtraTime)} · P(penalties) ${formatPercent(analysis.comparison.pPenalties)}`
                  : ""}
                .
              </p>
              <div style={{ marginTop: "var(--c97-sp-1)" }}>
                <ScorelineHeatmap analysis={analysis} />
              </div>

              <h4 className="text-1xs font-bold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-2)" }}>
                Expected points by candidate
              </h4>
              <div className="scroll-shadow-x overflow-x-auto" style={{ marginTop: "var(--c97-sp-1)" }} role="region" aria-label="Candidate expected points (scrollable)" tabIndex={0}>
                <table className="c97-table" aria-label="Top candidate picks by expected points">
                  <thead>
                    <tr>
                      <th scope="col">Pick</th>
                      <th scope="col">Exp pts</th>
                      <th scope="col">Exact</th>
                      <th scope="col">Floor</th>
                      <th scope="col">Field on it</th>
                      <th scope="col"><span className="sr-only">Use</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rec?.candidates.slice(0, 10).map((candidate) => (
                      <tr key={formatScoreline(candidate.score)}>
                        <td className="font-mono font-bold">{formatScoreline(candidate.score)}</td>
                        <td><EpMeter value={candidate.expectedPoints} max={topEp} /></td>
                        <td>{formatPercent(candidate.pExact, 1)}</td>
                        <td>{formatPercent(candidate.pAnyPoints)}</td>
                        <td>{formatPercent(candidate.fieldShare)}</td>
                        <td>
                          <button
                            type="button"
                            className="inline-flex min-h-[44px] items-center text-2xs font-semibold text-[var(--c97-ink)] underline decoration-[var(--c97-rule)] underline-offset-4 hover:decoration-[var(--c97-accent)]" style={{ paddingInline: "var(--c97-sp-1)" }}
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
                <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-0)", marginTop: "var(--c97-sp-1)" }}>
                  {[...analysis.distribution.diagnostics.notes, ...analysis.contextAudit].map((note) => (
                    <p key={note} className="text-2xs text-[var(--c97-ink-2)]">{note}</p>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Context flags */}
          <section className={SECTION} aria-label="Context flags">
            <h3 className={SECTION_TITLE}>Context flags</h3>
            <p className="text-2xs text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
              Flags shade the calibration modestly; the market already prices most context.
            </p>
            <div className="grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
              {FLAG_LABELS.map(({ key, label, hint }) => (
                <label key={key} className="flex min-h-[44px] cursor-pointer items-center border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ gap: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}>
                  <input
                    type="checkbox"
                    checked={flags[key] === true}
                    onChange={() => toggleFlag(key)}
                    className="c97-check"
                  />
                  <span className="text-xs font-semibold text-[var(--c97-ink)]">{label}</span>
                  <span className="sr-only">{hint}</span>
                </label>
              ))}
            </div>
            {analysis && analysis.suggestedFlags.length > 0 ? (
              <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-1)" }}>
                {analysis.suggestedFlags.map((suggestion) => (
                  <div key={suggestion.flag} className="flex flex-wrap items-center justify-between border border-[var(--c97-rule)] bg-[var(--c97-surface)]" style={{ gap: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}>
                    <p className="text-2xs text-[var(--c97-ink-2)]">
                      <span className="font-semibold text-[var(--c97-ink)]">Suggested from standings:</span>{" "}
                      {suggestion.reason}
                    </p>
                    {!flags[suggestion.flag] ? (
                      <button type="button" className={PILL_BUTTON} onClick={() => toggleFlag(suggestion.flag)}>
                        Apply
                      </button>
                    ) : (
                      <span className="text-2xs font-semibold text-[var(--c97-ink-2)]">Applied</span>
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
              <ul className="flex flex-col" style={{ rowGap: "var(--c97-sp-0)", marginTop: "var(--c97-sp-1)" }}>
                {analysis.recheck.map((item) => (
                  <li key={item} className="flex text-2xs text-[var(--c97-ink-2)]" style={{ gap: "var(--c97-sp-1)" }}>
                    <span aria-hidden="true" style={{ color: "var(--c97-warning)" }}>▲</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {fixture.injuryNotes.length > 0 ? (
            <section className={SECTION} aria-label="Injury notes">
              <h3 className={SECTION_TITLE}>Injury notes</h3>
              <ul className="flex flex-col" style={{ rowGap: "var(--c97-sp-0)", marginTop: "var(--c97-sp-1)" }}>
                {fixture.injuryNotes.map((note) => (
                  <li key={note} className="text-2xs text-[var(--c97-ink-2)]">{note}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-3xs text-[var(--c97-ink-2)]" style={{ paddingBottom: "var(--c97-sp-2)" }}>
            Analysis as of {formatAge(analysis?.asOf ?? now, now)} from odds{" "}
            {shownOdds ? formatAge(shownOdds.fetchedAt, now) : "entered by hand"}. The model is
            anchored to the market, and it carries the market's uncertainty; treat the expected
            points as a ranking, not a promise.
          </p>
        </div>
      </aside>
    </div>
  );
}
