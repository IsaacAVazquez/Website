import { regionBracket, type BracketGame, type BracketRoundKey } from "./bracketLayout";
import type { RegionData } from "./march-madness-data";

interface RegionBracketProps {
  data: RegionData;
}

const COL_W = 176;
const COL_GAP = 36;
const CHAMPION_GAP = 44;
const CHAMPION_W = 128;
const ROW_H = 64;
const BOX_H = 50;
const HEADER_H = 28;
const BOTTOM_PAD = 10;

const ROUND_ORDER: BracketRoundKey[] = ["r1", "r2", "s16", "e8"];
const ROUND_LABEL: Record<BracketRoundKey, string> = {
  r1: "Round 1",
  r2: "Round 2",
  s16: "Sweet 16",
  e8: "Elite Eight",
};

function colX(roundIndex: number): number {
  return roundIndex * (COL_W + COL_GAP);
}

/** One team row inside a game box, seed beside the name, the loser dimmed rather than removed. */
function TeamLabel({
  x,
  y,
  name,
  seed,
  isWinner,
  isUpset,
}: {
  x: number;
  y: number;
  name: string;
  seed: number | null;
  isWinner: boolean;
  isUpset: boolean;
}) {
  return (
    <g>
      <text x={x} y={y} className="mm-bracket-seed">
        {seed ?? ""}
      </text>
      <text
        x={x + 22}
        y={y}
        className={isWinner ? "mm-bracket-team mm-bracket-team-winner" : "mm-bracket-team"}
      >
        {name || "TBD"}
      </text>
      {isWinner && isUpset ? (
        <g transform={`translate(${x + COL_W - 70}, ${y - 8})`}>
          <path d="M0 8 L6 0 L12 8 Z" className="mm-bracket-upset-mark" />
          <text x={16} y={9} className="mm-bracket-upset-label">
            Upset
          </text>
        </g>
      ) : null}
    </g>
  );
}

function GameBox({ game, roundIndex, rows }: { game: BracketGame; roundIndex: number; rows: number }) {
  const x = colX(roundIndex);
  const yCenter = HEADER_H + game.y * rows * ROW_H;
  const top = yCenter - BOX_H / 2;
  const rowH = BOX_H / 2;

  return (
    <g>
      <rect x={x} y={top} width={COL_W} height={BOX_H} className="mm-bracket-box" />
      <line x1={x} x2={x + COL_W} y1={top + rowH} y2={top + rowH} className="mm-bracket-link" />
      <TeamLabel
        x={x + 8}
        y={top + rowH / 2 + 4}
        name={game.slots[0].name}
        seed={game.slots[0].seed}
        isWinner={game.winnerIndex === 0}
        isUpset={game.isUpset}
      />
      <TeamLabel
        x={x + 8}
        y={top + rowH + rowH / 2 + 4}
        name={game.slots[1].name}
        seed={game.slots[1].seed}
        isWinner={game.winnerIndex === 1}
        isUpset={game.isUpset}
      />
    </g>
  );
}

/** The classic bracket elbow: two stubs from the feeder boxes into a shared vertical line, then one stub out to this round's box. */
function Connector({ game, roundIndex, rows }: { game: BracketGame; roundIndex: number; rows: number }) {
  if (!game.feederY) return null;
  const prevRight = colX(roundIndex - 1) + COL_W;
  const thisLeft = colX(roundIndex);
  const midX = prevRight + COL_GAP / 2;
  const y0 = HEADER_H + game.feederY[0] * rows * ROW_H;
  const y1 = HEADER_H + game.feederY[1] * rows * ROW_H;
  const yMid = HEADER_H + game.y * rows * ROW_H;

  return (
    <path
      d={`M${prevRight} ${y0} H${midX} M${prevRight} ${y1} H${midX} M${midX} ${y0} V${y1} M${midX} ${yMid} H${thisLeft}`}
      className="mm-bracket-link"
    />
  );
}

/**
 * The page's signature. One region's single-elimination bracket, first round
 * to the Elite Eight, drawn as a tree ending at the region's champion. Only
 * `regionBracket`'s geometry decides where anything sits; this component
 * draws it. There is no interaction here (the full matchup list below is the
 * keyboard and screen-reader path), so this is a static diagram.
 */
export function RegionBracket({ data }: RegionBracketProps) {
  const layout = regionBracket(data);
  const rows = Math.max(layout.games.filter((game) => game.round === "r1").length, 1);
  const gamesByRound = new Map<BracketRoundKey, BracketGame[]>();
  for (const round of ROUND_ORDER) {
    gamesByRound.set(round, layout.games.filter((game) => game.round === round));
  }

  const e8Game = gamesByRound.get("e8")?.[0] ?? null;
  const championX = colX(3) + COL_W + CHAMPION_GAP;
  const championY = e8Game ? HEADER_H + e8Game.y * rows * ROW_H : HEADER_H + (rows * ROW_H) / 2;
  const championSeed = e8Game && e8Game.winnerIndex !== null ? e8Game.slots[e8Game.winnerIndex].seed : null;
  const upsetCount = layout.games.filter((game) => game.isUpset).length;

  const width = colX(3) + COL_W + CHAMPION_GAP + CHAMPION_W;
  const height = HEADER_H + rows * ROW_H + BOTTOM_PAD;

  if (layout.games.length === 0) {
    return <p className="c97-meta">No bracket data for this region yet.</p>;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby="mm-bracket-title mm-bracket-desc"
      className="mm-bracket-svg"
      style={{ width: `${width}px`, minWidth: `${width}px`, height: "auto", display: "block" }}
    >
      <title id="mm-bracket-title">{`${layout.region} region bracket`}</title>
      <desc id="mm-bracket-desc">
        {`The ${layout.region} region from round one through the Elite Eight, with ${upsetCount} pick${
          upsetCount === 1 ? "" : "s"
        } flagged as an upset. ${layout.champion ?? "The region winner"} advances to the Final Four.`}
      </desc>

      {ROUND_ORDER.map((round, roundIndex) => (
        <text key={round} x={colX(roundIndex) + COL_W / 2} y={18} textAnchor="middle" className="mm-bracket-round-label">
          {ROUND_LABEL[round]}
        </text>
      ))}
      <text x={championX + CHAMPION_W / 2} y={18} textAnchor="middle" className="mm-bracket-round-label">
        Champion
      </text>

      {ROUND_ORDER.map((round, roundIndex) =>
        (gamesByRound.get(round) ?? []).map((game) => (
          <Connector key={`${round}-${game.index}-link`} game={game} roundIndex={roundIndex} rows={rows} />
        ))
      )}
      {e8Game ? (
        <line
          x1={colX(3) + COL_W}
          x2={championX}
          y1={championY}
          y2={championY}
          className="mm-bracket-link"
        />
      ) : null}

      {ROUND_ORDER.map((round, roundIndex) =>
        (gamesByRound.get(round) ?? []).map((game) => (
          <GameBox key={`${round}-${game.index}`} game={game} roundIndex={roundIndex} rows={rows} />
        ))
      )}

      {e8Game ? (
        <g>
          <rect
            x={championX}
            y={championY - BOX_H / 2}
            width={CHAMPION_W}
            height={BOX_H}
            className="mm-bracket-champion-box"
          />
          <text x={championX + 10} y={championY - 4} className="mm-bracket-seed">
            {championSeed ?? ""}
          </text>
          <text x={championX + 10} y={championY + 16} className="mm-bracket-champion-name">
            {layout.champion ?? ""}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
