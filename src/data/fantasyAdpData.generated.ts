/**
 * Generated fantasy ADP data.
 * Do not edit manually. Regenerate with `npm run update:fantasy`.
 *
 * This seed ships empty so builds work before the first successful ADP fetch;
 * the published snapshots simply omit ADP until the update script fills it.
 */

import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import type { ScoringFormat } from "@/types";

export const fantasyAdpDataGeneratedAt = "";

export const fantasyAdpData: Record<
  ScoringFormat,
  {
    entries: FantasyAdpEntry[];
    asOf: string | null;
    sampleSize: number | null;
    sourceUrl: string;
  }
> = {
  "PPR": {
    "entries": [],
    "asOf": null,
    "sampleSize": null,
    "sourceUrl": ""
  },
  "HALF_PPR": {
    "entries": [],
    "asOf": null,
    "sampleSize": null,
    "sourceUrl": ""
  },
  "STANDARD": {
    "entries": [],
    "asOf": null,
    "sampleSize": null,
    "sourceUrl": ""
  }
};
