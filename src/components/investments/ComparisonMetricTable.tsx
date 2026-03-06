"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { IconTrendingUp } from "@tabler/icons-react";

export interface MetricRow {
  label: string;
  valueA: string | number | null | undefined;
  valueB: string | number | null | undefined;
  higherIsBetter: boolean;
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
  higherIsBetter: boolean
): "a" | "b" | "tie" | "none" {
  const numA = typeof a === "number" ? a : parseFloat(String(a ?? ""));
  const numB = typeof b === "number" ? b : parseFloat(String(b ?? ""));
  if (isNaN(numA) || isNaN(numB)) return "none";
  if (numA === numB) return "tie";
  const aWins = higherIsBetter ? numA > numB : numA < numB;
  return aWins ? "a" : "b";
}

export function ComparisonMetricTable({ title, rows, symbolA, symbolB }: Props) {
  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={`${title} comparison`}>
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="text-left py-2 pr-4 text-xs font-medium text-[var(--text-tertiary)] w-1/2">
                Metric
              </th>
              <th className="text-right py-2 px-3 text-xs font-medium text-[var(--color-primary)] whitespace-nowrap">
                {symbolA}
              </th>
              <th className="text-right py-2 pl-3 text-xs font-medium text-[var(--color-warning)] whitespace-nowrap">
                {symbolB}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const winner = compareValues(row.valueA, row.valueB, row.higherIsBetter);
              return (
                <tr key={i} className="border-b border-[var(--border-primary)] last:border-0">
                  <td className="py-2 pr-4 text-[var(--text-secondary)]">{row.label}</td>
                  <td className="py-2 px-3 text-right">
                    {winner === "a" ? (
                      <span className="inline-flex items-center justify-end gap-1 font-semibold text-[var(--color-success)]">
                        {formatValue(row.valueA)}
                        <IconTrendingUp size={13} />
                      </span>
                    ) : (
                      <span className="text-[var(--text-secondary)]">{formatValue(row.valueA)}</span>
                    )}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    {winner === "b" ? (
                      <span className="inline-flex items-center justify-end gap-1 font-semibold text-[var(--color-success)]">
                        {formatValue(row.valueB)}
                        <IconTrendingUp size={13} />
                      </span>
                    ) : (
                      <span className="text-[var(--text-secondary)]">{formatValue(row.valueB)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </WarmCard>
  );
}
