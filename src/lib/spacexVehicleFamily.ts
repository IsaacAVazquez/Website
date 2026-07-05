/**
 * Vehicle-family derivation shared by the snapshot builder (to diversify
 * which launches get detail-hydrated) and the client UI (card filter chips,
 * launch-tape short codes, T-0 sequence template selection). Lives in `lib`
 * rather than `components/spacex` so the builder script can use it without a
 * components → lib layering inversion.
 */
export type MissionVehicleFamily = "Falcon 9" | "Falcon Heavy" | "Starship" | "Other";

export function deriveVehicleFamily(rocketName: string | null | undefined): MissionVehicleFamily {
  const name = rocketName ?? "";
  if (/falcon heavy/i.test(name)) return "Falcon Heavy";
  if (/starship/i.test(name)) return "Starship";
  if (/falcon 9/i.test(name)) return "Falcon 9";
  return "Other";
}

export const VEHICLE_SHORT_CODE: Record<MissionVehicleFamily, string> = {
  "Falcon 9": "F9",
  "Falcon Heavy": "FH",
  Starship: "SS",
  Other: "—",
};
