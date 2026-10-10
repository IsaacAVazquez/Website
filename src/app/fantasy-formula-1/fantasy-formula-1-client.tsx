"use client";

import { startTransition, useEffect, useMemo, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Lock, Plus, RefreshCcw, Sparkles, Trash2, Unlock } from "lucide-react";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { formatUpdatedAt } from "@/lib/date-formatters";
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
  FantasyFormula1LineupSummary,
  FantasyFormula1OptimizationCandidate,
} from "@/types/fantasyFormula1";
import { GarageSignature } from "./GarageSignature";
import { formatMoney, normaliseTeamColor } from "./garage";
import "./fantasy-formula-1.css";
import {
  buildFantasyFormula1Href,
  FANTASY_FORMULA1_FOCUS_OPTIONS,
  FANTASY_FORMULA1_ROUTE,
  FANTASY_FORMULA1_SORT_LABELS,
  FANTASY_FORMULA1_SORT_OPTIONS,
  FANTASY_FORMULA1_VIEW_LABELS,
  FANTASY_FORMULA1_VIEW_OPTIONS,
  normalizeFantasyFormula1State,
  type FantasyFormula1Focus,
  type FantasyFormula1RouteState,
  type FantasyFormula1Sort,
  type FantasyFormula1View,
} from "./fantasy-formula-1-state";

interface FantasyFormula1ClientProps {
  initialState: FantasyFormula1RouteState;
  summary: Formula1Summary;
}

function formatStamp(value: string | null | undefined): string {
  return value ? formatUpdatedAt(value) : "Unavailable";
}

function formatPoints(value: number): string {
  return value.toFixed(1);
}

function getTeamAccentStyle(teamColor: string | null): CSSProperties {
  return {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: normaliseTeamColor(teamColor) ?? "var(--c97-ink-2)",
  };
}

function AssetAvatar({ asset }: { asset: FantasyFormula1Asset }) {
  if (asset.headshotUrl) {
    return (
      <span className="c97-ff1-avatar">
        <img src={asset.headshotUrl} alt="" loading="lazy" decoding="async" />
      </span>
    );
  }

  return <span className="c97-ff1-avatar">{asset.shortName.slice(0, 3)}</span>;
}

