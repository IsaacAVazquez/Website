import type { FantasyTradeEvaluation } from "@/lib/fantasyTrade";

function markerPosition(result: FantasyTradeEvaluation | null): number {
  if (!result || result.relativeGap === null || result.winner === null) return 120;
  const direction = result.winner === "side-b" ? 1 : -1;
  return 120 + direction * Math.min(1, result.relativeGap) * 84;
}

export function TradeBalanceScale({ result }: { result: FantasyTradeEvaluation | null }) {
  const markerX = markerPosition(result);
  const markerOffset = markerX - 120;
  const label =
    !result || result.verdict === "insufficient"
      ? "A directional trade estimate is unavailable."
      : result.winner === "side-a"
      ? "The players you give carry the higher central estimate."
      : result.winner === "side-b"
        ? "The players you get carry the higher central estimate."
        : "The central estimates are balanced.";

  return (
    <figure className="m-0" aria-label={label} role="img">
      <svg viewBox="0 0 240 58" className="h-auto w-full text-[var(--home-ink)]" aria-hidden="true">
        <path d="M24 27.5H216" stroke="currentColor" strokeWidth="1" />
        {[24, 72, 120, 168, 216].map((x) => (
          <path key={x} d={`M${x} 22V33`} stroke="currentColor" strokeWidth="1" opacity="0.42" />
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
