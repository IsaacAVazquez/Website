"use client";

import { useId, useState } from "react";
import { SegmentedTabs } from "@/components/football/SegmentedTabs";
import { useBlackjackProgress } from "@/hooks/useBlackjackProgress";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import type { Card } from "@/lib/blackjack/cards";
import { BLACKJACK_PROGRESS_STORAGE_KEY } from "@/lib/blackjack/progress";
import { TABLE_RULES, getTableRules } from "@/lib/blackjack/tableRules";
import { CountingView } from "./CountingView";
import { ProgressView } from "./ProgressView";
import { StrategyChartView } from "./StrategyChartView";
import { TableView } from "./TableView";
import "./blackjack-trainer.css";

const VIEWS = [
  { id: "table", label: "Table" },
  { id: "chart", label: "Strategy chart" },
  { id: "counting", label: "Counting drill" },
  { id: "progress", label: "Progress" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export function BlackjackTrainerClient({
  shuffleShoe,
  shuffleDeck,
}: {
  /** Both are injected by tests so the cards are known. */
  shuffleShoe?: (decks: number) => Card[];
  shuffleDeck?: () => Card[];
}) {
  const ids = useId();
  const { progress, update, reset } = useBlackjackProgress();
  const persistenceStatus = useLocalStoragePersistenceStatus(BLACKJACK_PROGRESS_STORAGE_KEY);
  const [view, setView] = useState<ViewId>("table");
  const rules = getTableRules(progress.rulesId);
  const panelId = `${ids}-panel`;

  return (
    <div className="bj-root">
      <div className="c97-shell c97-frame bj-page">
        <header className="bj-head">
          <div className="bj-title">
            <h1>Blackjack Trainer</h1>
            <p className="bj-lede">
              Play hands against a dealer and get every decision graded against basic strategy for the
              table&apos;s rules, then drill the count one deck at a time.
            </p>
          </div>
          <div className="bj-control bj-rules">
            <label htmlFor={`${ids}-rules`}>Table rules</label>
            <select
              id={`${ids}-rules`}
              className="c97-field"
              aria-describedby={`${ids}-rules-summary`}
              value={rules.id}
              onChange={(event) => {
                const rulesId = getTableRules(event.target.value).id;
                update((current) => ({ ...current, rulesId }));
              }}
            >
              {TABLE_RULES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
            <span id={`${ids}-rules-summary`} className="bj-rules-summary">
              {rules.summary}
            </span>
          </div>
        </header>

        <SegmentedTabs
          tabs={VIEWS.map((entry) => ({ id: entry.id, label: entry.label }))}
          activeId={view}
          onChange={(id) => setView(id as ViewId)}
          ariaLabel="Trainer views"
          idPrefix={`${ids}-tab`}
          panelId={panelId}
          className="c97-segmented bj-tabs"
        />

        <div id={panelId} role="tabpanel" aria-labelledby={`${ids}-tab-${view}`} className="bj-panel">
          {/* The table stays mounted so a hand in play survives a look at the chart. */}
          <div hidden={view !== "table"}>
            <TableView rules={rules} update={update} shuffleShoe={shuffleShoe} active={view === "table"} />
          </div>
          {view === "chart" ? <StrategyChartView rules={rules} /> : null}
          {view === "counting" ? <CountingView update={update} shuffleDeck={shuffleDeck} /> : null}
          {view === "progress" ? <ProgressView progress={progress} onReset={reset} /> : null}
        </div>

        <footer className="bj-foot">
          <p>
            This is a practice table with no money on it. The chart is basic strategy for shoe games of four
            to eight decks where the dealer checks for blackjack, and single-deck, double-deck, and
            no-hole-card tables each change a few plays.
          </p>
          {persistenceStatus === "memory-only" ? (
            <p role="status">
              Your record is available in this tab, but browser storage is unavailable, so it may not remain
              after you close it.
            </p>
          ) : (
            <p>Your record is saved in this browser only, with no account or server behind it.</p>
          )}
        </footer>
      </div>
    </div>
  );
}
