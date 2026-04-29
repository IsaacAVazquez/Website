import { frontierModelsSnapshot } from "@/data/frontierModelsSnapshot";
import type { FrontierModelsSnapshot } from "@/types/frontierModels";

export async function getFrontierModelsSnapshot(): Promise<FrontierModelsSnapshot> {
  return frontierModelsSnapshot;
}
