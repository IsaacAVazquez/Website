"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownUp,
  Gauge,
  Lock,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  Unlock,
} from "lucide-react";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
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
import type { Formula1Snapshot } from "@/types/formula1";
import type {
  FantasyFormula1Asset,
  FantasyFormula1Lineup,
  FantasyFormula1LineupSummary,
  FantasyFormula1OptimizationCandidate,
} from "@/types/fantasyFormula1";
import {
  buildFantasyFormula1Href,
  FANTASY_FORMULA1_FOCUS_OPTIONS,
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
  snapshot: Formula1Snapshot;
}

const UPDATED_AT_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatUpdatedAt(value: string | null | undefined): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : UPDATED_AT_FORMATTER.format(date);
}

function formatMoney(value: number): string {
  return `$${value.toFixed(1)}m`;
}

function formatPoints(value: number): string {
  return value.toFixed(1);
}

function getToneStyle(active: boolean): CSSProperties {
  return active
    ? {
        borderColor: "color-mix(in srgb, var(--home-signal) 35%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-signal) 11%, var(--home-paper-alt))",
        boxShadow: "var(--shadow-sm)",
      }
    : {
        borderColor: "var(--home-rule)",
        background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
      };
}

function getRiskStyle(risk: FantasyFormula1Asset["risk"]): CSSProperties {
  switch (risk) {
    case "low":
      return {
        borderColor: "color-mix(in srgb, var(--home-positive) 35%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-positive) 10%, var(--home-paper))",
      };
    case "medium":
      return {
        borderColor: "color-mix(in srgb, var(--home-warning) 35%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-warning) 9%, var(--home-paper))",
      };
    case "high":
    default:
      return {
        borderColor: "color-mix(in srgb, var(--home-negative) 30%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-negative) 8%, var(--home-paper))",
      };
  }
}

function getTeamAccentStyle(asset: FantasyFormula1Asset): CSSProperties {
  return {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: asset.teamColor ?? "var(--home-rule)",
  };
}

function AssetAvatar({ asset }: { asset: FantasyFormula1Asset }) {
  if (asset.headshotUrl) {
    return (
      <img
        src={asset.headshotUrl}
        alt={asset.name}
        loading="lazy"
        decoding="async"
        className="h-10 w-10 flex-shrink-0 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] object-cover object-top"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-xs font-semibold uppercase text-[var(--home-ink-muted)]">
      {asset.shortName.slice(0, 3)}
    </div>
  );
}

function ViewButton({
  view,
  activeView,
  onSelect,
}: {
  view: FantasyFormula1View;
  activeView: FantasyFormula1View;
  onSelect: (view: FantasyFormula1View) => void;
}) {
  const isActive = view === activeView;
  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-[border-color,background-color,box-shadow] duration-200"
      style={getToneStyle(isActive)}
      aria-pressed={isActive}
      onClick={() => onSelect(view)}
    >
      {FANTASY_FORMULA1_VIEW_LABELS[view]}
    </button>
  );
}

function SortButton({
  sort,
  activeSort,
  onSelect,
}: {
  sort: FantasyFormula1Sort;
  activeSort: FantasyFormula1Sort;
  onSelect: (sort: FantasyFormula1Sort) => void;
}) {
  const isActive = sort === activeSort;
  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-[border-color,background-color,box-shadow] duration-200"
      style={getToneStyle(isActive)}
      aria-pressed={isActive}
      onClick={() => onSelect(sort)}
    >
      <ArrowDownUp size={15} aria-hidden="true" />
      {FANTASY_FORMULA1_SORT_LABELS[sort]}
    </button>
  );
}

function FocusButton({
  focus,
  activeFocus,
  onSelect,
}: {
  focus: Exclude<FantasyFormula1Focus, null>;
  activeFocus: FantasyFormula1Focus;
  onSelect: (focus: FantasyFormula1Focus) => void;
}) {
  const isActive = focus === activeFocus;
  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] items-center rounded-full border px-3.5 py-2 text-sm font-semibold transition-[border-color,background-color,box-shadow] duration-200"
      style={getToneStyle(isActive)}
      aria-pressed={isActive}
      onClick={() => onSelect(isActive ? null : focus)}
    >
      {focus === "drivers" ? "Drivers" : "Constructors"}
    </button>
  );
}

