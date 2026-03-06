"use client";

import React, { useState } from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { useStockData } from "@/hooks/useStockData";
import { IconChevronRight, IconMicrophone } from "@tabler/icons-react";
import type { TranscriptsData, TranscriptContent } from "@/types/investment";
import { ErrorState } from "./ErrorState";

interface Props { symbol: string }

function TranscriptViewer({ symbol, year, quarter }: { symbol: string; year: number; quarter: number }) {
  const section = `transcript_${year}_${quarter}`;
  const { data, isLoading, error } = useStockData<TranscriptContent>(symbol, section);

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-[var(--neutral-200)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-[var(--text-tertiary)] py-4">Transcript unavailable.</p>;
  }

  const paragraphs = data.paragraphs ?? [];

  return (
    <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 py-3">
      {paragraphs.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">No transcript content available.</p>
      ) : (
        paragraphs.map((p, i) => (
          <div key={i} className="border-l-2 border-[var(--border-primary)] pl-3">
            <p className="text-xs font-semibold text-[var(--color-primary)] mb-0.5">{p.speaker}</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{p.content}</p>
          </div>
        ))
      )}
    </div>
  );
}

export function TranscriptsPanel({ symbol }: Props) {
  const { data: transcriptsRaw, isLoading, error, isNotFetched, refetch } = useStockData<TranscriptsData>(symbol, "transcripts");
  const [selected, setSelected] = useState<{ year: number; quarter: number } | null>(null);

  const transcripts = Array.isArray(transcriptsRaw) ? transcriptsRaw : [];

  return (
    <WarmCard padding="sm">
      <div className="flex items-center gap-2 mb-4">
        <IconMicrophone size={16} className="text-[var(--color-primary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Earnings Call Transcripts</h3>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--neutral-200)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (error || transcripts.length === 0) && (
        <ErrorState message={error ?? "No transcripts available"} isNotFetched={isNotFetched} onRetry={refetch} />
      )}

      {!isLoading && transcripts.length > 0 && (
        <div className="flex gap-4">
          {/* Transcript list */}
          <ul className="w-44 shrink-0 space-y-1" role="list">
            {transcripts.map((t, i) => {
              const isActive =
                selected?.year === t.fiscalYear && selected?.quarter === t.fiscalQuarter;
              return (
                <li key={i}>
                  <button
                    onClick={() =>
                      setSelected({ year: t.fiscalYear, quarter: t.fiscalQuarter })
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between min-h-[44px] ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                    }`}
                    aria-pressed={isActive}
                  >
                    <span>
                      {t.fiscalYear} Q{t.fiscalQuarter}
                    </span>
                    <IconChevronRight size={14} />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Transcript content */}
          <div className="flex-1 min-w-0">
            {selected ? (
              <TranscriptViewer
                symbol={symbol}
                year={selected.year}
                quarter={selected.quarter}
              />
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] py-4">
                Select a transcript on the left to read it.
              </p>
            )}
          </div>
        </div>
      )}
    </WarmCard>
  );
}
