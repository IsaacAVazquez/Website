"use client";

import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";
import { PanelClock } from "@/components/home/PanelClock";

export interface HomeLiveFeedQuake {
  magnitude: number;
  depthKm: number;
  place: string;
  agoLabel: string;
  recentMagnitudes: number[];
}

export interface HomeLiveFeedLaunch {
  mission: string;
  vehicle: string;
  /** ISO 8601 launch time (UTC). */
  dateUtc: string;
  /** Whether the schedule carries an exact T-0 (vs. a NET/TBD window). */
  hasExactTime: boolean;
}

export interface HomeLiveFeedMarket {
  /** Source ticker, e.g. "SPY". */
  symbol: string;
  /** Display label, e.g. "S&P 500 ETF". */
  name: string;
  price: string;
  changePct: number;
  delta: string;
}

export interface HomeLiveFeedData {
  quake: HomeLiveFeedQuake | null;
  launch: HomeLiveFeedLaunch | null;
  market: HomeLiveFeedMarket | null;
  /** One-line provenance note under the readouts. */
  sourceNote: string;
}

// Seismograph-style bar spark of recent magnitudes; the latest bar is signal.
function MagSpark({ data }: { data: number[] }) {
  const W = 300;
  const H = 26;
  const gap = 3;
  const n = data.length;
  if (n === 0) return null;
  const barWidth = (W - gap * (n - 1)) / n;
  const max = Math.max(...data, 0.1);
  return (
    <svg
      className={styles.feedSpark}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {data.map((value, index) => {
        const barHeight = Math.max(2, (value / max) * H);
        return (
          <rect
            key={index}
            x={(index * (barWidth + gap)).toFixed(1)}
            y={(H - barHeight).toFixed(1)}
            width={barWidth.toFixed(1)}
            height={barHeight.toFixed(1)}
            className={index === n - 1 ? styles.feedBarLast : styles.feedBar}
          />
        );
      })}
    </svg>
  );
}

function formatCountdown(msRemaining: number): string {
  const seconds = Math.max(0, Math.round(msRemaining / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const days = Math.floor(seconds / 86400);
  const hh = pad(Math.floor((seconds % 86400) / 3600));
  const mm = pad(Math.floor((seconds % 3600) / 60));
  const ss = pad(seconds % 60);
  return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

// Launch T-minus. The server and first client paint render the scheduled date
// (deterministic, so no hydration mismatch); once mounted, the effect swaps in
// a live countdown that ticks each second. A launch with no exact time (a
// NET/TBD window) keeps the date rather than ticking a meaningless clock.
function LaunchClock({ launch }: { launch: HomeLiveFeedLaunch }) {
  const targetMs = Date.parse(launch.dateUtc);
  const validTarget = launch.hasExactTime && !Number.isNaN(targetMs);
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!validTarget) return;
    const tick = () => {
      const remaining = targetMs - Date.now();
      setCountdown("T− " + formatCountdown(Math.max(0, remaining)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [validTarget, targetMs]);

  if (validTarget && countdown !== null) {
    return (
      <span className={styles.feedClock} suppressHydrationWarning>
        {countdown}
      </span>
    );
  }

  const label = Number.isNaN(targetMs)
    ? "Scheduled"
    : `NET ${dateLabelFormatter.format(targetMs)}`;
  return <span className={styles.feedClock}>{label}</span>;
}

/**
 * The homepage hero's live-feed instrument. Real readouts from three production
 * tools: the latest USGS quake with a magnitude bar spark, the next SpaceX
 * launch with a ticking T-minus, and the S&P 500 ETF (SPY) day move. The clock
 * and countdown tick client-side; everything else is server-computed data.
 */
export function HomeLiveFeed({ data }: { data: HomeLiveFeedData }) {
  const { quake, launch, market } = data;
  const marketUp = market ? market.changePct >= 0 : true;

  return (
    <div className={styles.feedPanel}>
      <div className={styles.feedCap}>
        <span className={styles.feedCapLive}>
          <span className={styles.feedDot}>
            <span />
          </span>
          Live feed
        </span>
        <PanelClock />
      </div>

      {quake ? (
        <div className={styles.feedRd}>
          <div className={styles.feedRdHead}>
            <span className={styles.feedRdSrc}>Earthquake Pulse</span>
            <span className={styles.feedRdMeta}>{quake.agoLabel}</span>
          </div>
          <div className={styles.feedRdFigure}>
            <span className={styles.feedRdBig}>M {quake.magnitude.toFixed(1)}</span>
            <span className={styles.feedRdUnit}>USGS · {quake.depthKm} km deep</span>
          </div>
          <div className={styles.feedRdSub}>{quake.place}</div>
          <MagSpark data={quake.recentMagnitudes} />
        </div>
      ) : null}

      {launch ? (
        <div className={styles.feedRd}>
          <div className={styles.feedRdHead}>
            <span className={styles.feedRdSrc}>Next launch</span>
            <span className={styles.feedRdMeta}>{launch.vehicle}</span>
          </div>
          <div className={styles.feedRdLine}>
            <LaunchClock launch={launch} />
            <span className={styles.feedRdName}>{launch.mission}</span>
          </div>
        </div>
      ) : null}

      {market ? (
        <div className={styles.feedRd}>
          <div className={styles.feedRdHead}>
            <span className={styles.feedRdSrc}>Markets · {market.symbol}</span>
            <span
              className={`${styles.feedRdMeta} ${marketUp ? styles.feedUp : styles.feedDown}`}
            >
              {marketUp ? "▲" : "▼"} {Math.abs(market.changePct).toFixed(2)}%
            </span>
          </div>
          <div className={styles.feedRdLine}>
            <span className={styles.feedRdPrice}>{market.price}</span>
            <span className={styles.feedRdName}>{market.delta} today</span>
          </div>
        </div>
      ) : null}

      <div className={styles.feedNow}>
        <span className={styles.feedDot}>
          <span />
        </span>
        <span className={styles.feedNowLead}>Feed ·</span>
        <span className={styles.feedNowText}>{data.sourceNote}</span>
      </div>
    </div>
  );
}