function BudgetMeter({ summary }: { summary: FantasyFormula1LineupSummary }) {
  const usedPercent = Math.min(100, Math.max(0, (summary.totalPrice / FANTASY_FORMULA1_BUDGET) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-[var(--home-ink)]">
          {formatMoney(summary.totalPrice)} used
        </span>
        <span
          className={`font-semibold ${
            summary.isOverBudget ? "text-[var(--home-negative)]" : "text-[var(--home-ink-muted)]"
          }`}
        >
          {formatMoney(summary.budgetRemaining)} left
        </span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)]"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(usedPercent)}
        aria-label={`Budget used ${Math.round(usedPercent)} percent`}
      >
        <div
          className="h-full rounded-full transition-[width,background-color] duration-300"
          style={{
            width: `${usedPercent}%`,
            background: summary.isOverBudget
              ? "var(--home-negative)"
              : "color-mix(in srgb, var(--home-signal) 76%, var(--home-signal))",
          }}
        />
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
    <li
      className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_78%,var(--home-elev-mix))] px-4 py-3"
      style={getTeamAccentStyle(asset)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AssetAvatar asset={asset} />
          <div className="min-w-0">
            <p className="mb-0 truncate font-semibold text-[var(--home-ink)]">{asset.name}</p>
            <p className="mb-0 mt-1 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
              {asset.kind === "driver" ? asset.teamName : "Constructor"} ·{" "}
              {formatMoney(asset.price)}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] text-[var(--home-ink)] transition-[border-color,background-color] duration-200 hover:bg-[var(--home-paper-alt)]"
            aria-label={`${locked ? "Unlock" : "Lock"} ${asset.name}`}
            title={`${locked ? "Unlock" : "Lock"} ${asset.name}`}
            onClick={() => onToggleLock(asset)}
          >
            <LockIcon size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] text-[var(--home-ink)] transition-[border-color,background-color] duration-200 hover:bg-[var(--home-paper-alt)]"
            aria-label={`Remove ${asset.name}`}
            title={`Remove ${asset.name}`}
            onClick={() => onRemove(asset)}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyLineupSlot({ label }: { label: string }) {
  return (
    <li className="flex min-h-[68px] items-center rounded-[var(--radius-2xl)] border border-dashed border-[var(--home-rule)] px-4 py-3 text-sm font-medium text-[var(--home-ink-muted)]">
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
    <article className="home-card p-5 sm:p-6" data-testid="fantasy-formula-1-lineup">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="home-kicker mb-1">Lineup</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em]">Current team</h2>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--home-rule)] px-4 py-2 text-sm font-semibold transition-[border-color,background-color] duration-200 hover:bg-[var(--home-paper-alt)]"
          onClick={onReset}
        >
          <RefreshCcw size={16} aria-hidden="true" />
          Reset
        </button>
      </div>

      <BudgetMeter summary={summary} />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
            Drivers
          </h3>
          <ol className="space-y-3 pl-0">
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
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
            Constructors
          </h3>
          <ol className="space-y-3 pl-0">
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
              <EmptyLineupSlot
                key={`constructor-slot-${index}`}
                label="Open constructor slot"
              />
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
    <article className="home-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="home-kicker mb-1">Option {candidate.rank}</p>
          <h3 className="text-xl font-semibold tracking-[-0.04em]">
            {formatPoints(candidate.projectedPoints)} projected
          </h3>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--home-rule)] px-4 py-2 text-sm font-semibold transition-[border-color,background-color] duration-200 hover:bg-[var(--home-paper-alt)]"
          onClick={() => onApply(candidate)}
        >
          <Sparkles size={16} aria-hidden="true" />
          Apply
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] px-3 py-2">
          <span className="block text-xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
            Cost
          </span>
          <strong>{formatMoney(candidate.totalPrice)}</strong>
        </div>
        <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] px-3 py-2">
          <span className="block text-xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
            Left
          </span>
          <strong>{formatMoney(candidate.budgetRemaining)}</strong>
        </div>
        <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] px-3 py-2">
          <span className="block text-xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
            Value
          </span>
          <strong>{formatPoints(candidate.valueRating)}</strong>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <p className="mb-0 text-sm font-semibold text-[var(--home-ink)]">
          {candidate.drivers.map((asset) => asset.shortName).join(" · ")}
        </p>
        <p className="mb-0 text-sm text-[var(--home-ink-muted)]">
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
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="home-kicker mb-1">Optimizer</p>
          <h2
            id="fantasy-formula-1-recommendations-heading"
            className="text-2xl font-semibold tracking-[-0.04em]"
          >
            Best model lineups
          </h2>
        </div>
      </div>
      {candidates.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <RecommendationCard
              key={`${candidate.rank}-${candidate.assets.map((asset) => asset.id).join("-")}`}
              candidate={candidate}
              onApply={onApply}
            />
          ))}
        </div>
      ) : (
        <article className="home-card p-6">
          <p className="mb-0 font-semibold">No valid optimized lineup is available.</p>
          <p className="mb-0 mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
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
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--home-rule)] px-3 py-2 text-sm font-semibold transition-[border-color,background-color] duration-200 hover:bg-[var(--home-paper-alt)]"
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
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--home-rule)] px-3 py-2 text-sm font-semibold transition-[border-color,background-color,opacity] duration-200 hover:bg-[var(--home-paper-alt)] disabled:cursor-not-allowed disabled:opacity-50"
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
      <article className="home-card p-6">
        <p className="mb-0 font-semibold">No Formula 1 fantasy assets are available.</p>
        <p className="mb-0 mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
          The checked-in OpenF1 snapshot needs standings or a published race classification before
          this model can build a slate.
        </p>
      </article>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
            <th scope="col" className="px-3 py-2">Asset</th>
            <th scope="col" className="px-3 py-2">Type</th>
            <th scope="col" className="px-3 py-2">Price</th>
            <th scope="col" className="px-3 py-2">Projection</th>
            <th scope="col" className="px-3 py-2">Value</th>
            <th scope="col" className="px-3 py-2">Form</th>
            <th scope="col" className="px-3 py-2">Risk</th>
            <th scope="col" className="px-3 py-2 text-right">Team</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const selected = selectedIds.has(asset.id);
            const slotFull =
              asset.kind === "driver"
                ? lineup.driverIds.length >= FANTASY_FORMULA1_DRIVER_SLOTS
                : lineup.constructorIds.length >= FANTASY_FORMULA1_CONSTRUCTOR_SLOTS;

            return (
              <tr key={asset.id} style={getTeamAccentStyle(asset)}>
                <td className="rounded-l-[var(--radius-2xl)] border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <AssetAvatar asset={asset} />
                    <div className="min-w-0">
                      <p className="mb-0 truncate font-semibold text-[var(--home-ink)]">
                        {asset.name}
                      </p>
                      <p className="mb-0 mt-1 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                        {asset.standingPosition ? `P${asset.standingPosition}` : "Unranked"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3 py-3 text-sm font-semibold capitalize">
                  {asset.kind}
                </td>
                <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3 py-3 text-sm font-semibold">
                  {formatMoney(asset.price)}
                </td>
                <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3 py-3 text-sm font-semibold">
                  {formatPoints(asset.projectedPoints)}
                </td>
                <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3 py-3 text-sm font-semibold">
                  {formatPoints(asset.valueRating)}
                </td>
                <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3 py-3 text-sm">
                  {formatPoints(asset.formScore)}
                </td>
                <td className="border-y border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3 py-3">
                  <span
                    className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize"
                    style={getRiskStyle(asset.risk)}
                    title={asset.riskReason}
                  >
                    {asset.risk}
                    <span className="sr-only">. {asset.riskReason}</span>
                  </span>
                </td>
                <td className="rounded-r-[var(--radius-2xl)] border-y border-r border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_80%,var(--home-elev-mix))] px-3 py-3 text-right">
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
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <article className="home-card p-5 sm:p-6">
        <p className="home-kicker mb-1">Model notes</p>
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">
          This is a planning model, not the official game.
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--home-ink-muted)]">
          I use the checked-in OpenF1 season snapshot to estimate prices, weekend projection,
          value, form, and risk. The point is to make lineup tradeoffs legible before a race
          weekend, not to mirror every official scoring rule.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Five drivers and two constructors",
            "$100m model budget cap",
            "Locked picks are honored by the optimizer",
            "Sprint weekends get a small projection lift",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper-alt)_78%,var(--home-elev-mix))] px-4 py-3 text-sm font-semibold"
            >
              {item}
            </div>
          ))}
        </div>
      </article>

      <article className="home-card p-5 sm:p-6">
        <p className="home-kicker mb-1">Signals</p>
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">What the model rewards</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--home-ink-muted)]">
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
  snapshot,
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
  const assets = useMemo(() => buildFantasyFormula1Assets(snapshot), [snapshot]);
  const storageKey = getFantasyFormula1StorageKey(snapshot.season);
  const [lineup, setLineup] = useState<FantasyFormula1Lineup>(EMPTY_FANTASY_FORMULA1_LINEUP);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const currentQuery = searchParams.toString();
    const currentHref = `/fantasy-formula-1${currentQuery ? `?${currentQuery}` : ""}`;
    const normalizedHref = buildFantasyFormula1Href(routeState, searchParams);
    if (currentHref === normalizedHref) {
      return;
    }

    startTransition(() => {
      router.replace(normalizedHref, { scroll: false });
    });
  }, [routeState, router, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLineup = parsePersistedLineup(window.localStorage.getItem(storageKey));
    if (storedLineup) {
      // Mount-time localStorage restore is intentionally separate from SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLineup(sanitizeFantasyFormula1Lineup(storedLineup, assets));
    }
    setIsLoaded(true);
  }, [assets, storageKey]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(lineup));
  }, [isLoaded, lineup, storageKey]);

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
    setLineup((current) => sanitizeFantasyFormula1Lineup(updater(current), assets));
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
    setLineup({
      driverIds: candidate.drivers.map((asset) => asset.id),
      constructorIds: candidate.constructors.map((asset) => asset.id),
      lockedAssetIds: lineup.lockedAssetIds.filter((id) =>
        candidate.assets.some((asset) => asset.id === id)
      ),
    });
  }

  function resetLineup() {
    setLineup(EMPTY_FANTASY_FORMULA1_LINEUP);
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
  const sortedAssets = useMemo(() => {
    const focusedAssets =
      routeState.focus === "drivers"
        ? assets.filter((asset) => asset.kind === "driver")
        : routeState.focus === "constructors"
          ? assets.filter((asset) => asset.kind === "constructor")
          : assets;

    return sortFantasyFormula1Assets(focusedAssets, routeState.sort);
  }, [assets, routeState.focus, routeState.sort]);

  const topAsset = sortedAssets[0] ?? null;
  const nextRaceLabel = snapshot.nextMeeting?.name ?? "No upcoming race";
  const nextRaceMeta = snapshot.nextMeeting?.raceStartsAt
    ? formatUpdatedAt(snapshot.nextMeeting.raceStartsAt)
    : snapshot.nextMeeting?.startAt
      ? formatUpdatedAt(snapshot.nextMeeting.startAt)
      : "TBD";
  const completeLabel = summary.isComplete ? "Complete" : "Incomplete";
  const statsCells: HomeStatsCell[] = [
    {
      label: "Budget used",
      value: formatMoney(summary.totalPrice),
      sub: `${formatMoney(summary.budgetRemaining)} remaining`,
      tone: !summary.isOverBudget && summary.totalPrice > 0 ? "good" : "default",
    },
    {
      label: "Projected",
      value: formatPoints(summary.projectedPoints),
      sub: summary.isComplete ? "Selected lineup" : "Partial lineup",
    },
    {
      label: "Drivers",
      value: `${summary.drivers.length}/${FANTASY_FORMULA1_DRIVER_SLOTS}`,
      sub: completeLabel,
    },
    {
      label: "Constructors",
      value: `${summary.constructors.length}/${FANTASY_FORMULA1_CONSTRUCTOR_SLOTS}`,
      sub: completeLabel,
    },
    {
      label: "Next race",
      value: nextRaceLabel,
      sub: nextRaceMeta,
    },
    {
      label: "Top value",
      value: topAsset?.shortName ?? "Unavailable",
      sub: topAsset ? `${formatPoints(topAsset.valueRating)} value rating` : "No slate",
    },
    {
      label: "Assets",
      value: assets.length.toLocaleString(),
      sub: `${assets.filter((asset) => asset.kind === "driver").length} drivers`,
    },
    {
      label: "Snapshot",
      value: formatUpdatedAt(snapshot.generatedAt),
      sub: snapshot.sourceLabel,
    },
  ];

  const selectedAssetNames = summary.assets.map((asset) => asset.name).join(", ");

  return (
    <section
      className="home-page min-h-screen"
      aria-label="Fantasy Formula 1 optimizer"
      data-testid="fantasy-formula-1-shell"
    >
      <div className="home-shell home-section space-y-5 sm:space-y-6">
        <div className="grid gap-5 pt-2 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,25rem)]">
          <div className="space-y-4">
            <p className="home-kicker mb-0">Fantasy Formula 1</p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.6rem, 6vw, 4.8rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
                maxWidth: "15ch",
              }}
            >
              Build the team before the weekend gets noisy.
            </h1>
            <p className="max-w-[68ch] text-sm leading-7 text-[var(--home-ink-muted)] sm:text-base">
              I built this as a practical F1 fantasy planning surface. It uses the OpenF1 snapshot,
              transparent model pricing, and official-style roster constraints so the tradeoffs are
              visible before you commit to a lineup.
            </p>
            <div className="flex flex-wrap gap-2">
              {FANTASY_FORMULA1_VIEW_OPTIONS.map((view) => (
                <ViewButton
                  key={view}
                  view={view}
                  activeView={routeState.view}
                  onSelect={(nextView) => updateRouteState({ view: nextView })}
                />
              ))}
            </div>
          </div>

          <aside
            className="home-card p-5 sm:p-6"
            aria-label="Current Fantasy Formula 1 model summary"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-signal)_12%,var(--home-paper-alt))]">
                <Gauge size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="home-kicker mb-1">Model slate</p>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">
                  {snapshot.season} season snapshot
                </h2>
                <p className="mb-0 mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                  {selectedAssetNames
                    ? `Selected assets: ${selectedAssetNames}.`
                    : "No picks yet. Start from the optimized lineup or build manually from the asset board."}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <HomeStatsPanel
          id="fantasy-formula-1-stats"
          title="Optimizer at a glance"
          meta={summary.isComplete ? "Lineup ready" : "Planning mode"}
          hideLiveDot={!summary.isComplete}
          cells={statsCells}
          pills={[
            { label: "F1 Pulse", href: "/formula-1" },
            { label: "Portfolio", href: "/portfolio" },
          ]}
        />

        {routeState.view === "builder" ? (
          <div className="space-y-5">
            <LineupPanel
              summary={summary}
              lockedIds={lockedIds}
              onRemove={removeAsset}
              onToggleLock={toggleLock}
              onReset={resetLineup}
            />
            <RecommendationsPanel candidates={candidates} onApply={applyCandidate} />
            <article className="home-card p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="home-kicker mb-1">Asset board</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                    Add from the model slate
                  </h2>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--home-rule)] px-4 py-2 text-sm font-semibold transition-[border-color,background-color] duration-200 hover:bg-[var(--home-paper-alt)]"
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
          <article className="home-card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="home-kicker mb-1">Assets</p>
                <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                  Sort the slate by the signal you trust.
                </h2>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {FANTASY_FORMULA1_SORT_OPTIONS.map((sort) => (
                  <SortButton
                    key={sort}
                    sort={sort}
                    activeSort={routeState.sort}
                    onSelect={(nextSort) => updateRouteState({ sort: nextSort })}
                  />
                ))}
                {FANTASY_FORMULA1_FOCUS_OPTIONS.map((focus) => (
                  <FocusButton
                    key={focus}
                    focus={focus}
                    activeFocus={routeState.focus}
                    onSelect={(nextFocus) => updateRouteState({ focus: nextFocus })}
                  />
                ))}
              </div>
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
  );
}
