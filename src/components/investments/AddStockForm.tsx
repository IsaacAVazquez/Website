"use client";

import { Plus, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { ModernButton } from "@/components/ui/ModernButton";
import { TerminalPanel } from "./TerminalPanel";
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
      <span className="block text-xs font-medium text-[var(--c97-ink-2)]" style={{ marginBottom: "var(--c97-sp-0)" }}>{label}</span>
      <input
        id={id}
        name={id}
        className="min-h-[44px] w-full text-sm border-0 border-b border-[var(--c97-ink-2)] bg-[var(--c97-panel)] text-[var(--c97-ink)] placeholder:text-[var(--c97-label)] focus:border-[var(--c97-accent)] transition" style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-1)" }}
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
        message: `${sym} is not in the curated research set, so market quotes are unavailable for that holding.`,
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
        <Plus size={16} /> Add Holding
      </ModernButton>
    );
  }

  return (
    <TerminalPanel padding="sm" ariaLabel="Add stock form">
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--c97-sp-2)" }}>
        <div>
          <h3 className="text-sm font-semibold text-[var(--c97-ink)]">Add position</h3>
          <p className="text-xs text-[var(--c97-label)]" style={{ marginTop: "var(--c97-sp-0)" }}>
            Save a holding locally to include it in portfolio analytics.
          </p>
        </div>
        <button
          onClick={() => { setOpen(false); clearError(); }}
          className="text-[var(--c97-label)] hover:text-[var(--c97-ink)] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close add stock form"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--c97-sp-1)", marginBottom: "var(--c97-sp-2)" }}>
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
            label="Avg cost ($)"
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
            label="Purchase date (optional)"
            id="add-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {error && (
          <p id="add-form-error" role="alert" className="text-xs text-[var(--c97-negative)]" style={{ marginBottom: "var(--c97-sp-2)" }}>
            {error}
          </p>
        )}

        <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
          <ModernButton type="submit" variant="accent" size="sm" ariaLabel="Add position">
            <Plus size={14} /> Add position
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
