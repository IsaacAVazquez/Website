"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ModernButton } from "@/components/ui/ModernButton";
import { TerminalPanel } from "./TerminalPanel";
import { IconPlus, IconX } from "@tabler/icons-react";
import { getClientInvestmentsIndex } from "@/lib/investmentsClientData";
import type { InvestmentIndexEntry, PortfolioHolding } from "@/types/investment";

interface Props {
  onAdd: (holding: PortfolioHolding) => void;
}

const SYMBOL_RE = /^[A-Z0-9.-]{1,10}$/;

function Field({
  label,
  id,
  ...props
}: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-xs font-medium text-[var(--home-ink-muted)] mb-1">{label}</span>
      <input
        id={id}
        name={id}
        className="min-h-[44px] w-full px-3 py-2 text-sm rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink)] placeholder:text-[var(--home-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--home-signal)] focus:border-transparent transition"
        {...props}
      />
    </label>
  );
}

export function AddStockForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<"symbol" | "shares" | "cost" | null>(null);
  const [indexEntries, setIndexEntries] = useState<InvestmentIndexEntry[]>([]);
  const [indexError, setIndexError] = useState(false);

  const supportedSymbols = useMemo(
    () => new Set(indexEntries.map((entry) => entry.symbol)),
    [indexEntries]
  );

  useEffect(() => {
    let active = true;

    getClientInvestmentsIndex()
      .then((index) => {
        if (!active) return;
        setIndexEntries(index.entries ?? []);
        setIndexError(false);
      })
      .catch(() => {
        if (!active) return;
        setIndexEntries([]);
        setIndexError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  function clearError() {
    setError(null);
    setErrorField(null);
  }

  function validate(): { field: "symbol" | "shares" | "cost"; message: string } | null {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return { field: "symbol", message: "Symbol is required." };
    if (!SYMBOL_RE.test(sym)) return { field: "symbol", message: "Invalid symbol format (e.g. AAPL, BRK-B)." };
    if (indexError) {
      return {
        field: "symbol",
        message: "Ticker coverage could not be checked. Try again in a moment.",
      };
    }
    if (supportedSymbols.size === 0) {
      return {
        field: "symbol",
        message: "Ticker coverage is still loading. Try again in a moment.",
      };
    }
    if (!supportedSymbols.has(sym)) {
      return {
        field: "symbol",
        message: `${sym} is not in the curated research set, so live prices are unavailable for that holding.`,
      };
    }
    const sh = parseFloat(shares);
    if (!shares || isNaN(sh) || sh <= 0) return { field: "shares", message: "Shares must be a positive number." };
    const c = parseFloat(cost);
    if (!cost || isNaN(c) || c <= 0) return { field: "cost", message: "Average cost must be a positive number." };
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err.message); setErrorField(err.field); return; }

    onAdd({
      symbol: symbol.trim().toUpperCase(),
      shares: parseFloat(shares),
      averageCost: parseFloat(cost),
      ...(date ? { purchaseDate: date } : {}),
    });

    setSymbol("");
    setShares("");
    setCost("");
    setDate("");
    clearError();
    setOpen(false);
  }

  if (!open) {
    return (
      <ModernButton variant="accent" size="md" onClick={() => setOpen(true)} ariaLabel="Add holding">
        <IconPlus size={16} /> Add Holding
      </ModernButton>
    );
  }

  return (
    <TerminalPanel padding="sm" ariaLabel="Add stock form">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--home-ink)]">Add Position</h3>
          <p className="mt-1 text-xs text-[var(--home-ink-soft)]">
            Save a holding locally to include it in portfolio analytics.
          </p>
        </div>
        <button
          onClick={() => { setOpen(false); clearError(); }}
          className="text-[var(--home-ink-soft)] hover:text-[var(--home-ink)] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close add stock form"
        >
          <IconX size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Symbol"
            id="add-symbol"
            value={symbol}
            onChange={(e) => { setSymbol(e.target.value.toUpperCase()); clearError(); }}
            placeholder="AAPL"
            autoFocus
            autoComplete="off"
            list="add-symbol-options"
            aria-invalid={errorField === "symbol" ? true : undefined}
            aria-describedby={errorField === "symbol" ? "add-form-error" : undefined}
          />
          <datalist id="add-symbol-options">
            {indexEntries.map((entry) => (
              <option
                key={entry.symbol}
                value={entry.symbol}
                label={entry.longName !== entry.symbol ? entry.longName : entry.shortName}
              />
            ))}
          </datalist>
          <Field
            label="Shares"
            id="add-shares"
            type="number"
            value={shares}
            onChange={(e) => { setShares(e.target.value); clearError(); }}
            placeholder="10"
            min="0"
            step="any"
            aria-invalid={errorField === "shares" ? true : undefined}
            aria-describedby={errorField === "shares" ? "add-form-error" : undefined}
          />
          <Field
            label="Avg Cost ($)"
            id="add-cost"
            type="number"
            value={cost}
            onChange={(e) => { setCost(e.target.value); clearError(); }}
            placeholder="150.00"
            min="0"
            step="any"
            aria-invalid={errorField === "cost" ? true : undefined}
            aria-describedby={errorField === "cost" ? "add-form-error" : undefined}
          />
          <Field
            label="Purchase Date (optional)"
            id="add-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {error && (
          <p id="add-form-error" role="alert" className="mb-4 text-xs text-[var(--home-negative)]">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <ModernButton type="submit" variant="accent" size="sm" ariaLabel="Add position">
            <IconPlus size={14} /> Add Position
          </ModernButton>
          <ModernButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setOpen(false); clearError(); }}
            ariaLabel="Cancel"
          >
            Cancel
          </ModernButton>
        </div>
      </form>
    </TerminalPanel>
  );
}
