"use client";

import { useMemo, type CSSProperties } from "react";
import { Lock, RefreshCcw, Trash2, Unlock } from "lucide-react";
import type { FantasyFormula1Asset, FantasyFormula1LineupSummary } from "@/types/fantasyFormula1";
import { formatMoney, garageSlots, normaliseTeamColor, type GarageSlot } from "./garage";

interface GarageProps {
  summary: FantasyFormula1LineupSummary;
  budget: number;
  lockedIds: Set<string>;
  onRemove: (asset: FantasyFormula1Asset) => void;
  onToggleLock: (asset: FantasyFormula1Asset) => void;
  onReset: () => void;
}

function GarageSlotItem({
  slot,
  locked,
  onRemove,
  onToggleLock,
}: {
  slot: GarageSlot;
  locked: boolean;
  onRemove: (asset: FantasyFormula1Asset) => void;
  onToggleLock: (asset: FantasyFormula1Asset) => void;
}) {
  const asset = slot.asset;
  const kindLabel = slot.kind === "driver" ? "Driver" : "Constructor";

  if (!asset) {
    return (
      <li className="ff1-slot" data-empty="true">
        <span className="ff1-slot-kind">{kindLabel}</span>
        <span className="ff1-slot-empty">Open {slot.kind} slot</span>
      </li>
    );
  }

  const LockIcon = locked ? Lock : Unlock;
  return (
    <li
      className="ff1-slot"
      data-locked={locked ? "true" : undefined}
      style={
        {
          "--ff1-livery": normaliseTeamColor(asset.teamColor) ?? "var(--ff1-ink-2)",
        } as CSSProperties
      }
    >
      <span className="ff1-slot-kind">
        {slot.kind === "driver" ? (asset.teamName ?? kindLabel) : kindLabel}
        {locked ? <span className="ff1-slot-locked"> · Locked</span> : null}
        {/* A phone row has no figures line, so the price rides here. */}
        <span className="ff1-slot-phone-price"> · {formatMoney(asset.price)}</span>
      </span>
      <span className="ff1-slot-name">{asset.name}</span>
      <span className="ff1-slot-figures">
        {formatMoney(asset.price)} · {asset.projectedPoints.toFixed(1)} pts
      </span>
      <span className="ff1-slot-actions">
        <button
          type="button"
          className="ff1-icon-btn"
          aria-label={`${locked ? "Unlock" : "Lock"} ${asset.name}`}
          title={`${locked ? "Unlock" : "Lock"} ${asset.name}`}
          onClick={() => onToggleLock(asset)}
        >
          <LockIcon size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ff1-icon-btn"
          aria-label={`Remove ${asset.name}`}
          title={`Remove ${asset.name}`}
          onClick={() => onRemove(asset)}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

/**
 * The garage is the team: five driver slots and two constructor slots in pick
 * order, each in its livery with its own lock and remove controls, the
 * team's projection, and the budget bar across the bottom. An empty slot says
 * which kind of pick it waits for, so a first visit sees the shape of a team.
 */
export function GarageSignature({
  summary,
  budget,
  lockedIds,
  onRemove,
  onToggleLock,
  onReset,
}: GarageProps) {
  const layout = useMemo(() => garageSlots(summary, budget), [summary, budget]);
  const { spentWidth, overWidth, budgetLineAt, isOver } = layout.budget;
  const valueText = `${formatMoney(summary.totalPrice)} used of ${formatMoney(budget)}${
    isOver ? `, ${formatMoney(summary.totalPrice - budget)} over` : ""
  }`;
  const picked = summary.assets.length;

  return (
    <section
      className="ff1-garage"
      data-testid="fantasy-formula-1-lineup"
      aria-labelledby="ff1-garage-heading"
    >
      <div className="ff1-garage-head">
        <h2 id="ff1-garage-heading" className="ff1-h2">
          Your team
        </h2>
        <dl className="ff1-summary">
          <div>
            <dt>Projected points</dt>
            <dd className="ff1-summary-value">{summary.projectedPoints.toFixed(1)}</dd>
            <dd>{summary.isComplete ? "Full lineup" : `${picked} of 7 picked`}</dd>
          </div>
          <div>
            <dt>Value</dt>
            <dd className="ff1-summary-value">{summary.valueRating.toFixed(1)}</dd>
            <dd>points per $10m</dd>
          </div>
        </dl>
        <button type="button" className="ff1-btn" onClick={onReset}>
          <RefreshCcw size={16} aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="ff1-slot-row">
        <ol className="ff1-slots" aria-label="Drivers">
          {layout.driverSlots.map((slot, index) => (
            <GarageSlotItem
              key={slot.asset?.id ?? `driver-${index}`}
              slot={slot}
              locked={slot.asset ? lockedIds.has(slot.asset.id) : false}
              onRemove={onRemove}
              onToggleLock={onToggleLock}
            />
          ))}
        </ol>
        <ol className="ff1-slots ff1-slots-constructors" aria-label="Constructors">
          {layout.constructorSlots.map((slot, index) => (
            <GarageSlotItem
              key={slot.asset?.id ?? `constructor-${index}`}
              slot={slot}
              locked={slot.asset ? lockedIds.has(slot.asset.id) : false}
              onRemove={onRemove}
              onToggleLock={onToggleLock}
            />
          ))}
        </ol>
      </div>

      <div className="ff1-garage-foot">
        <div className="ff1-budget-block">
          <div
            className="ff1-budget"
            role="meter"
            aria-label="Budget used"
            aria-valuemin={0}
            aria-valuemax={budget}
            aria-valuenow={Math.min(summary.totalPrice, budget)}
            aria-valuetext={valueText}
          >
            <div className="ff1-budget-fill" style={{ width: `${spentWidth * 100}%` }} />
            {isOver ? (
              <div
                className="ff1-budget-over"
                style={{
                  left: `${budgetLineAt * 100}%`,
                  width: `${overWidth * 100}%`,
                }}
              />
            ) : null}
            {isOver ? (
              <div
                className="ff1-budget-line"
                aria-hidden="true"
                style={{ left: `${budgetLineAt * 100}%` }}
              />
            ) : null}
          </div>
          <p className="ff1-budget-text">
            {valueText}
            {!isOver && summary.totalPrice < budget
              ? ` (${formatMoney(budget - summary.totalPrice)} left)`
              : ""}
          </p>
        </div>

        <p className="ff1-disclaimer">
          This model estimates prices and projections from the checked-in OpenF1 snapshot. It is not the
          official F1 Fantasy game.
        </p>
      </div>
    </section>
  );
}
