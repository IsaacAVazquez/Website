import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Clock3, Radar, Rocket } from "lucide-react";
import type { MissionControlSummary } from "@/types/spacex";
import { MissionVehiclePhoto } from "./MissionVehiclePhoto";
import { formatMissionScheduleLabel } from "./formatters";

interface MissionControlHeroProps {
  summary: MissionControlSummary | null;
  isLoading: boolean;
  error: string | null;
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

function MissionCountdown({ dateUtc }: { dateUtc: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
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
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-success)_25%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-success)_10%,var(--surface-elevated))] px-4 py-2 font-mono text-sm font-semibold tracking-[0.16em] text-[var(--text-primary)]"
    >
      <Radar className="h-4 w-4 text-[var(--color-success)]" />
      {countdown}
    </div>
  );
}

export function MissionControlHero({
  summary,
  isLoading,
  error,
  onInspect,
  onRetry,
}: MissionControlHeroProps) {
  const heroLaunch = summary?.heroLaunch ?? null;

  if (isLoading && !heroLaunch) {
    return (
      <section
        data-testid="mission-hero"
        aria-label="Next launch hero"
        className="rounded-[32px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-6 shadow-[var(--shadow-lg)] sm:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_220px]">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
          </div>
          <div className="h-[220px] animate-pulse rounded-[28px] bg-[var(--surface-secondary)]" />
        </div>
      </section>
    );
  }

  if (!heroLaunch) {
    return (
      <section
        data-testid="mission-hero"
        aria-label="Next launch hero"
        className="rounded-[32px] border border-[color-mix(in_srgb,var(--color-warning)_24%,var(--border-primary))] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-warning)_8%,var(--surface-elevated))_0%,var(--surface-elevated)_100%)] p-6 shadow-[var(--shadow-lg)] sm:p-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
              Mission control unavailable
            </p>
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
              Live launch data is temporarily unavailable.
            </h2>
            <p className="max-w-[68ch] text-sm leading-7 text-[var(--text-secondary)]">
              {error ??
                "The local SpaceX API layer could not retrieve an upcoming mission summary. Retry to check whether the upstream feed has recovered."}
            </p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="tap-target inline-flex rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
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
      className="overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--border-primary))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_9%,var(--surface-elevated))_0%,var(--surface-elevated)_45%,color-mix(in_srgb,var(--color-success)_8%,var(--surface-elevated))_100%)] p-6 shadow-[var(--shadow-lg)] sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_240px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_25%,var(--border-primary))] bg-[color-mix(in_srgb,var(--surface-primary)_78%,transparent)] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
              {summary?.heroMode === "fallback" ? "Latest completed mission" : "Next mission"}
            </span>
            <span className="rounded-full border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              Flight #{heroLaunch.flightNumber}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
            {heroLaunch.name}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3">
            {heroLaunch.hasExactTime ? (
              <MissionCountdown dateUtc={heroLaunch.dateUtc} />
            ) : (
              <div className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
                <Clock3 className="h-4 w-4 text-[var(--color-primary)]" />
                {formatMissionScheduleLabel(heroLaunch)}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:max-w-[740px] xl:grid-cols-4">
            <div className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Rocket
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                {heroLaunch.rocketName ?? "Unspecified"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Launchpad
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                {heroLaunch.launchpadName ?? "Unspecified"}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Payloads
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                {heroLaunch.payloadCount}
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Location
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                {heroLaunch.launchpadLocation ?? "Pending"}
              </p>
            </div>
          </div>

          {summary?.heroMessage && (
            <div className="mt-5 rounded-[22px] border border-[color-mix(in_srgb,var(--color-warning)_20%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-warning)_8%,var(--surface-primary))] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
              {summary.heroMessage}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onInspect}
              className="tap-target inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-secondary)]"
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
                className="tap-target inline-flex items-center gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
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
            className="h-[240px] min-h-[240px]"
            label="Vehicle view"
            dataTestId="mission-hero-visual"
          />
          <div className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-elevated)]/90 p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--color-primary)]" />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Mission timing
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              {formatMissionScheduleLabel(heroLaunch)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Rocket className="h-4 w-4 text-[var(--color-primary)]" />
              {heroLaunch.rocketName ?? "Rocket TBD"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
