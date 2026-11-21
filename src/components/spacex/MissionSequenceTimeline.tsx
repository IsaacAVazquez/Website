import { MISSION_SEQUENCE_TEMPLATES } from "@/data/spacexSequenceTemplates";
import { deriveVehicleFamily } from "@/lib/spacexVehicleFamily";
import type { MissionTimelineEvent } from "@/types/spacex";

interface MissionSequenceTimelineProps {
  rocketName: string | null;
  /** Launch Library's sequence for this mission, when the detail carries one. */
  timeline?: MissionTimelineEvent[];
  /** True for a mission that hasn't flown yet — used only to pick the "next" node. */
  upcoming: boolean;
}

/**
 * The T-0 sequence: a vertical timeline of flight-profile phases. It prints
 * Launch Library's own sequence when the detail carries one, and otherwise
 * the typical sequence for the vehicle family, labeled as an estimate.
 */
export function MissionSequenceTimeline({
  rocketName,
  timeline,
  upcoming,
}: MissionSequenceTimelineProps) {
  const family = deriveVehicleFamily(rocketName);
  const published = Boolean(timeline?.length);
  const steps = published ? (timeline ?? []) : MISSION_SEQUENCE_TEMPLATES[family];

  return (
    <div>
      <p className="text-xs leading-6 text-[var(--c97-ink-2)]" style={{ marginBottom: "var(--c97-sp-2)" }}>
        {published
          ? "This is the sequence Launch Library lists for this mission, with each time counted from liftoff."
          : `This is a typical ${family} flight profile. I don't have Launch Library's timeline for this mission, so these times are estimates for the vehicle and the actual ones will differ.`}
      </p>
      {/* The rail sits in a wrapper beside the list, since a <ul> may only
          hold <li> children. */}
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-[5px] top-1.5 w-px bg-[var(--c97-rule)]"
        />
      <ul className="relative list-none" style={{ margin: "0", padding: "0" }}>
        {steps.map((step, index) => {
          const state = upcoming ? (index === 0 ? "next" : "pending") : "reference";
          return (
            <li
              key={`${index}-${step.label}`}
              className="relative grid grid-cols-[68px_1fr] items-baseline pb-[var(--c97-sp-2)] pl-[var(--c97-sp-2)] last:pb-0" style={{ gap: "var(--c97-sp-2)" }}
            >
              <span
                aria-hidden="true"
                className="absolute left-0.5 top-1.5 h-1.5 w-1.5 border border-[var(--c97-surface)]"
                style={{
                  background:
                    state === "next"
                      ? "var(--c97-accent)"
                      : state === "reference"
                        ? "var(--c97-ink-2)"
                        : "var(--c97-rule)",
                }}
              />
              <span
                className="font-mono text-xs tabular-nums"
                style={{ color: state === "next" ? "var(--c97-accent)" : "var(--c97-ink-2)" }}
              >
                {step.label}
              </span>
              <span
                className={`text-sm font-semibold ${
                  state === "pending" ? "text-[var(--c97-ink-2)]" : "text-[var(--c97-ink)]"
                }`}
              >
                {step.event}
              </span>
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
