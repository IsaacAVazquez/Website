"use client";

import { TrendingUp } from "lucide-react";
import React from "react";
import { TerminalPanel } from "./TerminalPanel";

export interface MetricRow {
  label: string;
  valueA: string | number | null | undefined;
  valueB: string | number | null | undefined;
  /** `null` for metrics with no meaningful "winner" (e.g. absolute prices). */
  higherIsBetter: boolean | null;
}

interface Props {
  title: string;
  rows: MetricRow[];
  symbolA: string;
  symbolB: string;
}

function formatValue(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function compareValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  higherIsBetter: boolean | null
): "a" | "b" | "tie" | "none" {
  if (higherIsBetter === null) return "none";
  const numA = typeof a === "number" ? a : parseFloat(String(a ?? ""));
  const numB = typeof b === "number" ? b : parseFloat(String(b ?? ""));
  if (isNaN(numA) || isNaN(numB)) return "none";
  if (numA === numB) return "tie";
  const aWins = higherIsBetter ? numA > numB : numA < numB;
  return aWins ? "a" : "b";
}

export function ComparisonMetricTable({ title, rows, symbolA, symbolB }: Props) {
  return (
    <TerminalPanel padding="sm">
      <h3 className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginBottom: "var(--c97-sp-2)" }}>{title}</h3>
      <div className="overflow-x-auto" role="region" tabIndex={0} aria-label={`${title} comparison table`}>
        <table className="w-full text-sm" aria-label={`${title} comparison`}>
          <thead>
            <tr className="border-b border-[var(--c97-rule)]">
              <th className="text-left text-xs font-medium text-[var(--c97-label)] w-1/2" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-2)" }}>
                Metric
              </th>
              <th className="text-right text-xs font-medium text-[var(--c97-accent)] whitespace-nowrap" style={{ paddingBlock: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-1)" }}>
                {symbolA}
              </th>
              <th className="text-right text-xs font-medium text-[var(--c97-warning)] whitespace-nowrap" style={{ paddingBlock: "var(--c97-sp-1)", paddingLeft: "var(--c97-sp-1)" }}>
                {symbolB}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const winner = compareValues(row.valueA, row.valueB, row.higherIsBetter);
              return (
                <tr key={i} className="border-b border-[var(--c97-rule)] last:border-0">
                  <td className="text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)", paddingRight: "var(--c97-sp-2)" }}>{row.label}</td>
                  <td className="text-right" style={{ paddingBlock: "var(--c97-sp-1)", paddingInline: "var(--c97-sp-1)" }}>
                    {winner === "a" ? (
                      <span className="inline-flex items-center justify-end font-semibold text-[var(--c97-positive)]" style={{ gap: "var(--c97-sp-0)" }}>
                        {formatValue(row.valueA)}
                        <TrendingUp size={13} aria-hidden="true" />
                        <span className="sr-only">(better)</span>
                      </span>
                    ) : (
                      <span className="text-[var(--c97-ink-2)]">{formatValue(row.valueA)}</span>
                    )}
                  </td>
                  <td className="text-right" style={{ paddingBlock: "var(--c97-sp-1)", paddingLeft: "var(--c97-sp-1)" }}>
                    {winner === "b" ? (
                      <span className="inline-flex items-center justify-end font-semibold text-[var(--c97-positive)]" style={{ gap: "var(--c97-sp-0)" }}>
                        {formatValue(row.valueB)}
                        <TrendingUp size={13} aria-hidden="true" />
                        <span className="sr-only">(better)</span>
                      </span>
                    ) : (
                      <span className="text-[var(--c97-ink-2)]">{formatValue(row.valueB)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TerminalPanel>
  );
}
