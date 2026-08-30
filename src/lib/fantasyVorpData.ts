import {
  fantasyVorpData,
  type FantasyVorpDataset,
} from "@/data/fantasyVorpData.generated";
import type { FantasyVorpTeamSize } from "@/lib/fantasyProsVorpSource";
import type { ScoringFormat } from "@/types";

export function getFantasyVorpDataset(
  scoringFormat: ScoringFormat,
  teamSize: FantasyVorpTeamSize
): FantasyVorpDataset {
  return fantasyVorpData[scoringFormat][teamSize];
}
