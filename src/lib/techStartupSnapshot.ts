import { techStartupSnapshot } from "@/data/techStartupSnapshot";
import type { TechStartupSnapshot } from "@/types/techStartup";

export async function getTechStartupSnapshot(): Promise<TechStartupSnapshot> {
  return techStartupSnapshot;
}
