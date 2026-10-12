"use client";

import { startTransition, useEffect, useMemo, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { SHORT_DATE_FORMATTER, formatUpdatedAt } from "@/lib/date-formatters";
import { useLocalStorageString } from "@/hooks/useLocalStorageString";
import { readBrowserStorageString, writeBrowserStorageJson } from "@/lib/browserStorage";
import {
  buildFantasyFormula1Assets,
  EMPTY_FANTASY_FORMULA1_LINEUP,
  FANTASY_FORMULA1_BUDGET,
  FANTASY_FORMULA1_CONSTRUCTOR_SLOTS,
  FANTASY_FORMULA1_DRIVER_SLOTS,
  getFantasyFormula1StorageKey,
  optimizeFantasyFormula1Lineups,
  sanitizeFantasyFormula1Lineup,
  summarizeFantasyFormula1Lineup,
} from "@/lib/fantasyFormula1";
import type { Formula1Summary } from "@/types/formula1";
import type {
  FantasyFormula1Asset,
  FantasyFormula1Lineup,
  FantasyFormula1OptimizationCandidate,
} from "@/types/fantasyFormula1";
import { GarageSignature } from "./GarageSignature";
import { normaliseTeamColor } from "@/lib/formula1TeamColor";
import { formatMoney } from "./garage";
import "./fantasy-formula-1.css";
import {
  buildFantasyFormula1Href,
  FANTASY_FORMULA1_FOCUS_OPTIONS,
  FANTASY_FORMULA1_ROUTE,
  FANTASY_FORMULA1_SORT_LABELS,
  FANTASY_FORMULA1_SORT_OPTIONS,
  normalizeFantasyFormula1State,
  type FantasyFormula1Focus,
  type FantasyFormula1RouteState,
  type FantasyFormula1Sort,
} from "./fantasy-formula-1-state";

interface FantasyFormula1ClientProps {
  initialState: FantasyFormula1RouteState;
  summary: Formula1Summary;
}

function formatStamp(value: string | null | undefined): string {
  return value ? formatUpdatedAt(value) : "Unavailable";
}

function formatDay(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "a date to be set" : SHORT_DATE_FORMATTER.format(date);
}

function formatPoints(value: number): string {
  return value.toFixed(1);
}

function getTeamAccentStyle(teamColor: string | null): CSSProperties {
  return { boxShadow: `inset 4px 0 0 ${normaliseTeamColor(teamColor) ?? "var(--ff1-ink-2)"}` };
}

function AssetAvatar({ asset }: { asset: FantasyFormula1Asset }) {
  if (asset.headshotUrl) {
    return (
      <span className="ff1-avatar">
        <img src={asset.headshotUrl} alt="" loading="lazy" decoding="async" />
      </span>
    );
  }

  return <span className="ff1-avatar">{asset.shortName.slice(0, 3)}</span>;
}

function SortAndFocusControls({
  activeSort,
  activeFocus,
  onSort,
  onFocus,
}: {
  activeSort: FantasyFormula1Sort;
  activeFocus: FantasyFormula1Focus;
  onSort: (sort: FantasyFormula1Sort) => void;
  onFocus: (focus: FantasyFormula1Focus) => void;
}) {
  return (
    <div className="ff1-controls">
      <div className="ff1-switch" role="group" aria-label="Sort assets by">
        {FANTASY_FORMULA1_SORT_OPTIONS.map((sort) => (
          <button key={sort} type="button" aria-pressed={sort === activeSort} onClick={() => onSort(sort)}>
            {FANTASY_FORMULA1_SORT_LABELS[sort]}
          </button>
        ))}
      </div>
      <div className="ff1-switch" role="group" aria-label="Filter assets by kind">
        {FANTASY_FORMULA1_FOCUS_OPTIONS.map((focus) => {
          const isActive = focus === activeFocus;
          return (
            <button
              key={focus}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFocus(isActive ? null : focus)}
            >
              {focus === "drivers" ? "Drivers" : "Constructors"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LineupCard({
  candidate,
  isCurrent,
  onApply,
}: {
  candidate: FantasyFormula1OptimizationCandidate;
  isCurrent: boolean;
  onApply: (candidate: FantasyFormula1OptimizationCandidate) => void;
}) {
  return (
    <li className="ff1-card" data-current={isCurrent ? "true" : undefined}>
      <p className="ff1-card-head">
        <span>Option {candidate.rank}</span>
        <span className="ff1-card-points">{formatPoints(candidate.projectedPoints)} pts</span>
        <span>value {formatPoints(candidate.valueRating)}</span>
      </p>
      <p className="ff1-card-drivers">{candidate.drivers.map((asset) => asset.shortName).join(" · ")}</p>
      <p className="ff1-card-meta">{candidate.constructors.map((asset) => asset.name).join(" · ")}</p>
      <p className="ff1-card-meta ff1-mono">
        {formatMoney(candidate.totalPrice)} · {formatMoney(candidate.budgetRemaining)} left
      </p>
      {isCurrent ? (
        <p className="ff1-card-current">Your team</p>
      ) : (
        <button
          type="button"
          className="ff1-btn"
          aria-label={`Use option ${candidate.rank}`}
          onClick={() => onApply(candidate)}
        >
          <Sparkles size={16} aria-hidden="true" />
          Use
        </button>
      )}
    </li>
  );
}

function LineupCards({
  candidates,
  selectedIds,
  onApply,
}: {
  candidates: FantasyFormula1OptimizationCandidate[];
  selectedIds: Set<string>;
  onApply: (candidate: FantasyFormula1OptimizationCandidate) => void;
}) {
  return (
    <section className="ff1-lineups" aria-labelledby="ff1-lineups-heading" data-testid="fantasy-formula-1-lineups">
      <h2 id="ff1-lineups-heading" className="ff1-h2">
        Best model lineups
      </h2>
      {candidates.length > 0 ? (
        <ol className="ff1-cards">
          {candidates.map((candidate) => (
            <LineupCard
              key={`${candidate.rank}-${candidate.assets.map((asset) => asset.id).join("-")}`}
              candidate={candidate}
              isCurrent={
                selectedIds.size === candidate.assets.length &&
                candidate.assets.every((asset) => selectedIds.has(asset.id))
              }
              onApply={onApply}
            />
          ))}
        </ol>
      ) : (
        <p className="ff1-empty">
          No valid optimized lineup is available. Unlock a few picks or reset the team, since the
          optimizer only returns complete lineups inside the budget.
        </p>
      )}
    </section>
  );
}

function AssetAction({
  asset,
  selected,
  disabled,
  onAdd,
  onRemove,
}: {
  asset: FantasyFormula1Asset;
  selected: boolean;
  disabled: boolean;
  onAdd: (asset: FantasyFormula1Asset) => void;
  onRemove: (asset: FantasyFormula1Asset) => void;
}) {
  if (selected) {
    return (
      <button type="button" className="ff1-btn" aria-label={`Remove ${asset.name}`} onClick={() => onRemove(asset)}>
        <Trash2 size={15} aria-hidden="true" />
        Remove
      </button>
    );
  }

  return (
    <button
      type="button"
      className="ff1-btn ff1-btn-add"
      disabled={disabled}
      aria-label={`Add ${asset.name}`}
      onClick={() => onAdd(asset)}
    >
      <Plus size={15} aria-hidden="true" />
      Add
    </button>
  );
}

const RISK_CLASS = { low: "ff1-risk-low", medium: "ff1-risk-medium", high: "ff1-risk-high" } as const;

function AssetsTable({
  assets,
  selectedIds,
  lineup,
  onAdd,
  onRemove,
}: {
  assets: FantasyFormula1Asset[];
  selectedIds: Set<string>;
  lineup: FantasyFormula1Lineup;
  onAdd: (asset: FantasyFormula1Asset) => void;
  onRemove: (asset: FantasyFormula1Asset) => void;
}) {
  if (assets.length === 0) {
    return (
      <div className="ff1-empty">
        <p className="ff1-strong">No Formula 1 fantasy assets are available.</p>
        <p>
          The checked-in OpenF1 snapshot needs standings or a published race classification before
          this model can build a slate.
        </p>
      </div>
    );
  }

  return (
    <div className="ff1-table-scroll" role="region" aria-label="Formula 1 fantasy asset board" tabIndex={0}>
      {/* One table for both widths, so each Add button exists once. Below
          640px the middle columns are hidden and the asset cell carries them. */}
      <table className="ff1-table">
        <thead>
          <tr>
            <th scope="col">Asset</th>
            <th scope="col" className="hidden sm:table-cell">Type</th>
            <th scope="col" data-align="end" className="hidden sm:table-cell">Price</th>
            <th scope="col" data-align="end" className="hidden sm:table-cell">Projection</th>
            <th scope="col" data-align="end" className="hidden sm:table-cell">Value</th>
            <th scope="col" data-align="end" className="hidden sm:table-cell">Form</th>
            <th scope="col" className="hidden sm:table-cell">Risk</th>
            <th scope="col" data-align="end" className="ff1-col-action">
              Team
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const selected = selectedIds.has(asset.id);
            const slotFull =
              asset.kind === "driver"
                ? lineup.driverIds.length >= FANTASY_FORMULA1_DRIVER_SLOTS
                : lineup.constructorIds.length >= FANTASY_FORMULA1_CONSTRUCTOR_SLOTS;
            const standing = asset.standingPosition ? `P${asset.standingPosition}` : "Unranked";
            const risk = (
              <span className={`ff1-risk ${RISK_CLASS[asset.risk]}`}>
                {asset.risk}
              </span>
            );

            return (
              <tr key={asset.id} data-selected={selected ? "true" : undefined}>
                <td style={getTeamAccentStyle(asset.teamColor)}>
                  <div className="ff1-asset">
                    <AssetAvatar asset={asset} />
                    <div className="ff1-asset-text">
                      <p className="ff1-strong">{asset.name}</p>
                      <p className="ff1-asset-meta hidden sm:block">
                        {standing}
                        {asset.kind === "driver" && asset.teamName ? ` · ${asset.teamName}` : ""}
                      </p>
                    </div>
                  </div>
                  {/* A phone's row. The line that is always there has the two
                      numbers a pick turns on, and it opens the other columns. */}
                  <details className="ff1-more sm:hidden">
                    <summary>
                      <span>
                        <span className="sr-only">{asset.name}, </span>
                        {formatMoney(asset.price)} &middot; {formatPoints(asset.projectedPoints)} projected
                      </span>
                      <span className="ff1-more-toggle" aria-hidden="true">
                        <span data-when="closed">More</span>
                        <span data-when="open">Less</span>
                      </span>
                    </summary>
                    <dl className="ff1-more-list">
                      {(
                        [
                          ["Type", <span key="type" className="capitalize">{asset.kind}</span>],
                          ["Standing", standing],
                          ["Value", formatPoints(asset.valueRating)],
                          ["Form", formatPoints(asset.formScore)],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                      <div className="ff1-more-wide">
                        <dt>Risk</dt>
                        <dd>
                          {risk} {asset.riskReason}
                        </dd>
                      </div>
                    </dl>
                  </details>
                </td>
                <td className="hidden capitalize sm:table-cell">{asset.kind}</td>
                <td data-align="end" className="hidden sm:table-cell">{formatMoney(asset.price)}</td>
                <td data-align="end" className="hidden sm:table-cell">{formatPoints(asset.projectedPoints)}</td>
                <td data-align="end" className="hidden sm:table-cell">{formatPoints(asset.valueRating)}</td>
                <td data-align="end" className="hidden sm:table-cell">{formatPoints(asset.formScore)}</td>
                <td className="hidden sm:table-cell">
                  <span title={asset.riskReason}>
                    {risk}
                    <span className="sr-only">. {asset.riskReason}</span>
                  </span>
                </td>
                <td data-align="end">
                  <AssetAction
                    asset={asset}
                    selected={selected}
                    disabled={!selected && slotFull}
                    onAdd={onAdd}
                    onRemove={onRemove}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function sortFantasyFormula1Assets(assets: FantasyFormula1Asset[], sort: FantasyFormula1Sort): FantasyFormula1Asset[] {
  return [...assets].sort((left, right) => {
    switch (sort) {
      case "projection":
        return right.projectedPoints - left.projectedPoints || left.price - right.price;
      case "price":
        return right.price - left.price || right.projectedPoints - left.projectedPoints;
      case "form":
        return right.formScore - left.formScore || right.projectedPoints - left.projectedPoints;
      case "value":
      default:
        return right.valueRating - left.valueRating || right.projectedPoints - left.projectedPoints;
    }
  });
}

function parsePersistedLineup(value: string | null): FantasyFormula1Lineup | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<FantasyFormula1Lineup>;
    return {
      driverIds: Array.isArray(parsed.driverIds) ? parsed.driverIds : [],
      constructorIds: Array.isArray(parsed.constructorIds) ? parsed.constructorIds : [],
      lockedAssetIds: Array.isArray(parsed.lockedAssetIds) ? parsed.lockedAssetIds : [],
    };
  } catch {
    return null;
  }
}

export function FantasyFormula1Client({ initialState, summary: seasonSummary }: FantasyFormula1ClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasManagedParams =
    searchParams.get("sort") !== null || searchParams.get("focus") !== null;
  const routeState = useMemo(
    () => (hasManagedParams ? normalizeFantasyFormula1State(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );
  const assets = useMemo(() => buildFantasyFormula1Assets(seasonSummary), [seasonSummary]);
  const storageKey = getFantasyFormula1StorageKey(seasonSummary.season);
  const storedLineup = useLocalStorageString(storageKey);
  const lineup = useMemo(
    () => sanitizeFantasyFormula1Lineup(parsePersistedLineup(storedLineup) ?? EMPTY_FANTASY_FORMULA1_LINEUP, assets),
    [storedLineup, assets]
  );

  useEffect(() => {
    const currentQuery = searchParams.toString();
    const currentHref = `${FANTASY_FORMULA1_ROUTE}${currentQuery ? `?${currentQuery}` : ""}`;
    const normalizedHref = buildFantasyFormula1Href(routeState, searchParams);
    if (currentHref === normalizedHref) {
      return;
    }

    startTransition(() => {
      router.replace(normalizedHref, { scroll: false });
    });
  }, [routeState, router, searchParams]);

  function updateRouteState(nextState: Partial<FantasyFormula1RouteState>) {
    const nextRouteState = { ...routeState, ...nextState };

    startTransition(() => {
      router.push(buildFantasyFormula1Href(nextRouteState, searchParams), { scroll: false });
    });
  }

  function updateLineup(updater: (current: FantasyFormula1Lineup) => FantasyFormula1Lineup) {
    // Commit before rendering so an immediate reload keeps the edit. Read the
    // newest save first so a second tab's additions are included in this edit.
    const current = sanitizeFantasyFormula1Lineup(
      parsePersistedLineup(readBrowserStorageString(storageKey).value) ?? EMPTY_FANTASY_FORMULA1_LINEUP,
      assets
    );
    writeBrowserStorageJson(storageKey, sanitizeFantasyFormula1Lineup(updater(current), assets));
  }

  function addAsset(asset: FantasyFormula1Asset) {
    updateLineup((current) => {
      if (asset.kind === "driver") {
        if (current.driverIds.includes(asset.id) || current.driverIds.length >= FANTASY_FORMULA1_DRIVER_SLOTS) {
          return current;
        }

        return { ...current, driverIds: [...current.driverIds, asset.id] };
      }

      if (
        current.constructorIds.includes(asset.id) ||
        current.constructorIds.length >= FANTASY_FORMULA1_CONSTRUCTOR_SLOTS
      ) {
        return current;
      }

      return { ...current, constructorIds: [...current.constructorIds, asset.id] };
    });
  }

  function removeAsset(asset: FantasyFormula1Asset) {
    updateLineup((current) => ({
      driverIds: current.driverIds.filter((id) => id !== asset.id),
      constructorIds: current.constructorIds.filter((id) => id !== asset.id),
      lockedAssetIds: current.lockedAssetIds.filter((id) => id !== asset.id),
    }));
  }

  function toggleLock(asset: FantasyFormula1Asset) {
    updateLineup((current) => {
      const locked = current.lockedAssetIds.includes(asset.id);
      return {
        ...current,
        lockedAssetIds: locked
          ? current.lockedAssetIds.filter((id) => id !== asset.id)
          : [...current.lockedAssetIds, asset.id],
      };
    });
  }

  function applyCandidate(candidate: FantasyFormula1OptimizationCandidate) {
    // The locks come from the newest save too, so a lock made in another tab survives.
    updateLineup((current) => ({
      driverIds: candidate.drivers.map((asset) => asset.id),
      constructorIds: candidate.constructors.map((asset) => asset.id),
      lockedAssetIds: current.lockedAssetIds.filter((id) => candidate.assets.some((asset) => asset.id === id)),
    }));
  }

  function resetLineup() {
    updateLineup(() => EMPTY_FANTASY_FORMULA1_LINEUP);
  }

  const summary = useMemo(() => summarizeFantasyFormula1Lineup(assets, lineup), [assets, lineup]);
  const lockedIds = useMemo(() => new Set(lineup.lockedAssetIds), [lineup.lockedAssetIds]);
  const selectedIds = useMemo(
    () => new Set([...lineup.driverIds, ...lineup.constructorIds]),
    [lineup.constructorIds, lineup.driverIds]
  );
  const candidates = useMemo(() => optimizeFantasyFormula1Lineups(assets, lockedIds, 3), [assets, lockedIds]);
  const sortedAssets = useMemo(() => {
    const focusedAssets =
      routeState.focus === "drivers"
        ? assets.filter((asset) => asset.kind === "driver")
        : routeState.focus === "constructors"
          ? assets.filter((asset) => asset.kind === "constructor")
          : assets;

    return sortFantasyFormula1Assets(focusedAssets, routeState.sort);
  }, [assets, routeState.focus, routeState.sort]);

  const nextMeeting = seasonSummary.nextMeeting;
  const nextRaceStart = nextMeeting?.raceStartsAt ?? nextMeeting?.startAt ?? null;
  const statusLine = [
    `${seasonSummary.season} season`,
    `OpenF1 snapshot built ${formatStamp(seasonSummary.generatedAt)}`,
    nextMeeting ? `${nextMeeting.name}${nextRaceStart ? ` on ${formatDay(nextRaceStart)}` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="ff1-root">
      <div className="c97-shell c97-frame ff1-page">
        <header className="ff1-titlerow">
          <h1 className="ff1-title">Fantasy Formula 1</h1>
          <p className="ff1-standfirst">
            Pick five drivers and two constructors under a $100m budget, lock the ones you are sure
            of, and let the optimizer fill the rest.
          </p>
          <p className="ff1-status">{statusLine}</p>
        </header>

        <div className="ff1-builder">
          <GarageSignature
            summary={summary}
            budget={FANTASY_FORMULA1_BUDGET}
            lockedIds={lockedIds}
            onRemove={removeAsset}
            onToggleLock={toggleLock}
            onReset={resetLineup}
          />
          <LineupCards candidates={candidates} selectedIds={selectedIds} onApply={applyCandidate} />
        </div>

        <section className="ff1-slate" aria-labelledby="ff1-slate-heading" data-testid="fantasy-formula-1-shell">
          <div className="ff1-slate-toolbar">
            <h2 id="ff1-slate-heading" className="ff1-h2">
              Model slate
            </h2>
            <SortAndFocusControls
              activeSort={routeState.sort}
              activeFocus={routeState.focus}
              onSort={(sort) => updateRouteState({ sort })}
              onFocus={(focus) => updateRouteState({ focus })}
            />
          </div>
          <AssetsTable
            assets={sortedAssets}
            selectedIds={selectedIds}
            lineup={lineup}
            onAdd={addAsset}
            onRemove={removeAsset}
          />
        </section>

        <section className="ff1-rules" aria-labelledby="ff1-rules-heading">
          <h2 id="ff1-rules-heading" className="ff1-h2">
            How the model scores a pick
          </h2>
          <p>
            Season points anchor each projection, last-race movement catches form, and the standings
            rank keeps the front-runners expensive, so the value rating moves a cheaper pick up when
            its projection earns the slot. A sprint weekend adds a small lift, a team holds five
            drivers and two constructors under the $100m model budget, the optimizer keeps every
            pick you lock, and the team saves in this browser.
          </p>
        </section>
      </div>
    </div>
  );
}
