"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { InfoChip } from "@/components/football/InfoChip";
import {
  formatPriceUsd,
  formatTokenCount,
  sortFrontierModels,
  type FrontierSortDirection,
  type FrontierSortKey,
} from "@/lib/frontierModels";
import {
  FRONTIER_MODALITY_LABELS,
} from "@/app/frontier-models/frontier-models-state";
import type { FrontierModel } from "@/types/frontierModels";

interface FrontierModelsTableProps {
  models: FrontierModel[];
  selectedModelId: string | null;
  onSelectModel: (id: string | null) => void;
}

interface ColumnDef {
  key: FrontierSortKey;
  label: string;
  align: "left" | "right";
  defaultDirection: FrontierSortDirection;
}

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Model", align: "left", defaultDirection: "asc" },
  {
    key: "releaseDate",
    label: "Released",
    align: "left",
    defaultDirection: "desc",
  },
  {
    key: "contextWindow",
    label: "Context",
    align: "right",
    defaultDirection: "desc",
  },
  {
    key: "inputPrice",
    label: "Input / 1M",
    align: "right",
    defaultDirection: "asc",
  },
  {
    key: "outputPrice",
    label: "Output / 1M",
    align: "right",
    defaultDirection: "asc",
  },
];

function formatReleaseDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function FrontierModelsTable({
  models,
  selectedModelId,
  onSelectModel,
}: FrontierModelsTableProps) {
  const [sortKey, setSortKey] = useState<FrontierSortKey>("releaseDate");
  const [sortDirection, setSortDirection] =
    useState<FrontierSortDirection>("desc");

  const sorted = useMemo(
    () => sortFrontierModels(models, sortKey, sortDirection),
    [models, sortKey, sortDirection]
  );

  function toggleSort(column: ColumnDef) {
    if (sortKey === column.key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column.key);
    setSortDirection(column.defaultDirection);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectModel(selectedModelId === id ? null : id);
    }
  }

  return (
    <div className="home-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
              {COLUMNS.map((column) => {
                const isActive = sortKey === column.key;
                const ariaSort: "ascending" | "descending" | "none" = isActive
                  ? sortDirection === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`px-4 py-3 text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)] ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-left text-[var(--home-ink-muted)] transition-colors hover:text-[var(--home-ink)]"
                    >
                      <span>{column.label}</span>
                      <span aria-hidden="true" className="text-3xs">
                        {isActive ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th
                scope="col"
                className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]"
              >
                Modalities
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((model) => {
              const isExpanded = selectedModelId === model.id;
              return (
                <FrontierRow
                  key={model.id}
                  model={model}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    onSelectModel(isExpanded ? null : model.id)
                  }
                  onKeyDown={(event) => handleRowKeyDown(event, model.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface FrontierRowProps {
  model: FrontierModel;
  isExpanded: boolean;
  onToggle: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => void;
}

function FrontierRow({ model, isExpanded, onToggle, onKeyDown }: FrontierRowProps) {
  return (
    <>
      <tr
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`frontier-row-detail-${model.id}`}
        onClick={onToggle}
        onKeyDown={onKeyDown}
        className="cursor-pointer border-b border-[var(--home-rule)] transition-colors hover:bg-[var(--home-paper-alt)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
      >
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
              {model.providerLabel}
            </span>
            <span className="mt-1 flex items-center gap-2 text-base font-semibold text-[var(--home-ink)]">
              {model.name}
              {model.reasoning ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-2 py-0.5 text-3xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]"
                  title="Supports extended-thinking / reasoning mode"
                >
                  <Sparkles aria-hidden="true" size={11} />
                  Reasoning
                </span>
              ) : null}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-[var(--home-ink-muted)]">
          {formatReleaseDate(model.releaseDate)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-[var(--home-ink)]">
          {formatTokenCount(model.contextWindow)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-[var(--home-ink)]">
          {formatPriceUsd(model.inputPricePerMTokens)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-[var(--home-ink)]">
          {formatPriceUsd(model.outputPricePerMTokens)}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {model.modalities.map((modality) => (
              <span
                key={modality}
                className="inline-flex items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-2 py-0.5 text-2xs font-medium text-[var(--home-ink-muted)]"
              >
                {FRONTIER_MODALITY_LABELS[modality]}
              </span>
            ))}
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr id={`frontier-row-detail-${model.id}`} className="border-b border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
          <td colSpan={6} className="px-4 py-5">
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <p className="m-0 text-sm leading-7 text-[var(--home-ink)]">
                {model.editorialNote}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[var(--home-ink-muted)]">
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em]">
                    Max output
                  </dt>
                  <dd className="m-0 font-mono text-[var(--home-ink)]">
                    {formatTokenCount(model.maxOutputTokens)} tokens
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em]">
                    Knowledge cutoff
                  </dt>
                  <dd className="m-0 font-mono text-[var(--home-ink)]">
                    {model.knowledgeCutoff ?? "—"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em]">
                    Modalities
                  </dt>
                  <dd className="m-0 mt-1 flex flex-wrap gap-1.5">
                    {model.modalities.map((modality) => (
                      <InfoChip
                        key={modality}
                        label={FRONTIER_MODALITY_LABELS[modality]}
                      />
                    ))}
                  </dd>
                </div>
                {model.docsUrl ? (
                  <div className="col-span-2">
                    <a
                      href={model.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--home-ink)] underline-offset-4 hover:underline"
                    >
                      Provider docs
                      <ExternalLink aria-hidden="true" size={14} />
                    </a>
                  </div>
                ) : null}
              </dl>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
