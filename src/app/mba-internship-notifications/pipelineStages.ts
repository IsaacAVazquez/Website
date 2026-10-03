// ---------------------------------------------------------------------------
// Pipeline stages, the four-column read of MBAApplicationInsights that backs
// the job search signature. Each stage is a step in the funnel (applied,
// responded, interview, offer) with the count that reached it and the
// conversion rate from the stage immediately before it.
// ---------------------------------------------------------------------------

import type { MBAApplicationInsights } from "@/lib/mba-application-insights";

export type PipelineStageKey = "applied" | "responded" | "interview" | "offer";

export interface PipelineStage {
  key: PipelineStageKey;
  label: string;
  count: number;
  // The share of the previous stage's count that reached this one. Null when
  // the previous stage is empty (there is nothing to take a rate of) or, for
  // the first stage, because there is no stage before it.
  rateFromPrevious: number | null;
  rateLabel: string;
}

function rate(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

export function pipelineStages(insights: MBAApplicationInsights): PipelineStage[] {
  const { submitted, responded, interviews, offers } = insights;

  return [
    {
      key: "applied",
      label: "Applications",
      count: submitted,
      rateFromPrevious: null,
      rateLabel: "",
    },
    {
      key: "responded",
      label: "Responses",
      count: responded,
      rateFromPrevious: rate(responded, submitted),
      rateLabel: "Response rate",
    },
    {
      key: "interview",
      label: "Interviews",
      count: interviews,
      rateFromPrevious: rate(interviews, responded),
      rateLabel: "Of responses",
    },
    {
      key: "offer",
      label: "Offers",
      count: offers,
      rateFromPrevious: rate(offers, interviews),
      rateLabel: "Of interviews",
    },
  ];
}
