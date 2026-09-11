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
  const label =
    !result || result.verdict === "insufficient"
      ? "A directional trade estimate is unavailable."
      : result.winner === "side-a"
      ? "The players you give carry the higher central estimate."
      : result.winner === "side-b"
        ? "The players you get carry the higher central estimate."
        : "The central estimates sit inside the 5% balanced band.";

  return (
    <figure className="m-0" aria-label={label} role="img">
      <svg viewBox="0 0 240 58" className="h-auto w-full text-[var(--home-ink)]" aria-hidden="true">
        <rect
          x={CENTRE - BALANCED_BAND}
          y="20"
          width={BALANCED_BAND * 2}
          height="15"
          fill="currentColor"
          opacity="0.1"
        />
        <path d="M24 27.5H216" stroke="currentColor" strokeWidth="1" />
        {[24, CENTRE - CLEAR_EDGE_OFFSET, CENTRE, CENTRE + CLEAR_EDGE_OFFSET, 216].map((x) => (
          <path key={x} d={`M${x} 22V33`} stroke="currentColor" strokeWidth="1" opacity="0.42" />
        ))}
        {[CENTRE - CLEAR_EDGE_OFFSET, CENTRE + CLEAR_EDGE_OFFSET].map((x) => (
          <text
            key={x}
            x={x}
            y="11"
            textAnchor="middle"
            fontSize="8"
            fill="currentColor"
            opacity="0.62"
          >
            15%
          </text>
        ))}
        <g
          className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
          style={{ transform: `translateX(${markerOffset}px)` }}
        >
          <path d="M120 15V40" stroke="var(--home-signal)" strokeWidth="2" />
          <circle
            cx="120"
            cy="27.5"
            r="5.5"
            fill="var(--home-paper)"
            stroke="var(--home-signal)"
            strokeWidth="3"
          />
        </g>
        <text x="24" y="54" fontSize="9" fill="currentColor" opacity="0.62">
          GIVE
        </text>
        <text x="120" y="54" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.62">
          EVEN
        </text>
        <text x="216" y="54" textAnchor="end" fontSize="9" fill="currentColor" opacity="0.62">
          GET
        </text>
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
