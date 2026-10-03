import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Clock3, Radar, Rocket } from "lucide-react";
import type { MissionControlSummary } from "@/types/spacex";
import { MissionVehiclePhoto } from "./MissionVehiclePhoto";
import { formatMissionScheduleLabel } from "./formatters";
import { crossedScheduledT0 } from "./liftoff";
import liftoffStyles from "./MissionLiftoff.module.css";

interface MissionControlHeroProps {
  summary: MissionControlSummary | null;
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
        <p
          data-testid="mission-liftoff-note"
          role="status"
          className="inline-flex min-h-[44px] items-center border border-[var(--c97-rule)] bg-[var(--c97-field)] text-sm font-semibold text-[var(--c97-ink)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
        >
          <Rocket aria-hidden="true" className="h-4 w-4 text-[var(--c97-accent)]" />
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
      className="inline-flex min-h-[44px] items-center border border-[color-mix(in_srgb,var(--c97-positive)_38%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-positive)_12%,var(--c97-field))] font-mono text-sm font-semibold tracking-[0.16em] text-[var(--c97-ink)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
    >
      <Radar aria-hidden="true" className="h-4 w-4 text-[color-mix(in_srgb,var(--c97-positive)_60%,var(--c97-ink))]" />
      {countdown}
    </div>
  );
}

