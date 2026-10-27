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

  // A vehicle this list does not fly reads as All. The pick outlives the
  // Upcoming and Past switch, and the filter row is hidden when a list has one
  // family, so the old pick would empty the board with nothing left to clear it.
  const appliedFilter = availableFilters.includes(vehicleFilter) ? vehicleFilter : "All";

  const shownLaunches = useMemo(() => {
    if (appliedFilter === "All") {
      return launches;
    }
    return launches.filter((launch) => deriveVehicleFamily(launch.rocketName) === appliedFilter);
  }, [launches, appliedFilter]);

  return (
    <section data-testid="mission-board" aria-label="Mission board" className="sx-board">
      <div className="sx-board-tools">
        <div className="sx-switch" role="group" aria-label="Mission board status filters">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={status === option.key}
              onClick={() => onStatusChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {launches.length > 0 && availableFilters.length > 2 ? (
          <div className="sx-filters" role="group" aria-label="Filter by vehicle">
            {availableFilters.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={appliedFilter === option}
                onClick={() => setVehicleFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}

        {shownLaunches.length > 0 ? (
          <p className="sx-board-count">
            Select a mission for its debrief · {shownLaunches.length} shown
          </p>
        ) : null}
      </div>

      {error && launches.length === 0 && !isLoading ? (
        <div role="alert" className="sx-empty">
          <p className="sx-strong">Mission board unavailable</p>
          <p>{error}</p>
          <button type="button" onClick={onRetry} className="sx-button-ghost">
            Retry board
          </button>
        </div>
      ) : null}

      {isLoading && launches.length === 0 ? (
        <div className="sx-cards">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="c97-skeleton" style={{ height: 268 }} />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && launches.length === 0 ? (
        <div className="sx-empty">
          <Radar className="h-6 w-6" aria-hidden="true" />
          <p className="sx-strong">
            {status === "upcoming"
              ? "No upcoming launches are currently available."
              : "No past launches are currently available."}
          </p>
          <p>
            {status === "upcoming"
              ? "The latest Launch Library 2 snapshot lists no future SpaceX mission, so the masthead falls back to the latest completed launch when it can."
              : "The published archive came back empty."}
          </p>
        </div>
      ) : null}

      {launches.length > 0 ? (
        <div className="sx-cards">
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
      ) : null}
    </section>
  );
}
