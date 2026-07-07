export type TripKind = "domestic" | "international";

/**
 * Destination buckets coarse enough to hang a rough fare band and a booking
 * window off of, without pretending to price individual city pairs. Ordered
 * roughly by distance from a US hub.
 */
export type RegionId =
  | "domestic-short"
  | "domestic-transcon"
  | "canada-mexico"
  | "caribbean-central-america"
  | "south-america"
  | "western-europe"
  | "eastern-europe-mideast"
  | "africa"
  | "south-southeast-asia"
  | "east-asia"
  | "oceania";

export interface DestinationRegion {
  id: RegionId;
  label: string;
  kind: TripKind;
  /** Typical round-trip economy fare band in USD per traveler, from a major US hub. */
  typicalFareLow: number;
  typicalFare: number;
  typicalFareHigh: number;
  /** Days before departure that fares stabilize enough to be worth tracking. */
  bookWindowOpenDays: number;
  /** Near edge of the historically cheaper booking window, in days before departure. */
  sweetSpotMinDays: number;
  /** Far edge of the historically cheaper booking window, in days before departure. */
  sweetSpotMaxDays: number;
  /** One-line editorial note on the region's deal dynamics. */
  note: string;
}

export type TacticCategory = "flights" | "hotels" | "points" | "timing" | "ground";

export interface DealTactic {
  id: string;
  category: TacticCategory;
  title: string;
  /** Prose guidance in first person. */
  body: string;
  impact: "high" | "medium" | "low";
}

export interface RecommendedTool {
  id: string;
  name: string;
  url: string;
  category: TacticCategory | "planning";
  /** Short label for what the tool is best at. */
  bestFor: string;
  /** One-line editorial take. */
  note: string;
  free: boolean;
}
