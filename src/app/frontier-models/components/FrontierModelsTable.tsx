"use client";

import { useMemo, useState } from "react";
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
import "../frontier-models.css";

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

// Under md the sheet prints the model, its context window, and both token
// prices, which is what fits a phone column. The release date and modalities
// move into the row's expansion.
const WIDE_ONLY_CELL = "hidden md:table-cell";

const RELEASE_COLUMN: ColumnDef = {
  key: "releaseDate",
  label: "Released",
  align: "left",
  defaultDirection: "desc",
};

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Model", align: "left", defaultDirection: "asc" },
  RELEASE_COLUMN,
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

  const sortsByRelease = sortKey === RELEASE_COLUMN.key;

  return (
    <div className="overflow-x-auto" role="region" aria-label="Model spec sheet (scrolls sideways)" tabIndex={0}>
      {/* The release column is hidden under md, so its sort gets a control of
          its own there. The wrapper carries the breakpoint because the button
          class sets its own display. */}
      <div className="md:hidden">
        <button
          type="button"
          aria-pressed={sortsByRelease}
          onClick={() => toggleSort(RELEASE_COLUMN)}
          className="c97-btn-ghost"
        >
          Sort by release date
          {sortsByRelease ? (
            <span aria-hidden="true" className="text-3xs" style={{ marginInlineStart: "var(--c97-sp-0)" }}>
              {sortDirection === "asc" ? "▲" : "▼"}
            </span>
          ) : null}
        </button>
      </div>
      <table className="c97-table c97-frontier-spec">
        <thead>
          <tr>
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
                  data-align={column.align === "right" ? "end" : undefined}
                  className={column === RELEASE_COLUMN ? WIDE_ONLY_CELL : undefined}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    className="inline-flex min-h-[44px] items-center hover:text-[var(--c97-ink)]" style={{ gap: "var(--c97-sp-0)" }}
                  >
                    <span>{column.label}</span>
                    <span aria-hidden="true" className="text-3xs">
                      {isActive ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              );
            })}
            <th scope="col" className={WIDE_ONLY_CELL}>Modalities</th>
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
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface FrontierRowProps {
  model: FrontierModel;
  isExpanded: boolean;
  onToggle: () => void;
}

function FrontierRow({ model, isExpanded, onToggle }: FrontierRowProps) {
  const reasoningBadge = model.reasoning ? (
    <span
      className="inline-flex items-center border py-0.5 text-3xs font-semibold uppercase tracking-[0.14em]"
      style={{
        paddingInline: "var(--c97-sp-1)",
        borderColor: "var(--c97-rule)",
        background: "var(--c97-field)",
        color: "var(--c97-ink-2)", gap: "var(--c97-sp-0)" }}
      title="Supports extended-thinking / reasoning mode"
    >
      <Sparkles aria-hidden="true" size={11} />
      Reasoning
    </span>
  ) : null;

  return (
    <>
      {/* The row stays clickable for pointer users, but the keyboard control
          is a real button on the name, which takes the system focus ring.
          role="button" on a <tr> broke table semantics and nested the docs
          link inside an interactive element. */}
      <tr onClick={onToggle} className="cursor-pointer">
        <td>
          <div className="flex flex-col" style={{ overflowWrap: "anywhere" }}>
            <span
              className="text-2xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--c97-ink-2)" }}
            >
              {model.providerLabel}
            </span>
            <span
              className="flex items-center text-base font-semibold"
              style={{ gap: "var(--c97-sp-1)", color: "var(--c97-ink)", marginTop: "var(--c97-sp-0)" }}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={isExpanded ? `frontier-row-detail-${model.id}` : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle();
                }}
                className="inline-flex min-h-[44px] items-center text-left"
                style={{ color: "var(--c97-ink)", fontWeight: 600 }}
              >
                {model.name}
              </button>
              {reasoningBadge ? <span className="hidden md:inline">{reasoningBadge}</span> : null}
            </span>
          </div>
        </td>
        <td style={{ color: "var(--c97-ink-2)" }} className={WIDE_ONLY_CELL}>
          {formatReleaseDate(model.releaseDate)}
        </td>
        <td data-align="end" className="c97-mono" style={{ color: "var(--c97-ink)" }}>
          {formatTokenCount(model.contextWindow)}
        </td>
        <td data-align="end" className="c97-mono" style={{ color: "var(--c97-ink)" }}>
          {formatPriceUsd(model.inputPricePerMTokens)}
        </td>
        <td data-align="end" className="c97-mono" style={{ color: "var(--c97-ink)" }}>
          {formatPriceUsd(model.outputPricePerMTokens)}
        </td>
        <td className={WIDE_ONLY_CELL}>
          <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-0)" }}>
            {model.modalities.map((modality) => (
              <span
                key={modality}
                className="inline-flex items-center border py-0.5 text-2xs font-medium"
                style={{
                  paddingInline: "var(--c97-sp-1)",
                  borderColor: "var(--c97-rule)",
                  background: "var(--c97-surface)",
                  color: "var(--c97-ink-2)",
                }}
              >
                {FRONTIER_MODALITY_LABELS[modality]}
              </span>
            ))}
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr id={`frontier-row-detail-${model.id}`}>
          <td colSpan={6} style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-2)" }}>
            {/* The badge and the release date print here only under md, where
                the row hides them. */}
            {reasoningBadge ? (
              <div className="md:hidden" style={{ marginBottom: "var(--c97-sp-1)" }}>
                {reasoningBadge}
              </div>
            ) : null}
            <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" style={{ gap: "var(--c97-sp-2)" }}>
              <p className="text-sm leading-7" style={{ color: "var(--c97-ink)", margin: "0" }}>
                {model.editorialNote}
              </p>
              <dl
                className="grid grid-cols-2 text-sm"
                style={{ rowGap: "var(--c97-sp-1)", columnGap: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
              >
                <div className="col-span-2 md:hidden">
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em]">
                    Released
                  </dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0" }}>
                    {formatReleaseDate(model.releaseDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em]">
                    Max output
                  </dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0" }}>
                    {model.maxOutputTokens === null
                      ? "Not published"
                      : `${formatTokenCount(model.maxOutputTokens)} tokens`}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em]">
                    Knowledge cutoff
                  </dt>
                  <dd className="c97-mono" style={{ color: "var(--c97-ink)", margin: "0" }}>
                    {model.knowledgeCutoff ?? "Not published"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-2xs font-semibold uppercase tracking-[0.14em]">
                    Modalities
                  </dt>
                  <dd className="flex flex-wrap" style={{ margin: "0", marginTop: "var(--c97-sp-0)", gap: "var(--c97-sp-0)" }}>
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
                      className="inline-flex min-h-[44px] items-center text-sm font-semibold underline-offset-4 hover:underline"
                      style={{ color: "var(--c97-ink)", gap: "var(--c97-sp-0)" }}
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
