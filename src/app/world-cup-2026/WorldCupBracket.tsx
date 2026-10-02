import type { WorldCupFixture } from "@/types/worldCup";
import type { BracketTree } from "./bracketTree";

interface WorldCupBracketProps {
  tree: BracketTree;
  onOpenTeam?: (teamId: string) => void;
}

const ROW = 34;
const BOX_W = 128;
const BOX_H = 30;
const GAP = 42;
const COL_W = BOX_W + GAP;
const HEADER_H = 26;
const PAD = 12;
const CHAMPION_W = 130;
const CHAMPION_H = 38;

function scoreLabel(fixture: WorldCupFixture, side: "home" | "away"): string {
  const value = side === "home" ? fixture.score.home : fixture.score.away;
  if (fixture.status !== "FINISHED" || value === null) return "–";
  const shootout = side === "home" ? fixture.score.shootoutHome : fixture.score.shootoutAway;
  return shootout != null ? `${value} (${shootout})` : `${value}`;
}

/**
 * The page's signature: the 32-team knockout drawn as a bracket tree, from
 * the Round of 32 to the final, ending at the champion. It sits on its own
 * paper plate because the fixture tickets and connecting lines are fields
 * the ink hero sheet can't carry. The plate is fixed-width rather than
 * scaled, so it scrolls sideways inside itself at phone width instead of
 * shrinking its type. Team names are pointer-only marks; the round-by-round
 * fixture lists further down the page are the keyboard path to the same
 * results.
 */
export function WorldCupBracket({ tree, onOpenTeam }: WorldCupBracketProps) {
  if (tree.columns.length === 0 || tree.columns.every((column) => column.fixtures.length === 0)) {
    return <p className="c97-meta">The bracket fills in once the knockout stage is drawn.</p>;
  }

  const leafCount = tree.columns[0].fixtures.length || 1;
  const plotHeight = leafCount * ROW;
  const plotTop = HEADER_H + PAD;
  const toY = (fraction: number) => plotTop + fraction * plotHeight;
  const toX = (columnIndex: number) => columnIndex * COL_W;

  const lastIndex = tree.columns.length - 1;
  const finalFixture = tree.columns[lastIndex].fixtures[0] ?? null;
  const championY = finalFixture ? toY(finalFixture.y) : toY(0.5);
  const championX = toX(lastIndex) + BOX_W + GAP;
  const championName = finalFixture
    ? finalFixture.fixture.homeTeam.id === tree.championId
      ? finalFixture.fixture.homeTeam.shortName
      : finalFixture.fixture.awayTeam.id === tree.championId
        ? finalFixture.fixture.awayTeam.shortName
        : null
    : null;

  const W = championX + CHAMPION_W + PAD;
  const H = plotTop + plotHeight + PAD;

  const fixtureById = new Map(
    tree.columns.flatMap((column) => column.fixtures.map((node) => [node.fixture.id, node] as const))
  );

  return (
    <div data-c97-surface="paper" className="c97-offset c97-bracket-plate">
      <div className="c97-bracket-scroll" role="region" aria-label="Knockout bracket (scrolls sideways)" tabIndex={0}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="img"
          aria-labelledby="wc-bracket-title"
          className="c97-bracket-svg"
        >
          <title id="wc-bracket-title">
            {championName
              ? `The knockout bracket from the Round of 32 to the final. ${championName} won it.`
              : "The knockout bracket from the Round of 32 to the final."}
          </title>

          {tree.columns.map((column, columnIndex) => {
            const x = toX(columnIndex);
            const nextColumn = tree.columns[columnIndex + 1] ?? null;
            return (
              <g key={column.id}>
                <text x={x} y={HEADER_H - 10} className="c97-bracket-round-label">
                  {column.name}
                </text>
                {column.fixtures.map((node) => {
                  const y = toY(node.y);
                  const target = node.feedsTo ? fixtureById.get(node.feedsTo) : null;
                  const isHomeWinner = node.winnerId === node.fixture.homeTeam.id;
                  const isAwayWinner = node.winnerId === node.fixture.awayTeam.id;
                  return (
                    <g key={node.fixture.id}>
                      {target && nextColumn ? (
                        <path
                          d={`M${x + BOX_W} ${y} H${x + BOX_W + GAP / 2} V${toY(target.y)} H${toX(
                            columnIndex + 1
                          )}`}
                          className="c97-bracket-line"
                          fill="none"
                        />
                      ) : null}
                      <rect
                        x={x}
                        y={y - BOX_H / 2}
                        width={BOX_W}
                        height={BOX_H}
                        className="c97-bracket-box"
                      />
                      <line
                        x1={x}
                        x2={x + BOX_W}
                        y1={y}
                        y2={y}
                        className="c97-bracket-box-rule"
                      />
                      {(
                        [
                          ["home", node.fixture.homeTeam, isHomeWinner, y - BOX_H / 4 + 2] as const,
                          ["away", node.fixture.awayTeam, isAwayWinner, y + BOX_H / 4 + 3] as const,
                        ] as const
                      ).map(([side, team, isWinner, textY]) => (
                        <g
                          key={side}
                          className={onOpenTeam ? "c97-bracket-team" : undefined}
                          onClick={onOpenTeam ? () => onOpenTeam(team.id) : undefined}
                          style={onOpenTeam ? { cursor: "pointer" } : undefined}
                        >
                          <text
                            x={x + 6}
                            y={textY}
                            className={
                              node.winnerId
                                ? isWinner
                                  ? "c97-bracket-name c97-bracket-name-winner"
                                  : "c97-bracket-name c97-bracket-name-loser"
                                : "c97-bracket-name"
                            }
                          >
                            {team.code || team.shortName}
                          </text>
                          <text
                            x={x + BOX_W - 6}
                            y={textY}
                            textAnchor="end"
                            className={
                              node.winnerId && !isWinner
                                ? "c97-bracket-score c97-bracket-name-loser"
                                : "c97-bracket-score"
                            }
                          >
                            {scoreLabel(node.fixture, side)}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {finalFixture ? (
            <path
              d={`M${toX(lastIndex) + BOX_W} ${championY} H${championX}`}
              className="c97-bracket-line"
              fill="none"
            />
          ) : null}
          <rect
            x={championX}
            y={championY - CHAMPION_H / 2}
            width={CHAMPION_W}
            height={CHAMPION_H}
            className="c97-bracket-champion-box"
          />
          <text
            x={championX + CHAMPION_W / 2}
            y={championY + 4}
            textAnchor="middle"
            className="c97-bracket-champion"
          >
            {championName ?? "TBD"}
          </text>
        </svg>
      </div>
    </div>
  );
}
