"use client";

import { ArrowLeftRight, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Breadcrumbs, createBreadcrumbItems } from "@/components/navigation/Breadcrumbs";
import { useFantasySnapshot } from "@/hooks/useFantasySnapshot";
import { useFantasyTradeCalculator } from "@/hooks/useFantasyTradeCalculator";
import { FANTASY_SCORING_LABELS } from "@/lib/fantasy";
import {
  evaluateFantasyTrade,
  type FantasyTradeEvaluation,
  type FantasyTradeLeagueSettings,
} from "@/lib/fantasyTrade";
import { FANTASY_TRADE_MAX_PLAYERS_PER_SIDE } from "@/lib/fantasyTradePersistence";
import { formatUpdatedAt, getSnapshotStaleness } from "@/lib/fantasyUtils";
import { REDRAFT_LINEUP_PRESETS } from "@/lib/redraftLineup";
import { TradePackageFieldset } from "./trade-package-fieldset";
import { TradeResultRail } from "./trade-result-rail";
import { TradeRosterImpact } from "./trade-roster-impact";
import {
  buildTradeCalculatorHref,
  normalizeTradeCalculatorState,
  TRADE_CALCULATOR_ROSTER_SIZES,
  TRADE_CALCULATOR_TEAM_COUNTS,
  type TradeCalculatorSearchState,
} from "./trade-calculator-state";

