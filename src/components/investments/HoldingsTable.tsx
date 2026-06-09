"use client";

import React, { useState } from "react";
import { IconCheck, IconPencil, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { useStockData } from "@/hooks/useStockData";
import type { EnhancedHolding, PriceData, StockPrice } from "@/types/investment";

interface Props {
  holdings: EnhancedHolding[];
  onUpdate: (symbol: string, updates: { shares?: number; averageCost?: number }) => void;
  onRemove: (symbol: string) => void;
  onResearch: (symbol: string) => void;
}

const TICKER_COLORS = [
  "#5672F8", // haze
  "#5C8531", // green
  "#4D8AD0", // blue
  "#B22B2F", // red
  "#1F7A6E", // teal
  "#6B5A3E", // bronze
  "#3F4B57", // slate
  "#4A6CF0", // azure
];

function fmtCurrency(n: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

function fmtSignedCurrency(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${fmtCurrency(Math.abs(n))}`;
}

function fmtPercent(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

function sparkPath(data: number[], w = 86, h = 26): string {
  if (data.length < 2) return "";
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const stepX = w / (data.length - 1);
  return data
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

interface RowProps {
  holding: EnhancedHolding;
  color: string;
  onUpdate: Props["onUpdate"];
  onRemove: Props["onRemove"];
  onResearch: Props["onResearch"];
}

function HoldingRow({ holding, color, onUpdate, onRemove, onResearch }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editShares, setEditShares] = useState(String(holding.shares));
  const [editCost, setEditCost] = useState(String(holding.averageCost));

  const { data: priceData } = useStockData<PriceData>(holding.symbol, "price");
  const sparkData = React.useMemo(() => {
    if (!priceData || !Array.isArray(priceData)) return [];
    return (priceData as StockPrice[]).slice(-30).map((p) => p.close);
  }, [priceData]);

  const dayPositive = holding.dayChangePercent >= 0;
  const plPositive = holding.gainLoss >= 0;
  const allocPct = holding.allocationPercent ?? 0;
  const allocBarWidth = Math.min(100, allocPct * 4);

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

  if (editing) {
    return (
      <tr>
        <td colSpan={8} className="!py-3">
          <div className="flex flex-wrap items-center gap-3 px-1">
            <div className="invest-ticker">
              <div className="invest-logo" style={{ background: color }}>
                {holding.symbol.replace(".", "").slice(0, 4)}
              </div>
              <div className="invest-ticker-info">
                <div className="invest-ticker-sym">{holding.symbol}</div>
                <div className="invest-ticker-name">Edit position</div>
              </div>
            </div>
            <label className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
              Shares
              <input
                type="number"
                step="0.0001"
                min="0"
                value={editShares}
                onChange={(e) => setEditShares(e.target.value)}
                className="ml-2 w-28 rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-3 py-1.5 text-sm text-[var(--home-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--home-haze)]/40"
              />
            </label>
            <label className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
              Avg cost
              <input
                type="number"
                step="0.01"
                min="0"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                className="ml-2 w-28 rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-3 py-1.5 text-sm text-[var(--home-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--home-haze)]/40"
              />
            </label>
            <div className="invest-row-actions ml-auto">
              <button
                type="button"
                className="invest-ghost is-primary"
                onClick={handleSave}
              >
                <IconCheck size={14} aria-hidden="true" />
                Save
              </button>
              <button
                type="button"
                className="invest-ghost"
                onClick={handleCancelEdit}
              >
                <IconX size={14} aria-hidden="true" />
                Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <div className="invest-ticker">
          <div className="invest-logo" style={{ background: color }}>
            {holding.symbol.replace(".", "").slice(0, 4)}
          </div>
          <div className="invest-ticker-info">
            <div className="invest-ticker-sym">{holding.symbol}</div>
            <div className="invest-ticker-name" title={holding.name ?? holding.symbol}>
              {holding.name ?? holding.symbol}
            </div>
          </div>
        </div>
      </td>
      <td className="num">{fmtCurrency(holding.currentPrice)}</td>
      <td className="num">
        <span
          className={dayPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}
          style={{ fontWeight: 600 }}
        >
          {fmtPercent(holding.dayChangePercent)}
        </span>
      </td>
      <td className="col-trend">
        {sparkData.length >= 2 ? (
          <svg className="invest-spark" viewBox="0 0 86 26" preserveAspectRatio="none" aria-hidden="true">
            <path
              d={sparkPath(sparkData)}
              fill="none"
              stroke={color}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="text-2xs text-[var(--home-ink-muted)]">—</span>
        )}
      </td>
      <td className="num" style={{ color: "var(--home-ink-muted)", fontWeight: 600 }}>
        {fmtCurrency(holding.currentValue)}
      </td>
      <td>
        <div className="invest-alloc-bar">
          <div className="invest-alloc-track">
            <div
              className="invest-alloc-fill"
              style={{ width: `${allocBarWidth}%`, background: color }}
            />
          </div>
          <span className="invest-alloc-pct">{allocPct.toFixed(1)}%</span>
        </div>
      </td>
      <td className="num">
        <div
          className={plPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}
          style={{ fontWeight: 600 }}
        >
          {fmtSignedCurrency(holding.gainLoss)}
        </div>
        <div className="text-2xs text-[var(--home-ink-muted)]">
          {fmtPercent(holding.gainLossPercent)}
        </div>
      </td>
      <td>
        <div className="invest-row-actions">
          {confirmDelete ? (
            <>
              <button
                type="button"
                className="invest-ghost is-primary"
                aria-label="Confirm remove holding"
                onClick={() => {
                  onRemove(holding.symbol);
                  setConfirmDelete(false);
                }}
              >
                <IconCheck size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="invest-ghost"
                aria-label="Cancel remove"
                onClick={() => setConfirmDelete(false)}
              >
                <IconX size={14} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="invest-ghost is-primary"
                onClick={() => onResearch(holding.symbol)}
                aria-label={`Research ${holding.symbol}`}
                title={`Research ${holding.symbol}`}
              >
                <IconSearch size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="invest-ghost"
                onClick={() => setEditing(true)}
                aria-label={`Edit ${holding.symbol}`}
                title={`Edit ${holding.symbol}`}
              >
                <IconPencil size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="invest-ghost"
                onClick={() => setConfirmDelete(true)}
                aria-label={`Remove ${holding.symbol}`}
                title={`Remove ${holding.symbol}`}
              >
                <IconTrash size={14} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export function HoldingsTable({ holdings, onUpdate, onRemove, onResearch }: Props) {
  const sorted = React.useMemo(
    () =>
      [...holdings].sort(
        (a, b) => (b.allocationPercent ?? 0) - (a.allocationPercent ?? 0),
      ),
    [holdings],
  );

  return (
    <section id="holdings-list" className="invest-panel scroll-mt-28">
      <div className="invest-panel-head">
        <div>
          <h2>Holdings</h2>
          <div className="invest-panel-head-meta">
            {holdings.length} {holdings.length === 1 ? "position" : "positions"} · sorted by allocation
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="invest-holdings">
          <thead>
            <tr>
              <th>Asset</th>
              <th className="num">Price</th>
              <th className="num">Day</th>
              <th className="col-trend">Trend (30d)</th>
              <th className="num">Holdings</th>
              <th>Allocation</th>
              <th className="num">P/L</th>
              <th aria-label="Row actions" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, i) => (
              <HoldingRow
                key={h.symbol}
                holding={h}
                color={TICKER_COLORS[i % TICKER_COLORS.length]}
                onUpdate={onUpdate}
                onRemove={onRemove}
                onResearch={onResearch}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
