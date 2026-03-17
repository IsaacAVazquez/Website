"use client";

import React, { useState } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { Sparkline } from "./Sparkline";
import { IconPencil, IconTrash, IconCheck, IconX, IconSearch } from "@tabler/icons-react";
import { useStockData } from "@/hooks/useStockData";
import type { EnhancedHolding, PriceData, StockPrice } from "@/types/investment";

interface Props {
  holding: EnhancedHolding;
  onUpdate: (symbol: string, updates: { shares?: number; averageCost?: number }) => void;
  onRemove: (symbol: string) => void;
  onResearch: (symbol: string) => void;
}

function fmt(n: number, style: "currency" | "percent" | "decimal" = "decimal"): string {
  if (style === "currency")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
  if (style === "percent") return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function StockCard({ holding, onUpdate, onRemove, onResearch }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editShares, setEditShares] = useState(String(holding.shares));
  const [editCost, setEditCost] = useState(String(holding.averageCost));

  // Fetch sparkline data
  const { data: priceData } = useStockData<PriceData>(holding.symbol, "price");
  const sparklineData = React.useMemo(() => {
    if (!priceData || !Array.isArray(priceData)) return [];
    return (priceData as StockPrice[]).slice(-30).map((p) => p.close);
  }, [priceData]);

  const gainPositive = holding.gainLoss >= 0;
  const dayPositive = holding.dayChange >= 0;
  const valueColor = gainPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]";

  function handleSave() {
    const shares = parseFloat(editShares);
    const cost = parseFloat(editCost);
    if (!isNaN(shares) && shares > 0 && !isNaN(cost) && cost > 0) {
      onUpdate(holding.symbol, { shares, averageCost: cost });
    }
    setEditing(false);
  }

  function handleCancelEdit() {
    setEditShares(String(holding.shares));
    setEditCost(String(holding.averageCost));
    setEditing(false);
  }

  return (
    <WarmCard padding="sm" ariaLabel={`${holding.symbol} holding`} className="rounded-[28px] shadow-[var(--shadow-sm)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[var(--text-primary)]">{holding.symbol}</span>
            {holding.isLoading && (
              <span className="text-xs text-[var(--text-tertiary)]">Loading...</span>
            )}
          </div>
          <p className="max-w-[180px] truncate text-xs text-[var(--text-secondary)]">{holding.name}</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-2 py-1.5">
          {sparklineData.length >= 2 ? (
            <Sparkline data={sparklineData} width={80} height={30} />
          ) : (
            <div className="w-[80px] h-[30px]" />
          )}
        </div>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        {holding.isLoading ? (
          <div className="h-6 w-20 rounded bg-[var(--neutral-200)] animate-pulse" />
        ) : (
          <>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {fmt(holding.currentPrice, "currency")}
            </p>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              dayPositive
                ? "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]"
                : "bg-[color-mix(in_srgb,var(--color-error)_15%,transparent)] text-[var(--color-error)]"
            }`}>
              {fmt(holding.dayChangePercent, "percent")}
            </span>
          </>
        )}
      </div>

      {editing ? (
        <div className="mb-4 space-y-3">
          <label className="block">
            <span className="text-xs text-[var(--text-tertiary)]">Shares</span>
            <input
              type="number"
              value={editShares}
              onChange={(e) => setEditShares(e.target.value)}
              className="w-full mt-0.5 px-2 py-1.5 text-sm rounded border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              min="0"
              step="any"
            />
          </label>
          <label className="block">
            <span className="text-xs text-[var(--text-tertiary)]">Average Cost ($)</span>
            <input
              type="number"
              value={editCost}
              onChange={(e) => setEditCost(e.target.value)}
              className="w-full mt-0.5 px-2 py-1.5 text-sm rounded border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              min="0"
              step="any"
            />
          </label>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3">
              <span className="text-[var(--text-tertiary)] text-xs">Market Value</span>
              <p className="mt-1 font-medium text-[var(--text-primary)]">{fmt(holding.currentValue, "currency")}</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3">
              <span className="text-[var(--text-tertiary)] text-xs">Gain / Loss</span>
              <p className={`mt-1 font-medium ${valueColor}`}>
                {fmt(holding.gainLoss, "currency")}
              </p>
            </div>
          </div>

          {holding.allocationPercent !== null && (
            <div className="mb-4 rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-3">
              <div className="mb-1 flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>Allocation</span>
                <span>{holding.allocationPercent.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--neutral-200)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                  style={{ width: `${Math.min(holding.allocationPercent, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={holding.allocationPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${holding.symbol} allocation ${holding.allocationPercent.toFixed(1)}%`}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-primary)] pt-3">
        {editing ? (
          <>
            <ModernButton size="sm" variant="accent" onClick={handleSave} ariaLabel="Save changes">
              <IconCheck size={14} /> Save
            </ModernButton>
            <ModernButton size="sm" variant="ghost" onClick={handleCancelEdit} ariaLabel="Cancel editing">
              <IconX size={14} /> Cancel
            </ModernButton>
          </>
        ) : confirmDelete ? (
          <>
            <span className="text-xs text-[var(--color-error)] font-medium">Remove {holding.symbol}?</span>
            <ModernButton
              size="sm"
              variant="ghost"
              onClick={() => onRemove(holding.symbol)}
              ariaLabel={`Confirm remove ${holding.symbol}`}
              className="text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Yes
            </ModernButton>
            <ModernButton size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} ariaLabel="Cancel remove">
              No
            </ModernButton>
          </>
        ) : (
          <>
            <ModernButton
              size="sm"
              variant="ghost"
              onClick={() => onResearch(holding.symbol)}
              ariaLabel={`Research ${holding.symbol}`}
            >
              <IconSearch size={14} /> Research
            </ModernButton>
            <ModernButton
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              ariaLabel={`Edit ${holding.symbol}`}
            >
              <IconPencil size={14} /> Edit
            </ModernButton>
            <ModernButton
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              ariaLabel={`Remove ${holding.symbol}`}
              className="text-[var(--color-error)] hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <IconTrash size={14} /> Remove
            </ModernButton>
          </>
        )}
      </div>
    </WarmCard>
  );
}
