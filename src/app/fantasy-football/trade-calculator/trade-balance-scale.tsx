import {
  FANTASY_TRADE_BALANCED_THRESHOLD,
  FANTASY_TRADE_CLEAR_EDGE_THRESHOLD,
  type FantasyTradeEvaluation,
} from "@/lib/fantasyTrade";

// The track is scaled to the verdict thresholds rather than to a 100% gap, so
// the marker crosses a drawn line exactly when the words change. One point of
// relative gap is 3.2 viewBox units: the 5% balanced band ends 16 units either
// side of centre, the 15% clear-edge line sits on the inner ticks at 48 units,
// and anything past 30% clamps to the outer ticks at 96 units. A linear track
// to 100% put the whole 5% to 15% vocabulary inside 10px of a 286px rail.
const CENTRE = 120;
const UNITS_PER_GAP_POINT = 320;
const BALANCED_BAND = FANTASY_TRADE_BALANCED_THRESHOLD * UNITS_PER_GAP_POINT;
const CLEAR_EDGE_OFFSET = FANTASY_TRADE_CLEAR_EDGE_THRESHOLD * UNITS_PER_GAP_POINT;
const MAX_OFFSET = 96;

function markerPosition(result: FantasyTradeEvaluation | null): number {
  // Balanced returns no winner, so it pins to centre inside the drawn band.
  if (!result || result.relativeGap === null || result.winner === null) return CENTRE;
  const direction = result.winner === "side-b" ? 1 : -1;
  return CENTRE + direction * Math.min(MAX_OFFSET, result.relativeGap * UNITS_PER_GAP_POINT);
}

export function TradeBalanceScale({ result }: { result: FantasyTradeEvaluation | null }) {
  const markerX = markerPosition(result);
  const markerOffset = markerX - CENTRE;
  const noEstimate = !result || result.verdict === "insufficient";
  const label = noEstimate
    ? "A directional trade estimate is unavailable."
    : result.winner === "side-a"
      ? "The players you give carry the higher central estimate."
      : result.winner === "side-b"
        ? "The players you get carry the higher central estimate."
        : "The central estimates sit inside the 5% balanced band.";

  return (
    <figure className="ffb-scale" aria-label={label} role="img">
      <svg viewBox="0 0 240 58" aria-hidden="true">
        <rect
          className="ffb-tr-scale-band"
          x={CENTRE - BALANCED_BAND}
          y="20"
          width={BALANCED_BAND * 2}
          height="15"
        />
        <path className="ffb-tr-scale-track" d="M24 27.5H216" />
        {[24, CENTRE - CLEAR_EDGE_OFFSET, CENTRE, CENTRE + CLEAR_EDGE_OFFSET, 216].map((x) => (
          <path key={x} className="ffb-tr-scale-tick" d={`M${x} 21V34`} />
        ))}
        {[CENTRE - CLEAR_EDGE_OFFSET, CENTRE + CLEAR_EDGE_OFFSET].map((x) => (
          <text key={x} className="ffb-tr-scale-text" x={x} y="11" textAnchor="middle">
            15%
          </text>
        ))}
        {/* With no estimate the marker is an open socket at rest, so it does not read as an even trade. */}
        <g
          className={`ffb-tr-scale-marker${noEstimate ? " ffb-tr-scale-rest" : ""}`}
          style={{ transform: `translateX(${markerOffset}px)` }}
        >
          <path className="ffb-tr-scale-stem" d="M120 15V40" />
          <circle className="ffb-tr-scale-pin" cx="120" cy="27.5" r="6" />
        </g>
        <text className="ffb-tr-scale-text" x="24" y="54">
          GIVE
        </text>
        <text className="ffb-tr-scale-text" x="120" y="54" textAnchor="middle">
          EVEN
        </text>
        <text className="ffb-tr-scale-text" x="216" y="54" textAnchor="end">
          GET
        </text>
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
