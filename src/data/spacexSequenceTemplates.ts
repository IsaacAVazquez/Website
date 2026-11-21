/**
 * Static, per-vehicle-family "T-0 sequence" templates for the mission drawer.
 *
 * Launch Library publishes a `timeline` on launch detail rows, which the
 * builder normalizes into `MissionLaunchDetail.timeline`. These templates are
 * the fallback for a detail that carries none (a card-derived detail, or a
 * mission Launch Library has no timeline for): a typical flight profile per
 * vehicle family, which the drawer says next to the sequence.
 *
 * The Falcon 9 times were read from Launch Library's timelines for Starlink
 * Group 15-18 and USSF-627, and the Falcon Heavy times from NROL-97 and the
 * Nancy Grace Roman Space Telescope launch, on 2026-11-16. Payload deploy
 * ranged from 31 to 62 minutes across them, so it carries no time. The
 * Starship and Other templates were not checked against a source.
 */

export interface MissionSequenceStep {
  label: string;
  event: string;
}

export type MissionSequenceFamily = "Falcon 9" | "Falcon Heavy" | "Starship" | "Other";

export const MISSION_SEQUENCE_TEMPLATES: Record<MissionSequenceFamily, MissionSequenceStep[]> = {
  "Falcon 9": [
    { label: "T-0:00", event: "Liftoff" },
    { label: "T+1:08", event: "Max-Q" },
    { label: "T+2:26", event: "MECO" },
    { label: "T+2:29", event: "Stage separation" },
    { label: "T+2:58", event: "Fairing separation" },
    { label: "T+8:20", event: "Booster landing (if attempted)" },
    { label: "T+8:39", event: "Second-stage cutoff" },
    { label: "Varies", event: "Payload deploy" },
  ],
  "Falcon Heavy": [
    { label: "T-0:00", event: "Liftoff" },
    { label: "T+1:09", event: "Max-Q" },
    { label: "T+2:27", event: "Side booster separation" },
    { label: "T+3:51", event: "Center core cutoff" },
    { label: "T+3:54", event: "Stage separation" },
    { label: "T+4:17", event: "Fairing separation" },
    { label: "T+7:47", event: "Side booster landings" },
    { label: "T+8:28", event: "Second-stage cutoff" },
    { label: "Varies", event: "Payload deploy" },
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
