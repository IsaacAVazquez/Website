"use client";

import { X } from "lucide-react";
import { useRef, type CSSProperties } from "react";
import { useModal } from "@/hooks/useModal";

import {
  FANTASY_REACH_TOOLTIP,
  FANTASY_VALUE_TOOLTIP,
  formatAdp,
  formatOwnership,
  formatRankValue,
  getConsensusSpread,
  getValueVsAdp,
} from "@/lib/fantasyUtils";
import type { Player } from "@/types";

import { bestIndex } from "./compareMetrics";
import "./fantasy-overlays.css";
import { positionClass } from "./positionClass";
import { RankDistributionBar } from "./RankDistributionBar";

const CONSENSUS_RANK_LABEL = "Consensus rank";

interface CompareModalProps {
  players: Player[];
  publishedRank?: (player: Player) => string;
  /**
   * What `publishedRank` is a rank of. Defaults to "Consensus rank", which is
   * true for the redraft boards. A caller whose published rank is something
   * else (the best ball board's order is the market under the lens) passes its
   * own name, and the modal then renders that row under the caller's label and
   * adds a separate consensus row read from `rankEcr`, so the two rank spaces
   * are named and never share a Best.
   */
  publishedRankLabel?: string;
  /**
   * Players whose published consensus rank the calling board withholds
   * because it sits outside the row's own expert range. Their consensus rank,
   * position rank, and tier cells read "Withheld", the ADP row carries no
   * value or reach token for them, and those rows award no Best at all,
   * since a comparison with a blank in it cannot be settled.
   */
  consensusWithheld?: (player: Player) => boolean;
  /**
   * Whether the board these players came from ranks on the overall scale, so the
   * ADP value/reach signal is meaningful. False on position boards, where rankEcr
   * is position-scoped and not comparable to an overall ADP (see getValueVsAdp).
   */
  valueSignalAvailable?: boolean;
  adpAvailable?: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

type Direction = "lower" | "higher" | "none";

export function CompareModal({
  players,
  publishedRank,
  publishedRankLabel = CONSENSUS_RANK_LABEL,
  consensusWithheld,
  valueSignalAvailable = true,
  adpAvailable = true,
  onClose,
  onRemove,
}: CompareModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, true, onClose, { lockScroll: false });

  const scaleMin = Math.min(...players.map((p) => (Number.isFinite(p.minRank) ? (p.minRank as number) : Infinity)));
  const scaleMax = Math.max(...players.map((p) => (Number.isFinite(p.maxRank) ? (p.maxRank as number) : -Infinity)));
  const hasScale = Number.isFinite(scaleMin) && Number.isFinite(scaleMax);
  const samePosition = players.every((player) => player.position === players[0]?.position);
  const publishedRankValue = (player: Player): number | null => {
    const value = Number.parseFloat(
      publishedRank ? publishedRank(player) : formatRankValue(player.rankEcr ?? player.averageRank)
    );
    return Number.isFinite(value) ? value : null;
  };
  const isWithheld = (player: Player): boolean => consensusWithheld?.(player) ?? false;
  const anyWithheld = players.some(isWithheld);
  // A caller-named published rank is a different number from the consensus,
  // so it gets its own row and the consensus row reads rankEcr directly.
  const separateBoardRank = Boolean(publishedRank) && publishedRankLabel !== CONSENSUS_RANK_LABEL;
  const consensusRankText = (p: Player) =>
    publishedRank && !separateBoardRank
      ? publishedRank(p)
      : formatRankValue(p.rankEcr ?? p.averageRank);
  const withheldToken = <span className="ffb-label ffb-muted">Withheld</span>;