export function MissionControlHero({
  summary,
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
      <section
        data-testid="mission-hero"
        aria-label="Next launch hero"
        className="c97-panel"
      >
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_220px]" style={{ gap: "var(--c97-sp-3)" }}>
          <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
            <span className="c97-skeleton" style={{ height: 16, width: 128 }} />
            <span className="c97-skeleton" style={{ height: 48 }} />
            <span className="c97-skeleton" style={{ height: 20, width: "75%" }} />
            <span className="c97-skeleton" style={{ height: 20, width: "66%" }} />
          </div>
          <span className="c97-skeleton" style={{ height: 220 }} />
        </div>
      </section>
    );
  }

  if (!heroLaunch) {
    return (
      <section
        data-testid="mission-hero"
        aria-label="Next launch hero"
        className="c97-panel"
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between" style={{ gap: "var(--c97-sp-2)" }}>
          <div className="flex flex-col" style={{ gap: "var(--c97-sp-1)" }}>
            <p className="font-mono text-2xs font-semibold uppercase tracking-[0.22em] text-[var(--c97-label)]" style={{ marginBottom: 0 }}>
              Mission control unavailable
            </p>
            <h2 className="c97-serif c97-h2">
              Live launch data is temporarily unavailable.
            </h2>
            <p className="max-w-[68ch] text-sm leading-7 text-[var(--c97-ink-2)]" style={{ marginBottom: 0 }}>
              {error ??
                "The local SpaceX API layer could not retrieve an upcoming mission summary. Retry to check whether the upstream feed has recovered."}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="tap-target inline-flex border border-[var(--c97-rule)] bg-[var(--c97-surface)] text-sm font-semibold text-[var(--c97-ink)] transition hover:border-[var(--c97-accent)] hover:text-[var(--c97-accent)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)" }}
          >
            Retry live data
          </button>
        </div>
      </section>
    );
  }

  const primaryLinks = [
    { href: heroLaunch.links.webcast, label: "Watch webcast" },
    { href: heroLaunch.links.article, label: "Read article" },
    { href: heroLaunch.links.wikipedia, label: "Open Wikipedia" },
  ].filter((item): item is { href: string; label: string } => Boolean(item.href));

  return (
    <section
      data-testid="mission-hero"
      aria-label="Next launch hero"
      className="c97-panel overflow-hidden"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.24fr)_220px]" style={{ gap: "var(--c97-sp-2)" }}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>
            <span className="border border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-surface)_78%,transparent)] font-mono text-2xs font-semibold uppercase tracking-[0.22em] text-[var(--c97-accent)]" style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-0)" }}>
              {summary?.heroMode === "fallback" ? "Latest completed mission" : "Next mission"}
            </span>
            <span className="border border-[var(--c97-rule)] bg-[var(--c97-field)] text-xs font-medium text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-1)", paddingBlock: "var(--c97-sp-0)" }}>
              Flight #{heroLaunch.flightNumber}
            </span>
          </div>

          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            {heroLaunch.name}
          </h2>

          <div className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
            {heroLaunch.hasExactTime ? (
              <MissionCountdown
                dateUtc={heroLaunch.dateUtc}
                initialNow={renderTimestampMs}
              />
            ) : (
              <div className="inline-flex min-h-[44px] items-center border border-[var(--c97-rule)] bg-[var(--c97-field)] text-sm font-semibold text-[var(--c97-ink)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
                <Clock3 className="h-4 w-4 text-[var(--c97-accent)]" />
                {formatMissionScheduleLabel(heroLaunch)}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 xl:max-w-[700px] xl:grid-cols-4" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
            <div className="border border-[var(--c97-rule)] bg-[var(--c97-field)]/90" style={{ padding: "var(--c97-sp-2)" }}>
              <p className="font-mono text-3xs font-semibold uppercase tracking-[0.2em] text-[var(--c97-label)]">
                Rocket
              </p>
              <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                {heroLaunch.rocketName ?? "Unspecified"}
              </p>
            </div>
            <div className="border border-[var(--c97-rule)] bg-[var(--c97-field)]/90" style={{ padding: "var(--c97-sp-2)" }}>
              <p className="font-mono text-3xs font-semibold uppercase tracking-[0.2em] text-[var(--c97-label)]">
                Launchpad
              </p>
              <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                {heroLaunch.launchpadName ?? "Unspecified"}
              </p>
            </div>
            <div className="border border-[var(--c97-rule)] bg-[var(--c97-field)]/90" style={{ padding: "var(--c97-sp-2)" }}>
              <p className="font-mono text-3xs font-semibold uppercase tracking-[0.2em] text-[var(--c97-label)]">
                Payloads
              </p>
              <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                {heroLaunch.payloadCount}
              </p>
            </div>
            <div className="border border-[var(--c97-rule)] bg-[var(--c97-field)]/90" style={{ padding: "var(--c97-sp-2)" }}>
              <p className="font-mono text-3xs font-semibold uppercase tracking-[0.2em] text-[var(--c97-label)]">
                Location
              </p>
              <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>
                {heroLaunch.launchpadLocation ?? "Pending"}
              </p>
            </div>
          </div>

          {summary?.heroMessage && (
            <div className="border border-[color-mix(in_srgb,var(--c97-warning)_28%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-warning)_10%,var(--c97-surface))] text-sm leading-6 text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", marginTop: "var(--c97-sp-2)" }}>
              {summary.heroMessage}
            </div>
          )}

          <div className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-3)", gap: "var(--c97-sp-1)" }}>
            <button
              type="button"
              onClick={onInspect}
              className="c97-btn"
              style={{ gap: "var(--c97-sp-1)" }}
            >
              Inspect mission
              <Activity aria-hidden="true" className="h-4 w-4" />
            </button>
            {primaryLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="tap-target inline-flex items-center border border-[var(--c97-rule)] bg-[var(--c97-field)] text-sm font-semibold text-[var(--c97-ink)] transition hover:border-[var(--c97-accent)] hover:text-[var(--c97-accent)]" style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid" style={{ gap: "var(--c97-sp-2)" }}>
          <MissionVehiclePhoto
            name={heroLaunch.rocketName ?? heroLaunch.name}
            image={heroLaunch.vehicleImage}
            fallbackImage={heroLaunch.patchImage}
            className="h-[220px] min-h-[220px]"
            label="Vehicle view"
            dataTestId="mission-hero-visual"
            // The 220px column from 1024px up. Below that the frame measured
            // 277px on a 375px screen and 626px on a 768px one.
            sizes="(min-width: 1024px) 220px, 85vw"
          />
          <div className="border border-[var(--c97-rule)] bg-[var(--c97-field)]/90" style={{ padding: "var(--c97-sp-2)" }}>
            <div className="flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <CalendarDays className="h-4 w-4 text-[var(--c97-accent)]" />
              <p className="font-mono text-3xs font-semibold uppercase tracking-[0.2em] text-[var(--c97-label)]">
                Mission timing
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--c97-ink)]" style={{ marginTop: "var(--c97-sp-1)" }}>
              {formatMissionScheduleLabel(heroLaunch)}
            </p>
            <div className="flex items-center text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
              <Rocket aria-hidden="true" className="h-4 w-4 text-[var(--c97-accent)]" />
              {heroLaunch.rocketName ?? "Rocket TBD"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
