"use client";

import { useMemo } from "react";
import { Lock } from "lucide-react";
import type { FantasyFormula1Asset, FantasyFormula1LineupSummary } from "@/types/fantasyFormula1";
import { formatMoney, garageSlots, normaliseTeamColor, type GarageSlot } from "./garage";

interface GarageProps {
  summary: FantasyFormula1LineupSummary;
  budget: number;
  lockedIds: Set<string>;
}

function GarageBox({ slot, locked }: { slot: GarageSlot; locked: boolean }) {
  const asset: FantasyFormula1Asset | null = slot.asset;
  const stripeColor = asset ? normaliseTeamColor(asset.teamColor) : null;

  return (
    <div className="c97-ff1-box" data-empty={asset ? undefined : "true"}>
      <span
        className="c97-ff1-box-stripe"
        aria-hidden="true"
        style={{ background: stripeColor ?? "var(--c97-ink-2)" }}
      />
      <p className="c97-kicker">{slot.kind === "driver" ? "Driver" : "Constructor"}</p>
      {asset ? (
        <>
          <p className="c97-serif c97-ff1-box-name">{asset.name}</p>
          <p className="c97-mono c97-ff1-box-figures mb-0">
            {formatMoney(asset.price)} &middot; {asset.projectedPoints.toFixed(1)} pts
          </p>
          {locked ? (
            <span className="c97-ff1-box-lock" title={`${asset.name} is locked`}>
              <Lock size={12} aria-hidden="true" />
            </span>
          ) : null}
        </>
      ) : (
        <p className="c97-ff1-box-empty">
          {slot.kind === "driver" ? "Open driver slot" : "Open constructor slot"}
        </p>
      )}
    </div>
  );
}

/**
 * The page's signature: the garage, five driver boxes and two constructor
 * boxes in pick order, with the budget meter as a cost bar underneath. It
 * sits on its own paper plate because it draws data colours (team liveries)
 * on the saffron hero ink. Purely a display, since the lock toggle and the
 * remove control below are the keyboard path to the same picks.
 */
export function GarageSignature({ summary, budget, lockedIds }: GarageProps) {
  const layout = useMemo(() => garageSlots(summary, budget), [summary, budget]);
  const { spentWidth, overWidth, budgetLineAt, isOver } = layout.budget;
  const valueText = `${formatMoney(summary.totalPrice)} used of ${formatMoney(budget)}${
    isOver ? `, ${formatMoney(summary.totalPrice - budget)} over` : ""
  }`;

  return (
    <div
      data-c97-surface="paper"
      className="c97-offset c97-ff1-garage"
      style={{ padding: "var(--c97-sp-3)" }}
    >
      <div className="c97-ff1-garage-tier">
        {layout.driverSlots.map((slot, index) => (
          <GarageBox
            key={`driver-${index}`}
            slot={slot}
            locked={slot.asset ? lockedIds.has(slot.asset.id) : false}
          />
        ))}
      </div>
      <div className="c97-ff1-garage-tier" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {layout.constructorSlots.map((slot, index) => (
          <GarageBox
            key={`constructor-${index}`}
            slot={slot}
            locked={slot.asset ? lockedIds.has(slot.asset.id) : false}
          />
        ))}
      </div>
      <div>
        <div
          className="c97-ff1-budget"
          role="meter"
          aria-label="Budget used"
          aria-valuemin={0}
          aria-valuemax={budget}
          aria-valuenow={Math.min(summary.totalPrice, budget)}
          aria-valuetext={valueText}
        >
          <div className="c97-ff1-budget-fill" style={{ width: `${spentWidth * 100}%` }} />
          {isOver ? (
            <div
              className="c97-ff1-budget-over"
              style={{ left: `${budgetLineAt * 100}%`, width: `${overWidth * 100}%` }}
            />
          ) : null}
          {isOver ? (
            <div className="c97-ff1-budget-line" aria-hidden="true" style={{ left: `${budgetLineAt * 100}%` }} />
          ) : null}
        </div>
        <p className="c97-mono mb-0" style={{ marginTop: "var(--c97-sp-1)", fontSize: "var(--c97-fs-small)" }}>
          {valueText}
          {!isOver && summary.totalPrice < budget ? ` (${formatMoney(budget - summary.totalPrice)} left)` : ""}
        </p>
      </div>
    </div>
  );
}