function ViewSwitcher({
  activeView,
  onSelect,
}: {
  activeView: FantasyFormula1View;
  onSelect: (view: FantasyFormula1View) => void;
}) {
  return (
    <div className="c97-segmented" role="group" aria-label="Fantasy Formula 1 view switcher">
      {FANTASY_FORMULA1_VIEW_OPTIONS.map((view) => (
        <button
          key={view}
          type="button"
          aria-pressed={view === activeView}
          className="min-h-[44px] text-sm font-semibold"
          onClick={() => onSelect(view)}
        >
          {FANTASY_FORMULA1_VIEW_LABELS[view]}
        </button>
      ))}
    </div>
  );
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
    <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-2)" }}>
      <div className="c97-segmented" role="group" aria-label="Sort assets by">
        {FANTASY_FORMULA1_SORT_OPTIONS.map((sort) => (
          <button
            key={sort}
            type="button"
            aria-pressed={sort === activeSort}
            className="min-h-[44px] text-sm font-semibold"
            onClick={() => onSort(sort)}
          >
            <ArrowDownUp size={14} aria-hidden="true" />
            {FANTASY_FORMULA1_SORT_LABELS[sort]}
          </button>
        ))}
      </div>
      <div className="c97-segmented" role="group" aria-label="Filter assets by kind">
        {FANTASY_FORMULA1_FOCUS_OPTIONS.map((focus) => {
          const isActive = focus === activeFocus;
          return (
            <button
              key={focus}
              type="button"
              aria-pressed={isActive}
              className="min-h-[44px] text-sm font-semibold"
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

function LineupAssetRow({
  asset,
  locked,
  onRemove,
  onToggleLock,
}: {
  asset: FantasyFormula1Asset;
  locked: boolean;
  onRemove: (asset: FantasyFormula1Asset) => void;
  onToggleLock: (asset: FantasyFormula1Asset) => void;
}) {
  const LockIcon = locked ? Lock : Unlock;
  return (
    <li className="c97-panel flex items-center justify-between" style={{ gap: "var(--c97-sp-1)", ...(getTeamAccentStyle(asset.teamColor)) }}>
      <div className="flex min-w-0 items-center" style={{ gap: "var(--c97-sp-1)" }}>
        <AssetAvatar asset={asset} />
        <div className="min-w-0">
          <p className="c97-serif truncate">{asset.name}</p>
          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>
            {asset.kind === "driver" ? asset.teamName : "Constructor"} &middot; {formatMoney(asset.price)}
          </p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center" style={{ gap: "var(--c97-sp-1)" }}>
        <button
          type="button"
          className="c97-ff1-icon-btn"
          aria-label={`${locked ? "Unlock" : "Lock"} ${asset.name}`}
          title={`${locked ? "Unlock" : "Lock"} ${asset.name}`}
          onClick={() => onToggleLock(asset)}
        >
          <LockIcon size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="c97-ff1-icon-btn"
          aria-label={`Remove ${asset.name}`}
          title={`Remove ${asset.name}`}
          onClick={() => onRemove(asset)}
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function EmptyLineupSlot({ label }: { label: string }) {
  return (
    <li className="flex min-h-[68px] items-center border border-dashed text-sm font-medium" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
      {label}
    </li>
  );
}

function LineupPanel({
  summary,
  lockedIds,
  onRemove,
  onToggleLock,
  onReset,
}: {
  summary: FantasyFormula1LineupSummary;
  lockedIds: Set<string>;
  onRemove: (asset: FantasyFormula1Asset) => void;
  onToggleLock: (asset: FantasyFormula1Asset) => void;
  onReset: () => void;
}) {
  const driverSlotsLeft = Math.max(0, FANTASY_FORMULA1_DRIVER_SLOTS - summary.drivers.length);
  const constructorSlotsLeft = Math.max(
    0,
    FANTASY_FORMULA1_CONSTRUCTOR_SLOTS - summary.constructors.length
  );

  return (
    <article data-testid="fantasy-formula-1-lineup">
      <div className="flex flex-wrap items-start justify-between" style={{ marginBottom: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}>
        <h2 className="c97-poster-sm mb-0">Current team</h2>
        <button type="button" className="c97-ff1-btn" onClick={onReset}>
          <RefreshCcw size={16} aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="grid lg:grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
        <div>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Drivers</p>
          <ol className="flex flex-col pl-0" style={{ gap: "var(--c97-sp-1)" }}>
            {summary.drivers.map((asset) => (
              <LineupAssetRow
                key={asset.id}
                asset={asset}
                locked={lockedIds.has(asset.id)}
                onRemove={onRemove}
                onToggleLock={onToggleLock}
              />
            ))}
            {Array.from({ length: driverSlotsLeft }, (_, index) => (
              <EmptyLineupSlot key={`driver-slot-${index}`} label="Open driver slot" />
            ))}
          </ol>
        </div>
        <div>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>Constructors</p>
          <ol className="flex flex-col pl-0" style={{ gap: "var(--c97-sp-1)" }}>
            {summary.constructors.map((asset) => (
              <LineupAssetRow
                key={asset.id}
                asset={asset}
                locked={lockedIds.has(asset.id)}
                onRemove={onRemove}
                onToggleLock={onToggleLock}
              />
            ))}
            {Array.from({ length: constructorSlotsLeft }, (_, index) => (
              <EmptyLineupSlot key={`constructor-slot-${index}`} label="Open constructor slot" />
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}

function RecommendationCard({
  candidate,
  onApply,
}: {
  candidate: FantasyFormula1OptimizationCandidate;
  onApply: (candidate: FantasyFormula1OptimizationCandidate) => void;
}) {
  return (
    <article className="c97-panel">
      <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
        <div>
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Option {candidate.rank}</p>
          <h3 className="c97-h3 mb-0">{formatPoints(candidate.projectedPoints)} projected</h3>
        </div>
        <button type="button" className="c97-ff1-btn" onClick={() => onApply(candidate)}>
          <Sparkles size={16} aria-hidden="true" />
          Apply
        </button>
      </div>
      <div className="grid grid-cols-3 text-sm" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
        <div className="flex min-w-0 flex-col border" style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-0)", borderColor: "var(--c97-rule)" }}>
          <span className="c97-kicker">Cost</span>
          <strong className="c97-mono">{formatMoney(candidate.totalPrice)}</strong>
        </div>
        <div className="flex min-w-0 flex-col border" style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-0)", borderColor: "var(--c97-rule)" }}>
          <span className="c97-kicker">Left</span>
          <strong className="c97-mono">{formatMoney(candidate.budgetRemaining)}</strong>
        </div>
        <div className="flex min-w-0 flex-col border" style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-0)", borderColor: "var(--c97-rule)" }}>
          <span className="c97-kicker">Value</span>
          <strong className="c97-mono">{formatPoints(candidate.valueRating)}</strong>
        </div>
      </div>
      <div className="flex flex-col" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
        <p className="c97-serif" style={{ fontSize: "var(--c97-fs-small)", fontWeight: 600, marginBottom: "var(--c97-sp-1)" }}>
          {candidate.drivers.map((asset) => asset.shortName).join(" · ")}
        </p>
        <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
          {candidate.constructors.map((asset) => asset.name).join(" · ")}
        </p>
      </div>
    </article>
  );
}

function RecommendationsPanel({
  candidates,
  onApply,
}: {
  candidates: FantasyFormula1OptimizationCandidate[];
  onApply: (candidate: FantasyFormula1OptimizationCandidate) => void;
}) {
  return (
    <section aria-labelledby="fantasy-formula-1-recommendations-heading">
      <h2 id="fantasy-formula-1-recommendations-heading" className="c97-poster-sm" style={{ marginBottom: "var(--c97-sp-2)" }}>
        Best model lineups
      </h2>
      {candidates.length > 0 ? (
        <div className="grid lg:grid-cols-3" style={{ gap: "var(--c97-sp-2)" }}>
          {candidates.map((candidate) => (
            <RecommendationCard
              key={`${candidate.rank}-${candidate.assets.map((asset) => asset.id).join("-")}`}
              candidate={candidate}
              onApply={onApply}
            />
          ))}
        </div>
      ) : (
        <article className="c97-panel">
          <p className="mb-0 font-semibold">No valid optimized lineup is available.</p>
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
            Unlock a few picks or reset the team. The optimizer only returns complete lineups
            inside the budget.
          </p>
        </article>
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
      <button
        type="button"
        className="c97-ff1-btn"
        aria-label={`Remove ${asset.name}`}
        onClick={() => onRemove(asset)}
      >
        <Trash2 size={15} aria-hidden="true" />
        Remove
      </button>
    );
  }

  return (
    <button
      type="button"
      className="c97-ff1-btn"
      disabled={disabled}
      aria-label={`Add ${asset.name}`}
      onClick={() => onAdd(asset)}
    >
      <Plus size={15} aria-hidden="true" />
      Add
    </button>
  );
}

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
      <article className="c97-panel">
        <p className="mb-0 font-semibold">No Formula 1 fantasy assets are available.</p>
        <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
          The checked-in OpenF1 snapshot needs standings or a published race classification before
          this model can build a slate.
        </p>
      </article>
    );
  }

  return (
    <div
      className="c97-ff1-table-scroll"
      role="region"
      aria-label="Formula 1 fantasy asset board"
      tabIndex={0}
    >
      {/* One table for both widths, so each Add button exists once. Below
          640px the middle columns are hidden and the asset cell carries them. */}
      <table className="c97-table c97-ff1-table">
        <thead>
          <tr>
            <th scope="col">Asset</th>
            <th scope="col" className="hidden sm:table-cell">Type</th>
            <th scope="col" data-align="end" className="hidden sm:table-cell">Price</th>
            <th scope="col" data-align="end" className="hidden sm:table-cell">Projection</th>
            <th scope="col" data-align="end" className="hidden sm:table-cell">Value</th>
            <th scope="col" data-align="end" className="hidden sm:table-cell">Form</th>
            <th scope="col" className="hidden sm:table-cell">Risk</th>
            <th scope="col" data-align="end" className="c97-ff1-col-action">
              Lineup
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
            const riskChipClass =
              asset.risk === "low"
                ? "c97-chip-positive"
                : asset.risk === "medium"
                  ? "c97-chip-warning"
                  : "c97-chip-negative";
            const standing = asset.standingPosition ? `P${asset.standingPosition}` : "Unranked";

            return (
              <tr key={asset.id} style={getTeamAccentStyle(asset.teamColor)}>
                <td>
                  <div className="flex min-w-0 items-center" style={{ gap: "var(--c97-sp-1)" }}>
                    <AssetAvatar asset={asset} />
                    <div className="min-w-0">
                      <p className="c97-serif sm:truncate">{asset.name}</p>
                      <div className="hidden sm:block">
                        <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>
                          {standing}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* A phone's row. The line that is always there has the two
                      numbers a pick turns on, and it opens the other columns. */}
                  <details className="c97-disclosure sm:hidden">
                    <summary
                      className="flex min-h-[44px] items-center justify-between"
                      style={{ gap: "var(--c97-sp-1)" }}
                    >
                      <span>
                        <span className="sr-only">{asset.name}, </span>
                        {formatMoney(asset.price)} &middot; {formatPoints(asset.projectedPoints)} projected
                      </span>
                      <span className="c97-kicker" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}>
                        <span data-when="closed">More</span>
                        <span data-when="open">Less</span>
                      </span>
                    </summary>
                    <dl className="grid grid-cols-2" style={{ gap: "var(--c97-sp-1)", paddingBottom: "var(--c97-sp-1)" }}>
                      {(
                        [
                          ["Type", <span key="type" className="capitalize">{asset.kind}</span>],
                          ["Standing", standing],
                          ["Value", formatPoints(asset.valueRating)],
                          ["Form", formatPoints(asset.formScore)],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <dt className="c97-kicker">{label}</dt>
                          <dd className="mb-0">{value}</dd>
                        </div>
                      ))}
                      <div className="col-span-2">
                        <dt className="c97-kicker">Risk</dt>
                        <dd className="mb-0">
                          <span className={`c97-chip ${riskChipClass} capitalize`}>{asset.risk}</span>{" "}
                          {asset.riskReason}
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
                  <span className={`c97-chip ${riskChipClass} capitalize`} title={asset.riskReason}>
                    {asset.risk}
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

function RulesPanel() {
  return (
    <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]" style={{ gap: "var(--c97-sp-2)" }}>
      <article className="c97-panel">
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Model notes</p>
        <h2 className="c97-poster-sm mb-0">This is a planning model.</h2>
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}>
          I use the checked-in OpenF1 season snapshot to estimate prices, weekend projection,
          value, form, and risk. The point is to make lineup tradeoffs legible before a race
          weekend, with a simplified scoring model.
        </p>
        <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
          {[
            "Five drivers and two constructors",
            "$100m model budget cap",
            "Locked picks are honored by the optimizer",
            "Sprint weekends get a small projection lift",
          ].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="c97-panel">
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Signals</p>
        <h2 className="c97-poster-sm mb-0">What the model rewards</h2>
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}>
          Season points keep the model anchored. Last-race movement catches form. Standings rank
          keeps premium assets expensive. Value rating pushes cheaper assets up when the projection
          justifies the slot.
        </p>
      </article>
    </section>
  );
}

function sortFantasyFormula1Assets(
  assets: FantasyFormula1Asset[],
  sort: FantasyFormula1Sort
): FantasyFormula1Asset[] {
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

export function FantasyFormula1Client({
  initialState,
  summary: seasonSummary,
}: FantasyFormula1ClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasManagedParams =
    searchParams.get("view") !== null ||
    searchParams.get("sort") !== null ||
    searchParams.get("focus") !== null;
  const routeState = useMemo(
    () => (hasManagedParams ? normalizeFantasyFormula1State(searchParams) : initialState),
    [hasManagedParams, initialState, searchParams]
  );
  const assets = useMemo(() => buildFantasyFormula1Assets(seasonSummary), [seasonSummary]);
  const storageKey = getFantasyFormula1StorageKey(seasonSummary.season);
  const storedLineup = useLocalStorageString(storageKey);
  const lineup = useMemo(
    () => sanitizeFantasyFormula1Lineup(
      parsePersistedLineup(storedLineup) ?? EMPTY_FANTASY_FORMULA1_LINEUP, assets
    ),
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
    const nextRouteState = {
      ...routeState,
      ...nextState,
    };

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
        if (
          current.driverIds.includes(asset.id) ||
          current.driverIds.length >= FANTASY_FORMULA1_DRIVER_SLOTS
        ) {
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
    updateLineup(() => ({
      driverIds: candidate.drivers.map((asset) => asset.id),
      constructorIds: candidate.constructors.map((asset) => asset.id),
      lockedAssetIds: lineup.lockedAssetIds.filter((id) =>
        candidate.assets.some((asset) => asset.id === id)
      ),
    }));
  }

  function resetLineup() {
    updateLineup(() => EMPTY_FANTASY_FORMULA1_LINEUP);
  }

  const summary = useMemo(
    () => summarizeFantasyFormula1Lineup(assets, lineup),
    [assets, lineup]
  );
  const lockedIds = useMemo(() => new Set(lineup.lockedAssetIds), [lineup.lockedAssetIds]);
  const selectedIds = useMemo(
    () => new Set([...lineup.driverIds, ...lineup.constructorIds]),
    [lineup.constructorIds, lineup.driverIds]
  );
  const candidates = useMemo(
    () => optimizeFantasyFormula1Lineups(assets, lockedIds, 3),
    [assets, lockedIds]
  );
  // The optimizer's first answer, which the hero offers as the one suggested
  // lineup. All three stay in the builder under the team's lock controls.
  const suggestion = candidates[0] ?? null;
  const suggestionIsCurrent =
    suggestion !== null &&
    selectedIds.size === suggestion.assets.length &&
    suggestion.assets.every((asset) => selectedIds.has(asset.id));
  const sortedAssets = useMemo(() => {
    const focusedAssets =
      routeState.focus === "drivers"
        ? assets.filter((asset) => asset.kind === "driver")
        : routeState.focus === "constructors"
          ? assets.filter((asset) => asset.kind === "constructor")
          : assets;

    return sortFantasyFormula1Assets(focusedAssets, routeState.sort);
  }, [assets, routeState.focus, routeState.sort]);

  const nextRaceLabel = seasonSummary.nextMeeting?.name ?? null;
  const nextRaceMeta = seasonSummary.nextMeeting?.raceStartsAt
    ? formatStamp(seasonSummary.nextMeeting.raceStartsAt)
    : seasonSummary.nextMeeting?.startAt
      ? formatStamp(seasonSummary.nextMeeting.startAt)
      : null;
  const selectedAssetNames = summary.assets.map((asset) => asset.name).join(", ");
  const lead = PROJECT_PRESS[FANTASY_FORMULA1_ROUTE].lead;

  return (
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="Fantasy Formula 1"
        standfirst="Build the team before the weekend gets noisy. I use the checked-in OpenF1 season snapshot, model prices, and official-style roster constraints so the tradeoffs are visible before you commit to a lineup."
        meta={`${seasonSummary.season} season · ${seasonSummary.sourceLabel} · snapshot ${formatStamp(seasonSummary.generatedAt)}`}
        readouts={[
          {
            label: "Projected points",
            value: formatPoints(summary.projectedPoints),
            // The qualifier rides with the number, and the longer note and the
            // Rules view under the hero say how the model gets there.
            detail: `Unofficial model estimate · ${
              summary.isComplete ? "full lineup" : `${summary.assets.length}/7 picked`
            }`,
          },
          {
            label: "Budget left",
            value: formatMoney(summary.budgetRemaining),
            detail: `${formatMoney(summary.totalPrice)} spent`,
          },
          {
            label: "Value rating",
            value: formatPoints(summary.valueRating),
            detail: "points per $10m spent",
          },
        ]}
      >
        <GarageSignature summary={summary} budget={FANTASY_FORMULA1_BUDGET} lockedIds={lockedIds}>
          {suggestion ? (
            <div className="c97-ff1-suggest" data-testid="fantasy-formula-1-suggestion">
              <div className="min-w-0">
                <p className="c97-kicker">Suggested lineup &middot; unofficial model estimate</p>
                <p className="c97-serif" style={{ marginTop: "var(--c97-sp-1)" }}>
                  {suggestion.drivers.map((asset) => asset.shortName).join(" · ")}
                </p>
                <p style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
                  {suggestion.constructors.map((asset) => asset.name).join(" · ")}
                </p>
                <p className="c97-mono" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
                  {formatPoints(suggestion.projectedPoints)} projected &middot;{" "}
                  {formatMoney(suggestion.totalPrice)} &middot; {formatMoney(suggestion.budgetRemaining)} left
                </p>
              </div>
              {suggestionIsCurrent ? (
                <p style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
                  This is your current team.
                </p>
              ) : (
                <button type="button" className="c97-ff1-btn" onClick={() => applyCandidate(suggestion)}>
                  <Sparkles size={16} aria-hidden="true" />
                  Use this lineup
                </button>
              )}
            </div>
          ) : null}
        </GarageSignature>
      </Catalog97ProjectHero>

      <section
        className="c97-band c97-sheet"
        data-c97-surface="paper"
        data-seam="torn"
        aria-label="Fantasy Formula 1 optimizer"
        data-testid="fantasy-formula-1-shell"
      >
        <div className="c97-shell flex flex-col" style={{ gap: "var(--c97-sp-3)" }}>
          <div className="flex flex-wrap items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
            <p className="c97-prose">
              {selectedAssetNames
                ? `This lineup has ${selectedAssetNames}.`
                : "No picks yet. Start from an optimized lineup below, or add drivers and constructors from the asset board."}
              {nextRaceLabel ? ` Next up is the ${nextRaceLabel}${nextRaceMeta ? `, ${nextRaceMeta}` : ""}.` : ""}
            </p>
            <ViewSwitcher activeView={routeState.view} onSelect={(view) => updateRouteState({ view })} />
          </div>

          {/* .c97-prose zeroes its margin, which beats the space-y utility, so the gap is set here. */}
          <p
            className="c97-prose"
            style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)", marginBottom: "var(--c97-sp-5)" }}
          >
            This model estimates prices and projections from the checked-in OpenF1 snapshot. It is
            not the official F1 Fantasy game.
          </p>

          {routeState.view === "builder" ? (
            <div className="flex flex-col" style={{ gap: "var(--c97-sp-3)" }}>
              <LineupPanel
                summary={summary}
                lockedIds={lockedIds}
                onRemove={removeAsset}
                onToggleLock={toggleLock}
                onReset={resetLineup}
              />
              <RecommendationsPanel candidates={candidates} onApply={applyCandidate} />
              <article>
                <div className="flex flex-wrap items-center justify-between" style={{ marginBottom: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
                  <h2 className="c97-poster-sm mb-0">Add from the model slate</h2>
                  <button
                    type="button"
                    className="c97-ff1-btn"
                    onClick={() => updateRouteState({ view: "assets" })}
                  >
                    Open full board
                  </button>
                </div>
                <AssetsTable
                  assets={sortedAssets.slice(0, 10)}
                  selectedIds={selectedIds}
                  lineup={lineup}
                  onAdd={addAsset}
                  onRemove={removeAsset}
                />
              </article>
            </div>
          ) : null}

          {routeState.view === "assets" ? (
            <article className="flex flex-col" style={{ gap: "var(--c97-sp-2)" }}>
              <div className="flex flex-wrap items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
                <h2 className="c97-poster-sm mb-0">Sort the slate by the signal you trust.</h2>
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
            </article>
          ) : null}

          {routeState.view === "rules" ? <RulesPanel /> : null}
        </div>
      </section>
    </>
  );
}
