/**
 * Deterministic, original mission-patch geometry and small status/vehicle
 * derivations shared by the mission card grid and the mission drawer.
 *
 * No raster art, no third-party patch photography, no Math.random — a given
 * mission id always derives the same patch spec, so the emblem is stable
 * across renders and reloads without persisting anything.
 */

export type MissionPatchGlyph = "capsule" | "tri" | "ring" | "constellation" | "dot";

export interface MissionPatchSpec {
  glyph: MissionPatchGlyph;
  rings: number;
  tilt: number;
}

const GLYPHS: MissionPatchGlyph[] = ["capsule", "tri", "ring", "constellation", "dot"];

/** Small FNV-1a-style string hash. Deterministic, no external dependency. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Derives a deterministic, original patch spec (glyph/rings/tilt) from a seed. */
export function derivePatchSpec(seed: string): MissionPatchSpec {
  const hash = hashSeed(seed);
  return {
    glyph: GLYPHS[hash % GLYPHS.length],
    rings: 1 + ((hash >> 8) % 3),
    tilt: ((hash >> 16) % 61) - 30,
  };
}

export type { MissionVehicleFamily } from "@/lib/spacexVehicleFamily";
export { deriveVehicleFamily, VEHICLE_SHORT_CODE } from "@/lib/spacexVehicleFamily";

export type MissionCardStatus = "success" | "failed" | "upcoming" | "pending";

export function deriveMissionCardStatus(launch: {
  upcoming: boolean;
  success: boolean | null;
}): MissionCardStatus {
  if (launch.upcoming) return "upcoming";
  if (launch.success === true) return "success";
  if (launch.success === false) return "failed";
  return "pending";
}

export const MISSION_STATUS_LABEL: Record<MissionCardStatus, string> = {
  success: "Successful",
  failed: "Failed",
  upcoming: "Upcoming",
  pending: "Status pending",
};

export const MISSION_STATUS_ACCENT_VAR: Record<MissionCardStatus, string> = {
  success: "var(--home-positive)",
  failed: "var(--home-negative)",
  upcoming: "var(--home-signal)",
  pending: "var(--home-warning)",
};
