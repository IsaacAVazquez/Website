"use client";

import { useIsClient } from "@/hooks/useIsClient";
import { ArrowLeftRight, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SeasonalScopeNote } from "@/components/fantasy/SeasonalScopeNote";
import { Breadcrumbs, createBreadcrumbItems } from "@/components/navigation/Breadcrumbs";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { useFantasyTradeCalculator } from "@/hooks/useFantasyTradeCalculator";
import { FANTASY_SCORING_LABELS } from "@/lib/fantasy";
import {
  evaluateFantasyTrade,
  type FantasyTradeEvaluation,
  type FantasyTradeLeagueSettings,
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
import { TradeResultRail, TradeVerdictStrip } from "./trade-result-rail";
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

const BREADCRUMBS = createBreadcrumbItems([
  { label: "Home", href: "/" },
  { label: "Fantasy Football", href: "/fantasy-football" },
  { label: "Trade Calculator", href: "/fantasy-football/trade-calculator" },
]);

// Clearing the deal cannot be undone, so the button arms first. Left alone it
// disarms again, or the two-step guard quietly degrades into a one-click wipe
// the next time the visitor comes back to the page.
const RESET_ARM_TIMEOUT_MS = 5000;

// The provider publishes the market window's end as a date, normalised to
// midnight UTC by the builder, so the note prints it as a date in UTC rather
// than letting a US timezone roll it back a day.
function formatMarketDate(asOf: string | null | undefined): string | null {
  if (!asOf) return null;
  const parsed = new Date(asOf);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

// Inline in the note's prose, but the trade calculator's contract is 44px on every
// control, so the links carry the touch floor with negative vertical margins
// that keep the line rhythm of the surrounding sentence.
const SCOPE_LINK_CLASS =
  "inline-flex min-h-touch items-center -my-[var(--c97-sp-1)] underline decoration-[var(--c97-accent)] underline-offset-4";

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
    <label className="block">
      <span className="c97-kicker">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="c97-field transition-[border-color] focus:border-[var(--c97-accent)]" style={{ paddingInline: "var(--c97-sp-1)", marginTop: "var(--c97-sp-0)" }}
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
  onChange,
}: {
  state: TradeCalculatorSearchState;
  onChange: (state: TradeCalculatorSearchState) => void;
}) {
  return (
    <aside
      aria-label="League settings"
      className="border border-[var(--c97-rule)] bg-[var(--c97-field)] lg:sticky lg:top-0 lg:self-start" style={{ padding: "var(--c97-sp-2)" }}
    >
      <div className="border-b border-[var(--c97-rule)]" style={{ paddingBottom: "var(--c97-sp-1)" }}>
        <h2 className="c97-serif c97-h3">
          League settings
        </h2>
        <p className="text-xs leading-5 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
          These settings move the starter and bench replacement lines.
        </p>
      </div>

      <fieldset style={{ marginTop: "var(--c97-sp-2)" }}>
        <legend className="c97-kicker">
          Scoring
        </legend>
        <div className="grid" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-0)" }}>
          {(["ppr", "half_ppr", "standard"] as const).map((scoring) => (
            <label
              key={scoring}
              className="flex min-h-touch cursor-pointer items-center border text-sm font-semibold transition-[border-color,background-color]"
              style={
                { paddingInline: "var(--c97-sp-1)", gap: "var(--c97-sp-1)", ...(state.scoring === scoring
                  ? {
                      borderColor: "var(--c97-accent)",
                      background:
                        "color-mix(in srgb, var(--c97-accent) 10%, var(--c97-surface))",
                    }
                  : {
                      borderColor: "var(--c97-rule)",
                      background: "var(--c97-surface)",
                    }) }
              }
            >
              <input
                type="radio"
                name="trade-scoring"
                value={scoring}
                checked={state.scoring === scoring}
                onChange={() => onChange({ ...state, scoring })}
                className="h-4 w-4 accent-[var(--c97-accent)]"
              />
              {FANTASY_SCORING_LABELS[scoring]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 lg:grid-cols-1" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
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
      </div>

      <label className="block" style={{ marginTop: "var(--c97-sp-2)" }}>
        <span className="c97-kicker">
          Starting lineup
        </span>
        <select
          value={state.lineup}
          onChange={(event) =>
            onChange({
              ...state,
              lineup: event.target.value as TradeCalculatorSearchState["lineup"],
            })
          }
        className="c97-field transition-[border-color] focus:border-[var(--c97-accent)]" style={{ paddingInline: "var(--c97-sp-1)", marginTop: "var(--c97-sp-0)" }}
        >
          {REDRAFT_LINEUP_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <div className="border-t border-[var(--c97-rule)]" style={{ paddingTop: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
        <p className="c97-kicker">
          Supported format
        </p>
        <p className="text-xs leading-5 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
          Preseason managed redraft with one starting QB. Dynasty, picks, keepers, IDP, Superflex, and tight end premium are not modeled.
        </p>
      </div>
    </aside>
  );
}

function LoadingCard({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`c97-skeleton ${className}`} />
  );
}

export function TradeCalculatorClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHydrated = useIsClient();
  const routeState = useMemo(
    () => normalizeTradeCalculatorState(searchParams),
    [searchParams]
  );
  const { snapshot, players, isLoading, error, retry } = useFantasySnapshot({
    scoring: routeState.scoring,
    all: true,
  });
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
    if (!pendingShare || !snapshot) return;
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
  }, [pendingShare, players, replaceDeal, snapshot]);

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
      router.replace(nextHref, { scroll: false });
    }
  }, [pendingShare, router, searchParams, trade.getPlayerIds, trade.givePlayerIds]);

  const updateRouteState = (next: TradeCalculatorSearchState) => {
    setResetArmed(false);
    router.replace(buildTradeCalculatorHref(next, searchParams), { scroll: false });
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
    });
  }, [hasBothSides, league, snapshot, trade.getPlayerIds, trade.givePlayerIds]);
  // The chip covers BOTH inputs. Reading only the expert board let it say
  // "fresh sources" while the verdict was withheld for a stale draft market.
  const expertFreshness: FantasySnapshotStaleness = snapshot
    ? getSnapshotStaleness(snapshot.upstreamUpdatedAt)
    : "stale";
  const marketFreshness: FantasySnapshotStaleness = !snapshot?.adpSource
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
  // The declared scope is a preseason one-QB redraft model and its market leg
  // is mock-draft ADP. The provider kept stamping that feed after the 2026
  // kickoff, so the engine gates on the feed's age rather than the calendar:
  // while the feed is current it prices a draft market at limited coverage
  // (evaluateFantasyTrade pushes FANTASY_TRADE_IN_SEASON_WARNING from Week 1),
  // and once the feed stops it withholds. The note below names which of those
  // two states the page is in, so neither reads as a breakage.
  const seasonWeek = snapshot ? getNflRegularSeasonWeek(snapshot.season) : 0;
  const marketDate = formatMarketDate(snapshot?.adpSource?.asOf);
  const valuesAvailable = Boolean(result && result.coverage !== "insufficient");
  const allSelected = useMemo(
    () => new Set([...trade.givePlayerIds, ...trade.getPlayerIds]),
    [trade.getPlayerIds, trade.givePlayerIds]
  );

  const clearDisabled = trade.givePlayerIds.length + trade.getPlayerIds.length === 0;

  return (
    <section
      className="c97-dash relative overflow-x-clip min-h-dvh"
      aria-label="Fantasy football trade calculator"
      data-testid="fantasy-trade-calculator-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <div className={SHELL_CLASS} style={{ paddingBlock: "var(--c97-sp-2)" }}>
        <Breadcrumbs customItems={BREADCRUMBS} />
      </div>

      <section
        className="c97-sheet"
        data-c97-surface={`ink-${PROJECT_PRESS["/fantasy-football/trade-calculator"].lead}`}
        data-seam="torn"
      >
        <div className={SHELL_CLASS} style={{ paddingBlock: "var(--c97-sp-5)" }}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between" style={{ gap: "var(--c97-sp-2)" }}>
            <div className="max-w-3xl">
              <h1 className="c97-poster">Build a Trade Offer</h1>
              <p className="c97-lead" style={{ marginTop: "var(--c97-sp-3)", maxInlineSize: "68ch" }}>
                Compare both sides of a one-QB redraft trade using expert consensus, mock-draft ADP, and your league’s scoring, size, and lineup. The result shows where the estimate is strong and where the data is thin.
              </p>
            </div>
            {/* Every status colour is ink on the green sheet, so the source
                line, which turns stale in the negative ink, prints on paper. */}
            <div
              data-c97-surface="paper"
              className="c97-offset lg:max-w-[28rem]"
              style={{ padding: "var(--c97-sp-3)" }}
            >
              <p className="c97-meta" style={{ display: "block", lineHeight: 1.8 }}>
                <span>Expert board {formatUpdatedAt(snapshot?.upstreamUpdatedAt)}</span>
                <span aria-hidden="true"> · </span>
                <span>Draft market {formatUpdatedAt(snapshot?.adpSource?.asOf)}</span>
                <span aria-hidden="true"> · </span>
                <span style={{ color: sourceFreshness === "stale" ? "var(--c97-negative)" : undefined }}>
                  {sourceFreshness} sources
                </span>
              </p>
              <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
                <span className="inline-flex min-h-touch items-center font-mono text-2xs uppercase tracking-[0.1em] text-[var(--c97-ink)]" style={{ gap: "var(--c97-sp-1)" }}>
                  <ShieldCheck className="h-4 w-4 text-[var(--c97-accent)]" aria-hidden="true" />
                  Preseason redraft · Model v1
                </span>
                <Link
                  href={`/fantasy-football?position=overall&scoring=${routeState.scoring}`}
                  className="inline-flex min-h-touch items-center border border-[var(--c97-rule)] bg-[var(--c97-surface)] px-[var(--c97-sp-2)] text-sm font-semibold text-[var(--c97-ink)] transition-[border-color,background-color] hover:border-[var(--c97-accent)] hover:bg-[var(--c97-field)]"
                >
                  View rankings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className={`${SHELL_CLASS} flex flex-col`} style={{ paddingBlock: "var(--c97-sp-3)", gap: "var(--c97-sp-2)" }}>
        {seasonWeek >= 1 && snapshot ? (
          <SeasonalScopeNote season={snapshot.season} week={seasonWeek}>
            {marketFreshness === "stale" ? (
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
            <Link href="/fantasy-football/weekly" className={SCOPE_LINK_CLASS}>
              weekly board
            </Link>
            , and this week&rsquo;s pickups are on the{" "}
            <Link href="/fantasy-football/waivers" className={SCOPE_LINK_CLASS}>
              waivers page
            </Link>
            .
          </SeasonalScopeNote>
        ) : null}

        {trade.persistenceStatus === "memory-only" ? (
          <div
            role="status"
            className="border text-sm"
            style={{
              paddingInline: "var(--c97-sp-2)",
              paddingBlock: "var(--c97-sp-1)",
              borderColor: "color-mix(in srgb, var(--c97-warning) 45%, var(--c97-rule))",
              background: "color-mix(in srgb, var(--c97-warning) 8%, var(--c97-surface))",
            }}
          >
            <p className="font-semibold text-[var(--c97-ink)]">Browser storage is unavailable.</p>
            <p className="text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
              This trade will work in the current tab, but it will not survive a reload.
            </p>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="border border-[var(--c97-negative)] bg-[var(--c97-surface)]" style={{ padding: "var(--c97-sp-2)" }}
          >
            <p className="font-semibold text-[var(--c97-negative)]">{error}</p>
            <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
              Retry the snapshot before adding players to the deal.
            </p>
            <button
              type="button"
              onClick={retry}
              className="c97-btn c97-btn-invert"
              style={{ marginTop: "var(--c97-sp-2)" }}
            >
              Retry rankings
            </button>
          </div>
        ) : isLoading || pendingShare ? (
          // Route-level loading.tsx only covers navigation. This keeps the
          // page from rendering empty comboboxes while the snapshot loads or
          // while a shared link's deal is still being applied.
          <div
            role="status"
            aria-label="Loading the overall board"
            className="grid items-start lg:grid-cols-[15rem_minmax(0,1fr)_20rem]" style={{ gap: "var(--c97-sp-2)" }}
          >
            <LoadingCard className="h-[30rem]" />
            <div className="grid min-w-0 xl:grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
              <LoadingCard className="h-[24rem]" />
              <LoadingCard className="h-[24rem]" />
            </div>
            <LoadingCard className="h-[30rem]" />
          </div>
        ) : (
          <>
            {/* Below lg the evaluation rail stacks under both ledgers, so on a
                phone the verdict lands past the fold the moment it changes
                while focus stays in the combobox. This strip keeps the verdict
                pinned under the site header instead of scrolling the visitor
                away from the field they are typing in. */}
            <TradeVerdictStrip result={result} hasBothSides={hasBothSides} />

            <div className="grid items-start lg:grid-cols-[15rem_minmax(0,1fr)_20rem]" style={{ gap: "var(--c97-sp-2)" }}>
              <LeagueSettings state={routeState} onChange={updateRouteState} />

              <section aria-labelledby="trade-ledger-title" className="min-w-0">
                <div className="flex flex-wrap items-center justify-between" style={{ marginBottom: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                  <div>
                    <h2 id="trade-ledger-title" className="c97-serif c97-h3">
                      Trade ledger
                    </h2>
                    <p className="text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)" }}>
                      {`${players.length} players available in ${FANTASY_SCORING_LABELS[routeState.scoring]}.`}
                    </p>
                  </div>
                  <div className="flex items-center" style={{ gap: "var(--c97-sp-0)" }}>
                    <button
                      type="button"
                      onClick={trade.swapSides}
                      disabled={!hasBothSides}
                      className="inline-flex min-h-touch items-center border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-sm font-semibold text-[var(--c97-ink)] transition-[border-color,background-color,color] hover:border-[var(--c97-accent)] hover:bg-[var(--c97-field)] disabled:cursor-not-allowed disabled:border-dashed disabled:border-[var(--c97-ink-2)] disabled:bg-transparent disabled:text-[var(--c97-ink-2)] disabled:hover:border-[var(--c97-ink-2)] disabled:hover:bg-transparent" style={{ paddingInline: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
                    >
                      <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                      Swap
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (resetArmed) {
                          trade.clear();
                          setResetArmed(false);
                        } else {
                          setResetArmed(true);
                        }
                      }}
                      disabled={clearDisabled}
                      aria-label={resetArmed ? "Confirm clear trade" : "Clear trade"}
                      className="inline-flex min-h-touch items-center border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-sm font-semibold transition-[border-color,background-color,color] hover:bg-[var(--c97-field)] disabled:cursor-not-allowed disabled:border-dashed disabled:border-[var(--c97-ink-2)] disabled:bg-transparent disabled:hover:bg-transparent"
                      style={{
                        paddingInline: "var(--c97-sp-1)",
                        gap: "var(--c97-sp-1)",
                        color: clearDisabled
                          ? "var(--c97-ink-2)"
                          : resetArmed
                            ? "var(--c97-negative)"
                            : "var(--c97-ink)",
                      }}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      {resetArmed ? "Confirm clear" : "Clear"}
                    </button>
                  </div>
                </div>

                <div className="grid min-w-0 xl:grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
                  <TradePackageFieldset
                    legend="You give"
                    description="The players leaving your roster."
                    playerIds={trade.givePlayerIds}
                    players={players}
                    excludedPlayerIds={allSelected}
                    evaluation={result?.sideA ?? null}
                    exactValuesAvailable={valuesAvailable}
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
                    onAdd={(playerId) => trade.addPlayer("get", playerId)}
                    onRemove={(playerId) => trade.removePlayer("get", playerId)}
                  />
                </div>

                <p className="text-xs leading-5 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                  Up to {FANTASY_TRADE_MAX_PLAYERS_PER_SIDE} players per side. Unequal offers assume each extra player displaces a replacement-level roster spot.
                </p>
              </section>

              <TradeResultRail
                result={result}
                hasBothSides={hasBothSides}
                valuesAvailable={valuesAvailable}
                giveCount={trade.givePlayerIds.length}
                getCount={trade.getPlayerIds.length}
              />
            </div>

            {/* Inside the same shell as the verdict strip, so on a phone the
                strip stays pinned down through the package table. */}
            <TradeRosterImpact
              result={result}
              valuesAvailable={valuesAvailable}
              giveCount={trade.givePlayerIds.length}
              getCount={trade.getPlayerIds.length}
            />
          </>
        )}
      </div>
      </section>
    </section>
  );
}