const BREADCRUMBS = createBreadcrumbItems([
  { label: "Home", href: "/" },
  { label: "Fantasy Football", href: "/fantasy-football" },
  { label: "Trade Calculator", href: "/fantasy-football/trade-calculator" },
]);

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

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
      <span className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 min-h-touch w-full rounded-[var(--radius-lg)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm text-[var(--home-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--home-signal)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--home-signal)_22%,transparent)]"
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
      className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 lg:sticky lg:top-24 lg:self-start"
    >
      <div className="border-b border-[var(--home-rule)] pb-3">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--home-ink)]">
          League settings
        </h2>
        <p className="mt-1 text-xs leading-5 text-[var(--home-ink-muted)]">
          These settings move the starter and bench replacement lines.
        </p>
      </div>

      <fieldset className="mt-4">
        <legend className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
          Scoring
        </legend>
        <div className="mt-2 grid gap-1.5">
          {(["ppr", "half_ppr", "standard"] as const).map((scoring) => (
            <label
              key={scoring}
              className="flex min-h-touch cursor-pointer items-center gap-2 rounded-[var(--radius-lg)] border px-3 text-sm font-semibold transition-[border-color,background-color]"
              style={
                state.scoring === scoring
                  ? {
                      borderColor: "var(--home-signal)",
                      background:
                        "color-mix(in srgb, var(--home-signal) 10%, var(--home-paper))",
                    }
                  : {
                      borderColor: "var(--home-rule)",
                      background: "var(--home-paper)",
                    }
              }
            >
              <input
                type="radio"
                name="trade-scoring"
                value={scoring}
                checked={state.scoring === scoring}
                onChange={() => onChange({ ...state, scoring })}
                className="h-4 w-4 accent-[var(--home-signal)]"
              />
              {FANTASY_SCORING_LABELS[scoring]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
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

      <label className="mt-4 block">
        <span className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
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
          className="mt-1.5 min-h-touch w-full rounded-[var(--radius-lg)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm text-[var(--home-ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--home-signal)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--home-signal)_22%,transparent)]"
        >
          {REDRAFT_LINEUP_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 border-t border-[var(--home-rule)] pt-3">
        <p className="font-mono text-3xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
          Supported format
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--home-ink-muted)]">
          Preseason managed redraft with one starting QB. Dynasty, picks, keepers, IDP, Superflex, and tight end premium are not modeled.
        </p>
      </div>
    </aside>
  );
}

export function TradeCalculatorClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const routeState = useMemo(
    () => normalizeTradeCalculatorState(searchParams),
    [searchParams]
  );
  const { snapshot, players, isLoading, error, retry } = useFantasySnapshot({
    scoring: routeState.scoring,
    all: true,
  });
  const season = snapshot?.season ?? new Date().getUTCFullYear();
  const trade = useFantasyTradeCalculator(season, routeState.scoring);
  const [resetArmed, setResetArmed] = useState(false);

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
  const sourceFreshness = snapshot
    ? getSnapshotStaleness(snapshot.upstreamUpdatedAt)
    : "stale";
  const valuesAvailable = Boolean(result && result.coverage !== "insufficient");
  const allSelected = useMemo(
    () => new Set([...trade.givePlayerIds, ...trade.getPlayerIds]),
    [trade.getPlayerIds, trade.givePlayerIds]
  );

  return (
    <section
      className="home-page home-dash min-h-screen"
      aria-label="Fantasy football trade calculator"
      data-testid="fantasy-trade-calculator-shell"
      data-hydrated={isHydrated ? "true" : "false"}
    >
      <div className="home-shell home-shell-wide home-section space-y-5">
        <Breadcrumbs customItems={BREADCRUMBS} className="!py-0" />

        <header className="border-b border-[var(--home-rule)] pb-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1
                className="max-w-[15ch] text-[clamp(2.25rem,1.7rem+2.5vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[var(--home-ink)]"
              >
                Build a Trade Calculator
              </h1>
              <p className="mt-4 max-w-[68ch] text-base leading-7 text-[var(--home-ink-muted)]">
                Compare both sides of a one-QB redraft trade using expert consensus, mock-draft ADP, and your league’s scoring, size, and lineup. The result shows where the estimate is strong and where the data is thin.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-touch items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-3 font-mono text-2xs uppercase tracking-[0.1em] text-[var(--home-ink)]">
                <ShieldCheck className="h-4 w-4 text-[var(--home-signal)]" aria-hidden="true" />
                Preseason redraft · Model v1
              </span>
              <Link
                href={`/fantasy-football?position=overall&scoring=${routeState.scoring}`}
                className="inline-flex min-h-touch items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 text-sm font-semibold text-[var(--home-ink)] transition-[border-color,background-color] hover:border-[var(--home-signal)] hover:bg-[var(--home-paper-alt)]"
              >
                View rankings
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-2xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
            <span>Expert board {formatUpdatedAt(snapshot?.upstreamUpdatedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>Draft market {formatUpdatedAt(snapshot?.adpSource?.asOf)}</span>
            <span aria-hidden="true">·</span>
            <span style={{ color: sourceFreshness === "stale" ? "var(--home-negative)" : undefined }}>
              {sourceFreshness} source
            </span>
          </div>
        </header>

        {trade.persistenceStatus === "memory-only" ? (
          <div
            role="status"
            className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--home-warning) 45%, var(--home-rule))",
              background: "color-mix(in srgb, var(--home-warning) 8%, var(--home-paper))",
            }}
          >
            <p className="font-semibold text-[var(--home-ink)]">Browser storage is unavailable.</p>
            <p className="mt-1 text-[var(--home-ink-muted)]">
              This trade will work in the current tab, but it will not survive a reload.
            </p>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-[var(--radius-3xl)] border border-[var(--home-negative)] bg-[var(--home-paper)] p-5"
          >
            <p className="font-semibold text-[var(--home-negative)]">{error}</p>
            <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
              Retry the snapshot before adding players to the deal.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 inline-flex min-h-touch items-center rounded-full bg-[var(--home-ink)] px-4 text-sm font-semibold text-[var(--home-paper)]"
            >
              Retry rankings
            </button>
          </div>
        ) : (
          <>
            <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_20rem]">
              <LeagueSettings state={routeState} onChange={updateRouteState} />

              <section aria-labelledby="trade-ledger-title" className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 id="trade-ledger-title" className="text-xl font-semibold tracking-[-0.03em] text-[var(--home-ink)]">
                      Trade ledger
                    </h2>
                    <p className="mt-1 text-sm text-[var(--home-ink-muted)]">
                      {isLoading
                        ? "Loading the overall board…"
                        : `${players.length} players available in ${FANTASY_SCORING_LABELS[routeState.scoring]}.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={trade.swapSides}
                      disabled={!hasBothSides}
                      className="inline-flex min-h-touch items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm font-semibold text-[var(--home-ink)] transition-[border-color,background-color] hover:border-[var(--home-signal)] hover:bg-[var(--home-paper-alt)] disabled:cursor-not-allowed disabled:opacity-45"
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
                      disabled={trade.givePlayerIds.length + trade.getPlayerIds.length === 0}
                      aria-label={resetArmed ? "Confirm clear trade" : "Clear trade"}
                      className="inline-flex min-h-touch items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-sm font-semibold transition-[border-color,background-color,color] hover:bg-[var(--home-paper-alt)] disabled:cursor-not-allowed disabled:opacity-45"
                      style={{ color: resetArmed ? "var(--home-negative)" : "var(--home-ink)" }}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      {resetArmed ? "Confirm clear" : "Clear"}
                    </button>
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 xl:grid-cols-2">
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

                <p className="mt-3 text-xs leading-5 text-[var(--home-ink-muted)]">
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
  );
}
