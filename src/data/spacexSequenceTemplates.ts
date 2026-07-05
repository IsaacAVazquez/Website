/**
 * Static, per-vehicle-family "T-0 sequence" templates for the mission drawer.
 *
 * Launch Library 2 (this snapshot's upstream) has no phase-by-phase mission
 * timeline field — no Max-Q/MECO/stage-sep/landing timestamps anywhere in the
 * raw payload the builder normalizes. These templates are a typical flight
 * profile per vehicle family, not this specific mission's telemetry, and the
 * drawer discloses that plainly next to the timeline (matching this repo's
 * established unverified-data disclosure pattern, e.g. the retirement
 * planner's capital-market assumptions and the tech-startup tracker).
 */

export interface MissionSequenceStep {
  label: string;
  event: string;
}

export type MissionSequenceFamily = "Falcon 9" | "Falcon Heavy" | "Starship" | "Other";

export const MISSION_SEQUENCE_TEMPLATES: Record<MissionSequenceFamily, MissionSequenceStep[]> = {
  "Falcon 9": [
    { label: "T-0:00", event: "Liftoff" },
    { label: "T+1:12", event: "Max-Q" },
    { label: "T+2:30", event: "MECO" },
    { label: "T+2:35", event: "Stage separation" },
    { label: "T+7:30", event: "Booster landing (if attempted)" },
    { label: "T+9:00", event: "Fairing deploy" },
    { label: "T+45:00", event: "Second-stage cutoff / payload deploy" },
  ],
  "Falcon Heavy": [
    { label: "T-0:00", event: "Liftoff" },
    { label: "T+1:14", event: "Max-Q" },
    { label: "T+2:28", event: "Side booster separation" },
    { label: "T+3:49", event: "Side booster landings" },
    { label: "T+8:41", event: "Center core cutoff" },
    { label: "T+9:00", event: "Center core landing or expend" },
    { label: "T+31:00", event: "Payload deploy" },
  ],
  Starship: [
    { label: "T-0:00", event: "Liftoff" },
    { label: "T+2:44", event: "Hot-stage separation" },
    { label: "T+7:00", event: "Booster boostback / catch attempt" },
    { label: "T+8:30", event: "Second-stage engine cutoff" },
    { label: "T+48:00", event: "Reentry" },
    { label: "T+65:00", event: "Landing or splashdown attempt" },
  ],
  Other: [
    { label: "T-0:00", event: "Liftoff" },
    { label: "T+2:30", event: "Main engine cutoff / stage separation" },
    { label: "T+15:00", event: "Payload deploy" },
  ],
};
