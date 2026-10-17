"use client";

import { useIsClient } from "@/hooks/useIsClient";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import { FantasyRouteHeader, FreshnessParts } from "@/components/fantasy/FantasyRouteHeader";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { useFantasyTradeCalculator } from "@/hooks/useFantasyTradeCalculator";
import { useFantasyWeeklySnapshot } from "@/hooks/useFantasyWeeklySnapshot";
import { FANTASY_SCORING_LABELS } from "@/lib/fantasy";
import {
  buildInSeasonTradeBoard,
  evaluateFantasyTrade,
  getRestOfSeasonFreshness,
  getScoringThroughWeek,
  type FantasyTradeEvaluation,
  type FantasyTradeLeagueSettings,
  type FantasyTradeRestOfSeasonInput,
} from "@/lib/fantasyTrade";
import {
  FANTASY_TRADE_MAX_PLAYERS_PER_SIDE,
  isValidFantasyTradeSeason,
} from "@/lib/fantasyTradePersistence";
import {
  formatUpdatedAt,
  getCurrentDraftSeason,
  getFantasyAdpFreshness,
  getNflRegularSeasonWeek,
  getSnapshotStaleness,
  type FantasySnapshotStaleness,
  SHELL_CLASS,
} from "@/lib/fantasyUtils";
import { REDRAFT_LINEUP_PRESETS } from "@/lib/redraftLineup";
import { TradePackageFieldset } from "./trade-package-fieldset";
import type { TradeSearchHandle } from "./trade-player-combobox";
import { formatMarketDate, TradeResultRail, TradeVerdictStrip } from "./trade-result-rail";
import { TradeRosterImpact } from "./trade-roster-impact";
import {
  buildTradeCalculatorHref,
  buildTradeCalculatorShareHref,
  normalizeTradeCalculatorState,
  parseTradeCalculatorShare,
  TRADE_CALCULATOR_ROSTER_SIZES,
  TRADE_CALCULATOR_TEAM_COUNTS,
  type TradeCalculatorSearchState,
} from "./trade-calculator-state";
import "@/components/fantasy/fantasy-trade.css";

// Clearing the deal cannot be undone, so the button arms first. Left alone it
// disarms again, or the two-step guard quietly degrades into a one-click wipe
// the next time the visitor comes back to the page.
const RESET_ARM_TIMEOUT_MS = 5000;

function LeagueSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: readonly number[];
  onChange: (value: number) => void;
}) {
  return (
    <label className="ffb-field">
      <span className="ffb-field-label">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="ffb-select"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function LeagueSettings({
  state,
  open,
  onToggle,
  onChange,
  inSeason,
}: {
  state: TradeCalculatorSearchState;
  inSeason: boolean;
  /**
   * Below 1200px the desk is one column and the settings lead it, so they open
   * on request and a one-line summary stands in for them. From 1200px they sit
   * in their own column and always show. The open state lives in the parent
   * because a scoring change swaps this whole panel for the loading skeleton,
   * and a phone visitor who had just opened the settings found them shut again.
   */
  open: boolean;
  onToggle: () => void;
  onChange: (state: TradeCalculatorSearchState) => void;
}) {
  const fieldsId = useId();
  const lineupLabel =
    REDRAFT_LINEUP_PRESETS.find((preset) => preset.id === state.lineup)?.label ?? state.lineup;
  return (
    <aside aria-label="League settings" className="ffb-stack ffb-stack-tight ffb-tr-settings">
      <div className="ffb-sechead ffb-sechead-ctl">
        <div className="ffb-tr-headtext">
          <h2 className="ffb-h3">League settings</h2>
          <p className="ffb-tr-summary min-[1200px]:hidden">
            {FANTASY_SCORING_LABELS[state.scoring]}, {state.teams} teams, {state.rosterSize} roster spots, {lineupLabel}
          </p>
        </div>
        {/* The heading beside it says what changes, so the button shows one word and keeps its full name. */}
        <button
          type="button"
          className="ffb-btn ffb-tr-toggle min-[1200px]:hidden"
          aria-expanded={open}
          aria-controls={fieldsId}
          onClick={onToggle}
        >
          {open ? "Hide" : "Change"}
          <span className="ffb-vh"> league settings</span>
        </button>
      </div>

      <div id={fieldsId} className={`${open ? "" : "hidden "}min-[1200px]:block`}>
        <div className="ffb-stack ffb-stack-tight">
          <fieldset className="ffb-choices ffb-tr-scoring">
            <legend className="ffb-vh">Scoring</legend>
            {(["ppr", "half_ppr", "standard"] as const).map((scoring) => (
              <label key={scoring} className="ffb-choice">
                <input
                  type="radio"
                  name="trade-scoring"
                  value={scoring}
                  checked={state.scoring === scoring}
                  onChange={() => onChange({ ...state, scoring })}
                />
                <span className="ffb-choice-title">{FANTASY_SCORING_LABELS[scoring]}</span>
              </label>
            ))}
          </fieldset>

          <div className="ffb-tr-selects">
            <LeagueSelect
              label="Teams"
              value={state.teams}
              options={TRADE_CALCULATOR_TEAM_COUNTS}
              onChange={(teams) =>
                onChange({ ...state, teams: teams as TradeCalculatorSearchState["teams"] })
              }
            />
            <LeagueSelect
              label="Roster size"
              value={state.rosterSize}
              options={TRADE_CALCULATOR_ROSTER_SIZES}
              onChange={(rosterSize) =>
                onChange({
                  ...state,
                  rosterSize: rosterSize as TradeCalculatorSearchState["rosterSize"],
                })
              }
            />
            <label className="ffb-field">
              <span className="ffb-field-label">Starting lineup</span>
              <select
                value={state.lineup}
                onChange={(event) =>
                  onChange({
                    ...state,
                    lineup: event.target.value as TradeCalculatorSearchState["lineup"],
                  })
                }
                className="ffb-select"
              >
                {REDRAFT_LINEUP_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="ffb-method">These settings move the starter and bench replacement lines.</p>
        </div>
      </div>

      <p className="ffb-method">
        <span className="ffb-label">Supported format</span>{" "}
        {inSeason ? "In-season" : "Preseason"} managed redraft with one starting QB. Dynasty, picks, keepers, IDP, Superflex, and tight end premium are not modeled.
      </p>
    </aside>
  );
}

export function TradeCalculatorClient() {
  const searchParams = useSearchParams();
  const isHydrated = useIsClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const routeState = useMemo(
    () => normalizeTradeCalculatorState(searchParams),
    [searchParams]
  );
  const { snapshot, players: draftPlayers, isLoading: draftLoading, error, retry } = useFantasySnapshot({
    scoring: routeState.scoring,
    all: true,
  });
  // In season the calculator prices the rest-of-season board, which rides in
  // the weekly snapshot. Before Week 1 that file is not published and the
  // calculator stays on the draft board.
  const weekly = useFantasyWeeklySnapshot();
  const seasonWeek = snapshot ? getNflRegularSeasonWeek(snapshot.season) : 0;
  const weeklyBoard = weekly.snapshot?.season === snapshot?.season
    ? weekly.snapshot?.boards[routeState.scoring]
    : undefined;
  const restOfSeason = useMemo<FantasyTradeRestOfSeasonInput | undefined>(
    () =>
      seasonWeek >= 1 && weeklyBoard?.restOfSeason && weeklyBoard.restOfSeasonSource
        ? { players: weeklyBoard.restOfSeason, source: weeklyBoard.restOfSeasonSource }
        : undefined,
    [seasonWeek, weeklyBoard]
  );
  const inSeason = restOfSeason !== undefined;
  const players = useMemo(
    () => (restOfSeason ? buildInSeasonTradeBoard(draftPlayers, restOfSeason.players) : draftPlayers),
    [draftPlayers, restOfSeason]
  );
  // In season the pool waits for the weekly file too, so a shared deal naming a
  // player only the rest-of-season board lists is not dropped while it loads.
  const isLoading = draftLoading || (seasonWeek >= 1 && weekly.isLoading);
  // The lenient snapshot normalizer emits season 0 for malformed input, and
  // getFantasyTradeStorageKey throws on it. Validate rather than nullish-check,
  // and fall back to the draft season (not the calendar year) so a January
  // visit reads the same storage scope the draft tracker uses.
  const season = isValidFantasyTradeSeason(snapshot?.season)
    ? snapshot!.season
    : getCurrentDraftSeason();
  const trade = useFantasyTradeCalculator(season, routeState.scoring);
  const [resetArmed, setResetArmed] = useState(false);
  // A shared link's give/get params win over the stored deal for the initial
  // selection, then normal persistence resumes. Read once at mount so later
  // URL syncs cannot re-trigger the import.
  const [pendingShare, setPendingShare] = useState(() =>
    parseTradeCalculatorShare(searchParams)
  );

  useEffect(() => {
    if (!resetArmed) return;
    const timer = window.setTimeout(() => setResetArmed(false), RESET_ARM_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [resetArmed]);

  const { replaceDeal } = trade;
  useEffect(() => {
    // Gate on every input the player pool reads: in season the pool is the
    // rest-of-season board, which arrives through the weekly file after the
    // (usually cached) draft snapshot, and the share is consumed only once.
    if (!pendingShare || isLoading) return;
    // IDs missing from the current snapshot are dropped silently, matching
    // how the calculator already treats unknown stored players.
    const knownIds = new Set(players.map((player) => player.id));
    const give = pendingShare.givePlayerIds.filter((id) => knownIds.has(id));
    const get = pendingShare.getPlayerIds.filter((id) => knownIds.has(id));
    // A link whose ids all filtered out contributed nothing, so it must not
    // erase the visitor's saved deal.
    if (give.length > 0 || get.length > 0) {
      replaceDeal(give, get);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot: consuming the shared deal must gate the URL mirror below
    setPendingShare(null);
  }, [isLoading, pendingShare, players, replaceDeal]);

  // The route is force-dynamic so the server can render the real query, which
  // made every router.replace a server round trip per player added. The native
  // history call updates the URL and useSearchParams without one; Next syncs
  // its router from it.
  // Keep the deal sendable: mirror the selected players into the give/get
  // params once the initial import settles, touching nothing else in the query.
  useEffect(() => {
    if (pendingShare) return;
    const nextHref = buildTradeCalculatorShareHref(
      { givePlayerIds: trade.givePlayerIds, getPlayerIds: trade.getPlayerIds },
      searchParams
    );
    const query = searchParams.toString();
    const currentHref = query
      ? `/fantasy-football/trade-calculator?${query}`
      : "/fantasy-football/trade-calculator";
    if (nextHref !== currentHref) {
      window.history.replaceState(null, "", nextHref);
    }
  }, [pendingShare, searchParams, trade.getPlayerIds, trade.givePlayerIds]);

  const updateRouteState = (next: TradeCalculatorSearchState) => {
    setResetArmed(false);
    window.history.replaceState(null, "", buildTradeCalculatorHref(next, searchParams));
  };

  const lineup = useMemo(
    () =>
      REDRAFT_LINEUP_PRESETS.find((preset) => preset.id === routeState.lineup)?.lineup ??
      REDRAFT_LINEUP_PRESETS[0].lineup,
    [routeState.lineup]
  );
  const league = useMemo<FantasyTradeLeagueSettings>(
    () => ({
      scoring: routeState.scoring,
      teams: routeState.teams,
      rosterSize: routeState.rosterSize,
      lineup,
    }),
    [lineup, routeState.rosterSize, routeState.scoring, routeState.teams]
  );
  const hasBothSides = trade.givePlayerIds.length > 0 && trade.getPlayerIds.length > 0;
  const result = useMemo<FantasyTradeEvaluation | null>(() => {
    if (!snapshot || !hasBothSides) return null;
    return evaluateFantasyTrade({
      snapshot,
      league,
      sideA: { playerIds: trade.givePlayerIds },
      sideB: { playerIds: trade.getPlayerIds },
      restOfSeason,
    });
  }, [hasBothSides, league, restOfSeason, snapshot, trade.getPlayerIds, trade.givePlayerIds]);
  // The chip covers BOTH inputs. Reading only the expert board let it say
  // "fresh sources" while the verdict was withheld for a stale draft market.
  // In season the scoring leg has no dated feed of its own, so it reads fresh
  // while any player has current scoring and stale once the logs stop, the same
  // predicate the engine reports in sources.market.freshness.
  const scoringThrough = useMemo(
    () => (snapshot ? getScoringThroughWeek(players, snapshot.season, seasonWeek) : 0),
    [players, seasonWeek, snapshot]
  );
  const expertFreshness: FantasySnapshotStaleness = restOfSeason
    ? getRestOfSeasonFreshness(restOfSeason.source.asOf)
    : snapshot
      ? getSnapshotStaleness(snapshot.upstreamUpdatedAt)
      : "stale";
  const marketFreshness: FantasySnapshotStaleness = restOfSeason
    ? scoringThrough > 0 ? "fresh" : "stale"
    : !snapshot?.adpSource
      ? "stale"
      : getFantasyAdpFreshness(snapshot.adpSource.asOf, snapshot.season) === "current"
        ? getSnapshotStaleness(snapshot.adpSource.asOf)
        : "stale";
  const FRESHNESS_SEVERITY: Record<FantasySnapshotStaleness, number> = {
    fresh: 0,
    aging: 1,
    stale: 2,
  };
  const sourceFreshness =
    FRESHNESS_SEVERITY[expertFreshness] >= FRESHNESS_SEVERITY[marketFreshness]
      ? expertFreshness
      : marketFreshness;
  // In season with a rest-of-season board, the calculator prices the rest of
  // the season. Without one (before its first build, or if the weekly file
  // fails) it falls back to the draft board, where the engine gates on the
  // mock-draft feed's age: while the feed is current it prices a draft market
  // at limited coverage, and once the feed stops it withholds. The note below
  // names which of those states the page is in, so none reads as a breakage.
  const marketDate = formatMarketDate(snapshot?.adpSource?.asOf);
  const valuesAvailable = Boolean(result && result.coverage !== "insufficient");
  const allSelected = useMemo(
    () => new Set([...trade.givePlayerIds, ...trade.getPlayerIds]),
    [trade.getPlayerIds, trade.givePlayerIds]
  );

  const clearDisabled = trade.givePlayerIds.length + trade.getPlayerIds.length === 0;
  // The verdict can be withheld because the whole market is old, or because one
  // player has no reading in a market that is current. Only the second is
  // about a row, so only then do the rows say which player it is.
  const marksHeldPlayers = Boolean(
    result && !inSeason && result.coverage === "insufficient" && result.sources.market.usable
  );
  // A confirmed clear disables the button that had focus. Once the deal is
  // empty, focus goes to the first field of the desk.
  const giveSearchRef = useRef<TradeSearchHandle>(null);
  const refocusAfterClear = useRef(false);
  useEffect(() => {
    if (!refocusAfterClear.current) return;
    refocusAfterClear.current = false;
    giveSearchRef.current?.focusClosed();
  }, [trade.givePlayerIds, trade.getPlayerIds]);
  // Route-level loading.tsx only covers navigation. Until the board is in, and
  // while a shared link's deal is still being applied, the ledger and the rail
  // are a skeleton, so the page never shows empty comboboxes.
  const boardReady = !isLoading && !pendingShare;

  return (
    <section
      className="relative overflow-x-clip"
      aria-label="Fantasy football trade calculator"
      data-testid="fantasy-trade-calculator-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <FantasyRouteHeader
        title="Build a Trade Offer"
        lead={
          inSeason
            ? "Compare both sides of a one-QB redraft trade using rest-of-season expert consensus, this season’s scoring, and your league’s scoring, size, and lineup. The result shows where the estimate is strong and where the data is thin."
            : "Compare both sides of a one-QB redraft trade using expert consensus, mock-draft ADP, and your league’s scoring, size, and lineup. The result shows where the estimate is strong and where the data is thin."
        }
        freshness={
          <FreshnessParts
            parts={[
              ...(restOfSeason
                ? [
                    {
                      label: `Rest-of-season board ${formatUpdatedAt(restOfSeason.source.asOf)}, ${restOfSeason.source.expertCount} experts`,
                    },
                    {
                      label: scoringThrough > 0
                        ? `${snapshot?.season} scoring through Week ${scoringThrough}`
                        : `No ${snapshot?.season} scoring yet`,
                    },
                  ]
                : [
                    { label: `Expert board ${formatUpdatedAt(snapshot?.upstreamUpdatedAt)}` },
                    // The market stamp is a date with no time, printed the same way here and in the note below.
                    { label: `Draft market ${marketDate ?? "Unavailable"}` },
                  ]),
              {
                label: `${sourceFreshness} sources`,
                tone:
                  sourceFreshness === "stale"
                    ? "negative"
                    : sourceFreshness === "aging"
                      ? "warning"
                      : undefined,
              },
            ]}
          />
        }
        aside={
          <>
            <span className="ffb-badge">{inSeason ? "In-season" : "Preseason"} redraft · Model v1</span>
            <Link
              href={`/fantasy-football?position=overall&scoring=${routeState.scoring}`}
              className="ffb-link ffb-link-arrow"
            >
              View rankings
            </Link>
          </>
        }
      />

      <div className={`${SHELL_CLASS} ffb-stack`}>
        {seasonWeek >= 1 && snapshot ? (
          <SeasonalScopeNote season={snapshot.season} week={seasonWeek}>
            {restOfSeason ? (
              <>
                The draft board froze at kickoff, so in season this prices the rest of the season
                instead. The expert side is FantasyPros&rsquo; rest-of-season board, which averages{" "}
                {restOfSeason.source.expertCount} experts, a thinner panel than the weekly boards.
                The second side is this season&rsquo;s points per game above each position&rsquo;s
                replacement level, weighted by games played, so five games count for half as much
                as the experts. A player with fewer than four games, a rookie or someone back from
                injury most often, is priced on the experts alone at limited coverage.{" "}
              </>
            ) : marketFreshness === "stale" ? (
              <>
                This calculator prices a preseason draft market, and the mock-draft feed behind it{" "}
                {marketDate
                  ? `last sampled real drafts on ${marketDate}, which is past the four-day window the estimate needs, so`
                  : "has no dated sample, so"}{" "}
                the verdict is withheld. I would rather it say nothing than say something I cannot
                support.{" "}
              </>
            ) : (
              <>
                This calculator prices a preseason draft market. The mock-draft feed behind it was
                still sampling real drafts as of {marketDate ?? "the dated stamp above"}, so the
                estimate still runs, but it answers what these players would cost in a draft this
                week rather than what they are worth in an in-season trade, and from Week 1 it
                reports balanced or leaning at most and never a clear edge. Once that feed stops
                updating the verdict is withheld on its own, because I would rather it say nothing
                than say something I cannot support.{" "}
              </>
            )}
            Ranks that still move are on the{" "}
            <Link href="/fantasy-football/weekly" className="ffb-link">
              weekly board
            </Link>
            , and this week&rsquo;s pickups are on the{" "}
            <Link href="/fantasy-football/waivers" className="ffb-link">
              waivers page
            </Link>
            .
          </SeasonalScopeNote>
        ) : null}

        {trade.persistenceStatus === "memory-only" ? (
          <div role="status" className="ffb-notice">
            <p>
              <strong>Browser storage is unavailable.</strong>{" "}
              This trade will work in the current tab, but it will not survive a reload.
            </p>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="ffb-notice ffb-notice-bad">
            <p>
              <strong>{error}</strong> Retry the snapshot before adding players to the deal.
            </p>
            <div className="ffb-notice-actions">
              <button type="button" onClick={retry} className="ffb-btn">
                Retry rankings
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Below 1200px the evaluation rail stacks under both ledgers, so on
                a phone the verdict lands past the fold the moment it changes
                while focus stays in the combobox. This strip keeps the verdict
                pinned at the top of the page instead of scrolling the visitor
                away from the field they are typing in. */}
            {boardReady ? <TradeVerdictStrip result={result} hasBothSides={hasBothSides} /> : null}

            {/* The settings stay mounted while a board loads. A scoring change
                made with the arrow keys reloads the board on each press, and a
                skeleton over the whole desk took the radio, and focus, with it. */}
            <div className="ffb-work ffb-work-3">
              <LeagueSettings
                inSeason={inSeason}
                state={routeState}
                open={settingsOpen}
                onToggle={() => setSettingsOpen((current) => !current)}
                onChange={updateRouteState}
              />

              {boardReady ? (
                <section aria-labelledby="trade-ledger-title" className="ffb-stack ffb-stack-tight">
                  <div className="ffb-sechead ffb-sechead-ctl">
                    <h2 id="trade-ledger-title" className="ffb-h3">
                      Trade ledger
                    </h2>
                    <div className="ffb-cluster ffb-tr-actions">
                      <button
                        type="button"
                        onClick={trade.swapSides}
                        disabled={!hasBothSides}
                        className="ffb-btn"
                      >
                        Swap
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (resetArmed) {
                            refocusAfterClear.current = true;
                            trade.clear();
                            setResetArmed(false);
                          } else {
                            setResetArmed(true);
                          }
                        }}
                        disabled={clearDisabled}
                        aria-label={resetArmed ? "Confirm clear trade" : "Clear trade"}
                        className={`ffb-btn ${resetArmed ? "ffb-btn-danger" : "ffb-btn-quiet"}`}
                      >
                        {resetArmed ? "Confirm clear" : "Clear"}
                      </button>
                    </div>
                  </div>

                  <div className="ffb-columns ffb-tr-sides">
                    <TradePackageFieldset
                      legend="You give"
                      description="The players leaving your roster."
                      playerIds={trade.givePlayerIds}
                      players={players}
                      excludedPlayerIds={allSelected}
                      evaluation={result?.sideA ?? null}
                      exactValuesAvailable={valuesAvailable}
                      marksHeldPlayers={marksHeldPlayers}
                      searchRef={giveSearchRef}
                      onAdd={(playerId) => trade.addPlayer("give", playerId)}
                      onRemove={(playerId) => trade.removePlayer("give", playerId)}
                    />
                    <TradePackageFieldset
                      legend="You get"
                      description="The players joining your roster."
                      playerIds={trade.getPlayerIds}
                      players={players}
                      excludedPlayerIds={allSelected}
                      evaluation={result?.sideB ?? null}
                      exactValuesAvailable={valuesAvailable}
                      marksHeldPlayers={marksHeldPlayers}
                      onAdd={(playerId) => trade.addPlayer("get", playerId)}
                      onRemove={(playerId) => trade.removePlayer("get", playerId)}
                    />
                  </div>

                  <p className="ffb-method">
                    {`${players.length} players available in ${FANTASY_SCORING_LABELS[routeState.scoring]}.`}{" "}
                    Up to {FANTASY_TRADE_MAX_PLAYERS_PER_SIDE} players per side. Unequal offers assume each extra player displaces a replacement-level roster spot.
                  </p>
                </section>
              ) : (
                <div role="status" aria-label="Loading the overall board" className="ffb-stack">
                  <span className="ffb-skel ffb-tr-skel-line" />
                  <div className="ffb-columns ffb-tr-sides">
                    <span className="ffb-skel ffb-tr-skel-field" />
                    <span className="ffb-skel ffb-tr-skel-field" />
                  </div>
                </div>
              )}

              {boardReady ? (
                <TradeResultRail
                  inSeason={inSeason}
                  result={result}
                  hasBothSides={hasBothSides}
                  valuesAvailable={valuesAvailable}
                  giveCount={trade.givePlayerIds.length}
                  getCount={trade.getPlayerIds.length}
                  teams={routeState.teams}
                  rosterSize={routeState.rosterSize}
                />
              ) : (
                <div className="ffb-stack" aria-hidden="true">
                  <span className="ffb-skel ffb-tr-skel-line" />
                  <span className="ffb-skel ffb-tr-skel-block" />
                </div>
              )}
            </div>

            {/* Inside the same shell as the verdict strip, so on a phone the
                strip stays pinned down through the package table. The table
                has nothing to compare until both sides hold a player. */}
            {boardReady && hasBothSides ? (
              <TradeRosterImpact
                result={result}
                valuesAvailable={valuesAvailable}
                giveCount={trade.givePlayerIds.length}
                getCount={trade.getPlayerIds.length}
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
