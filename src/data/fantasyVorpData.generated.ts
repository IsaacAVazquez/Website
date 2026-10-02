import type {
  FantasyProsVorpPlayer,
  FantasyVorpTeamSize,
} from "@/lib/fantasyProsVorpSource";
import type { ScoringFormat } from "@/types";
import raw from "./fantasyVorpData.generated.json";

export const fantasyVorpDataGeneratedAt: string = raw.generatedAt;

export interface FantasyVorpDataset {
  season: number;
  sourceUrl: string;
  accessedAt: string;
  players: FantasyProsVorpPlayer[];
}

export const fantasyVorpData = raw.data as Record<
  ScoringFormat,
  Record<FantasyVorpTeamSize, FantasyVorpDataset>
>;
