import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Rocket } from "lucide-react";
import type { MissionControlSummary } from "@/types/spacex";
import { MissionVehiclePhoto } from "./MissionVehiclePhoto";
import { formatMissionScheduleLabel } from "./formatters";
import { crossedScheduledT0 } from "./liftoff";
import liftoffStyles from "./MissionLiftoff.module.css";

/** One fleet figure, printed as text in the masthead's fleet line. */
export interface MissionFleetFigure {
  label: string;
  value: string;
}

interface MissionControlHeroProps {
  summary: MissionControlSummary | null;
  /** The fleet figures from the summary's insights, printed as one line of text. */
  fleet?: MissionFleetFigure[];
  isLoading: boolean;
  error: string | null;
  initialRenderTimestampMs?: number;
  onInspect: () => void;
  onRetry: () => void;
}

function formatCountdown(dateUtc: string, now = Date.now()): string | null {
  const diff = Date.parse(dateUtc) - now;
  if (diff <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `T-${days}d ${hours.toString().padStart(2, "0")}h ${minutes
    .toString()
    .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
}

/**
 * The T-0 rocket. Decorative, fixed, and gone under reduced motion. The rise
 * ends above the viewport, and the rocket unmounts right then so its flame
 * stops flickering. The flame's own animation events bubble up here too, so
 * only the rise's end counts.
 */
function MissionLiftoff() {
  const [flying, setFlying] = useState(true);
  if (!flying) return null;
  return (
    <div
      aria-hidden="true"
      className={liftoffStyles.rocket}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setFlying(false);
      }}
    >
      <svg className={liftoffStyles.body} viewBox="0 0 28 64" focusable="false">
        <path className={liftoffStyles.flame} d="M9 52 L14 64 L19 52 Z" />
        <path className={liftoffStyles.trim} d="M8 34 L2 48 L8 46 Z M20 34 L26 48 L20 46 Z" />
        <path className={liftoffStyles.hull} d="M14 0 C20 8 21 18 20 30 L20 50 L8 50 L8 30 C7 18 8 8 14 0 Z" />
        <path className={liftoffStyles.trim} d="M14 0 C18 5 19.5 9 19.8 12 L8.2 12 C8.5 9 10 5 14 0 Z" />
        <circle className={liftoffStyles.port} cx="14" cy="22" r="3" />
      </svg>
      <span className={liftoffStyles.exhaust} />
    </div>
  );
}

function MissionCountdown({
  dateUtc,
  initialNow,
}: {
  dateUtc: string;
  initialNow: number;
}) {
  const [now, setNow] = useState(initialNow);
  // The dateUtc whose T-0 this page view watched cross, so it fires once.
  const [liftoffFor, setLiftoffFor] = useState<string | null>(null);

  useEffect(() => {
    const netMs = Date.parse(dateUtc);
    // Seeded from the client clock, never the server render time, so a page
    // opened after T-0 does not count as having watched the crossing.
    let previous = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Subscribe to a 1s clock tick so the countdown UI re-renders; setState lives inside an interval callback and a one-time initial sync after mount
    setNow(previous);

    const intervalId = window.setInterval(() => {
      const current = Date.now();
      if (
        document.visibilityState === "visible" &&
        crossedScheduledT0(previous, current, netMs)
      ) {
        setLiftoffFor(dateUtc);
      }
      previous = current;
      setNow(current);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dateUtc]);

  const countdown = formatCountdown(dateUtc, now);
  if (!countdown) {
    if (liftoffFor !== dateUtc) {
      return null;
    }

    return (
      <>
        <MissionLiftoff />
        <p data-testid="mission-liftoff-note" role="status" className="sx-liftoff-note">
          <Rocket aria-hidden="true" className="h-4 w-4" />
          T-0 by the schedule. The snapshot can&apos;t tell me whether it flew.
        </p>
      </>
    );
  }

  return (
    <div
      data-testid="mission-countdown"
      role="timer"
      aria-live="polite"
      aria-label={`Time to launch: ${countdown}`}
      className="sx-countdown"
    >
      {countdown}
    </div>
  );
}

export function MissionControlHero({
  summary,
  fleet = [],
  isLoading,
  error,
  initialRenderTimestampMs,
  onInspect,
  onRetry,
}: MissionControlHeroProps) {
  const [renderTimestampMs] = useState(() => initialRenderTimestampMs ?? Date.now());
  const heroLaunch = summary?.heroLaunch ?? null;

  if (isLoading && !heroLaunch) {
    return (
      <section data-testid="mission-hero" aria-label="Next launch hero" className="sx-mast">
        <div className="sx-mast-main">
          <span className="c97-skeleton" style={{ height: 16, width: 128 }} />
          <span className="c97-skeleton" style={{ height: 48 }} />
          <span className="c97-skeleton" style={{ height: 20, width: "66%" }} />
        </div>
      </section>
    );
  }

  if (!heroLaunch) {
    return (
      <section data-testid="mission-hero" aria-label="Next launch hero" className="sx-mast">
        <div className="sx-mast-main">
          <p className="sx-mast-kicker">Mission control unavailable</p>
          <h2 className="sx-mast-name">Live launch data is temporarily unavailable.</h2>
          <p className="sx-mast-facts">
            {error ??
              "The local SpaceX API layer could not retrieve an upcoming mission summary. Retry to check whether the upstream feed has recovered."}
          </p>
          <div className="sx-mast-actions">
            <button type="button" onClick={onRetry} className="sx-button-ghost">
              Retry live data
            </button>
          </div>
        </div>
      </section>
    );
  }

  const primaryLinks = [
    { href: heroLaunch.links.webcast, label: "Watch webcast" },
    { href: heroLaunch.links.article, label: "Read article" },
    { href: heroLaunch.links.wikipedia, label: "Open Wikipedia" },
  ].filter((item): item is { href: string; label: string } => Boolean(item.href));
  const facts = [
    heroLaunch.rocketName ?? "Rocket unspecified",
    [heroLaunch.launchpadName, heroLaunch.launchpadLocation].filter(Boolean).join(", ") || "Pad pending",
    `${heroLaunch.payloadCount} payload${heroLaunch.payloadCount === 1 ? "" : "s"}`,
  ];

  return (
    <section data-testid="mission-hero" aria-label="Next launch hero" className="sx-mast">
      <div className="sx-mast-main">
        <p className="sx-mast-kicker">
          {summary?.heroMode === "fallback" ? "Latest completed mission" : "Next mission"} · Flight #
          {heroLaunch.flightNumber}
        </p>
        <h2 className="sx-mast-name">{heroLaunch.name}</h2>

        <div className="sx-mast-clock">
          {heroLaunch.hasExactTime ? (
            <MissionCountdown dateUtc={heroLaunch.dateUtc} initialNow={renderTimestampMs} />
          ) : null}
          <p className="sx-mast-schedule">{formatMissionScheduleLabel(heroLaunch)}</p>
        </div>

        <p className="sx-mast-facts">{facts.join(" · ")}</p>
        {fleet.length > 0 ? (
          <p className="sx-mast-fleet">
            {fleet.map((figure) => (
              <span key={figure.label}>
                {figure.label} <strong>{figure.value}</strong>
              </span>
            ))}
          </p>
        ) : null}

        {summary?.heroMessage ? <p className="sx-mast-message">{summary.heroMessage}</p> : null}

        <div className="sx-mast-actions">
          <button type="button" onClick={onInspect} className="sx-button">
            Inspect mission
            <Activity aria-hidden="true" className="h-4 w-4" />
          </button>
          {primaryLinks.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="sx-button-ghost">
              {link.label}
              <ArrowUpRight className="c97-arrow-out h-4 w-4" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      <MissionVehiclePhoto
        name={heroLaunch.rocketName ?? heroLaunch.name}
        image={heroLaunch.vehicleImage}
        fallbackImage={heroLaunch.patchImage}
        className="sx-mast-photo"
        label="Vehicle view"
        dataTestId="mission-hero-visual"
        // The 240px column from 768px up, and the full column under it.
        sizes="(min-width: 768px) 240px, 90vw"
      />
    </section>
  );
}
