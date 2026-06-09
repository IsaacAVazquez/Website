import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Clock3, Radar, Rocket } from "lucide-react";
import type { MissionControlSummary } from "@/types/spacex";
import { MissionVehiclePhoto } from "./MissionVehiclePhoto";
import { formatMissionScheduleLabel } from "./formatters";

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

function MissionCountdown({
  dateUtc,
  initialNow,
}: {
  dateUtc: string;
  initialNow: number;
}) {
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Subscribe to a 1s clock tick so the countdown UI re-renders; setState lives inside an interval callback and a one-time initial sync after mount
    setNow(Date.now());

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dateUtc]);

  const countdown = formatCountdown(dateUtc, now);
  if (!countdown) {
    return null;
  }

  return (
    <div
      data-testid="mission-countdown"
      role="timer"
      aria-live="polite"
      aria-label={`Time to launch: ${countdown}`}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--home-moss)_38%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-moss)_14%,var(--home-paper-raised))] px-4 py-2 font-mono text-sm font-semibold tracking-[0.16em] text-[var(--home-ink)]"
    >
      <Radar aria-hidden="true" className="h-4 w-4 text-[color-mix(in_srgb,var(--home-moss)_60%,var(--home-ink))]" />
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
        className="rounded-[32px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/90 p-6 shadow-[var(--shadow-lg)] sm:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_220px]">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--home-paper-alt)]" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-[var(--home-paper-alt)]" />
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-[var(--home-paper-alt)]" />
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-[var(--home-paper-alt)]" />
          </div>
          <div className="h-[220px] animate-pulse rounded-[28px] bg-[var(--home-paper-alt)]" />
        </div>
      </section>
    );
  }

  if (!heroLaunch) {
    return (
      <section
        data-testid="mission-hero"
        aria-label="Next launch hero"
        className="rounded-[32px] border border-[color-mix(in_srgb,var(--home-acid)_30%,var(--home-rule))] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--home-acid)_10%,var(--home-paper-raised))_0%,var(--home-paper-raised)_100%)] p-6 shadow-[var(--shadow-lg)] sm:p-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink-soft)]">
              Mission control unavailable
            </p>
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-[var(--home-ink)] sm:text-4xl">
              Live launch data is temporarily unavailable.
            </h2>
            <p className="max-w-[68ch] text-sm leading-7 text-[var(--home-ink-muted)]">
              {error ??
                "The local SpaceX API layer could not retrieve an upcoming mission summary. Retry to check whether the upstream feed has recovered."}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="tap-target inline-flex rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-5 py-3 text-sm font-semibold text-[var(--home-ink)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
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
      className="overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--home-haze)_16%,var(--home-rule))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--home-haze)_9%,var(--home-paper-raised))_0%,var(--home-paper-raised)_45%,color-mix(in_srgb,var(--home-moss)_10%,var(--home-paper-raised))_100%)] p-5 shadow-[var(--shadow-lg)] sm:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.24fr)_220px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[color-mix(in_srgb,var(--home-haze)_25%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-paper)_78%,transparent)] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--home-haze)]">
              {summary?.heroMode === "fallback" ? "Latest completed mission" : "Next mission"}
            </span>
            <span className="rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-3 py-1 text-xs font-medium text-[var(--home-ink-muted)]">
              Flight #{heroLaunch.flightNumber}
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-[var(--home-ink)] sm:text-[2.8rem]">
            {heroLaunch.name}
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {heroLaunch.hasExactTime ? (
              <MissionCountdown
                dateUtc={heroLaunch.dateUtc}
                initialNow={renderTimestampMs}
              />
            ) : (
              <div className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-2 text-sm font-semibold text-[var(--home-ink)]">
                <Clock3 className="h-4 w-4 text-[var(--home-haze)]" />
                {formatMissionScheduleLabel(heroLaunch)}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:max-w-[700px] xl:grid-cols-4">
            <div className="rounded-[22px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/90 p-3.5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-soft)]">
                Rocket
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--home-ink)]">
                {heroLaunch.rocketName ?? "Unspecified"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/90 p-3.5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-soft)]">
                Launchpad
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--home-ink)]">
                {heroLaunch.launchpadName ?? "Unspecified"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/90 p-3.5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-soft)]">
                Payloads
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--home-ink)]">
                {heroLaunch.payloadCount}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/90 p-3.5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-soft)]">
                Location
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--home-ink)]">
                {heroLaunch.launchpadLocation ?? "Pending"}
              </p>
            </div>
          </div>

          {summary?.heroMessage && (
            <div className="mt-5 rounded-[22px] border border-[color-mix(in_srgb,var(--home-acid)_28%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-acid)_10%,var(--home-paper))] px-4 py-3 text-sm leading-6 text-[var(--home-ink-muted)]">
              {summary.heroMessage}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onInspect}
              className="tap-target inline-flex items-center gap-2 rounded-2xl bg-[var(--home-haze)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--home-haze)]"
            >
              Inspect mission
              <Activity className="h-4 w-4" />
            </button>
            {primaryLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="tap-target inline-flex items-center gap-2 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-5 py-3 text-sm font-semibold text-[var(--home-ink)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)]"
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <MissionVehiclePhoto
            name={heroLaunch.rocketName ?? heroLaunch.name}
            image={heroLaunch.vehicleImage}
            fallbackImage={heroLaunch.patchImage}
            className="h-[220px] min-h-[220px]"
            label="Vehicle view"
            dataTestId="mission-hero-visual"
          />
          <div className="rounded-[24px] border border-[var(--home-rule)] bg-[var(--home-paper-raised)]/90 p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--home-haze)]" />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-soft)]">
                Mission timing
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--home-ink)]">
              {formatMissionScheduleLabel(heroLaunch)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--home-ink-muted)]">
              <Rocket className="h-4 w-4 text-[var(--home-haze)]" />
              {heroLaunch.rocketName ?? "Rocket TBD"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
