"use client";

import { useMemo, useState } from "react";
import { Radar } from "lucide-react";
import type { MissionControlStatus, MissionLaunchCard } from "@/types/spacex";
import { MissionCard } from "./MissionCard";
import { deriveVehicleFamily, type MissionVehicleFamily } from "@/lib/spacexVehicleFamily";

const STATUS_OPTIONS: Array<{ key: MissionControlStatus; label: string }> = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

const VEHICLE_FILTERS: Array<"All" | MissionVehicleFamily> = [
  "All",
  "Falcon 9",
  "Falcon Heavy",
  "Starship",
  "Other",
];

interface MissionLaunchBoardProps {
  launches: MissionLaunchCard[];
  status: MissionControlStatus;
  selectedLaunchId: string | null;
  isLoading: boolean;
  error: string | null;
  onStatusChange: (status: MissionControlStatus) => void;
  onSelectLaunch: (id: string) => void;
  onRetry: () => void;
}

export function MissionLaunchBoard({
  launches,
  status,
  selectedLaunchId,
  isLoading,
  error,
  onStatusChange,
  onSelectLaunch,
  onRetry,
}: MissionLaunchBoardProps) {
  const [vehicleFilter, setVehicleFilter] = useState<"All" | MissionVehicleFamily>("All");

  const availableFilters = useMemo(() => {
    const present = new Set(launches.map((launch) => deriveVehicleFamily(launch.rocketName)));
    return VEHICLE_FILTERS.filter((option) => option === "All" || present.has(option));
  }, [launches]);

  const shownLaunches = useMemo(() => {
    if (vehicleFilter === "All") {
      return launches;
    }
    return launches.filter((launch) => deriveVehicleFamily(launch.rocketName) === vehicleFilter);
  }, [launches, vehicleFilter]);

  return (
    <section
      data-testid="mission-board"
      aria-label="Mission board"
      className="border border-[var(--c97-rule)] bg-[var(--c97-field)]/92 p-4 sm:p-5"
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-2xs font-semibold uppercase tracking-[0.22em] text-[var(--c97-label)]">
            Launch board
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--c97-ink)]">
            Browse the SpaceX launch manifest.
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--c97-ink-2)]">
            Filter by upcoming or past missions and by vehicle, then open a mission to inspect
            vehicles, payloads, and outbound references in context.
          </p>
        </div>

        <div
          className="inline-flex flex-wrap gap-2 border border-[var(--c97-rule)] bg-[var(--c97-surface)] p-2"
          role="tablist"
          aria-label="Mission board status filters"
        >
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={status === option.key}
              onClick={() => onStatusChange(option.key)}
              className={`tap-target px-4 py-3 text-sm font-semibold transition ${
                status === option.key
                  ? "bg-[var(--c97-accent)] text-white"
                  : "text-[var(--c97-ink-2)] hover:bg-[var(--c97-field)] hover:text-[var(--c97-ink)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {launches.length > 0 && availableFilters.length > 2 ? (
        <div
          className="mb-4 inline-flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by vehicle"
        >
          {availableFilters.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={vehicleFilter === option}
              onClick={() => setVehicleFilter(option)}
              className={`tap-target inline-flex min-h-[44px] items-center border px-3.5 font-mono text-3xs uppercase tracking-[0.06em] transition ${
                vehicleFilter === option
                  ? "border-[var(--c97-ink)] bg-[var(--c97-ink)] text-[var(--c97-surface)]"
                  : "border-[var(--c97-rule)] bg-[color-mix(in_srgb,var(--c97-field)_84%,var(--c97-field))] text-[var(--c97-ink-2)] hover:text-[var(--c97-ink)]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {error && launches.length === 0 && !isLoading ? (
        <div role="alert" className="border border-[color-mix(in_srgb,var(--c97-warning)_30%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-warning)_9%,var(--c97-surface))] p-4">
          <p className="text-sm font-semibold text-[var(--c97-ink)]">
            Mission board unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--c97-ink-2)]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="tap-target mt-4 border border-[var(--c97-rule)] bg-[var(--c97-field)] px-4 py-3 text-sm font-semibold text-[var(--c97-ink)] transition hover:border-[var(--c97-accent)] hover:text-[var(--c97-accent)]"
          >
            Retry board
          </button>
        </div>
      ) : null}

      {isLoading && launches.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-[268px] animate-pulse border border-[var(--c97-rule)] bg-[var(--c97-surface)]"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && launches.length === 0 ? (
        <div className="border border-dashed border-[var(--c97-rule)] bg-[var(--c97-surface)] px-5 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center bg-[color-mix(in_srgb,var(--c97-accent)_10%,var(--c97-field))]">
            <Radar className="h-6 w-6 text-[var(--c97-accent)]" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--c97-ink)]">
            {status === "upcoming"
              ? "No upcoming launches are currently available."
              : "No past launches are currently available."}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--c97-ink-2)]">
            {status === "upcoming"
              ? "The live provider does not currently list a future SpaceX mission. The hero will fall back to the latest completed launch when possible."
              : "The published archive came back empty. Retry the request to check for recovery."}
          </p>
        </div>
      ) : null}

      {shownLaunches.length > 0 ? (
        <p className="mb-3 font-mono text-3xs uppercase tracking-[0.1em] text-[var(--c97-ink-2)]">
          Select a mission for its debrief · {shownLaunches.length} shown
        </p>
      ) : null}

      {launches.length > 0 ? (
        shownLaunches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shownLaunches.map((launch) => (
              <MissionCard
                key={launch.id}
                launch={launch}
                isSelected={selectedLaunchId === launch.id}
                isBusy={isLoading}
                onSelect={onSelectLaunch}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[var(--c97-rule)] bg-[var(--c97-surface)] px-5 py-8 text-center">
            <p className="text-sm leading-6 text-[var(--c97-ink-2)]">
              No {vehicleFilter} missions on the {status} board right now.
            </p>
          </div>
        )
      ) : null}
    </section>
  );
}