  const rows: Array<{
    key: string;
    /** Which metric bestIndex scores; the key alone is the React key. */
    metric: string;
    label: string;
    direction: Direction;
    render: (p: Player) => React.ReactNode;
    resolve?: (p: Player) => number | null;
  }> = [
    ...(separateBoardRank && publishedRank
      ? [
          {
            key: "boardRank",
            metric: "rank",
            label: publishedRankLabel,
            direction: "lower" as Direction,
            render: (p: Player) => publishedRank(p),
            resolve: publishedRankValue,
          },
        ]
      : []),
    {
      key: "rank",
      metric: "rank",
      label: CONSENSUS_RANK_LABEL,
      direction: anyWithheld ? "none" : "lower",
      render: (p) => (isWithheld(p) ? withheldToken : consensusRankText(p)),
      resolve: separateBoardRank ? undefined : publishedRankValue,
    },
    {
      key: "posRank",
      metric: "posRank",
      label: "Position rank",
      direction: anyWithheld ? "none" : samePosition ? "lower" : "none",
      render: (p) =>
        isWithheld(p)
          ? withheldToken
          : `${p.position} ${Number.isFinite(p.positionRank) ? p.positionRank : "—"}`,
    },
    {
      key: "tier",
      metric: "tier",
      label: "Tier",
      direction: anyWithheld ? "none" : "lower",
      render: (p) => (isWithheld(p) ? withheldToken : Number.isFinite(p.tier) ? p.tier : "—"),
    },
    {
      key: "adp",
      metric: "adp",
      label: "Market ADP",
      direction: adpAvailable ? "lower" : "none",
      render: (p) => {
        const signal =
          adpAvailable && valueSignalAvailable && !isWithheld(p) ? getValueVsAdp(p) : null;
        return (
          <>
            {adpAvailable ? formatAdp(p.adp) : "Unavailable"}
            {signal?.signal && (
              <span
                className={`ffb-badge ffb-ov-cell-tag ${signal.signal === "value" ? "ffb-good" : "ffb-warn"}`}
                title={signal.signal === "value" ? FANTASY_VALUE_TOOLTIP : FANTASY_REACH_TOOLTIP}
              >
                {signal.signal === "value" ? "Value" : "Reach"}
              </span>
            )}
          </>
        );
      },
    },
    {
      key: "own",
      metric: "own",
      label: "Rostered %",
      direction: "higher",
      render: (p) => formatOwnership(p.ownership),
    },
    { key: "bye", metric: "bye", label: "Bye week", direction: "none", render: (p) => p.byeWeek ?? "—" },
    {
      key: "spread",
      metric: "spread",
      label: "Expert consensus",
      direction: "none",
      render: (p) => getConsensusSpread(p)?.label ?? "—",
    },
  ];

  return (
    <div className="ffb-overlay ffb-overlay-modal ffb-enter-fade">
      <button type="button" aria-label="Close compare" onClick={onClose} className="ffb-scrim" tabIndex={-1} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Compare players"
        tabIndex={-1}
        className="ffb-modal ffb-enter-rise"
      >
        <div className="ffb-panel-head">
          <h2 className="ffb-h2">Compare players</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="ffb-iconbtn">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ffb-panel-body ffb-ov-compare-body">
          {/* A real table, so a screen reader can tell which column belongs
              to which player. The label column stays put while the player
              columns scroll under it on a phone, since a column of bare
              numbers is the one thing the table cannot become. */}
          <div
            className="ffb-table-wrap"
            role="region"
            tabIndex={0}
            aria-label="Player comparison table, scrolls horizontally"
          >
            <table
              className="ffb-table ffb-table-compare ffb-ov-compare"
              style={{ "--ffb-ov-players": players.length } as CSSProperties}
            >
              {/* Fixed layout with only the label column sized, so the
                  player columns split the rest equally whatever their names. */}
              <colgroup>
                <col className="ffb-ov-compare-label" />
                {players.map((player) => (
                  <col key={player.id} />
                ))}
              </colgroup>
              <caption className="ffb-vh">
                Side by side comparison of the pinned players. The stronger value on a row is marked Best.
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="ffb-vh">Metric</span>
                  </th>
                  {players.map((player) => (
                    // Named explicitly so the column announces as the player.
                    // Without this the header's name absorbs the remove
                    // button's label and every cell is prefixed with it.
                    <th key={player.id} scope="col" aria-label={`${player.name}, ${player.position}, ${player.team}`}>
                      <span className="ffb-ov-compare-head">
                        <span className={`ffb-chip ffb-chip-sm ${positionClass(player.position)}`}>{player.position}</span>
                        <span className="ffb-label ffb-muted">{player.team}</span>
                        <button
                          type="button"
                          onClick={() => onRemove(player.id)}
                          aria-label={`Remove ${player.name} from compare`}
                          className="ffb-iconbtn"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </span>
                      <span className="ffb-c-name ffb-ov-compare-name">{player.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const winner = bestIndex(players, row.metric, row.direction, row.resolve);
                  return (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      {players.map((player, index) => (
                        <td key={player.id}>
                          {row.render(player)}
                          {/* The word carries the win. Nothing sits between
                              the value and the tag, which the tests read. */}
                          {winner === index && <span className="ffb-best">Best</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Expert range plots on one shared scale */}
                {hasScale && (
                  <tr>
                    <th scope="row">Range</th>
                    {players.map((player) => (
                      <td key={player.id}>
                        <RankDistributionBar player={player} scaleMin={scaleMin} scaleMax={scaleMax} compact />
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="ffb-method">
            Best marks the stronger value on a row, meaning a lower rank or ADP and a higher rostered percentage.
            Differences too small to act on stay unmarked, so a tier apart counts and a tenth of a point of rostered
            does not. Range bars share one scale, so a wider fill means more expert disagreement.
            {anyWithheld
              ? " Withheld marks a player whose published consensus rank sits outside his own expert range, so the consensus, position rank, and tier rows carry no Best."
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
