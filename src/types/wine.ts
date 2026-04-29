export type WineType =
  | "red"
  | "white"
  | "rose"
  | "sparkling"
  | "dessert"
  | "fortified"
  | "orange";

export interface WineEntry {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  region: string;
  varietal: string;
  type: WineType;
  price: number | null;
  rating: number;
  notes: string;
  tastedOn: string;
  createdAt: string;
}

export interface WineTypeBreakdown {
  type: WineType;
  count: number;
  averageRating: number;
}

export interface WineSummary {
  totalWines: number;
  averageRating: number;
  totalSpend: number;
  topRated: WineEntry[];
  recent: WineEntry[];
  typeBreakdown: WineTypeBreakdown[];
  topRegion: string | null;
  topVarietal: string | null;
}
